# 09. UI dan Interaksi

## Struktur navigasi

Dashboard proyek menampilkan judul kerja, tahap aktif, tindakan selanjutnya dan hambatan. Untuk pengguna baru, layar mulai memberi pilihan: **Bantu saya menemukan topik**, **Saya sudah punya topik**, atau **Saya ingin mengikuti format tugas tertentu**. Dua pilihan pertama menjalankan workflow umum; pilihan ketiga opsional.

Sidebar proyek: Arah Kajian, Rencana Kajian, Sumber, Pemilihan Sumber, Catatan Sumber, Peta Temuan, Draft Artikel, Pemeriksaan dan Ekspor. Istilah teknis dapat muncul sebagai keterangan tambahan setelah penjelasan dalam bahasa umum. Sumber tersimpan sebagai panel lintas tahap, bukan daftar terpisah yang perlu disalin.

Layout desktop: navigasi tahap, area kerja utama dan panel pendamping VERA yang dapat ditutup. Panel pendamping memuat pertanyaan, bantuan dan tautan sumber untuk aktivitas aktif. Detail terminal, kode dan log berada di Detail teknis untuk pengguna yang memerlukannya. Model/harness tidak menjadi pilihan utama mahasiswa.

## Spesifikasi layar

| Layar | Area utama | Aksi primer | Informasi yang harus terlihat |
|---|---|---|---|
| Mulai | Tujuan proyek dan panduan untuk pengguna baru | Mulai menentukan arah | Pilihan mulai dari minat, melanjutkan topik, atau memetakan format tugas |
| Arah | Pertanyaan, rangkuman dan kandidat | Konfirmasi arah | Jawaban asli, alasan dan ketidakpastian |
| Rencana kajian | Editor tujuan, sumber, aturan pemilihan dan cara merangkum; detail teknis dapat dibuka | Simpan versi acuan | Rencana kajian; format tugas hanya bila dipilih |
| Sumber | Query per database/sumber dan riwayat pencarian | Jalankan pencarian yang disetujui | Sumber asli, waktu, jumlah diterima dan status akses |
| Pemilihan sumber | Antrean, abstrak/PDF dan aturan pemilihan | Simpan keputusan | Versi aturan; keputusan reviewer lain tersembunyi sebelum submit |
| Catatan sumber | Tabel dan pembaca sumber berdampingan | Periksa catatan | Usulan/terkonfirmasi, lokasi kutipan dan data belum tersedia |
| Peta temuan | Kategori, tabel dan peta bukti | Konfirmasi rangkuman | Data acuan dan cara menghitung jumlah |
| Draft | Editor bagian dan evidence panel | Tinjau usulan | Status bagian, klaim, sitasi dan versi |
| Audit | Checklist dan issue list | Ekspor | Kekurangan, status keluaran dan versi data |

## State wajib per layar

Empty memberikan tindakan awal yang konkret. Loading menunjukkan pekerjaan yang sedang berlangsung. Error memberikan penyebab dan opsi retry yang aman. Partial menjelaskan bagian data yang belum diterima. Stale menunjukkan perubahan hulu. Conflict memperlihatkan pilihan versi. Permission denied tidak membocorkan data proyek lain. Offline menjelaskan tindakan lokal yang tetap tersedia.

Badge lengkap hanya muncul dari validasi data. Jangan mengganti empty state dengan data demo tanpa label. Mode demo berada pada proyek terpisah bertanda contoh; data contoh tidak masuk pencarian formal atau ekspor penelitian nyata.

## Onboarding dan istilah

Layar mulai menjelaskan dalam satu kalimat bahwa Scoping Review adalah cara memetakan penelitian yang sudah ada mengenai suatu topik. Berikan opsi **Pelajari dulu** dengan contoh singkat dan tombol **Mulai tanpa istilah teknis**. Jangan menjadikan tutorial wajib yang panjang.

Saat form meminta bagian pertanyaan, tanyakan dulu “Siapa atau hal apa yang ingin Anda kaji?”, “Hal apa yang ingin Anda petakan?” dan “Dalam konteks mana?”. Setelah pengguna menjawab, berikan penjelasan PCC. Pada langkah rencana, gunakan penjelasan kerja sebelum istilah “protokol”. Saat penulisan laporan, jelaskan bahwa PRISMA-ScR adalah checklist pelaporan dan JBI adalah pedoman metode.

## Microcopy

Gunakan Tentukan arah kajian, Buat rencana, Cari sumber, Pilih sumber yang sesuai, Catat informasi, Lihat pola temuan, Periksa bukti, Tinjau usulan dan Susun draft. Jangan menampilkan kode mata kuliah, nomor pertemuan, atau nomor item tugas di jalur umum. Hindari jargon teknis pada alur mahasiswa. Istilah PCC, data charting dan PRISMA-ScR dijelaskan dalam konteks sebelum digunakan.

Saat pengguna membawa arahan dari kampus, sebut sebagai **Instruksi perkuliahan**. Jelaskan bagian yang diminta, seperti judul, alasan kajian, dan metode, sebelum menampilkan nomor checklist. Jangan meminta mahasiswa mempelajari daftar istilah sebelum mulai.

Satu aksi primer per konteks kerja. Navigation tidak mengubah status completion. Tombol mengunci protokol menjelaskan bahwa perubahan tetap mungkin melalui revisi tercatat.

## Aksesibilitas dan kerja panjang

Semua kontrol dapat diakses keyboard; fokus setelah perpindahan tahap masuk heading area utama. Label form, error inline, status autosave yang dapat dibaca pembaca layar, kontras memadai dan indikator selain warna diperlukan. Tabel besar memakai pagination/filter tanpa menghilangkan pilihan atau pekerjaan belum tersimpan. Reader tidak menjadi satu-satunya akses informasi, sediakan metadata dan ekstrak teks bila tersedia.

## Arahan pemetaan repo

Analisis sebelumnya menyebut ui/src/App.tsx dan ResearchDemoWorkspace.tsx. Nama itu adalah kandidat audit, bukan bukti checkout saat ini. Codex harus menelusuri routing aktual, project identity, storage client dan komponen. Gunakan shell ResearchWorkspace untuk proyek nyata jika pola repo mendukung, dan pecah modul berdasarkan tahap. Hindari menambah semua state ke satu komponen demo.
