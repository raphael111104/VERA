# Audit ekspor dan pembelajaran pada localhost

Target tetap web localhost pada port UI 5201 dan backend 4901. Implementasi P7 dan P8 melanjutkan data P1 sampai P6. Paket desktop utama tidak diganti dan tidak ada publikasi atau pengiriman tugas otomatis.

## Audit dan ekspor

Menu Audit dan Ekspor menampilkan 22 item PRISMA ScR dengan status reported, missing, needs_review atau not_applicable_with_reason. Item appraisal 12 dan 16 tidak berlaku hanya ketika rencana memilih tidak melakukan appraisal dan menyimpan alasannya. Pernyataan belum diregistrasi dapat dipetakan sebagai pelaporan status registrasi; nomor registrasi tidak dibuat otomatis.

Pengguna memetakan item ke kutipan draft yang tersimpan dan catatan pemeriksaan. Server memvalidasi kutipan, revisi bagian dan dependensi bukti. Mengganti bagian atau data hulu membuat pemetaan perlu diperiksa kembali. Pemeriksaan ini mencatat pelaporan oleh manusia; sistem tidak menyimpulkan kebenaran klaim hanya dari keberadaan judul bagian.

Instruksi tugas pilihan memiliki pemetaan persyaratan sendiri. Pengguna menamai persyaratan, menunjuk kutipan dan menyatakan seluruh instruksi telah dipetakan. Kelengkapan tugas tetap terpisah dari kelengkapan artikel penuh. Dokumen pendamping membawa instruksi, rencana dan kutipan persyaratan yang dipetakan.

Ekspor draft tersedia bahkan pada proyek kosong. Status, unresolvedIssues, coverage, dependencyVersions dan reviewState masuk audit serta manifest. Setiap paket ZIP tersimpan sebagai snapshot immutable dengan checksum SHA256 per berkas. Retry operationId yang sama mengembalikan paket yang sama, dan paket lama tetap dapat diunduh setelah restart atau perubahan draft.

Paket memuat artikel DOCX dan Markdown, checklist CSV, diagram seleksi SVG dan ledger JSON, search log CSV/JSON, screening CSV/JSON beserta alasan/resolusi/retrieval, charting CSV/JSON terkonfirmasi, codebook, tabel sintesis berversi, appraisal, claim links dan seluruh perubahan/lock protokol sampai revisi ekspor. Dataset kosong tetap kosong. Angka diagram memakai fungsi ledger yang sama dengan workspace; unit laporan tidak diubah menjadi jumlah studi.

Tautan klaim menambahkan penanda sitasi numerik pada salinan ekspor dan daftar referensi tertaut; citation-map.json menghubungkannya ke record asli. URL/DOI menjadi hyperlink Word. Metadata yang kurang diberi penanda dan masalah audit; nama penulis, tahun, volume atau halaman tidak ditebak. Referensi awal mengikuti elemen author/year/title/DOI untuk penyempurnaan APA 7. Normalisasi nama serta gaya author-date APA 7 penuh masih memerlukan penyuntingan manusia; penanda numerik adalah alat traceability, bukan klaim format publikasi final.

PDF sumber, respons mentah provider, lampiran workspace, capability token dan trace belajar tidak masuk paket artikel. Nilai credential provider/model yang dikonfigurasi serta pola credential umum disamarkan bila tersalin ke teks. CSV melindungi nilai yang dapat ditafsirkan sebagai formula. Perlindungan ini bukan klaim mampu mengenali seluruh jenis rahasia yang mungkin ditulis pengguna.

## Rendering dan pagination

DOCX memakai paragraf dan heading Word, bookmark bagian, hyperlink dan tabel untuk tabel Markdown sederhana. Rendering Windows memakai Microsoft Word lokal bila tersedia, dengan macro automation dimatikan dan timeout terbatas. Tidak ada dokumen yang dikirim ke layanan eksternal. PDF hasil rendering dan hash dokumennya masuk manifest.

