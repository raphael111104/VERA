# 06. Deduplikasi, Seleksi, Teks Lengkap dan Charting

## Deduplikasi yang dapat dibatalkan

Normalisasi DOI, ID provider dan judul untuk pencocokan. DOI identik menjadi kandidat kuat, tetapi koreksi, erratum dan versi berbeda perlu ditinjau. Fuzzy title-author-year hanya menghasilkan candidate match, bukan penggabungan otomatis tanpa batas. Simpan DuplicateCluster, alasan match, metadata pilihan, occurrence dan aksi undo. Satu penelitian dapat memiliki beberapa laporan; deduplikasi record dan pengelompokan laporan studi adalah konsep berbeda.

Setelah deduplikasi, bekukan SelectionSetVersion yang merekam run formal dan record yang dipakai. Run tambahan membuat revisi set; keputusan lama yang masih relevan boleh dipertahankan, tetapi record baru belum dianggap telah diseleksi.

## Screening manusia

Peran reviewer A dan B adalah dua orang berbeda dengan identitas terpisah. Pada judul-abstrak, masing-masing menilai include, exclude atau uncertain berdasarkan versi kriteria yang sama. Keputusan reviewer lain tidak terlihat sebelum keduanya submit. Saran agent baru ditampilkan setelah judgement manusia pada record tersebut untuk mengurangi anchoring.

Keputusan uncertain bergerak ke pemeriksaan lebih lanjut. Konflik membuat queue adjudication; hasil resolusi menyimpan pihak, alasan dan keputusan final tanpa menimpa keputusan independen. Dua akun untuk satu orang tidak memenuhi dua reviewer; aplikasi meminta deklarasi identitas, sementara integritas prosedur tetap tanggung jawab tim.

Reviewer tunggal dapat mengerjakan latihan dan draft sementara. Tidak boleh mengganti reviewer B dengan agent atau menuliskan prosedur dua reviewer sebagai kegiatan yang telah dilakukan bila belum ada datanya.

## Teks lengkap

Status report: not_requested, requested, retrieved, not_retrieved. Permintaan dan kegagalan retrieval menyimpan tanggal, tindakan dan alasan. Not_retrieved tidak sama dengan excluded_after_fulltext.

Reader menampilkan PDF/teks legal yang tersedia, anotasi, halaman dan panel kriteria. Pemilihan teks menyimpan sourceArtifactId, page, section, quote dan hash dokumen. Bila hanya abstrak tersedia, tampilkan batasnya dan larang klaim seolah pemeriksaan teks lengkap sudah dilakukan.

Setelah retrieved, lakukan keputusan kelayakan independen dan resolusi konflik. Eksklusi membutuhkan satu alasan utama operasional dari protokol, dengan catatan tambahan opsional. Jangan mengeksklusi karena paywall sebagai alasan metodologis setelah fulltext jika dokumen belum pernah diperoleh.

## Ledger seleksi

Jumlah berasal dari objek dan keputusan, bukan isian naratif manual. Pada level yang sesuai, catat records identified, duplicates removed, records screened, records excluded, reports sought, reports not retrieved, reports assessed, reports excluded, reports included. Bila ingin jumlah studies, hubungkan report ke StudyGroup; jangan menyamakan semua paper dengan studi tunggal.

Untuk satu set tanpa cabang tambahan: identified − duplicates − removals lain yang tercatat = screened; screened − excluded = reports sought; sought − not retrieved = assessed; assessed − excluded after fulltext = reports included. Bila ada jalur sumber lain, agregasi tetap mengikuti asal dan unit yang benar. Setiap perubahan memiliki alasan dan memicu perhitungan ulang.

## Form charting

Kolom awal: citation, publicationYear, country, objective, design, participants, concept, context, relevantFindings dan limitations. Pengguna mengubah sesuai pertanyaan review. Definisi kolom menyimpan type, required, allowedValues, missingPolicy dan extractionGuidance.

Pilot form dilakukan pada beberapa sumber yang dipilih tim; ukuran pilot ditetapkan dalam protokol, tidak dianggap aturan universal. Form baru membuat SchemaVersion. Perubahan tipe/arti kolom meminta pemetaan dan peninjauan baris lama.

Nilai setiap sel dapat berupa present, not_reported, not_applicable atau uncertain. Unknown tidak dikonversi menjadi 0 atau tidak ada fenomena. Simpan value, sourceLocator, extractor, verificationStatus dan verifier. Usulan agent tidak berstatus confirmed sampai manusia memeriksa.

Charting dilakukan oleh satu anggota dengan verifikasi anggota kedua atau secara independen sesuai protokol. Dua reviewer tetap terlibat dalam proses bukti; prosedur ekstraksi tidak diasumsikan identik dengan screening. Appraisal, bila dipilih, menggunakan modul terpisah sesuai instrumen dan jenis sumber.

## Kriteria selesai

Semua konflik seleksi teratasi; sumber belum diperoleh tercatat; sumber included punya baris charting; kolom wajib telah diperiksa dengan status missing yang sah; setiap temuan utama punya lokasi bukti. Ketidaktersediaan data dilaporkan sebagai keterbatasan, bukan diisi agent.
