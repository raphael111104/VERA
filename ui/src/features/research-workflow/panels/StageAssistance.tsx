import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../../../components/ui";
import { Select } from "../../../components/ui/Select";
import type { ModelSelection } from "../../../components/ModelPicker";
import { sectionLabels } from "../draft/ManuscriptEditor";
import { Field, Notice } from "../shared";
import type { Command, Workspace } from "../types";
import {
  activeTransfer,
  hasInitialJudgement,
  needsJudgement,
  proposalReadiness,
} from "../guidance";
const labels: Record<string, string> = {
  direction: "Arah kajian",
  protocol: "Rencana kajian",
  search: "Strategi pencarian",
  selection: "Pertimbangan seleksi",
  charting: "Pencatatan informasi",
  synthesis: "Interpretasi temuan",
  draft: "Penulisan draft",
  audit: "Pemeriksaan integritas",
};
const states: Record<string, string> = {
  queued: "Menunggu hasil",
  proposed: "Usulan untuk ditinjau",
  accepted: "Diterapkan pengguna",
  rejected: "Ditolak pengguna",
  stale: "Usang — konteks telah berubah",
  failed: "Gagal — pekerjaan manual tetap tersedia",
  cancelled: "Dibatalkan pengguna",
};
const patchLabels: Record<string, string> = {
  candidates: "Alternatif fokus",
  terms: "Istilah pencarian",
  rationale: "Alasan kajian",
  objective: "Tujuan",
  question: "Pertanyaan kajian",
  inclusion: "Kriteria inklusi",
  exclusion: "Kriteria eksklusi",
  screening: "Rencana seleksi",
  charting: "Rencana pencatatan",
  chartingFields: "Kolom pencatatan",
  synthesis: "Rencana sintesis",
  query: "Query pencarian",
  theme: "Tema temuan",
};
export function StageAssistance({
  workspace: w,
  act,
  busy,
  selection,
  activity,
  modelControls,
  onRecord,
  onPdf,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
  selection: ModelSelection | null;
  activity: string;
  modelControls: ReactNode;
  onRecord: (id: string) => void;
  onPdf: (id: string) => void;
}) {
  const [kind, setKind] = useState(labels[activity] ? activity : "direction"),
    [sectionKey, setSection] = useState("introduction"),
    [engine, setEngine] = useState("local"),
    [level, setLevel] = useState(4),
    [reasons, setReasons] = useState<Record<string, string>>({}),
    [pollError, setPollError] = useState(false),
    [judgement, setJudgement] = useState(""),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [requestError, setRequestError] = useState("");
  const jobs = (w.project.evidence.jobs ?? []).filter(
      (j) => j.actorId === w.actor.id,
    ),
    queued = jobs.find((j) => j.status === "queued");
  const transfer = activeTransfer(w);
  const judgementNeeded = needsJudgement(kind) && !hasInitialJudgement(w, kind);
  const missingContext = proposalReadiness(w, kind, engine, level);
  useEffect(() => {
    if (!queued || busy || pollError || transfer) return;
    const timer = setTimeout(
      () =>
        void act({ action: "assist_tick", data: { jobId: queued.id } }).then(
          (ok) => {
            if (!ok) setPollError(true);
          },
        ),
      1800,
    );
    return () => clearTimeout(timer);
  }, [queued?.id, w.project.revision, busy, pollError, transfer]);
  if (w.actor.role !== "owner")
    return (
      <p className="p-4 text-sm text-subtext">
        Keputusan reviewer tetap pribadi. Bantuan tahap dikelola pemilik.
      </p>
    );
  const current = (field: string, stage: string) =>
    stage === "draft"
      ? (w.project.evidence.sections.find((s) => s.key === field)?.text ?? "")
      : field === "candidates" && stage === "direction"
        ? w.project.direction.candidates.join("\n")
        : String(
            (stage === "direction" ? w.project.direction : w.project.protocol)[
              field as never
            ] ?? "",
          );
  const requestLabels: Record<number, string> = {
    1: "Minta pertanyaan pemantik",
    2: "Minta petunjuk terarah",
    3: "Minta contoh parsial",
    4: "Siapkan usulan untuk ditinjau",
  };
  const levelLabels: Record<number, string> = {
    1: "pertanyaan pemantik",
    2: "petunjuk terarah",
    3: "contoh parsial",
    4: "usulan lengkap",
  };
  const requestAssistance = () => {
    setPollError(false);
    setRequestError("");
    void act({
      action: "assist_request",
      data: {
        id: crypto.randomUUID(),
        kind,
        sectionKey,
        engine,
        level,
        harness: selection?.harness,
        model: selection?.model,
        reasoningLevel: selection?.reasoningLevel,
      },
    }).then((ok) => {
      if (!ok)
        setRequestError(
          "Permintaan belum berhasil. Periksa pesan workspace dan coba lagi; jawaban utama tetap tersimpan.",
        );
    });
  };
  return (
    <div>
      <Notice>
        Usulan tidak mengubah kajian secara otomatis. Tinjau perubahan dan
        sumbernya, lalu terapkan atau tolak dengan alasan. Untuk mengubah isi,
        perbaiki form utama dan ajukan usulan baru dari konteks terbaru.
      </Notice>
      {judgementNeeded && (
        <section
          className="mb-4 rounded-xl border border-border p-4"
          aria-label="Penilaian awal sebelum usulan"
        >
          <h3 className="mb-2 mt-0 text-sm font-semibold text-balance">
            Pertimbangan Anda terlebih dahulu
          </h3>
          <p className="mt-0 text-xs leading-relaxed text-pretty text-subtext">
            Catat penilaian, alasan, dan bukti yang sudah Anda buka. Ini catatan
            belajar lokal untuk tahap ini, bukan skor kemampuan. Jika bukti
            berubah, catat pertimbangan baru.
          </p>
          <Field
            label="Penilaian awal saya"
            rows={2}
            value={judgement}
            onChange={setJudgement}
          />
          <Field
            label="Alasan penilaian awal"
            rows={2}
            value={reason}
            onChange={setReason}
          />
          <Field
            label="Bukti yang sudah saya buka"
            hint="Sebutkan sumber dan halaman/bagian, atau jawaban serta versi rencana yang Anda tinjau. Jangan menyalin credential."
            rows={2}
            value={evidence}
            onChange={setEvidence}
          />
          <Button
            size="small"
            disabled={
              busy ||
              transfer ||
              [judgement, reason, evidence].some(
                (v) => !v.trim() || v.length > 6000,
              )
            }
            onClick={() => {
              setRequestError("");
              void act({
                action: "learning_decision",
                data: {
                  id: crypto.randomUUID(),
                  activity: kind,
                  judgement,
                  reason,
                  evidence,
                  hypothesis: "none",
                },
              }).then((ok) => {
                if (!ok)
                  setRequestError(
                    "Penilaian awal belum tersimpan. Periksa pesan workspace dan coba lagi.",
                  );
              });
            }}
          >
            Simpan penilaian awal di tahap ini
          </Button>
        </section>
      )}
      {needsJudgement(kind) && !judgementNeeded && (
        <p role="status" className="text-xs text-subtext">
          Penilaian awal untuk konteks ini sudah tersimpan. Keputusan akhir
          tetap milik Anda.
        </p>
      )}
      {requestError && (
        <p role="alert" className="text-sm text-accent-red">
          {requestError}
        </p>
      )}
      {missingContext && (
        <p
          role="status"
          className="rounded-lg border border-border p-3 text-sm leading-relaxed text-pretty"
        >
          {missingContext} Anda tetap dapat memakai Jelaskan atau Bimbing saya.
        </p>
      )}
      <section className="mb-4 rounded-xl border border-border bg-surface p-4">
        <p className="mb-1 mt-0 text-xs font-medium text-subtext">
          Bantuan untuk tahap ini
        </p>
        <h2 className="mb-2 mt-0 text-sm font-semibold text-balance">
          {labels[kind]}
        </h2>
        <p className="mb-0 text-sm leading-relaxed text-pretty text-subtext">
          VERA akan menyiapkan {levelLabels[level] ?? "petunjuk terarah"} untuk
          Anda periksa. Keputusan dan perubahan tetap berada di tangan Anda.
        </p>
        <Button
          className="mt-3"
          disabled={
            busy ||
            transfer ||
            judgementNeeded ||
            !!missingContext ||
            !!queued ||
            (engine === "model" && !selection?.model)
          }
          onClick={requestAssistance}
        >
          {queued
            ? "Menyiapkan usulan…"
            : (requestLabels[level] ?? "Minta petunjuk")}
        </Button>
      </section>
      <details className="mb-4 rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Sesuaikan tahap dan jenis bantuan
        </summary>
        <div className="mt-3">
          <label className="mb-3 block text-xs">
            Tahap kajian
            <Select
              className="mt-1 w-full"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {Object.entries(labels).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </label>
          {kind === "draft" && (
            <label className="mb-3 block text-xs">
              Bagian draft
              <Select
                className="mt-1 w-full"
                value={sectionKey}
                onChange={(e) => setSection(e.target.value)}
              >
                {Object.entries(sectionLabels).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <label className="mb-3 block text-xs">
            Sumber bantuan
            <Select
              className="mt-1 w-full"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
            >
              <option value="local">Panduan lokal tanpa model</option>
              <option value="model" disabled={!selection?.model}>
                Model AI yang dipilih
              </option>
            </Select>
          </label>
          <label className="mb-3 block text-xs">
            Tingkat bantuan
            <Select
              className="mt-1 w-full"
              value={String(level)}
              onChange={(e) => setLevel(Number(e.target.value))}
            >
              <option value={1}>1. Pertanyaan pemantik</option>
              <option value={2}>2. Petunjuk terarah</option>
              <option value={3}>3. Contoh parsial</option>
              <option value={4}>4. Usulan lengkap</option>
            </Select>
          </label>
          {engine === "model" && <div className="mb-3">{modelControls}</div>}
          {engine === "model" && (
            <p className="mb-0 text-xs leading-relaxed text-pretty text-subtext">
              Ringkasan jawaban, rencana, metadata hingga 40 sumber dan sel
              terkonfirmasi akan dibaca model yang dipilih. Periksa izin layanan
              pada konfigurasi agent Anda. PDF sumber dan identitas tugas tidak
              disertakan.
            </p>
          )}
        </div>
      </details>
      {pollError && (
        <Button size="small" onClick={() => setPollError(false)}>
          Lanjutkan pemeriksaan hasil
        </Button>
      )}
      {[...jobs]
        .filter((job) => job.kind === kind)
        .reverse()
        .slice(0, 20)
        .map((job) => (
          <article
            key={job.id}
            className="mt-5 rounded-lg border border-border p-3"
          >
            <p className="mt-0 text-sm font-medium">
              {labels[job.kind]} · {states[job.status] ?? job.status}
            </p>
            <p className="text-xs text-subtext">
              {job.engine === "local"
                ? "Panduan lokal"
                : `Model AI: ${job.modelVersion}`}{" "}
              · {levelLabels[job.usedLevel ?? 2] ?? "bantuan terarah"}
            </p>
            {job.error && (
              <p role="alert" className="text-xs text-accent-red">
                {job.error}
              </p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {job.proposal?.summary}
            </p>
            {job.proposal?.patches.map((patch, i) => (
              <details key={i} className="mb-3 text-xs" open>
                <summary className="cursor-pointer font-medium">
                  Perubahan yang diusulkan:{" "}
                  {patchLabels[patch.field] ??
                    sectionLabels[patch.field] ??
                    patch.field}
                </summary>
                <p className="mb-1 text-subtext">Saat ini</p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-border p-2">
                  {current(patch.field, job.kind) || "Belum ada isi"}
                </pre>
                <p className="mb-1 text-subtext">Usulan</p>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-surface p-2">
                  {patch.text}
                </pre>
              </details>
            ))}
            {job.proposal?.recordIds.length ? (
              <p className="text-xs text-subtext">
                Sumber yang dirujuk:
                {job.proposal.recordIds.map((id) => (
                  <Button
                    key={id}
                    variant="ghost"
                    size="small"
                    onClick={() => onRecord(id)}
                  >
                    {w.project.records.find((r) => r.id === id)?.title ?? id}
                  </Button>
                ))}
              </p>
            ) : null}
            {job.proposal?.cellIds.map((id) => {
              const cell = w.project.evidence.cells.find((c) => c.id === id);
              return cell ? (
                <details
                  key={id}
                  className="my-3 rounded-lg border border-border p-3 text-xs"
                >
                  <summary className="cursor-pointer font-medium">
                    Bukti yang dirujuk: {cell.value || cell.state}
                  </summary>
                  <p className="leading-relaxed text-pretty">
                    {cell.locator.quote ||
                      "Kutipan belum tersedia; periksa sumber."}
                  </p>
                  <p className="text-subtext">
                    {cell.locator.page
                      ? `Halaman ${cell.locator.page}`
                      : cell.locator.section || "Lokasi belum tersedia"}{" "}
                    · {cell.verificationStatus}
                  </p>
                  <Button
                    size="small"
                    onClick={() =>
                      cell.locator.artifactId
                        ? onPdf(cell.locator.artifactId)
                        : onRecord(cell.recordId)
                    }
                  >
                    Periksa sumber bukti
                  </Button>
                </details>
              ) : null;
            })}
            {job.proposal && (
              <p className="text-xs leading-relaxed text-pretty text-subtext">
                Batas kepastian: periksa kecocokan usulan dengan sumber dan
                protokol. Tautan sumber atau status usulan tidak berarti
                verifikasi ilmiah. Panduan lokal bukan hasil pencarian atau
                ekstraksi PDF.
              </p>
            )}
            {job.status === "queued" && (
              <Button
                size="small"
                disabled={busy}
                onClick={() =>
                  void act({ action: "assist_cancel", data: { id: job.id } })
                }
              >
                Batalkan permintaan
              </Button>
            )}
            {job.status === "proposed" && (
              <>
                <Field
                  label="Alasan menerima atau menolak usulan"
                  rows={2}
                  value={reasons[job.id] ?? ""}
                  onChange={(text) =>
                    setReasons({ ...reasons, [job.id]: text })
                  }
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="small"
                    disabled={busy || transfer || !reasons[job.id]?.trim()}
                    onClick={() =>
                      void act({
                        action: "assist_review",
                        data: {
                          id: job.id,
                          accept: true,
                          reason: reasons[job.id],
                        },
                      })
                    }
                  >
                    {job.proposal?.patches.length
                      ? "Terapkan usulan"
                      : "Catat telah ditinjau"}
                  </Button>
                  <Button
                    size="small"
                    disabled={busy || transfer || !reasons[job.id]?.trim()}
                    onClick={() =>
                      void act({
                        action: "assist_review",
                        data: {
                          id: job.id,
                          accept: false,
                          reason: reasons[job.id],
                        },
                      })
                    }
                  >
                    Tolak usulan
                  </Button>
                </div>
              </>
            )}
            {job.status === "stale" && (
              <p className="text-xs text-subtext">
                Usulan ini tidak dapat diterapkan. Tinjau konteks terbaru dan
                ajukan permintaan baru.
              </p>
            )}
            {job.reviewReason && (
              <p className="text-xs text-subtext">
                Keputusan Anda: {job.reviewReason}
              </p>
            )}
          </article>
        ))}
    </div>
  );
}