Nomor halaman checklist merujuk halaman fisik bookmark heading bagian pada dokumen yang dirender. Ini bukan jaminan bahwa kutipan yang jauh di bawah heading ada di halaman yang sama; label heading_anchor_rendered dan UI menjelaskan batas tersebut. Bila renderer/bookmark tidak tersedia atau gagal, halaman tetap null dan mapping needs_review. Platform selain Windows saat ini memakai fallback tanpa pemetaan halaman otomatis. Dokumen pendamping tugas juga tidak diklaim memiliki pemetaan halaman final otomatis.

Dasar implementasi: [Word WdInformation](https://learn.microsoft.com/en-us/office/vba/api/word.wdinformation), [Word ExportAsFixedFormat](https://learn.microsoft.com/en-us/office/vba/api/word.document.exportasfixedformat), dan [WordprocessingML Hyperlink](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.hyperlink).

## Bantuan belajar dan transfer

Menu Belajar bersama VERA menyediakan judgement awal, alasan dan bukti yang telah dibuka sebelum bantuan. Empat tingkat bantuan lokal adalah pertanyaan pemantik, petunjuk terarah, contoh parsial dan usulan proses pemeriksaan lengkap. Ini merupakan coach deterministik dengan policy vera-scaffolding-1 dan prompt vera-learning-prompts-1; tidak disamarkan sebagai jawaban model atau hasil penelitian. Bantuan tetap proposal dan tidak menulis keputusan akademik.

Hipotesis bantuan meliputi kebaruan, metadata/fulltext, frekuensi/efektivitas, amendment kriteria dan draft berbantuan/kemampuan mandiri. Pengguna memilih dan dapat mengoreksinya. Respons dan judgement akhir tersimpan sebagai peristiwa baru. Perubahan dependensi mengharuskan judgement baru sebelum bantuan berikutnya. Event API membawa actor/project, revision/dependency, policy/prompt, capability scope dan idempotency key.

Transfer opsional menggunakan topik dan evidence baru yang disediakan pengguna, jadwal/jeda eksplisit, model no-model-independent-transfer serta rubrik versi 1. Selama transfer aktif, API menolak bantuan bertingkat dan pengiriman sidechat. Instruksi/rubrik tetap tersedia; pengguna dapat menyerahkan jawaban atau mengakhiri tugas dengan alasan. Penilaian rubrik dilakukan manusia secara kualitatif. Batas bantuan berlaku dalam aplikasi ini; sistem tidak mengklaim dapat mengawasi bantuan dari aplikasi atau perangkat lain.

Tinjauan mutu memisahkan status proses sistem, audit artefak berbantuan dan jawaban/penilaian tugas mandiri. Klik dan durasi tidak menjadi skor kompetensi. Trace diekspor melalui endpoint terpisah khusus pemilik dengan persetujuan proyek yang dapat dicabut. Persetujuan penelitian terpisah dari ekspor lokal; mode studi ditolak bila persetujuan penelitian belum tercatat. Tidak ada pelatihan model otomatis, klaim hasil eksperimen atau sertifikasi kompetensi.

## Migrasi dan rollback

Tambahan rw_export_files menyimpan ZIP lokal terpisah dari PDF sumber. Evidence mendapat array reporting, exports dan learning dengan default kosong untuk membaca proyek P1 sampai P6. Replay delta juga mengisi array baru yang belum ada pada snapshot lama. Lokasi legacy OpenResearch dan database aplikasi lama tidak dipindahkan. Transaksi create/change workflow memakai BEGIN IMMEDIATE agar penulisan latar belakang tidak menyebabkan kegagalan upgrade transaksi WAL.

Rollout terbatas pada checkout localhost ini. Feature flag VERA_WORKFLOW_FINAL_STAGES=0 menyembunyikan menu P7/P8 dan menolak mutasi tahap tersebut. Untuk rollback fitur, hentikan backend VERA yang telah diverifikasi, set variabel itu pada shell peluncur, jalankan Jalankan-VERA-Localhost.cmd --no-browser dan muat ulang UI. Hapus variabel atau set 1 lalu restart untuk mengaktifkan kembali. Export tersimpan tetap bisa diunduh oleh pemilik dan data belajar tidak dihapus. Selesaikan/akhiri transfer aktif sebelum menonaktifkan fitur karena pembatasan sidechat tugas yang tersimpan tetap berlaku.

Rollback yang dianjurkan memakai flag pada binary ini. Binary lama yang menolak field Evidence baru tidak boleh diarahkan ke database yang telah ditulis P7/P8. Bila rollback binary diperlukan, gunakan backup database sebelum upgrade pada slot terpisah dan simpan database terbaru untuk pemulihan; jangan menghapus atau menurunkan skema data aktif.

## Peta berkas

- src/local/research_workflow/audit.rs: checklist, coverage, paket, Word, secret scrubbing dan manifest.
- src/local/research_workflow/learning.rs: bantuan bertingkat, trace, consent dan transfer/rubrik.
- src/local/research_workflow/evidence.rs: field additive.
- src/store/research_workflow.rs: paket immutable, amendment history, replay dan transaksi writer.
- src/commands/up/research_workflow.rs serta up.rs: mutasi dan unduhan yang diotorisasi.
- ui/src/features/research-workflow/audit dan learning: aktivitas baru.
- scripts/render_workflow_docx.ps1: renderer Word lokal.
- scripts/test_research_workflow.py: acceptance HTTP dari proyek kosong, revisi, akses, ekspor dan belajar.

## Hasil pemeriksaan

- pnpm test: 251 lulus.
- pnpm lint:styles dan pnpm build: lulus; ui/dist telah dihasilkan ulang. Peringatan ukuran chunk dan CSS highlight existing tetap terlihat, tidak menggagalkan build.
- cargo fmt --all --check dan GNU Windows clippy --all-targets -- -D warnings: lulus.
- Suite Rust lengkap pada sesi ini: 980 unit lulus, 3 diabaikan dan 6 integrasi lulus. Setelah tambahan uji pemetaan tugas dan transaksi writer serta perapian ekspor, pemeriksaan akhir terarah research_workflow meluluskan 15 tes. Tidak mengklaim seluruh suite akhir memuat dua tes tambahan itu.
- Acceptance HTTP akhir P1–P8 lulus dengan exit code 0. Mencakup blank export, retry/idempotency, revisi, restart, reviewer concealment/access, ledger, checksum, pengecualian source/learning, secret scrubbing, judgement gate, progressive help, transfer lock/rubrik, consent withdrawal dan flag rollback. Semua record/PDF akademik pada harness adalah fixture fiktif berlabel pengujian.
- Build backend GNU Windows dari source lulus dan berjalan pada localhost 4901; Vite 5201 tetap tersedia. Asset index-DZEztSiC.js yang disajikan backend memiliki SHA256 sama dengan ui/dist.
- Browser: paket proyek pengujian dibuat dengan Word/PDF/Markdown/checklist, unduhan article.docx berhasil ke Downloads, judgement awal dan dua tingkat bantuan tersimpan, tingkat keempat tetap terkunci, dan riwayat bantuan pulih setelah reload. Browser dikembalikan ke Audit dan Ekspor pada kajian utama.
- Renderer skill render_docx.py dicoba dan gagal karena LibreOffice tidak terpasang. Fallback produksi Microsoft Word lokal berhasil menghasilkan PDF; kedua halaman sampel akhir dirasterisasi memakai Poppler runtime dan diperiksa secara visual. Teks, heading, sitasi, redaction dan masalah audit terbaca tanpa clipping. Ini bukti rendering sampel pengujian, bukan jaminan layout semua naskah pengguna.

Log yang relevan: target/workflow-p7-ui-tests.log, workflow-p7-ui-verified.log, workflow-p7-styles-final.log, workflow-p7-rust-tests.log, workflow-p7-final-tests.log, workflow-p7-final-clippy.log, workflow-p7-final-build.log dan workflow-p7-http-acceptance.log. Bukti gambar: target/vera-workflow-p7-localhost.jpg serta vera-workflow-p8-localhost.jpg.

Tidak ada review akademik nyata oleh dua manusia atau evaluasi pembelajaran dengan partisipan yang dilakukan pada pekerjaan implementasi ini. Batas verifikasi provider pada laporan P5–P6 tetap berlaku. Perubahan disimpan di checkout tanpa commit/PR atau penggantian paket desktop utama.
