/** VERA's initial self-assessment. These are support needs, not tested competence. */
export const DIAGNOSIS_INDICATORS = [
  { id: "research_question", area: "Penelitian", title: "Merumuskan masalah penelitian", question: "Sejauh mana Anda dapat merumuskan pertanyaan penelitian yang fokus, dapat diteliti, dan memiliki alasan yang jelas?", example: "Contoh: membatasi topik, menjelaskan kesenjangan riset, dan menentukan tujuan penelitian." },
  { id: "literature_search", area: "Penelitian", title: "Mencari literatur", question: "Sejauh mana Anda dapat mencari dan memilih literatur yang relevan secara terencana?", example: "Contoh: memilih basis data, menyusun kata kunci, dan mencatat kriteria pemilihan sumber." },
  { id: "source_appraisal", area: "Penelitian", title: "Menilai kualitas sumber", question: "Sejauh mana Anda dapat menilai kredibilitas, kekuatan bukti, dan keterbatasan sebuah artikel?", example: "Contoh: memeriksa metode, kesesuaian data dengan kesimpulan, dan potensi bias." },
  { id: "research_method", area: "Penelitian", title: "Memilih metode penelitian", question: "Sejauh mana Anda dapat memilih dan menjelaskan metode yang sesuai dengan pertanyaan penelitian?", example: "Contoh: menentukan desain, sampel, instrumen, serta prosedur pengumpulan data." },
  { id: "data_analysis", area: "Penulisan artikel", title: "Menganalisis dan menafsirkan data", question: "Sejauh mana Anda dapat menganalisis data dan menjelaskan hasil tanpa melampaui bukti yang tersedia?", example: "Contoh: memilih analisis yang sesuai, membaca hasil, dan mengungkapkan ketidakpastian." },
  { id: "evidence_argument", area: "Penulisan artikel", title: "Menyusun argumen berbasis bukti", question: "Sejauh mana Anda dapat menghubungkan klaim dengan bukti dan menyintesis beberapa sumber menjadi argumen?", example: "Contoh: membandingkan temuan, membedakan fakta dan interpretasi, serta membahas temuan yang berbeda." },
  { id: "article_structure", area: "Penulisan artikel", title: "Menyusun dan merevisi artikel", question: "Sejauh mana Anda dapat menyusun bagian-bagian artikel ilmiah dan merevisinya agar runtut?", example: "Contoh: menyelaraskan pendahuluan, metode, hasil, pembahasan, dan kesimpulan." },
  { id: "citation_ethics", area: "Penulisan artikel", title: "Mengelola sitasi dan etika AI", question: "Sejauh mana Anda dapat mengutip sumber dengan benar dan menggunakan AI secara bertanggung jawab?", example: "Contoh: memeriksa sumber asli, menghindari referensi fiktif, menjaga data sensitif, dan mengungkapkan penggunaan AI." },
] as const;

export type DiagnosisIndicator = typeof DIAGNOSIS_INDICATORS[number]["id"];
export type DiagnosisLevel = "new" | "guided" | "independent" | "experienced" | "unsure";
export type DiagnosisAnswers = Partial<Record<DiagnosisIndicator, DiagnosisLevel>>;
export interface ResearchDiagnosis {
  version: 1;
  answers: Record<DiagnosisIndicator, DiagnosisLevel>;
}

export const DIAGNOSIS_LEVELS: readonly { id: DiagnosisLevel; label: string; detail: string }[] = [
  { id: "new", label: "Belum pernah", detail: "Saya belum mencoba keterampilan ini dan perlu pengenalan dari awal." },
  { id: "guided", label: "Dengan bimbingan", detail: "Saya pernah mencoba, tetapi masih membutuhkan contoh atau arahan langkah demi langkah." },
  { id: "independent", label: "Cukup mandiri", detail: "Saya dapat melakukannya sendiri, tetapi masih membutuhkan pemeriksaan atau umpan balik." },
  { id: "experienced", label: "Terbiasa", detail: "Saya sudah beberapa kali melakukannya dan dapat menjelaskan alasan di balik keputusan saya." },
  { id: "unsure", label: "Belum yakin", detail: "Saya belum dapat menilai kemampuan saya pada bagian ini." },
];

export function completeDiagnosis(answers: DiagnosisAnswers): ResearchDiagnosis | null {
  if (!DIAGNOSIS_INDICATORS.every(({ id }) => DIAGNOSIS_LEVELS.some((level) => level.id === answers[id]))) return null;
  return { version: 1, answers: Object.fromEntries(DIAGNOSIS_INDICATORS.map(({ id }) => [id, answers[id]])) as ResearchDiagnosis["answers"] };
}

export function diagnosisFocus(answers: DiagnosisAnswers) {
  return DIAGNOSIS_INDICATORS.filter(({ id }) => answers[id] === "new" || answers[id] === "guided");
}

export function diagnosisUncertain(answers: DiagnosisAnswers) {
  return DIAGNOSIS_INDICATORS.filter(({ id }) => answers[id] === "unsure");
}

/** Keep an explicit model across catalog refreshes; a removed model falls back to a live one. */
export function onboardingModel(models: readonly { id: string }[], current: string | null): string | null {
  return models.find(({ id }) => id === current)?.id ?? models[0]?.id ?? null;
}
