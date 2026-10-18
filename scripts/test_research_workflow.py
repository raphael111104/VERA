"""P1-P4 HTTP acceptance using an isolated store and explicitly fictional fixtures.

Run with --binary <fresh orx.exe>. Never contacts academic providers.
"""
import argparse
import base64
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid
import io
import zipfile
import hashlib
import xml.etree.ElementTree as ET


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--binary', required=True)
    args = parser.parse_args()
    binary = str(Path(args.binary).resolve())
    with tempfile.TemporaryDirectory(prefix='vera-workflow-acceptance-') as temporary:
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        base = f'http://127.0.0.1:{port}'
        env = dict(os.environ, ORX_DATA_DIR=str(Path(temporary)/'data'), ORX_CACHE_DIR=str(Path(temporary)/'cache'), XDG_CONFIG_HOME=str(Path(temporary)/'config'), ORX_UI_DEV_ORIGIN=base)
        env.pop('SCOPUS_API_KEY', None)
        process = None
        log_path=Path(__file__).resolve().parent.parent/'target'/('workflow-http-'+str(uuid.uuid4())+'.log')
        log_path.parent.mkdir(exist_ok=True)
        log = open(log_path, 'w', encoding='utf-8')

        def start():
            nonlocal process
            process = subprocess.Popen([binary, 'up', '--port', str(port), '--no-browser', '--no-telemetry'], env=env, stdout=log, stderr=log, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            for _ in range(150):
                try:
                    urllib.request.urlopen(base+'/api/health', timeout=1).close()
                    return
                except (OSError, urllib.error.URLError):
                    if process.poll() is not None:
                        log.flush()
                        detail=log_path.read_text(encoding='utf-8',errors='replace')[-3000:]
                        raise RuntimeError('Isolated backend exited: '+detail)
                    time.sleep(.2)
            raise TimeoutError('Isolated backend did not become ready')

        def stop():
            if process is not None and process.poll() is None:
                if os.name == 'nt':
                    # Own isolated backend only: stop its background Git children
                    # before removing the fixture directory on Windows.
                    subprocess.run(['taskkill','/PID',str(process.pid),'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=False)
                else:
                    process.terminate()
                process.wait(timeout=15)

        owner = str(uuid.uuid4())+str(uuid.uuid4())
        token_a = str(uuid.uuid4())+str(uuid.uuid4())
        token_b = str(uuid.uuid4())+str(uuid.uuid4())

        def call(path, payload=None, key=owner, status=200):
            request = urllib.request.Request(base+path, data=None if payload is None else json.dumps(payload).encode(), headers={'Authorization': 'Bearer '+key, 'Content-Type': 'application/json'})
            try:
                response = urllib.request.urlopen(request, timeout=65)
                actual = response.status
                content = response.read()
            except urllib.error.HTTPError as error:
                actual, content = error.code, error.read()
            assert actual == status, (path, actual, status, content[:400])
            return json.loads(content) if content[:1] in [b'{', b'['] else content

        workspace = None

        def action(name, data, key=owner, status=200):
            nonlocal workspace
            request = dict(action=name, data=data, expectedRevision=workspace['project']['revision'], operationId=str(uuid.uuid4()))
            result = call('/api/research/projects/'+workspace['project']['id'], request, key, status)
            if status == 200:
                workspace = result
            return request, result

        try:
            start()
            request = dict(name='TEST FIXTURE — P1-P4', entry='interest', operationId=str(uuid.uuid4()))
            workspace = call('/api/research/projects', request)
            project_id = workspace['project']['id']
            assert call('/api/research/projects', request)['project']['id'] == project_id
            # P7 blank projects can export an honestly incomplete draft.
            export_request, _ = action('export', {})
            initial_export=workspace['project']['evidence']['exports'][-1]
            assert initial_export['reviewState']=='incomplete_draft'
            initial_bytes=call('/api/research/projects/'+project_id+'/exports/'+initial_export['exportId'])
            initial_zip=zipfile.ZipFile(io.BytesIO(initial_bytes))
            (Path(__file__).resolve().parent.parent/'target'/'workflow-p7-blank.docx').write_bytes(initial_zip.read('article.docx'))
            ET.fromstring(zipfile.ZipFile(io.BytesIO(initial_zip.read('article.docx'))).read('word/document.xml'))
            initial_audit=json.loads(initial_zip.read('audit.json'))
            assert len(initial_audit['checklist'])==22 and initial_audit['ledger']['includedReports']==0
            assert call('/api/research/projects/'+project_id,export_request)['project']['revision']==workspace['project']['revision']
            assert call('/api/research/projects', key=token_a) == []
            call('/api/research/projects/'+project_id, key=token_a, status=403)
            direction = dict(workspace['project']['direction'], interest='Fixture interest', field='Fixture field', concept='Fixture concept', context='Fixture context', objective='Map fixture evidence', choice='Fixture focus', reason='Test choice', question='What fixture evidence exists?', title='TEST FIXTURE', reviewFit='mapping', seedSources='Manual fixture; not a real publication')
            saved_request, _ = action('direction', direction)
            revision = workspace['project']['revision']
            retry = call('/api/research/projects/'+project_id, saved_request)
            assert retry['project']['revision'] == revision
            conflict_request = dict(saved_request, operationId=str(uuid.uuid4()), expectedRevision=1)
            call('/api/research/projects/'+project_id, conflict_request, status=409)
            stop(); start()
            workspace = call('/api/research/projects/'+project_id)
            assert workspace['project']['direction']['choice'] == 'Fixture focus'
            assert workspace['project']['revision'] == revision
            action('confirm_direction', {})
            protocol = dict(workspace['project']['protocol'])
            for field in ['rationale','objective','question','inclusion','exclusion','sources','query','screening','charting','chartingFields','appraisalReason','synthesis']:
                protocol[field] = 'TEST FIXTURE '+field
            protocol.update(provider='scopus', appraisal='no', registration='not_registered')
            action('protocol', protocol)
            action('lock_protocol', {})
            assert workspace['project']['protocol']['registrationUrl'] == ''
            assert workspace['project']['protocolLocked']
            content = 'Title,DOI,Year,Abstract\nFixture A,10.9999/fixture-a,2025,Testing only\nFixture A duplicate,https://doi.org/10.9999/FIXTURE-A,2025,Testing only\nFixture B,10.9999/fixture-b,2024,Testing only\nbroken,row'
            preview = call('/api/research/projects/'+project_id+'/import-preview', dict(format='csv', text=content, mapping={}, runId=str(uuid.uuid4())))
            assert len(preview['records']) == 3 and len(preview['errors']) == 1
            action('import', dict(format='csv', text=content, mapping={}, runId=str(uuid.uuid4()), purpose='formal', provider='Scopus fixture import', filename='TEST-FIXTURE.csv', acceptErrors=True))
            assert workspace['project']['runs'][-1]['searchedAt'] is None
            assert workspace['ledger']['identified'] == 3
            action('import', dict(format='ris', text='TY  - JOUR\nTI  - Exploratory fixture\nER  -\n', mapping={}, runId=str(uuid.uuid4()), purpose='exploratory', provider='Fixture', acceptErrors=True))
            assert workspace['ledger']['identified'] == 3
            pair = workspace['duplicateCandidates'][0]
            action('merge', pair)
            assert workspace['ledger']['duplicates'] == 1
            merge_id = workspace['project']['merges'][0]['id']
            action('undo_merge', dict(mergeId=merge_id))
            assert workspace['ledger']['duplicates'] == 0
            action('merge', pair)
            action('invite', dict(name='TEST reviewer A', token=token_a, declaredHuman=True))
            action('invite', dict(name='TEST reviewer B', token=token_b, declaredHuman=True))
            action('freeze_selection', dict(acceptLimitations=True))
            record = workspace['statuses'][0]['recordId']
            action('decision', dict(recordId=record, stage='title', verdict='include', reason='TEST A'), token_a)
            b_view = call('/api/research/projects/'+project_id, key=token_b)
            assert b_view['project']['decisions'] == [], 'B must not see A before submitting'
            a_view = call('/api/research/projects/'+project_id, key=token_a)
            assert len(a_view['project']['decisions']) == 1
            action('protocol', protocol, token_b, status=400)
            action('decision', dict(recordId=record, stage='title', verdict='exclude', reason='TEST B'), token_b)
            assert workspace['statuses'][0]['title'] == 'conflict'
            assert len(workspace['project']['decisions']) == 2
            action('resolve', dict(recordId=record, stage='title', verdict='include', reason='TEST adjudication'))
            action('retrieval', dict(recordId=record, status='not_retrieved', reason='TEST retrieval unavailable'))
            assert workspace['ledger']['notRetrieved'] == 1
            assert workspace['ledger']['fullExcluded'] == 0
            action('decision', dict(recordId=record, stage='fulltext', verdict='exclude', reason='Cannot assess missing text'), token_a, status=400)
            # A minimal, valid single-page PDF created only for this acceptance test.
            objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Contents 4 0 R >>',b'<< /Length 0 >>\nstream\n\nendstream']
            pdf=b'%PDF-1.4\n';offsets=[0]
            for index,obj in enumerate(objects,1):
                offsets.append(len(pdf));pdf+=str(index).encode()+b' 0 obj\n'+obj+b'\nendobj\n'
            xref=len(pdf);pdf+=b'xref\n0 5\n0000000000 65535 f \n'+b''.join(f'{offset:010d} 00000 n \n'.encode() for offset in offsets[1:])+b'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n'+str(xref).encode()+b'\n%%EOF\n'
            action('upload_fulltext',dict(recordId=record,filename='TEST-FIXTURE.pdf',base64=base64.b64encode(pdf).decode(),legalAccess=True))
            artifact=workspace['project']['retrievals'][-1]['artifactId']
            assert call('/api/research/projects/'+project_id+'/artifacts/'+artifact,key=token_a).startswith(b'%PDF-')
            call('/api/research/projects/'+project_id+'/artifacts/'+artifact,key=str(uuid.uuid4())*2,status=403)
            action('decision',dict(recordId=record,stage='fulltext',verdict='include',reason='TEST fulltext A'),token_a)
            action('decision',dict(recordId=record,stage='fulltext',verdict='include',reason='TEST fulltext B'),token_b)
            assert workspace['ledger']['assessed']==1 and workspace['ledger']['includedReports']==1
            # P5/P6 fixtures are explicitly fabricated test input, never research findings.
            column=dict(id='context',label='TEST context',kind='category',required=True,allowedValues=['A','B'],missingPolicy=['not_reported','uncertain'],extractionGuidance='TEST inspect fixture location')
            missing_column=dict(column,id='missing',label='TEST missing',kind='number',allowedValues=[],missingPolicy=['not_reported','not_applicable','uncertain'])
            action('chart_schema',dict(columns=[column,missing_column],reason='TEST pilot form'))
            action('chart_schema',dict(columns=[column,column],reason='TEST duplicate id'),status=400)
            locator=dict(artifactId=artifact,page=1,section='TEST fixture',quote='TEST location assertion only; this PDF is blank',documentHash=workspace['artifacts'][0]['checksum'])
            action('chart_cell',dict(recordId=record,columnId='context',value='0',state='not_reported',locator=locator),token_a,status=400)
            action('chart_cell',dict(recordId=record,columnId='context',value='A;B',state='present',locator=dict(locator,documentHash='wrong')),token_a,status=400)
            action('chart_cell',dict(recordId=record,columnId='context',value='A;B',state='present',locator=locator),token_a)
            cell=workspace['project']['evidence']['cells'][-1]['id']
            action('chart_verify',dict(cellId=cell),token_a,status=400)
            action('chart_dispute',dict(cellId=cell,reason='TEST second reviewer requests clarification'),token_b)
            assert workspace['project']['evidence']['cells'][-1]['verificationStatus']=='needs_review'
            action('chart_verify',dict(cellId=cell),token_b,status=400)
            action('chart_cell',dict(recordId=record,columnId='context',value='A;B',state='present',locator=locator),token_a)
            cell=workspace['project']['evidence']['cells'][-1]['id']
            action('chart_verify',dict(cellId=cell),token_b)
            cell=workspace['project']['evidence']['cells'][-1]['id']
            for missing_state in ['uncertain','not_applicable','not_reported']:
                action('chart_cell',dict(recordId=record,columnId='missing',value='',state=missing_state,locator=locator),token_a)
                assert workspace['project']['evidence']['cells'][-1]['value']==''
                assert workspace['project']['evidence']['cells'][-1]['state']==missing_state
            action('chart_verify',dict(cellId=workspace['project']['evidence']['cells'][-1]['id']),token_b)
            assert workspace['evidenceSummary']['confirmedRows']==[record]
            action('synthesis',dict(approveCodebook=True),status=400)
            action('chart_pilot',dict(recordIds=[record],rationale='TEST sample selected by team',status='complete',schemaVersion=1))
            action('synthesis',dict(approveCodebook=True))
            snapshot=workspace['project']['evidence']['syntheses'][-1]
            assert snapshot['tables'][0]['denominator']==1
            assert snapshot['tables'][0]['counts']==dict(A=1,B=1) and snapshot['tables'][0]['overlapping']
            assert cell in snapshot['cellIds'] and len(snapshot['cellIds'])==2
            assert snapshot['tables'][1]['counts']=={} and snapshot['tables'][1]['missing']==dict(not_reported=1)
            action('draft_section',dict(key='results',text='TEST fixture supports two overlapping categories.',status='draft'))
            claim=dict(id='',sectionKey='results',text='TEST fixture supports two overlapping categories.',claimType='statistic',recordIds=[record],cellIds=[cell],sourceLevel='fulltext',locators=[locator],reviewStatus='verified',reviewer=None,dependency='')
            action('claim',dict(claim,cellIds=[],locators=[],sourceLevel='metadata'))
            unsupported=workspace['project']['evidence']['claims'][-1]['id']
            action('claim_verify',dict(claimId=unsupported,supportChecked=True),status=400)
            action('claim_retire',dict(claimId=unsupported,reason='TEST DOI alone does not support a statistic'))
            action('claim',claim)
            claim_id=workspace['project']['evidence']['claims'][-1]['id']
            assert workspace['project']['evidence']['claims'][-1]['reviewStatus']=='needs_review'
            action('claim_verify',dict(claimId=claim_id,supportChecked=True))
            action('draft_section',dict(key='results',text=claim['text'],status='verified'))
            assert workspace['project']['evidence']['claims'][-1]['reviewStatus']=='verified'
            # Navigation/exploration does not change formal evidence dependencies.
            unchanged_dependency=workspace['evidenceSummary']['dependency']
            action('direction',dict(workspace['project']['direction'],step=1))
            assert workspace['evidenceSummary']['dependency']==unchanged_dependency
            assert workspace['project']['evidence']['sections'][0]['status']=='verified'
            action('import',dict(format='ris',text='TY  - JOUR\nTI  - TEST unrelated exploration\nER  -\n',mapping={},runId=str(uuid.uuid4()),purpose='exploratory',provider='TEST exploration',acceptErrors=True))
            assert workspace['evidenceSummary']['dependency']==unchanged_dependency
            assert workspace['project']['evidence']['sections'][0]['status']=='verified'
            action('workspace_file',dict(name='../unsafe.md',text='TEST'),status=400)
            action('workspace_file',dict(name='TEST-notes.md',text='# TEST notes'))
            assert workspace['project']['evidence']['files'][-1]['text']=='# TEST notes'
            # A revised form retains old cells and writing but invalidates evidence.
            action('chart_schema',dict(columns=[dict(column,label='TEST changed meaning')],reason='TEST amendment'))
            assert len(workspace['project']['evidence']['cells'])==8
            assert workspace['evidenceSummary']['confirmedRows']==[] and workspace['evidenceSummary']['synthesisStale']
            assert workspace['project']['evidence']['sections'][0]['text']==claim['text']
            assert workspace['project']['evidence']['sections'][0]['status']=='needs_review'
            action('chart_verify',dict(cellId=cell),token_b,status=400)
            action('claim_verify',dict(claimId=claim_id,supportChecked=True),status=400)
            stop(); start()
            workspace=call('/api/research/projects/'+project_id)
            assert len(workspace['project']['evidence']['schemas'])==2
            call('/api/research/projects/'+project_id+'/sidechat',dict(action='read',harness='codex'),key=token_a,status=400)
            assert call('/api/research/projects/'+project_id+'/sidechat',dict(action='read',harness='codex'))['messages']==[]
            # A later correction invalidates the prior adjudication dependency.
            action('decision',dict(recordId=record,stage='title',verdict='exclude',reason='TEST corrected A'),token_a)
            assert workspace['statuses'][0]['title']=='exclude'
            assert workspace['evidenceSummary']['included']==[], 'Title exclusion must remove downstream included eligibility'
            action('synthesis',dict(approveCodebook=True))
            assert workspace['project']['evidence']['syntheses'][-1]['recordIds']==[]
            assert workspace['project']['evidence']['syntheses'][-1]['tables'][0]['denominator']==0
            action('revoke', dict(actorId=workspace['members'][0]['id']))
            call('/api/research/projects/'+project_id, key=token_a, status=403)
            workspace = call('/api/research/projects/'+project_id)
            protocol = dict(workspace['project']['protocol'], amendmentReason='TEST criterion amendment', inclusion='Changed fixture criteria')
            action('protocol', protocol)
            assert workspace['project']['selectionStale'] and workspace['project']['needsReview']
            assert len(workspace['history']) >= 15
            # P7 ledger reconciliation, immutable package, exclusions and secret scrubbing.
            action('draft_section',dict(key='methods',text='TEST source report. Credential sk-TEST-DO-NOT-EXPORT',status='draft'))
            action('reporting_item',dict(item=5,sectionKey='methods',quote='made up',note='TEST'),status=400)
            action('reporting_item',dict(item=5,sectionKey='methods',quote='TEST source report.',note='TEST coverage attestation'))
            expected_ledger=workspace['ledger']
            action('learning_decision',dict(id='test-decision',activity='selection',judgement='TEST include',reason='TEST criterion',evidence='TEST source locator reference',hypothesis='metadata'))
            action('learning_help',dict(decisionId='missing',level=1),status=400)
            action('learning_help',dict(decisionId='test-decision',level=4),status=400)
            action('learning_help',dict(decisionId='test-decision',level=1))
            action('learning_help',dict(decisionId='test-decision',level=2))
            action('learning_response',dict(decisionId='test-decision',response='TEST reconsidered metadata',finalJudgement='TEST request fulltext',hypothesisCorrection='TEST correction'))
            action('transfer_start',dict(id='test-transfer',topic='TEST new topic',evidence='TEST new legal vignette, fictional',scheduledAt='2026-10-14',model='no-model-independent-transfer',study=True),status=400)
            action('transfer_start',dict(id='test-transfer',topic='TEST new topic',evidence='TEST new legal vignette, fictional',scheduledAt='2026-10-14',model='no-model-independent-transfer',study=False))
            action('learning_help',dict(decisionId='test-decision',level=3),status=400)
            call('/api/research/projects/'+project_id+'/sidechat',dict(action='send',harness='codex',text='TEST help blocked'),status=400)
            action('transfer_submit',dict(id='test-transfer',answer='TEST independent answer',reason='TEST bounded evidence'))
            action('transfer_review',dict(id='test-transfer',ratings=['supported','developing','supported','needs_review'],note='TEST human rubric'))
            call('/api/research/projects/'+project_id+'/learning-trace',status=400)
            action('learning_consent',dict(granted=True,researchUse=False,purpose='TEST local export only'))
            trace=call('/api/research/projects/'+project_id+'/learning-trace')
            assert any(e['type']=='transfer_review' for e in trace['events'])
            action('export', {})
            manifest=workspace['project']['evidence']['exports'][-1]
            bundle=call('/api/research/projects/'+project_id+'/exports/'+manifest['exportId'])
            package=zipfile.ZipFile(io.BytesIO(bundle))
            assert json.loads(package.read('selection-flow.json'))==expected_ledger
            assert all(not n.lower().endswith('.pdf') or n=='article.pdf' for n in package.namelist())
            text_payload=''.join(package.read(n).decode('utf-8') for n in package.namelist() if n.endswith(('.md','.json','.csv','.svg')))
            assert 'sk-TEST-DO-NOT-EXPORT' not in text_payload
            assert 'TEST independent answer' not in text_payload and 'TEST-notes.md' not in text_payload
            for f in manifest['files']:
                assert hashlib.sha256(package.read(f['name'])).hexdigest()==f['sha256']
            assert len(json.loads(package.read('amendments.json')))>=3
            sample=Path(__file__).resolve().parent.parent/'target'/'workflow-p7-sample.docx'
            sample.write_bytes(package.read('article.docx'))
            if 'article.pdf' in package.namelist():
                sample.with_suffix('.pdf').write_bytes(package.read('article.pdf'))
                assert manifest['pagination']['status']=='rendered'
            else:
                assert manifest['pagination']['status']=='needs_review'
                assert all(i['page'] is None for i in json.loads(package.read('audit.json'))['checklist'])
            assert call('/api/research/projects/'+project_id+'/exports/'+initial_export['exportId'])==initial_bytes
            call('/api/research/projects/'+project_id+'/exports/'+manifest['exportId']+'/article.docx',key=token_b,status=400)
            call('/api/research/projects/'+project_id+'/learning-trace',key=token_b,status=400)
            action('learning_consent',dict(granted=False,purpose='TEST withdrawn'))
            call('/api/research/projects/'+project_id+'/learning-trace',status=400)
            stop(); start()
            workspace=call('/api/research/projects/'+project_id)
            assert workspace['project']['evidence']['learning'][-1]['granted'] is False
            assert call('/api/research/projects/'+project_id+'/exports/'+manifest['exportId'])==bundle
            stop(); env['VERA_WORKFLOW_FINAL_STAGES']='0'; start()
            workspace=call('/api/research/projects/'+project_id)
            assert workspace['finalStagesEnabled'] is False and workspace['audit'] is None
            action('export',{},status=400)
            action('activity',dict(activity='learning'),status=400)
            assert call('/api/research/projects/'+project_id+'/exports/'+manifest['exportId'])==bundle
            assert workspace['project']['evidence']['learning'][-1]['granted'] is False
            stop(); env['VERA_WORKFLOW_FINAL_STAGES']='1'; start()
            workspace=call('/api/research/projects/'+project_id)
            assert workspace['finalStagesEnabled'] is True
            # Remaining-pack acceptance: author-date references and scoped proposals.
            metadata=dict(authors=[dict(family='Doe',given='Jamie',literal='')],containerTitle='TEST Journal',volume='4',issue='2',pages='10-19',articleNumber='',publisher='',kind='journal-article',reviewed=True,note='TEST explicitly fabricated metadata',provenance='',year='2026',doi='10.9999/test-fixture')
            action('record_metadata',dict(recordId=record,bibliography=metadata))
            preview=next(r for r in workspace['referencePreview'] if r['recordId']==record)
            assert preview['citation']=='(Doe, 2026)' and 'Doe, J. (2026).' in preview['reference']
            guidance_basis=workspace['evidenceSummary']['dependency']
            guidance_protocol=workspace['project']['protocol']
            action('assist_request',dict(id='test-guidance-only',kind='protocol',engine='local',level=2))
            action('assist_tick',dict(jobId='test-guidance-only'))
            action('assist_review',dict(id='test-guidance-only',accept=True,reason='TEST guidance read without academic edits'))
            assert workspace['evidenceSummary']['dependency']==guidance_basis
            assert workspace['project']['protocol']==guidance_protocol
            action('assist_request',dict(id='test-stage-manual',kind='draft',engine='local',level=4),status=400)
            action('learning_decision',dict(id='test-writing-judgement',activity='draft',judgement='TEST write an introduction',reason='TEST bounded rationale',evidence='TEST protocol and source',hypothesis='none'))
            action('assist_request',dict(id='test-stage-manual',kind='draft',sectionKey='introduction',engine='local',level=4))
            assert workspace['project']['evidence']['jobs'][-1]['status']=='queued'
            action('assist_tick',dict(jobId='test-stage-manual'))
            job=workspace['project']['evidence']['jobs'][-1]
            assert job['status']=='proposed' and job['proposal']['patches']
            assert not any(s['key']=='introduction' for s in workspace['project']['evidence']['sections'])
            action('assist_review',dict(id=job['id'],accept=True,reason='TEST explicitly reviewed the partial plan wording'))
            assert next(s for s in workspace['project']['evidence']['sections'] if s['key']=='introduction')['status']=='draft'
            action('assist_request',dict(id='test-stage-late',kind='draft',sectionKey='introduction',engine='local',level=4))
            action('draft_section',dict(key='introduction',text='TEST retained manual correction',status='draft'))
            action('assist_tick',dict(jobId='test-stage-late'))
            assert workspace['project']['evidence']['jobs'][-1]['status']=='stale'
            action('assist_review',dict(id='test-stage-late',accept=True,reason='TEST forbidden stale application'),status=400)
            assert next(s for s in workspace['project']['evidence']['sections'] if s['key']=='introduction')['text']=='TEST retained manual correction'
            action('assist_request',dict(id='test-cancel',kind='protocol',engine='local',level=2))
            action('assist_cancel',dict(id='test-cancel'))
            assert workspace['project']['evidence']['jobs'][-1]['status']=='cancelled'
            call('/api/research/projects/'+project_id+'/assistance/test-stage-late',dict(expectedRevision=workspace['project']['revision']),key=str(uuid.uuid4())*2,status=403)
            # A long section separates quote pages from heading pages; ambiguity stays null.
            long_methods='TEST ambiguous assertion.\n\nTEST ambiguous assertion.\n\n'+'\n\n'.join('TEST layout paragraph '+str(i)+': '+('Fictional test content for pagination only. '*6) for i in range(65))+'\n\nTEST unique closing statement. [@'+record+']'
            action('draft_section',dict(key='methods',text=long_methods,status='draft'))
            action('reporting_item',dict(item=5,sectionKey='methods',quote='TEST unique closing statement.',note='TEST exact end-of-section locator'))
            action('reporting_item',dict(item=8,sectionKey='methods',quote='TEST ambiguous assertion.',note='TEST ambiguous locator'))
            action('export',dict(milestone='article'))
            quote_manifest=workspace['project']['evidence']['exports'][-1]
            quote_zip=zipfile.ZipFile(io.BytesIO(call('/api/research/projects/'+project_id+'/exports/'+quote_manifest['exportId'])))
            assert '(Doe, 2026)' in quote_zip.read('article.md').decode()
            quote_audit=json.loads(quote_zip.read('audit.json'))
            item5=next(i for i in quote_audit['checklist'] if i['item']==5)
            item8=next(i for i in quote_audit['checklist'] if i['item']==8)
            assert item8['page'] is None and item8['pageMapping']=='needs_review'
            if 'article.pdf' in quote_zip.namelist():
                proof=Path(__file__).resolve().parent.parent/'target'/'workflow-completion-article'
                proof.with_suffix('.docx').write_bytes(quote_zip.read('article.docx'))
                proof.with_suffix('.pdf').write_bytes(quote_zip.read('article.pdf'))
                proof.with_suffix('.audit.json').write_text(json.dumps(quote_audit,ensure_ascii=False),encoding='utf-8')
                assert item5['pageMapping']=='rendered_quote', item5
                assert item5['page']>quote_audit['pagination']['anchors']['vera_methods'], item5
            action('output_settings',dict(language='id',identityRequired=True,studentName='TEST STUDENT',studentId='TEST NIM',program='TEST PROGRAM',filename='TEST_Rencana'))
            action('export',dict(milestone='plan'))
            plan_manifest=workspace['project']['evidence']['exports'][-1]
            plan_zip=zipfile.ZipFile(io.BytesIO(call('/api/research/projects/'+project_id+'/exports/'+plan_manifest['exportId'])))
            assert 'TEST_Rencana.docx' in plan_zip.namelist() and 'article.docx' not in plan_zip.namelist()
            assert 'checklist.csv' not in plan_zip.namelist()
            assert 'NIM:' not in plan_zip.read('TEST_Rencana.md').decode()
            action('protocol',dict(workspace['project']['protocol'],assignmentFormat=True,query='TITLE-ABS-KEY("agent*" AND educat*)',amendmentReason='TEST optional coursework output'))
            action('direction',dict(workspace['project']['direction'],instructions='TEST OPTIONAL ASSIGNMENT: items 1 and 3-13; name, NIM, program requested'))
            action('export',dict(milestone='coursework'))
            task_manifest=workspace['project']['evidence']['exports'][-1]
            task_zip=zipfile.ZipFile(io.BytesIO(call('/api/research/projects/'+project_id+'/exports/'+task_manifest['exportId'])))
            task_checklist=json.loads(task_zip.read('coursework-checklist.json'))
            assert [i['item'] for i in task_checklist]==[1,3,4,5,6,7,8,9,10,11,12,13]
            assert all(i['executionStatus']=='planned' for i in task_checklist)
            assert 'NIM: TEST NIM' in task_zip.read('TEST_Rencana.md').decode()
            assert 'Lampiran strategi pencarian' in task_zip.read('TEST_Rencana.md').decode()
            task_xml=ET.fromstring(zipfile.ZipFile(io.BytesIO(task_zip.read('TEST_Rencana.docx'))).read('word/document.xml'))
            task_text=''.join(task_xml.itertext())
            assert 'agent*' in task_text and 'educat*' in task_text, 'Search wildcards must remain verbatim in Word'
            if 'TEST_Rencana.pdf' in task_zip.namelist():
                assert all(i['pageMapping']=='rendered_quote' for i in task_checklist if i['status']=='reported'),task_checklist
                proof=Path(__file__).resolve().parent.parent/'target'/'workflow-completion-coursework'
                proof.with_suffix('.docx').write_bytes(task_zip.read('TEST_Rencana.docx'))
                proof.with_suffix('.pdf').write_bytes(task_zip.read('TEST_Rencana.pdf'))
                proof.with_suffix('.checklist.json').write_text(json.dumps(task_checklist,ensure_ascii=False),encoding='utf-8')
            print('PASS: remaining-pack APA metadata, scoped proposal review/cancellation/stale guards, quote pagination and ambiguity, separate plan/coursework outputs and 12-item coverage.')
            print('PASS: P7 blank/incomplete export, DOCX XML, ledger match, checklist coverage, immutable retry/restart, hashes, references, secret and source/learning exclusions.')
            print('PASS: P8 judgement gate, progressive help, versioned policy, transfer help lock, rubric, owner access, separate consent and withdrawal, persisted traces.')
            print('PASS: HTTP create/retry/restart/resume, conflict, protocol, import preview/provenance, exploratory separation, dedup/undo, reviewer concealment/permissions, adjudication, not_retrieved ledger, revocation and amendment.')
            print('PASS: P5/P6 schema validation, locators/hash, two-identity verification, pilot gate, deterministic overlapping counts, claims, retained writing, stale dependencies, files and restart persistence.')
            print('Fixtures only. No provider live search or real two-human review is claimed.')
        finally:
            stop()
            log.close()


if __name__ == '__main__':
    main()
