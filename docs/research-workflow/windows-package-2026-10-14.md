# Paket Windows VERA — 14 Oktober 2026

Perubahan workspace localhost telah dibangun ke server Rust dan launcher native
VERA versi 0.2.17 untuk Windows x64. Paket untuk pengguna baru adalah
`dist/VERA-Setup.exe`. EXE utama di `dist/VERA.exe` juga telah diperbarui setelah
kandidat lulus pengujian.

## Berkas distribusi

| Berkas | Ukuran | SHA-256 |
| --- | ---: | --- |
| `VERA-Setup.exe` | 364,516,776 byte | `932729eeaa36ba119fec2d216d8d0c15b43869d177005d924dcfe8bde8fddc14` |
| `VERA.exe` | 60,481,783 byte | `0beec7381e8504eee6b41c6165dcd2ac3d0ce02b8976d8d9e6204b3b93432ba8` |

Manifest rinci tersedia di `dist/package-manifest.json`, checksum di
`dist/SHA256SUMS.txt`, dan petunjuk pengguna di `dist/MULAI-DI-SINI.txt`.
EXE terdahulu dicadangkan di
`dist/backups/before-windows-installer-20261014-221443/VERA.exe`.
Hash tujuan telah dibandingkan dengan kandidat dan cocok.

## Isi dan perilaku installer

- Server dan dashboard dibundel dalam launcher VERA. Loader DLL WebView2 ikut
  dibundel; jalur paket dua EXE juga memasang DLL di samping server.
- PortableGit/Bash 2.56.0.2 dan OpenCode native 1.19.0 baseline disertakan di
  `runtime/`. SHA-256 arsip cocok dengan digest rilis resmi GitHub.
- Installer WebView2 Evergreen x64 lengkap disertakan untuk komputer yang belum
  mempunyai runtime. Tanda tangan Authenticode Microsoft telah diverifikasi.
- Installer tidak mengunduh dependensi. Git dan agen dipakai melalui PATH milik
  proses VERA, tanpa mengubah PATH Windows.
- Pengguna tidak perlu memasang Node.js, Python, Rust, Git, WSL atau Word untuk
  workspace kajian serta keluaran DOCX/CSV. Pencarian, jurnal, dan layanan AI
  memerlukan internet; layanan tertentu memerlukan kredensial pengguna sendiri.
- Instalasi baru memakai nama folder VERA. AppId dan lokasi data kompatibilitas
  lama tetap dipertahankan; instalasi lama dapat memakai folder sebelumnya.
- Staging hanya berisi binary, runtime, lisensi, manifest dan petunjuk. Database
  kajian, proyek uji, konfigurasi pengguna dan kunci API tidak dibundel.

## Hasil verifikasi

Pengujian dilakukan pada Windows 11 Pro build 26300.

| Pemeriksaan | Hasil |
| --- | --- |
| Build rilis GNU server dan launcher dengan `--locked` | Lulus |
| Rust formatting untuk root dan launcher | Lulus |
| Unit test launcher: penemuan alat bawaan tanpa PATH global | 1 lulus |
| `pnpm lint:styles` | Lulus |
| `pnpm test` | 260 lulus, 0 gagal |
| Build UI | Menggunakan `ui/dist` dari build sukses pada sesi yang sama; sumber UI tidak berubah selama packaging |
| HTTP acceptance P1–P8 terhadap server rilis | Lulus: revisi/retry/restart, protokol, impor, seleksi, bukti, ekspor, audit, pembelajaran dan kontrol akses |
| Installer kandidat | Kompilasi sukses |
| Instalasi senyap di `target/installer-test/VERA` | Exit 0; tidak membutuhkan restart |
| Integritas berkas hasil pemasangan | 9.617 berkas cocok dengan manifest |
| Startup aplikasi hasil pemasangan | Health OK; jendela native VERA terdeteksi |
| Kecocokan aset UI dari aplikasi terpasang | 273 dari 273 cocok dengan `ui/dist` melalui SHA-256 |
| Git, OpenCode, Bash dan coreutils dengan PATH Windows terbatas | Dapat dijalankan |
| Penghapusan instalasi uji | Exit 0; registrasi instalasi uji dan berkasnya dihapus |

Walkthrough browser dilakukan terhadap UI yang dilayani binary kandidat pada
port 4793: landing → ruang kajian kosong → membuat kajian pendidikan/teknologi
→ menyimpan isian → sidebar ikon → Berkas → pratinjau Word → tabel CSV riwayat.
Ini pengujian interaksi pada server paket, bukan kontrol langsung isi jendela
WebView2 native. Startup jendela native diperiksa secara terpisah.

Bukti utama: `target/package-release.log`, `target/launcher-tests.log`,
`target/package-ui-tests.log`, `target/package-workflow-tests.log`,
`target/installer-build.log`, `target/installer-test.log`,
`target/package-smoke-installed.log`, dan `target/installer-uninstall.log`.
Laporan startup terstruktur:
`target/package-smoke-20261014-221223/report.json`.

## Batas pengujian dan distribusi

- Komputer uji sudah mempunyai WebView2. Jalur memasang runtime pada Windows
  yang benar-benar kosong belum diuji di VM; payload offline resmi bertanda
  tangan Microsoft, deteksi runtime dan penanganan kegagalan sudah disertakan.
- Tidak ada generasi AI berbayar atau pencarian akademik live baru pada pengujian
  paket ini. HTTP acceptance memakai fixture fiktif. Profil data VERA terisolasi;
  alat lain yang sudah terpasang dapat tetap ditemukan lewat PATH registry Windows.
- Smoke mencatat peringatan debug dari libcurl dalam rilis PortableGit resmi.
  Pemeriksaan Git/Bash/curl berhasil; binary VERA sendiri dibangun dengan profil
  release. Diagnostik upstream ini dipertahankan dalam log.
- Installer dan EXE VERA belum ditandatangani dengan sertifikat penerbit.
  Windows/SmartScreen dapat menampilkan peringatan penerbit tidak dikenal.
- EXE tunggal tidak membawa folder runtime dan installer WebView2. Distribusikan
  `VERA-Setup.exe` untuk pengguna baru. Alat untuk eksperimen khusus tetap
  merupakan kebutuhan masing-masing eksperimen.

Skrip build dan validasi yang dipertahankan di repository:
`windows/build-single-file.ps1`, `windows/build-installer.ps1`,
`windows/test-package.ps1`, dan `windows/VERA.iss`.
