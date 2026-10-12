import assert from "node:assert/strict";
import test from "node:test";
import { paperUrl, researchChart, researchNotes } from "../src/researchWorkflow.ts";

const paper = {source:"openalex",id:"10.1234/example",title:"Learning analytics",abstract:"Metadata only",publicationDate:"2025-03-01",citations:7};
const job = () => ({id:"job",stage:"trend",status:"complete",brief:{field:"Pendidikan",focus:"Learning analytics",context:"Mahasiswa tahun pertama",reason:"Memahami penalaran"},harness:"codex",model:"configured-model",agents:[],sources:[{source:"openalex",queries:["learning analytics higher education"],returned:1,retrievedAt:123,errors:[]}],result:{papers:[paper],years:[{year:"2025",count:1}],claims:[{text:"Klaim sementara",ids:[paper.id]}],limitations:["Metadata/abstrak; belum full text"],retrievedAt:123},plan:{publishedAfter:"2022-01-01",publishedBefore:"2026-10-09"}});
test("a chart cannot appear while the model is still gathering evidence", () => {
  assert.equal(researchChart({...job(),status:"running"}),"");
  assert.equal(researchChart({...job(),stage:"focus"}),"");
  assert.equal(researchChart({...job(),result:{papers:[]}}),"");
});
test("real-corpus output retains the scope and running-year limitations", () => {
  const svg=researchChart(job()); assert.match(svg,/1 artikel unik/);assert.match(svg,/bukan jumlah seluruh publikasi/);assert.match(svg,/Tahun berjalan belum lengkap/);assert.doesNotMatch(svg,/sintetis|simulasi/i);
});
test("the exported brief carries reasoning, queries, paper identity and evidence limits", () => {
  const notes=researchNotes(job());for (const value of ["Memahami penalaran","learning analytics higher education","https://doi.org/10.1234/example","belum full text","configured-model"]) assert.ok(notes.includes(value));
});
test("paper links cannot turn metadata into executable or arbitrary navigation", () => {
  assert.equal(paperUrl({...paper,id:"javascript:alert(1)"}),undefined);assert.equal(paperUrl({...paper,id:"https://attacker.invalid/paper"}),undefined);assert.equal(paperUrl({...paper,id:"W123"}),"https://openalex.org/W123");assert.equal(paperUrl({...paper,source:"pubmed",id:"12345"}),"https://pubmed.ncbi.nlm.nih.gov/12345/");
});
test("student text remains text inside the SVG artifact", () => {
  const value=job();value.brief.focus='<script>alert("x")</script> & fokus';const svg=researchChart(value);assert.doesNotMatch(svg,/<script>/);assert.match(svg,/&lt;script&gt;/);
});
