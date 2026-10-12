# Audit alur VERA di localhost — 9 Oktober 2026

Audit mencakup alur yang tersedia saat ini: onboarding → workspace → fokus penelitian → pertanyaan lanjutan → pencarian sumber → penilaian bukti → sintesis → pemeriksaan klaim → output sementara, termasuk side chat, penghentian proses, pemulihan koneksi, pratinjau, dan unduhan. Tahap metodologi serta penulisan artikel belum tersedia dalam alur ini.

## Lingkungan dan model

- Localhost utama: UI `http://127.0.0.1:5201`, backend `http://127.0.0.1:4901`.
- Profil audit terisolasi: UI `http://127.0.0.1:5301`, backend `http://127.0.0.1:5101`.
- Model nyata: `codex / gpt-6-luna`, `reasoningLevel: max` (GPT-6-Luna Max).
- Jawaban diagnosis pada profil audit merupakan data uji, bukan penilaian kemampuan pemilik akun. Profil penelitian pengguna utama tidak diisi ulang.
- Perubahan diterapkan pada sumber, `ui/dist`, dan server pengembangan localhost. Paket aplikasi `dist/VERA.exe` tidak diganti.
- Helper dev-slot telah dicoba, tetapi checkout ini tidak mempunyai metadata Git; pengelola lifecycle helper juga belum mendukung Windows. Isolasi data/cache/config serta port dilakukan secara eksplisit.

## Temuan dan perbaikan

1. **Tingkat usaha pada onboarding:** sebelumnya model hanya diteruskan dengan usaha default. Pilihan tingkat usaha sekarang mengikuti katalog model dan diteruskan ke workspace. Luna Max dipilih melalui UI dan diverifikasi pada sesi backend.
2. **Konsistensi model:** satu riset mempertahankan model/tingkat usaha dari sesi risetnya, termasuk setelah halaman dimuat ulang. Pengguna dapat memilih model lain saat memulai riset baru; antarmuka menjelaskan ketentuan ini.
3. **Pemulihan pembacaan status:** kegagalan koneksi sementara sekarang mencoba menyambung kembali. Kesalahan koneksi dibersihkan ketika pembacaan berikutnya berhasil; side chat tetap dipantau dan tidak langsung dianggap berhenti.
4. **Gagal atau kosong di side chat:** respons provider yang gagal dan penyelesaian tanpa teks tidak ditampilkan sebagai keberhasilan hijau.
5. **Sumber utama gagal:** OpenAlex mengembalikan HTTP 429 dengan waktu tunggu panjang. Ketika seluruh sumber yang direncanakan gagal, pencarian memakai Crossref dengan query serta rentang tanggal yang sama. Kegagalan asli, sumber cadangan, identitas artikel, dan perubahan cakupan tetap dicatat. Tidak ada artikel sintetis atau penggantian diam-diam menggunakan korpus lama.
6. **Hentikan lalu coba kembali:** ditemukan konflik penulis sesi AI saat koordinator lama masih menutup proses. Setiap percobaan tinjauan tren sekarang mempunyai koordinator baru yang tetap merujuk fokus tervalidasi. Pengujian berhenti lalu mengirim kembali berhasil mencapai output akhir.
7. **Pesan kegagalan agent:** kesalahan provider ditampilkan sebagai kesalahan agent yang sebenarnya, bukan sekadar kesalahan parsing JSON kosong.
8. **Keterbacaan metadata:** format JATS dan entitas karakter penerbit ditampilkan sebagai teks biasa pada daftar judul dan panel abstrak. Metadata tidak dimasukkan sebagai HTML aktif.
9. **Kejujuran penyimpanan diagnosis:** ringkasan sekarang menjelaskan bahwa jawaban akan disimpan saat masuk workspace.

## Bukti alur nyata

Fokus uji: learning analytics untuk membantu penalaran mahasiswa saat menulis, dengan sasaran mahasiswa tahun pertama pada mata kuliah penulisan akademik di Indonesia.

