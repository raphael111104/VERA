import type { ResearchBrief } from "./researchDemo";

export interface ResearchPaper { source: string; id: string; title: string; abstract: string; publicationDate?: string | null; citations?: number | null }
export interface ResearchResult {
  interpretation?: string; contextQuestion?: string; reasonQuestion?: string;
  claims?: { text: string; ids: string[] }[]; reflection?: string; limitations?: string[];
  papers?: ResearchPaper[]; years?: { year: string; count: number }[]; topPapers?: ResearchPaper[]; relevantPaperIds?: string[]; retrievedAt?: number;
}
export interface ResearchJob {
  id: string; stage: "focus" | "trend"; status: "running" | "complete" | "error" | "cancelled";
  brief: ResearchBrief; progress: string; rootSessionId: string; harness: string; model: string | null; reasoningLevel?: string | null;
  agents: { role: string; sessionId: string; parentSessionId?: string | null; status: string }[];
  sources: { source: string; queries: string[]; retrievedAt: number; returned: number; errors: string[] }[];
  result: ResearchResult | null; error?: string; updatedAt: number;
  previousJobId?: string | null; focusQuestions?: ResearchResult | null;
  plan?: { queries: string[]; sources: string[]; rationale: string; publishedAfter: string; publishedBefore: string };
}
export function paperUrl(paper: ResearchPaper): string | undefined {
  const id = paper.id.replace(/^https?:\/\/doi\.org\//, "").replace(/^doi:/, "");
  if (/^10\.\d{4,9}\/[^\s<>]+$/.test(id)) return `https://doi.org/${id}`;
  if (paper.source === "pubmed" && /^\d+$/.test(id)) return `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
  const work = id.replace(/^https:\/\/openalex\.org\//, "");
  if (/^W\d+$/.test(work)) return `https://openalex.org/${work}`;
  if (paper.source === "alphaxiv" && /^(\d{4}\.\d{4,5}|[a-z.-]+\/\d{7})(v\d+)?$/i.test(id)) return `https://arxiv.org/abs/${id}`;
  return undefined;
}
const xml = (text: string) => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
export function researchChart(job: ResearchJob): string {
  if (job.stage !== "trend" || job.status !== "complete" || !job.result?.papers?.length) return "";
  const years = job.result.years ?? [];
  const max = Math.max(1, ...years.map(y => y.count));
  const columns = years.map(({ year, count }, index) => {
    const x = 60 + index * 92, height = count / max * 170;
    return `<rect x="${x}" y="${320-height}" width="52" height="${height}" rx="3" fill="#d40016"/><text x="${x+26}" y="${308-height}" text-anchor="middle">${count}</text><text x="${x+26}" y="346" text-anchor="middle">${xml(year)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="435" viewBox="0 0 600 435" role="img"><title>Publikasi per tahun dalam korpus hasil pencarian VERA</title><rect width="600" height="435" fill="white"/><g font-family="Arial, sans-serif" font-size="14" fill="#263448"><text x="28" y="36" font-size="20" font-weight="bold">Peta publikasi dalam korpus hasil pencarian</text><text x="28" y="62">${xml(job.brief.focus.slice(0,65))}</text><text x="28" y="87">${job.result.papers.length} artikel unik · ${xml(job.plan?.publishedAfter ?? "")} – ${xml(job.plan?.publishedBefore ?? "")}</text>${columns}<text x="28" y="384" font-size="12">Korpus terbatas, bukan jumlah seluruh publikasi dalam database.</text><text x="28" y="408" font-size="12">Tahun berjalan belum lengkap; cakupan metadata/abstrak.</text></g></svg>`;
}
export function researchNotes(job: ResearchJob): string {
  const brief = job.brief;
  return [`# Catatan fokus penelitian`, `Bidang: ${brief.field}`, `Fokus: ${brief.focus}`, `Konteks: ${brief.context}`, `Tujuan dan alasan: ${brief.reason}`,
    `Model: ${job.harness} / ${job.model ?? "default"}`, `Tanggal pencarian: ${job.result?.retrievedAt ? new Date(job.result.retrievedAt).toISOString() : "belum selesai"}`,
    `## Query dan sumber`, ...job.sources.map(s => `- ${s.source}: ${s.queries.join("; ")} (${s.returned} hasil; ${s.errors.join("; ") || "tanpa error"})`),
    `## Temuan sementara`, ...(job.result?.claims ?? []).map(c => `- ${c.text}\n  Sumber: ${c.ids.join("; ")}`),
    `## Batas bukti`, ...(job.result?.limitations ?? []).map(l => `- ${l}`),
    `## Artikel dalam korpus`, ...(job.result?.papers ?? []).map(p => `- ${p.title} (${p.publicationDate ?? "tanggal tidak tersedia"}) · ${paperUrl(p) ?? p.id}`),
    `\nOutput sementara; belum dilanjutkan ke metodologi atau penulisan artikel.`].join("\n\n");
}


export const EVIDENCE_COLUMNS = ["jenis_rekaman","id_proses","status_proses","bidang","fokus","sasaran_konteks","tujuan_alasan","agent","model_ai","tingkat_usaha","sumber","id_artikel","judul","tanggal_publikasi","jumlah_sitasi","url_sumber","abstrak","ditandai_relevan","klaim_terkait","query_pencarian","waktu_pengambilan_utc","jumlah_hasil_sumber","error_pencarian","rentang_awal","rentang_akhir","batas_bukti"] as const;
export type EvidenceRow = Record<typeof EVIDENCE_COLUMNS[number], string | number>;
function timestamp(value: number | undefined): string {
  return value != null && Number.isFinite(value) ? new Date(value).toISOString() : "";
}
export function researchEvidenceRows(job: ResearchJob): EvidenceRow[] {
  const base = Object.fromEntries(EVIDENCE_COLUMNS.map(key => [key, ""])) as EvidenceRow;
  Object.assign(base,{id_proses:job.id,status_proses:job.status,bidang:job.brief.field,fokus:job.brief.focus,sasaran_konteks:job.brief.context,tujuan_alasan:job.brief.reason,agent:job.harness,model_ai:job.model ?? "default",tingkat_usaha:job.reasoningLevel ?? "default",rentang_awal:job.plan?.publishedAfter ?? "",rentang_akhir:job.plan?.publishedBefore ?? "",batas_bukti:(job.result?.limitations ?? []).join("\n")});
  // Search rows retain failures and zero-hit sources, which have no article row.
  const searches = job.sources.map(source => ({...base,jenis_rekaman:"pencarian",sumber:source.source,query_pencarian:source.queries.join("\n"),waktu_pengambilan_utc:timestamp(source.retrievedAt),jumlah_hasil_sumber:source.returned,error_pencarian:source.errors.join("\n")}));
  const papers = (job.result?.papers ?? []).map(paper => ({...base,jenis_rekaman:"artikel",sumber:paper.source,id_artikel:paper.id,judul:paper.title,tanggal_publikasi:paper.publicationDate ?? "",jumlah_sitasi:paper.citations ?? "",url_sumber:paperUrl(paper) ?? "",abstrak:paper.abstract,ditandai_relevan:job.result?.relevantPaperIds?.includes(paper.id) ? "ya" : "",klaim_terkait:(job.result?.claims ?? []).filter(claim => claim.ids.includes(paper.id)).map(claim => claim.text).join("\n"),waktu_pengambilan_utc:timestamp(job.result?.retrievedAt)}));
  return [...searches,...papers];
}
/** RFC 4180, UTF-8 BOM for Excel; metadata must never execute as a formula. */
export function researchEvidenceCsv(job: ResearchJob): string {
  const cell = (value: string | number) => {
    let text = String(value);
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"','""')}"`;
  };
  return "\uFEFF" + [EVIDENCE_COLUMNS.map(cell).join(","),...researchEvidenceRows(job).map(row => EVIDENCE_COLUMNS.map(key => cell(row[key])).join(","))].join("\r\n") + "\r\n";
}
