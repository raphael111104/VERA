# Header dan tab panel terpisah — 12 Oktober 2026

Perubahan diterapkan pada localhost VERA, dengan `ui/dist` diregenerasi. Paket `dist/VERA.exe` tidak dibangun ulang pada pekerjaan ini.

## Perubahan

- Menghapus konteks Tahapan riset/Tinjauan tren beserta ikon dokumennya dari header workspace. Navigasi tahapan tetap tersedia di sidebar.
- Pemilih folder menjadi satu kontrol setinggi 48 px, dengan ikon folder, label dan nama rata kiri, serta panah pembuka di kanan. Nama panjang dipotong secara visual dan tetap tersedia sebagai judul. Pengelola folder tetap dapat dibuka.
- Tab dibagi menjadi empat bagian. File berisi daftar file, catatan Markdown, dan bukti JSON. Output berisi ringkasan hasil dan grafik SVG. Side chat berisi percakapan pendamping. Browser berisi metadata paper dan alamat sumber umum.
- Tombol toolbar dan judul panel mengikuti bagian aktif. Masing-masing bagian mengingat tab terakhir yang dipilih selama workspace tetap terbuka. Berpindah bagian mempertahankan tab lain dan draf Side chat.
- Penutupan tab memilih tetangga dalam bagian yang sama. Menutup tab terakhir menyembunyikan panel; tab bagian lain tetap tersedia. Navigasi keyboard menggunakan daftar tab pada bagian aktif saja.
- Browser menyediakan tombol Buka alamat browser untuk kembali ke tab alamat umum setelah membuka paper.

## Pemeriksaan

- Lint token gaya lulus.
- Build UI lulus, termasuk lint i18n, Paraglide, TypeScript, dan Vite. Peringatan CSS `::highlight` dan ukuran chunk tetap nonfatal.
- 243 tes UI lulus, 0 gagal. Tiga tes tambahan memeriksa pengelompokan tab, penutupan tab aktif dalam kelompoknya, serta pemeliharaan tab kelompok lain.
- Browser localhost: File menampilkan tiga tab dokumen tanpa grafik atau paper; Output menampilkan ringkasan dan SVG tanpa tab dokumen; Browser menampilkan paper dan alamat tanpa tab File/Output; Side chat menampilkan tab percakapan sendiri.
- Kembali ke Output memulihkan tab SVG yang sebelumnya dipilih. Kembali ke File memulihkan bukti JSON. Kembali ke Browser memulihkan tab alamat.
- Draf Side chat tetap ada setelah berpindah ke File dan kembali. Draf uji tidak dikirim dan telah dikosongkan kembali.
- Home/End pada File dan ArrowLeft pada Browser berpindah hanya di kelompok aktif. Menutup bukti JSON memilih catatan Markdown. Menutup paper memilih tab alamat; menutup tab Browser terakhir menyembunyikan panel. Output tetap memulihkan SVG sesudahnya.
- Pengelola folder terbuka dan menampilkan dua folder pengguna yang sudah ada. Tidak ada folder baru dibuat dalam pemeriksaan ini.
- Pengukuran header: kedua baris pemilih folder memiliki koordinat kiri identik (1064,875 px pada viewport pengujian); tinggi kontrol 48 px; tidak ada overflow header; konteks tahapan header sudah tidak ada.
- Model yang terlihat tetap GPT-6 Luna Max. Tidak ada panggilan AI baru dilakukan.
- Console pada tab pemeriksaan akhir tidak mencatat error.

`scripts/dev-slot.mjs status` tidak dapat membaca worktree karena checkout tidak memiliki metadata Git. Pemeriksaan memakai layanan localhost yang sudah berjalan pada port 5201/4901; tidak membuat instance atau data produksi baru. Tidak ada perubahan Rust, sehingga suite Rust tidak diulang.

Bukti browser dan screenshot berada pada `target/vera-grouped-tabs-audit-20261012/`. Log build dan tes: `target/vera-grouped-tabs-build-20261012.log` serta `target/vera-grouped-tabs-tests-20261012.log`.

SHA-256 EXE sebelum/sesudah tetap `D695B2D0C90E094DF8C6BA89CD61F435F5BFC5231D20A195FDBCDDB9016F86F4`. Tab pratinjau tetap bersifat sementara per workspace; perubahan ini tidak menambahkan pemulihan tab setelah reload atau perpindahan folder.
