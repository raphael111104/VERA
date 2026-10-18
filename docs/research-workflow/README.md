# Pelaksanaan paket workflow VERA

Acuan: [spesifikasi workflow versi 1.2](specification/README.md), sebelumnya berada di folder akar `VERA_Workflow_Codex_Pack/`. Dokumen implementasi, keputusan, dan spesifikasi kini dikumpulkan di folder ini. Audit awal 14 Oktober 2026 WIB pada commit `3432a41174290670153eb818f877402dc5d67586`.

Laporan di bawah mencatat hasil sesi masing-masing, termasuk batas pengujian localhost dan desktop pada tanggal tersebut. Panduan paket Windows berada di [dokumentasi Windows](../windows.md); aturan berkas generated dan pembersihan berada di [panduan pemeliharaan](../maintenance.md).

## Status saat ini

Susunan dashboard workflow telah dirapikan untuk penggunaan awam pada localhost. Lihat [perapian susunan UI](ui-organization.md) untuk pengelompokan halaman, interaksi yang diperiksa, dan batas verifikasinya.

P1–P8 telah diimplementasikan untuk web localhost. Lihat [penyelesaian kebutuhan dan panduan uji](completion-and-testing.md) untuk perbaikan lanjutan, traceability acceptance dan bukti akhir. [Laporan P5–P6](p5-p6-delivery.md) dan [laporan P7–P8](p7-p8-delivery.md) menyimpan hasil tahap sebelumnya. Kelulusan implementasi tidak menyatakan bahwa kajian pengguna sudah selesai atau dua manusia telah menjalankan review akademik nyata.

## Hasil sesi pertama

**Update:** implementasi P1–P4 telah ditambahkan pada web localhost. Buka `http://127.0.0.1:5201/research`. Rincian perilaku, file aktual, pengujian dan batas verifikasi ada pada [laporan implementasi P1–P4](p1-p4-delivery.md). Isi audit P0 di bawah adalah catatan sesi pertama dan tidak menyatakan status aplikasi setelah implementasi.

Paket telah dibaca dan dipetakan terhadap source aktual. Sesi ini menjalankan **P0**, sesuai ketentuan satu tahap per pekerjaan pada dokumen 11. Tidak ada fitur P1–P8 yang diimplementasikan atau dinyatakan selesai. Tidak ada perubahan perilaku aplikasi, migrasi data pengguna atau penggantian paket desktop.

- [Audit checkout dan baseline](repo-audit.md): routing demo/proyek biasa, storage, provider, identitas, editor, export dan hasil pemeriksaan aktual.
- [Peta implementasi P1–P8](implementation-map.md): berkas existing/baru, antarmuka reuse, dependensi dan gate acceptance.
- [Keputusan proyek lokal dan identitas reviewer](decisions/001-local-workflow-and-reviewer-identity.md): route/store baru, kompatibilitas, revision/idempotency dan prasyarat dua manusia.

## Tahapan

| Tahap | Status pekerjaan | Hasil yang dituju |
|---|---|---|
| P0 | Selesai; baseline dan batas verifikasi tercatat | Fondasi implementasi berbasis source nyata |
| P1 | Implementasi dan pemeriksaan tersedia | Proyek, wawancara, brief, autosave/retry/resume |
| P2 | Implementasi tersedia; rencana umum dan tugas pilihan mempunyai ekspor tersendiri | Rencana berversi, amendment, query per database dan keluaran rencana |
| P3 | Implementasi tersedia; OpenAlex, Crossref, PubMed, bioRxiv/OpenAlex dan alphaXiv live terbatas; Scopus live belum diverifikasi | SearchRun/checkpoint, provenance dan impor |
| P4 | Implementasi tersedia; dua identitas diuji dengan fixture, dua manusia belum menjalankan review nyata | Seleksi, concealment, konflik, retrieval/PDF dan ledger |
| P5 | Implementasi manual tersedia; fixture prosedur/locator lulus, review manusia nyata belum dilakukan | Form berversi, pilot, sel, locator, verifikasi dan appraisal manual |
| P6 | Implementasi tersedia; dataset/claim/stale diuji, draft belum merupakan artikel final | Sintesis deterministik, editor bagian dan claim links |
| P7 | Implementasi localhost tersedia; draft belum lengkap tetap ditandai, rendering Word lokal dan rollback flag diuji | Audit 22 item, format tugas pilihan, paket immutable, DOCX/Markdown dan data pendamping |
| P8 | Coach lokal, usulan tahap terstruktur dan transfer tersedia; tidak mengklaim hasil eksperimen atau kompetensi | Judgement, bantuan, review usulan, stale guard, refleksi dan trace dengan persetujuan terpisah |

Seluruh tahap paket kini tersedia untuk peninjauan pengguna pada localhost. Batas verifikasi provider, dukungan sumber, dua manusia dan studi pembelajaran tetap berlaku seperti laporan implementasi. Paket desktop utama belum dibangun atau diganti pada pekerjaan ini.
