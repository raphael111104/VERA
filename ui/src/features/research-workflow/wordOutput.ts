import { Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { researchBrowserUrl } from "../../researchBrowser";

interface Node { type: string; value?: string; url?: string; alt?: string; depth?: number; ordered?: boolean; start?: number; children?: Node[] }

/** Build a real OOXML document from the same Markdown shown in the working preview. */
export async function wordBlob(markdown: string): Promise<Blob> {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Node;
  const inline = (nodes: Node[], marks: { bold?: boolean; italics?: boolean } = {}): (TextRun | ExternalHyperlink)[] => nodes.flatMap((n): (TextRun | ExternalHyperlink)[] => {
    if (n.type === "link") {
      const target = researchBrowserUrl(n.url ?? "");
      return target ? [new ExternalHyperlink({ link: target, children: inline(n.children ?? [], marks) })] : [...inline(n.children ?? [], marks), new TextRun({ text: n.url ? ` (${n.url})` : "", ...marks })];
    }
    if (n.type === "image") return [new TextRun({ text: `[Gambar: ${n.alt || "tanpa keterangan"}${n.url ? `; ${n.url}` : ""}]`, ...marks })];
    if (n.type === "strong" || n.type === "emphasis") return inline(n.children ?? [], { ...marks, ...(n.type === "strong" ? { bold: true } : { italics: true }) });
    if (n.type === "break") return [new TextRun({ break: 1 })];
    if (n.children) return inline(n.children, marks);
    return [new TextRun({ text: n.value ?? "", ...marks })];
  });
  const headings = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
  const blocks = (nodes: Node[], level = 0): (Paragraph | Table)[] => nodes.flatMap((n): (Paragraph | Table)[] => {
    if (n.type === "table") return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: (n.children ?? []).map((r, index) => new TableRow({ children: (r.children ?? []).map((c) => new TableCell({ children: [new Paragraph({ children: inline(c.children ?? [], { bold: index === 0 }) })] })) })) })];
    if (n.type === "list") return (n.children ?? []).flatMap((item, i) => (item.children ?? []).flatMap((child, j) => child.type === "list" ? blocks([child], level + 1) : [new Paragraph({ children: [new TextRun(j === 0 ? n.ordered ? `${(n.start ?? 1) + i}. ` : "• " : ""), ...inline(child.children ?? [child])], indent: { left: 360 * (level + 1) }, spacing: { after: 120 } })]));
    if (n.type === "blockquote") return blocks(n.children ?? [], level + 1);
    if (n.type === "thematicBreak") return [new Paragraph({ text: "—" })];
    return [new Paragraph({ children: inline(n.children ?? [n]), ...(n.type === "heading" ? { heading: headings[Math.min(5, (n.depth ?? 1) - 1)] } : {}), spacing: { after: 160 }, ...(n.type === "code" ? { style: "Code" } : {}) })];
  });
  return Packer.toBlob(new Document({ creator: "VERA", title: "Dokumen kajian VERA", styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { line: 300 } } } } }, sections: [{ children: blocks(tree.children ?? []) }] }));
}
