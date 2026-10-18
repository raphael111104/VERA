# Rancangan Panduan Agent VERA yang Sederhana

## Tujuan

Membuat VERA lebih mudah digunakan peneliti pemula dengan panduan yang muncul sesuai tahap, bantuan untuk pekerjaan rutin, dan penjelasan atas usulan agent. Perubahan harus mengurangi pekerjaan berulang dan perpindahan aplikasi, sambil melatih pengguna menimbang bukti dan menyusun alasan sendiri.

Rancangan ini melengkapi workflow P1–P8. Ia bukan pengganti peneliti, reviewer manusia, atau akses resmi penyedia data.

## Prinsip desain

1. **Agent menjelaskan langkah berikutnya.** Pengguna tidak perlu menebak apa yang harus dilakukan atau mencari panduan di halaman lain.
2. **Pekerjaan rutin boleh diotomatisasi.** Contohnya merapikan metadata, menyesuaikan format query, memeriksa duplikasi, menyiapkan ekspor, dan memeriksa kelengkapan.
3. **Keputusan akademik tetap milik peneliti.** Agent dapat menyajikan pilihan, alasan, bukti, dan ketidakpastian; peneliti menetapkan fokus, kriteria, keputusan kasus sulit, interpretasi, serta klaim akhir.
4. **Bantuan bertahap, bukan paksaan.** Mulai dari pertanyaan atau petunjuk. Pengguna dapat meminta contoh atau usulan lebih lengkap jika diperlukan.
5. **Setiap usulan dapat ditinjau.** Tampilkan perubahan, sumber, kutipan, bagian yang belum pasti, dan alasan yang dipakai. Terapkan perubahan hanya setelah persetujuan pengguna.
6. **Tidak mengarang bukti.** Jika informasi tidak ditemukan, tandai belum tersedia atau perlu diperiksa; jangan mengisinya berdasarkan dugaan.
7. **Kemajuan belajar tidak disimpulkan dari klik.** Pisahkan mutu proses, mutu dokumen, dan kemampuan pengguna menyelesaikan tugas serupa secara mandiri.

## Konsep interaksi utama

Tambahkan **Panduan VERA** ke panel kanan yang sudah memuat pratinjau, berkas, browser, dan Sidechat. Panduan menyesuaikan isi dengan tahap kajian yang aktif dan selalu menunjukkan:

- **Anda sedang di tahap apa** dan tujuan tahap itu.
- **Apa langkah berikutnya** dalam kalimat singkat.
- **Apa yang dapat VERA bantu** serta apa yang masih perlu diputuskan peneliti.
- Tombol tindakan yang jelas: **Jelaskan**, **Bimbing saya**, atau **Siapkan usulan**.

Gunakan satu rekomendasi utama per tahap. Pengaturan tingkat bantuan atau model ditempatkan sebagai pilihan lanjutan agar pengguna baru tidak dihadapkan ke banyak kontrol sekaligus.

### Penyesuaian UI kecil yang diterapkan

Panel **Usulan tahap** kini menampilkan tahap aktif, penjelasan singkat bahwa keputusan tetap di tangan pengguna, dan satu tombol bantuan yang jelas. Pilihan tahap, model, serta tingkat bantuan dipindahkan ke bagian **Sesuaikan tahap dan jenis bantuan** yang dapat dibuka bila diperlukan. Nilai awal tetap menggunakan panduan lokal dengan petunjuk terarah. Ini penyederhanaan tampilan saja; tidak mengubah alur data, hak persetujuan, atau kemampuan agent.

## Pola bantuan agent

Untuk tiap permintaan, VERA:

