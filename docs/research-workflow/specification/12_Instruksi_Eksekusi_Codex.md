# 12. Arahan Eksekusi untuk Codex

## Prompt utama siap digunakan

> Revisi repository VERA https://github.com/raphael111104/VERA.git menggunakan paket VERA_Workflow_Codex_Pack sebagai spesifikasi. Tujuan pengguna adalah workflow mahasiswa di dalam aplikasi, dari menemukan bidang, topik dan fokus sampai menyusun draft artikel Scoping Review. Rancang pengalaman ini agar dapat dipahami mahasiswa yang belum pernah melakukan kajian atau mengenal istilah metodenya. Instruksi perkuliahan yang menjadi sumber rancangan hanya contoh format keluaran dan dapat dipetakan bila pengguna membutuhkannya. Di layar, gunakan penjelasan bahasa sederhana terlebih dahulu, lalu perkenalkan istilah akademik saat relevan. Baca panduan mulai dan dokumen teknis tahap aktif. Mulai dengan P0: audit checkout aktual, AGENTS.md, commit, perubahan lokal, routing, persistence, auth, provider, export dan baseline checks. Buat repo-audit serta implementation-map dengan exact path yang terverifikasi. Jangan menganggap informasi repo dari percakapan sebagai bukti source saat ini. Setelah P0, kerjakan tahap yang ditugaskan sesuai dependensi; jangan sekaligus membangun seluruh roadmap. Pertahankan kemampuan yang masih digunakan dan migrasikan data secara aman. Setiap perubahan harus dapat diuji dengan acceptance pada dokumen 13. Jangan menampilkan data demo sebagai hasil nyata, jangan menganggap agent reviewer manusia, dan jangan mengklaim build/test yang belum dijalankan. Laporkan keluaran tahap, pemeriksaan, keterbatasan dan pekerjaan berikutnya.

## Instruksi sesi per tahap

Ganti nilai N dengan tahap yang hendak dikerjakan, bukan meminta model menebak scope:

> Kerjakan P[N] dari dokumen 11. Verifikasi seluruh prasyarat; baca spec modul dan implementation-map. Bila exact path, interface atau dependency tidak sesuai checkout, perbarui pemetaan dengan alasan sebelum coding. Implementasikan pekerjaan tahap ini dan acceptance yang relevan. Jangan memperluas scope ke pelatihan model atau administrasi LMS. Simpan hasil pekerjaan dan jalankan pemeriksaan yang relevan. Laporkan gate yang lulus, yang belum lulus dan alasan berbasis bukti.

Untuk tahap UI, periksa secara khusus bahwa mahasiswa dapat menyelesaikan workflow umum tanpa mengunggah berkas perkuliahan atau membaca dokumentasi teknis. Setiap istilah seperti PCC, protokol, data charting, JBI dan PRISMA-ScR harus memiliki penjelasan kontekstual yang dapat dibuka. Nama internal kelas, database dan endpoint tidak boleh menjadi label utama layar.

## Audit yang wajib sebelum edit

- SHA dan branch/worktree yang dipakai, perubahan lokal, serta instruksi AGENTS.md berlaku.
- Route proyek baru, proyek legacy dan demo; apakah pengalaman riset hanya special case.
- Storage proyek, database migrations, lokasi file dan event logging.
- Service/adapter pencarian, source ID, provider keys dan jalur error.
- Auth, project membership dan kemampuan kolaborasi independen.
- Editor, citation support, export pipeline dan rendering tools.
- Scripts test/build/typecheck lint sesuai repo, bukan tebakan.

Kandidat yang disebut analisis sebelumnya: ui/src/App.tsx, ui/src/components/ResearchDemoWorkspace.tsx, docs/research-workflow/legacy-demo.md (sebelumnya docs/VERA-RESEARCH-WORKFLOW.md), docs/local-models.md, README.md dan AGENTS.md. Seluruhnya wajib dicek keberadaannya. Bila berubah atau hilang, cari dengan rg dan catat penggantinya.

## Aturan implementasi

1. Reuse service, storage dan komponen yang terbukti; hanya refactor bagian yang diperlukan tahap aktif.
2. Pisahkan workflow state dari chat dan job status. Jangan memakai teks model sebagai bukti tahap selesai.
3. Backend memvalidasi gate, revision dan permission. Menyembunyikan tombol di UI bukan kontrol akses.
4. Semua objek bukti mempunyai asal dan versi. Audit log tidak menyimpan credential.
5. Fitur baru yang belum siap terlihat sebagai belum tersedia; tidak diberi success toast palsu.
6. Data proyek lama tidak diisi dengan nilai perkiraan. User dapat melanjutkan mode legacy.
7. Fixture hanya digunakan dalam test atau demo bertanda jelas.
8. Tidak menambahkan dependency besar, layanan cloud atau framework baru tanpa menunjukkan kebutuhan dan kesesuaiannya dengan repo.
9. Pengaturan model tetap di layanan/panel teknis; mahasiswa berinteraksi dengan bantuan tahapnya.
10. Hasil agent adalah proposal sampai disetujui atau diperiksa menurut jenis data.

## Format laporan tahap

Tuliskan tujuan, perilaku yang sekarang bisa dicoba, berkas yang diubah, migrasi, perintah pemeriksaan dan hasil aktual, batas verifikasi live, masalah tersisa, serta gate tahap berikutnya. Cantumkan commit SHA bila commit dibuat. Hindari persentase selesai tanpa dasar.

## Kondisi yang tidak boleh diterobos

Repo tidak dapat diakses: laporkan blocked P0, jangan membuat rewrite aplikasi dari dokumentasi saja. Credential tidak tersedia: implementasikan adapter dan impor, uji contract, tandai live verification belum dilakukan. Reviewer kedua belum tersedia: tetap izinkan latihan, jangan menyebut prosedur independen telah selesai. File fulltext belum diperoleh: catat not_retrieved, jangan mengisi ekstraksi fulltext.

## Handoff teknis

Paket ini memberi tujuan dan kontrak usulan. Audit membuat detail path/perintah aktual. Jika revisi kontrak dibutuhkan, buat decision record berisi masalah, alternatif, pilihan dan pengaruh pada acceptance; perbarui spec terkait agar tidak ada dua definisi yang bertentangan.