- Fokus selesai: `76715c08-ca06-4756-8627-d5277169e2cf`.
- Tinjauan akhir selesai: `60830eac-f9b8-41f3-9c0b-cdca535c5aae`.
- Koordinator akhir: `chat_687539b8-d09a-4366-bc69-f128e3526a68`.
- Lima langkah agent selesai: perencanaan, analisis sumber Crossref, analisis penalaran/batas bukti, sintesis, dan pemeriksaan bukti.
- OpenAlex: 0 hasil, HTTP 429 tercatat. Crossref: 50 rekaman diambil, 48 artikel unik setelah deduplikasi.
- Jumlah tahunan: 2022 = 4; 2023 = 7; 2024 = 13; 2025 = 6; 2026 = 18. Total = 48.
- Lima klaim hasil pemeriksaan; setiap ID rujukan klaim terdapat dalam korpus. Artikel pada daftar terkait berasal dari himpunan relevansi agent.
- Lima sesi penelitian yang tersimpan (fokus, koordinator tren, tiga sub-agent) diperiksa langsung: seluruhnya `gpt-6-luna / max`.
- Delapan jawaban diagnosis tersimpan dan tetap tersedia sesudah server audit dimulai ulang.
- Tiga pratinjau berkas berhasil dibuka sebagai tab: Markdown, JSON, SVG. Gambar SVG selesai dimuat dengan ukuran asli 600 × 435.
- Perpindahan tab menggunakan tombol panah keyboard serta penutupan tab diuji setelah build akhir. Ikon pemilih model pada sidebar ringkas berukuran 18 px di dalam tombol 36 × 36 px, dengan selisih pusat horizontal 0 px.
- Tiga unduhan nyata dibandingkan dengan hasil generator/job: catatan Markdown sama, bukti JSON sama secara struktural, dan grafik SVG sama.
- Tautan artikel membuka tab browser internal. Metadata/abstrak tersedia sebagai pilihan ketika halaman penerbit tidak dapat ditampilkan.
- Output penelitian dipulihkan sesudah pemuatan ulang halaman, tanpa mengulangi onboarding atau panggilan penelitian AI.
- Dua giliran side chat nyata berurutan selesai pada sesi yang sama menggunakan Luna Max: tentang batas korpus 48 artikel, kemudian keterbatasan sitasi sebagai ukuran mutu. Sesi dan respons disimpan pada `audit-side-chat.json`; workflow utama tetap selesai tanpa diubah.
- Navigasi alamat browser internal, kembali, dan maju diuji melalui kontrol antarmuka. Abstrak JATS tampil bersih setelah pembaruan terakhir.
- Indikator berjalan di composer: warna biru `rgb(49,95,157)`, spinner berdurasi 1 detik dengan iterasi tak terbatas. Status selesai tampil hijau, dihentikan oranye, dan gagal merah; arti status juga disampaikan dengan teks serta ikon.
- Simulasi dua kegagalan pembacaan status memperlihatkan pesan sambung ulang, kemudian pulih dan dapat menyelesaikan proses.

## Pemeriksaan otomatis

- UI: 238 tes lulus, 0 gagal.
- Style token lint: lulus.
- Build UI akhir lulus, meliputi lint i18n, kompilasi Paraglide, pembuatan rute, TypeScript, dan Vite. Bundle diregenerasi di `ui/dist`; Vite selesai dalam 1 menit 47 detik. Peringatan dependensi rute melingkar, CSS `::highlight`, dan ukuran chunk bersifat nonfatal dan tetap tercatat dalam log.
- Rust format: lulus.
- Rust Clippy seluruh target dengan `-D warnings`: lulus.
- Rust unit: 1.010 lulus, 0 gagal, 3 diabaikan oleh suite. Tes awal yang bergantung pada `sh` diperbaiki pada lingkungan pengujian dengan menambahkan Git `bin` ke PATH, tanpa perubahan kode LaTeX.
- Integrasi Rust CLI: 9 lulus (compute 4, invocation gate 1, logs 4); suite auto-restart tidak mempunyai tes aktif pada Windows.
- Komposisi release notes: 6 lulus.
- Dev-slot helper: 7 lulus, 2 gagal karena `sqlite3` tidak tersedia dan lifecycle lock hanya mendukung macOS/Linux. Ini tetap menjadi batas pemeriksaan lingkungan, sehingga seluruh CI lintas platform tidak diklaim hijau.

## Batas yang tetap berlaku

Keberhasilan ini berlaku pada alur serta skenario yang diuji. Penyedia AI dan database eksternal tetap dapat mengalami gangguan atau batas kuota. Ketika semua sumber, termasuk sumber cadangan, gagal, VERA harus menampilkan kegagalan yang dapat ditindaklanjuti dan tidak menghasilkan bukti buatan.

Browser internal memakai frame web. Penerbit dapat melarang penyematan melalui kebijakan browser mereka; tampilan metadata/abstrak dan tautan browser luar disediakan. Tampilan ini tidak mengklaim akses full text untuk semua artikel. Side chat merupakan percakapan pendamping sementara; pemulihan yang diverifikasi setelah pemuatan ulang adalah pekerjaan riset utamanya.

Korpus dua query dengan maksimal 25 hasil per query bukan tinjauan sistematis atau sensus publikasi. Jumlah sitasi bukan ukuran mutu, dan abstrak tidak cukup untuk menilai efektivitas atau kualitas metode secara menyeluruh.

Dokumentasi penyedia yang diperiksa: [autentikasi dan batas akses OpenAlex](https://help.openalex.org/api/authentication/), [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/), [filter Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/rest-api-filters/).

## Lokasi bukti

`target/vera-flow-audit-20261009/` menyimpan `audit-evidence.json`, `audit-model-sessions.json`, `audit-side-chat.json`, `bukti-pencarian.json`, `catatan-fokus-riset.md`, `peta-tren-riset.svg`, `hasil-dan-pratinjau-final.png`, `agent-berjalan.png`, `runtime.json`, serta log build/lint/tes. Rekaman percobaan gagal dan dibatalkan tetap ada di folder data audit agar hasil sukses tidak menghapus jejak kegagalan sebelumnya. Aset JavaScript terbaru yang dilayani backend localhost utama dibandingkan SHA-256 dengan hasil build dan cocok.
