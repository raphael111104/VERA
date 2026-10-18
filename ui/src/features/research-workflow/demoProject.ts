import {
  changeProject,
  createProject,
  readProject,
} from "./api";
import type {
  Command,
  Direction,
  Protocol,
  Summary,
  Workspace,
} from "./types";

export const DEMO_PROJECT_NAME =
  "DEMO SIMULASI VERA — AI untuk umpan balik pembelajaran";
const DEMO_CSV = "korpus-simulasi-vera.csv";
const DEMO_NOTE = "BACA DULU — Demo VERA (data simulasi).md";
const DEMO_MANIFEST = "manifest-demo.csv";
const DEMO_RESULTS = "hasil-seleksi-demo.csv";
const DEMO_CHARTING = "matriks-charting-demo.csv";
const DEMO_LEARNING_NOTE = "refleksi-p8-demo.md";
const DEMO_LEARNING_ID = "vera-demo-refleksi-v1";
const DEMO_TOPIC_MARKER = "VERA-DEMO-SIMULASI-V1";
const DEMO_THEME =
  "Dalam dua contoh simulasi, satu baris menggambarkan umpan balik otomatis dan satu baris menggambarkan pendampingan menulis. Kedua baris berada pada konteks perguruan tinggi; pola ini hanya merangkum korpus demonstrasi.";

type Progress = (message: string) => void;

const sampleRecords = [
  {
    title:
      "[SIMULASI] Umpan balik otomatis untuk draf tugas mahasiswa",
    year: "2024",
    authors: "Tim Demo VERA",
    journal: "Korpus simulasi VERA (bukan jurnal)",
    abstract:
      "SIMULASI: Contoh dokumen internal ini menggambarkan umpan balik otomatis untuk draf tugas mahasiswa pendidikan tinggi. Metadata, teks, dan temuan dibuat khusus untuk demo; ini bukan artikel atau temuan ilmiah.",
    approach: "Umpan balik otomatis",
    quote:
      "SIMULASI: Umpan balik otomatis membantu mahasiswa meninjau draf sebelum konsultasi dosen.",
    file: "SIMULASI-Vera-umpan-balik-otomatis.pdf",
  },
  {
    title:
      "[SIMULASI] Asisten percakapan untuk latihan menulis akademik",
    year: "2025",
    authors: "Tim Demo VERA",
    journal: "Korpus simulasi VERA (bukan jurnal)",
    abstract:
      "SIMULASI: Contoh dokumen internal ini menggambarkan latihan menulis akademik dengan asisten percakapan pada konteks perguruan tinggi. Metadata, teks, dan temuan dibuat khusus untuk demo; ini bukan artikel atau temuan ilmiah.",
    approach: "Pendampingan menulis",
    quote:
      "SIMULASI: Asisten percakapan memberi contoh revisi untuk didiskusikan bersama dosen.",
    file: "SIMULASI-Vera-latihan-menulis.pdf",
  },
  {
    title:
      "[SIMULASI] Pertimbangan dosen pada penggunaan AI untuk belajar",
    year: "2025",
    authors: "Tim Demo VERA",
    journal: "Korpus simulasi VERA (bukan jurnal)",
    abstract:
      "SIMULASI: Contoh metadata internal ini membahas pertimbangan dosen dalam pembelajaran berbantuan AI. Record dipakai untuk menunjukkan contoh eksklusi; ini bukan artikel atau temuan ilmiah.",
    approach: "Pertimbangan pengajar",
    quote:
      "SIMULASI: Record ini dikeluarkan karena tidak membahas umpan balik tugas mahasiswa.",
    file: "",
  },
] as const;

