import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, FolderOpen, Plus, Save, X } from "lucide-react";
import { getResearchFolders, saveResearchFolder } from "../api";
import { ResearchFolderWriter, type ResearchFolder } from "../researchFolders";
import { RESEARCH_DEMO_NAME } from "../researchDemo";
import { Button, IconButton } from "./ui";

const ACTIVE_KEY = "vera:research:active-folder:v1";
const LEGACY_KEY = "vera:research-demo:job:v2";
const LEGACY_FOLDER = "00000000-0000-4000-8000-000000000001";
export const folderJobKey = (id: string) => `vera:research:folder:${id}:job`;
function stored(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function remember(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} }
export type FolderActions = { folder: ResearchFolder; save: (patch: Partial<ResearchFolder>) => Promise<void>; controls: ReactNode; newResearch: () => void };

export function ResearchFolders({children}: {children: (actions: FolderActions) => ReactNode}) {
  const [folders, setFolders] = useState<ResearchFolder[]>([]);
  const records = useRef<ResearchFolder[]>([]);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [create, setCreate] = useState(true);
  const [renameId,setRenameId] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(0);
  const writer = useRef(new ResearchFolderWriter(saveResearchFolder));
  const dialog = useRef<HTMLDialogElement>(null);
  const unloadGuard = useRef<((event: BeforeUnloadEvent) => void) | null>(null);
  const replace = (next: ResearchFolder[]) => {records.current = next; setFolders(next);};
  const select = (id: string) => {setActive(id); remember(ACTIVE_KEY,id); setOpen(false);};
  useEffect(() => {
    let live = true;
    setLoading(true);setError("");
    void getResearchFolders().then(async values => {
      const legacy = stored(LEGACY_KEY);
      if (!values.length || (legacy && !values.some(item => item.jobId === legacy || item.id === legacy))) {
        const initial: ResearchFolder = {id:legacy || LEGACY_FOLDER,name:values.length ? "Riset sebelumnya" : RESEARCH_DEMO_NAME,brief:{field:"",focus:"",context:"",reason:""},jobId:legacy,selection:null,revision:0};
        // A second window may create the same migration record while this one starts.
        try {values = [...values,await saveResearchFolder(initial)];} catch (problem) {values = await getResearchFolders();if (!values.some(item => item.id === initial.id)) throw problem;}
      }
      if (!live) return;
      replace(values);select(values.find(item => item.id === stored(ACTIVE_KEY))?.id ?? values[0].id);
      try {localStorage.removeItem(LEGACY_KEY);} catch {}
    }).catch(problem => live && setError(String(problem))).finally(() => live && setLoading(false));
    return () => {live = false;};
  },[reload]);
  useEffect(() => {
    if (open) dialog.current?.showModal(); else dialog.current?.close();
  },[open]);
  useEffect(() => {
    if (!saving && !error) return;
    const guard = (event: BeforeUnloadEvent) => {event.preventDefault();};
    unloadGuard.current=guard;
    window.addEventListener("beforeunload",guard);return () => {window.removeEventListener("beforeunload",guard);unloadGuard.current=null;};
  },[saving,error]);
  const reloadFolders = () => {
    // An explicit reload resolves a revision conflict; do not trap the user
    // behind the protection intended for accidental navigation.
    if (unloadGuard.current) window.removeEventListener("beforeunload",unloadGuard.current);
    window.location.reload();
  };
  const folder = folders.find(item => item.id === active);
  const persist = async (id: string, patch: Partial<ResearchFolder>) => {
    const current = records.current.find(item => item.id === id);
    if (!current) throw new Error("Folder riset tidak ditemukan.");
    const next = {...current,...patch,id:current.id};
    replace(records.current.map(item => item.id === id ? next : item));
    setSaving(count => count+1);
    try {await writer.current.enqueue(next);setError("");}
    catch (problem) {setError(`Folder belum tersimpan: ${String(problem)}`);throw problem;}
    finally {setSaving(count => count-1);}
  };
  const switchFolder = async (id: string) => {
    setWorking(true);
    try {await writer.current.flush(active);select(id);setError("");}
    catch (problem) {setError(String(problem));} finally {setWorking(false);}
  };
  const newResearch = () => {setCreate(true);setName("");setOpen(true);};
  const controls = <>
    <Button variant="ghost" className="vera-folder-trigger min-w-0" onClick={() => {setCreate(true);setName("");setOpen(true);}} aria-haspopup="dialog" aria-expanded={open} aria-label={`Kelola folder riset: ${folder?.name ?? "Memuat"}`}>
      <FolderOpen className="shrink-0" size={18}/><span className="vera-folder-trigger-copy min-w-0 text-start"><span className="block text-xs text-subtext">Folder riset</span><span className="block truncate text-sm font-medium" title={folder?.name}>{folder?.name}</span></span><ChevronDown className="shrink-0" size={15}/>
    </Button>
    <dialog ref={dialog} className="vera-folder-dialog" aria-labelledby="research-folders-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <header className="flex items-center justify-between gap-3 border-b border-border p-4"><h2 id="research-folders-title" className="m-0 text-base">Folder riset</h2><IconButton aria-label="Tutup pengelola folder" onClick={() => setOpen(false)}><X size={17}/></IconButton></header>
      <div className="p-4"><p className="m-0 mb-3 text-sm text-subtext">Setiap folder menyimpan fokus, jawaban, model AI, dan hasil risetnya sendiri.</p>
        <ul className="vera-folder-list m-0 p-0" aria-label="Daftar folder riset">{folders.map(item => <li key={item.id} className="flex items-center gap-2">
          <Button variant="ghost" className="min-w-0 flex-1 justify-start" active={active === item.id} aria-pressed={active === item.id} disabled={working} onClick={() => void switchFolder(item.id)}><FolderOpen size={16}/><span className="truncate">{item.name}</span>{active === item.id && <span className="ms-auto text-xs text-primary">Aktif</span>}</Button>
          <Button size="small" variant="ghost" disabled={working} aria-label={`Ubah nama ${item.name}`} onClick={() => {setCreate(false);setName(item.name);setRenameId(item.id);}}>Ubah nama</Button>
        </li>)}</ul>
        <form className="mt-4 border-t border-border pt-4" onSubmit={event => {
          event.preventDefault();if (working || !name.trim()) return;
          setWorking(true);setError("");
          void (async () => {
            await writer.current.flush(active);
            if (create) {
              const next = await saveResearchFolder({id:crypto.randomUUID(),name:name.trim(),brief:{field:"",focus:"",context:"",reason:""},jobId:null,selection:folder?.selection ?? null,revision:0});
              replace([...records.current,next]);select(next.id);
            } else {await persist(renameId,{name:name.trim()});setCreate(true);setName("");}
          })().catch(problem => setError(String(problem))).finally(() => setWorking(false));
        }}>
          <label className="block text-sm font-medium">{create ? "Nama folder baru" : "Nama folder"}<input className="mt-2 w-full" aria-label={create ? "Nama folder baru" : "Nama folder"} value={name} onChange={event => setName(event.target.value)} required maxLength={100} disabled={working} autoFocus/></label>
          <div className="mt-3 flex items-center gap-2"><Button variant="primary" size="small" type="submit" disabled={working || !name.trim()}>{create ? <Plus size={15}/> : <Save size={15}/>}{working ? "Menyimpan…" : create ? "Buat folder riset" : "Simpan nama"}</Button>{!create && <Button size="small" variant="ghost" onClick={() => {setCreate(true);setName("");}}>Batal</Button>}</div>
        </form>
        {error && <p role="alert" className="text-sm text-accent-red">{error}</p>}
      </div>
    </dialog>
  </>;
  if (loading) return <div className="p-6" role="status">Memuat folder riset…</div>;
  if (!folder) return <div className="p-6"><p role="alert">{error || "Folder riset belum dapat dibuka."}</p><Button onClick={() => setReload(value => value+1)}>Coba lagi</Button></div>;
  return <>{error && <div className="vera-folder-save-error p-2 text-sm text-accent-red" role="alert">{error}{error.includes("Folder berubah") ? <Button size="small" disabled={!!saving} onClick={reloadFolders} title="Muat ulang data tersimpan. Perubahan yang belum tersimpan akan hilang.">Muat ulang folder</Button> : <Button size="small" onClick={() => void persist(active,{}).catch(() => {})}>Coba simpan lagi</Button>}</div>}{children({folder,save:patch => persist(active,patch),controls,newResearch})}</>;
}
