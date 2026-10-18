import { Select } from "../../../components/ui/Select";
import { FocusComparison } from "./FocusComparison";
import { TermHelp } from "../TermHelp";
import { Button } from "../../../components/ui";
import { Field, Issues, Notice, Section } from "../shared";
import type { Direction, Workspace } from "../types";
import { DirectionBrief } from "./DirectionBrief";

const groups: {
  title: string;
  fields: [keyof Direction, string, string?][];
}[] = [
  {
    title: "Titik berangkat",
    fields: [
      [
        "interest",
        "Apa yang menarik untuk Anda pahami?",
        "Belum tahu topik? Mulai dari pengalaman kuliah, pekerjaan atau kehidupan sehari-hari.",
      ],
      [
        "field",
        "Bidang apa yang berkaitan?",
        "Contoh: pendidikan, kesehatan, teknologi, sosial. Anda bebas menuliskan bidang lain.",
      ],
      [
        "experience",
        "Pengalaman apa yang memicu minat ini?",
        "Pengalaman pribadi belum dianggap temuan umum yang didukung literatur.",
      ],
    ],
  },
  {
    title: "Fenomena",
    fields: [
      ["phenomenon", "Apa yang terjadi dan apa yang belum dipahami?"],
      [
        "participants",
        "Siapa atau hal apa yang terlibat?",
        "Boleh tidak berlaku untuk kajian konsep, kebijakan atau dokumen.",
      ],
      ["context", "Dalam lingkungan atau keadaan apa?"],
    ],
  },
  {
    title: "Batas konsep",
    fields: [
      [
        "concept",
        "Hal apa yang ingin Anda petakan?",
        "Jenis praktik, karakteristik, cara penggunaan atau hambatan?",
      ],
      ["exclusions", "Aspek apa yang ingin disisihkan?"],
      [
        "objective",
        "Apa tujuan pemetaan Anda?",
        "Sedikit hasil pencarian tidak membuktikan kebaruan.",
      ],
    ],
  },
  {
    title: "Istilah dan sumber",
    fields: [
      ["terms", "Istilah Indonesia atau Inggris apa yang diketahui?"],
      [
        "seedSources",
        "Adakah sumber awal?",
        "Catat judul, DOI/URL dan asalnya. Ini belum hasil pencarian formal.",
      ],
      [
        "uncertainty",
        "Apa yang masih belum jelas?",
        "Periksa waktu, cakupan dan review terdahulu. Eksplorasi dapat dilakukan melalui tahap Sumber.",
      ],
    ],
  },
  {
    title: "Pilihan fokus",
    fields: [
      ["choice", "Fokus mana yang Anda pilih?"],
      [
        "reason",
        "Mengapa fokus ini relevan dan realistis?",
        "Pertimbangkan konsep, cakupan, sumber awal dan waktu.",
      ],
    ],
  },
  {
    title: "Pertanyaan kajian",
    fields: [
      ["title", "Judul kerja kajian"],
      [
        "question",
        "Apa pertanyaan kajian Anda?",
        "Hubungkan hal yang dikaji, konsep yang dipetakan dan konteksnya.",
      ],
    ],
  },
];
export function DirectionInterview({
  value,
  workspace,
  onChange,
  confirm,
  busy,
}: {
  value: Direction;
  workspace: Workspace;
  onChange: (value: Direction) => void;
  confirm: () => void;
  busy: boolean;
}) {
  const step = Math.min(value.step, groups.length - 1);
  return (
    <Section
      title="Tentukan arah kajian"
      description="Jawaban boleh berupa poin. Anda dapat kembali, mengoreksi dan melanjutkan kapan saja."
    >
      <nav
        aria-label="Langkah wawancara"
        className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-2 sm:grid-cols-3"
      >
        {groups.map((g, i) => (
          <Button
            key={g.title}
            size="small"
            variant="ghost"
            active={step === i}
            className="h-auto min-h-10 justify-start gap-2 whitespace-normal px-2 py-2 text-left text-xs [&.active]:text-primary"
            onClick={() => onChange({ ...value, step: i })}
            aria-current={step === i ? "step" : undefined}
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border text-xs tabular-nums">
              {i + 1}
            </span>
            {g.title}
          </Button>
        ))}
      </nav>
      <div className="mb-5 rounded-xl border border-border bg-background p-4 sm:p-5">
        <p className="mb-1 mt-0 text-xs tabular-nums text-subtext">
          Langkah {step + 1} dari {groups.length}
        </p>
        <h3 className="mb-5 mt-0 text-base font-semibold">
          {groups[step].title}
        </h3>
        {groups[step].fields.map(([key, label, hint]) => (
          <Field
            key={key}
            label={label}
            hint={hint}
            value={String(value[key])}
            rows={key === "title" ? 1 : 3}
            onChange={(text) => onChange({ ...value, [key]: text })}
          />
        ))}
        {step === 0 && workspace.project.entry === "assignment" && (
          <details className="mb-5">
            <summary>Instruksi perkuliahan pilihan</summary>
            <Field
              label="Salin instruksi asli"
              value={value.instructions}
              onChange={(text) => onChange({ ...value, instructions: text })}
            />
          </details>
        )}
        {step === 4 && (
          <>
            <Field
              label="Kandidat fokus untuk dibandingkan"
              hint="Maksimal tiga, satu per baris. Rumusan Anda, bukan temuan atau rekomendasi AI."
              value={value.candidates.join("\n")}
              onChange={(text) =>
                onChange({ ...value, candidates: text.split("\n").slice(0, 3) })
              }
            />
            <FocusComparison
              value={value}
              workspace={workspace}
              onChange={onChange}
            />
          </>
        )}
        {step === 5 && (
          <>
            <TermHelp terms={["PCC", "JBI"]} />
            <label className="mb-5 block text-sm font-medium">
              Jenis tujuan kajian
              <Select
                className="mt-2 block w-full rounded-lg border border-border bg-background p-3"
                value={value.reviewFit}
                onChange={(e) =>
                  onChange({ ...value, reviewFit: e.target.value })
                }
              >
                <option value="">Pilih setelah meninjau tujuan</option>
                <option value="mapping">
                  Memetakan cakupan, jenis atau karakteristik bukti
                </option>
                <option value="effectiveness">
                  Menilai efektivitas atau sebab-akibat
                </option>
                <option value="uncertain">Belum yakin</option>
              </Select>
            </label>
            {value.reviewFit && value.reviewFit !== "mapping" && (
              <Notice>
                Tujuan efektivitas mungkin membutuhkan jenis review lain.
                Periksa bersama pembimbing sebelum mengesahkan jalur Scoping
                Review; jawaban tetap tersimpan.
              </Notice>
            )}
            <details className="mb-5 text-sm text-subtext">
              <summary>Apa arti PCC?</summary>
              <p>
                Population/Participants, Concept, Context: siapa atau apa yang
                dikaji, hal yang dipetakan, dan konteksnya. Populasi manusia
                tertentu tidak selalu relevan.
              </p>
            </details>
            <Issues items={workspace.directionBlockers} />
          </>
        )}
        {step === groups.length - 1 && <DirectionBrief value={value} />}
        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
          <Button
            disabled={step === 0}
            onClick={() => onChange({ ...value, step: step - 1 })}
          >
            Kembali
          </Button>
          {step < groups.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => onChange({ ...value, step: step + 1 })}
            >
              Lanjutkan pertanyaan
            </Button>
          ) : (
            <Button variant="primary" disabled={busy} onClick={confirm}>
              Konfirmasi arah dan buat rencana
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}
