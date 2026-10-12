import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";
import { DIAGNOSIS_INDICATORS, DIAGNOSIS_LEVELS, completeDiagnosis, diagnosisFocus, diagnosisUncertain, type DiagnosisAnswers } from "./onboardingDiagnosis";

export function ResearchDiagnosis({ answers, onChange, onBack, onComplete }: {
  answers: DiagnosisAnswers;
  onChange: (answers: DiagnosisAnswers) => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = DIAGNOSIS_INDICATORS[index];
  useEffect(() => { heading.current?.focus(); }, [index]);
  const answered = DIAGNOSIS_INDICATORS.filter(({ id }) => answers[id] !== undefined).length;
  return <section lang="id" aria-labelledby="diagnosis-title">
    <h2 id="diagnosis-title" className="m-0 text-3xl">Kenali titik awal Anda</h2>
    <p className="mt-3 mb-6 text-base leading-relaxed text-subtext">Jawab berdasarkan pengalaman Anda saat ini. Asesmen mandiri ini membantu memetakan kebutuhan pendampingan awal; hasilnya bukan tes atau sertifikasi kemampuan.</p>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-subtext" role="status" aria-live="polite">
      <span>{question.area} · Pertanyaan {index + 1} dari {DIAGNOSIS_INDICATORS.length}</span>
      <span>{answered} terjawab</span>
    </div>
    <progress className="mb-6 h-2 w-full accent-primary" value={answered} max={DIAGNOSIS_INDICATORS.length} aria-label="Kemajuan asesmen mandiri" />
    <h3 ref={heading} tabIndex={-1} className="mt-0 mb-3 text-xl font-medium outline-none">{question.title}</h3>
    <fieldset className="m-0 min-w-0 border-0 p-0" key={question.id}>
      <legend className="mb-3 text-base leading-relaxed">{question.question}</legend>
      <p id="diagnosis-example" className="mt-0 mb-5 text-sm leading-relaxed text-subtext">{question.example}</p>
      <div className="flex flex-col gap-3">
        {DIAGNOSIS_LEVELS.map((level) => <label key={level.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 has-checked:border-primary has-checked:bg-primary-subtle focus-within:outline-2 focus-within:outline-primary">
          <input type="radio" name={question.id} value={level.id} checked={answers[question.id] === level.id} onChange={() => onChange({ ...answers, [question.id]: level.id })} aria-describedby="diagnosis-example" className="mt-1 shrink-0 accent-primary" />
          <span><span className="block text-base font-medium">{level.label}</span><span className="mt-1 block text-sm leading-relaxed text-subtext">{level.detail}</span></span>
        </label>)}
      </div>
    </fieldset>
    <div className="mt-6 flex items-center justify-between gap-3">
      <Button variant="ghost" onClick={() => index === 0 ? onBack() : setIndex(index - 1)}><ArrowLeft size={14} /> Kembali</Button>
      <Button variant="primary" disabled={answers[question.id] === undefined || (index === DIAGNOSIS_INDICATORS.length - 1 && !completeDiagnosis(answers))} onClick={() => index < DIAGNOSIS_INDICATORS.length - 1 ? setIndex(index + 1) : onComplete()}>{index < DIAGNOSIS_INDICATORS.length - 1 ? "Pertanyaan berikutnya" : "Lihat profil awal"}<ArrowRight size={14} /></Button>
    </div>
  </section>;
}

export function DiagnosisSummary({ answers }: { answers: DiagnosisAnswers }) {
  const focus = diagnosisFocus(answers);
  const uncertain = diagnosisUncertain(answers);
  return <section lang="id" className="mb-6 rounded-lg border border-border bg-background p-5" aria-labelledby="diagnosis-summary-title">
    <h3 id="diagnosis-summary-title" className="mt-0 mb-2 text-lg font-medium">Kebutuhan pendampingan awal</h3>
    <p className="m-0 text-sm leading-relaxed text-subtext">Profil ini berasal dari jawaban Anda dan belum diverifikasi melalui tugas penelitian atau tulisan.</p>
    {focus.length > 0 ? <><p className="mt-4 mb-2 text-sm font-medium">Bagian yang membutuhkan pengenalan atau bimbingan:</p><ul className="m-0 list-disc space-y-1 pl-5 text-sm">{focus.map(({ id, title }) => <li key={id}>{title}</li>)}</ul></> : <p className="mt-4 mb-0 text-sm leading-relaxed">{uncertain.length === DIAGNOSIS_INDICATORS.length ? "Anda belum yakin pada seluruh indikator. Profil awal masih perlu dipetakan melalui latihan dan umpan balik." : "Anda melaporkan dapat bekerja cukup mandiri pada bagian yang sudah Anda nilai. Pemeriksaan sumber dan umpan balik tetap diperlukan."}</p>}
    {uncertain.length > 0 && <><p className="mt-4 mb-2 text-sm font-medium">Bagian yang masih perlu dipetakan:</p><ul className="m-0 list-disc space-y-1 pl-5 text-sm">{uncertain.map(({ id, title }) => <li key={id}>{title}</li>)}</ul></>}
    <details className="mt-4 text-sm"><summary className="cursor-pointer font-medium">Lihat semua jawaban</summary><dl className="mt-3 space-y-3">{DIAGNOSIS_INDICATORS.map(({ id, title }) => <div key={id}><dt className="text-subtext">{title}</dt><dd className="m-0 font-medium">{DIAGNOSIS_LEVELS.find((level) => level.id === answers[id])?.label ?? "Belum dijawab"}</dd></div>)}</dl></details>
    <p className="mt-4 mb-0 text-xs leading-relaxed text-subtext">Jawaban akan disimpan di profil lokal VERA saat masuk workspace. Anda dapat kembali untuk memperbaiki jawaban sebelum melanjutkan.</p>
  </section>;
}
