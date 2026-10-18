# 11. Rencana Implementasi Bertahap

Untuk Codex: eksekusi satu tahap pada satu waktu melalui workflow implementasi yang sesuai lingkungan. Gunakan kontrak dan acceptance di paket ini. Implementasi belum dilakukan dalam penyusunan dokumen.

**Goal:** membentuk workflow mahasiswa dari penentuan arah hingga draft Scoping Review yang tertelusur.

**Architecture:** workspace proyek di atas kapabilitas repo yang dipertahankan, domain service deterministik untuk state/provenance, dan bantuan model yang menghasilkan proposal. Tahap belajar dan bukti tersimpan bersama.

**Tech stack:** Rust, React/TypeScript dan SQLite menurut analisis repo sebelumnya; P0 wajib memverifikasi stack, versi dan tooling aktual.

**Spec:** dokumen 01 sampai 10; acceptance pada dokumen 13.

## Constraints global

- Jangan mengarang hasil pencarian, DOI, angka seleksi, registrasi atau metadata.
- Exploratory dan formal terpisah; hasil formal yang parsial harus terlihat.
- Dua reviewer adalah dua manusia; bantuan agent tidak menggantikannya.
- Penggunaan normal dan evaluasi penelitian dibedakan.
- Perubahan hulu menandai artefak turunannya untuk ditinjau.
- Build/test menggunakan perintah yang ditemukan pada repo; jangan mengklaim pass berdasarkan dokumentasi lama.

## Review focus

1. Progres hilang setelah restart atau error autosave: P1 menguji persistence/resume.
2. Query parsial tampak lengkap: P3 menguji timeout dan perbedaan reported/retrieved.
3. Reviewer melihat keputusan pihak lain sebelum submit: P4 menguji API dan UI.
4. Perubahan kriteria tidak memengaruhi draft: P6 menguji propagasi stale.
5. Ekspor membuat angka/halaman fiktif: P7 menguji ledger, rendering dan audit.

## Pemetaan berkas sebelum coding

P0 menghasilkan docs/research-workflow/repo-audit.md berisi commit SHA, status checkout, AGENTS.md, routing, module path, storage, auth, provider adapters, export, test commands dan baseline failures. Selanjutnya docs/research-workflow/implementation-map.md mencatat exact path untuk setiap pekerjaan P1–P8.

Path frontend kandidat baru: ui/src/features/research-workflow/ dengan folder direction, protocol, search, selection, charting, synthesis, draft dan audit. Nama shell usulan ResearchWorkspace.tsx. Backend ditempatkan dalam domain module yang mengikuti struktur crate sebenarnya; jangan membuat path crate rekaan. Setiap file mempunyai tanggung jawab tunggal. ResearchDemoWorkspace bukan wadah tunggal semua fitur.

Path di atas adalah usulan; exact path akhir harus berasal dari audit. Paket tidak memasukkan nomor baris palsu atau perintah test yang belum diketahui.

## P0. Audit checkout dan kunci kontrak

**Prasyarat:** akses repo/checkout yang dapat dibaca. **Hasil:** audit dan implementation map, tanpa perubahan perilaku aplikasi.

- [ ] Baca seluruh AGENTS.md yang berlaku, catat SHA dan perubahan lokal. Jangan menimpa pekerjaan pengguna.
- [ ] Telusuri routing proyek nyata/demo, service riset, storage, provider, auth reviewer, editor dan export.
- [ ] Jalankan baseline yang relevan sesuai scripts/Cargo; catat perintah, exit code dan failure lama.
- [ ] Klasifikasikan kemampuan: tersedia, perlu diperluas, belum tersedia; sertakan path pendukung.
- [ ] Tentukan exact path per tahap dan antarmuka reuse. Selesaikan keputusan identitas dua reviewer sebelum P4.
- [ ] Catat migration dan compatibility strategy untuk proyek lama.

**Selesai:** implementer dapat menunjuk sumber nyata untuk routing/storage/provider; tidak ada asumsi fitur yang disamarkan sebagai fakta. Jika repo tidak dapat diakses, P0 dilaporkan blocked dan tidak membuat implementasi spekulatif.

## P1. Proyek dan arah kajian yang persisten

**Depends on:** P0. **Consumes:** Project storage dan routing existing. **Produces:** ResearchProject dan DirectionBriefVersion.

- [ ] Tambahkan test create → answer → save → restart → resume; assert jawaban, pilihan dan revision tetap sama.
- [ ] Tambahkan test save gagal: input tetap ada, UI gagal tersimpan, retry tidak membuat dua brief.
- [ ] Implementasikan skema additive dan layanan brief menggunakan expectedRevision.
- [ ] Bangun shell proyek nyata, tahap wawancara dan brief sesuai dokumen 03/09.
- [ ] Tambahkan validasi review-type fit, status ketidakpastian dan kandidat maksimal tiga.
- [ ] Verifikasi proyek legacy dapat dibuka dan data tidak dipaksa menjadi protokol baru.

