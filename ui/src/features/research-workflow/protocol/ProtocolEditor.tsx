import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui";
import { Field, FormGroup, Issues, Notice, Section } from "../shared";
import type { Protocol, Workspace } from "../types";
import { QueryPlans } from "./QueryPlans";
import { TermHelp } from "../TermHelp";

const fields: [keyof Protocol, string, string?][] = [
  [
    "rationale",
    "Mengapa kajian ini perlu dilakukan?",
    "Cantumkan sumber yang benar-benar diperiksa untuk klaim umum.",
  ],
  ["objective", "Apa tujuan kajian?"],
  ["question", "Apa pertanyaan kajian?"],
  [
    "inclusion",
    "Sumber seperti apa yang akan dipilih?",
    "Aturan inklusi: konsep, konteks dan jenis bukti.",
  ],
  [
    "exclusion",
    "Sumber seperti apa yang tidak sesuai?",
    "Teks yang belum diperoleh dicatat terpisah dari eksklusi metodologis.",
  ],
  ["sources", "Di mana Anda akan mencari sumber?"],
  [
    "query",
    "Query pencarian yang akan digunakan",
    "Query dikirim seperti yang disetujui. Sesuaikan sintaks dengan database.",
  ],
  [
    "limitsReason",
    "Adakah batas tahun, bahasa atau sumber? Mengapa?",
    "Tidak ada filter open access, peringkat jurnal atau publisher yang ditambahkan otomatis.",
  ],
  [
    "screening",
    "Bagaimana sumber akan dipilih?",
    "Rencanakan dua reviewer manusia, judul-abstrak, teks lengkap dan penyelesaian perbedaan. Rencana belum merupakan kegiatan aktual.",
  ],
  [
    "charting",
    "Bagaimana informasi dicatat dan diperiksa?",
    "Data charting adalah pencatatan informasi ke tabel. Rencanakan pilot, pembagian tugas dan verifikasi.",
  ],
  [
    "chartingFields",
    "Informasi apa yang akan dicatat?",
    "Misalnya tujuan, desain, peserta, konteks, temuan dan keterbatasan.",
  ],
  [
    "appraisalReason",
    "Alasan keputusan penilaian mutu dan instrumen bila diperlukan",
  ],
  [
    "synthesis",
    "Bagaimana temuan akan dirangkum?",
    "Rencanakan tabel, kategori atau narasi yang menjawab pertanyaan.",
  ],
];
export function ProtocolEditor({
  value,
  workspace,
  onChange,
  lock,
  busy,
}: {
  value: Protocol;
  workspace: Workspace;
  onChange: (value: Protocol) => void;
  lock: () => void;
  busy: boolean;
}) {
  const renderFields = (keys: (keyof Protocol)[]) =>
    fields
      .filter(([key]) => keys.includes(key))
      .map(([key, label, hint]) => (
        <Field
          key={key}
          label={label}
          hint={hint}
          value={String(value[key])}
          onChange={(text) => onChange({ ...value, [key]: text })}
        />
      ));
  return (
    <Section
      title="Buat rencana kajian"
      description="Rencana tertulis tentang pencarian, pemilihan, pencatatan dan rangkuman sumber disebut protokol. Versi acuan tetap dapat direvisi dengan alasan tercatat."
    >
      <TermHelp terms={["protokol", "PCC", "charting", "JBI"]} />
      {workspace.protocolAlignment?.length ? (
        <Notice>
          {workspace.protocolAlignment.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </Notice>
      ) : null}
      {!workspace.project.directionConfirmed && (
        <Notice>
          Konfirmasi arah sebelum memilih versi acuan. Anda tetap dapat menulis
          rencana.
        </Notice>
      )}
      {workspace.project.protocolRevision > 0 && (
        <Notice>
          Versi acuan: revisi {workspace.project.protocolRevision}.{" "}
          {workspace.project.protocolLocked
            ? "Menjadi acuan pencarian formal."
            : "Perubahan perlu ditinjau kembali."}
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer">
              Dampak jika rencana diubah
            </summary>
            <ul className="mb-0 space-y-1 pl-5">
              {workspace.impact.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        </Notice>
      )}
      <p className="mb-4 text-xs leading-relaxed text-subtext">
        Lengkapi empat bagian berikut, lalu pilih versi acuan. Buka judul bagian
        untuk mengisi atau meninjau jawabannya.
      </p>
      <FormGroup
        number={1}
        title="Tujuan dan pertanyaan"
        description="Jelaskan alasan, tujuan, dan pertanyaan yang ingin dijawab."
        open={!workspace.project.protocolLocked}
      >
        {renderFields(["rationale", "objective", "question"])}
      </FormGroup>
      <FormGroup
        number={2}
        title="Aturan pemilihan sumber"
        description="Tentukan sumber yang sesuai dan yang berada di luar cakupan."
      >
        {renderFields(["inclusion", "exclusion"])}
      </FormGroup>
      <FormGroup
        number={3}
        title="Rencana pencarian"
        description="Pilih database, susun query, dan jelaskan batas pencarian."
      >
        {renderFields(["sources"])}
        <label className="mb-4 block text-sm font-medium">
          Database untuk query acuan
          <Select
            className="mt-2 w-full"
            value={value.provider}
            onChange={(e) => onChange({ ...value, provider: e.target.value })}
          >
            <option value="">Pilih database</option>
            {workspace.capabilities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </label>
        {renderFields(["query", "limitsReason"])}
        <QueryPlans value={value} workspace={workspace} onChange={onChange} />
      </FormGroup>
      <FormGroup
        number={4}
        title="Pemilihan, pencatatan, dan rangkuman"
        description="Rencanakan pemeriksaan sumber, informasi yang dicatat, dan cara merangkumnya."
      >
        {renderFields(["screening", "charting", "chartingFields"])}
        <label className="mb-4 block text-sm font-medium">
          Apakah mutu sumber akan dinilai?
          <Select
            className="mt-2 w-full"
            value={value.appraisal}
            onChange={(e) => onChange({ ...value, appraisal: e.target.value })}
          >
            <option value="">Belum diputuskan</option>
            <option value="no">Tidak dilakukan, dengan alasan</option>
            <option value="yes">
              Direncanakan; instrumen perlu ditentukan
            </option>
          </Select>
        </label>
        {renderFields(["appraisalReason", "synthesis"])}
      </FormGroup>
      <FormGroup
        title="Registrasi dan format tugas"
        description="Pengaturan tambahan bila kajian didaftarkan atau mengikuti instruksi perkuliahan."
      >
        <p className="text-subtext">
          JBI adalah pedoman metode; PRISMA-ScR adalah checklist pelaporan.
          Penyimpanan di VERA bukan registrasi publik.
        </p>
        <label className="my-4 block">
          Status registrasi
          <Select
            className="mt-2 w-full"
            value={value.registration}
            onChange={(e) =>
              onChange({ ...value, registration: e.target.value })
            }
          >
            <option value="">Belum diputuskan</option>
            <option value="not_registered">Belum terdaftar</option>
            <option value="internal">Disimpan internal di VERA</option>
            <option value="registered">Terdaftar secara eksternal</option>
            <option value="published">Protokol dipublikasikan</option>
          </Select>
        </label>
        {["registered", "published"].includes(value.registration) && (
          <Field
            label="Tautan registrasi/publikasi nyata"
            value={value.registrationUrl}
            onChange={(text) => onChange({ ...value, registrationUrl: text })}
          />
        )}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={value.assignmentFormat}
            onChange={(e) =>
              onChange({ ...value, assignmentFormat: e.target.checked })
            }
          />
          <span>
            Sesuaikan pratinjau dengan instruksi perkuliahan yang saya bawa
          </span>
        </label>
        {value.assignmentFormat && (
          <p className="text-subtext">
            Judul → judul kerja; rasional → alasan; tujuan/PCC → pertanyaan;
            metode → rencana pencarian, seleksi dan pencatatan. Pemetaan halaman
            final belum tersedia.
          </p>
        )}
      </FormGroup>
      {workspace.project.protocolRevision > 0 && (
        <Field
          label="Mengapa rencana diubah?"
          hint="Alasan tersimpan bersama revisi. Data lama tetap tersedia."
          value={value.amendmentReason}
          onChange={(text) => onChange({ ...value, amendmentReason: text })}
        />
      )}
      <Issues items={workspace.protocolBlockers} />
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="mt-0 text-xs leading-relaxed text-subtext">
          Versi acuan dipakai untuk pencarian formal. Rencana tetap dapat diubah
          dengan alasan dan revisi yang tercatat.
        </p>
        <Button variant="primary" disabled={busy} onClick={lock}>
          Simpan dan pilih versi acuan
        </Button>
      </div>
    </Section>
  );
}
