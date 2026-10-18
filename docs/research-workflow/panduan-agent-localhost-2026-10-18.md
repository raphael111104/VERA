# Panduan Agent VERA — implementasi localhost, 18 Oktober 2026

Acuan: `docs/research-workflow/specification/15_Rancangan_Panduan_Agent_Sederhana.md`.

## Hasil analisis dan cakupan

Rancangan menetapkan panduan kontekstual sebagai MVP dan menyarankan peningkatan
automasi, penalaran berbukti, serta evaluasi dengan pengguna secara bertahap.
Workspace sudah memiliki usulan berversi, penilaian awal, pembatasan latihan
transfer, persetujuan manual, pemeriksaan dependensi, pratinjau keluaran, dan
riwayat revisi. Masalah utama untuk MVP ialah akses bantuan tersembunyi di
Sidechat, tidak adanya satu rekomendasi kontekstual, dan keharusan berpindah
halaman untuk mencatat penilaian awal.

Implementasi ini menyelesaikan lapisan panduan kontekstual dan menghubungkannya
ke kemampuan yang sudah tersedia. Tidak menambahkan klaim automasi penuh,
ekstraksi PDF otomatis, keputusan reviewer otomatis, atau skor kompetensi.
Evaluasi empiris dengan peserta belum dilakukan dan tidak disimulasikan sebagai
hasil penelitian.

## Perubahan

- Tab **Panduan** menjadi tampilan awal panel kanan, mendampingi Pratinjau,
  Berkas, Browser, dan Sidechat. Ikon Panduan tetap dapat dibuka saat panel ditutup.
- Kartu memuat tahap P1–P8, tujuan, satu langkah berikutnya, bantuan yang tersedia,
  dan batas keputusan peneliti. Riwayat juga mempunyai panduan tersendiri.
- Rekomendasi mempertimbangkan konfirmasi arah, protokol terkunci/perlu ditinjau,
  run parsial, asal record formal/eksplorasi, duplikasi, seleksi usang, bukti
  terkonfirmasi, sintesis usang, dan masalah audit. Rekomendasi tidak mengubah data.
- **Jelaskan** menyediakan penjelasan lokal. **Bimbing saya** membuka pertanyaan
  dan petunjuk satu per satu, tanpa model atau skor kemampuan. **Siapkan usulan**
  membuka alur usulan yang sudah ada; tindakan tersebut belum menerapkan isinya.
- Untuk arah, seleksi, interpretasi dan draft, penilaian awal, alasan, serta bukti
  dapat dicatat langsung pada panel. Pemeriksaan mengikuti identitas aktor,
  tahap, dan hash dependensi bukti yang sama dengan backend.
- Usulan fokus lokal mensyaratkan konsep dan konteks yang benar-benar diisi.
  VERA tetap menyediakan penjelasan/petunjuk saat informasi belum cukup.
- Tahap usulan mengikuti tahap aktif. Pilihan tahap, sumber/model AI, bagian
  draft dan tingkat bantuan tetap berada dalam pengaturan lanjutan.
- Perbandingan isi, sumber, kutipan dan locator untuk sel bukti yang dirujuk
  tersedia sebelum persetujuan. Alasan menerima/menolak tetap wajib. Usulan usang
  tidak dapat diterapkan. Pengubahan isi dilakukan pada form utama, lalu usulan
  baru dibuat dari konteks terbaru.
- Tombol bantuan dibatasi selama latihan transfer aktif. Pemilik dan reviewer
  tetap mempunyai batas akses yang berbeda; reviewer diarahkan ke seleksi mandiri.
- Sidechat memakai model yang sama dengan pengaturan panel dan menyediakan jalan
  kembali ke Panduan. Tidak ada permintaan model AI yang dikirim otomatis.

Panduan lokal menyediakan petunjuk dan template dari isian tersimpan. Panduan
tersebut tidak diklaim membaca PDF, melakukan pencarian live, atau memverifikasi
bukti. Pemilihan model AI dan pengiriman konteks tetap merupakan tindakan eksplisit.

## Validasi

- `pnpm test`: **268 lulus, 0 gagal**, termasuk delapan pengujian baru untuk
  cakupan tahap, konfirmasi rencana, run parsial, pemisahan eksplorasi/formal,
  kecukupan konteks, data kosong, penilaian awal per aktor/dependensi, dan transfer.
- `pnpm lint:styles`: lulus.
- `pnpm build`: lulus; typecheck dan generator route berjalan melalui skrip build.
- `git diff --check`: lulus. Peringatan CRLF pada berkas lama tidak merupakan
  kesalahan whitespace.
- Backend dibangun dari source melalui mode backend launcher
  `Jalankan-VERA-Localhost.cmd`, memakai slot development yang sudah ada.
- Pengujian browser pada proyek **Uji Panduan VERA — AI untuk pembelajaran**:
  membuat proyek, membuka bimbingan, menyimpan penilaian awal di tahap yang sama,
  meminta usulan fokus lokal, membandingkan isi sebelum diterapkan, menerima
  dengan alasan, berganti tahap, dan melihat usulan P2 menjadi usang setelah
  rencana diubah. Rekomendasi P6 dengan data kosong berhasil membuka Catatan
  Sumber. Panduan tetap dapat dibuka dari ikon saat panel kanan ditutup.

Proyek uji localhost:
`http://127.0.0.1:5201/research/42dfa22c-ff04-4119-a52e-0dc122e5e3bf`.
Tidak ada pencarian akademik live atau generasi model berbayar dalam walkthrough.
Belum ada uji kegunaan dengan peserta maupun evaluasi kemampuan mandiri.

Log: `target/guide-build.log`, `target/guide-tests.log`,
`target/guide-styles.log`, `target/guide-backend-stderr.log`.

## Batas distribusi

Perubahan berada pada source UI dan `ui/dist` sesuai aturan repository.
**EXE dan installer tidak dibangun ulang atau diganti** pada pekerjaan ini.
Hash `dist/VERA.exe` tetap
`0beec7381e8504eee6b41c6165dcd2ac3d0ce02b8976d8d9e6204b3b93432ba8`;
hash `dist/VERA-Setup.exe` tetap
`932729eeaa36ba119fec2d216d8d0c15b43869d177005d924dcfe8bde8fddc14`.
