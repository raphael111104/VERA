import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Globe, RotateCcw } from "lucide-react";
import { Button, ButtonLink, IconButton } from "./ui";
import { researchBrowserUrl, researchMetadataText } from "../researchBrowser";
import type { ResearchPaper } from "../researchWorkflow";

export function ResearchBrowser({ url, title, paper }: { url: string; title: string; paper?: ResearchPaper }) {
  const sourceUrl = researchBrowserUrl(url);
  const [history, setHistory] = useState([researchBrowserUrl(url) ?? ""]);
  const [index, setIndex] = useState(0);
  const [address, setAddress] = useState(researchBrowserUrl(url) ?? "");
  const [generation, setGeneration] = useState(0);
  const [error, setError] = useState("");
  const current = history[index];
  const navigate = (event: FormEvent) => {
    event.preventDefault();
    const next = researchBrowserUrl(address);
    if (!next) { setError("Masukkan alamat jurnal, URL paper, atau DOI yang valid tanpa kredensial."); return; }
    setHistory([...history.slice(0, index + 1), next]); setIndex(index + 1); setAddress(next); setError("");
  };
  const move = (next: number) => { setIndex(next); setAddress(history[next]); setError(""); };
  if (paper) return <div className="vera-source-browser flex flex-col flex-1 min-h-0">
    <div className="flex shrink-0 items-center gap-2 p-3 border-b border-border">{sourceUrl && <ButtonLink href={sourceUrl} target="_blank" rel="noopener noreferrer" data-external-browser="true" size="small"><ExternalLink size={15}/>Buka sumber di browser eksternal</ButtonLink>}</div>
    <article className="vera-demo-panel-body flex-1 min-h-0 overflow-y-auto p-4">
      <h3 className="mt-0">{researchMetadataText(paper.title)}</h3>
      <dl className="vera-paper-metadata text-sm"><dt>Database</dt><dd>{paper.source}</dd><dt>Identitas artikel</dt><dd className="break-words">{paper.id}</dd><dt>Tanggal publikasi</dt><dd>{paper.publicationDate ?? "Tidak tersedia"}</dd><dt>Jumlah sitasi</dt><dd>{paper.citations ?? "Tidak tersedia"}</dd></dl>
      <h4>Abstrak</h4><p className="whitespace-pre-wrap">{researchMetadataText(paper.abstract) || "Abstrak tidak tersedia dalam hasil pencarian."}</p>
      <p className="text-xs text-subtext">Metadata dan abstrak dari hasil pencarian. Tampilan ini belum mencakup teks lengkap atau penilaian mutu artikel.</p>
    </article>
  </div>;
  return <div className="vera-source-browser flex flex-col flex-1 min-h-0">
    <form onSubmit={navigate} className="vera-browser-address flex items-center gap-1 p-2 border-b border-border">
      <IconButton aria-label="Alamat sebelumnya" disabled={index === 0} onClick={() => move(index - 1)}><ArrowLeft size={15} /></IconButton>
      <IconButton aria-label="Alamat berikutnya" disabled={index === history.length - 1} onClick={() => move(index + 1)}><ArrowRight size={15} /></IconButton>
      <IconButton aria-label="Muat ulang sumber" onClick={() => setGeneration(v => v + 1)}><RotateCcw size={15} /></IconButton>
      <input aria-label="Alamat sumber" type="text" inputMode="url" value={address} placeholder="Alamat jurnal atau DOI…" onChange={event => setAddress(event.target.value)} required className="min-w-0 flex-1" />
      <Button size="small" type="submit" aria-label="Buka alamat sumber"><Globe size={15} /></Button>
    </form>
    {error && <p className="text-sm text-accent-red px-3" role="alert">{error}</p>}
    {current && <div className="vera-browser-notice text-xs px-3 py-2 border-b border-border">
      <ButtonLink href={current} target="_blank" rel="noopener noreferrer" data-external-browser="true" size="small"><ExternalLink size={14} />Buka halaman asli</ButtonLink>
      <p className="mb-0 mt-2 leading-relaxed">Jurnal dan paper yang membatasi pratinjau tetap dapat dibuka lewat tombol di atas. Halaman asli memakai tab browser penuh, termasuk navigasi, login penerbit dan unduhan PDF.</p>
    </div>}
    {!current ? <p className="p-4 text-sm text-subtext">Masukkan alamat jurnal, URL paper atau DOI. Pratinjau akan muncul di panel ini; tombol Buka halaman asli tersedia untuk situs yang membatasi tampilan tertanam.</p> : <iframe key={`${current}-${generation}`} src={current} title={`Sumber: ${title}`} className="vera-browser-frame flex-1 min-h-0 w-full border-0" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" />}
  </div>;
}
