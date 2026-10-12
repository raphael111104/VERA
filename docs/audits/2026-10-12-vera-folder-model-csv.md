# VERA: model per folder dan bukti pencarian CSV

Tanggal: 12 Oktober 2026. Target: localhost UI 5201, backend 4901, dan `ui/dist`.

## Perilaku

- Model AI dan tingkat usaha dapat diganti pada folder yang sudah memiliki hasil. Pilihan dikunci selama proses utama atau Side chat berjalan dan berlaku untuk permintaan berikutnya.
- Pilihan tersimpan pada folder. Pemulihan mendahulukan pilihan folder daripada model job historis; folder lama tanpa pilihan memakai model job sebagai fallback. Hasil lama mempertahankan identitas model pembuatnya.
- Backend tidak lagi mewajibkan model tahap tren sama dengan tahap fokus. Validasi fokus, status tahap sebelumnya, ketersediaan harness/model, dan pembuatan koordinator baru tetap berlaku.
- `bukti-pencarian.csv` menggantikan pratinjau/unduhan JSON. Pratinjau berbentuk tabel artikel, tanggal, sitasi, identitas sumber, serta disclosure abstrak/klaim. Catatan pencarian sumber ditampilkan terpisah di bawah tabel.
- CSV terdiri atas rekaman `artikel` dan `pencarian`; rekaman pencarian tetap mencakup sumber tanpa hasil dan error. Ada 26 kolom, termasuk konteks riset, metadata/abstrak, tautan, klaim terkait, query, timestamp UTC, rentang pencarian, batas bukti, model, dan tingkat usaha. Gunakan `jenis_rekaman=artikel` untuk menyaring korpus artikel.
- Unduhan memakai UTF-8 BOM, quoted fields dan CRLF; tanda kutip, koma, Unicode, serta baris baru dipertahankan. Metadata yang dapat dibaca sebagai formula spreadsheet diberi awalan apostrof saat ekspor. Pratinjau mempertahankan teks aslinya. JSON job internal tetap tersedia di penyimpanan backend.
- Membuka folder yang telah tersimpan tidak lagi menulis ulang data yang sama. Pemulihan migrasi/job yang belum tersimpan masih menulis bila diperlukan. Banner konflik revision menyediakan tindakan muat ulang eksplisit; konflik tidak diatasi dengan menimpa data jendela lain.

## Verifikasi

1. UI unit tests: **250 passed, 0 failed**, termasuk pemulihan pilihan folder, isolasi pilihan, fallback legacy, CSV karakter khusus, null vs nol, sumber error/tanpa hasil, dan netralisasi formula.
2. Rust research tests: **7 passed, 0 failed** (1009 tes lain difilter). Tes baru memeriksa koordinator tren memakai model/effort baru, memiliki sesi native baru, dan tidak mengubah provenance sesi fokus.
3. `cargo fmt --all --check`, GNU `cargo clippy --locked --bin orx -- -D warnings`, dan GNU `cargo build --locked --bin orx`: berhasil. Ini bukan klaim seluruh matriks CI lintas platform telah dijalankan.
4. Style token lint, localization checks, TypeScript, dan Vite production build: berhasil. Bundle utama akhir `index-D1FXru8B.js`. Peringatan nonfatal yang sudah ada terkait CSS `::highlight`, circular export route generator, dan chunk size tetap muncul.
5. Fixture browser dengan fetch/storage terisolasi: model terkunci saat running, terbuka setelah complete, perubahan bertahan setelah reload, dan folder B dengan model berbeda tidak menimpa folder A. Payload proses utama dan Side chat memuat `alternate-model`. Fixture tidak memanggil agent/provider live.
6. Folder pengguna di backend localhost: model diganti melalui UI menjadi `gpt-6-sol/max`, terkonfirmasi pada API revision 11, lalu dikembalikan ke **`gpt-6-luna/max`** pada revision 12. Reload mempertahankan pilihan tersebut, job ID yang sama, dan revision 12. Folder lain tetap revision 1. Tidak ada generasi riset baru dalam pemeriksaan ini.
7. Unduhan nyata melalui tombol aplikasi diparse dengan Python `csv.DictReader`: **50 rekaman artikel + 1 rekaman pencarian**, 26 kolom, UTF-8 BOM. ID, judul, abstrak, sumber, serta model sesuai job asli `c2d612d5-4eeb-467a-a167-cb86466f905b`. Sitasi nol dibedakan dari metadata sitasi yang tidak tersedia pada unit test.
8. Sesi browser akhir: model **GPT-6-Luna Max**, picker enabled, 50 baris artikel, tab File terpisah, 3 kolom tabel terlihat, **0 alert dan 0 captured console error**. Konflik revision yang teramati pada sesi lama selama HMR tidak muncul pada sesi baru; revision stabil setelah membuka ulang. Tombol pemulihan konflik baru tidak diuji dengan konflik buatan.
9. Backend localhost diperbarui dengan binary hasil build; hash binary terpasang sama dengan hasil build, health `ok=true`. Binary sebelumnya dicadangkan pada `target/vera-ui-dev/bin/orx-before-model-csv-20261012.exe`.

Log dan bukti berada di `target/vera-model-csv-audit-20261012/`, serta log berawalan `target/vera-model-csv-`.

## Batas pengiriman

Perubahan ini aktif pada localhost dan tersedia pada `ui/dist`. `dist/VERA.exe` belum dikemas ulang untuk perubahan ini; SHA-256 tetap `D695B2D0C90E094DF8C6BA89CD61F435F5BFC5231D20A195FDBCDDB9016F86F4`. Pemeriksaan pergantian model tidak menjalankan generasi AI live baru; pengiriman pilihan diverifikasi melalui fixture, penyimpanan server nyata, source backend, dan tes Rust terarah.
