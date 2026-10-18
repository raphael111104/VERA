# Perapian susunan UI workflow

14 Oktober 2026. Lingkup: web localhost `/research`, sesuai permintaan perapian UI setelah implementasi P1–P8. Perubahan berada di dashboard React dan bundle `ui/dist`.

## Susunan yang diterapkan

- Navigasi dikelompokkan menjadi Siapkan kajian, Kumpulkan bukti, Tulis dan periksa, serta Pendamping. Tahap aktif memakai teks dan latar yang konsisten; konfirmasi arah/rencana tetap berasal dari status proyek.
- Wawancara arah memakai enam langkah dalam grid teratur, judul langkah aktif, serta tombol kembali/lanjut dalam satu area form.
- Rencana kajian dibagi menjadi empat bagian yang dapat dibuka: tujuan, aturan sumber, pencarian, dan proses pemilihan/pencatatan/rangkuman. Registrasi dan format tugas berada pada bagian tambahan. Penjelasan versi acuan dan dampak perubahan tetap tersedia.
- Pencarian menempatkan tujuan dan database dalam dua kolom yang sejajar pada desktop, satu kolom pada layar kecil. Detail akses database dapat dibuka saat diperlukan.
- Seleksi menampilkan empat angka utama terlebih dahulu. Seluruh 12 angka ledger tersedia pada Rincian alur dan jumlah seleksi. Sumber aktif pada antrean mempunyai penanda visual.
- Catatan sumber memperjelas urutan persiapan form, uji sampel, dan pengisian/verifikasi. Peta temuan memakai bahasa umum dan tidak menampilkan peringatan tentang sintesis lama ketika belum ada sintesis.
- Editor artikel memakai grid bagian artikel dan area editor yang jelas. Status bagian, penyimpanan, klaim, dan pratinjau tetap tersedia.
- Pemeriksaan dan Ekspor dibagi menjadi Ekspor dokumen, Pemeriksaan laporan, dan Referensi. Pengaturan keluaran serta tindakan ekspor berada dalam satu kartu; paket tersimpan tersedia pada tampilan ekspor. Form pada tiga tampilan tetap terpasang ketika disembunyikan, sehingga perpindahan tampilan tidak menghapus isian sementara.
- Form referensi mengelompokkan metadata pendek dalam dua kolom pada desktop. Bahasa kegiatan belajar memakai penilaian awal/akhir, bukti, dan latihan mandiri; identitas data internal tetap dipertahankan.
- Panel kanan memiliki header ringkas dan empat pilihan yang konsisten. Ikon akses tetap tersedia ketika ditutup. Pada pembukaan awal di layar di bawah 1024 piksel, panel tertutup agar area utama dapat dipakai; pengguna dapat membukanya kembali.
- Field, petunjuk, pemberitahuan, disclosure, tombol pilihan tampilan, serta dropdown memakai komponen dan token tema yang sama. Dropdown tetap memakai Base UI, termasuk interaksi keyboard, dan daftar dibatasi terhadap lebar viewport.

## Pemeriksaan langsung

Pemeriksaan browser dilakukan pada proyek berlabel pengujian **Uji localhost — Alur kajian**, bukan kajian akademik produksi. Navigasi menambah revisi aktivitas sesuai perilaku aplikasi. Isi akademik, metadata sumber, keputusan seleksi, dan keluaran tidak diubah pada sesi perapian ini.

- Tampilan desktop 1440×900, tablet 900×700, dan ponsel 390×844 diperiksa. Override viewport dikembalikan setelah pemeriksaan.
- Dropdown database dibuka dengan Enter, fokus berpindah dengan ArrowDown, lalu Escape menutup daftar dengan OpenAlex tetap terpilih.
- Bagian rencana dapat dibuka dan isi yang sudah tersimpan terlihat.
- Catatan pemeriksaan sementara diisi, tampilan dipindahkan ke Referensi dan kembali, lalu teks yang sama dikonfirmasi tetap ada. Teks uji dibersihkan tanpa mengirim pemeriksaan ke server.
- Halaman Sumber, Pemilihan Sumber, Catatan Sumber, Peta Temuan, Draft Artikel, Belajar, serta tiga tampilan akhir diperiksa.
- Tombol Pratinjau di kanan membuka panel. Berkas `draft-kajian.md` membuka konten baca; percakapan VERA dan pengaturan model tetap terlihat. Tidak ada permintaan model baru pada sesi ini.

## Pemeriksaan source dan bundle

- `pnpm test`: 252 lulus, 0 gagal.
- `pnpm lint:styles`: lulus setelah seluruh perubahan.
- `pnpm build`: lulus termasuk pemeriksaan i18n, generator, TypeScript, dan build produksi. Setelah penyempurnaan teks terakhir, `pnpm exec tsc --noEmit` dan `pnpm exec vite build` juga lulus.
- `git diff --check`: lulus; Git masih memberi informasi normalisasi CRLF untuk dua berkas lama yang sudah berubah sebelum sesi ini.
- Health backend localhost mengembalikan `ok: true`, versi `0.2.17`.
- Bundle akhir `index-C5Wl7LRv.js` yang disajikan backend 4901 identik dengan `ui/dist`, SHA-256 `D88B7A702730281131C35BD27496EFB15F0C04CC2E316BB05D9DC7F24AF51E4D`.
- Peringatan nonfatal yang telah ada tentang `::highlight`, dependensi generator rute, dan ukuran chunk masih muncul pada build.
- Bukti visual disimpan di `target/workflow-ui-polish-plan.png` dan `target/workflow-ui-polish-export.png`. Browser dikembalikan ke proyek pengujian utama pada Pemeriksaan dan Ekspor, panel pratinjau terbuka.

## Batas pemeriksaan

Ini merupakan pemeriksaan susunan UI dan interaksi representatif, bukan studi usability dengan peserta awam. Pencarian provider, proses review akademik, generasi model, serta rendering paket ekspor tidak dijalankan ulang pada sesi ini. Hasil pemeriksaan fungsional sebelumnya tetap dicatat di `completion-and-testing.md`.

Tidak ada perubahan Rust, skema database, migrasi data, atau penggantian EXE utama pada sesi ini.
