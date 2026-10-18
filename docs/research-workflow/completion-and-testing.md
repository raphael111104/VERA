# Penyelesaian kebutuhan workflow dan panduan uji localhost

Target pekerjaan ini adalah web localhost pada checkout VERA. Paket desktop utama tidak dibangun atau diganti. Dokumen ini melengkapi laporan P1–P8 sebelumnya; perubahan lanjutan dan bukti akhir dicatat di sini.

## Perubahan lanjutan

- Arah kajian membandingkan maksimal tiga kandidat melalui tujuh aspek kesiapan, catatan ketidakpastian dan tautan sumber awal. Penilaian berasal dari pengguna; tidak ada skor kebaruan otomatis.
- Halaman mulai menawarkan Pelajari dulu dan Mulai tanpa istilah teknis. Penjelasan PCC, protokol, charting, codebook, JBI dan PRISMA tersedia pada tahap terkait.
- Rencana kajian menyimpan query tambahan per database, termasuk query asli, query yang disetujui dan alasan adaptasi/batas. Pencarian formal hanya menerima pasangan provider/query pada versi acuan yang disetujui.
- Bibliografi menyimpan nama penulis terstruktur serta metadata terbitan secara terpisah dari impor asli. Pratinjau dan ekspor memakai sitasi penulis–tahun serta referensi APA 7. Metadata yang kurang atau nama tampilan yang belum diperiksa tetap membawa catatan. DOI tidak diperlakukan sebagai pemeriksaan dukungan klaim. Acuan format: [contoh referensi APA](https://apastyle.apa.org/style-grammar-guidelines/references/examples).
- Ekspor membedakan artikel, rencana umum dan tugas pilihan. Rencana melaporkan prosedur yang direncanakan. Tugas pilihan memuat item 1 dan 3–13, referensi, lampiran strategi pencarian dan rancangan pencatatan. Identitas mahasiswa dicetak hanya ketika instruksi memintanya. Persyaratan tambahan dapat ditulis pengguna.
- Nomor halaman checklist berasal dari kutipan yang ditemukan unik dalam bagian dokumen hasil render. Kutipan hilang atau ambigu mempertahankan halaman kosong dan status needs_review. Nomor halaman heading tetap disimpan sebagai informasi renderer, tetapi tidak digunakan sebagai pengganti lokasi kutipan.
- Query dalam dokumen rencana dirender sebagai teks kode agar wildcard seperti agent* tetap utuh. Pembacaan array locator kompatibel dengan Windows PowerShell 5.1; satu daftar tidak lagi diproses sebagai satu locator gabungan.
- Sidechat mempunyai Percakapan dan Usulan tahap. Usulan menyimpan konteks, model, prompt, kebijakan dan dependensi, kemudian memerlukan alasan dan tindakan terapkan/tolak. Perubahan konteks membuat usulan usang; isi tulisan tetap dipertahankan.
- Hasil worker model disimpan pada tabel lokal rw_job_results, terpisah dari revisi tulisan. Hasil tidak langsung mengubah artefak akademik. Worker menggunakan jalur one-shot harness, store terisolasi dan timeout. Harness yang tidak dapat mempertahankan model pilihan menolak permintaan terstruktur dengan pesan yang jelas; percakapan dan panduan lokal tetap tersedia. Pengujian domain atas scope keluaran tidak merupakan bukti bahwa setiap layanan agent eksternal mempunyai sandbox OS yang identik.
- Meninjau petunjuk yang tidak berisi patch hanya mencatat keputusan belajar. Tindakan tersebut tidak merevisi protokol, membuka kunci rencana atau membuat bukti usang. Tingkat pertama panduan lokal berisi pertanyaan pemantik; tingkat kedua berisi petunjuk tanpa menulis artefak.
- Tema manual atau usulan interpretasi menyimpan tautan sel dan sumber. Snapshot sintesis memuat tema yang sesuai dependensi. Appraisal yang diwajibkan protokol menjadi pemeriksaan audit; verifikasi hasil dan kesimpulan memerlukan sintesis aktif.
- Pencarian dan pagination sumber pada panel berkas membatasi daftar besar. Metadata referensi dan pengaturan ekspor menyimpan koreksi lokal yang belum dikirim. Kesalahan validasi definitif tidak lagi membuat writer terus mengulang jawaban yang sudah ditolak; retry gangguan koneksi tetap mempertahankan operationId.

## Panduan uji pengguna

1. Buka http://127.0.0.1:5201/research dan lanjutkan proyek Anda, atau buat proyek baru untuk eksplorasi.
2. Pada Arah Kajian, tulis kandidat fokus, bandingkan kesiapan dan pilih sendiri fokus akhirnya. Penjelasan istilah dapat dibuka sesuai kebutuhan.
3. Pada Rencana Kajian, buka Query tambahan per database. Simpan query asli dan adaptasinya, lalu pilih versi acuan sebelum menjalankan pencarian formal.
4. Buka panel kanan untuk pratinjau, berkas, browser dan Sidechat. Usulan tahap menyediakan panduan lokal tanpa model. Untuk keputusan kritis, catat judgement awal pada Belajar bersama VERA terlebih dahulu. Pilih tingkat bantuan, tinjau usulan, isi alasan dan terapkan atau tolak.
5. Pada Audit dan Ekspor, pilih jenis keluaran. Simpan pengaturan bahasa/nama berkas/format tugas sebelum membuat paket. Format tugas harus diaktifkan pada Rencana Kajian dan instruksi aslinya disimpan pada Arah Kajian.
6. Periksa metadata referensi terhadap sumber asli. Simpan koreksi dengan catatan dan status pemeriksaannya. Buka Word/Markdown/PDF hasil ekspor dan periksa halaman checklist serta masalah yang masih dilaporkan.

Proyek dengan data belum lengkap tetap dapat diekspor sebagai draft. Label siap ditinjau tidak menyatakan bahwa artikel benar secara akademik atau siap diterbitkan.

## Traceability acceptance

| Acceptance | Implementasi dan bukti yang digunakan |
|---|---|
| A01–A02 | Persistensi SQLite, revision/idempotency, restart HTTP, writer retry dan regresi koreksi validasi |
| A03, A27–A28 | Wawancara dasar, jalur umum tanpa instruksi tugas, onboarding pilihan dan bantuan istilah kontekstual |
| A04–A05 | Status registrasi eksplisit tanpa data rekaan, appraisal conditional pada audit dan dokumen rencana |
| A06–A09 | Run eksplorasi/formal terpisah, pagination/checkpoint, actual received count, replay halaman dan preview impor |
| A10–A13 | Deduplikasi/undo, capability reviewer terpisah, concealment API, adjudikasi dan not_retrieved |
| A14–A16 | Sel proposed, locator/hash, missing states, pemeriksaan identitas kedua dan schema berversi |
| A17–A19 | Dependensi seleksi/charting, klaim/support, stale propagation tanpa menghapus tulisan, sintesis kosong |
| A20 | Ekspor tugas pilihan 12 item, lampiran, identitas conditional dan kutipan dokumen hasil render |
| A21–A22 | Audit 22 item artikel, ledger/referensi, paket immutable/checksum, redaksi secret dan pengecualian PDF sumber |
| A23 | Usulan terlambat menjadi stale; uji domain dan HTTP memastikan tidak menimpa koreksi manual |
| A24–A26 | Jalur manual, error layanan, akses proyek/job/file, schema usulan ketat dan penolakan field/ID di luar scope |
| A29 | Format tugas pilihan menggunakan arah/rencana yang sama, pemetaan persyaratan dan keluaran terpisah |

Fixture, token reviewer pengujian dan kutipan PDF buatan hanya menguji perilaku perangkat lunak. Pemeriksaan dua identitas tidak membuktikan dua manusia telah melakukan review. Hasil otomatis tidak membuktikan dukungan ilmiah, hak akses database berlangganan, atau kemampuan belajar mahasiswa. Scopus live tetap mengikuti credential/entitlement pengguna. Studi pembelajaran memerlukan protokol dan partisipan tersendiri.

## Pemeriksaan akhir

Pemeriksaan selesai untuk lingkup localhost pada 14 Oktober 2026. Backend source berjalan pada 4901 dan Vite pada 5201. Browser pengguna kembali ke kajian utama; proyek pengujian terpisah tetap diberi label data pengujian.

- UI: 252 tes lulus, lint style dan build/typecheck berhasil. Bundle ui/dist dihasilkan ulang melalui pnpm build. Peringatan ukuran chunk dan CSS highlight yang sudah ada tidak menggagalkan build.
- Rust: suite lengkap terakhir pada toolchain GNU Windows meluluskan 989 unit test dan 6 integration test, dengan 3 tes diabaikan. Pemeriksaan fmt serta clippy --all-targets -- -D warnings lulus. Tidak mengklaim pemeriksaan MSVC, Linux atau paket desktop.
- Acceptance HTTP P1–P8 dan kebutuhan lanjutan: exit code 0. Termasuk koreksi metadata APA, review/cancel/stale proposal, guidance tanpa amendment, pemetaan kutipan unik/ambigu, wildcard query Word, ekspor rencana/tugas dan cakupan item 1 serta 3–13. Perubahan transport model terakhir diuji langsung melalui browser pada Windows.
- Browser: onboarding pilihan beserta contoh, panduan lokal dan peninjauannya, pengaturan ekspor belum tersimpan yang mengunci tombol ekspor, paket rencana dengan nama pilihan, dan unduhan Word berhasil diuji. DOCX hasil unduhan mempunyai ZIP/OOXML yang valid.
- Model: permintaan GPT-6-Luna pada proyek kosong berlabel pengujian berhasil menjadi usulan terstruktur, menyatakan konteks belum cukup dan tidak mengarang rincian. Menandai petunjuk telah dibaca tidak mengubah protokol atau menyalakan kebutuhan review akademik. Hasil gagal dari uji awal tetap tersimpan sebagai riwayat; penyebab Windows batch multiline diperbaiki dengan stdin pada codex_one_shot. CLI lokal mendokumentasikan mode stdin tersebut melalui codex exec --help.
- Dokumen: seluruh 7 halaman artikel fixture dan 2 halaman dokumen tugas fixture dirasterisasi memakai Poppler runtime dan diperiksa visual. Tidak ditemukan clipping/overlap pada sampel. Kutipan unik di akhir metode dipetakan ke halaman 6 sementara heading metode berada di halaman 1. Kutipan ambigu tetap kosong. Seluruh 12 locator dokumen tugas dipetakan ke halaman hasil render; item yang datanya belum lengkap tetap berstatus missing. Wildcard agent* dan educat* terlihat utuh.
- Asset parity: bundle index-BMLWhcPq.js yang disajikan backend memiliki hash sama dengan ui/dist. Health endpoint melaporkan ok=true. Ini membuktikan versi source/bundle localhost, bukan pemeriksaan semua perilaku distribusi EXE.

Log utama berada di target/workflow-completion-rust-checked.log, workflow-completion-clippy-ready.log, workflow-completion-build-ready.log, workflow-completion-ui-checked.log, workflow-completion-ui-tests-ready.log dan workflow-completion-http-checked.log. Bukti visual berada di target/vera-workflow-model-verified.png serta vera-workflow-ready-localhost.png. Contoh dokumen pengujian berada di target/workflow-completion-article.docx dan workflow-completion-coursework.docx; keduanya berisi fixture fiktif, bukan hasil kajian nyata.

Tambahan data bersifat additive dengan default untuk membaca proyek terdahulu. Lokasi kompatibilitas OpenResearch tidak dipindahkan. Gunakan feature flag VERA_WORKFLOW_FINAL_STAGES untuk rollback fitur pada binary ini; jangan mengarahkan binary lama yang menolak field baru ke data yang sudah diperbarui.
