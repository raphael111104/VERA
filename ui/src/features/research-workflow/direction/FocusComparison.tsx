import { Select } from "../../../components/ui/Select";
import { Field } from "../shared";
import type { CandidateComparison, Direction, Workspace } from "../types";
const aspects = [
  ["clarity", "Kejelasan konsep dan batas"],
  ["mapping", "Kesesuaian untuk pemetaan bukti"],
  ["terms", "Istilah pencarian yang dapat dicoba"],
  ["sources", "Sumber awal yang telah diperiksa"],
  ["priorReview", "Kajian terdahulu dan alasan melanjutkan"],
  ["scope", "Keterjangkauan cakupan"],
  ["feasibility", "Waktu, akses, dan kelayakan"],
] as const;
export function FocusComparison({
  value,
  workspace,
  onChange,
}: {
  value: Direction;
  workspace: Workspace;
  onChange: (d: Direction) => void;
}) {
  const update = (candidate: string, patch: Partial<CandidateComparison>) => {
    const rows = value.comparisons ?? [];
    const row = rows.find((r) => r.candidate === candidate) ?? {
      candidate,
      aspects: {},
      recordIds: [],
      note: "",
      origin: "human",
    };
    onChange({
      ...value,
      comparisons: [
        ...rows.filter((r) => r.candidate !== candidate),
        { ...row, ...patch },
      ].filter((r) => value.candidates.includes(r.candidate)),
    });
  };
  return (
    <details
      className="mb-5 rounded-xl border border-border bg-background p-4"
      open
    >
      <summary className="cursor-pointer text-sm font-medium">
        Bandingkan kesiapan kandidat fokus
      </summary>
      <p className="text-xs leading-relaxed text-subtext">
        Periksa maksimal tiga kandidat. Status merupakan penilaian Anda saat
        ini. Sumber awal tidak membuktikan kebaruan atau ketiadaan penelitian
        lain.
      </p>
      {value.candidates
        .filter(Boolean)
        .slice(0, 3)
        .map((candidate) => {
          const row = value.comparisons?.find((r) => r.candidate === candidate);
          return (
            <fieldset
              key={candidate}
              className="mb-4 rounded-lg border border-border p-4"
            >
              <legend className="px-1 text-sm font-medium">{candidate}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {aspects.map(([key, label]) => (
                  <label key={key} className="text-xs">
                    {label}
                    <Select
                      className="mt-1 w-full"
                      value={row?.aspects[key] ?? "unknown"}
                      onChange={(e) =>
                        update(candidate, {
                          aspects: { ...row?.aspects, [key]: e.target.value },
                        })
                      }
                    >
                      <option value="unknown">Belum diketahui</option>
                      <option value="needs_revision">Perlu diperbaiki</option>
                      <option value="clear">Cukup jelas</option>
                    </Select>
                  </label>
                ))}
              </div>
              <Field
                label="Dasar penilaian, keterbatasan, dan hal yang belum diketahui"
                rows={2}
                value={row?.note ?? ""}
                onChange={(note) => update(candidate, { note })}
              />
              <details className="text-xs text-subtext">
                <summary>
                  Sumber yang mendasari penilaian ({row?.recordIds.length ?? 0})
                </summary>
                {workspace.project.records.slice(0, 100).map((r) => (
                  <label key={r.id} className="mt-2 flex gap-2">
                    <input
                      type="checkbox"
                      checked={row?.recordIds.includes(r.id) ?? false}
                      onChange={(e) =>
                        update(candidate, {
                          recordIds: e.target.checked
                            ? [...(row?.recordIds ?? []), r.id]
                            : (row?.recordIds ?? []).filter(
                                (id) => id !== r.id,
                              ),
                        })
                      }
                    />
                    <span>{r.title}</span>
                  </label>
                ))}
                {!workspace.project.records.length && (
                  <p>
                    Belum ada sumber tersimpan. Coba eksplorasi pada halaman
                    Sumber, lalu kembali.
                  </p>
                )}
              </details>
            </fieldset>
          );
        })}
      {!value.candidates.some(Boolean) && (
        <p className="text-sm text-subtext">
          Tulis kandidat di atas, atau tinjau usulan pada Sidechat → Usulan
          tahap.
        </p>
      )}
    </details>
  );
}
