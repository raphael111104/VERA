import test from 'node:test';
import assert from 'node:assert/strict';
import { changeProject, sidechatRequest, exportBlob, WorkflowError } from '../src/features/research-workflow/api.ts';

function browserContext(t) {
  for (const [key,value] of Object.entries({
    location:{hash:'',pathname:'/research/test',search:''},
    localStorage:{getItem:()=> 'TEST-OWNER-CAPABILITY-'.repeat(4)},
    sessionStorage:{getItem:()=> null},
  })) {
    const previous=Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{value,configurable:true});
    t.after(()=>previous?Object.defineProperty(globalThis,key,previous):Reflect.deleteProperty(globalThis,key));
  }
}
const command={action:'draft_section',data:{key:'results',text:'TEST manual text',status:'draft'},expectedRevision:4,operationId:'TEST operation'};
test('export preview keeps authorization and exact binary bytes, including CSV BOM', async t => {
  browserContext(t);
  const bytes = new TextEncoder().encode('\uFEFF"judul"\r\n"Pendidikan 📚"\r\n');
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/research/projects/test/exports/snapshot/checklist.csv');
    assert.equal(options.headers.Authorization, `Bearer ${'TEST-OWNER-CAPABILITY-'.repeat(4)}`);
    return new Response(bytes, {headers:{'Content-Type':'text/csv'}});
  });
  const blob = await exportBlob('test', 'snapshot', 'checklist.csv');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
});
test('a denied export preview never exposes the response as a document', async t => {
  browserContext(t);
  t.mock.method(globalThis, 'fetch', async () => new Response('access denied', {status:403}));
  await assert.rejects(exportBlob('test', 'snapshot', 'article.docx'), /akses proyek/);
});
test('empty proxy error produces a recoverable workflow error without mutating the save envelope',async t=>{
  browserContext(t);
  t.mock.method(globalThis,'fetch',async()=>new Response('',{status:502}));
  const before=structuredClone(command);
  await assert.rejects(changeProject('test',command),error=>error instanceof WorkflowError&&error.status===502&&error.message.includes('Perubahan lokal tetap ada'));
  assert.deepEqual(command,before);
});
test('network failure in sidechat explains that the localhost server is unavailable',async t=>{
  browserContext(t);
  t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('TEST connection refused');});
  await assert.rejects(sidechatRequest('test',{action:'read',harness:'codex'}),error=>error instanceof WorkflowError&&error.status===0&&error.message.includes('Server localhost'));
});
test('optimistic conflict remains distinguishable from a transient transport error',async t=>{
  browserContext(t);
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({error:'revision conflict:5'}),{status:409}));
  await assert.rejects(changeProject('test',command),error=>error instanceof WorkflowError&&error.status===409&&error.message.includes('jendela lain'));
});
