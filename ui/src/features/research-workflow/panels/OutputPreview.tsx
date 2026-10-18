import { createElement, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "../../../components/ui";
import { Md } from "../../../components/Md";
import { researchBrowserUrl } from "../../../researchBrowser";
import { readCsv } from "../outputs";

export interface PreviewDocument { name: string; text: string; blob?: Blob }

/** Only semantic Word content is rendered; converted HTML attributes never reach the DOM. */
function wordNodes(html: string): ReactNode {
  const body = new DOMParser().parseFromString(html, "text/html").body;
  const allowed = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "u", "s", "sup", "sub", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "blockquote", "br"]);
  const render = (node: ChildNode, key: number): ReactNode => {
    if (node.nodeType === 3) return node.textContent;
    if (!(node instanceof Element)) return null;
    const tag = node.tagName.toLowerCase();
    if (["script", "style", "iframe", "object", "embed", "img"].includes(tag)) return null;
    const children = [...node.childNodes].map(render);
    if (tag === "a") {
      const href = researchBrowserUrl(node.getAttribute("href") ?? "");
      return href ? <a key={key} href={href} target="_blank" rel="noopener noreferrer">{children}</a> : children;
    }
    return allowed.has(tag) ? createElement(tag, { key }, ...children) : children;
  };
  return [...body.childNodes].map(render);
}

function CsvPreview({ text }: { text: string }) {
  const [filter, setFilter] = useState(""), [page, setPage] = useState(0);
  const parsed = useMemo(() => { try { return { rows: readCsv(text), error: "" }; } catch (e) { return { rows: [], error: String(e) }; } }, [text]);
  if (parsed.error) return <p role="alert" className="text-sm text-accent-red">{parsed.error}</p>;
  const [header = [], ...data] = parsed.rows;
  const rows = filter ? data.filter((row) => row.some((cell) => cell.toLowerCase().includes(filter.toLowerCase()))) : data;
  return <div>
    <label className="mb-3 block text-xs font-medium">Cari isi tabel
      <input className="mt-1 w-full" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0); }} />
    </label>
    <p className="text-xs text-subtext">{rows.length} dari {data.length} baris · {header.length} kolom</p>
    <div className="max-h-96 overflow-auto rounded-md border border-border">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-surface"><tr>{header.map((h, i) => <th key={i} className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold" scope="col">{h || `Kolom ${i + 1}`}</th>)}</tr></thead>
        <tbody>{rows.slice(page * 25, (page + 1) * 25).map((row, i) => <tr key={i} className="even:bg-surface">{Array.from({ length: Math.max(header.length, row.length) }, (_, j) => <td key={j} className="min-w-28 max-w-80 whitespace-pre-wrap break-words border-b border-border px-3 py-2 align-top">{row[j] ?? ""}</td>)}</tr>)}</tbody>
      </table>
      {!rows.length && <p className="p-3 text-sm text-subtext">{data.length ? "Tidak ada baris yang cocok." : "Belum ada data. Header kolom tetap tersedia untuk diperiksa."}</p>}
    </div>
    <div className="mt-3 flex items-center justify-between gap-2">
      <Button size="small" disabled={!page} onClick={() => setPage(page - 1)}>Sebelumnya</Button>
      <span className="text-xs text-subtext">{page + 1} / {Math.max(1, Math.ceil(rows.length / 25))}</span>
      <Button size="small" disabled={(page + 1) * 25 >= rows.length} onClick={() => setPage(page + 1)}>Berikutnya</Button>
    </div>
  </div>;
}

export function OutputPreview({ document, raw, openBrowser }: { document: PreviewDocument; raw: boolean; openBrowser: (url: string) => void }) {
  const [word, setWord] = useState<{ content: ReactNode; error: string } | null>(null);
  useEffect(() => {
    let live = true;
    setWord(null);
    if (document.blob && /\.docx$/i.test(document.name)) void (async () => {
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ arrayBuffer: await document.blob!.arrayBuffer() }, { externalFileAccess: false });
      const content = wordNodes(result.value);
      if (live) setWord({ content, error: "" });
    })().catch((e) => live && setWord({ content: null, error: `Dokumen belum dapat ditinjau: ${String(e)}` }));
    return () => { live = false; };
  }, [document]);
  if (raw && !(document.blob && /\.docx$/i.test(document.name))) return <pre className="whitespace-pre-wrap break-words text-xs">{document.text}</pre>;
  if (/\.csv$/i.test(document.name)) return <CsvPreview key={document.name + document.text} text={document.text} />;
  const isWord = /\.docx$/i.test(document.name);
  return <div onClick={(event) => {
    const link = (event.target as Element).closest?.("a[href]");
    const url = researchBrowserUrl(link?.getAttribute("href") ?? "");
    if (url && !event.ctrlKey && !event.metaKey && !event.shiftKey) { event.preventDefault(); openBrowser(url); }
  }}>
    {isWord && <p className="mb-4 text-xs leading-relaxed text-subtext">Pratinjau isi Word. Tata letak halaman, gambar dan detail format akhir diperiksa pada berkas DOCX yang diunduh.</p>}
    {document.blob && isWord ? !word ? <p role="status" className="text-sm">Membaca dokumen Word…</p> : word.error ? <p role="alert" className="text-sm text-accent-red">{word.error}</p> : <article className="text-sm leading-relaxed break-words [&_h1]:text-xl [&_h2]:text-lg [&_h3]:font-semibold [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 [&_a]:text-primary">{word.content}</article> : <Md text={document.text} />}
  </div>;
}
