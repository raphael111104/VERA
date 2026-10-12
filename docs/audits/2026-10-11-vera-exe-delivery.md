# Penerapan perubahan localhost ke VERA.exe — 11 Oktober 2026

Permintaan pengguna: membawa perubahan localhost yang sudah diaudit ke aplikasi Windows utama. Paket utama telah diperbarui di `dist/VERA.exe` setelah kandidat lulus pemeriksaan terpisah.

## Paket dan cadangan

- Aplikasi: `C:\Project 2026\VERA\dist\VERA.exe`.
- Cadangan: `C:\Project 2026\VERA\dist\backups\VERA-before-20261011-164030.exe`.
- ProductName: VERA; FileVersion: 0.2.17; ukuran: 58.393.506 byte.
- SHA-256 baru: `D695B2D0C90E094DF8C6BA89CD61F435F5BFC5231D20A195FDBCDDB9016F86F4`.
- SHA-256 cadangan: `80FFDB339B4ECDA9ACCA69A5C4D759EC9D0C9AF1C58D403668E70A94B95C0FEA`.

## Isi perubahan

Paket menyertakan onboarding model AI lebih dahulu, asesmen mandiri kemampuan penelitian dan penulisan, indikator proses beranimasi dengan warna status, pengelola folder riset, perapian sidebar, tab pratinjau file, browser umum, serta metadata/abstrak paper langsung dengan tombol sumber eksternal. Implementasi dan audit alur dijelaskan dalam `2026-10-11-vera-folders-and-paper-preview.md` dan audit sebelumnya.

## Verifikasi saat pengemasan

1. Lint token gaya, build UI (i18n, Paraglide, TypeScript, Vite), dan format launcher lulus. Peringatan dependensi melingkar, CSS `::highlight`, serta ukuran chunk bersifat nonfatal.
2. `windows/build-single-file.ps1` membangun backend dan launcher dengan toolchain GNU, target Windows GNU, serta output kandidat terpisah. Build backend rilis berhasil dalam 6 menit 19 detik; launcher 5,49 detik. Alias drive sementara sudah dilepas.
3. Kandidat dan EXE utama terpasang masing-masing diluncurkan melalui profil data/config/cache/LocalAppData terpisah pada port 4793. Jendela native bertajuk `VERA — Veritas Evidence & Research Agent` muncul, loader WebView2 tersedia, dan `/api/health` mengembalikan `ok: true`, versi 0.2.17.
4. Backend yang diekstrak dari kedua EXE cocok secara SHA-256 dengan backend hasil build rilis. Seluruh 271 aset (11.461.710 byte) yang disajikan oleh masing-masing paket cocok secara SHA-256 dengan `ui/dist`. Pengujian tidak menggunakan origin Vite.
5. UI dari kandidat kosong menampilkan langkah pertama pemilihan model AI. Memilih GPT-6 Luna dan Max lalu melanjutkan berhasil menampilkan diagnosis awal delapan pertanyaan.
6. Pengujian EXE terpasang menggunakan salinan SQLite dan pekerjaan dari lingkungan audit, bukan data desktop pengguna. Pengelola folder tampil; memilih Audit A memulihkan hasil lengkap 49 artikel. Model terlihat `GPT-6-Luna Max`. Reload, masuk kembali ke workspace, dan pemulihan folder aktif/hasil berhasil.
7. Klik grafik membuka tab SVG tersendiri. Klik paper membuka tab metadata dan abstrak tanpa iframe, dengan tombol sumber beratribut `target="_blank"`, `rel="noopener noreferrer"`. Tab output dan file tetap tersedia.
8. Tombol tahapan, mulai riset baru, dan beranda memiliki tinggi 40 px dan border 0 px. Tidak ada console error yang tercatat saat pemeriksaan workspace paket.
9. Hash EXE terpasang cocok dengan kandidat dan hash cadangan cocok dengan EXE lama. Hash database desktop pengguna sebelum/sesudah sama. Setelan model desktop yang dibaca sebelum pengujian sudah `gpt-6-luna` dan `max`; tidak ditimpa.
10. Manifest sumber tetap cocok setelah pengemasan. Proses native dan tab sementara untuk smoke test sudah ditutup.

## Bukti dan cakupan

Log build: `target/vera-package-20261011-build.log`. Bukti JSON, manifest sumber, verifikasi aset kandidat/terpasang, serta screenshot onboarding, folder manager, dan workspace ada di `target/vera-package-audit-20261011/`.

Suite otomatis sebelumnya pada sumber yang sama sudah lulus: UI 240 tes; Rust 1.012 unit dan 9 integrasi; GNU Clippy. Suite tersebut tidak diulang pada tahap pengemasan. Tahap ini memverifikasi startup native serta interaksi browser dengan aset yang disajikan server EXE. Panggilan AI baru tidak diulang; output 49 artikel dipulihkan dari audit GPT-6 Luna Max sebelumnya. Tidak ada klaim pengujian seluruh CI lintas sistem operasi atau seluruh interaksi WebView native.