const direction: Direction = {
  interest: "Dukungan teknologi untuk proses belajar mahasiswa.",
  experience: "Contoh minat kajian pada pembelajaran dan teknologi.",
  field: "Pendidikan tinggi dan teknologi pembelajaran",
  phenomenon: "Penggunaan AI generatif dalam pemberian umpan balik tugas.",
  participants: "Mahasiswa dan pengajar di pendidikan tinggi.",
  context: "Pembelajaran dan penulisan akademik di perguruan tinggi.",
  concept: "Bentuk dukungan AI untuk umpan balik dan latihan menulis.",
  exclusions: "Korpus contoh yang tidak membahas umpan balik tugas mahasiswa.",
  objective:
    "Memetakan bentuk dukungan AI generatif untuk umpan balik pembelajaran pada contoh kajian pendidikan tinggi.",
  terms: "generative AI; feedback; academic writing; higher education",
  seedSources: "Korpus CSV simulasi internal VERA; bukan sumber publikasi.",
  candidates: [
    "Umpan balik otomatis pada draf tugas",
    "Asisten percakapan untuk latihan menulis",
  ],
  choice: "Dukungan AI untuk umpan balik dan latihan menulis mahasiswa.",
  reason:
    "Pilihan ini mencakup dua bentuk dukungan yang dapat dibandingkan pada contoh korpus kecil.",
  question:
    "Bentuk dukungan AI apa yang digambarkan untuk umpan balik pembelajaran mahasiswa pada contoh korpus VERA?",
  title:
    "Pemetaan simulasi dukungan AI untuk umpan balik pembelajaran di pendidikan tinggi",
  uncertainty:
    "Belum diketahui apakah topik ini mempunyai cakupan literatur yang memadai; demo tidak mencari literatur nyata.",
  reviewFit: "mapping",
  instructions: `${DEMO_TOPIC_MARKER}: proyek latihan end-to-end. Seluruh record, dokumen, keputusan, dan angka adalah simulasi buatan VERA. Jangan mengutip sebagai hasil kajian ilmiah.`,
  step: 6,
};

const protocol: Protocol = {
  rationale:
    "Contoh ini memperlihatkan komponen rencana kajian. Korpus di dalamnya adalah simulasi internal dan tidak dipakai untuk menyimpulkan keadaan literatur nyata.",
  objective: direction.objective,
  question: direction.question,
  inclusion:
    "Untuk demo: record simulasi yang menggambarkan dukungan AI bagi umpan balik atau latihan menulis mahasiswa.",
  exclusion:
    "Untuk demo: record simulasi yang tidak membahas umpan balik tugas mahasiswa.",
  sources:
    "Hanya korpus CSV simulasi internal VERA. Demo ini tidak menghubungi Crossref atau database akademik.",
  query: '"generative AI" AND feedback AND "higher education" (contoh strategi, belum dijalankan)',
  provider: "crossref",
  limitsReason:
    "Database dan query hanya contoh konfigurasi rencana; tidak ada pencarian eksternal dalam demo tersimpan ini.",
  screening:
    "Contoh alur satu reviewer: catat alasan keputusan judul/abstrak dan teks lengkap. Prosedur nyata perlu penelaah manusia sesuai protokol.",
  charting:
    "Catat bentuk dukungan dan konteks dari PDF simulasi yang dibuat bersama demo.",
  chartingFields: "Bentuk dukungan AI; konteks pendidikan",
  appraisal: "no",
  appraisalReason:
    "Penilaian mutu tidak direncanakan untuk contoh pemetaan ini. Korpus simulasi juga tidak dapat digunakan menilai mutu penelitian nyata.",
  synthesis:
    "Tampilkan hitungan dan ringkasan deskriptif dari baris contoh yang sudah dicatat; jangan generalisasi ke penelitian nyata.",
  registration: "not_registered",
  registrationUrl: "",
  amendmentReason: "",
  assignmentFormat: false,
  queryPlans: [],
};

