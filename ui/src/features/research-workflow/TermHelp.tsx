const glossary = {
  PCC: [
    "Siapa atau apa, konsep, dan konteks",
    "PCC membantu membatasi pertanyaan: siapa atau apa yang dikaji (Population/Participants), hal yang dipetakan (Concept), dan tempat atau situasinya (Context). Tidak semua kajian memerlukan kelompok manusia tertentu.",
  ],
  protokol: [
    "Rencana kajian sebelum pelaksanaan",
    "Protokol mencatat alasan, pertanyaan, kriteria, sumber, pencarian, seleksi, pencatatan dan sintesis. Menyimpan versi acuan di VERA merupakan pencatatan internal; registrasi eksternal dilaporkan terpisah.",
  ],
  charting: [
    "Mencatat informasi sumber dalam tabel",
    "Data charting menghubungkan nilai dengan dokumen, halaman atau bagian, dan kutipan. Uji form pada sampel terlebih dahulu. Bedakan tidak dilaporkan, tidak berlaku, belum jelas, dan belum dicatat; semuanya berbeda dari angka nol.",
  ],
  codebook: [
    "Aturan arti dan penggunaan kategori",
    "Codebook menjelaskan arti kolom, kategori yang diperbolehkan, contoh pengisian dan cara menangani informasi yang hilang. Setujui aturan ini sebelum menghitung; satu sumber dapat memiliki beberapa kategori.",
  ],
  PRISMA: [
    "Panduan melaporkan proses secara transparan",
    "PRISMA ScR memandu pelaporan scoping review, termasuk asal sumber, alur seleksi, charting, sintesis dan keterbatasan. Checklist menunjukkan cakupan laporan, bukan sertifikat mutu atau bukti bahwa rencana sudah dilaksanakan.",
  ],
  JBI: [
    "Panduan cara melaksanakan scoping review",
    "JBI menyediakan panduan metodologis scoping review. Gunakan untuk merencanakan dan menjalankan kajian; gunakan PRISMA ScR untuk pelaporannya. Penilaian mutu diputuskan dengan alasan sesuai tujuan kajian.",
  ],
} as const;
export function TermHelp({
  terms = Object.keys(glossary) as (keyof typeof glossary)[],
}: {
  terms?: (keyof typeof glossary)[];
}) {
  return (
    <details className="mb-4 text-sm">
      <summary className="w-fit cursor-pointer rounded-md py-1 text-xs font-medium text-subtext focus-visible:outline-2 focus-visible:outline-text">
        Pelajari istilah pada tahap ini
      </summary>
      <dl className="mb-0 mt-3 space-y-4 rounded-lg border border-border bg-background p-4">
        {terms.map((term) => (
          <div key={term}>
            <dt className="font-medium">
              {term} — {glossary[term][0]}
            </dt>
            <dd className="ml-0 mt-1 leading-relaxed text-subtext">
              {glossary[term][1]}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mb-0 mt-4 text-xs text-subtext">
        Panduan:{" "}
        <a
          href="https://jbi-global-wiki.refined.site/space/MANUAL"
          target="_blank"
          rel="noreferrer"
        >
          JBI Manual
        </a>{" "}
        ·{" "}
        <a
          href="https://www.prisma-statement.org/scoping"
          target="_blank"
          rel="noreferrer"
        >
          PRISMA ScR
        </a>
        . Buka sesuai kebutuhan; Anda dapat melanjutkan tanpa membaca seluruh
        istilah.
      </p>
    </details>
  );
}
