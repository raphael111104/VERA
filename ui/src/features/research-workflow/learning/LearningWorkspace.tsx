import { useState } from "react";
import { Button } from "../../../components/ui";
import { Select } from "../../../components/ui/Select";
import { Field, Notice, Section, ViewSwitcher } from "../shared";
import { learningTrace } from "../api";
import type { Command, Workspace } from "../types";
import { objectCsv, saveBlob } from "../outputs";
import { useResearchPanel } from "../panels/ResearchPanel";
const activities: Record<string, string> = {
  direction: "Arah kajian",
  protocol: "Rencana kajian",
  search: "Pencarian",
  selection: "Pemilihan sumber",
  charting: "Catatan sumber",
  synthesis: "Sintesis",
  draft: "Penulisan",
  audit: "Audit",
};
const hypotheses: Record<string, string> = {
  none: "Pemeriksaan umum",
  novelty: "Sedikit hasil dan kebaruan",
  metadata: "Metadata dan teks lengkap",
  frequency: "Frekuensi dan efektivitas",
  criteria: "Perubahan kriteria",
  competence: "Draft berbantuan dan kemampuan mandiri",
};
const rubric = [
  "Keselarasan pertanyaan dan kriteria",
  "Pembedaan metadata abstrak dan teks lengkap",
  "Kesesuaian kesimpulan dengan bukti",
  "Pelaporan keterbatasan dan perubahan",
];
export function LearningWorkspace({
  workspace: w,
  act,
  busy,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const events = w.project.evidence.learning ?? [],
    owner = w.actor.role === "owner";
  const panel = useResearchPanel();
  const [tab, setTab] = useState("coach"),
    [activity, setActivity] = useState("selection"),
    [judgement, setJudgement] = useState(""),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [hypothesis, setHypothesis] = useState("none"),
    [response, setResponse] = useState(""),
    [final, setFinal] = useState(""),
    [correction, setCorrection] = useState(""),
    [topic, setTopic] = useState(""),
    [newEvidence, setNewEvidence] = useState(""),
    [schedule, setSchedule] = useState(new Date().toISOString().slice(0, 10)),
    [answer, setAnswer] = useState(""),
    [transferReason, setTransferReason] = useState(""),
    [ratings, setRatings] = useState([
      "needs_review",
      "needs_review",
      "needs_review",
      "needs_review",
    ]),
    [reviewNote, setReviewNote] = useState(""),
    [consent, setConsent] = useState(false),
    [researchConsent, setResearchConsent] = useState(false),
    [purpose, setPurpose] = useState(
      "Ekspor catatan pembelajaran lokal untuk saya",
    ),
    [error, setError] = useState("");
  const decisions = events.filter((e) => e.type === "learning_decision"),
    current = decisions.at(-1),
    helps = events.filter(
      (e) => e.type === "learning_help" && e.decisionId === current?.id,
    ),
    savedResponse = events
      .filter(
        (e) =>
          e.type === "learning_response" &&
          e.decisionId === current?.id,
      )
      .at(-1),
    level = Math.max(0, ...helps.map((e) => e.usedLevel ?? 0));
  const active = events.find(
    (e) =>
      e.type === "transfer_start" &&
      !events.some(
        (s) =>
          ["transfer_submit", "transfer_cancel"].includes(s.type) &&
          s.id === e.id,
      ),
  );
  const submitted = events.filter((e) => e.type === "transfer_submit").at(-1),
    savedConsent = events.filter((e) => e.type === "learning_consent").at(-1);
  const exportTrace = async () => {
    setError("");
    try {
      const trace = await learningTrace(w.project.id) as { projectId: string; policyVersion: string; purpose: string; warning: string; events: Record<string, unknown>[] };
      const text = objectCsv(trace.events.map((event) => ({ projectId: trace.projectId, policyVersion: trace.policyVersion, purpose: trace.purpose, warning: trace.warning, ...event })));
      panel.openText("catatan-belajar.csv", text);
      saveBlob("catatan-belajar.csv", new Blob([text], { type: "text/csv;charset=utf-8" }));
    } catch (e) {
      setError(String(e));
    }
  };
  if (!owner)
    return (
      <Notice>
        Catatan belajar dan persetujuan ekspornya dikelola pemilik proyek.
      </Notice>
    );
  return (
    <Section
      title="Belajar bersama VERA"
      description="Tulis penilaian awal Anda, buka bantuan sesuai kebutuhan, lalu jelaskan revisinya. Catatan ini membantu proses belajar dan bukan penilaian kemampuan permanen."
    >
      <ViewSwitcher
        label="Kegiatan belajar"
        value={tab}
        onChange={setTab}
        options={[
          ["coach", "Bantuan bertahap"],
          ["transfer", "Latihan mandiri"],
          ["quality", "Tinjauan mutu"],
          ["trace", "Catatan belajar"],
        ]}
      />
      {error && (
        <p role="alert" className="text-sm text-accent-red">
          {error}
        </p>
      )}
      {active && (
        <Notice>
          Tugas transfer mandiri sedang aktif. Bantuan bertingkat dan pengiriman
          sidechat dibatasi sampai jawaban diserahkan atau tugas diakhiri.
          Instruksi dan rubrik tetap tersedia.
        </Notice>
      )}
      {tab === "coach" && (
        <>
          <Notice>
            Bantuan ini memakai pertanyaan dan aturan lokal versi
            vera-scaffolding-1. Pilihan miskonsepsi adalah hipotesis yang dapat
            Anda koreksi. Sidechat model AI tetap tersedia untuk pendampingan
            umum di luar tugas transfer.
          </Notice>
          <div className="rounded-xl border border-border bg-background p-5">
            <label className="mb-4 block text-sm">
              Aktivitas
              <Select
                className="mt-2 w-full"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
              >
                {Object.entries(activities).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
            <Field
              label="Penilaian awal saya"
              value={judgement}
              onChange={setJudgement}
            />
            <Field
              label="Alasan sebelum melihat bantuan"
              value={reason}
              onChange={setReason}
            />
            <Field
              label="Bukti yang telah saya buka"
              hint="Catat record, halaman/bagian atau versi rencana. Hindari menyalin dokumen sumber penuh."
              value={evidence}
              onChange={setEvidence}
            />
            <label className="mb-4 block text-sm">
              Hal yang ingin diperiksa
              <Select
                className="mt-2 w-full"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
              >
                {Object.entries(hypotheses).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              disabled={
                busy ||
                !!active ||
                !judgement.trim() ||
                !reason.trim() ||
                !evidence.trim()
              }
              onClick={() =>
                void act({
                  action: "learning_decision",
                  data: {
                    id: crypto.randomUUID(),
                    activity,
                    judgement,
                    reason,
                    evidence,
                    hypothesis,
                  },
                })
              }
            >
              Simpan penilaian awal
            </Button>
          </div>
          {current && (
            <div className="mt-5 rounded-xl border border-border bg-background p-5">
              <p className="mt-0 text-sm font-medium">
                Penilaian tersimpan: {current.judgement}
              </p>
              <p className="text-xs text-subtext">{current.reason}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Pertanyaan pemantik",
                  "Petunjuk terarah",
                  "Contoh parsial",
                  "Usulan pemeriksaan lengkap",
                ].map((label, i) => (
                  <Button
                    key={label}
                    size="small"
                    disabled={
                      busy ||
                      !!active ||
                      i > level ||
                      current.dependency !== w.evidenceSummary.dependency
                    }
                    onClick={() =>
                      void act({
                        action: "learning_help",
                        data: { decisionId: current.id, level: i + 1 },
                      })
                    }
                  >
                    {i + 1}. {label}
                  </Button>
                ))}
              </div>
              {current.dependency !== w.evidenceSummary.dependency && (
                <p className="text-sm text-subtext">
                  Bukti kajian berubah. Simpan penilaian awal baru sebelum
                  meminta bantuan.
                </p>
              )}
              {helps.map((h, i) => (
                <p
                  key={`${h.at}-${i}`}
                  className="rounded-lg bg-surface p-4 text-sm leading-relaxed"
                >
                  {h.usedLevel}. {h.recommendation}
                </p>
              ))}
              {savedResponse && (
                <div className="my-4 rounded-xl border border-border bg-surface p-4 text-sm">
                  <p className="mb-2 mt-0 font-medium">Refleksi tersimpan</p>
                  <p className="my-2">
                    <strong>Respons:</strong> {savedResponse.response}
                  </p>
                  <p className="my-2">
                    <strong>Penilaian akhir:</strong>{" "}
                    {savedResponse.finalJudgement}
                  </p>
                  {savedResponse.hypothesisCorrection && (
                    <p className="mb-0 mt-2 text-subtext">
                      <strong>Koreksi hipotesis:</strong>{" "}
                      {savedResponse.hypothesisCorrection}
                    </p>
                  )}
                </div>
              )}
              {!!helps.length && (
                <>
                  <Field
                    label="Respons saya terhadap bantuan"
                    value={response}
                    onChange={setResponse}
                  />
                  <Field
                    label="Penilaian akhir dan revisi yang saya pilih"
                    value={final}
                    onChange={setFinal}
                  />
                  <Field
                    label="Koreksi hipotesis bantuan bila diperlukan"
                    value={correction}
                    onChange={setCorrection}
                  />
                  <Button
                    disabled={
                      busy || !!active || !response.trim() || !final.trim()
                    }
                    onClick={() =>
                      void act({
                        action: "learning_response",
                        data: {
                          decisionId: current.id,
                          response,
                          finalJudgement: final,
                          hypothesisCorrection: correction,
                        },
                      })
                    }
                  >
                    Simpan refleksi dan revisi
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
      {tab === "transfer" && (
        <>
          <Notice>
            Latihan mandiri opsional memakai topik dan bukti baru yang Anda
            sediakan. Jadwal dan jeda ditetapkan pengguna atau protokol studi.
            Hasilnya dinilai terpisah dari mutu artikel berbantuan; tidak
            menjadi sertifikasi kompetensi.
          </Notice>
          {active ? (
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mt-0 text-base">{active.topic}</h3>
              <p className="whitespace-pre-wrap text-sm">{active.evidence}</p>
              <p className="text-sm text-subtext">{active.instructions}</p>
              <p className="text-xs text-subtext">
                Jadwal {active.scheduledAt} · {active.policyVersion} ·{" "}
                {active.promptVersion} · bantuan instruksi dan rubrik saja
              </p>
              <ol className="pl-5 text-sm">
                {rubric.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
              <Field
                label="Jawaban mandiri"
                rows={8}
                value={answer}
                onChange={setAnswer}
              />
              <Field
                label="Alasan dan batas bukti"
                value={transferReason}
                onChange={setTransferReason}
              />
              <div className="flex gap-2">
                <Button
                  disabled={busy || !answer.trim() || !transferReason.trim()}
                  onClick={() =>
                    void act({
                      action: "transfer_submit",
                      data: { id: active.id, answer, reason: transferReason },
                    })
                  }
                >
                  Serahkan jawaban mandiri
                </Button>
                <Button
                  disabled={busy || !transferReason.trim()}
                  onClick={() =>
                    void act({
                      action: "transfer_cancel",
                      data: { id: active.id, reason: transferReason },
                    })
                  }
                >
                  Akhiri tugas dengan alasan
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background p-5">
              <Field
                label="Topik baru untuk transfer"
                value={topic}
                onChange={setTopic}
              />
              <Field
                label="Bukti baru untuk latihan"
                hint="Gunakan kutipan yang dapat dibagikan secara legal atau skenario latihan yang jelas dilabeli. Jangan mengulang bukti kajian ini."
                rows={5}
                value={newEvidence}
                onChange={setNewEvidence}
              />
              <Field
                label="Jadwal atau jeda menurut rancangan studi"
                value={schedule}
                onChange={setSchedule}
              />
              <Button
                disabled={
                  busy ||
                  !topic.trim() ||
                  !newEvidence.trim() ||
                  !schedule.trim()
                }
                onClick={() =>
                  void act({
                    action: "transfer_start",
                    data: {
                      id: crypto.randomUUID(),
                      topic,
                      evidence: newEvidence,
                      scheduledAt: schedule,
                      model: "no-model-independent-transfer",
                      study: researchConsent,
                    },
                  })
                }
              >
                Mulai tugas transfer mandiri
              </Button>
            </div>
          )}
          {submitted && (
            <details className="mt-5 rounded-xl border border-border bg-background p-5">
              <summary className="cursor-pointer text-sm font-medium">
                Nilai jawaban transfer terakhir dengan rubrik
              </summary>
              <p className="whitespace-pre-wrap text-sm">{submitted.answer}</p>
              {rubric.map((r, i) => (
                <label key={r} className="mb-4 block text-sm">
                  {r}
                  <Select
                    className="ml-3"
                    value={ratings[i]}
                    onChange={(e) =>
                      setRatings(
                        ratings.map((v, n) => (n === i ? e.target.value : v)),
                      )
                    }
                  >
                    <option value="needs_review">Belum dinilai</option>
                    <option value="developing">Perlu pengembangan</option>
                    <option value="supported">
                      Didukung jawaban dan bukti
                    </option>
                  </Select>
                </label>
              ))}
              <Field
                label="Catatan penilai manusia"
                value={reviewNote}
                onChange={setReviewNote}
              />
              <Button
                disabled={busy || !reviewNote.trim()}
                onClick={() =>
                  void act({
                    action: "transfer_review",
                    data: { id: submitted.id, ratings, note: reviewNote },
                  })
                }
              >
                Simpan penilaian kualitatif
              </Button>
            </details>
          )}
        </>
      )}
      {tab === "quality" && (
        <div className="space-y-4">
          <Notice>
            <strong>Keandalan sistem</strong>
            <p className="mb-0">
              {w.project.runs.filter((r) => r.status === "complete").length} run
              selesai;{" "}
              {w.project.runs.filter((r) => r.status !== "complete").length} run
              parsial, gagal, berjalan atau dibatalkan. Ini mengukur status
              proses, bukan mutu penelitian.
            </p>
          </Notice>
          <Notice>
            <strong>Mutu artefak berbantuan</strong>
            <p className="mb-0">
              {w.audit?.coverage.reported ?? 0} item pelaporan tercatat;{" "}
              {w.audit?.unresolvedIssues.length ?? 0} masalah terbuka. Lihat
              audit serta verifikasi klaim sebelum menilai isi artikel.
            </p>
          </Notice>
          <Notice>
            <strong>Kinerja tugas mandiri</strong>
            <p className="mb-0">
              {events.filter((e) => e.type === "transfer_submit").length}{" "}
              jawaban transfer;{" "}
              {events.filter((e) => e.type === "transfer_review").length}{" "}
              peristiwa penilaian manusia. Rubrik kualitatif tidak digabung
              menjadi skor draft atau sertifikat kemampuan.
            </p>
          </Notice>
        </div>
      )}
      {tab === "trace" && (
        <>
          <Notice>
            Trace belajar terpisah dari paket artikel. Persetujuan ekspor lokal
            tidak otomatis memberi izin penelitian atau pelatihan model. Anda
            dapat mencabutnya; catatan lokal tetap tersimpan. File sumber dan
            lampiran workspace tidak disertakan.
          </Notice>
          <label className="mb-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Saya mengizinkan ekspor catatan belajar proyek ini
          </label>
          <label className="mb-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={researchConsent}
              onChange={(e) => setResearchConsent(e.target.checked)}
            />
            Penggunaan untuk studi telah memperoleh persetujuan dan tata kelola
            yang sesuai
          </label>
          <Field
            label="Tujuan dan ruang lingkup penggunaan"
            value={purpose}
            onChange={setPurpose}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !purpose.trim()}
              onClick={() =>
                void act({
                  action: "learning_consent",
                  data: {
                    granted: consent,
                    researchUse: researchConsent,
                    purpose,
                  },
                })
              }
            >
              Simpan atau cabut persetujuan
            </Button>
            <Button
              disabled={!savedConsent?.granted}
              onClick={() => void exportTrace()}
            >
              Unduh trace belajar
            </Button>
          </div>
          <p className="text-xs text-subtext">
            Persetujuan tersimpan:{" "}
            {savedConsent?.granted
              ? "ekspor diizinkan"
              : "ekspor belum diizinkan atau dicabut"}
            ; penelitian{" "}
            {savedConsent?.researchUse
              ? "dinyatakan mendapat persetujuan"
              : "belum diizinkan"}
            .
          </p>
          <details className="mt-5">
            <summary className="cursor-pointer text-sm">
              Riwayat belajar ({events.length} peristiwa)
            </summary>
            <ol className="space-y-2 pl-5 text-xs text-subtext">
              {events.map((e, i) => (
                <li key={`${e.at}-${i}`}>
                  {new Date(e.at).toLocaleString("id-ID")} · {e.type} ·{" "}
                  {e.policyVersion}
                  {e.finalJudgement && <p>{e.finalJudgement}</p>}
                  {e.ratings && (
                    <p>
                      {e.ratings.join(" · ")} — {e.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </Section>
  );
}
