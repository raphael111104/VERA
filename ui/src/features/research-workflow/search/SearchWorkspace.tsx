import { useResearchPanel } from "../panels/ResearchPanel";
import { Select } from "../../../components/ui/Select";
import { useState } from "react";
import { Button } from "../../../components/ui";
import { previewImport } from "../api";
import { Field, Notice, Section } from "../shared";
import type { Command, ImportPreview, Workspace } from "../types";

export function SearchWorkspace({
  workspace,
  act,
  busy,
}: {
  workspace: Workspace;
  act: (command: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const p = workspace.project,
    panel = useResearchPanel();
  const runLabels: Record<string, string> = {
    queued: "Menunggu / dapat dilanjutkan",
    complete: "Halaman tercakup",
    partial: "Parsial",
    failed: "Gagal",
    cancelled: "Dihentikan",
  };
  const [purpose, setPurpose] = useState("exploratory"),
    [provider, setProvider] = useState(p.protocol.provider || "openalex"),
    [query, setQuery] = useState(
      p.protocol.query || p.direction.terms || p.direction.choice,
    ),
    [approved, setApproved] = useState(false);
  const [input, setInput] = useState(""),
    [filename, setFilename] = useState(""),
    [format, setFormat] = useState("csv"),
    [source, setSource] = useState("Scopus"),
    [searchDate, setSearchDate] = useState(""),
    [importQuery, setImportQuery] = useState("");
  const [mapping, setMapping] = useState({
    title: "",
    doi: "",
    year: "",
    authors: "",
    abstractField: "",
  });
  const [preview, setPreview] = useState<ImportPreview | null>(null),
    [runId, setRunId] = useState(() => crypto.randomUUID()),
    [acceptErrors, setAcceptErrors] = useState(false),
    [error, setError] = useState("");
  const owner = workspace.actor.role === "owner";
  const formalPlans = [
    { provider: p.protocol.provider, query: p.protocol.query },
    ...(p.protocol.queryPlans ?? []),
  ];
  const takeFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 4_000_000) {
      setError("Berkas maksimal 4 MB.");
      return;
    }
    setFilename(file.name);
    setInput(await file.text());
    setPreview(null);
    setRunId(crypto.randomUUID());
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    if (extension === "ris") setFormat("ris");
    else if (extension === "bib") setFormat("bibtex");
    else setFormat("csv");
  };
  return (
    <Section
      title="Cari dan simpan sumber"
      description="Eksplorasi membantu mengenali istilah dan cakupan. Pencarian formal memakai versi rencana acuan dan disimpan terpisah dari eksplorasi."
    >
      {!owner && (
        <Notice>
          Anda masuk sebagai reviewer. Pencarian dan impor dikelola pemilik
          proyek; sumber yang sudah disimpan tetap dapat dibaca.
        </Notice>
      )}
      {owner && (
        <>
          <div className="mb-6 rounded-xl border border-border bg-background p-5">
            <h3 className="mt-0 text-base font-semibold">Pencarian database</h3>
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Tujuan
                <Select
                  className="mt-2 w-full"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    setApproved(false);
                    if (e.target.value === "formal") {
                      setProvider(p.protocol.provider);
                      setQuery(p.protocol.query);
                    }
                  }}
                >
                  <option value="exploratory">Eksplorasi awal</option>
                  <option value="formal" disabled={!p.protocolLocked}>
                    Pencarian formal
                  </option>
                </Select>
              </label>
              <label className="text-sm font-medium">
                Database
                <Select
                  className="mt-2 w-full"
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    setApproved(false);
                    if (purpose === "formal")
                      setQuery(
                        formalPlans.find((s) => s.provider === e.target.value)
                          ?.query ?? "",
                      );
                  }}
                >
                  {workspace.capabilities.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      disabled={
                        purpose === "formal" &&
                        !formalPlans.some((s) => s.provider === c.id)
                      }
                    >
                      {c.label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            {purpose === "formal" && (
              <label className="mb-4 block text-sm">
                Query pada versi rencana acuan
                <Select
                  className="mt-2 w-full"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setApproved(false);
                  }}
                >
                  {formalPlans
                    .filter((s) => s.provider === provider)
                    .map((s, i) => (
                      <option key={i} value={s.query}>
                        {s.query}
                      </option>
                    ))}
                </Select>
              </label>
            )}
            <Field
              label="Query yang akan dikirim"
              value={query}
              onChange={(text) => {
                setQuery(text);
                setApproved(false);
              }}
              hint={
                purpose === "formal"
                  ? "Harus sesuai query versi acuan. Ubah melalui Rencana Kajian bila diperlukan."
                  : "Gunakan istilah awal; hasil ini tidak masuk hitungan review formal."
              }
            />
            <details className="mb-4 text-xs text-subtext">
              <summary className="cursor-pointer">
                Akses dan cakupan database
              </summary>
              <p className="leading-relaxed">
                {workspace.capabilities.find((c) => c.id === provider)?.detail}{" "}
                Credential dikonfigurasi melalui pengaturan layanan/environment,
                bukan dimasukkan ke query.
              </p>
            </details>
            {purpose === "formal" && (
              <label className="mb-4 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                />
                Saya telah meninjau query, database dan cakupan versi acuan{" "}
                {p.protocolRevision}.
              </label>
            )}
            <Button
              variant="primary"
              disabled={
                busy || !query.trim() || (purpose === "formal" && !approved)
              }
              onClick={() =>
                void act({
                  action: "search",
                  data: {
                    runId: crypto.randomUUID(),
                    purpose,
                    provider,
                    query,
                    approved,
                  },
                })
              }
            >
              Jalankan pencarian
            </Button>
            <p className="mb-0 text-xs text-subtext">
              Mengambil satu halaman berisi hingga 25 record. Hasil parsial
              memiliki tombol lanjut; total provider bukan jumlah yang sudah
              diterima.
            </p>
          </div>
          <details className="mb-6 rounded-xl border border-border bg-background p-5">
            <summary className="cursor-pointer font-semibold">
              Impor ekspor asli database — CSV, RIS atau BibTeX
            </summary>
            <p className="text-sm text-subtext">
              Berkas asli, hash dan provenance disimpan. Query/tanggal yang
              tidak diketahui tetap kosong; tanggal impor tidak dianggap tanggal
              pencarian.
            </p>
            <input
              type="file"
              accept=".csv,.ris,.bib,.bibtex,.txt"
              aria-label="Pilih berkas bibliografi"
              onChange={(e) => void takeFile(e.target.files?.[0])}
            />
            <div className="my-4 flex flex-wrap gap-4">
              <label className="text-sm">
                Format
                <Select
                  className="ml-2 border border-border bg-background p-2"
                  value={format}
                  onChange={(e) => {
                    setFormat(e.target.value);
                    setPreview(null);
                  }}
                >
                  <option value="csv">CSV</option>
                  <option value="ris">RIS</option>
                  <option value="bibtex">BibTeX</option>
                </Select>
              </label>
              <label className="text-sm">
                Database asal
                <input
                  className="ml-2 border border-border bg-background p-2"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  maxLength={120}
                />
              </label>
            </div>
            <Field
              label="Isi berkas asli"
              value={input}
              onChange={(text) => {
                setInput(text);
                setPreview(null);
              }}
              rows={5}
            />
            <Field
              label="Query asli, bila diketahui"
              value={importQuery}
              onChange={setImportQuery}
              rows={2}
            />
            <label className="mb-4 block text-sm">
              Tanggal pencarian asli, bila diketahui
              <input
                className="ml-3 border border-border bg-background p-2"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </label>
            <Button
              disabled={!input || busy}
              onClick={() => {
                setError("");
                void previewImport(p.id, {
                  format,
                  text: input,
                  mapping,
                  runId,
                })
                  .then(setPreview)
                  .catch((problem) => setError(String(problem)));
              }}
            >
              Periksa pratinjau impor
            </Button>
            {preview && (
              <div className="mt-4">
                <p className="text-sm tabular-nums">
                  {preview.records.length} record valid ·{" "}
                  {preview.errors.length} masalah
                </p>
                {format === "csv" && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries({
                      title: "Judul",
                      doi: "DOI",
                      year: "Tahun",
                      authors: "Penulis",
                      abstractField: "Abstrak",
                    }).map(([key, label]) => (
                      <label key={key} className="text-sm">
                        Kolom {label}
                        <Select
                          className="ml-2 border border-border bg-background p-2"
                          value={mapping[key as keyof typeof mapping]}
                          onChange={(e) => {
                            setMapping({ ...mapping, [key]: e.target.value });
                            setPreview(null);
                          }}
                        >
                          <option value="">Deteksi dari nama kolom</option>
                          {preview.headers.map((h) => (
                            <option key={h}>{h}</option>
                          ))}
                        </Select>
                      </label>
                    ))}
                  </div>
                )}
                <ul className="max-h-48 overflow-y-auto pl-5 text-sm">
                  {preview.records.slice(0, 10).map((r) => (
                    <li key={r.id}>
                      {r.title} · {r.doi || "DOI tidak tersedia"}
                    </li>
                  ))}
                </ul>
                {preview.errors.map((error) => (
                  <p key={error} className="text-xs text-accent-red">
                    {error}
                  </p>
                ))}
                {preview.errors.length > 0 && (
                  <label className="my-4 flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={acceptErrors}
                      onChange={(e) => setAcceptErrors(e.target.checked)}
                    />
                    Saya meninjau masalah dan menerima hanya record valid.
                  </label>
                )}
                <Button
                  variant="primary"
                  disabled={
                    busy ||
                    !preview.records.length ||
                    (preview.errors.length > 0 && !acceptErrors)
                  }
                  onClick={() =>
                    void act({
                      action: "import",
                      data: {
                        runId,
                        purpose,
                        provider: source,
                        format,
                        text: input,
                        filename,
                        mapping,
                        query: importQuery || null,
                        searchedAt: searchDate || null,
                        acceptErrors,
                      },
                    }).then((saved) => {
                      if (!saved) return;
                      setPreview(null);
                      setInput("");
                      setRunId(crypto.randomUUID());
                    })
                  }
                >
                  Simpan{" "}
                  {purpose === "formal"
                    ? "sebagai hasil formal"
                    : "sebagai eksplorasi"}
                </Button>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-accent-red">
                {error}
              </p>
            )}
          </details>
        </>
      )}
      <h3 className="text-base font-semibold">Riwayat pencarian dan impor</h3>
      {!p.runs.length ? (
        <Notice>
          Belum ada pencarian. Mulai dengan istilah eksploratif atau unggah
          ekspor asli yang Anda miliki.
        </Notice>
      ) : (
        p.runs
          .slice()
          .reverse()
          .map((run, index) => (
            <details
              open={index === 0}
              key={run.id}
              className="mb-3 rounded-lg border border-border bg-background p-4"
            >
              <summary className="flex cursor-pointer flex-wrap justify-between gap-2 text-sm">
                <strong>
                  {run.provider} ·{" "}
                  {run.purpose === "formal" ? "Formal" : "Eksploratif"}
                </strong>
                <span className="text-subtext">
                  {runLabels[run.status] || run.status} · revisi acuan{" "}
                  {run.protocolRevision || "belum ada"}
                </span>
              </summary>
              <p className="text-sm">
                {run.query || "Query asli tidak diketahui"}
              </p>
              <p className="text-xs tabular-nums text-subtext">
                Diterima: {run.retrievedCount} · Total provider:{" "}
                {run.reportedTotal ?? "tidak diketahui"} ·{" "}
                {run.importedAt ? "Diimpor" : "Dicari"}{" "}
                {new Date(run.importedAt ?? run.startedAt).toLocaleString(
                  "id-ID",
                )}
                {run.importedAt &&
                  ` · Tanggal pencarian asli: ${run.searchedAt || "tidak diketahui"}`}
              </p>
              {!!run.warnings.length && (
                <p className="text-xs font-medium text-subtext">
                  Catatan cakupan dan percobaan sebelumnya
                </p>
              )}
              {run.warnings.map((warning, i) => (
                <p key={i} className="text-xs text-accent-red">
                  {warning}
                </p>
              ))}
              {owner &&
                !run.importedAt &&
                ["partial", "failed", "queued"].includes(run.status) && (
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "resume_search",
                          data: { runId: run.id },
                        })
                      }
                    >
                      {run.checkpoint ? "Lanjut ambil halaman" : "Coba lagi"}
                    </Button>
                    <Button
                      size="small"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "cancel_search",
                          data: { runId: run.id },
                        })
                      }
                    >
                      Hentikan run
                    </Button>
                  </div>
                )}
            </details>
          ))
      )}
      <div className="mt-5 flex items-center justify-between rounded-lg border border-border bg-background p-4">
        <span className="text-sm tabular-nums">
          {p.records.length} sumber tersimpan
        </span>
        <Button onClick={panel.openFiles}>
          Lihat sumber dan berkas di kanan
        </Button>
      </div>
    </Section>
  );
}
