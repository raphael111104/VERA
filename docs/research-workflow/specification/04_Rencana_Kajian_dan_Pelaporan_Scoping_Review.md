# 04. Rencana Kajian dan Pelaporan

Mahasiswa melihat tahap ini sebagai **Membuat rencana kajian**. Codex dapat menggunakan istilah protokol untuk model data dan istilah akademiknya, tetapi UI menjelaskan bahwa rencana ini menerangkan sumber yang akan dicari, cara memilihnya, informasi yang dicatat, dan cara merangkum temuan.

Scoping Review (kajian pemetaan) bertujuan memberi gambaran cakupan bukti yang tersedia pada suatu topik. Jika istilah ini belum dikenal, berikan definisi sederhana dan contoh tujuan. Jelaskan bahwa JBI adalah pedoman metode yang dapat membantu menjalankan review dan PRISMA-ScR adalah checklist untuk melaporkan review. Mempelajari checklist bukan syarat untuk mulai.

## Contoh pemetaan instruksi perkuliahan

Salah satu instruksi perkuliahan yang menjadi dasar rancangan meminta mahasiswa menyusun judul, pendahuluan, dan metode untuk Scoping Review. Ketentuan ini menjadi **contoh format keluaran**, bukan struktur wajib untuk semua mahasiswa. Pengguna yang membawa instruksi dapat memilih opsi **Bantu saya menyesuaikan dokumen dengan instruksi ini**. VERA lalu menghubungkan langkah dan isi workflow yang sudah ada ke bagian yang diminta. Mahasiswa yang mengikuti alur umum tidak diperlihatkan kode mata kuliah, nomor pertemuan, nama berkas pengumpulan, atau daftar “komponen wajib tugas”.

Codex menyimpan pemetaan instruksi sebagai pengaturan keluaran pilihan:

| Isi instruksi perkuliahan | Istilah di aplikasi | Keterangan singkat |
|---|---|---|
| Judul | Judul kerja kajian | Menyebut topik dan jenis review |
| Rasional | Mengapa kajian ini perlu dilakukan | Pengetahuan yang ada, bagian yang belum jelas, alasan pemetaan |
| Tujuan dan pertanyaan PCC | Apa yang ingin dipetakan? | Siapa/apa, hal yang dikaji, konteks |
| Protokol/registrasi | Status rencana dan pencatatannya | Registrasi eksternal hanya disebut bila benar tersedia |
| Kriteria kelayakan | Sumber seperti apa yang akan dipilih? | Aturan inklusi-eksklusi dan alasan |
| Sumber dan strategi pencarian | Di mana dan dengan kata apa sumber dicari? | Query yang dapat diulang |
| Seleksi sumber | Bagaimana sumber dipilih? | Reviewer, tahapan dan alasan |
| Data charting dan item data | Informasi apa yang akan dicatat? | Form dan definisi kolom |
| Appraisal dan sintesis | Apakah mutu bukti dinilai dan bagaimana temuan dirangkum? | Appraisal dapat dipilih atau tidak dengan alasan |

Pemetaan ini menjaga hasil tugas tetap sesuai instruksi asli tanpa memaksa mahasiswa lain mempelajari instruksi tersebut.

## Komponen pada contoh instruksi

Contoh instruksi perkuliahan meminta komponen 1 serta 3 sampai 13 dalam bahasa Indonesia. Komponen lain belum diminta pada tugas awal tersebut. Jika pengguna memilih format itu, dokumen pendamping mempertahankan nomor checklist dan formulir diisi nomor halaman setelah dokumen terbentuk. Aplikasi menjelaskan bahwa JBI menjadi acuan metode dan PRISMA-ScR acuan pelaporan; kegiatan yang direncanakan dibedakan dari kegiatan yang sudah dilakukan.

## Pemetaan komponen ke aplikasi