const draftSections = [
  {
    key: "title",
    text: `SIMULASI VERA — ${direction.title}\n\nCONTOH PELATIHAN: bukan artikel atau temuan ilmiah.`,
  },
  {
    key: "abstract",
    text: `Latar belakang: Demo ini memperlihatkan alur pemetaan dukungan AI untuk umpan balik pembelajaran. Tujuan: Menunjukkan cara VERA menyimpan keputusan dan menghubungkan catatan dengan sumber. Metode: Korpus internal berisi tiga record simulasi; tidak ada pencarian database eksternal. Hasil demo: Dua record lolos seleksi contoh dan satu record dikeluarkan; dua PDF simulasi menghasilkan empat sel charting. Kesimpulan: Angka dan pola hanya menjelaskan data latihan. Seluruh isi bagian ini adalah SIMULASI, bukan hasil kajian ilmiah.`,
  },
  {
    key: "introduction",
    text: `Contoh ini menggunakan topik dukungan AI untuk umpan balik dan latihan menulis mahasiswa. Pertanyaan latihan: “Bentuk dukungan AI apa yang digambarkan untuk umpan balik pembelajaran mahasiswa pada contoh korpus VERA?”\n\nKorpus sengaja dibuat kecil agar alur proyek dapat ditinjau. Semua judul dan isi sumber ditandai SIMULASI; demo ini tidak mewakili literatur pendidikan tinggi.`,
  },
  {
    key: "methods",
    text: `Rencana contoh membatasi konteks pada pembelajaran dan penulisan akademik di perguruan tinggi. Strategi query yang ditampilkan hanya contoh dan tidak dijalankan. Sumber informasi adalah CSV internal bernama korpus-simulasi-vera.csv; tidak ada koneksi ke Crossref atau database akademik.\n\nTiga record simulasi diperiksa pada judul dan abstrak dengan alasan yang dicatat pada tiap keputusan. Dua dokumen PDF simulasi kemudian dimasukkan sebagai teks penuh buatan demo. Form charting berisi bentuk dukungan AI dan konteks pendidikan. Sel-sel memakai kutipan persis dari dokumen simulasi dan diperiksa pada mode latihan satu reviewer.\n\nTidak ada penilaian mutu. Prosedur dua penelaah, pencarian nyata, tanggal pencarian, dan registrasi protokol belum dilakukan.`,
  },
  {
    key: "results",
    text: `HASIL SIMULASI — Dari 3 record internal, 2 dimasukkan untuk contoh charting dan 1 dikeluarkan pada tahap judul/abstrak. Dua PDF simulasi menghasilkan 4 sel charting yang dikonfirmasi dalam mode latihan.\n\nPada dua baris tersebut, satu contoh menggambarkan umpan balik otomatis dan satu contoh menggambarkan pendampingan menulis. Kedua baris berkonteks perguruan tinggi. Perhitungan ini hanya menggambarkan korpus latihan VERA; bukan jumlah studi atau hasil literatur.`,
  },
  {
    key: "discussion",
    text: `Korpus kecil ini menunjukkan bagaimana keputusan seleksi, kutipan sumber, matriks dan ringkasan dapat dihubungkan di dalam VERA. Tema yang tersimpan merangkum dua contoh simulasi, bukan bukti tentang efektivitas AI.\n\nBatas demo: sumber tidak nyata; query tidak dijalankan; provenance tanggal pencarian tidak tersedia; seleksi dan verifikasi tidak dilakukan oleh dua penelaah independen; halaman pada ekspor perlu ditinjau. Tidak ada pendanaan atau pihak luar dalam pembuatan aset simulasi ini.`,
  },
  {
    key: "conclusion",
    text: `Contoh ini memperagakan alur proyek dari arah kajian sampai berkas ekspor. Pengguna tetap harus melakukan pencarian nyata, menilai sumber, memeriksa dukungan setiap klaim, dan melengkapi audit sebelum menyusun laporan penelitian. Semua angka dalam demo ini adalah SIMULASI.`,
  },
  {
    key: "references",
    text: `Tidak ada referensi publikasi nyata pada proyek ini. Tiga record dan dua PDF dibuat sebagai bahan demonstrasi oleh VERA; judul yang diawali [SIMULASI] tidak boleh dikutip.`,
  },
  {
    key: "appendix",
    text: `Berkas pendamping: korpus-simulasi-vera.csv, hasil-seleksi-demo.csv, matriks-charting-demo.csv, dan manifest-demo.csv. Sumber PDF memakai prefiks SIMULASI-Vera. Keluaran Word/CSV dibuat dari data demo lokal.`,
  },
] as const;