**Selesai:** mahasiswa dapat menentukan arah dan melanjutkannya setelah restart. Eksplorasi boleh berupa seed source manual sampai P3 tersedia; UI tidak menampilkan pencarian contoh sebagai nyata.

## P2. Rencana kajian dan keluaran tugas pilihan

**Depends on:** P1. **Consumes:** brief. **Produces:** ProtocolVersion, QueryPlan, ChartingPlan dan draft awal.

- [ ] Test workflow umum tanpa instruksi tugas: pengguna dapat menyimpan tujuan, pertanyaan, aturan pemilihan sumber, strategi pencarian dan rencana rangkuman.
- [ ] Test pemetaan format tugas perkuliahan yang menjadi contoh ke bagian workflow; label dan nomor tugas tidak muncul pada jalur umum.
- [ ] Test komponen yang diminta pada format tugas perkuliahan pilihan; pastikan keputusan untuk tidak menilai mutu sumber disertai alasan.
- [ ] Test registrasi belum dilakukan: tidak muncul nomor/URL otomatis atau tanggal pencarian aktual.
- [ ] Implementasikan form/editor tiap item, aturan keselarasan dan snapshot protokol.
- [ ] Implementasikan amendment preview dengan computeImpact; simpan keputusan tanpa menimpa versi lama.
- [ ] Bentuk draft awal dan preview rencana kajian umum. Bila mahasiswa memilih mengikuti format tugas tertentu, siapkan keluaran sesuai instruksi itu. Ekspor Markdown tersedia; DOCX/checklist halaman final diselesaikan pada P7.
- [ ] Uji koreksi PCC dan query plan agar bagian terkait ditandai needs_review.

**Selesai:** mahasiswa tanpa pengalaman atau instruksi kampus dapat membuat rencana kajian dan memahami langkahnya; pengguna yang membawa instruksi dapat menyesuaikan keluaran dengan format tersebut. Semua kegiatan yang direncanakan dan sudah dilakukan dibedakan. Label keluaran masih pratinjau bila belum punya rendering halaman final.

## P3. Pencarian nyata dan impor

**Depends on:** P2. **Consumes:** QueryPlan yang disetujui. **Produces:** SearchRun, EvidenceRecord, RecordOccurrence.

- [ ] Tulis contract test provider dengan respons fixture terlabel testing; assert reportedTotal 1000 dan retrievedCount 100 tetap partial saat pagination gagal.
- [ ] Test resume checkpoint tidak menggandakan occurrence.
- [ ] Implementasikan Scopus adapter atau perluasan existing sesuai entitlement aktual; verifikasi sintaks melalui dokumentasi provider.
- [ ] Implementasikan exploratory/formal separation, query approval, raw artifact dan provenance.
- [ ] Implementasikan RIS/BibTeX/CSV import preview, pemetaan field dan malformed-row report.
- [ ] Uji online integration hanya jika credential sah tersedia; jika tidak, laporkan belum diverifikasi live. Fixture pass bukan bukti pencarian live berhasil.

**Selesai:** retrieval atau impor asli dapat ditelusuri. Konektor tanpa akses tetap unavailable. Pencarian exploratory kini terhubung ke tahap arah tanpa mencampur hitungan formal.

## P4. Deduplikasi dan seleksi dua reviewer

**Depends on:** P3 serta identitas/membership yang diputuskan P0. **Consumes:** formal occurrences dan kriteria berversi. **Produces:** SelectionSetVersion, keputusan, adjudikasi dan ledger.

- [ ] Test DOI match, fuzzy candidate dan undo merge; provenance dua provider tetap tersimpan.
- [ ] Test reviewer A tidak menerima keputusan B melalui respons API sebelum submit, termasuk request langsung.
- [ ] Implementasikan queue independen, assignment, konflik dan resolusi.
- [ ] Implementasikan retrieval fulltext legal/unggah, status not_retrieved terpisah dari exclusion.
- [ ] Test ledger dengan dataset pada dokumen 13 dan alasan eksklusi wajib.
- [ ] Uji retry submit dan optimistic conflict; keputusan tidak hilang atau tercatat ganda.

**Selesai:** dua reviewer nyata bekerja dalam proyek, konflik tercatat, fulltext status benar dan semua angka dapat direkonstruksi. Jika identitas masih single-user, fitur hanya berlabel latihan dan review lengkap belum lulus gate.

## P5. Charting dan verifikasi sumber

**Depends on:** P4. **Consumes:** included reports, source artifacts dan charting plan. **Produces:** schema dan confirmed rows.

