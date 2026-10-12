import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Check, Download, FileText, FolderOpen, Globe, Home, MessagesSquare, Package, RotateCcw, Square, X } from "lucide-react";
import { VeraAppHeader, RailHeader } from "./Header";
import { Button, IconButton } from "./ui";
import { showLandingPage } from "./StartupSplash";
import { m } from "../paraglide/messages.js";
import { type ResearchBrief } from "../researchDemo";
import { ResearchFolders, folderJobKey, type FolderActions } from "./ResearchFolders";
import { cancelResearchJob, getHarnesses, getResearchJob, getUiState, reconcileReasoning, reconcileServiceTier, reasoningFor, startResearchJob, updateUiState, type Harness } from "../api";
import { paperUrl, researchChart, researchNotes, type ResearchJob, type ResearchPaper } from "../researchWorkflow";
import { ResearchAssistence } from "./ResearchAssistence";
import { Md } from "./Md";
import { ResearchStatus } from "./ResearchStatus";
import { ResearchBrowser } from "./ResearchBrowser";
import { researchBrowserUrl, researchMetadataText } from "../researchBrowser";
import { defaultSelection, ModelPicker, type ModelSelection } from "./ModelPicker";
import { closeResearchPanel, researchPanelGroup, type ResearchPanel as Panel, type ResearchPanelGroup } from "../researchPanels";
import { researchSelection } from "../researchSelection";
import { researchEvidenceCsv } from "../researchWorkflow";
import { ResearchEvidence } from "./ResearchEvidence";

const PANEL_NAMES: Record<string,string> = {files:"File penelitian",output:"Output sementara",assistence:"Side chat",notes:"catatan-fokus-riset.md",evidence:"bukti-pencarian.csv",chart:"peta-tren-riset.svg"};
const GROUP_NAMES: Record<ResearchPanelGroup,string> = {files:"File",output:"Output",assistence:"Side chat",browser:"Browser"};
const STAGES = ["Bidang dan fokus", "Pertanyaan lanjutan", "Tinjauan tren"];
function download(name: string, content: string, mime: string) {
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const link=document.createElement("a"); link.href=url; link.download=name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url),1000);
}
function Paper({paper}:{paper:ResearchPaper}) {
  const url=paperUrl(paper);
  return <li className="py-2"><span className="text-sm font-medium">{url ? <a href={url}>{researchMetadataText(paper.title)}</a> : researchMetadataText(paper.title)}</span><p className="m-0 text-xs text-subtext">{paper.source} · {paper.publicationDate ?? "Tanggal tidak tersedia"} · {paper.citations == null ? "Sitasi tidak tersedia" : `${paper.citations} sitasi`}<br />{paper.id}</p></li>;
}

export function ResearchDemoWorkspace() {
  return <ResearchFolders>{actions => <ResearchFolderWorkspace key={actions.folder.id} {...actions}/>}</ResearchFolders>;
}