function sameObjectValues(
  current: Record<string, unknown> | null | undefined,
  expected: Record<string, unknown>,
): boolean {
  return Object.keys(expected).every(
    (key) => JSON.stringify(current?.[key]) === JSON.stringify(expected[key]),
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(rows: (string | number)[][]): string {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

function pdfBase64(title: string, quote: string): string {
  const plain = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7e]/g, "?")
      .replaceAll("\\", "\\\\")
      .replaceAll("(", "\\(")
      .replaceAll(")", "\\)");
  const lines = [
    "DOKUMEN SIMULASI VERA - BUKAN ARTIKEL ILMIAH",
    "",
    `Judul contoh: ${title}`,
    "Bagian: Ringkasan simulasi",
    "",
    plain(quote),
    "",
    "Seluruh nama, isi, dan hasil dokumen ini dibuat untuk demo.",
  ];
  const stream = [
    "BT",
    "/F1 10 Tf",
    "52 744 Td",
    "15 TL",
    ...lines.flatMap((line) => [`(${plain(line)}) Tj`, "T*"]),
    "ET",
  ].join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj",
    `4 0 obj\n<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(new TextEncoder().encode(document).length);
    document += `${object}\n`;
  }
  const xrefOffset = new TextEncoder().encode(document).length;
  document += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1))
    document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  document += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return btoa(document);
}

function sameDirection(workspace: Workspace): boolean {
  return sameObjectValues(
    workspace.project.direction as unknown as Record<string, unknown>,
    direction as unknown as Record<string, unknown>,
  );
}

function sameProtocol(workspace: Workspace): boolean {
  return sameObjectValues(
    workspace.project.protocol as unknown as Record<string, unknown>,
    protocol as unknown as Record<string, unknown>,
  );
}

export async function createOrOpenDemoProject(
  projects: Summary[],
  onProgress: Progress,
): Promise<string> {
  const existing = projects.find((project) => project.name === DEMO_PROJECT_NAME);
  const created = !existing;
  onProgress(
    created
      ? "Membuat proyek demo lokal…"
      : "Memeriksa dan melanjutkan demo tersimpan…",
  );
  let workspace = existing
    ? await readProject(existing.id)
    : await createProject(
        DEMO_PROJECT_NAME,
        "topic",
        crypto.randomUUID(),
      );
  const projectId = workspace.project.id;
  const apply = async (
    action: Command["action"],
    data: unknown,
  ): Promise<void> => {
    workspace = await changeProject(projectId, {
      action,
      data,
      expectedRevision: workspace.project.revision,
      operationId: crypto.randomUUID(),
    });
  };
  async function saveDemoLearning(): Promise<void> {
    if (
      !workspace.project.evidence.learning?.some(
        (event) =>
          event.type === "learning_decision" &&
          event.id === DEMO_LEARNING_ID,
      )
    )
      await apply("learning_decision", {
        id: DEMO_LEARNING_ID,
        activity: "selection",
        judgement:
          "SIMULASI: Dua contoh record sesuai fokus latihan setelah judul dan abstrak diperiksa.",
        reason:
          "Contoh latihan menghubungkan batas konsep dengan kriteria; keputusan pada proyek ini dibuat hanya untuk mendemonstrasikan alur.",
        evidence:
          "SIMULASI: Gunakan PDF buatan VERA dan kutipan bertanda SIMULASI. Tidak ada artikel nyata pada korpus ini.",
        hypothesis: "metadata",
      });
    if (
      !workspace.project.evidence.learning?.some(
        (event) =>
          event.type === "learning_help" &&
          event.decisionId === DEMO_LEARNING_ID,
      )
    )
      await apply("learning_help", {
        decisionId: DEMO_LEARNING_ID,
        level: 1,
      });
    if (
      !workspace.project.evidence.learning?.some(
        (event) =>
          event.type === "learning_response" &&
          event.decisionId === DEMO_LEARNING_ID,
      )
    )
      await apply("learning_response", {
        decisionId: DEMO_LEARNING_ID,
        response:
          "SIMULASI: Saya akan membuka dokumen dan memeriksa bagian yang mendukung kriteria, bukan menyimpulkan dari metadata saja.",
        finalJudgement:
          "SIMULASI: Untuk contoh ini dua record tetap dimasukkan; dalam kajian nyata saya perlu memeriksa sumber penuh dan alasan kriteria.",
        hypothesisCorrection:
          "Contoh ini menunjukkan bahwa metadata atau abstrak saja belum cukup untuk memastikan dukungan isi.",
      });
    if (
      !workspace.project.evidence.files.some(
        (file) => file.name === DEMO_LEARNING_NOTE,
      )
    )
      await apply("workspace_file", {
        name: DEMO_LEARNING_NOTE,
        text: `# P8 — Refleksi belajar (SIMULASI)\n\nJudgement awal, bantuan pemantik, respons, dan judgement akhir di dalam proyek ini adalah contoh sintetis untuk memperlihatkan cara pencatatan VERA. Ini bukan jawaban atau profil pengguna, bukan evaluasi kompetensi, dan tidak menyatakan ada peningkatan kemampuan.\n\nDalam penelitian sungguhan, pengguna membuat refleksinya sendiri. Tugas transfer baru bersifat opsional dan hasilnya tidak disimpulkan dari klik atau mutu draf.`,
      });
  }
  const completeAtOpen =
    !created &&
    workspace.project.evidence.files.some((file) => file.name === DEMO_NOTE) &&
    workspace.project.evidence.exports.length > 0;
  if (completeAtOpen) {
    const hasLearningDecision = workspace.project.evidence.learning?.some(
      (event) =>
        event.type === "learning_decision" &&
        event.id === DEMO_LEARNING_ID,
    );
    const hasLearningNote = workspace.project.evidence.files.some(
      (file) => file.name === DEMO_LEARNING_NOTE,
    );
    if (
      !hasLearningDecision || !hasLearningNote
    ) {
      onProgress("8/8 · Menambahkan refleksi belajar contoh yang berlabel simulasi…");
      await saveDemoLearning();
    }
    onProgress("Demo tersimpan. Membuka pekerjaan yang sudah ada…");
    return projectId;
  }

  onProgress("1/8 · Mengisi arah dan rencana kajian…");
  if (!sameDirection(workspace)) await apply("direction", direction);
  if (!workspace.project.directionConfirmed)
    await apply("confirm_direction", {});
  if (!sameProtocol(workspace)) await apply("protocol", protocol);
  if (!workspace.project.protocolLocked) await apply("lock_protocol", {});

  onProgress("2/8 · Menyimpan korpus sumber simulasi…");
  let run = workspace.project.runs.find((item) => item.sourceFile === DEMO_CSV);
  if (!run) {
    const corpus = csv([
      ["title", "year", "authors", "abstract", "journal", "publisher"],
      ...sampleRecords.map((record) => [
        record.title,
        record.year,
        record.authors,
        record.abstract,
        record.journal,
        "VERA Demo (simulasi)",
      ]),
    ]);
    await apply("import", {
      format: "csv",
      provider: "Korpus simulasi internal VERA",
      purpose: "formal",
      text: corpus,
      runId: crypto.randomUUID(),
      filename: DEMO_CSV,
    });
    run = workspace.project.runs.find((item) => item.sourceFile === DEMO_CSV);
  }
  if (!run) throw new Error("Korpus demo belum tersimpan pada proyek lokal.");
  const records = workspace.project.records
    .filter((record) => record.runId === run!.id)
    .sort((a, b) => a.rawId.localeCompare(b.rawId));
  if (records.length !== sampleRecords.length)
    throw new Error("Jumlah record korpus demo tidak sesuai dengan manifest.");
  if (workspace.project.selectionStale)
    await apply("freeze_selection", { acceptLimitations: false });

  onProgress("3/8 · Mencontohkan keputusan seleksi dengan alasan…");
  for (const [index, record] of records.entries()) {
    const existingDecision = workspace.project.decisions.some(
      (decision) =>
        decision.recordId === record.id &&
        decision.stage === "title" &&
        decision.actorId === workspace.actor.id &&
        decision.selectionRevision === workspace.project.selectionRevision &&
        decision.protocolRevision === workspace.project.protocolRevision,
    );
    if (!existingDecision)
      await apply("decision", {
        recordId: record.id,
        stage: "title",
        verdict: index < 2 ? "include" : "exclude",
        reason: `SIMULASI demo: ${index < 2 ? "judul contoh sesuai fokus umpan balik/latihan menulis mahasiswa" : "record contoh tidak membahas umpan balik tugas mahasiswa"}. Bukan keputusan screening literatur nyata.`,
      });
  }
  for (const [index, record] of records.slice(0, 2).entries()) {
    let retrieval = workspace.project.retrievals
      .slice()
      .reverse()
      .find((item) => item.recordId === record.id);
    if (retrieval?.status !== "retrieved") {
      const sample = sampleRecords[index];
      await apply("upload_fulltext", {
        recordId: record.id,
        filename: sample.file,
        legalAccess: true,
        base64: pdfBase64(record.title, sample.quote),
      });
      retrieval = workspace.project.retrievals
        .slice()
        .reverse()
        .find((item) => item.recordId === record.id);
    }
    if (!retrieval?.artifactId)
      throw new Error("PDF contoh belum tersimpan pada proyek lokal.");
    const existingDecision = workspace.project.decisions.some(
      (decision) =>
        decision.recordId === record.id &&
        decision.stage === "fulltext" &&
        decision.actorId === workspace.actor.id &&
        decision.selectionRevision === workspace.project.selectionRevision &&
        decision.protocolRevision === workspace.project.protocolRevision,
    );
    if (!existingDecision)
      await apply("decision", {
        recordId: record.id,
        stage: "fulltext",
        verdict: "include",
        reason:
          "SIMULASI demo: dokumen PDF internal memuat contoh yang cocok dengan kriteria latihan; bukan penilaian artikel ilmiah.",
      });
  }

  onProgress("4/8 · Mengisi matriks dari kutipan PDF simulasi…");
  const columns = [
    {
      id: "approach",
      label: "Bentuk dukungan AI",
      kind: "category",
      required: true,
      allowedValues: ["Umpan balik otomatis", "Pendampingan menulis"],
      missingPolicy: ["not_reported", "not_applicable", "uncertain"],
      extractionGuidance:
        "Gunakan kategori pada dokumen simulasi; kategori bukan hasil literatur nyata.",
    },
    {
      id: "context",
      label: "Konteks pendidikan",
      kind: "category",
      required: true,
      allowedValues: ["Perguruan tinggi"],
      missingPolicy: ["not_reported", "not_applicable", "uncertain"],
      extractionGuidance:
        "Catat konteks yang tertulis pada contoh sumber simulasi.",
    },
  ];
  if (!workspace.project.evidence.schemas.length)
    await apply("chart_schema", {
      columns,
      reason: "Form ringkas untuk memperagakan dua kategori data simulasi.",
    });
  const activeColumns = workspace.project.evidence.schemas.at(-1)!.columns;
  for (const [index, record] of records.slice(0, 2).entries()) {
    const retrieval = workspace.project.retrievals
      .slice()
      .reverse()
      .find((item) => item.recordId === record.id);
    const artifact = workspace.artifacts.find(
      (item) => item.id === retrieval?.artifactId,
    );
    if (!artifact) throw new Error("PDF demo belum dapat dibuka untuk charting.");
    for (const column of activeColumns) {
      let cell = workspace.project.evidence.cells
        .slice()
        .reverse()
        .find(
          (item) =>
            item.recordId === record.id && item.columnId === column.id,
        );
      if (!cell) {
        const sample = sampleRecords[index];
        await apply("chart_cell", {
          recordId: record.id,
          columnId: column.id,
          value:
            column.id === "approach"
              ? sample.approach
              : "Perguruan tinggi",
          state: "present",
          locator: {
            artifactId: artifact.id,
            page: 1,
            section: "Ringkasan simulasi",
            quote: sample.quote,
            documentHash: artifact.checksum,
          },
        });
        cell = workspace.project.evidence.cells.at(-1);
      }
      if (cell?.verificationStatus !== "confirmed")
        await apply("chart_verify", { cellId: cell!.id });
    }
  }
  if (workspace.project.evidence.pilot?.status !== "complete")
    await apply("chart_pilot", {
      recordIds: [records[0].id],
      rationale: "Pilot satu dari dua laporan contoh untuk memeriksa form simulasi.",
      status: "complete",
      schemaVersion: workspace.project.evidence.schemas.at(-1)!.version,
    });

  onProgress("5/8 · Menyimpan tema dan hitungan ringkasan…");
  const confirmedCells = workspace.project.evidence.cells.filter(
    (cell) => cell.verificationStatus === "confirmed",
  );
  if (
    !workspace.project.evidence.themes?.some(
      (theme) => theme.text === DEMO_THEME,
    )
  )
    await apply("theme", {
      text: DEMO_THEME,
      cellIds: confirmedCells.map((cell) => cell.id),
    });
  if (workspace.evidenceSummary.synthesisStale)
    await apply("synthesis", { approveCodebook: true });

  onProgress("6/8 · Menyusun seluruh bagian draf contoh…");
  for (const section of draftSections) {
    const saved = workspace.project.evidence.sections.find(
      (item) => item.key === section.key,
    );
    if (saved?.text !== section.text)
      await apply("draft_section", {
        ...section,
        status: "draft",
      });
  }

  onProgress("7/8 · Menyimpan CSV, petunjuk demo, dan keluaran Word…");
  const demoFiles: [string, string][] = [
    [
      DEMO_NOTE,
      `# Contoh kajian lengkap VERA — data simulasi\n\n**Peringatan:** semua record, metadata, PDF, keputusan, kutipan, angka, tema, dan draf pada proyek ini dibuat untuk menunjukkan cara kerja aplikasi. Bukan artikel ilmiah, pencarian basis data, hasil screening, atau kesimpulan riset nyata. Jangan kutip sebagai sumber.\n\n## Alur yang dapat ditinjau\n\n1. Arah kajian dan rencana tersimpan.\n2. Tiga record CSV berlabel [SIMULASI]; tidak ada permintaan pencarian eksternal.\n3. Dua record contoh dimasukkan dan satu dikeluarkan dengan alasan simulasi.\n4. Dua PDF contoh buatan lokal mendemonstrasikan retrieval, kutipan, dan charting.\n5. Ringkasan memperlihatkan dua baris dan satu tema dari korpus simulasi.\n6. Semua bagian draf terisi sebagai draft.\n7. Berkas ekspor Word/CSV bisa dibuka dari tab Pratinjau dan Berkas.\n\n## Mengapa audit menunjukkan kekurangan\n\nProvenance pencarian nyata, peninjau kedua, dukungan klaim hasil oleh penelaah, verifikasi setiap bagian, dan item checklist belum diputuskan manusia. Status “mode latihan” dan item audit yang perlu diperiksa adalah batas yang disengaja, bukan bukti kajian telah selesai. Gunakan proyek kosong untuk penelitian Anda sendiri.`,
    ],
    [
      DEMO_MANIFEST,
      csv([
        ["indikator", "nilai", "catatan"],
        ["status", "SIMULASI", "bukan pekerjaan penelitian nyata"],
        ["record diimpor", "3", "korpus CSV internal buatan VERA"],
        ["lolos judul/abstrak", "2", "keputusan contoh"],
        ["dikeluarkan judul/abstrak", "1", "keputusan contoh"],
        ["PDF simulasi", "2", "dokumen buatan untuk demo"],
        ["sel charting", "4", "dua kolom x dua record"],
        ["peninjau", "1", "mode latihan; bukan prosedur dua reviewer"],
        ["pencarian database nyata", "0", "tidak dilakukan"],
      ]),
    ],
    [
      DEMO_RESULTS,
      csv([
        ["tahap", "jumlah", "catatan"],
        ["Record dalam CSV contoh", 3, "metadata simulasi"],
        ["Masuk setelah judul/abstrak", 2, "keputusan latihan"],
        ["Dikeluarkan setelah judul/abstrak", 1, "keputusan latihan"],
        ["PDF teks penuh simulasi", 2, "dokumen bukan publikasi"],
        ["Record dalam matriks", 2, "data simulasi terkonfirmasi dalam mode latihan"],
      ]),
    ],
    [
      DEMO_CHARTING,
      csv([
        ["judul simulasi", "bentuk dukungan AI", "konteks", "kutipan simulasi"],
        ...sampleRecords.slice(0, 2).map((record) => [
          record.title,
          record.approach,
          "Perguruan tinggi",
          record.quote,
        ]),
      ]),
    ],
  ];
  for (const [name, text] of demoFiles)
    if (!workspace.project.evidence.files.some((file) => file.name === name))
      await apply("workspace_file", { name, text });

  onProgress("8/8 · Menambahkan refleksi belajar simulasi tanpa profil kemampuan…");
  await saveDemoLearning();

  const outputSettings = {
    language: "id",
    filename: "demo-simulasi-vera.docx",
    identityRequired: false,
    requirements: [],
  };
  if (!sameObjectValues(
    workspace.project.evidence.output as unknown as Record<string, unknown>,
    outputSettings,
  ))
    await apply("output_settings", outputSettings);
  if (!workspace.project.evidence.exports.length) {
    await apply("activity", { activity: "audit" });
    onProgress("Membuat paket Word dan CSV; mungkin perlu beberapa saat…");
    await apply("export", { milestone: "article" });
  }

  if (workspace.project.currentActivity !== "direction")
    await apply("activity", { activity: "direction" });
  onProgress("Demo tersimpan lokal dengan draf dan paket ekspor contoh.");
  return projectId;
}
