# 07. Sintesis, Draft Artikel, Audit dan Ekspor

## Sintesis dari data terkonfirmasi

SynthesisVersion mengacu pada SelectionSetVersion, ChartingSchemaVersion dan versi baris terkonfirmasi. Tabel deskriptif dihitung oleh kode dari dataset, bukan perkiraan model. Setiap persentase mencantumkan denominator dan kebijakan missing. Satu sumber dapat masuk beberapa kategori; UI menjelaskan jika total kategori lebih dari jumlah sumber.

Mahasiswa menyetujui codebook dan kategori. Agent dapat mengusulkan pengelompokan dengan tautan baris, tetapi kategori final adalah keputusan pengguna. Temuan kualitatif tidak dipaksakan menjadi frekuensi atau kesimpulan efek. Peta evidence gap dibatasi pada cakupan pencarian, kelayakan dan data yang tersedia.

## Editor artikel hidup

Bagian: judul, abstrak, pendahuluan, metode, hasil, pembahasan, kesimpulan, referensi dan lampiran. Status per bagian: empty, outline, draft, needs_review, verified. Bagian metode awal berasal dari protokol; saat pelaksanaan berlangsung, fakta aktual menggantikan rencana melalui perubahan yang terlihat.

Mahasiswa dapat menulis sebelum pencarian selesai. Hasil yang belum ada tampil sebagai kerangka instruksional, tidak sebagai paragraf yang berisi angka buatan. Agent menghasilkan usulan ke area review perubahan; tombol terapkan membuat revisi, tidak menimpa teks tanpa riwayat.

## Claim-evidence link

Claim menyimpan teks/rentang draft, claimType, sourceRecordIds, chartingCellIds, evidenceLocators, sourceLevel dan reviewStatus. sourceLevel membedakan metadata, abstract dan fulltext. Claim faktual membutuhkan dukungan; tujuan penulis dan usulan penelitian tidak harus diperlakukan sebagai fakta empiris.

Pemeriksaan sitasi terdiri dari metadata-validity dan support-validity. DOI yang valid tidak membuktikan bahwa sumber mendukung klaim. Sistem menandai missing citation, source mismatch, unsupported statistic, overgeneralization dan stale evidence. Label verified berarti telah ditinjau sesuai prosedur proyek, bukan kebenaran absolut.

## Pelaporan lengkap

Audit memeriksa judul (1), ringkasan (2), rasional/tujuan (3–4), metode (5–13), hasil (14–18), pembahasan (19–21) dan pendanaan (22). Item 12 dan 16 bersyarat pada keputusan appraisal. Status checklist: reported, missing, not_applicable_with_reason, needs_review. Pernyataan belum terdaftar bisa memenuhi pelaporan status registrasi jika jujur; jangan menganggap nomor registrasi wajib untuk semua proyek.

## Keluaran dan paket bukti

- Keluaran tugas perkuliahan, bila dipilih: dokumen pendamping, checklist dan lampiran sesuai instruksi.
- Artikel: DOCX dan Markdown, daftar pustaka dengan DOI/URL, checklist serta diagram seleksi yang dihitung dari ledger.
- Paket pendamping: search log CSV/JSON, screening dan alasan eksklusi, dataset charting, codebook, tabel sintesis dan amendment log.
- File sumber berlisensi, PDF pihak lain dan credential tidak masuk paket ekspor secara default. Ekspor data belajar terpisah dengan kontrol akses.

Citation style awal APA 7; metadata yang tidak lengkap ditandai untuk diperiksa. Jangan menebak DOI, volume atau halaman. Nomor halaman checklist dihitung setelah rendering final melalui anchor heading dan pemeriksaan hasil render. Bila pemetaan halaman gagal, hasil checklist ditandai perlu diverifikasi, tidak disebut final.

## Audit dan perubahan

Sebelum ekspor, tampilkan unresolvedIssues, coverage, dependencyVersions dan reviewState. Ekspor draft belum lengkap tetap tersedia dengan catatan status dan kekurangan. Status siap ditinjau hanya jika blocker integritas terselesaikan. Sistem tidak mengirim ke jurnal atau mengunggah tugas tanpa tindakan pengguna yang terpisah.

Perubahan keputusan screening setelah sintesis menandai tabel, klaim dan draft terkait sebagai needs_review. Jangan menghapus tulisan mahasiswa. Tampilkan perbandingan, hitung ulang data, lalu minta konfirmasi untuk menerapkan narasi baru.

## Validasi ekspor

Periksa file bisa dibuka, heading konsisten, tabel tidak terpotong, tautan DOI berfungsi, referensi sesuai sitasi, angka flow sama dengan ledger dan status draft sama dengan audit. Render DOCX/PDF bila dipakai untuk pemetaan halaman. Proyek dengan nol sumber included tetap dapat menghasilkan laporan hasil kosong dan keterbatasan, tanpa memaksakan sintesis.
