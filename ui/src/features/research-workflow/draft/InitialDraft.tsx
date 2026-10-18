import { Md } from "../../../components/Md";
import { Download, Notice, Section } from "../shared";
import type { Project } from "../types";
import { Button } from "../../../components/ui";
import { useResearchPanel } from "../panels/ResearchPanel";

export function initialDraft(p: Project): string {
  const d = p.direction,
    r = p.protocol;
  const registration: Record<string, string> = {
    not_registered: "belum terdaftar",
    internal: "disimpan internal",
    registered: "terdaftar eksternal",
    published: "dipublikasikan",
  };
  const appraisal: Record<string, string> = {
    no: "tidak dilakukan",
    yes: "direncanakan",
  };
  return [
    `# ${d.title || p.name}`,
    "Status: draft rencana kajian; belum merupakan laporan hasil review.",
    "## Pendahuluan",
    r.rationale || "[Tuliskan alasan dan sumber pendukung.]",
    "## Tujuan dan pertanyaan",
    r.objective || d.objective,
    r.question || d.question,
    "## Metode yang direncanakan",
    `Status registrasi: ${registration[r.registration] || "belum diputuskan"}. ${r.registrationUrl}`,
    `Versi acuan VERA: ${p.protocolRevision || "belum dipilih"}.`,
    "### Kriteria sumber",
    `Inklusi: ${r.inclusion}`,
    `Eksklusi: ${r.exclusion}`,
    "### Pencarian",
    `Sumber yang direncanakan: ${r.sources}`,
    `Query ${r.provider}: ${r.query}`,
    `Batas dan alasan: ${r.limitsReason || "Belum ditetapkan."}`,
    "### Seleksi sumber",
    r.screening,
    "### Pencatatan informasi",
    r.charting,
    `Kolom: ${r.chartingFields}`,
    "### Penilaian mutu",
    `Keputusan: ${appraisal[r.appraisal] || "belum diputuskan"}. ${r.appraisalReason}`,
    "### Sintesis yang direncanakan",
    r.synthesis,
    "## Hasil",
    "[Belum disusun. Pencarian, seleksi, charting dan sintesis harus ditinjau sebelum menulis hasil.]",
    "## Referensi awal untuk diperiksa",
    d.seedSources || "[Belum dicatat.]",
    "## Hal yang perlu ditinjau",
    d.uncertainty
      ? "Catatan awal pengguna: " + d.uncertainty
      : "Periksa keselarasan tujuan, pertanyaan, kriteria dan query.",
    "Keluaran belum memiliki pemetaan halaman final PRISMA-ScR. Rencana tidak dianggap kegiatan atau hasil yang sudah dilakukan.",
  ].join("\n\n");
}
export function InitialDraft({ project }: { project: Project }) {
  const content = initialDraft(project);
  const panel = useResearchPanel();
  return (
    <Section
      title="Draft awal kajian"
      description="Pratinjau memakai arah dan rencana yang tersimpan; kegiatan aktual tidak disimpulkan dari teks rencana."
    >
      <Notice>
        Draft belum lengkap. Editor artikel berbasis bukti, charting dan
        sintesis dilanjutkan pada tahap berikutnya.
      </Notice>
      <div className="flex flex-wrap gap-2"><Download name="rencana-kajian.docx" content={content} /><Button onClick={() => panel.openText("rencana-kajian.docx", content)}>Tinjau DOCX di panel</Button></div>
      <div className="mt-6 rounded-xl border border-border bg-background p-6">
        <Md text={content} />
      </div>
    </Section>
  );
}