1. Membaca konteks proyek dan tahap aktif yang diizinkan.
2. Menjelaskan tujuan tugas dan bukti yang akan dipakai.
3. Meminta penilaian awal hanya untuk keputusan yang memang melatih penalaran.
4. Menawarkan rencana singkat atau menjalankan pekerjaan rutin sesuai pilihan pengguna.
5. Memeriksa hasil terhadap sumber, protokol, dan format data.
6. Menampilkan usulan, alasan, sumber, serta ketidakpastian.
7. Menunggu pengguna menerapkan, mengubah, atau menolak perubahan.
8. Menyimpan revisi dan jejak keputusan. Jika konteks sumber atau protokol berubah, usulan lama ditandai perlu ditinjau.

## Bantuan pada tiap tahap

| Tahap | Panduan dan bantuan yang disarankan | Batas keputusan |
|---|---|---|
| **P1 — Arah kajian** | Wawancara singkat satu pertanyaan demi satu; buat hingga tiga rumusan fokus alternatif; jelaskan perbedaan cakupan dan bukti awal yang masih perlu dicari. | Pengguna memilih fokus dan menjelaskan alasan utamanya. Agent tidak menetapkan novelty hanya dari sedikitnya hasil pencarian. |
| **P2 — Rencana kajian** | Susun draf kriteria, strategi pencarian, dan rencana metode dari arah kajian; adaptasikan query untuk setiap database sambil menyimpan query asli dan alasan adaptasi. | Pengguna meninjau dan menyetujui protokol serta versi acuan. Pendaftaran eksternal tidak diklaim selesai otomatis. |
| **P3 — Pencarian sumber** | Jalankan pencarian yang telah disetujui, lanjutkan halaman atau run yang terputus, jelaskan kegagalan provider, serta bedakan jumlah provider dari record yang benar-benar diterima. | Status parsial tidak boleh dinyatakan sebagai pencarian menyeluruh. Akses database mengikuti credential dan hak pengguna. |
| **P4 — Seleksi** | Beri saran awal Include / Exclude / Maybe dengan kriteria dan kutipan pendukung; kelompokkan kasus yang perlu perhatian; bantu melihat konflik antarkeputusan. | Pengguna mengesahkan keputusan. AI tidak dihitung sebagai reviewer manusia dan tidak menggantikan review independen. |
| **P5 — Pencatatan bukti** | Usulkan isian form dari PDF atau metadata; sertakan kutipan, halaman/bagian, dan tautan langsung ke sumber; tandai nilai yang ambigu. | Isian tanpa locator atau kutipan yang belum terverifikasi tetap berstatus usulan. Appraisal dan verifikasi bukti tetap memerlukan manusia. |
| **P6 — Sintesis dan draft** | Buat tabel dari data terkonfirmasi; tampilkan pola, variasi, temuan negatif, dan celah bukti; buat alternatif kerangka atau kalimat dengan tautan klaim. | Pengguna memilih interpretasi dan kekuatan klaim. Jangan membuat hasil atau angka dari dataset kosong/tidak lengkap. |
| **P7 — Audit dan ekspor** | Periksa item pelaporan yang kosong, klaim tanpa dukungan, referensi bermasalah, dan keluaran yang perlu diperbarui; sediakan pratinjau sebelum mengunduh paket. | Label lengkap/siap ditinjau tidak berarti benar secara ilmiah atau siap publikasi. |
| **P8 — Belajar bersama VERA** | Jadikan bantuan belajar tersedia dari setiap tahap. Sediakan petunjuk, contoh parsial, lalu latihan transfer opsional dengan sumber atau kasus baru. | Bantuan tidak menjadi skor kompetensi; kemampuan mandiri dinilai terpisah hanya dalam evaluasi yang disetujui. |

## Mengurangi kebutuhan bekerja di luar VERA

