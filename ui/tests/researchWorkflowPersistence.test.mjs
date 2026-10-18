import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowWriter } from '../src/features/research-workflow/persistence.ts';

test('a rejected validation allows a corrected command to be saved', async () => {
  const requests = [];
  const writer = new WorkflowWriter(4, async request => {
    requests.push(request);
    if (request.data.invalid) throw Object.assign(Error('invalid'), {status: 400});
    return {revision: request.expectedRevision + 1};
  }, () => {});
  await assert.rejects(writer.save({action:'protocol', data:{invalid:true}}), /invalid/);
  await writer.save({action:'protocol', data:{invalid:false}});
  assert.equal(requests.length, 2);
  assert.notEqual(requests[0].operationId, requests[1].operationId);
  assert.equal(requests[1].expectedRevision, 4);
});

test('failed response retries the identical operation and preserves newer input', async () => {
  let fail = true; const requests = []; const accepted = [];
  const writer = new WorkflowWriter(1, async request => { requests.push(request); if (fail) throw Error('offline'); return {revision: request.expectedRevision + 1}; }, value => accepted.push(value));
  await assert.rejects(writer.save({action: 'direction', data: {interest: 'A'}}), /offline/);
  fail = false;
  await writer.retry();
  assert.deepEqual(requests[0], requests[1]);
  await writer.save({action: 'direction', data: {interest: 'B'}});
  assert.equal(requests[2].expectedRevision, 2);
  assert.equal(accepted.length, 2);
});

test('queued edits wait for acknowledgement and keep the latest snapshot', async () => {
  const requests=[];const unblock=[];
  const writer=new WorkflowWriter(1,async request=>{requests.push(request);await new Promise(resolve=>unblock.push(resolve));return {revision:request.expectedRevision+1};},()=>{});
  const first=writer.save({action:'direction',data:{interest:'First'}});
  writer.save({action:'direction',data:{interest:'Intermediate'}});
  const latest=writer.save({action:'direction',data:{interest:'Latest'}});
  assert.equal(requests.length,1);unblock[0]();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests[1].data.interest,'Latest');assert.equal(requests[1].expectedRevision,2);
  unblock[1]();await Promise.all([first,latest]);
});
