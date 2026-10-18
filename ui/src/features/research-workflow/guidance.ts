import type { Workspace } from "./types";

export interface StageGuide {
  phase: string;
  title: string;
  goal: string;
  help: string;
  boundary: string;
  questions: [string, string][];
}
export const stageGuides: Record<string, StageGuide> = {
  direction: {
    phase: "P1",
    title: "Arah kajian",
    goal: "Ubah minat awal menjadi pertanyaan yang jelas dan cukup terarah untuk dikaji.",
    help: "Membandingkan hingga tiga rumusan fokus dari jawaban Anda dan menunjukkan perbedaan cakupannya.",
    boundary:
      "Anda memilih fokus dan alasannya. Sedikit hasil pencarian belum membuktikan kebaruan.",
    questions: [
      [
        "Apa yang ingin Anda pahami?",
        "Mulai dari pengalaman, masalah, atau fenomena. Tulis pada bagian Titik berangkat.",
      ],
      [
        "Siapa, konsep apa, dan dalam konteks mana?",
        "Batasi peserta, konsep, dan konteks di form utama; bandingkan fokus yang masih mungkin.",
      ],
      [
        "Mengapa Anda memilih fokus ini?",
        "Catat alasan dan hal yang belum pasti. Sumber awal membantu menilai kelayakan, bukan memastikan novelty.",
      ],
    ],
  },
  protocol: {
    phase: "P2",
    title: "Rencana kajian",
    goal: "Tetapkan pertanyaan, kriteria sumber, dan cara kerja yang saling sesuai.",
    help: "Memeriksa keselarasan rencana dan membantu menyusun draf dari informasi yang Anda simpan.",
    boundary:
      "Anda meninjau dan menyetujui versi acuan. Pendaftaran pada layanan luar tetap memerlukan konfirmasi terpisah.",
    questions: [
      [
        "Sumber seperti apa yang menjawab pertanyaan Anda?",
        "Tuliskan kriteria inklusi dan eksklusi yang dapat diterapkan secara konsisten.",
      ],
      [
        "Di mana dan dengan istilah apa Anda mencari?",
        "Pisahkan konsep dan sinonim; periksa adaptasi sintaks pada masing-masing database.",
      ],
      [
        "Bagaimana bukti akan dicatat dan dibandingkan?",
        "Selaraskan kolom pencatatan, rencana penilaian mutu, dan sintesis sebelum menyetujui versi acuan.",
      ],
    ],
  },
  search: {
    phase: "P3",
    title: "Pencarian sumber",
    goal: "Kumpulkan sumber dengan query, tanggal, dan status pencarian yang dapat ditelusuri.",
    help: "Menjelaskan strategi pencarian serta mengarahkan Anda ke run parsial, impor, dan halaman lanjutan.",
    boundary:
      "Anda menyetujui query dan akses provider. Total provider berbeda dari record yang benar-benar diterima; run parsial belum menyeluruh.",
    questions: [
      [
        "Apakah pencarian ini eksplorasi atau pencarian formal?",
        "Eksplorasi membantu mengenali istilah. Pencarian formal harus memakai versi rencana acuan.",
      ],
      [
        "Apakah sintaks query sesuai database yang dipilih?",
        "Periksa query asli dan adaptasinya. Credential diatur lewat layanan, bukan ditulis dalam query atau prompt.",
      ],
      [
        "Apakah semua halaman yang diperlukan sudah diterima?",
        "Periksa status, jumlah record diterima, dan pesan provider. Lanjutkan run parsial dari tombol yang tersedia.",
      ],
    ],
  },
  selection: {
    phase: "P4",
    title: "Pemilihan sumber",
    goal: "Terapkan kriteria yang disepakati dan simpan alasan keputusan untuk setiap sumber.",
    help: "Menuntun perbandingan sumber dengan kriteria serta membantu menemukan duplikasi dan kasus yang perlu ditinjau.",
    boundary:
      "Keputusan Include / Exclude / Maybe disahkan peneliti. AI bukan reviewer manusia; teks yang belum diperoleh belum dinilai.",
    questions: [
      [
        "Kriteria mana yang mendasari penilaian awal Anda?",
        "Baca kriteria versi acuan sebelum memilih keputusan pada form seleksi.",
      ],
      [
        "Bagian sumber mana yang mendukungnya?",
        "Bedakan judul, abstrak, dan teks lengkap. Catat alasan serta ketidakpastian jika informasi belum cukup.",
      ],
      [
        "Adakah duplikasi atau konflik keputusan?",
        "Tinjau pasangan duplikat dan keputusan yang berbeda. Jangan mengubah not_retrieved menjadi eksklusi metodologis.",
      ],
    ],
  },
  charting: {
    phase: "P5",
    title: "Pencatatan bukti",
    goal: "Catat informasi sumber bersama kutipan dan lokasi yang dapat diperiksa kembali.",
    help: "Menjelaskan pengisian form dan membuka sumber atau PDF untuk memeriksa kutipan berdampingan.",
    boundary:
      "Isian usulan belum terverifikasi. Peneliti memeriksa halaman/bagian, kutipan, dan appraisal; informasi yang hilang tidak menjadi nol.",
    questions: [
      [
        "Informasi apa yang perlu dicatat untuk menjawab pertanyaan?",
        "Gunakan kolom form yang telah disepakati dan lakukan pilot sebelum pencatatan penuh.",
      ],
      [
        "Di halaman atau bagian mana informasi itu berada?",
        "Buka PDF/sumber di panel kanan, lalu catat kutipan, halaman/bagian dan nilai pada form utama.",
      ],
      [
        "Apakah nilai sudah diperiksa terhadap sumber?",
        "Bedakan terkonfirmasi, ambigu, tidak dilaporkan, dan tidak berlaku. Verifikasi manusia tetap diperlukan.",
      ],
    ],
  },
  synthesis: {
    phase: "P6",
    title: "Peta temuan",
    goal: "Bandingkan bukti terkonfirmasi untuk melihat pola, perbedaan, dan keterbatasannya.",
    help: "Mengarahkan pembuatan tabel deterministik dari data terkonfirmasi serta usulan interpretasi yang merujuk sumber dan sel bukti.",
    boundary:
      "Anda memilih interpretasi dan kekuatan klaim. Frekuensi tidak membuktikan efektivitas; dataset kosong tidak menghasilkan temuan.",
    questions: [
      [
        "Baris bukti mana yang sudah terkonfirmasi?",
        "Periksa cakupan sumber dan kelengkapan baris sebelum menghitung tabel.",
      ],
      [
        "Pola, variasi, dan temuan negatif apa yang terlihat?",
        "Bandingkan kategori yang sama dan perhatikan bukti yang bertentangan; jangan hanya menghitung hasil positif.",
      ],
      [
        "Seberapa jauh kesimpulan dapat ditarik?",
        "Tautkan interpretasi ke sel/sumber dan jelaskan batas pencarian, kualitas, serta bagian yang belum diketahui.",
      ],
    ],
  },
  draft: {
    phase: "P6",
    title: "Draft artikel",
    goal: "Susun argumen yang membedakan rencana, pelaksanaan, hasil, dan interpretasi.",
    help: "Menyiapkan kerangka atau usulan paragraf dari konteks tersimpan untuk dibandingkan dengan tulisan Anda.",
    boundary:
      "Anda memilih kalimat dan mengesahkan klaim akhir. Jangan mengisi hasil, angka, atau referensi yang belum didukung bukti.",
    questions: [
      [
        "Bagian apa yang ingin Anda tulis?",
        "Pilih bagian draft. Mulai dari tujuan paragraf dan informasi yang sudah tersedia.",
      ],
      [
        "Klaim mana yang mempunyai sumber pendukung?",
        "Tautkan klaim ke sumber dan bukti terkonfirmasi; pisahkan pernyataan faktual dari interpretasi.",
      ],
      [
        "Apa yang masih perlu diperiksa?",
        "Pertahankan label draft dan bagian belum tersedia. Tinjau isi Word di panel sebelum mengunduh.",
      ],
    ],
  },
  audit: {
    phase: "P7",
    title: "Pemeriksaan dan ekspor",
    goal: "Periksa kelengkapan pelaporan dan keluaran berdasarkan bukti serta revisi terbaru.",
    help: "Menunjukkan item kosong, masalah referensi, dan keluaran yang perlu diperbarui; menyediakan pratinjau sebelum unduh.",
    boundary:
      "Label lengkap atau siap ditinjau bukan jaminan kebenaran ilmiah atau kesiapan publikasi. Anda memutuskan perbaikannya.",
    questions: [
      [
        "Apa yang masih kosong atau perlu ditinjau?",
        "Baca daftar masalah dan periksa bukti pelaporan pada checklist, bukan hanya keberadaan judul bagian.",
      ],
      [
        "Apakah klaim, referensi dan angka dapat ditelusuri?",
        "Cocokkan angka dengan ledger serta klaim dengan bukti dan metadata sumber.",
      ],
      [
        "Apakah keluaran sesuai revisi terbaru?",
        "Tinjau DOCX/CSV dan kekurangan yang disertakan. Simpan paket baru jika data hulunya berubah.",
      ],
    ],
  },
  learning: {
    phase: "P8",
    title: "Belajar bersama VERA",
    goal: "Latih alasan dan pemeriksaan bukti, lalu coba kasus baru secara mandiri jika Anda menginginkannya.",
    help: "Memberi pertanyaan pemantik, petunjuk, contoh parsial, serta akses ke latihan transfer opsional.",
    boundary:
      "Klik dan banyaknya bantuan bukan skor kemampuan. Penggunaan catatan belajar sebagai data penelitian memerlukan persetujuan terpisah.",
    questions: [
      [
        "Apa penilaian awal dan alasannya?",
        "Tuliskan bukti yang sudah dibuka sebelum meminta saran tentang keputusan akademik.",
      ],
      [
        "Apakah bukti mengubah alasan Anda?",
        "Buka bantuan secukupnya, lalu jelaskan apa yang Anda pertahankan atau perbaiki.",
      ],
      [
        "Ingin mencoba kasus baru tanpa bantuan?",
        "Latihan mandiri bersifat opsional. Bantuan dibatasi selama tugas transfer aktif; ini bukan sertifikasi kompetensi.",
      ],
    ],
  },
  history: {
    phase: "Riwayat",
    title: "Jejak keputusan",
    goal: "Lihat perubahan rencana, bukti, dan keputusan yang telah disimpan.",
    help: "Menjelaskan revisi dan mengarahkan pemeriksaan dampak perubahan pada keluaran turunan.",
    boundary:
      "Riwayat merekam tindakan, bukan ukuran kemampuan atau jaminan mutu ilmiah.",
    questions: [
      [
        "Apa yang berubah dan mengapa?",
        "Bandingkan revisi dan alasan yang dicatat sebelum memakai hasil terdahulu.",
      ],
      [
        "Hasil apa yang terdampak?",
        "Periksa status usang pada seleksi, bukti, sintesis, usulan dan keluaran setelah data hulu berubah.",
      ],
    ],
  },
};
export function activeTransfer(w: Workspace): boolean {
  const events = w.project.evidence.learning;
  return events.some(
    (e) =>
      e.type === "transfer_start" &&
      !events.some(
        (s) =>
          ["transfer_submit", "transfer_cancel"].includes(s.type) &&
          s.id === e.id,
      ),
  );
}
export function hasInitialJudgement(w: Workspace, kind: string): boolean {
  return w.project.evidence.learning.some(
    (e) =>
      e.type === "learning_decision" &&
      e.actorId === w.actor.id &&
      e.activity === kind &&
      e.dependency === w.evidenceSummary.dependency,
  );
}
export const needsJudgement = (kind: string) =>
  ["direction", "selection", "synthesis", "draft"].includes(kind);

