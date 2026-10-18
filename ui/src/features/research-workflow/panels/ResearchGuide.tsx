import { useState, type ReactNode } from "react";
import { Button } from "../../../components/ui";
import type { ModelSelection } from "../../../components/ModelPicker";
import { activeTransfer, recommendation, stageGuides } from "../guidance";
import type { Command, Workspace } from "../types";
import { StageAssistance } from "./StageAssistance";

export function ResearchGuide({
  workspace: w,
  activity,
  act,
  busy,
  selection,
  modelControls,
  onNavigate,
  onFiles,
  onRecord,
  onPdf,
}: {
  workspace: Workspace;
  activity: string;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
  selection: ModelSelection | null;
  modelControls: ReactNode;
  onNavigate: (activity: string) => void;
  onFiles: () => void;
  onRecord: (id: string) => void;
  onPdf: (id: string) => void;
}) {
  const [mode, setMode] = useState("explain");
  const [step, setStep] = useState(0);
  const guide = stageGuides[activity] ?? stageGuides.direction;
  const next =
    w.actor.role === "reviewer"
      ? {
          text: "Tinjau kriteria dan sumber, lalu catat keputusan serta alasan Anda secara independen. Penilaian reviewer lain mengikuti aturan penyembunyian yang berlaku.",
          target: "selection",
          label: "Lanjutkan seleksi independen",
        }
      : recommendation(w, activity);
  const transfer = activeTransfer(w);
  const canPropose =
    !["learning", "history"].includes(activity) &&
    w.finalStagesEnabled &&
    w.actor.role === "owner";
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <section
        aria-label="Panduan tahap aktif"
        className="rounded-xl border border-border bg-surface p-4"
      >
        <p className="mb-1 mt-0 text-xs font-medium text-subtext">
          Panduan VERA · {guide.phase}
        </p>
        <h2 className="m-0 text-base font-semibold text-balance">
          {guide.title}
        </h2>
        <p className="mb-0 mt-2 text-sm leading-relaxed text-pretty">
          {guide.goal}
        </p>
        <div className="mt-4 border-t border-border pt-3">
          <h3 className="m-0 text-sm font-semibold text-balance">
            Langkah berikutnya
          </h3>
          <p className="mb-3 mt-2 text-sm leading-relaxed text-pretty">
            {next.text}
          </p>
          <Button
            variant="primary"
            size="small"
            disabled={busy}
            onClick={() => onNavigate(next.target)}
          >
            {next.label}
          </Button>
        </div>
      </section>
      <div
        role="group"
        aria-label="Cara bantuan Panduan VERA"
        className="my-3 flex flex-wrap gap-2"
      >
        <Button
          size="small"
          active={mode === "explain"}
          aria-pressed={mode === "explain"}
          onClick={() => setMode("explain")}
        >
          Jelaskan
        </Button>
        <Button
          size="small"
          active={mode === "coach"}
          aria-pressed={mode === "coach"}
          disabled={transfer}
          onClick={() => setMode("coach")}
        >
          Bimbing saya
        </Button>
        {canPropose && (
          <Button
            size="small"
            active={mode === "proposal"}
            aria-pressed={mode === "proposal"}
            disabled={transfer}
            onClick={() => setMode("proposal")}
          >
            Siapkan usulan
          </Button>
        )}
      </div>
      {transfer && (
        <p
          role="status"
          className="rounded-lg border border-border p-3 text-sm leading-relaxed text-pretty"
        >
          Latihan mandiri sedang aktif. Panduan tujuan tetap dapat dibaca;
          petunjuk dan usulan dibatasi sampai tugas diserahkan atau diakhiri di
          Belajar bersama VERA.
        </p>
      )}
      {mode === "explain" && (
        <section
          aria-label="Penjelasan tahap"
          className="text-sm leading-relaxed"
        >
          <h3 className="mb-1 text-sm font-semibold text-balance">
            Yang dapat VERA bantu
          </h3>
          <p className="mt-0 text-pretty">{guide.help}</p>
          <h3 className="mb-1 text-sm font-semibold text-balance">
            Keputusan Anda
          </h3>
          <p className="mt-0 text-pretty">{guide.boundary}</p>
          <p className="text-xs text-pretty text-subtext">
            Panduan lokal ini memakai tahap dan status kajian tersimpan. Panduan
            tidak menjalankan model AI atau mengubah data akademik. Belum
            tersedia berarti masih perlu diperiksa, bukan diisi berdasarkan
            dugaan.
          </p>
        </section>
      )}
      {mode === "coach" && !transfer && (
        <section
          aria-label="Bimbingan bertahap"
          className="rounded-xl border border-border p-4"
        >
          <p className="mb-2 mt-0 text-xs tabular-nums text-subtext">
            Pertanyaan {step + 1} dari {guide.questions.length}
          </p>
          <h3 className="m-0 text-sm font-semibold text-balance">
            {guide.questions[step][0]}
          </h3>
          <p className="text-sm leading-relaxed text-pretty">
            {guide.questions[step][1]}
          </p>
          <p className="text-xs leading-relaxed text-pretty text-subtext">
            Isi jawaban dan alasan pada form utama. Membuka petunjuk tidak
            menghasilkan skor kemampuan.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              size="small"
              disabled={step === guide.questions.length - 1}
              onClick={() => setStep(step + 1)}
            >
              Petunjuk berikutnya
            </Button>
          </div>
        </section>
      )}
      {canPropose && (
        <div hidden={mode !== "proposal"}>
          <StageAssistance
            workspace={w}
            act={act}
            busy={busy}
            selection={selection}
            activity={activity}
            modelControls={modelControls}
            onRecord={onRecord}
            onPdf={onPdf}
          />
        </div>
      )}
      <details className="mt-4 rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Sumber, keluaran, dan bantuan belajar
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="small" onClick={onFiles}>
            Tinjau DOCX / CSV
          </Button>
          {w.finalStagesEnabled && w.actor.role === "owner" && (
            <Button
              size="small"
              disabled={busy}
              onClick={() => onNavigate("learning")}
            >
              Belajar bersama VERA
            </Button>
          )}
          {activity === "charting" &&
            w.project.records
              .filter((r) => w.evidenceSummary.included.includes(r.id))
              .slice(0, 3)
              .map((r) => (
                <Button size="small" key={r.id} onClick={() => onRecord(r.id)}>
                  Buka sumber: {r.title}
                </Button>
              ))}
        </div>
        <p className="mb-0 text-xs leading-relaxed text-pretty text-subtext">
          Pratinjau tidak mengesahkan isi. Akun institusi, hak akses jurnal, dan
          pengiriman ke layanan luar tetap memerlukan tindakan serta konfirmasi
          Anda.
        </p>
      </details>
    </div>
  );
}