- [ ] Test not_reported, not_applicable dan uncertain tidak menjadi nilai 0.
- [ ] Implementasikan form builder terbatas, pilot dan schema revisions.
- [ ] Implementasikan reader/locator, sel proposed dan confirm oleh manusia.
- [ ] Implementasikan verification anggota kedua sesuai prosedur proyek; tampilkan konflik data.
- [ ] Test perubahan definisi kolom menandai baris terdampak untuk review.
- [ ] Bila appraisal aktif, implementasikan form instrumen yang dipilih dengan provenance dan penggunaannya; jangan membuat skor universal.

**Selesai:** temuan yang akan disintesis tertelusur ke sumber dan telah diperiksa. Agent gagal tetap memungkinkan ekstraksi manual.

## P6. Sintesis dan editor draft terhubung

**Depends on:** P5. **Consumes:** confirmed rows. **Produces:** SynthesisVersion, DraftVersion dan claim links.

- [ ] Test denominator, kategori tumpang tindih dan dataset kosong.
- [ ] Implementasikan tabel deterministik, codebook, usulan tema dan persetujuan mahasiswa.
- [ ] Implementasikan editor bagian, citations dan evidence panel; usulan tulisan diterapkan melalui revision.
- [ ] Implementasikan stale propagation dari perubahan screening/sel/protokol.
- [ ] Test klaim hasil tidak dapat berstatus verified hanya karena sitasi DOI valid.
- [ ] Test perubahan hasil tidak menghapus tulisan manual; tampilkan impact dan review perubahan.

**Selesai:** artikel tersusun dari data nyata, claim links terlihat, dependency drift ditemukan. Draft awal tetap dapat dibuka saat review belum lengkap.

## P7. Audit, ekspor dan rollout

**Depends on:** P6 untuk artikel lengkap; ekspor dokumen sesuai instruksi perkuliahan dapat dikembangkan setelah P2. **Produces:** AuditReport, berkas final dan ExportManifest.

- [ ] Test coverage checklist tugas versus artikel penuh; item appraisal conditional.
- [ ] Implementasikan export Markdown dan DOCX serta lampiran search/screening/charting.
- [ ] Render keluaran final, hitung pemetaan halaman checklist, tandai kegagalan mapping secara jujur.
- [ ] Test counts flow sama dengan ledger, sitasi-referensi cocok dan secret tidak masuk berkas.
- [ ] Jalankan walkthrough pengguna dari blank project sampai ekspor, termasuk offline/error/partial.
- [ ] Rilis terbatas dengan feature flag dan langkah rollback yang tidak menghapus data; dokumentasikan migrasi.

**Selesai:** rencana kajian atau draft lengkap; keluaran tugas mengikuti instruksi yang dipilih dapat dibuka dan ditelusuri; tidak ada label final yang menyembunyikan masalah. Publikasi atau pengiriman tugas tidak otomatis dilakukan.

## P8. Bantuan adaptif dan evaluasi belajar

**Depends on:** alur inti P1–P7 stabil. **Consumes:** LearningDecision dan AssistanceEvent. **Produces:** policy bantuan berversi dan tugas transfer.

- [ ] Integrasikan prompting bertingkat dan misconception hints sesuai dokumen 08; dasar judgement sudah dibangun pada tahap sebelumnya.
- [ ] Test bantuan tidak terungkap sebelum judgement pada aktivitas yang disyaratkan.
- [ ] Bangun tugas transfer dengan bantuan terbatas, rubrik dan policy/version pin.
- [ ] Pisahkan dashboard mutu sistem, mutu draft berbantuan dan kinerja mandiri.
- [ ] Verifikasi kontrol akses, persetujuan penggunaan data dan ekspor trace tanpa mencampur dokumen sumber berlisensi.

**Selesai:** aplikasi mendukung evaluasi pembelajaran tanpa menyimpulkan kompetensi dari skor draft atau klik saja. Pembaruan model melalui pelatihan berada pada proyek terpisah.

## Prosedur setiap pekerjaan

Untuk perubahan perilaku, buat test yang akan gagal terhadap kebutuhan spesifik; jalankan dan pastikan gagal karena perilaku yang belum ada; implementasikan minimum; jalankan ulang test dan pemeriksaan relevan; tinjau diff dan dokumentasikan hasil. Commit/PR mengikuti aturan repo dan arahan pengguna. Jangan mengulang seluruh suite tanpa alasan setelah hasil relevan telah memadai.

Deliverable akhir tiap tahap: perilaku yang dapat dicoba, migration bila ada, test evidence, keterbatasan, exact files dan tahap berikutnya. Tahap berikut baru dilanjutkan setelah dependency gate lulus; kegagalan live API tidak diubah menjadi demo yang tampak nyata.
