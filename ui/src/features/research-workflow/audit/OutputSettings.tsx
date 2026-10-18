import { useEffect, useState } from "react";
import { Button } from "../../../components/ui";
import { Select } from "../../../components/ui/Select";
import { Field } from "../shared";
import type { Command, OutputSettings as Settings, Workspace } from "../types";
export function OutputSettings({
  workspace: w,
  act,
  busy,
  milestone,
  onMilestone,
  onDirty,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
  milestone: string;
  onMilestone: (v: string) => void;
  onDirty: (v: boolean) => void;
}) {
  const storage = `vera:workflow:output-draft:${w.project.id}`;
  const [value, setValue] = useState<Settings>(() => {
      try {
        return (
          JSON.parse(localStorage.getItem(storage) ?? "null") ??
          w.project.evidence.output ??
          {}
        );
      } catch {
        return w.project.evidence.output ?? {};
      }
    }),
    [dirty, setDirty] = useState(() => localStorage.getItem(storage) !== null),
    [saved, setSaved] = useState(false);
  const update = (patch: Partial<Settings>) => {
    const next = { ...value, ...patch };
    setValue(next);
    setDirty(true);
    setSaved(false);
    try {
      localStorage.setItem(storage, JSON.stringify(next));
    } catch {}
  };
  useEffect(() => {
    onDirty(dirty);
    const guard = (ev: BeforeUnloadEvent) => {
      if (dirty) ev.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, onDirty]);
  return (
    <div className="p-5">
      <label className="mb-4 block text-sm font-medium">
        Jenis keluaran
        <Select
          className="mt-2 w-full"
          value={milestone}
          onChange={(e) => onMilestone(e.target.value)}
        >
          <option value="article">Artikel kajian — checklist 1–22</option>
          <option value="plan">Rencana kajian umum</option>
          <option
            value="coursework"
            disabled={!w.project.protocol.assignmentFormat}
          >
            Dokumen tugas pilihan — item 1 dan 3–13
          </option>
        </Select>
      </label>
      <p className="text-xs leading-relaxed text-subtext">
        {milestone === "article"
          ? "Artikel memuat laporan kajian dan checklist lengkap 1–22. Kekurangan tetap dicantumkan pada paket."
          : milestone === "plan"
            ? "Rencana memuat prosedur yang akan dilakukan, bukan laporan pelaksanaan kajian."
            : "Dokumen mengikuti format tugas yang diaktifkan pada Rencana Kajian; cakupannya terpisah dari artikel lengkap."}
      </p>
      <details open={dirty || undefined}>
        <summary className="cursor-pointer text-sm font-medium">
          Bahasa, nama berkas, dan format tugas
        </summary>
        <label className="my-4 block text-sm">
          Bahasa usulan penulisan
          <Select
            className="mt-2 w-full"
            value={value.language ?? "id"}
            onChange={(e) => update({ language: e.target.value })}
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </Select>
        </label>
        <p className="text-xs text-subtext">
          Dipakai untuk usulan model berikutnya. Teks yang sudah Anda tulis
          tetap dipertahankan.
        </p>
        <Field
          label="Nama berkas rencana atau tugas (opsional, tanpa ekstensi)"
          rows={1}
          hint="Contoh: Rencana_Kajian_Nama. Nama artikel tetap article agar tautan paket konsisten."
          value={value.filename ?? ""}
          onChange={(filename) => update({ filename })}
        />
        <label className="mb-4 flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.identityRequired ?? false}
            onChange={(e) => update({ identityRequired: e.target.checked })}
          />
          Instruksi tugas meminta nama, NIM dan program studi
        </label>
        {value.identityRequired && (
          <>
            <Field
              label="Nama mahasiswa"
              rows={1}
              value={value.studentName ?? ""}
              onChange={(studentName) => update({ studentName })}
            />
            <Field
              label="NIM"
              rows={1}
              value={value.studentId ?? ""}
              onChange={(studentId) => update({ studentId })}
            />
            <Field
              label="Program studi"
              rows={1}
              value={value.program ?? ""}
              onChange={(program) => update({ program })}
            />
          </>
        )}
        <p className="text-xs text-subtext">
          Identitas hanya dicetak pada dokumen tugas ketika instruksi
          memintanya. Jangan masukkan data pribadi yang tidak diperlukan.
        </p>
        {(value.requirements ?? []).map((r, i) => (
          <fieldset
            key={i}
            className="mb-3 rounded-lg border border-border p-3"
          >
            <legend className="text-xs">Persyaratan tambahan {i + 1}</legend>
            <Field
              label="Judul persyaratan"
              rows={1}
              value={r.label}
              onChange={(label) =>
                update({
                  requirements: value.requirements!.map((v, j) =>
                    j === i ? { ...v, label } : v,
                  ),
                })
              }
            />
            <Field
              label="Isi yang telah Anda periksa"
              value={r.text}
              onChange={(text) =>
                update({
                  requirements: value.requirements!.map((v, j) =>
                    j === i ? { ...v, text } : v,
                  ),
                })
              }
            />
            <Button
              size="small"
              onClick={() =>
                update({
                  requirements: value.requirements!.filter((_, j) => j !== i),
                })
              }
            >
              Hapus persyaratan
            </Button>
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            disabled={(value.requirements?.length ?? 0) >= 10}
            onClick={() =>
              update({
                requirements: [
                  ...(value.requirements ?? []),
                  { label: "", text: "" },
                ],
              })
            }
          >
            Tambah persyaratan instruksi
          </Button>
          <Button
            size="small"
            disabled={busy}
            onClick={() =>
              void act({ action: "output_settings", data: value }).then(
                (ok) => {
                  if (ok) {
                    setDirty(false);
                    setSaved(true);
                    localStorage.removeItem(storage);
                  }
                },
              )
            }
          >
            Simpan pengaturan keluaran
          </Button>
        </div>
        <p role="status" className="text-xs text-subtext">
          {dirty
            ? "Pengaturan lokal belum tersimpan ke proyek; simpan sebelum membuat ekspor."
            : saved
              ? "Pengaturan keluaran tersimpan."
              : "Pengaturan yang tersimpan digunakan saat ekspor."}
        </p>
      </details>
    </div>
  );
}