- Baca halaman jurnal dan paper pada panel browser, lalu simpan tautan dan metadata ke proyek.
- Tampilkan PDF dan form charting berdampingan agar kutipan dapat diperiksa saat pencatatan.
- Sediakan pratinjau CSV, Markdown, dan DOCX di dalam panel sebelum ekspor.
- Hubungkan setiap klaim draft ke sumber dan bukti yang mendasarinya.
- Untuk layanan yang memerlukan akun institusi, hak langganan, atau pengesahan eksternal, siapkan berkas dan tautan kembali ke tahap terkait. Jangan menyimpan credential ke prompt atau menyatakan pengiriman eksternal berhasil tanpa konfirmasi.

## Tingkat automasi sederhana

Tampilkan pilihan bantuan per tugas, bukan sebagai pengaturan rumit untuk seluruh aplikasi:

1. **Bimbing saya** — ajukan pertanyaan dan berikan petunjuk bertahap.
2. **Bantu saya menyusun** — siapkan usulan yang dapat diedit dan diperiksa.
3. **Kerjakan tugas rutin** — jalankan operasi mekanis dalam ruang lingkup yang disetujui, lalu tampilkan hasil dan undo.

Saat pengguna membuka keputusan berisiko tinggi, gunakan pola *judgment awal → bukti dan usulan agent → keputusan pengguna*. Pengguna boleh meminta tingkat bantuan lebih tinggi kapan saja; jangan memberi label kemampuan tetap berdasarkan satu interaksi.

## Tahapan implementasi yang disarankan

### Tahap 1 — Panduan kontekstual

Tambahkan kartu Panduan VERA pada panel kanan: tahap aktif, tujuan, satu langkah berikutnya, tindakan yang dapat dilakukan agent, serta penanda pekerjaan yang memerlukan keputusan peneliti. Gunakan pilihan sederhana dan petunjuk tanpa istilah teknis.

### Tahap 2 — Automasi yang mudah diperiksa

Prioritaskan adaptasi query, normalisasi metadata, saran duplikasi, pembuatan pratinjau ekspor, audit kelengkapan, dan usulan ekstraksi yang dilengkapi kutipan. Semua perubahan dapat ditinjau dan dibatalkan.

### Tahap 3 — Bantuan penalaran berbasis bukti

Tambahkan saran screening, perbandingan temuan, dan alternatif interpretasi. Setiap saran harus memuat kriteria/pertanyaan yang digunakan, record dan kutipan pendukung, serta alasan ketidakpastian.

### Tahap 4 — Evaluasi pembelajaran

Uji dengan peneliti pemula dan berpengalaman sebelum menyatakan bantuan meningkatkan kemampuan. Bandingkan mutu alasan, ketepatan keputusan, beban penggunaan, dan penyelesaian tugas serupa secara mandiri setelah jeda. Pisahkan hasil belajar dari kecepatan dan jumlah klik; gunakan persetujuan dan tata kelola khusus bila trace dipakai sebagai data penelitian.

## Kriteria keberhasilan produk

- Pengguna baru dapat menjawab “apa yang harus saya lakukan berikutnya?” tanpa harus bertanya di chat bebas.
- Tugas rutin dapat diselesaikan dengan lebih sedikit perpindahan halaman/aplikasi.
- Saran seleksi, ekstraksi, dan sintesis dapat dilacak ke sumber yang benar.
- Pengguna tetap memahami alasan keputusan dan dapat mengoreksi hasil agent.
- Perubahan data hulu membuat hasil turunan yang terdampak ditandai untuk ditinjau.
- Pengguna tidak diarahkan menganggap usulan AI sebagai bukti terverifikasi atau keputusan ilmiah final.

## Rekomendasi MVP

Mulai dengan **Panduan VERA yang sadar tahap** dan tiga tindakan sederhana: *Jelaskan*, *Bimbing saya*, dan *Siapkan usulan*. Di baliknya, jalankan hanya pekerjaan rutin yang dapat divalidasi serta usulan yang menampilkan bukti. Hindari memperkenalkan banyak agent bernama, dashboard skor kemampuan, atau automasi penuh pada keputusan akademik sebelum alur sederhana ini diuji dengan pengguna.
