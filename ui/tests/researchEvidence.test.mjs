import assert from "node:assert/strict";
import test from "node:test";
import { EVIDENCE_COLUMNS, researchEvidenceCsv, researchEvidenceRows } from "../src/researchWorkflow.ts";
const paper={source:"openalex",id:"10.1234/sample",title:'Judul, "bukti"\nBaris kedua – penelitian',abstract:"Abstrak bahasa Indonesia",citations:0};
const job={id:"job",brief:{field:"Pendidikan",focus:"Penalaran",context:"Mahasiswa",reason:"Memahami bukti"},harness:"codex",model:"historical-model",reasoningLevel:"max",status:"complete",sources:[{source:"openalex",queries:['claims, "evidence"',"second query"],retrievedAt:0,returned:1,errors:[]},{source:"pubmed",queries:["other query"],retrievedAt:1,returned:0,errors:["Timeout"]}],result:{papers:[paper,{...paper,id:"W123",citations:null}],claims:[{text:"Klaim terbatas",ids:[paper.id]}],relevantPaperIds:[paper.id],retrievedAt:2,limitations:["Metadata saja"]},plan:{publishedAfter:"2022-01-01",publishedBefore:"2026-10-12"}};
test("CSV retains corpus rows, zero-result/error searches, claims and historical model",()=>{
  const rows=researchEvidenceRows(job);
  assert.equal(rows.length,4);
  assert.equal(rows[1].jenis_rekaman,"pencarian");assert.equal(rows[1].jumlah_hasil_sumber,0);assert.equal(rows[1].error_pencarian,"Timeout");
  assert.equal(rows[0].waktu_pengambilan_utc,"1970-01-01T00:00:00.000Z");
  assert.equal(rows[2].jumlah_sitasi,0);assert.equal(rows[3].jumlah_sitasi,"");
  assert.equal(rows[2].klaim_terkait,"Klaim terbatas");assert.equal(rows[3].klaim_terkait,"");
  assert.equal(rows[2].ditandai_relevan,"ya");assert.equal(rows[3].ditandai_relevan,"");
  assert.equal(rows[2].url_sumber,"https://doi.org/10.1234/sample");
  for(const row of rows){assert.equal(row.model_ai,"historical-model");assert.equal(row.tingkat_usaha,"max");assert.equal(row.batas_bukti,"Metadata saja");assert.deepEqual(Object.keys(row),EVIDENCE_COLUMNS);}
});
test("CSV quotes commas, double quotes, Unicode and embedded newlines with Excel BOM",()=>{
  const csv=researchEvidenceCsv(job);
  assert.ok(csv.startsWith('\uFEFF"jenis_rekaman","id_proses"'));
  assert.ok(csv.includes('"Judul, ""bukti""\nBaris kedua – penelitian"'));
  assert.ok(csv.includes('"claims, ""evidence""\nsecond query"'));
  assert.ok(csv.endsWith("\r\n"));
});
test("untrusted metadata is neutralized for spreadsheet formula execution",()=>{
  for(const title of ['=HYPERLINK("https://example.org")'," +SUM(1,2)","\t@SUM(1)","-1+1"]){
    const csv=researchEvidenceCsv({...job,result:{papers:[{...paper,title}]}});
    assert.ok(csv.includes(`"'${title.replaceAll('"','""')}"`));
    assert.equal(researchEvidenceRows({...job,result:{papers:[{...paper,title}]}}).at(-1).judul,title);
  }
});
test("empty and incomplete jobs still export a schema and available search evidence",()=>{
  assert.equal(researchEvidenceRows({...job,sources:[],result:null}).length,0);
  assert.equal(researchEvidenceCsv({...job,sources:[],result:null}).split("\r\n").length,2);
  assert.equal(researchEvidenceRows({...job,result:null})[1].error_pencarian,"Timeout");
});
