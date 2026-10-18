import type { Workspace } from "./types";

export interface WorkingOutput { name: string; text: string }

/** Quote every cell, preserve newlines/Unicode, and neutralize spreadsheet formulas. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const cell = (value: unknown) => {
    let text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    if (typeof value !== "number" && /^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** RFC 4180-style CSV, including multiline fields; malformed quotes are rejected. */
export function readCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"' && !field && !closed) quoted = true;
    else if (char === ",") { row.push(field); field = ""; closed = false; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = ""; closed = false;
    } else if (closed || char === '"') throw new Error("Struktur kutipan CSV tidak valid. Unduh berkas untuk pemeriksaan.");
    else field += char;
  }
  if (quoted) throw new Error("Kutipan CSV belum ditutup.");
  if (field || row.length || closed) { row.push(field); rows.push(row); }
  return rows;
}

export function objectCsv(rows: Record<string, unknown>[], fallbackHeaders: string[] = ["id", "status"]): string {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const keys = headers.length ? headers : fallbackHeaders;
  return toCsv(keys, rows.map((row) => keys.map((key) => row[key])));
}

export function workingData(w: Workspace): WorkingOutput[] {
  const p = w.project, e = p.evidence;
  return [
    { name: "sumber-tersimpan.csv", text: objectCsv(p.records.map((r) => ({ ...r })), ["id", "title", "authors", "year", "doi", "url", "abstract", "runId"]) },
    { name: "riwayat-pencarian.csv", text: objectCsv(p.runs.map(({ rawPages: _raw, ...r }) => r), ["id", "provider", "purpose", "query", "searchedAt", "retrievedCount", "status"]) },
    { name: "keputusan-seleksi.csv", text: objectCsv(p.decisions.map((d) => ({ ...d })), ["recordId", "actorId", "stage", "verdict", "reason", "protocolRevision", "selectionRevision"]) },
    { name: "ledger-seleksi.csv", text: toCsv(["indikator", "nilai"], Object.entries(w.ledger)) },
    { name: "catatan-sumber.csv", text: objectCsv(e.cells.map((c) => ({ ...c, title: p.records.find((r) => r.id === c.recordId)?.title ?? "" })), ["recordId", "title", "columnId", "value", "state", "verificationStatus", "locator", "schemaVersion"]) },
    { name: "peta-temuan.csv", text: objectCsv(e.syntheses.flatMap((s) => s.tables.map((t) => ({ version: s.version, protocolRevision: s.protocolRevision, selectionRevision: s.selectionRevision, ...t }))), ["version", "columnId", "label", "denominator", "available", "counts", "missing"]) },
    { name: "penilaian-mutu.csv", text: objectCsv(e.appraisals.map((a) => ({ ...a })), ["recordId", "instrument", "judgement", "actorId", "protocolRevision"]) },
    { name: "audit-pelaporan.csv", text: objectCsv(w.audit?.checklist.map((i) => ({ ...i })) ?? [], ["item", "label", "status", "sectionKey", "quote", "note", "page", "pageMapping"]) },
    { name: "riwayat-revisi.csv", text: objectCsv(w.history.map((h) => ({ ...h })), ["revision", "action", "actorId", "at"]) },
  ];
}

export const outputMime = (name: string) => name.toLowerCase().endsWith(".csv")
  ? "text/csv;charset=utf-8" : name.toLowerCase().endsWith(".json")
    ? "application/json;charset=utf-8" : "text/plain;charset=utf-8";

export async function outputBlob(file: WorkingOutput): Promise<Blob> {
  if (/\.docx$/i.test(file.name)) return (await import("./wordOutput")).wordBlob(file.text);
  return new Blob([file.text], { type: outputMime(file.name) });
}

export function saveBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
