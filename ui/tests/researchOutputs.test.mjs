import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import mammoth from 'mammoth';
import { toCsv, readCsv, objectCsv, workingData } from '../src/features/research-workflow/outputs.ts';

test('CSV round-trip retains Unicode, quotes, commas, multiline cells and empty columns', () => {
  const values = [['Pendidikan, teknologi', 'Kutipan "bukti"\nbaris kedua', '', '📚']];
  const csv = toCsv(['judul', 'catatan', 'kosong', 'simbol'], values);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.deepEqual(readCsv(csv), [['judul', 'catatan', 'kosong', 'simbol'], ...values]);
  assert.deepEqual(readCsv('a,b\r\n"",\r\n'), [['a', 'b'], ['', '']]);
});
test('CSV neutralizes formula strings while numeric and missing values keep their meaning', () => {
  const [, row] = readCsv(toCsv(['a','b','c','d','e','f'], [[' =1+1', '@SUM(1)', '-CMD', -3, null, false]]));
  assert.deepEqual(row, ["' =1+1", "'@SUM(1)", "'-CMD", '-3', '', 'false']);
  assert.deepEqual(readCsv(objectCsv([], ['recordId','status'])), [['recordId','status']]);
});
test('malformed quoted CSV fails explicitly instead of silently shifting research cells', () => {
  assert.throws(() => readCsv('a,b\n"unterminated'), /ditutup/);
  assert.throws(() => readCsv('a,b\n"closed"extra,1'), /valid/);
});
test('working outputs expose tabular records without raw provider pages or consent-protected learning trace', () => {
  const w = { project: { records: [], runs: [{id:'run',provider:'pubmed', rawPages:[{original:'RAW PRIVATE'}]}], decisions:[], evidence:{ cells:[], syntheses:[], appraisals:[], learning:[{private:'LEARNING PRIVATE'}]} }, ledger:{included:0,unknown:null}, audit:null, history:[] };
  const files = workingData(w);
  assert.ok(files.every((f) => f.name.endsWith('.csv')));
  assert.ok(!JSON.stringify(files).includes('RAW PRIVATE'));
  assert.ok(!JSON.stringify(files).includes('LEARNING PRIVATE'));
  assert.deepEqual(readCsv(files.find((f) => f.name === 'ledger-seleksi.csv').text), [['indikator','nilai'],['included','0'],['unknown','']]);
});
test('Word output is an actual DOCX preserving headings, tables, Unicode and safe links', async () => {
  const source = readFileSync(new URL('../src/features/research-workflow/wordOutput.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022} }).outputText
    .replace(/from "([^\"]+)"/g, (_, spec) => `from ${JSON.stringify(spec.startsWith('.') ? new URL('../src/researchBrowser.ts', import.meta.url).href : import.meta.resolve(spec))}`);
  const { wordBlob } = await import(`data:text/javascript,${encodeURIComponent(code)}`);
  const blob = await wordBlob('# Pendidikan dan teknologi 📚\n\n**Bukti** dan [artikel](https://doi.org/10.1234/example).\n\n| Kolom | Nilai |\n| --- | --- |\n| Tujuan | Belajar |\n\n1. Pertama\n2. Kedua');
  const bytes = Buffer.from(await blob.arrayBuffer());
  assert.equal(bytes.subarray(0,2).toString(), 'PK');
  const converted = await mammoth.convertToHtml({buffer:bytes});
  assert.match(converted.value, /<h1>Pendidikan dan teknologi 📚<\/h1>/);
  assert.match(converted.value, /<strong>Bukti<\/strong>/);
  assert.match(converted.value, /<table>/);
  assert.match(converted.value, /https:\/\/doi.org\/10.1234\/example/);
  assert.match(converted.value, /2\. Kedua/);
});
