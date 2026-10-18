# 01. Kajian dan Keputusan Desain

## Prinsip pengalaman pengguna

Workflow dirancang untuk mahasiswa yang baru pertama kali melakukan kajian. Alur inti harus dapat dipahami tanpa mengenal mata kuliah, singkatan, checklist, atau dokumen konsep proyek. Salah satu tugas perkuliahan tentang penyusunan rencana Scoping Review menjadi contoh format keluaran kampus yang dapat dipetakan ke workflow. Mahasiswa yang tidak membawa instruksi khusus tetap menjalani proses riset yang utuh.

Di layar, nama pekerjaan sehari-hari tampil lebih dahulu, misalnya **Menentukan arah kajian**, **Membuat rencana pencarian**, dan **Memilih sumber**. Istilah seperti *protocol*, PCC, *data charting* dan PRISMA-ScR disertai penjelasan singkat saat pertama muncul. Codex tidak boleh menganggap README paket atau pengetahuan tentang format tugas tertentu sebagai materi onboarding yang sudah dibaca mahasiswa.

## Masalah desain

Alur eksplorasi topik yang berakhir pada ringkasan literatur belum cukup untuk menghasilkan artikel yang dapat dipertanggungjawabkan. Penambahan editor saja juga tidak menyelesaikan masalah: artikel membutuhkan protokol, pencarian yang terdokumentasi, seleksi sumber, charting dan sintesis. Setiap tahap harus menghasilkan objek data yang digunakan tahap berikutnya.

Konsep awal menekankan kemampuan menilai bukti dan metode, bukan hanya produktivitas. Arah terbaru meminta tugas autentik berupa Scoping Review. Keduanya dapat disatukan dengan menempatkan keputusan belajar pada pekerjaan review yang memang memerlukan pertimbangan, tanpa membuat mahasiswa mengisi refleksi pada setiap tindakan kecil.

## Tiga pendekatan

| Pendekatan | Kelebihan | Risiko | Keputusan |
|---|---|---|---|
| Wizard linear yang wajib diselesaikan satu kali | Mudah dipahami saat mulai | Review bersifat iteratif; perubahan kriteria dapat membuat data lama keliru | Gunakan untuk orientasi, bukan aturan navigasi seluruh aplikasi |
| Chat bebas dengan agent serba guna | Cepat untuk eksplorasi | Keputusan, versi protokol dan bukti sulit dilacak; hasil mudah melampaui data | Gunakan sebagai panel bantuan kontekstual |
| Workspace bertahap dengan objek data, gate, dan editor hidup | Proses dapat dilanjutkan, diperiksa dan diperbarui | Memerlukan domain model dan kontrol dependensi | Pendekatan utama yang direkomendasikan |

## Keputusan utama

- Satu proyek memiliki tahapan umum: menentukan arah, membuat rencana, menjalankan review, memetakan bukti, dan menulis draft. Format tugas khusus dapat ditambahkan sebagai keluaran pilihan dengan memakai data proyek yang sama.
- Tahap awal berupa wawancara singkat yang dapat dilanjutkan, diikuti eksplorasi nyata. Kandidat topik adalah usulan, bukan keputusan agent.
- Protokol menjadi snapshot berversi. Penguncian berarti versi acuan telah dipilih, bukan melarang perubahan.
- Pencarian eksploratif dan formal berada pada ruang data yang terpisah. Promosi data hanya melalui tindakan eksplisit yang membuat run formal baru dengan provenance yang memadai.
- Screening dua reviewer manusia adalah kemampuan inti untuk jalur review lengkap. Bila baru satu reviewer tersedia, kegiatan tetap boleh berjalan sebagai latihan, dengan status keterbatasan yang terlihat pada audit dan ekspor.
- Draft selalu dapat dibuka. Bagian hasil dan kesimpulan hanya dapat ditandai terverifikasi setelah data pendukung tersedia. Ekspor draft yang belum lengkap tetap diizinkan dengan daftar kekurangan.
- Appraisal tidak wajib otomatis. Keputusan melakukan atau tidak melakukan harus memiliki alasan; bila dilakukan, metode dan hasilnya harus tersimpan.
- Semua pekerjaan inti tersedia dalam aplikasi. Impor ekspor database dan PDF legal menjadi jalur pendamping bila akses langsung tidak tersedia. Sumber langganan dan registrasi eksternal tetap bergantung pada akses pihak terkait.

## Batas MVP dan pengembangan berikutnya

P2 menghasilkan rencana kajian dan draft awal yang hanya berisi hal yang sudah diketahui atau masih direncanakan. Bila pengguna memilih format tugas tertentu, aplikasi menyiapkan keluarannya. Alur artikel lengkap membutuhkan P3 sampai P7, termasuk dukungan reviewer, charting dan ekspor. P8 menambahkan evaluasi pembelajaran lebih lanjut. Jangan menampilkan istilah atau aturan tugas khusus sebagai prasyarat workflow umum.

Pertahankan penyimpanan dan layanan riset OpenResearch/VERA yang dapat dipakai ulang. Penambahan backend terbatas pada kemampuan yang benar-benar diperlukan workflow. Hindari penggantian keseluruhan aplikasi, LMS umum, pengelolaan administrasi kampus, pelatihan foundation model dan migrasi infrastruktur dalam paket ini.

## Penajaman pedagogis

Judgement awal relevan pada pemilihan fokus, penilaian kelayakan sumber, interpretasi temuan dan keputusan klaim. Jangan mewajibkannya untuk pengunduhan, pengaturan filter atau penyimpanan. Pertanyaan singkat dan konkret lebih berguna daripada formulir refleksi panjang.

Sistem tidak boleh mengklaim kebaruan topik dari sedikitnya hasil pencarian. Kemiripan review terdahulu perlu diperiksa melalui cakupan PCC, periode, sumber, jenis bukti dan tujuan. Temuan gap merupakan hasil pemetaan dalam cakupan tertentu, bukan bukti bahwa penelitian belum pernah dilakukan.

## Asumsi operasional

Bahasa awal UI adalah Indonesia; bahasa draft dapat dipilih. Peran minimal: pemilik proyek, reviewer, adjudikator dan pembimbing opsional. Dosen tidak harus menyetujui setiap langkah agar mahasiswa dapat melanjutkan. Pengaturan persetujuan pembimbing dapat diaktifkan proyek tertentu. API key dikelola melalui pengaturan layanan, tidak melalui chat mahasiswa.
