"""Bounded live-provider checks through VERA's real research backend.

Uses an isolated store and narrowly selected credentials; never prints key values.
The packaged backend is extracted only after matching its manifest SHA-256.
"""
import argparse
import csv
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import sqlite3
import struct
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parent.parent
NAMES = ('SCOPUS_API_KEY', 'SCOPUS_INST_TOKEN', 'OPENALEX_API_KEY', 'NCBI_API_KEY', 'NCBI_EMAIL')


def credentials():
    values, origins = {}, {}
    for name in NAMES:
        if os.environ.get(name, '').strip():
            values[name], origins[name] = os.environ[name], 'process environment'
    if os.name == 'nt':
        import winreg
        for hive, path, label in ((winreg.HKEY_CURRENT_USER, 'Environment', 'user environment'),
                                  (winreg.HKEY_LOCAL_MACHINE, r'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'machine environment')):
            try:
                with winreg.OpenKey(hive, path) as key:
                    for name in NAMES:
                        if name in values:
                            continue
                        try:
                            value = winreg.QueryValueEx(key, name)[0]
                            if isinstance(value, str) and value.strip():
                                values[name], origins[name] = value, label
                        except FileNotFoundError:
                            pass
            except FileNotFoundError:
                pass
    saved = Path.home() / '.openresearch' / 'env'
    if saved.is_file():
        for line in saved.read_text(encoding='utf-8-sig').splitlines():
            match = re.fullmatch(r"export ([A-Z_]+)='(.*)'", line)
            if match and match[1] in NAMES and match[1] not in values:
                value = match[2].replace("'\\''", "'").replace('\\\\', '\\')
                if value.strip():
                    values[match[1]], origins[match[1]] = value, 'VERA saved environment'
    return values, origins


def extract_verified_runtime(destination):
    manifest = json.loads((ROOT / 'dist/package-manifest.json').read_text(encoding='utf-8-sig'))
    package = (ROOT / 'dist/VERA.exe').read_bytes()
    fingerprints = {}
    for name in ('orx.exe', 'WebView2Loader.dll'):
        entry = next(item for item in manifest['files'] if item['path'] == name)
        size, expected = entry['bytes'], entry['sha256'].lower()
        offset = -1
        while True:
            offset = package.find(b'MZ', offset + 1, len(package) - size + 2)
            if offset < 0:
                raise RuntimeError('Manifest-matching embedded file unavailable: ' + name)
            if offset + 64 > len(package):
                continue
            pe = struct.unpack_from('<I', package, offset + 60)[0]
            if not 64 <= pe <= 4096 or package[offset + pe:offset + pe + 4] != b'PE\0\0':
                continue
            blob = package[offset:offset + size]
            if hashlib.sha256(blob).hexdigest() == expected:
                (destination / name).write_bytes(blob)
                fingerprints[name] = expected
                break
    return fingerprints


def validate_saved_results(report, profile):
    """Review the exact persisted provider pages, including cross-page overlap."""
    database = profile / 'data' / 'orx.db'
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as connection:
        projects = [json.loads(row[0]) for row in connection.execute('SELECT document FROM rw_projects')]
    for item in report['tests']:
        project = next(p for p in projects if p['name'] == 'LIVE SEARCH TEST - ' + item['provider'])
        run = next((r for r in project['runs'] if r['query'] == item['query']), None)
        if not run or not item.get('pages'):
            continue
        pages = run['rawPages'][:item['pages']]

        def ids(raw):
            if item['provider'] == 'pubmed':
                return raw.get('search', {}).get('esearchresult', {}).get('idlist', [])
            if item['provider'] in ('openalex', 'biorxiv'):
                return [r['id'] for r in raw.get('results', [])]
            if item['provider'] == 'scopus':
                return [r.get('eid') or r.get('dc:identifier') for r in raw.get('search-results', {}).get('entry', []) if not r.get('error')]
            if item['provider'] == 'crossref':
                return [r['DOI'] for r in raw.get('message', {}).get('items', [])]
            return []

        current_ids = ids(pages[-1]['response'])
        previous_ids = {identifier for page in pages[:-1] for identifier in ids(page['response'])}
        overlap = sorted(set(current_ids) & previous_ids)
        item.update(providerPageRecords=len(current_ids), overlapWithEarlierPages=overlap)
        if item['case'] == 'pagination':
            item['pass'] = bool(item['pass'] and len(pages) >= 2 and not overlap and
                                item['newRecords'] == len(set(current_ids)))
    report['summary'] = dict(total=len(report['tests']), passed=sum(t.get('pass', False) for t in report['tests']),
                             strictPaginationReviewApplied=True)
    report['diagnostics'] = []
    checks = [('pubmed_empty_control', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
               dict(db='pubmed', term='verasearchnonexistentqzxj20261019[Title/Abstract]', retmode='json', retmax=25, tool='vera'))]
    for provider in ('openalex', 'biorxiv'):
        project = next(p for p in projects if p['name'] == 'LIVE SEARCH TEST - ' + provider)
        run = next(r for r in project['runs'] if r['query'] == '"machine learning"')
        params = dict(search=run['query'], per_page=25, cursor=run['checkpoint'])
        if provider == 'biorxiv':
            params['filter'] = 'primary_location.source.id:S4306402567'
        checks.append((provider + '_cursor_control_without_key', 'https://api.openalex.org/works', params))
    for name, endpoint, params in checks:
        try:
            response = urllib.request.urlopen(endpoint + '?' + urllib.parse.urlencode(params), timeout=40)
            status, body = response.status, json.load(response)
        except urllib.error.HTTPError as error:
            status = error.code
            try:
                body = json.load(error)
            except ValueError:
                body = dict(error='Non-JSON provider error')
        except Exception as error:
            report['diagnostics'].append(dict(name=name, error=str(error)))
            continue
        if name == 'pubmed_empty_control':
            data = body.get('esearchresult', {})
            evidence = {key: data.get(key) for key in ('count', 'idlist', 'errorlist', 'warninglist', 'querytranslation')}
        else:
            evidence = {key: body.get(key) for key in ('error', 'code', 'message')}
        report['diagnostics'].append(dict(name=name, httpStatus=status, evidence=evidence))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='docs/audits/academic-search-2026-10-19')
    parser.add_argument('--keep-profile', action='store_true', help='Keep temporary isolated runtime profile under target/')
    args = parser.parse_args()
    output = (ROOT / args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime('%Y%m%d-%H%M%S')
    profile = ROOT / 'target' / ('academic-search-live-' + stamp)
    runtime = profile / 'runtime'
    runtime.mkdir(parents=True)
    values, origins = credentials()
    secrets = [value for name, value in values.items() if name != 'NCBI_EMAIL']

    def clean(text):
        for secret in secrets:
            text = text.replace(secret, '[redacted]')
        return text

    fingerprints = extract_verified_runtime(runtime)
    report = dict(startedAt=dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).isoformat(),
                  sourceCommit=subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip(),
                  binarySource='manifest-verified backend embedded in dist/VERA.exe', fingerprints=fingerprints,
                  credentials={name: dict(configured=name in values, source=origins.get(name)) for name in NAMES},
                  capabilities=[], tests=[], diagnostics=[], limits=[
                      'Live metadata search only; no full-text retrieval or screening.',
                      'At most two pages of 25 records per baseline query.',
                      'Provider-reported totals are not counts of content-assessed articles.',
                      'Crossref query is ranked free text, not a Boolean filtering guarantee.',
                      'bioRxiv uses the OpenAlex source filter; alphaXiv is a bounded discovery snapshot.'])
    records_out = []

    def save():
        serialized = clean(json.dumps(report, ensure_ascii=False, indent=2))
        (output / 'results.json').write_text(serialized + '\n', encoding='utf-8')
        with (output / 'records.csv').open('w', encoding='utf-8-sig', newline='') as handle:
            writer = csv.DictWriter(handle, fieldnames=['provider', 'case', 'page', 'rawId', 'title', 'year', 'doi', 'url', 'hasAbstract'])
            writer.writeheader()
            writer.writerows(records_out)

    env = dict(os.environ)
    for name in list(env):
        if re.search(r'API_KEY|TOKEN|PASSWORD|SECRET|^(ORX_|VERA_|XDG_|AWS_|AZURE_|GOOGLE_|ANTHROPIC_|OPENAI_|OPENROUTER_|OPENCODE_)', name, re.I):
            env.pop(name)
    env.update(values)
    for name, relative in dict(LOCALAPPDATA='local', APPDATA='roaming', USERPROFILE='user', HOME='user',
                               VERA_APP_HOME='vera', ORX_DATA_DIR='data', ORX_CACHE_DIR='cache',
                               XDG_DATA_HOME='xdg-data', XDG_CONFIG_HOME='xdg-config', XDG_CACHE_HOME='xdg-cache').items():
        path = profile / relative
        path.mkdir(exist_ok=True)
        env[name] = str(path)
    env['PATH'] = str(runtime) + os.pathsep + os.environ.get('PATH', '')
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    env['ORX_UI_DEV_ORIGIN'] = base
    owner = uuid.uuid4().hex + uuid.uuid4().hex
    process = None

    def call(path, data=None):
        request = urllib.request.Request(base + path, data=None if data is None else json.dumps(data).encode(),
                                         headers={'Authorization': 'Bearer ' + owner, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=100) as response:
            return json.load(response)

    def execute(workspace, provider, case, query, run_id=None, previous_ids=None):
        previous_ids = previous_ids or set()
        run_id = run_id or str(uuid.uuid4())
        data = dict(runId=run_id) if case == 'pagination' else dict(runId=run_id, provider=provider, query=query, purpose='exploratory')
        began = time.monotonic()
        item = dict(provider=provider, case=case, query=query)
        try:
            workspace = call('/api/research/projects/' + workspace['project']['id'], dict(
                action='resume_search' if case == 'pagination' else 'search', data=data,
                expectedRevision=workspace['project']['revision'], operationId=str(uuid.uuid4())))
            run = next(r for r in workspace['project']['runs'] if r['id'] == run_id)
            records = [r for r in workspace['project']['records'] if r['runId'] == run_id]
            new = [r for r in records if r['rawId'] not in previous_ids]
            item.update(status=run['status'], retrieved=run['retrievedCount'], reportedTotal=run['reportedTotal'],
                        newRecords=len(new), hasCheckpoint=bool(run['checkpoint']), warnings=run['warnings'],
                        pages=len(run['rawPages']), emptyTitles=sum(not r['title'].strip() for r in records),
                        withDoi=sum(bool(r['doi']) for r in records), withAbstract=sum(bool(r.get('abstract')) for r in records),
                        uniqueProviderIds=len({r['rawId'] for r in records}))
            if run['rawPages']:
                raw = run['rawPages'][-1]['response']
                if provider == 'pubmed':
                    details = raw.get('search', {}).get('esearchresult', {})
                    item.update(queryTranslation=details.get('querytranslation'), providerWarnings=details.get('warninglist'))
            for record in new:
                records_out.append(dict(provider=provider, case=case, page=item['pages'], rawId=record['rawId'],
                                        title=clean(record['title']), year=record['year'], doi=record['doi'],
                                        url=clean(record.get('url') or ''), hasAbstract=bool(record.get('abstract'))))
            item['pass'] = (run['status'] != 'failed' and item['emptyTitles'] == 0 and
                            item['uniqueProviderIds'] == len(records) and
                            (len(new) > 0 if case != 'empty_result' else len(records) == 0 and run['reportedTotal'] == 0))
            if case == 'pagination':
                item['pass'] = item['pass'] and len(records) > len(previous_ids)
        except Exception as error:
            item.update(status='request_failed', error=clean(str(error)), **{'pass': False})
        item['seconds'] = round(time.monotonic() - began, 3)
        report['tests'].append(item)
        save()
        print(json.dumps({key: item.get(key) for key in ('provider', 'case', 'status', 'retrieved', 'reportedTotal', 'newRecords', 'pass', 'warnings', 'error') if key in item}), flush=True)
        return workspace, run_id

    topics = {
        'openalex': '(ChatGPT OR "generative artificial intelligence") AND (students OR university) AND (research OR "literature review")',
        'pubmed': '("ChatGPT"[Title/Abstract] OR "generative artificial intelligence"[Title/Abstract]) AND (student*[Title/Abstract] OR universit*[Title/Abstract]) AND (research[Title/Abstract] OR "literature review"[Title/Abstract])',
        'scopus': 'TITLE-ABS-KEY((chatgpt OR "generative artificial intelligence") AND (student* OR universit*) AND (research OR "literature review"))',
        'crossref': 'ChatGPT generative artificial intelligence students university research literature review',
        'biorxiv': '"machine learning" AND genomics',
        'alphaxiv': 'large language models education',
    }
    log = (profile / 'backend.log').open('w', encoding='utf-8')
    try:
        process = subprocess.Popen([str(runtime / 'orx.exe'), 'up', '--port', str(port), '--no-browser', '--no-telemetry'],
                                   cwd=profile, env=env, stdout=log, stderr=log,
                                   creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        for _ in range(100):
            if process.poll() is not None:
                raise RuntimeError('Isolated backend exited: ' + str(process.returncode))
            try:
                call('/api/health')
                break
            except Exception:
                time.sleep(.25)
        else:
            raise RuntimeError('Isolated backend did not become ready')
        print('Backend ready; manifest hashes verified. Credential names present: ' + ', '.join(values), flush=True)
        for provider in ('scopus', 'pubmed', 'openalex', 'crossref', 'biorxiv', 'alphaxiv'):
            workspace = call('/api/research/projects', dict(name='LIVE SEARCH TEST - ' + provider, entry='interest', operationId=str(uuid.uuid4())))
            if not report['capabilities']:
                report['capabilities'] = workspace['capabilities']
            baseline = 'TITLE-ABS-KEY("machine learning")' if provider == 'scopus' else '"machine learning"[Title/Abstract]' if provider == 'pubmed' else '"machine learning"'
            workspace, run_id = execute(workspace, provider, 'baseline', baseline)
            run = next((r for r in workspace['project']['runs'] if r['id'] == run_id), None)
            if run and run['status'] != 'failed' and run['checkpoint'] and provider in ('scopus', 'pubmed', 'openalex', 'crossref', 'biorxiv'):
                ids = {r['rawId'] for r in workspace['project']['records'] if r['runId'] == run_id}
                workspace, _ = execute(workspace, provider, 'pagination', baseline, run_id, ids)
            workspace, _ = execute(workspace, provider, 'topic', topics[provider])
            if provider in ('scopus', 'pubmed', 'openalex') and report['tests'][-1]['status'] != 'failed':
                term = 'verasearchnonexistentqzxj20261019'
                empty = f'TITLE-ABS-KEY({term})' if provider == 'scopus' else f'{term}[Title/Abstract]' if provider == 'pubmed' else term
                execute(workspace, provider, 'empty_result', empty)
        report['finishedAt'] = dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).isoformat()
        validate_saved_results(report, profile)
        save()
        print('COMPLETE ' + json.dumps(report['summary']), flush=True)
    finally:
        if process is not None and process.poll() is None:
            if os.name == 'nt':
                subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            else:
                process.terminate()
            process.wait(timeout=20)
        log.close()
        if not args.keep_profile:
            shutil.rmtree(profile, ignore_errors=True)


if __name__ == '__main__':
    main()
