import { useState } from "react";
import { Button } from "../../../components/ui";
import { Select } from "../../../components/ui/Select";
import { Field, Notice, Section, ViewSwitcher } from "../shared";
import { sectionLabels } from "../draft/ManuscriptEditor";
import { useResearchPanel } from "../panels/ResearchPanel";
import { downloadExport } from "../api";
import type { Command, Workspace } from "../types";
import { OutputSettings } from "./OutputSettings";
import { ReferenceEditor } from "./ReferenceEditor";
import { TermHelp } from "../TermHelp";
import { objectCsv } from "../outputs";
const statusLabels: Record<string, string> = {
  reported: "Dilaporkan",
  missing: "Belum dilaporkan",
  needs_review: "Perlu diperiksa",
  not_applicable_with_reason: "Tidak berlaku dengan alasan",
};
export function AuditWorkspace({
  workspace: w,
  act,
  busy,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const [item, setItem] = useState(1),
    [key, setKey] = useState("title"),
    [quote, setQuote] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [requirement, setRequirement] = useState(""),
    [completeInstructions, setCompleteInstructions] = useState(false);
  const [milestone, setMilestone] = useState("article");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [view, setView] = useState("export");
  const a = w.audit,
    panel = useResearchPanel(),
    owner = w.actor.role === "owner";
  if (!a || !owner)
    return <Notice>Audit dan ekspor dikelola pemilik kajian.</Notice>;
  const section = w.project.evidence.sections.find((s) => s.key === key);
  const download = async (id: string, member?: string) => {
    setError("");
    try {
      await downloadExport(w.project.id, id, member);
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <>
      <Section
        title="Periksa dan unduh hasil kajian"
        description="Pilih keluaran untuk diunduh, atau buka pemeriksaan laporan dan referensi. Draft yang belum lengkap tetap dapat diekspor dengan catatan kekurangannya."
      >
        <TermHelp terms={["PRISMA", "JBI"]} />
        <ViewSwitcher
          label="Pekerjaan akhir kajian"
          value={view}
          onChange={setView}
          options={[
            ["export", "Ekspor dokumen"],
            ["review", "Pemeriksaan laporan"],
            ["references", "Referensi"],
          ]}
        />
        <div hidden={view !== "export"}>
          <div className="mb-5 overflow-hidden rounded-xl border border-border bg-background">
            <OutputSettings
              workspace={w}
              act={act}
              busy={busy}
              milestone={milestone}
              onMilestone={setMilestone}
              onDirty={setSettingsDirty}
            />
            <div className="border-t border-border p-5">
              <p className="mt-0 text-xs text-subtext">
                Kelengkapan artikel kajian
              </p>
              <p className="my-2 font-medium">
                {a.reviewState === "ready_for_review"
                  ? "Siap untuk ditinjau"
                  : "Draft belum lengkap"}
              </p>
              <p className="text-sm text-subtext">
                {a.coverage.reported} dari 22 item dilaporkan ·{" "}
                {a.coverage.notApplicable} tidak berlaku dengan alasan ·{" "}
                {a.unresolvedIssues.length} hal perlu diperiksa
              </p>
              <Button
                size="small"
                variant="ghost"
                className="mb-3 px-0"
                onClick={() => setView("review")}
              >
                Lihat hal yang perlu diperiksa ({a.unresolvedIssues.length})
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  disabled={busy || settingsDirty}
                  onClick={() =>
                    void act({ action: "export", data: { milestone } })
                  }
                >
                  {busy ? "Menyiapkan dokumen…" : "Buat paket ekspor"}
                </Button>
                {settingsDirty && (
                  <p className="text-xs text-subtext">
                    Simpan pengaturan keluaran sebelum membuat paket.
                  </p>
                )}
                <Button
                  onClick={() =>
                    panel.openText("audit-pelaporan.csv", objectCsv(a.checklist.map((item) => ({ ...item }))))
                  }
                >
                  Buka audit di panel
                </Button>
              </div>
              <p className="mb-0 text-xs text-subtext">
                Dokumen Word, tabel CSV, checklist, diagram seleksi dan data pendamping.
                PDF ditambahkan bila renderer lokal tersedia. Proses rendering
                dapat memerlukan sekitar 40 detik.
              </p>
            </div>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-accent-red">
            {error}
          </p>
        )}
        <div hidden={view !== "review"}>
          <Notice>
            Acuan rencana {a.dependencyVersions.protocol} · seleksi{" "}
            {a.dependencyVersions.selection} · form{" "}
            {a.dependencyVersions.schema}. Periksa kekurangan, lalu catat
            pemeriksaan tiap item laporan. Nomor halaman tersedia setelah
            rendering lokal berhasil.
          </Notice>
          <details
            open
            className="mb-5 rounded-xl border border-border bg-background p-4"
          >
            <summary className="cursor-pointer text-sm font-medium">
              Hal yang perlu diselesaikan ({a.unresolvedIssues.length})
            </summary>
            <ul className="space-y-2 pl-5 text-sm text-subtext">
              {a.unresolvedIssues.map((i) => (
                <li key={i.code}>
                  {i.message.replace(
                    /Bagian (\w+)/g,
                    (_, key: string) => `Bagian ${sectionLabels[key] ?? key}`,
                  )}
                </li>
              ))}
            </ul>
          </details>
          {a.coverage.assignment && (
            <Notice>
              Keluaran tugas pilihan: {a.coverage.assignment.note} Instruksi
              yang dipakai tersimpan di dokumen pendamping. Periksa seluruh
              instruksi sebelum penyerahan.
            </Notice>
          )}
        </div>
      </Section>
      <div hidden={view !== "references"}>
        <ReferenceEditor workspace={w} act={act} busy={busy} />
      </div>
      <div hidden={view !== "review"}>
        <Section
          title="Cakupan pelaporan PRISMA ScR"
          description="Kutipan harus ada pada draft tersimpan. Menandai item dilaporkan adalah pemeriksaan manusia atas cakupan, bukan verifikasi otomatis kebenaran isinya."
        >
          <details className="mb-5 rounded-xl border border-border bg-background p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Lihat 22 item checklist
            </summary>
            <ol className="space-y-3 pl-5 text-sm">
              {a.checklist.map((i) => (
                <li key={i.item}>
                  <span className="font-medium">{i.label}</span>
                  <span className="ml-2 text-subtext">
                    {statusLabels[i.status]}
                  </span>
                  {i.note && (
                    <p className="mb-0 text-xs text-subtext">{i.note}</p>
                  )}
                </li>
              ))}
            </ol>
          </details>
          <div className="rounded-xl border border-border bg-background p-5">
            <label className="mb-4 block text-sm">
              Item checklist
              <Select
                className="mt-2 w-full"
                value={String(item)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setItem(n);
                  setKey(
                    n === 1
                      ? "title"
                      : n === 2
                        ? "abstract"
                        : n < 5
                          ? "introduction"
                          : n < 14
                            ? "methods"
                            : n < 19
                              ? "results"
                              : n < 22
                                ? "discussion"
                                : "appendix",
                  );
                  setQuote("");
                  setNote("");
                }}
              >
                {a.checklist.map((i) => (
                  <option key={i.item} value={i.item}>
                    {i.item}. {i.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="mb-4 block text-sm">
              Bagian draft
              <Select
                className="mt-2 w-full"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              >
                {Object.entries(sectionLabels).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              size="small"
              onClick={() =>
                panel.openText(
                  `${sectionLabels[key]}.docx`,
                  section?.text || "Bagian belum ditulis",
                )
              }
            >
              Baca bagian di panel
            </Button>
            <div className="mt-4">
              <Field
                label="Kutipan yang melaporkan item ini"
                hint="Salin dari bagian draft yang sudah disimpan. Nomor registrasi tidak diperlukan jika status belum terdaftar dilaporkan dengan jujur."
                value={quote}
                onChange={setQuote}
              />
              <Field
                label="Catatan pemeriksaan cakupan"
                value={note}
                onChange={setNote}
              />
            </div>
            <Button
              disabled={busy || !quote.trim() || !note.trim()}
              onClick={() =>
                void act({
                  action: "reporting_item",
                  data: { item, sectionKey: key, quote, note },
                })
              }
            >
              Simpan pemeriksaan item
            </Button>
          </div>
        </Section>
        {a.coverage.assignment && (
          <Section
            title="Persyaratan tugas pilihan"
            description="Petakan setiap persyaratan dari instruksi Anda ke kutipan bagian draft. Pemeriksaan tugas terpisah dari 22 item artikel penuh."
          >
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="whitespace-pre-wrap text-sm text-subtext">
                {a.coverage.assignment.instructions}
              </p>
              <ul className="pl-5 text-sm">
                {a.coverage.assignment.items?.map((i) => (
                  <li key={i.requirement}>
                    {i.requirement} · {statusLabels[i.status]}
                  </li>
                ))}
              </ul>
              <Field
                label="Nama persyaratan tugas"
                value={requirement}
                onChange={setRequirement}
              />
              <p className="text-xs text-subtext">
                Gunakan bagian, kutipan dan catatan pemeriksaan yang dipilih
                pada form di atas.
              </p>
              <label className="mb-4 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={completeInstructions}
                  onChange={(e) => setCompleteInstructions(e.target.checked)}
                />
                Saya sudah memetakan seluruh persyaratan pada instruksi tugas
              </label>
              <Button
                disabled={
                  busy || !requirement.trim() || !quote.trim() || !note.trim()
                }
                onClick={() =>
                  void act({
                    action: "reporting_item",
                    data: {
                      assignment: true,
                      requirement,
                      instructionsComplete: completeInstructions,
                      sectionKey: key,
                      quote,
                      note,
                    },
                  })
                }
              >
                Simpan pemetaan persyaratan tugas
              </Button>
            </div>
          </Section>
        )}
      </div>
      <div hidden={view !== "export"}>
        <Section
          title="Paket tersimpan"
          description="Setiap paket mengacu pada snapshot proyek dan tidak berubah ketika draft berikutnya diedit. Unduh kembali untuk melanjutkan pemeriksaan."
        >
          {!w.project.evidence.exports.length && (
            <Notice>
              Belum ada paket. Anda dapat membuat ekspor draft mulai sekarang.
            </Notice>
          )}
          {[...w.project.evidence.exports].reverse().map((m) => (
            <details
              key={m.exportId}
              open={m.exportId === w.project.evidence.exports.at(-1)?.exportId}
              className="mb-4 rounded-xl border border-border bg-background p-5"
            >
              <summary className="cursor-pointer text-sm font-medium">
                Revisi {m.projectRevision} ·{" "}
                {m.reviewState === "ready_for_review"
                  ? "Siap ditinjau"
                  : "Draft belum lengkap"}{" "}
                · {m.files.length} berkas
              </summary>
              <p className="text-xs text-subtext">
                {m.pagination.status === "rendered"
                  ? "Dokumen telah dirender secara lokal. Halaman checklist diisi hanya ketika kutipan tepat ditemukan satu kali dalam bagian yang sesuai; kutipan hilang atau ambigu tetap perlu diperiksa."
                  : "Rendering halaman belum tersedia. Checklist membawa halaman kosong dan status perlu diverifikasi."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void download(m.exportId)}>
                  Unduh paket ZIP
                </Button>
                {m.files
                  .map((f) => f.name)
                  .filter(
                    (n) =>
                      /\.(docx|csv|pdf)$/.test(n),
                  )
                  .map((n) => (
                    <span key={n} className="inline-flex max-w-full flex-wrap gap-1 rounded-md border border-border p-1">
                      {/\.(docx|csv)$/.test(n) && <Button size="small" variant="ghost" className="max-w-full" onClick={() => void panel.openExport(m.exportId, n)}><span className="truncate">Tinjau {n}</span></Button>}
                      <Button size="small" onClick={() => void download(m.exportId, n)}>{/\.pdf$/.test(n) ? n : "Unduh"}</Button>
                    </span>
                  ))}
                <Button
                  size="small"
                  onClick={() =>
                    panel.openText(
                      "manifest-ekspor.csv",
                      objectCsv(m.files.map((file) => ({ projectRevision: m.projectRevision, exportId: m.exportId, ...file }))),
                    )
                  }
                >
                  Manifest
                </Button>
              </div>
              <p className="mb-0 text-xs text-subtext">
                PDF sumber, respons mentah provider, lampiran workspace, kunci
                akses dan trace belajar dikecualikan dari paket.
              </p>
            </details>
          ))}
        </Section>
      </div>
    </>
  );
}
