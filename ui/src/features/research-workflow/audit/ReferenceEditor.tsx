import { useEffect, useState } from "react";
import { Button } from "../../../components/ui";
import { Select } from "../../../components/ui/Select";
import { Md } from "../../../components/Md";
import { Field } from "../shared";
import type {
  Bibliography,
  Command,
  EvidenceRecord,
  Workspace,
} from "../types";
const blank: Bibliography = {
  authors: [],
  containerTitle: "",
  volume: "",
  issue: "",
  pages: "",
  articleNumber: "",
  publisher: "",
  kind: "",
  reviewed: false,
  note: "",
  provenance: "",
};
export function ReferenceEditor({
  workspace: w,
  act,
  busy,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const [id, setId] = useState(w.project.records[0]?.id ?? ""),
    [filter, setFilter] = useState("");
  const record = w.project.records.find((r) => r.id === id),
    matches = w.project.records.filter((r) =>
      `${r.title} ${r.authors ?? ""}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
    );
  return (
    <details
      open
      className="mb-6 rounded-xl border border-border bg-background p-5"
    >
      <summary className="cursor-pointer text-sm font-medium">
        Periksa metadata dan format referensi APA 7
      </summary>
      <p className="text-xs leading-relaxed text-subtext">
        Format mengambil metadata yang tersedia. Nama penulis, DOI, tahun dan
        terbitan yang tidak tersedia perlu diperiksa pada sumber asli. Koreksi
        disimpan terpisah; provenance impor tetap ada.
      </p>
      <label className="mb-3 block text-xs">
        Cari referensi
        <input
          className="mt-1 w-full rounded-md border border-border bg-background p-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      <label className="mb-4 block text-sm">
        Sumber
        <Select
          className="mt-2 w-full"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          {record && !matches.slice(0, 100).some((r) => r.id === id) && (
            <option value={id}>{record.title}</option>
          )}
          {matches.slice(0, 100).map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </Select>
      </label>
      {matches.length > 100 && (
        <p className="text-xs text-subtext">
          Menampilkan 100 hasil pertama. Persempit pencarian untuk memilih
          sumber lainnya.
        </p>
      )}
      {record ? (
        <MetadataForm
          key={record.id}
          record={record}
          workspace={w}
          act={act}
          busy={busy}
        />
      ) : (
        <p className="text-sm text-subtext">Belum ada sumber tersimpan.</p>
      )}
    </details>
  );
}
function MetadataForm({
  record: r,
  workspace: w,
  act,
  busy,
}: {
  record: EvidenceRecord;
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const preview = w.referencePreview?.find((v) => v.recordId === r.id),
    storage = `vera:workflow:bibliography-draft:${w.project.id}:${r.id}`;
  const initial = { ...blank, ...(preview?.metadata ?? r.bibliography) };
  // Legacy records have no structured names; retain display text until explicitly corrected.
  if (!initial.authors.length && r.authors)
    initial.authors = [{ family: "", given: "", literal: r.authors }];
  const [b, setB] = useState<Bibliography>(() => {
      try {
        return JSON.parse(localStorage.getItem(storage) ?? "null") ?? initial;
      } catch {
        return initial;
      }
    }),
    [dirty, setDirty] = useState(false),
    [saved, setSaved] = useState(false);
  const [authorsText, setAuthorsText] = useState(() =>
    b.authors
      .map((a) => (a.literal ? `=${a.literal}` : `${a.family} | ${a.given}`))
      .join("\n"),
  );
  const update = (patch: Partial<Bibliography>) => {
    const next = { ...b, ...patch, reviewed: patch.reviewed ?? false };
    setB(next);
    setDirty(true);
    setSaved(false);
    try {
      localStorage.setItem(storage, JSON.stringify(next));
    } catch {}
  };
  useEffect(() => {
    const guard = (ev: BeforeUnloadEvent) => {
      if (dirty) ev.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  return (
    <div>
      <Field
        label="Nama penulis terstruktur — satu penulis per baris"
        hint="Nama keluarga | nama pemberian. Untuk nama organisasi atau nama yang belum dapat dipisahkan, awali = dan tulis persis seperti sumber. Jangan menebak nama keluarga."
        value={authorsText}
        onChange={(value) => {
          setAuthorsText(value);
          update({
            authors: value
              .split("\n")
              .filter((v) => v.trim())
              .map((v) =>
                v.startsWith("=")
                  ? { family: "", given: "", literal: v.slice(1).trim() }
                  : {
                      family: v.split("|")[0].trim(),
                      given: v.split("|").slice(1).join("|").trim(),
                      literal: "",
                    },
              ),
          });
        }}
      />
      <div className="grid gap-x-4 sm:grid-cols-2">
        {(
          [
            ["title", "Judul sumber", r.title],
            ["year", "Tahun publikasi", r.year ?? ""],
            ["doi", "DOI", r.doi ?? ""],
            ["url", "URL sumber", r.url ?? ""],
            ["containerTitle", "Nama jurnal atau terbitan", ""],
            ["volume", "Volume", ""],
            ["issue", "Nomor terbitan", ""],
            ["pages", "Rentang halaman", ""],
            ["articleNumber", "Nomor artikel (bila dipakai)", ""],
            ["publisher", "Penerbit atau organisasi", ""],
          ] as const
        ).map(([key, label, fallback]) => (
          <div
            key={key}
            className={
              ["title", "url", "containerTitle", "publisher"].includes(key)
                ? "sm:col-span-2"
                : undefined
            }
          >
            <Field
              key={key}
              label={label}
              rows={1}
              value={String(b[key] ?? fallback)}
              onChange={(value) => update({ [key]: value })}
            />
          </div>
        ))}
      </div>
      <label className="mb-4 block text-sm">
        Jenis sumber
        <Select
          className="mt-2 w-full"
          value={b.kind}
          onChange={(e) => update({ kind: e.target.value })}
        >
          <option value="">Belum diketahui</option>
          <option value="journal-article">Artikel jurnal</option>
          <option value="book">Buku</option>
          <option value="report">Laporan</option>
          <option value="preprint">Preprint</option>
          <option value="webpage">Halaman web</option>
        </Select>
      </label>
      <Field
        label="Catatan dan dasar koreksi metadata"
        rows={2}
        value={b.note}
        onChange={(note) => update({ note })}
      />
      <label className="mb-4 flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={b.reviewed}
          onChange={(e) => update({ reviewed: e.target.checked })}
        />
        Saya telah memeriksa metadata ini terhadap sumber asli
      </label>
      <Button
        size="small"
        disabled={busy || !b.note.trim()}
        onClick={() =>
          void act({
            action: "record_metadata",
            data: { recordId: r.id, bibliography: b },
          }).then((ok) => {
            if (ok) {
              setDirty(false);
              setSaved(true);
              localStorage.removeItem(storage);
            }
          })
        }
      >
        Simpan metadata referensi
      </Button>
      <p role="status" className="text-xs text-subtext">
        {dirty
          ? "Koreksi lokal belum tersimpan ke proyek."
          : saved
            ? "Metadata tersimpan. Format sitasi dan ekspor memakai versi ini."
            : `Provenance: ${preview?.metadata.provenance || "metadata tersimpan"}`}
      </p>
      {preview && (
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="mt-0 text-xs font-medium">
            Pratinjau dari metadata tersimpan
          </p>
          <p className="text-sm">{preview.citation}</p>
          <Md text={preview.reference} />
          {preview.issues.length > 0 && (
            <ul className="pl-5 text-xs text-subtext">
              {preview.issues.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
