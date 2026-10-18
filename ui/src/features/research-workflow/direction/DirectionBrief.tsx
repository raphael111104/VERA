import type { Direction } from "../types";

export function DirectionBrief({ value }: { value: Direction }) {
  const rows = [
    ["Bidang/minat", value.field || value.interest],
    ["Fenomena", value.phenomenon],
    [
      "Siapa atau apa",
      value.participants || "Tidak ditetapkan; periksa relevansinya",
    ],
    ["Hal yang dipetakan", value.concept],
    ["Konteks", value.context],
    ["Tujuan", value.objective],
    ["Fokus pilihan", value.choice],
    ["Alasan pilihan", value.reason],
    ["Pertanyaan", value.question],
    ["Sumber awal", value.seedSources || "Belum dicatat"],
    ["Ketidakpastian", value.uncertainty || "Belum dicatat"],
  ];
  return (
    <details className="my-5 rounded-lg border border-border bg-background p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Ringkasan arah kajian
      </summary>
      <p className="text-xs text-subtext">
        Rangkuman dari jawaban Anda. Sumber manual dan pilihan fokus belum
        dianggap bukti literatur yang terverifikasi.
      </p>
      <dl className="grid gap-3 text-sm md:grid-cols-3">
        {rows.map(([label, text]) => (
          <div className="md:col-span-3" key={label}>
            <dt className="font-medium">{label}</dt>
            <dd className="m-0 mt-1 whitespace-pre-wrap text-subtext">
              {text || "Belum diisi"}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
