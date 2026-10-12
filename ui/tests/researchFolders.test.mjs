import assert from "node:assert/strict";
import test from "node:test";
import { ResearchFolderWriter } from "../src/researchFolders.ts";

const folder = id => ({id,name:id,brief:{field:"",focus:"",context:"",reason:""},jobId:null,selection:null,revision:1});
test("folder writes serialize revisions and coalesce edits without crossing folders", async () => {
  const requests=[];const unblock=[];
  const writer=new ResearchFolderWriter(async value => {
    requests.push(value);
    await new Promise(resolve=>unblock.push(resolve));
    return {...value,revision:value.revision+1};
  });
  const a=writer.enqueue(folder("A"));
  writer.enqueue({...folder("A"),name:"Older name"});
  writer.enqueue({...folder("A"),name:"Latest name"});
  const b=writer.enqueue({...folder("B"),name:"Other research"});
  assert.equal(requests.length,2);
  unblock[0]();unblock[1]();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests[2].id,"A");assert.equal(requests[2].name,"Latest name");assert.equal(requests[2].revision,2);
  unblock[2]();await Promise.all([a,b]);
  assert.equal(requests.filter(item=>item.id==="B").length,1);
});
test("failed folder saves retain the latest draft for an explicit retry", async () => {
  let fail=true;let saved;
  const writer=new ResearchFolderWriter(async value => {if(fail) throw new Error("offline");saved=value;return {...value,revision:value.revision+1};});
  await assert.rejects(writer.enqueue({...folder("A"),name:"Unsaved draft"}),/offline/);
  fail=false;await writer.flush("A");assert.equal(saved.name,"Unsaved draft");
});
