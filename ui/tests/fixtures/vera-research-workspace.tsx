/** Manual integration fixture: real workspace with isolated API/storage, no live agent calls. */
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResearchDemoWorkspace } from "../../src/components/ResearchDemoWorkspace";
import type { ResearchJob } from "../../src/researchWorkflow";
import "../../src/tailwind.css";

const harness = {id:"codex",name:"Codex",installed:true,authenticated:true,authState:"ready",agentReady:true,catalogPending:false,models:[{id:"sample-model",displayName:"Model contoh"},{id:"alternate-model",displayName:"Model alternatif"}],options:{permissionModes:[],reasoningLevels:[],defaultPermissionMode:null}};
const brief={field:"Pendidikan",focus:"Penalaran dalam penulisan akademik",context:"Mahasiswa tahun pertama",reason:"Memahami hubungan antara klaim dan bukti"};
let job: ResearchJob;
let folders: unknown[]=JSON.parse(sessionStorage.getItem("vera-fixture-folders") ?? "[]");
const requests:{path:string;body:unknown}[]=[];
let notify=()=>{};
let messages:unknown[]=[];
let jobPollFailures=0;
const sample=(status:ResearchJob["status"]):ResearchJob => ({id:"fixture-research",stage:"trend",status,brief,progress:status === "running" ? "Mencari dan meninjau sumber penelitian" : status === "complete" ? "Output sementara siap ditinjau" : status === "cancelled" ? "Permintaan dihentikan" : "Sumber belum dapat diambil",rootSessionId:"fixture-session",harness:"codex",model:"sample-model",agents:[{role:"Koordinator",sessionId:"fixture-agent",status:status === "complete" ? "complete" : "running"}],sources:[],updatedAt:Date.now(),focusQuestions:{interpretation:"Fokus tentang penalaran akademik",contextQuestion:"Siapa sasaran penelitian?",reasonQuestion:"Apa tujuan penelitian Anda?"},result:status === "complete" ? {papers:[{source:"pubmed",id:"12345678",title:"Artikel contoh untuk uji browser",abstract:"Data contoh"}],years:[{year:"2025",count:1}],topPapers:[],limitations:["Data contoh untuk menguji antarmuka, bukan hasil penelitian nyata."]} : null,...(status === "error" ? {error:"Koneksi sumber contoh gagal."} : {})});
job=sample("running");
Object.defineProperty(window,"localStorage",{value:{getItem:()=>"fixture-research",setItem:()=>{},removeItem:()=>{}}});
window.fetch=async(input,init) => {
  const path=new URL(typeof input === "string" ? input : input instanceof Request ? input.url : input.toString(),location.origin).pathname;
  if(init?.method === "POST") {requests.push({path,body:JSON.parse(String(init.body ?? "{}"))});notify();}
  let value:unknown={};
  if(path === "/api/research/folders") {
    if(init?.method === "POST") {const folder=JSON.parse(String(init.body));value={...folder,revision:folder.revision+1};folders=[...folders.filter((item:any)=>item.id!==folder.id),value];sessionStorage.setItem("vera-fixture-folders",JSON.stringify(folders));}
    else value=folders;
  }
  else if(path === "/api/harnesses") value={harnesses:[harness]};
  else if(path === "/api/settings/ui-state") value={preferredAgent:{harness:"codex",model:"sample-model",reasoningLevel:null,serviceTier:null,permissionMode:null}};
  else if(path.endsWith("/cancel")) {job=sample("cancelled");value=job;}
  else if(path === "/api/research/jobs" && init?.method === "POST") {const body=JSON.parse(String(init.body));job={...sample("running"),harness:body.harness,model:body.model,reasoningLevel:body.reasoningLevel};value=job;}
  else if(path.endsWith("/side")) value={session:{id:"fixture-side-session"}};
  else if(path.endsWith("/message")) {const body=JSON.parse(String(init.body));messages=[{id:"fixture-user",role:"user",parts:[{type:"text",text:body.text}]},{id:"fixture-assistant",role:"assistant",completedAt:Date.now(),parts:[{type:"text",text:`Jawaban contoh · model ${body.model}`}]}];value={ok:true};}
  else if(path.endsWith("/messages")) value={messages};
  else if(path.startsWith("/api/research/jobs/")) {if(jobPollFailures > 0){jobPollFailures--;throw new Error("Gangguan koneksi contoh");}value=job;}
  else if(path !== "/api/telemetry/event") return new Response(JSON.stringify({error:`Fixture tidak mendukung ${path}`}),{status:404});
  return new Response(JSON.stringify(value),{headers:{"Content-Type":"application/json"}});
};
const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
function Preview(){
  const [generation,setGeneration]=useState(0);
  const [,setRequestVersion]=useState(0);
  notify=()=>setRequestVersion(value=>value+1);
  return <QueryClientProvider client={client}><div className="app flex h-full flex-col">
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background p-2 text-xs">Uji workspace · data contoh · tidak mengubah riset pengguna
      {(["running","complete","cancelled","error"] as const).map(status=><button key={status} onClick={()=>{job=sample(status);setGeneration(v=>v+1);}}>Uji {status}</button>)}
      <button onClick={()=>{job=sample("complete");}}>Selesaikan proses melalui polling</button>
      <button onClick={()=>{jobPollFailures=2;}}>Simulasikan putus koneksi sementara</button>
      <details><summary>Permintaan API contoh</summary><output aria-label="Permintaan API contoh">{JSON.stringify(requests)}</output></details>
    </div><ResearchDemoWorkspace key={generation}/>
  </div></QueryClientProvider>;
}
const root=import.meta.hot?.data.root ?? createRoot(document.getElementById("root")!);
if(import.meta.hot){import.meta.hot.data.root=root;import.meta.hot.accept();}
root.render(<Preview/>);
