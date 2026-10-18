import { useState } from "react";
import { Button } from "../../../components/ui";
import { Select } from "../../../components/ui/Select";
import { Field, Notice, Section } from "../shared";
import { useResearchPanel } from "../panels/ResearchPanel";
import type { Column, Command, Locator, Workspace } from "../types";
import { TermHelp } from "../TermHelp";

const defaults: Column[] = [
  ["citation", "Sitasi"],
  ["publicationYear", "Tahun publikasi"],
  ["country", "Negara"],
  ["objective", "Tujuan"],
  ["design", "Desain"],
  ["participants", "Peserta"],
  ["concept", "Konsep"],
  ["context", "Konteks"],
  ["relevantFindings", "Temuan relevan"],
  ["limitations", "Keterbatasan"],
].map(([id, label]) => ({
  id,
  label,
  kind: id === "publicationYear" ? "number" : "text",
  required: true,
  allowedValues: [],
  missingPolicy: ["not_reported", "not_applicable", "uncertain"],
  extractionGuidance: `Catat ${label.toLowerCase()} dari sumber; simpan kutipan dan lokasi. Jangan menebak informasi yang tidak dilaporkan.`,
}));
const empty: Locator = {
  artifactId: "",
  page: null,
  section: "",
  quote: "",
  documentHash: "",
};
const states: Record<string, string> = {
  present: "Dilaporkan",
  not_reported: "Tidak dilaporkan",
  not_applicable: "Tidak berlaku",
  uncertain: "Belum pasti",
};
export function ChartingWorkspace({
  workspace: w,
  act,
  busy,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const p = w.project,
    e = p.evidence,
    schema = e.schemas.at(-1),
    owner = w.actor.role === "owner",
    panel = useResearchPanel();
  const included = p.records.filter((r) =>
    w.evidenceSummary.included.includes(r.id),
  );
  const [columns, setColumns] = useState(schema?.columns ?? defaults),
    [reason, setReason] = useState(""),
    [recordId, setRecordId] = useState(included[0]?.id ?? ""),
    [columnId, setColumnId] = useState(schema?.columns[0]?.id ?? ""),
    [value, setValue] = useState(""),
    [state, setState] = useState("present"),
    [locator, setLocator] = useState(empty);
  const [pilotIds, setPilotIds] = useState(e.pilot?.recordIds ?? []),
    [pilotReason, setPilotReason] = useState(e.pilot?.rationale ?? ""),
    [instrument, setInstrument] = useState(""),
    [judgement, setJudgement] = useState(""),
    [disputeReason, setDisputeReason] = useState("");
  const active = e.cells
    .slice()
    .reverse()
    .find((c) => c.recordId === recordId && c.columnId === columnId);
  const retrieval = p.retrievals
    .slice()
    .reverse()
    .find((r) => r.recordId === recordId);
  const artifact = w.artifacts.find((a) => a.id === retrieval?.artifactId);
  const column = schema?.columns.find((c) => c.id === columnId);
  const locate = (next: Partial<Locator>) =>
    setLocator({
      ...locator,
      ...next,
      artifactId: artifact?.id ?? "",
      documentHash: artifact?.checksum ?? "",
    });
  const edit = (i: number, next: Partial<Column>) =>
    setColumns(columns.map((c, n) => (n === i ? { ...c, ...next } : c)));
  const pilot = (status: string) =>
    void act({
      action: "chart_pilot",
      data: {
        recordIds: pilotIds,
        rationale: pilotReason,
        status,
        schemaVersion: schema?.version,
      },
    });
  return (
    <Section
      title="Catatan sumber"
      description="Siapkan form, uji pada beberapa sumber, lalu catat informasi dari teks lengkap yang lolos seleksi. Informasi yang belum diketahui tetap dicatat sebagai belum tersedia, bukan nol."
    >
      <TermHelp terms={["charting", "codebook"]} />
      <p className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-xs tabular-nums text-subtext">
        {included.length} laporan lolos seleksi ·{" "}
        {w.evidenceSummary.confirmedRows.length} baris terkonfirmasi · Form
        versi {schema?.version ?? "belum ada"}
      </p>
      {w.reviewMode === "practice" && (
        <Notice>
          Mode latihan satu penilai. Konfirmasi di sini tidak dianggap
          verifikasi dua manusia.
        </Notice>
      )}
      {owner && (
        <details
          className="mb-5 rounded-xl border border-border bg-background p-4"
          open={!schema}
        >
          <summary className="cursor-pointer font-medium">
            1. Siapkan form dan kategori
          </summary>
          <p className="text-xs text-subtext">
            Perubahan menjadi versi baru. Baris lama dipertahankan dan perlu
            ditinjau terhadap arti kolom terbaru.
          </p>
          {columns.map((c, i) => (
            <details
              key={i}
              className="mb-3 rounded-lg border border-border p-3"
            >
              <summary className="cursor-pointer text-sm">
                {c.label || "Kolom baru"} · {c.kind}
                {c.required ? " · wajib" : ""}
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  ID kolom
                  <input
                    className="mt-1 block w-full"
                    value={c.id}
                    onChange={(ev) => edit(i, { id: ev.target.value })}
                  />
                </label>
                <label className="text-sm">
                  Nama kolom
                  <input
                    className="mt-1 block w-full"
                    value={c.label}
                    onChange={(ev) => edit(i, { label: ev.target.value })}
                  />
                </label>
                <label className="text-sm">
                  Tipe
                  <Select
                    aria-label={`Tipe ${c.label}`}
                    className="mt-1 w-full"
                    value={c.kind}
                    onChange={(ev) => edit(i, { kind: ev.target.value })}
                  >
                    <option value="text">Teks</option>
                    <option value="number">Angka</option>
                    <option value="category">Kategori</option>
                  </Select>
                </label>
                <label className="text-sm">
                  Kategori disetujui (pisahkan ;)
                  <input
                    className="mt-1 block w-full"
                    value={c.allowedValues.join(";")}
                    onChange={(ev) =>
                      edit(i, {
                        allowedValues: ev.target.value
                          .split(";")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              </div>
              <Field
                label={`Petunjuk ${c.label}`}
                rows={2}
                value={c.extractionGuidance}
                onChange={(text) => edit(i, { extractionGuidance: text })}
              />
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={c.required}
                  onChange={(ev) => edit(i, { required: ev.target.checked })}
                />{" "}
                Wajib diperiksa
              </label>
              <div className="my-3 flex flex-wrap gap-3 text-xs">
                {Object.keys(states)
                  .filter((s) => s !== "present")
                  .map((s) => (
                    <label key={s}>
                      <input
                        type="checkbox"
                        checked={c.missingPolicy.includes(s)}
                        onChange={(ev) =>
                          edit(i, {
                            missingPolicy: ev.target.checked
                              ? [...c.missingPolicy, s]
                              : c.missingPolicy.filter((v) => v !== s),
                          })
                        }
                      />{" "}
                      {states[s]}
                    </label>
                  ))}
              </div>
              <Button
                size="small"
                onClick={() => setColumns(columns.filter((_, n) => n !== i))}
              >
                Hapus kolom dari form baru
              </Button>
            </details>
          ))}
          <Button
            size="small"
            onClick={() =>
              setColumns([
                ...columns,
                {
                  ...defaults[0],
                  id: `field_${columns.length + 1}`,
                  label: "Kolom baru",
                },
              ])
            }
          >
            Tambah kolom
          </Button>
          <Field
            label="Alasan versi form"
            value={reason}
            onChange={setReason}
            rows={2}
          />
          <Button
            disabled={busy || !reason.trim()}
            onClick={() =>
              void act({
                action: "chart_schema",
                data: { columns, reason },
              }).then((saved) => {
                if (saved) setColumnId(columns[0]?.id ?? "");
              })
            }
          >
            Simpan versi form
          </Button>
        </details>
      )}
      {!included.length ? (
        <Notice>
          Belum ada laporan included aktif. Selesaikan pemilihan teks lengkap
          pada Pemilihan Sumber. Form dapat disiapkan sekarang.
        </Notice>
      ) : (
        <>
          {owner && (
            <details className="mb-5 rounded-xl border border-border bg-background p-4">
              <summary className="cursor-pointer font-medium">
                2. Uji form pada sampel ·{" "}
                {e.pilot?.status ?? "belum direncanakan"}
              </summary>
              <p className="text-sm text-subtext">
                Tim menentukan jumlah dan alasan sampel; tidak ada ukuran
                universal.
              </p>
              <div className="max-h-48 overflow-y-auto">
                {included.map((r) => (
                  <label key={r.id} className="mb-3 flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pilotIds.includes(r.id)}
                      onChange={(ev) =>
                        setPilotIds(
                          ev.target.checked
                            ? [...pilotIds, r.id]
                            : pilotIds.filter((id) => id !== r.id),
                        )
                      }
                    />
                    {r.title}
                  </label>
                ))}
              </div>
              <Field
                label="Alasan sampel pilot"
                value={pilotReason}
                onChange={setPilotReason}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy || !schema}
                  onClick={() => pilot("planned")}
                >
                  Simpan sampel pilot
                </Button>
                <Button
                  disabled={busy || !schema}
                  onClick={() => pilot("complete")}
                >
                  Konfirmasi pilot selesai
                </Button>
              </div>
            </details>
          )}
          {schema && (
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mt-0 text-sm font-semibold">
                3. Isi dan periksa catatan sumber
              </h3>
              <label className="mb-4 block text-sm">
                Sumber included
                <Select
                  aria-label="Sumber charting"
                  className="mt-2 w-full"
                  value={recordId}
                  onChange={(ev) => {
                    setRecordId(ev.target.value);
                    setLocator(empty);
                    setValue("");
                  }}
                >
                  {included.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button size="small" onClick={() => panel.openRecord(recordId)}>
                  Buka sumber di panel kanan
                </Button>
                {artifact && (
                  <Button
                    size="small"
                    onClick={() => panel.openPdf(artifact.id)}
                  >
                    Baca PDF di panel kanan
                  </Button>
                )}
              </div>
              <label className="mb-4 block text-sm">
                Kolom
                <Select
                  aria-label="Kolom charting"
                  className="mt-2 w-full"
                  value={columnId}
                  onChange={(ev) => {
                    setColumnId(ev.target.value);
                    setValue("");
                    setState("present");
                    setLocator(empty);
                  }}
                >
                  {schema.columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </label>
              <p className="text-xs text-subtext">
                {column?.extractionGuidance}
              </p>
              {active && (
                <Notice>
                  Nilai terakhir: {active.value || states[active.state]} ·{" "}
                  {active.verificationStatus} · form {active.schemaVersion}.{" "}
                  {active.schemaVersion !== schema.version ||
                  active.selectionRevision !== p.selectionRevision ||
                  active.protocolRevision !== p.protocolRevision
                    ? "Perlu ditinjau pada versi aktif."
                    : ""}
                  {active.verificationNote && (
                    <p>Perbedaan: {active.verificationNote}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="small"
                      onClick={() => {
                        setValue(active.value);
                        setState(active.state);
                        setLocator(active.locator);
                      }}
                    >
                      Salin sebagai usulan baru
                    </Button>
                    {active.verificationStatus !== "confirmed" && (
                      <Button
                        size="small"
                        disabled={busy}
                        onClick={() =>
                          void act({
                            action: "chart_verify",
                            data: { cellId: active.id },
                          })
                        }
                      >
                        Saya telah memeriksa nilai dan bukti
                      </Button>
                    )}
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs">
                      Riwayat dan perbedaan nilai
                    </summary>
                    {e.cells
                      .filter(
                        (c) =>
                          c.recordId === recordId && c.columnId === columnId,
                      )
                      .slice()
                      .reverse()
                      .slice(0, 8)
                      .map((c) => (
                        <p key={c.id} className="text-xs">
                          {c.value || states[c.state]} · {c.verificationStatus}{" "}
                          · {c.extractor} {c.verifier ? `/ ${c.verifier}` : ""}
                        </p>
                      ))}
                    <Field
                      label="Alasan perbedaan verifikasi"
                      value={disputeReason}
                      onChange={setDisputeReason}
                      rows={2}
                    />
                    <Button
                      size="small"
                      disabled={busy || !disputeReason.trim()}
                      onClick={() =>
                        void act({
                          action: "chart_dispute",
                          data: { cellId: active.id, reason: disputeReason },
                        })
                      }
                    >
                      Catat nilai perlu ditinjau
                    </Button>
                  </details>
                </Notice>
              )}
              <label className="mb-4 block text-sm">
                Status nilai
                <Select
                  aria-label="Status nilai charting"
                  className="mt-2 w-full"
                  value={state}
                  onChange={(ev) => {
                    setState(ev.target.value);
                    if (ev.target.value !== "present") setValue("");
                  }}
                >
                  {["present", ...(column?.missingPolicy ?? [])].map((v) => (
                    <option key={v} value={v}>
                      {states[v]}
                    </option>
                  ))}
                </Select>
              </label>
              {state === "present" && (
                <Field
                  label="Nilai atau temuan"
                  value={value}
                  onChange={setValue}
                  hint={
                    column?.kind === "category"
                      ? "Gunakan kategori disetujui; pisahkan kategori ganda dengan titik koma."
                      : undefined
                  }
                />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Halaman sumber
                  <input
                    aria-label="Halaman sumber charting"
                    className="mt-2 block w-full"
                    type="number"
                    min={1}
                    value={locator.page ?? ""}
                    onChange={(ev) =>
                      locate({
                        page: ev.target.value ? Number(ev.target.value) : null,
                      })
                    }
                  />
                </label>
                <label className="text-sm">
                  Bagian sumber
                  <input
                    className="mt-2 block w-full"
                    value={locator.section}
                    onChange={(ev) => locate({ section: ev.target.value })}
                  />
                </label>
              </div>
              <Field
                label="Kutipan bukti atau catatan lokasi pemeriksaan missing"
                value={locator.quote}
                onChange={(quote) => locate({ quote })}
                hint="Gunakan kutipan nyata. Untuk missing, catat bagian yang diperiksa dan batas pemeriksaan."
              />
              <p className="text-xs text-subtext">
                {artifact
                  ? `Dokumen aktif · SHA-256 ${artifact.checksum.slice(0, 16)}…`
                  : "Dokumen legal belum tersedia. Usulan tanpa lokasi dapat disimpan, tetapi tidak dapat dikonfirmasi."}
              </p>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() =>
                  void act({
                    action: "chart_cell",
                    data: { recordId, columnId, value, state, locator },
                  })
                }
              >
                Simpan usulan nilai
              </Button>
              {owner && p.protocol.appraisal === "yes" && (
                <details className="mt-5 border-t border-border pt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Penilaian mutu sesuai instrumen pilihan
                  </summary>
                  <Field
                    label="Instrumen dan versi"
                    value={instrument}
                    onChange={setInstrument}
                  />
                  <Field
                    label="Penilaian per domain dan alasan"
                    value={judgement}
                    onChange={setJudgement}
                    hint="Tidak ada skor universal. Menggunakan lokasi bukti yang diisi di atas."
                  />
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void act({
                        action: "appraisal",
                        data: { recordId, instrument, judgement, locator },
                      })
                    }
                  >
                    Simpan penilaian mutu
                  </Button>
                  {e.appraisals
                    .filter((a) => a.recordId === recordId)
                    .map((a, i) => (
                      <p key={i} className="text-sm">
                        {a.instrument}: {a.judgement} · acuan{" "}
                        {a.protocolRevision}
                      </p>
                    ))}
                </details>
              )}
            </div>
          )}
        </>
      )}
    </Section>
  );
}
