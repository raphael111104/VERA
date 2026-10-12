# Audit folder riset dan pratinjau paper VERA

Tanggal: 11 Oktober 2026. Cakupan: localhost utama 5201/4901 dan lingkungan audit terpisah 5301/5101. Paket distribusi `dist/VERA.exe` tidak diubah.

## Perubahan

- Tombol tahap riset, Mulai riset baru, dan Kembali ke beranda menggunakan tinggi 40 px. Pusat ikon sejajar dalam sidebar terbuka dan tertutup. Border permanen dan pembungkus ganda pada tombol beranda dihilangkan; fokus keyboard tetap tersedia.
- Klik artikel membuka tab berisi judul, database, identitas artikel, tanggal publikasi, jumlah sitasi, dan abstrak yang tersedia. Tombol sumber eksternal terletak di atas metadata, menggunakan `target="_blank"` dan `rel="noopener noreferrer"`, serta melewati penangkap tautan internal. Paper tidak memuat iframe. Browser umum untuk alamat manual tetap tersedia.
- Header menyediakan pengelola folder dengan fungsi membuat, memilih, dan mengubah nama. Nama aktif juga tampil di sidebar dan judul halaman.
- Setiap folder menyimpan draf bidang/fokus/konteks/alasan, referensi pekerjaan AI, serta pilihan modelnya di tabel SQLite `research_folders`. Ini merupakan folder workspace di dalam VERA. Referensi pekerjaan lama dari browser dimigrasikan, termasuk bila browser lain masih mempunyai referensi berbeda.
- Mulai riset baru dan Coba fokus lain membuka pembuatan folder baru sehingga pekerjaan sebelumnya tetap dapat dibuka.
- Penyimpanan per folder diserialkan dan menggabungkan perubahan terbaru. Nomor revisi di server mencegah penimpaan oleh jendela lain. Kegagalan simpan terlihat dan dapat dicoba kembali.

## Validasi otomatis

- UI: 240 tes lulus, 0 gagal; mencakup antrean simpan, perubahan cepat, pemisahan folder, dan percobaan ulang setelah kegagalan.
- `pnpm build`: lulus, termasuk lint i18n, Paraglide, TypeScript, dan Vite; `ui/dist` diregenerasi. Peringatan dependensi rute melingkar dan ukuran chunk tetap nonfatal.
- Lint token gaya: lulus.
- Format Rust dan launcher: lulus.
- GNU Clippy seluruh target, `--locked -- -D warnings`: lulus.
- Rust: 1.012 tes unit lulus, 0 gagal, 3 diabaikan oleh suite; 9 tes integrasi lulus (compute 4, invocation gate 1, logs 4).
- Build backend GNU `--locked --bin orx`: lulus. Backend localhost utama dan audit menggunakan salinan hasil build. Profil debug membaca aset `ui/dist` dari disk.

`scripts/dev-slot.mjs status` tidak dapat berjalan karena checkout tidak mempunyai metadata Git. Lingkungan audit memakai data/config/cache dan port terpisah. Konfigurasi yang disalin memerlukan pembuatan ulang hard link lifecycle lock di direktori audit; pemeriksaan lock tetap aktif. Tidak ada perubahan pada companion service atau paket distribusi.

## Pengujian browser dan proses AI nyata

1. Membuat Audit A dan Audit B melalui antarmuka, mengisi draf berbeda, mengubah nama B, kemudian berpindah folder: isi tidak bercampur.
2. Memuat ulang halaman: folder aktif, nama, dan draf pulih dari server.
3. Membuka hasil penelitian lama: output dan artikel masih tersedia.
4. Membuka paper pada localhost utama yang sama dengan komentar pengguna: metadata dan abstrak langsung tampil; tidak ada iframe atau pilihan Halaman web/Metadata untuk paper.
5. Klik tombol sumber pada lingkungan audit membuka tab browser di luar panel VERA dan mengikuti DOI ke penerbit. Tidak ada login atau pengambilan full text yang dilakukan.
6. Pengukuran localhost utama: semua tombol sidebar setinggi 40 px, border 0 px. Pusat ikon pada sidebar terbuka berada pada x=30 px; pusat seluruh ikon sidebar tertutup berada pada x=31,600000381 px. Perbedaan koordinat antarmode berasal dari lebar rail; setiap mode konsisten antar-tombol.
7. Menjalankan riset baru sampai selesai pada folder A dengan `gpt-6-luna`, reasoning `max`. Fokus: umpan balik AI untuk menghubungkan klaim dan bukti ketika mahasiswa merevisi esai. Fokus, pertanyaan lanjutan, pencarian, penalaran, sintesis, dan pemeriksaan bukti berhasil.
8. Pekerjaan fokus: `b8ff3eb5-e4bf-46e4-bd1e-5af68ce156af`. Pekerjaan tren: `ae3dc1b1-b312-4316-8360-b48a847ff76a`. OpenAlex mengembalikan 50 rekaman; korpus akhir berisi 49 artikel unik, lima klaim, dan lima tahap agent selesai. Jumlah grafik 2+4+9+10+24=49. Seluruh identitas rujukan klaim cocok dengan korpus.
9. Pemeriksaan SQLite menemukan lima sesi model unik terkait fokus dan agent. Kelimanya menggunakan `gpt-6-luna` dan `max`; verifikasi menolak hasil kosong.
10. Saat berjalan, status bawah berwarna biru dengan animasi `vera-agent-spin`, iterasi `infinite`. Saat selesai, status berubah hijau dengan ikon selesai.
11. Server audit dimulai ulang menggunakan backend final, lalu halaman dimuat ulang: hasil A tetap tersedia. Folder B tetap menyimpan `Bahasa — draf khusus B` dan `Revisi artikel — folder B`.
12. Tidak ada console error yang tercatat pada tab localhost utama saat verifikasi akhir.

## Bukti dan batas cakupan

`target/vera-folders-audit-20261011/` menyimpan `live-job.json`, `live-model-sessions.json`, `live-validation.json`, `verify_live.py`, snapshot folder sebelum/sesudah restart, pengukuran sidebar, screenshot pengelola folder, screenshot metadata localhost utama, serta screenshot proses berjalan dan selesai. Log build/tes berada di `target/vera-folders-*.log`.

Riset audit tidak ditambahkan ke daftar folder pengguna pada localhost utama. Riset lama pengguna tetap tersedia. SHA-256 distribusi sebelum dan sesudah: `80FFDB339B4ECDA9ACCA69A5C4D759EC9D0C9AF1C58D403668E70A94B95C0FEA`.

Keberhasilan berlaku pada skenario yang diuji. Audit ini tidak mengklaim menjalankan seluruh CI lintas sistem operasi. Tab pratinjau dan percakapan pendamping tetap bersifat sementara; folder memulihkan pekerjaan riset utama. Metadata/abstrak bukan full text atau penilaian mutu artikel. Penyedia AI dan sumber akademik tetap merupakan layanan eksternal dengan kondisi akses yang dapat berubah.