function ResearchFolderWorkspace({folder,save,controls,newResearch}: FolderActions) {
  const [brief,setBrief]=useState(folder.brief);
  const [job,setJob]=useState<ResearchJob|null>(null);
  const [panel,setPanel]=useState<Panel|null>(null);
  const [tabs,setTabs]=useState<Panel[]>([]);
  const lastPanel=useRef<Partial<Record<ResearchPanelGroup,Panel>>>({});
  const activeGroup=panel ? researchPanelGroup(panel) : null;
  const visibleTabs=tabs.filter(tab => researchPanelGroup(tab) === activeGroup);
  const [sources,setSources]=useState<Record<string,{url:string;title:string}>>({});
  const openPanel=(next:Panel) => {lastPanel.current[researchPanelGroup(next)]=next;setTabs(current => current.includes(next) ? current : [...current,next]);setPanel(next);};
  const toggleGroup=(group:ResearchPanelGroup) => {
    if (activeGroup === group) {setPanel(null);return;}
    const remembered=lastPanel.current[group];
    if (remembered && tabs.includes(remembered)) {openPanel(remembered);return;}
    if (group === "browser") openBrowser(); else openPanel(group);
  };
  const openSource=(url:string,title:string) => {
    const safe=researchBrowserUrl(url);if (!safe) return;
    const id:Panel=`browser:${safe}`;setSources(current => ({...current,[id]:{url:safe,title}}));openPanel(id);
  };
  const openBrowser=() => {setSources(current => ({...current,"browser:start":{url:"",title:"Browser sumber"}}));openPanel("browser:start");};
  const closeTab=(id:Panel) => {
    const next=closeResearchPanel(tabs,panel,id);setTabs(next.tabs);setPanel(next.panel);
    const group=researchPanelGroup(id);
    if (lastPanel.current[group] === id) lastPanel.current[group]=next.panel && researchPanelGroup(next.panel) === group ? next.panel : next.tabs.filter(tab => researchPanelGroup(tab) === group).at(-1);
  };
  const [railOpen,setRailOpen]=useState(() => window.matchMedia("(min-width: 801px)").matches);
  const [error,setError]=useState("");
  const [connectionError,setConnectionError]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [restoring,setRestoring]=useState(true);
  const [sideBusy,setSideBusy]=useState(false);
  const [harnesses,setHarnesses]=useState<Harness[]>([]);
  const [selection,setSelection]=useState<ModelSelection|null>(null);
  const sideGeneration=folder.id;
  const inFlight=useRef(false);
  const transcript=useRef<HTMLDivElement>(null);
  const tabStrip=useRef<HTMLDivElement>(null);
  useEffect(() => {tabStrip.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:"nearest",inline:"nearest"});},[panel,tabs.length]);
  const fieldInput=useRef<HTMLInputElement>(null);
  const contextInput=useRef<HTMLTextAreaElement>(null);
  const phase=job?.stage === "trend" && job.status === "complete" ? "complete" : job?.stage === "trend" || (job?.stage === "focus" && job.status === "complete") ? "refine" : "focus";
  const busy=submitting || restoring || job?.status === "running";
  const questions=job?.stage === "focus" ? job.result : job?.focusQuestions;
  const currentStage=phase === "focus" ? 0 : phase === "refine" ? 1 : 2;
  const svg=useMemo(() => job ? researchChart(job) : "",[job]);
  const notes=useMemo(() => job ? researchNotes(job) : "",[job]);
  const evidence=useMemo(() => job ? researchEvidenceCsv(job) : "",[job]);
  const selectedHarness=harnesses.find(h => h.id === selection?.harness);
  const harness=selection?.harness ?? null;
  const model=selection?.model ?? null;
  const reasoningLevel=selection?.reasoningLevel ?? null;
  const reasoning=reasoningFor(selectedHarness,model);
  useEffect(() => {
    let active=true;
    let saved=folder.jobId; try {saved=localStorage.getItem(folderJobKey(folder.id)) || saved;} catch {}
    const restored=saved ? getResearchJob(saved) : Promise.resolve(null);
    void Promise.all([getHarnesses(),getUiState(),restored]).then(([items,state,value]) => {
      if (!active) return;
      const available=items.filter(h => h.agentReady && !h.catalogPending); setHarnesses(available);
      if (value) {
        setJob(value);
        const restoredBrief=folder.brief.field ? folder.brief : value.brief;
        setBrief(restoredBrief);
        // Opening a saved folder is a read. Only migration/recovery needs a write;
        // repeated mounts in other windows must not advance its revision.
        if (folder.jobId !== value.id || !folder.brief.field) {
          void save({brief:restoredBrief,jobId:value.id}).then(() => {try {localStorage.removeItem(folderJobKey(folder.id));} catch {}}).catch(() => {});
        } else {try {localStorage.removeItem(folderJobKey(folder.id));} catch {}}
        if (value.stage === "trend" && value.status === "complete") openPanel("output");
      }
      const savedSelection=researchSelection(available,folder.selection,value,state.preferredAgent);
      const selected=available.find(h => h.id === savedSelection?.harness) ?? available[0];
      if (selected) {
        const base=savedSelection ?? defaultSelection([selected]);
        const chosenModel=base?.model ?? null;
        setSelection({
          harness:selected.id,
          model:chosenModel,
          serviceTier:reconcileServiceTier(selected,chosenModel,base?.serviceTier),
          permissionMode:base?.permissionMode ?? selected.options?.defaultPermissionMode ?? null,
          reasoningLevel:reconcileReasoning(selected,chosenModel,base?.reasoningLevel ?? null),
        });
      }
      else setError("Belum ada model AI yang siap. Konfigurasikan atau login agent melalui aplikasi, lalu muat ulang.");
    }).catch(problem => active && setError(String(problem))).finally(() => active && setRestoring(false));
    return () => {active=false;};
  },[]);
  useEffect(() => {
    if (!job || job.status !== "running") return;
    let active=true;let timer:ReturnType<typeof setTimeout>;
    const poll=async () => {
      try {const next=await getResearchJob(job.id);if (!active) return;setConnectionError("");setJob(next);if (next.stage === "trend" && next.status === "complete") openPanel("output");if (next.status === "running") timer=setTimeout(() => void poll(),1000);}
      catch (problem) {if (active) {setConnectionError(`Status workflow belum dapat diambil. Mencoba menyambung kembali: ${String(problem)}`);timer=setTimeout(() => void poll(),3000);}}
    };
    timer=setTimeout(() => void poll(),700);return () => {active=false;clearTimeout(timer);};
  },[job?.id,job?.status]);
  useEffect(() => {
    document.title=`${folder.name} — VERA`;
    if (transcript.current) transcript.current.scrollTop=transcript.current.scrollHeight;
    if (!busy && phase === "focus") fieldInput.current?.focus();
    if (!busy && phase === "refine") contextInput.current?.focus();
  },[phase,busy,folder.name]);
  const reset=() => {if (busy) return;newResearch();};
  const submit=async (event:FormEvent) => {
    event.preventDefault();if (busy || !harness || inFlight.current) return;
    inFlight.current=true;setSubmitting(true);setError("");setConnectionError("");
    try {
      const previousJobId=phase !== "focus" ? job?.stage === "focus" ? job.id : job?.previousJobId ?? undefined : undefined;
      const next=await startResearchJob({stage:phase === "focus" ? "focus" : "trend",brief,harness,model,reasoningLevel,previousJobId});
      setJob(next);try {localStorage.setItem(folderJobKey(folder.id),next.id);} catch {}
      await save({jobId:next.id,brief,selection});
      try {localStorage.removeItem(folderJobKey(folder.id));} catch {}
    } catch (problem) {setError(problem instanceof Error ? problem.message : String(problem));}
    finally {setSubmitting(false);inFlight.current=false;}
  };
  const edit=(key:keyof ResearchBrief,value:string) => {
    const next={...brief,[key]:value};setBrief(next);void save({brief:next}).catch(() => {});
  };
  const persistSelection=(next:ModelSelection) => {
    setSelection(next);
    void save({selection:next}).catch(problem => setError(`Setelan model folder belum tersimpan: ${String(problem)}`));
    void updateUiState({preferredAgent:next}).catch(problem => setError(`Setelan model belum tersimpan: ${String(problem)}`));
  };
  const changeReasoning=(value:string) => {
    if (!selection) return;
    persistSelection({...selection,reasoningLevel:value});
  };
  const status = submitting || restoring || job?.status === "running" ? "running" : error ? "error" : job?.status;
  const statusText = submitting ? "Menghubungkan AI…" : restoring ? "Memuat riset…" : job?.status === "running" ? connectionError ? "Menyambung kembali · proses AI tetap dipantau…" : `AI sedang bekerja · ${job.progress}` : error ? "Perlu perhatian · lihat pesan di atas" : job?.status === "complete" ? job.stage === "trend" ? "Selesai · output sementara siap ditinjau" : "Selesai · lanjutkan menjawab pertanyaan" : job?.status === "cancelled" ? "Dihentikan · Anda dapat mencoba kembali" : job?.status === "error" ? "Proses gagal · Anda dapat mencoba kembali" : "";
  const bottomStatus = status ? <ResearchStatus status={status}>{statusText}</ResearchStatus> : null;
  const labelFor=(tab:Panel) => sources[tab]?.title ?? PANEL_NAMES[tab] ?? "Browser sumber";
  return <div className="app vera-research-demo flex flex-col h-full min-h-0" onClickCapture={event => {
    const link=(event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!link || link.dataset.externalBrowser) return;
    const url=researchBrowserUrl(link.href);if (!url) return;
    event.preventDefault();openSource(url,link.textContent?.trim() || "Browser sumber");
  }}>
    <VeraAppHeader><div className="vera-research-context ms-auto flex min-w-0 items-center">{controls}</div></VeraAppHeader>
    <div className="workspace-tools vera-workspace-toolbar shrink-0 border-b border-border bg-background px-6 py-2.5"><nav aria-label="Workspace" className="flex flex-wrap items-center gap-2"><span className="vera-toolbar-caption me-auto text-xs font-medium text-subtext">Workspace</span><Button title="Lihat dokumen dan sumber penelitian" variant="ghost" className="vera-tool-button" active={activeGroup === "files"} aria-pressed={activeGroup === "files"} onClick={() => toggleGroup("files")}><FolderOpen size={16} />{m.vera_file()}</Button><Button title="Tinjau hasil dan grafik penelitian" variant="ghost" className="vera-tool-button" active={activeGroup === "output"} aria-pressed={activeGroup === "output"} onClick={() => toggleGroup("output")}><Package size={16} />{m.vera_output()}</Button><Button title="Diskusikan fokus dan sumber dengan AI" variant="ghost" className="vera-tool-button" active={activeGroup === "assistence"} aria-pressed={activeGroup === "assistence"} onClick={() => toggleGroup("assistence")}><MessagesSquare size={16} />Side chat</Button><Button title="Buka alamat sumber di dalam VERA" variant="ghost" className="vera-tool-button" active={activeGroup === "browser"} aria-pressed={activeGroup === "browser"} onClick={() => toggleGroup("browser")}><Globe size={16} />Browser</Button></nav></div>
    <div className="workspace-body app-body flex flex-1 min-h-0">
      <aside id="vera-sidebar" className={`session-rail flex flex-col shrink-0 min-h-0 ${railOpen ? "is-expanded" : "is-collapsed"}`}>
        <RailHeader sidebarOpen={railOpen} onToggleSidebar={() => setRailOpen(v => !v)} />
        <div className="rail-section-head flex items-center gap-2 px-4 py-3" title={folder.name}>
          <FolderOpen className="rail-section-icon" size={16} aria-hidden="true" />
          <h2 className="rail-section-label text-sm font-medium text-subtext m-0">Tahapan riset</h2>
        </div>
        <div className="vera-demo-rail-content flex-1 min-h-0 overflow-y-auto px-3">
          {railOpen && <><div className="flex items-center gap-2 text-sm font-medium py-2"><FolderOpen className="shrink-0" size={16} /><span className="truncate" title={folder.name}>{folder.name}</span></div><p className="text-xs text-subtext leading-relaxed">Ikuti tiga langkah berikut. Tahap berikutnya terbuka setelah jawaban Anda ditinjau.</p></>}
          <ol className="vera-demo-stages" aria-label="Tahapan riset">
            {STAGES.map((label,index) => {
              const StageIcon=[FileText,MessagesSquare,Package][index];
              return <li key={label} className={index === currentStage ? "active" : ""} aria-current={index === currentStage ? "step" : undefined}>
                <button type="button" className="vera-stage-link" aria-label={`${index+1}. ${label}${index > currentStage ? ", belum tersedia" : ""}`} title={`${index+1}. ${label}`} disabled={index > currentStage} onClick={() => {
                  if (index === 2) {openPanel("output");return;}
                  document.getElementById(index === 0 ? "vera-focus-message" : "vera-refine-message")?.scrollIntoView({block:"start"});
                  if (index === 0 && phase === "focus") fieldInput.current?.focus();
                  if (index === 1 && phase === "refine") contextInput.current?.focus();
                }}>
                  <span className="vera-demo-stage-number">{railOpen ? index < currentStage ? <Check size={13} /> : index+1 : <StageIcon size={17} />}</span>
                  <span className="rail-nav-label">{label}</span>
                </button>
              </li>;
            })}
          </ol>
          <Button variant="ghost" onClick={reset} disabled={busy} className="vera-sidebar-action mt-3" aria-label="Mulai riset baru" title="Mulai riset baru"><span className="vera-sidebar-action-icon"><RotateCcw size={17} /></span><span className="rail-nav-label">Mulai riset baru</span></Button>
        </div>
        <div className={`workspace-model-settings shrink-0 border-t border-border-variant ${railOpen ? "px-3 py-2.5" : "flex justify-center px-2 py-2"}`}>
          {railOpen && <div className="px-1 pb-1.5 text-xs font-medium text-subtext">Model & tingkat usaha</div>}
          <ModelPicker value={selection} onSelect={persistSelection} reasoningChoices={selectedHarness?.agentReady ? reasoning.choices : []} defaultReasoningId={reasoning.defaultId} onSelectReasoning={changeReasoning} showServiceTier={false} disabled={busy || sideBusy || harnesses.length === 0} compact={!railOpen} className={railOpen ? "w-full justify-between" : "mx-auto"} modelHeading="Model AI" effortHeading="Tingkat usaha" helpText="Satu setelan untuk percakapan utama dan side chat. Tingkat usaha yang lebih tinggi membantu analisis mendalam, tetapi dapat memerlukan waktu lebih lama." />
          {railOpen && <div className="px-1 pt-1 text-xs text-subtext">{busy || sideBusy ? "Model dapat diganti setelah proses AI selesai." : "Bisa diganti di folder ini. Berlaku untuk proses berikutnya & side chat."}</div>}
        </div>
        <div className="workspace-home p-3"><Button variant="ghost" onClick={showLandingPage} className="workspace-home-button vera-sidebar-action" aria-label="Kembali ke beranda" title="Kembali ke beranda"><span className="vera-sidebar-action-icon"><Home size={17} /></span><span className="rail-nav-label">Kembali ke beranda</span></Button></div>
      </aside>
      <main className="chat-pane vera-demo-chat flex flex-1 flex-col min-w-0 min-h-0 bg-background border border-border rounded-lg">
        <header className="chat-header flex flex-wrap items-center gap-2 border-b border-border px-6 py-4 shrink-0"><h1 className="m-0 text-base font-medium">Menemukan arah penelitian</h1><span className="vera-demo-badge text-xs">AI & sumber langsung</span></header>
        <div className="vera-demo-conversation flex-1 min-h-0 overflow-y-auto" ref={transcript} role="log" aria-label="Percakapan riset" aria-live="polite">
          <p className="vera-demo-disclosure">AI memakai jawaban Anda untuk merumuskan pertanyaan dan pencarian akademik. Output berisi sumber nyata, query, dan batas korpus. Analisis metadata/abstrak belum menggantikan pembacaan artikel lengkap.</p>
          <article id="vera-focus-message" className="vera-demo-message"><span className="vera-demo-speaker">VERA</span><h2>Kita mulai dari rasa ingin tahu Anda.</h2><p>Saya membantu memperjelas pertanyaan penelitian dan membaca pola bukti. Pilihan serta alasan penelitian tetap berasal dari Anda.</p><p><strong>Bidang apa yang ingin Anda teliti, dan fokus awal apa yang menarik bagi Anda?</strong></p></article>
          {questions && <><article className="vera-demo-message vera-demo-student"><span className="vera-demo-speaker">Anda</span><p><strong>Bidang:</strong> {brief.field}</p><p><strong>Fokus awal:</strong> {brief.focus}</p></article><article id="vera-refine-message" className="vera-demo-message"><span className="vera-demo-speaker">Koordinator AI</span><h2>Mari memperjelas fokus tersebut.</h2><p>{questions.interpretation}</p><ol><li>{questions.contextQuestion}</li><li>{questions.reasonQuestion}</li></ol></article></>}
          {job?.stage === "trend" && <article className="vera-demo-message vera-demo-student"><span className="vera-demo-speaker">Anda</span><p><strong>Sasaran dan konteks:</strong> {brief.context}</p><p><strong>Tujuan dan alasan:</strong> {brief.reason}</p></article>}
          {job && <article className="vera-demo-message"><span className="vera-demo-speaker">Proses agent</span><p><ResearchStatus status={job.status}>{job.status === "running" ? "Sedang diproses" : job.status === "complete" ? "Selesai" : job.status === "cancelled" ? "Dihentikan" : "Proses gagal"} · {job.progress}</ResearchStatus></p><ul className="vera-agent-list text-xs">{job.agents.map((agent,index) => {
            const state=agent.status === "complete" ? "complete" : agent.status === "error" ? "error" : job.status === "running" ? "running" : "cancelled";
            return <li key={`${agent.sessionId}-${index}`}><ResearchStatus status={state}>{agent.role} · {state === "complete" ? "selesai" : state === "running" ? "sedang bekerja" : state === "error" ? "gagal" : "belum selesai"}</ResearchStatus></li>;
          })}</ul>{job.plan && <p className="text-xs text-subtext">Query: {job.plan.queries.join(" · ")}<br />Rentang: {job.plan.publishedAfter} – {job.plan.publishedBefore}</p>}{job.sources.map(source => <p key={source.source} className="text-xs text-subtext">{source.source}: {source.returned} hasil · {source.errors.length ? source.errors.join("; ") : "akses berhasil"}</p>)}</article>}
          {connectionError && <p role="status" className="text-sm text-accent-orange">{connectionError}</p>}
          {(error || job?.error || job?.status === "cancelled") && <p role="alert" className="text-sm text-accent-red">{error || job?.error || "Workflow dihentikan. Anda dapat mencoba kembali."}</p>}
          {phase === "complete" && job?.result && <article className="vera-demo-message"><span className="vera-demo-speaker">VERA · hasil yang ditinjau agent bukti</span><h2>Output tren sementara siap ditinjau.</h2><p>{job.result.papers?.length ?? 0} artikel unik ditemukan dalam korpus pencarian ini. Grafik menghitung artikel yang berhasil diambil, bukan seluruh publikasi database.</p>{job.result.claims?.length ? job.result.claims.map((claim,index) => <div key={index}><p>{claim.text}</p><ul className="text-xs text-subtext">{claim.ids.map(id => {const paper=job.result?.papers?.find(p => p.id === id);return paper ? <Paper key={id} paper={paper} /> : null;})}</ul></div>) : <p>Agent pemeriksa belum menerima klaim yang cukup didukung. Artikel dan grafik tetap tersedia untuk Anda tinjau.</p>}<p>{job.result.reflection}</p><ul className="text-xs text-subtext">{job.result.limitations?.map(limit => <li key={limit}>{limit}</li>)}</ul><div className="flex flex-wrap gap-2"><Button size="small" onClick={() => openPanel("output")}><Package size={14} />Lihat peta tren</Button><Button size="small" onClick={() => openPanel("files")}><FileText size={14} />Lihat catatan & sumber</Button></div><p className="text-xs text-subtext">Berhenti pada output sementara; belum dilanjutkan ke metodologi atau penulisan artikel.</p></article>}
        </div>
        <div className="vera-demo-composer shrink-0 border-t border-border">
          {phase === "complete" ? <form onSubmit={event => void submit(event)} className="flex flex-wrap items-center justify-between gap-3">{bottomStatus}<div className="flex gap-2"><Button type="submit" size="small" disabled={busy || !harness}><RotateCcw size={14} />Perbarui tren</Button><Button type="button" size="small" onClick={reset}><RotateCcw size={14} />Coba fokus lain</Button></div></form> : <form onSubmit={event => void submit(event)}><div className="vera-demo-input-grid">{phase === "focus" ? <><label>Bidang penelitian<input ref={fieldInput} value={brief.field} onChange={e => edit("field",e.target.value)} placeholder="Contoh: Pendidikan" required maxLength={120} disabled={busy} /></label><label>Fokus awal<input value={brief.focus} onChange={e => edit("focus",e.target.value)} placeholder="Contoh: Learning analytics" required maxLength={240} disabled={busy} /></label></> : <><label>Sasaran dan konteks<textarea ref={contextInput} value={brief.context} onChange={e => edit("context",e.target.value)} placeholder={questions?.contextQuestion ?? "Siapa atau apa yang diteliti?"} required maxLength={800} rows={2} disabled={busy} /></label><label>Tujuan dan alasan Anda<textarea value={brief.reason} onChange={e => edit("reason",e.target.value)} placeholder={questions?.reasonQuestion ?? "Apa tujuan dan alasan Anda?"} required maxLength={800} rows={2} disabled={busy} /></label></>}</div><div className="vera-research-model-row flex flex-wrap items-center justify-between gap-2 mt-3">{bottomStatus}{job?.status === "running" ? <Button type="button" size="small" className="vera-agent-stop" onClick={() => void cancelResearchJob(job.id).then(setJob).catch(problem => setError(String(problem)))}><Square size={13} />Hentikan</Button> : <Button type="submit" variant="primary" size="small" disabled={busy || !harness}><ArrowUp size={14} />{submitting ? "Menghubungkan AI…" : phase === "focus" ? "Kirim fokus" : "Tinjau tren penelitian"}</Button>}</div></form>}
        </div>
      </main>
      <aside className={`vera-demo-panel ${panel ? "flex" : "hidden"} flex-col min-h-0 bg-background border border-border rounded-lg`} aria-label="Panel pratinjau riset">
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0"><h2 className="m-0 text-sm font-medium">{activeGroup ? GROUP_NAMES[activeGroup] : "Pratinjau"}</h2><div className="flex items-center gap-1">{activeGroup === "browser" && <IconButton aria-label="Buka alamat browser" title="Buka alamat browser" onClick={openBrowser}><Globe size={16}/></IconButton>}<IconButton aria-label="Tutup panel" onClick={() => setPanel(null)}><X size={16} /></IconButton></div></header>
        <div ref={tabStrip} className="vera-preview-tabs shrink-0 border-b border-border" role="tablist" aria-label={`Tab ${activeGroup ? GROUP_NAMES[activeGroup] : "pratinjau"}`} onKeyDown={event => {
          if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
          if (!visibleTabs.length) return;
          const current=visibleTabs.indexOf(panel!);const index=event.key === "Home" ? 0 : event.key === "End" ? visibleTabs.length-1 : (current+(event.key === "ArrowRight" ? 1 : -1)+visibleTabs.length)%visibleTabs.length;
          event.preventDefault();openPanel(visibleTabs[index]);event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
        }}>
          {visibleTabs.map(tab => <div className="vera-preview-tab" key={tab} data-active={panel === tab}>
            <button type="button" role="tab" id={`research-tab-${tabs.indexOf(tab)}`} aria-controls={`research-panel-${tabs.indexOf(tab)}`} aria-selected={panel === tab} tabIndex={panel === tab ? 0 : -1} title={labelFor(tab)} onClick={() => openPanel(tab)}>{tab.startsWith("browser:") ? <Globe size={14} /> : tab === "assistence" ? <MessagesSquare size={14}/> : researchPanelGroup(tab) === "output" ? <Package size={14}/> : <FileText size={14} />}<span>{labelFor(tab)}</span></button>
            <IconButton aria-label={`Tutup tab ${labelFor(tab)}`} onClick={() => closeTab(tab)}><X size={13} /></IconButton>
          </div>)}
        </div>
        {tabs.map((tab,index) => ["notes","evidence","chart"].includes(tab) ? <div key={tab} id={`research-panel-${index}`} role="tabpanel" aria-labelledby={`research-tab-${index}`} hidden={panel !== tab} className="vera-file-preview vera-demo-panel-body overflow-y-auto min-h-0 flex-1 p-4">
          <div className="flex items-center justify-between gap-2 mb-3"><h3 className="m-0">{labelFor(tab)}</h3><IconButton aria-label={`Unduh ${labelFor(tab)}`} onClick={() => download(labelFor(tab),tab === "notes" ? notes : tab === "evidence" ? evidence : svg,tab === "notes" ? "text/markdown;charset=utf-8" : tab === "evidence" ? "text/csv;charset=utf-8" : "image/svg+xml")}><Download size={16} /></IconButton></div>
          {tab === "notes" ? <Md text={notes} /> : tab === "evidence" ? <ResearchEvidence job={job}/> : svg ? <><img className="vera-demo-chart w-full" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt="Peta publikasi dalam korpus pencarian" /><p className="text-xs text-subtext">Korpus terbatas, bukan seluruh publikasi. Tahun berjalan belum lengkap.</p></> : <p>Grafik tersedia setelah analisis sumber selesai.</p>}
        </div> : tab.startsWith("browser:") && sources[tab] ? <div key={tab} id={`research-panel-${index}`} role="tabpanel" aria-labelledby={`research-tab-${index}`} hidden={panel !== tab} className="vera-browser-tab flex flex-col flex-1 min-h-0"><ResearchBrowser url={sources[tab].url} title={sources[tab].title} paper={job?.result?.papers?.find(paper => paperUrl(paper) === sources[tab].url)} /></div> : null)}
        {tabs.includes("assistence") && <div id={`research-panel-${tabs.indexOf("assistence")}`} role="tabpanel" aria-labelledby={`research-tab-${tabs.indexOf("assistence")}`} className={`${panel === "assistence" ? "flex" : "hidden"} flex-col flex-1 min-h-0`}><ResearchAssistence key={`${sideGeneration}-${selectedHarness?.id ?? "unavailable"}`} job={job} brief={brief} harness={selectedHarness} model={model} reasoningLevel={reasoningLevel} onBusyChange={setSideBusy} /></div>}
        {(panel === "files" || panel === "output") && <div id={`research-panel-${tabs.indexOf(panel)}`} role="tabpanel" aria-labelledby={`research-tab-${tabs.indexOf(panel)}`} className="vera-demo-panel-body overflow-y-auto min-h-0 flex-1 p-4">{panel === "files" ? <><h3>Catatan fokus & sumber</h3>{job ? <><dl className="vera-demo-brief"><dt>Bidang</dt><dd>{brief.field}</dd><dt>Fokus</dt><dd>{brief.focus}</dd><dt>Konteks</dt><dd>{brief.context || "Belum dijawab"}</dd><dt>Tujuan dan alasan</dt><dd>{brief.reason || "Belum dijawab"}</dd></dl><div className="flex flex-wrap gap-2"><Button size="small" onClick={() => openPanel("notes")}><FileText size={14} />catatan-fokus-riset.md</Button><Button size="small" onClick={() => openPanel("evidence")}><FileText size={14} />bukti-pencarian.csv</Button>{svg && <Button size="small" onClick={() => openPanel("chart")}><FileText size={14} />peta-tren-riset.svg</Button>}</div><ul className="ps-4">{job.result?.papers?.map(paper => <Paper key={`${paper.source}-${paper.id}`} paper={paper} />)}</ul></> : <p>Catatan dan sumber akan tersedia setelah Anda mengirim fokus.</p>}</> : !svg ? <><h3>Output menunggu analisis sumber.</h3><p>Lengkapi fokus, konteks, dan alasan penelitian. Agent akan mencari sumber akademik, menyintesis, serta memeriksa dukungan bukti.</p></> : <><div className="flex justify-between items-center gap-2"><button type="button" className="text-sm font-medium" onClick={() => openPanel("chart")}>peta-tren-riset.svg · Buka pratinjau</button><IconButton aria-label="Unduh grafik SVG" onClick={() => download("peta-tren-riset.svg",svg,"image/svg+xml")}><Download size={16} /></IconButton></div><p className="vera-demo-output-notice text-xs">Korpus hasil pencarian · {job?.result?.retrievedAt ? new Date(job.result.retrievedAt).toLocaleString("id-ID") : ""}</p><figure className="m-0"><img className="vera-demo-chart w-full" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt="Jumlah artikel per tahun dalam korpus hasil pencarian akademik aktual" /><figcaption className="text-xs text-subtext mt-3">Jumlah dalam korpus terbatas, bukan total seluruh publikasi. Tahun berjalan belum lengkap.</figcaption></figure><h3 className="text-sm mt-4">Artikel terkait dengan sitasi tertinggi</h3><p className="text-xs text-subtext">Dipilih sub-agent berdasarkan metadata/abstrak; relevansi perlu ditinjau. Sitasi bukan ukuran mutu.</p><ol className="ps-4">{job?.result?.topPapers?.map(paper => <Paper key={`${paper.source}-${paper.id}`} paper={paper} />)}</ol><Button size="small" onClick={() => download("peta-tren-riset.svg",svg,"image/svg+xml")}><Download size={14} />Unduh grafik SVG</Button></>}</div>}
      </aside>
    </div>
  </div>;
}
