# 08. Agent dan Mekanisme Pembelajaran

## Peran berbasis fungsi

| Fungsi | Input | Usulan/keluaran | Batas kewenangan |
|---|---|---|---|
| DirectionGuide | Jawaban dan sumber eksplorasi | Pertanyaan klarifikasi, kandidat dan brief | Tidak menetapkan topik tanpa keputusan mahasiswa |
| ProtocolCoach | Brief, PCC dan protokol | Peringatan keselarasan dan usulan perbaikan | Tidak mengarang registrasi/prosedur selesai |
| SearchAssistant | Strategi yang disetujui | Adaptasi sintaks, usulan sinonim | Query formal baru perlu approval mahasiswa |
| EvidenceAssistant | Record, kriteria dan dokumen | Lokasi bukti dan saran kelayakan | Bukan reviewer independen |
| ChartingAssistant | Schema dan sumber | Usulan sel dengan locator | Nilai tetap proposed sampai ditinjau |
| SynthesisAssistant | Dataset confirmed | Kategori dan narasi berdasarkan data | Hitungan tetap melalui layanan deterministik |
| WritingCoach | Draft dan evidence graph | Kerangka, edit bahasa, penanda klaim | Tidak mengisi hasil tanpa data |
| IntegrityChecker | Seluruh objek dan versi | Audit dan issue list | Tidak memberi jaminan publikasi |

Fungsi tidak wajib diimplementasikan sebagai delapan agent aktif. Satu runtime dengan prompt dan tool-scope berbeda lebih sederhana untuk MVP. Pemisahan worker dilakukan hanya bila kebutuhan isolasi, biaya atau proses panjang membenarkannya.

## Orkestrasi

Workflow service menjadi sumber state. Model tidak boleh memutuskan transisi sendiri hanya dengan teks. Setiap job menerima projectId, actorId, capabilityScope, dependencyVersions, inputArtifactIds, modelVersion, promptVersion dan idempotencyKey. Keluaran terstruktur divalidasi sebelum ditampilkan sebagai proposal.

Tool read hanya menjangkau proyek yang diizinkan. Tool write menghasilkan proposed artifact atau menjalankan aksi yang telah disetujui. Job yang selesai setelah versi input berubah ditandai stale dan tidak diterapkan otomatis.

## Scaffolding dan automation budget

Tingkat bantuan: pertanyaan pemantik, petunjuk terarah, contoh parsial dan usulan lengkap. Pengguna dapat meminta bantuan lebih lanjut; catat tingkat yang diminta dan digunakan. Pada penggunaan normal, jangan menghukum mahasiswa yang membutuhkan dukungan. Pada eksperimen, aturan bantuan mengikuti protokol studi dan versi yang ditetapkan.

Budget adalah kebijakan fungsi mana yang didelegasikan, bukan semata jumlah token. Search retrieval dan formatting boleh banyak diautomasi. Pemilihan fokus, kriteria, keputusan seleksi, interpretasi dan persetujuan klaim tetap keputusan manusia.

## Miskonsepsi yang dapat ditargetkan

- Menganggap sedikit hasil membuktikan novelty: minta memeriksa query dan review terdahulu.
- Menyamakan metadata dengan fulltext: minta menunjukkan lokasi bukti.
- Menyamakan frekuensi penggunaan dengan efektivitas: minta membedakan jenis kesimpulan.
- Memilih kriteria setelah melihat hasil tanpa pelaporan: ajak membuat amendment dan meninjau keputusan terdampak.
- Menyamakan hasil draft berbantuan dengan kompetensi mandiri: berikan tugas transfer terpisah.

Diagnosis miskonsepsi adalah hipotesis bantuan, dapat dikoreksi mahasiswa. Jangan membuat label psikologis permanen berdasarkan satu jawaban.

## Pengukuran

Trace minimum: keputusan awal, alasan, bukti dibuka, bantuan diminta, rekomendasi, respons pengguna dan revisi final. Durasi atau klik tidak otomatis berarti pemahaman. Pisahkan reliabilitas sistem, kualitas artefak berbantuan dan kinerja tugas transfer.

Transfer opsional pada P8 menggunakan topik/bukti baru, bantuan terbatas, rubrik dan jadwal studi yang eksplisit. Untuk menguji transfer tertunda, ukuran jeda ditetapkan protokol studi, bukan klaim produk. Data belajar digunakan untuk penelitian hanya melalui tata kelola dan persetujuan yang sesuai; tidak langsung menjadi data pelatihan model.

## Model lokal dan cloud

UI mahasiswa menampilkan bantuan VERA dan keterbatasan layanan. Routing model merupakan kebijakan backend, dengan status kegagalan transparan. Pengiriman dokumen ke cloud mengikuti konfigurasi akses dan kebijakan proyek. Selama studi komparatif, pin model, prompt dan assistance policy. Continual training bukan prasyarat workflow dan tidak menjadi bagian implementasi P0–P8.