export function proposalReadiness(
  w: Workspace,
  kind: string,
  engine: string,
  level: number,
): string | null {
  if (
    kind === "direction" &&
    engine === "local" &&
    level >= 3 &&
    (!w.project.direction.concept.trim() || !w.project.direction.context.trim())
  ) {
    return "Lengkapi konsep pada Batas konsep dan konteks pada Fenomena sebelum meminta rumusan fokus lokal. VERA tidak akan menebak kedua isian tersebut.";
  }
  return null;
}

export function recommendation(
  w: Workspace,
  activity: string,
): { text: string; target: string; label: string } {
  const p = w.project;
  const formalRuns = new Set(
    p.runs.filter((r) => r.purpose === "formal").map((r) => r.id),
  );
  const formalRecords = p.records.filter((r) => formalRuns.has(r.runId));
  const next = (text: string, target: string, label: string) => ({
    text,
    target,
    label,
  });
  switch (activity) {
    case "direction":
      return p.directionConfirmed
        ? next(
            "Fokus sudah dikonfirmasi. Susun rencana yang sesuai dengan pertanyaan pilihan Anda.",
            "protocol",
            "Buka rencana kajian",
          )
        : next(
            w.directionBlockers.length
              ? w.directionBlockers[0]
              : "Bandingkan fokus, catat alasan, lalu konfirmasikan arah kajian.",
            "direction",
            "Lanjutkan arah kajian",
          );
    case "protocol":
      return !p.directionConfirmed
        ? next(
            "Konfirmasikan arah kajian sebelum menetapkan rencana acuan.",
            "direction",
            "Tinjau arah kajian",
          )
        : p.protocolLocked && !p.needsReview
          ? next(
              "Rencana acuan tersedia. Periksa query database lalu mulai pencarian formal.",
              "search",
              "Buka pencarian sumber",
            )
          : next(
              p.needsReview
                ? "Perubahan hulu memerlukan peninjauan rencana dan persetujuan versi acuan baru."
                : "Lengkapi dan setujui rencana sebelum menggunakannya sebagai acuan pencarian formal.",
              "protocol",
              "Tinjau rencana kajian",
            );
    case "search": {
      const partial = p.runs.filter((r) => r.status === "partial");
      return partial.length
        ? next(
            `${partial.length} run masih parsial. Tinjau riwayat dan lanjutkan halaman yang belum diterima.`,
            "search",
            "Tinjau run pencarian",
          )
        : !p.records.length
          ? next(
              "Mulai eksplorasi, jalankan query yang disetujui, atau impor ekspor asli database. Belum ada record tersimpan.",
              "search",
              "Buka pencarian dan impor",
            )
          : !formalRecords.length
            ? next(
                "Sumber eksplorasi tersimpan, tetapi belum ada record dari pencarian formal. Tinjau query dan versi rencana sebelum memulai seleksi formal.",
                p.protocolLocked ? "search" : "protocol",
                p.protocolLocked
                  ? "Mulai pencarian formal"
                  : "Tinjau rencana acuan",
              )
            : next(
                `${formalRecords.length} record formal tersimpan. Periksa duplikasi dan mulai seleksi berdasarkan kriteria acuan. Jumlah ini bukan total provider.`,
                "selection",
                "Buka pemilihan sumber",
              );
    }
    case "selection":
      return p.selectionStale
        ? next(
            "Kriteria atau bukti berubah. Tinjau keputusan seleksi sebelum melanjutkan pencatatan.",
            "selection",
            "Tinjau seleksi terdampak",
          )
        : !formalRecords.length
          ? next(
              "Kumpulkan sumber terlebih dahulu; keputusan seleksi memerlukan record yang nyata.",
              "search",
              "Kumpulkan sumber",
            )
          : w.duplicateCandidates.length
            ? next(
                `Tinjau ${w.duplicateCandidates.length} pasangan dugaan duplikat; kesamaan metadata belum otomatis membuktikan duplikasi.`,
                "selection",
                "Tinjau dugaan duplikat",
              )
            : next(
                "Periksa keputusan yang masih menunggu dan akses teks lengkap sebelum pencatatan bukti.",
                "selection",
                "Lanjutkan seleksi",
              );
    case "charting":
      return !w.evidenceSummary.included.length
        ? next(
            "Belum ada sumber lolos seleksi teks lengkap. Selesaikan seleksi dan perolehan sumber terlebih dahulu.",
            "selection",
            "Periksa pemilihan sumber",
          )
        : next(
            `Ada ${w.evidenceSummary.included.length} sumber lolos seleksi. Periksa form, kutipan, locator, dan verifikasi manusia sebelum sintesis.`,
            "charting",
            "Lanjutkan catatan sumber",
          );
    case "synthesis":
      return !w.evidenceSummary.confirmedRows.length
        ? next(
            "Belum ada baris terkonfirmasi yang siap dihitung. Lengkapi dan verifikasi catatan sumber; jangan membuat temuan dari data kosong.",
            "charting",
            "Periksa catatan sumber",
          )
        : next(
            w.evidenceSummary.synthesisStale
              ? "Bukti berubah. Perbarui tabel sintesis sebelum menggunakannya dalam interpretasi atau draft."
              : `${w.evidenceSummary.confirmedRows.length} baris terkonfirmasi tersedia. Tinjau kategori dan hitung tabel sebelum menafsirkan pola.`,
            "synthesis",
            "Tinjau peta temuan",
          );
    case "draft":
      return next(
        w.evidenceSummary.synthesisStale
          ? "Sintesis perlu diperbarui. Tinjau bukti sebelum menulis atau mengesahkan klaim hasil."
          : "Pilih bagian yang akan ditulis. Bedakan data rencana dari hasil aktual dan hubungkan klaim ke sumber.",
        w.evidenceSummary.synthesisStale ? "synthesis" : "draft",
        w.evidenceSummary.synthesisStale
          ? "Tinjau sintesis"
          : "Lanjutkan menulis",
      );
    case "audit":
      return next(
        w.audit?.unresolvedIssues.length
          ? `Ada ${w.audit.unresolvedIssues.length} hal yang perlu ditinjau. Mulai dari: ${w.audit.unresolvedIssues[0].message}`
          : "Periksa checklist, dukungan klaim, referensi, dan pratinjau sebelum membuat paket ekspor.",
        "audit",
        "Tinjau pemeriksaan dan ekspor",
      );
    case "learning":
      return next(
        activeTransfer(w)
          ? "Latihan mandiri sedang aktif. Gunakan instruksi dan rubrik, lalu serahkan jawaban atau akhiri tugas sebelum membuka bantuan."
          : "Pilih satu keputusan yang ingin dipelajari. Tulis penilaian awal, alasan, dan bukti sebelum membuka bantuan.",
        "learning",
        "Buka kegiatan belajar",
      );
    default:
      return next(
        "Tinjau alasan perubahan dan periksa keluaran yang memakai bukti terdahulu.",
        "audit",
        "Periksa dampak perubahan",
      );
  }
}
