import type { ResearchJob } from "../researchWorkflow";
import { researchEvidenceRows } from "../researchWorkflow";

export function ResearchEvidence({job}:{job:ResearchJob|null}) {
  if (!job) return <p>Bukti pencarian tersedia setelah proses dimulai.</p>;
  const rows=researchEvidenceRows(job);
  const papers=rows.filter(row => row.jenis_rekaman === "artikel");
  return <div className="vera-evidence-preview">
    <p className="text-sm text-subtext">{papers.length} artikel · {job.sources.length} catatan pencarian. CSV memuat metadata artikel, query, waktu pengambilan, error sumber, klaim terkait, dan model yang menghasilkan bukti ini.</p>
    <p className="text-xs text-subtext">Model proses ini: {job.harness} / {job.model ?? "default"}. Data berasal dari metadata dan abstrak; belum merupakan penilaian teks lengkap.</p>
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel metadata bukti pencarian">
      <table className="vera-demo-data-table vera-evidence-table w-full text-sm"><caption className="text-start font-medium mb-2">Artikel dalam korpus pencarian</caption><thead><tr><th scope="col">Artikel</th><th scope="col">Tanggal</th><th scope="col">Sitasi</th></tr></thead><tbody>{papers.map((row,index) => <tr key={index}><td><span className="font-medium">{row.judul}</span><p className="m-0 mt-1 text-xs text-subtext">{row.sumber} · {row.id_artikel}</p>{row.abstrak && <details className="mt-2 text-xs"><summary>Abstrak & klaim terkait</summary><p className="whitespace-pre-wrap">{row.abstrak}</p>{row.klaim_terkait && <p className="whitespace-pre-wrap">{row.klaim_terkait}</p>}</details>}</td><td>{row.tanggal_publikasi || "Tidak tersedia"}</td><td>{row.jumlah_sitasi === "" ? "Tidak tersedia" : row.jumlah_sitasi}</td></tr>)}</tbody></table>
    </div>
    {!papers.length && <p className="text-sm text-subtext">Belum ada artikel dalam korpus. Catatan pencarian tetap disertakan dalam CSV.</p>}
    <h4 className="text-sm mt-4">Catatan pencarian sumber</h4>
    {job.sources.map((source,index) => <details key={index} className="text-sm mb-3"><summary>{source.source} · {source.returned} hasil{source.errors.length ? " · ada error" : ""}</summary><p className="whitespace-pre-wrap">{source.queries.join("\n")}</p><p className="text-xs text-subtext">{new Date(source.retrievedAt).toLocaleString("id-ID")}</p>{source.errors.map((error,i) => <p key={i} className="text-accent-red">{error}</p>)}</details>)}
  </div>;
}