| Item | Form atau editor | Validasi utama |
|---|---|---|
| 1 | Judul kerja | Memuat istilah scoping review dan sesuai fokus |
| 3 | Rasional | Konteks, pengetahuan tersedia, kebutuhan pemetaan dan alasan pendekatan; klaim berbukti |
| 4 | Tujuan dan pertanyaan: siapa/apa, hal yang dipetakan, dan konteks | Bagian-bagian PCC selaras dengan tujuan dan pertanyaan |
| 5 | Protokol dan registrasi | Status nyata: belum disusun, tersusun internal, dipublikasikan, atau terdaftar; URL/nomor hanya jika tersedia |
| 6 | Kriteria kelayakan | Inklusi-eksklusi operasional, jenis bukti dan alasan pembatasan |
| 7 | Sumber informasi | Database/sumber yang direncanakan; tanggal aktual hanya dari run formal |
| 8 | Strategi pencarian | Query lengkap minimal satu database, field, Boolean dan filter |
| 9 | Seleksi | Deduplikasi, dua reviewer, kedua tahap screening, konflik dan alasan eksklusi |
| 10 | Proses charting | Pilot form, pembagian tugas dan verifikasi data |
| 11 | Item data | Definisi variabel dan aturan data tidak dilaporkan/tidak berlaku |
| 12 | Appraisal | Dilakukan atau tidak, alasan; jika ya, instrumen dan penggunaan hasil |
| 13 | Rencana sintesis | Bentuk penyajian dan hubungan dengan pertanyaan review |

Setiap komponen menyimpan narrative, structuredFields, evidenceLinks, executionStatus dan version. executionStatus berisi planned, underway atau completed. Status tidak disimpulkan dari panjang paragraf.

## Validasi keselarasan

VERA memeriksa rantai tujuan → pertanyaan → aturan memilih sumber → query → informasi yang dicatat → cara merangkum. Istilah PCC dapat ditampilkan sebagai penjelasan opsional. Misalnya, pertanyaan tentang konteks penggunaan tetapi tabel catatan tidak mempunyai kolom konteks harus diberi peringatan. Query yang tidak memuat semua unsur pertanyaan tidak otomatis salah: strategi harus disesuaikan dengan sensitivitas pencarian dan diberi alasan.

Pembatas tahun, bahasa atau jenis publikasi harus dijelaskan. Tidak ada filter Q1, open access atau publisher tertentu yang diaktifkan tanpa keputusan pengguna dan alasan. Preferensi akses mudah tidak boleh diam-diam menjadi kriteria yang mengubah cakupan review.

## Membuat dan menyimpan rencana kajian

Mahasiswa memeriksa ringkasan rencana kajian dan memilih versi acuan. Codex menyimpan hash isi, versi arah kajian, versi strategi pencarian, tanggal, aktor dan status persetujuan bila proyek menggunakannya. Ini bukan registrasi publik. Sistem dapat menyimpan tautan registrasi eksternal yang dimasukkan pengguna tanpa mengklaim telah melakukan registrasi. UI menyebutnya rencana kajian dan memberi label akademik “protokol” dalam keterangan tambahan.

## Keluaran jika pengguna memilih format tugas tertentu

- Dokumen pendamping item 1 dan 3–13, identitas nama, NIM, program studi, judul, referensi dan lampiran.
- Formulir PRISMA-ScR dengan kolom halaman untuk item tugas.
- Lampiran strategi pencarian dan rancangan charting.
- Gunakan pola nama berkas, identitas, dan format pengumpulan hanya jika diminta oleh instruksi yang dipilih. VERA meminta informasi tersebut saat menyiapkan dokumen.

Nomor halaman dihasilkan dari hasil render final. Jangan memakai nomor perkiraan dari editor web. Komponen yang tidak diminta ditandai demikian, bukan dibuatkan hasil fiktif. Tenggat pada file sumber merupakan tenggat tugas historis, bukan jadwal otomatis proyek baru.

Tanpa memilih instruksi perkuliahan, mahasiswa tetap dapat mengekspor rencana kajian standar. Dokumen standar tidak memuat nomor checklist khusus, nama berkas tugas, atau kolom nomor halaman.

## Transisi ke pelaksanaan

Setelah pencarian nyata, metode artikel lengkap menggunakan apa yang benar-benar dilakukan. Perubahan dari rencana dicatat sebagai amendment dan dilaporkan. Artikel lengkap membutuhkan seluruh item pelaporan yang relevan, termasuk appraisal bersyarat dan pendanaan; checklist lengkap tersedia pada tahap audit.
