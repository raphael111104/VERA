# Peta implementasi bertahap — VERA web localhost

Baseline: `3432a41174290670153eb818f877402dc5d67586`, 14 Oktober 2026 WIB. Berdasarkan dokumen 00–14 paket rancangan 1.2 dan [audit source](repo-audit.md). Keputusan route, storage, kompatibilitas dan identitas ada pada [ADR 001](decisions/001-local-workflow-and-reviewer-identity.md).

**Catatan P0:** peta awal di bawah dibuat sebelum implementasi. Path aktual dan batas verifikasi tersedia pada laporan [P1–P4](p1-p4-delivery.md), [P5–P6](p5-p6-delivery.md) dan [P7–P8](p7-p8-delivery.md). Bagian awal dokumen ini adalah roadmap historis. Batas rilis tetap localhost; tidak menjalankan windows/build-single-file.ps1 atau mengganti VERA.exe.

## Cara memakai peta

Path berlabel existing telah ditemukan dan dibaca/diperiksa pada checkout. Path berlabel baru adalah target konkret yang dipilih audit dan belum dibuat. Periksa HEAD/diff dan kontrak sebelum tiap tahap; jika ternyata perlu memindahkan file, catat alasan di sini sebelum implementasi. Jangan mengedit routeTree.gen atau Paraglide dengan tangan.

## Integrasi yang dipertahankan

| Tanggung jawab | Existing | Cara reuse |
|---|---|---|
| Store SQLite, WAL dan lifecycle | `src/store.rs` | Tambahkan modul storage melalui deklarasi mod/re-export; ikuti lifecycle/move guard dan transaksi |
| Folder riset legacy | `src/store/research_folders.rs`, `ui/src/researchFolders.ts`, `ui/src/components/ResearchFolders.tsx` | Pertahankan API/dokumen lama; reuse pola writer, tidak mengubahnya diam-diam menjadi DirectionBriefVersion |
| Routing dan shell | `ui/src/router.tsx`, `ui/src/routes/__root.tsx`, `ui/src/RemoteRuntime.tsx`, `ui/src/App.tsx` | Tambahkan route riset berdampingan; jangan menambah semua state ke App/ResearchDemoWorkspace |
| Navigasi/persistensi coding | `ui/src/routeResume.ts`, `ui/src/workspaceState.ts`, `ui/src/workspacePersistence.ts`, `src/workspace_state.rs` | Jalur coding tetap valid; resume riset punya scope/validasi terpisah |
| HTTP API | `src/commands/up.rs::router`, `ui/src/api.ts`, `ui/src/queries/client.ts` | Mount endpoint research; reuse client transport/error dan query scoping; tambah penanganan konflik revision terstruktur |
| Discovery | `src/client.rs`, `src/config.rs`, `src/commands/discover.rs`, `src/commands/paper.rs` | Adapter discovery existing dipakai untuk eksplorasi; formal run baru tidak memakai status job tren |
| Harness/model | `src/local/harness/`, `src/local/chat/`, `src/local/local_models.rs`, `ui/src/components/ModelPicker.tsx` | Model tetap konfigurasi bantuan; wawancara manual tidak bergantung readiness agent |
| Reader dan file | `src/local/files.rs`, `ui/src/components/FileViewer.tsx`, `ui/src/components/PdfPreview.tsx`, `ui/src/components/Md.tsx` | Reuse tampilan setelah menambahkan resolver source artifact yang memvalidasi project; jangan memberi akses abs tanpa scope |
| Bantuan/panel | `ui/src/components/ResearchAssistence.tsx`, `ui/src/researchPanels.ts`, `ui/src/components/ResearchBrowser.tsx` | Ambil komponen yang cocok; konteks bantuan baru harus project/version scoped, bukan memakai job demo secara implisit |
| UI style/i18n | `ui/src/theme.css`, `ui/src/tailwind.css`, `ui/project.inlang/settings.json`, `ui/messages/en.json`, `ui/src/components/ui/`, `ui/src/components/Header.tsx` | Bahasa sederhana, tema light dan token existing. Base locale saat ini en; katalog id belum ada. Copy Indonesia pada workflow existing sebagian hardcoded; tentukan penanganan copy baru yang konsisten dan generate melalui build |
| Dokumen existing | `src/local/latex.rs`, `src/local/overleaf.rs`, `ui/src/chatRendering.ts`, `ui/src/researchWorkflow.ts` | Tetap tersedia; bukan substitusi untuk audit dukungan klaim/ekspor review |
| Localhost | `Jalankan-VERA-Localhost.cmd`, `ui/vite.config.ts`, `build.rs` | Instance development terisolasi; GNU fallback tersedia; build UI normal menjaga dist |

## P0 — selesai

Deliverable: `docs/research-workflow/repo-audit.md`, berkas ini, `docs/research-workflow/decisions/001-local-workflow-and-reviewer-identity.md`, dan [status tahap](README.md). Tidak ada migrasi atau perubahan perilaku.

## P1 — proyek dan arah kajian persisten

**Prasyarat:** audit P0 dan keputusan ADR 001. **Hasil:** proyek riset non-demo, jawaban wawancara, pilihan fokus, riwayat brief dan resume. Batas tahap: protokol, pencarian formal, screening dan artikel lengkap belum tersedia.

| Berkas | Status | Pekerjaan |
|---|---|---|
| `src/local/mod.rs` | Existing | Daftarkan domain research_workflow |
| `src/local/research_workflow/mod.rs` | Baru | DTO project, actor lokal, activity/completion, revision/error domain; koordinasi gate |
| `src/local/research_workflow/direction.rs` | Baru | Validasi jawaban/candidates maksimal tiga, pilihan/alasan, PCC dengan Population yang dapat tidak relevan, review-type fit dan uncertainty |
| `src/store/research_workflow.rs` | Baru | CRUD project, snapshot direction, idempotency/event dalam transaksi; migrasi additive teruji dan backup bila mengubah data |
| `src/store.rs` | Existing | Registrasi storage dan migrasi berversi; periksa PRAGMA user_version existing dahulu |
| `src/commands/up/research_workflow.rs` | Baru | Handler HTTP project/direction; 409 currentRevision; guard stopping/moving; validasi input dan project identity |
| `src/commands/up.rs` | Existing | Daftarkan handler/route; hindari menumpuk seluruh domain di router besar |
| `ui/src/features/research-workflow/api.ts` | Baru | Client/types workflow dan error conflict dengan draft yang dipertahankan |
| `ui/src/features/research-workflow/ResearchProjectsPage.tsx` | Baru | Buat/buka proyek, tiga titik masuk, akses kembali ke legacy |
| `ui/src/features/research-workflow/ResearchWorkspace.tsx` | Baru | Shell, tahap aktif, navigasi dan penjelasan tahap belum tersedia; panel bantuan opsional |
| `ui/src/features/research-workflow/direction/DirectionInterview.tsx` | Baru | Maksimal tiga pertanyaan per layar, kembali/koreksi/konfirmasi, tanpa ketergantungan AI |
| `ui/src/features/research-workflow/direction/DirectionBrief.tsx` | Baru | Ringkasan yang dapat dikoreksi, seed source manual berprovenance, pilihan/alasan dan ketidakpastian |
| `ui/src/features/research-workflow/direction/interview.ts` | Baru | Aturan cabang pertanyaan deterministik dan definisi istilah; bukan menebak next state dari teks model |
| `ui/src/features/research-workflow/persistence.ts` | Baru | Writer per project, status saving/saved/error/conflict, retry operation key dan latest unsaved draft |
| `ui/src/features/research-workflow/navigation.ts` | Baru | Validasi route/activity dan resume riset terpisah dari task/pane coding |
| `ui/src/routes/research.tsx`, `ui/src/routes/research.index.tsx`, `ui/src/routes/research.$researchProjectId.tsx` | Baru | Route `/research` dan project riset; loader/query memvalidasi identitas dan flag lokal |
| `ui/src/routeResume.ts`, `ui/src/routePages.tsx` | Existing | Hubungkan entry/resume riset yang diaktifkan tanpa merusak resume/onboarding coding. Default AI onboarding lama tidak menjadi syarat arah manual baru |
| `ui/src/components/VeraLandingPage.tsx`, `ui/src/components/StartupSplash.tsx` | Existing | Hubungkan pintu masuk jelas bila dibutuhkan; pertahankan landing dan kelanjutan workspace |
| `ui/src/api.ts`, `ui/src/queries/client.ts` | Existing | Reuse/export transport yang diperlukan dan scoping; error 409 tidak dikaburkan menjadi error generik |

API baru yang dipilih: `GET/POST /api/research/projects`, `GET /api/research/projects/{id}`, `PUT /api/research/projects/{id}/direction`, dan endpoint aktivitas jika diperlukan transaksi terpisah. `expectedRevision` serta `operationId` wajib pada mutasi; actor berasal dari backend. Read/reopen tidak menambah revision. Belum ada endpoint baru yang diimplementasikan pada P0.

Pertanyaan mencakup minat/pengalaman, fenomena, konsep, tujuan pemetaan, istilah/sumber awal, kandidat dan arah. Jalur sudah punya topik mengisi titik awal tanpa memalsukan jawaban; jalur instruksi menyimpan teks asal dan pilihan pemetaan, dengan pemetaan keluaran penuh di P2. Saat tanpa model, kandidat dapat dirumuskan manual; tidak menampilkan rekomendasi tanpa sumber asal atau menyatakan eksplorasi telah terjadi.

**Test baru:** unit domain Rust dalam modul direction/storage; `ui/tests/researchDirection.test.mjs`, `ui/tests/researchWorkflowPersistence.test.mjs`, `ui/tests/researchWorkflowNavigation.test.mjs`, `ui/tests/researchWorkflowUI.test.mjs`. Gunakan pola test Node existing dan komponen fixture bila sesuai.

**Gate:** A01 create→answer→save→reopen/restart→resume menjaga jawaban/pilihan/revision; A02 gagal/ack hilang/retry tidak menghapus input atau menggandakan snapshot; A03 belum tahu topik tetap dapat mulai; A24 manual saat AI gagal; bagian P1 A27/A28; legacy reopen dan konflik antarjendela. Tulis test gagal sebelum perubahan perilaku seperti dokumen 11. Browser localhost harus menguji new/resume/error terpisah dari unit test storage.

## P2 — rencana kajian dan draft awal

Depends P1. Baru: `src/local/research_workflow/protocol.rs`, `src/store/research_protocol.rs`; frontend `ui/src/features/research-workflow/protocol/ProtocolEditor.tsx`, `protocol/AssignmentMapping.tsx`, `protocol/ProtocolPreview.tsx`, `draft/InitialDraft.tsx`. Integrasi existing: store/router/API, shell dan brief P1. Baru test `ui/tests/researchProtocol.test.mjs`, domain/snapshot/amendment tests di Rust.

Simpan ProtocolVersion, QueryPlan, ChartingPlan, executionStatus dan hash; `computeImpact` dari perubahan brief/PCC/rencana. Registrasi kosong tetap kosong. Draft awal memisahkan rencana dan kegiatan aktual. Pemetaan instruksi pilihan tidak muncul di jalur umum. Preview/Markdown tersedia; pemetaan nomor halaman final menunggu P7.

Gate A04/A05, A29 dan bagian P2 A27/A28; workflow tanpa instruksi tetap lengkap untuk tahap rencana. Tidak menyatakan A27 end-to-end seluruh roadmap selesai setelah P2.

## P3 — pencarian nyata dan impor

Depends P2. Baru: `src/local/research_workflow/search.rs`, `src/local/research_workflow/providers/mod.rs`, `providers/scopus.rs`, `src/local/research_workflow/import.rs`, `src/store/research_search.rs`; frontend `search/SearchWorkspace.tsx`, `search/ImportPreview.tsx` di bawah feature root. Existing: `src/client.rs`/`src/config.rs` dan pengaturan layanan, bukan chat untuk API key. Baru test UI `ui/tests/researchSearch.test.mjs`; contract/pagination/import tests dalam modul Rust.

Verifikasi dokumentasi provider primer pada saat coding; simpan tanggal/capabilities/entitlement. SearchRun menyimpan approval, original/executed query, purpose, actual received count, reported total, raw hashes dan checkpoint. Occurrence terpisah dari normalized record. RIS/BibTeX/CSV menyimpan original file, preview errors dan unknown fields. Existing trend job hanya exploratory; promosi harus membuat run formal baru eksplisit. Gate A06–A09, nol hasil, cancelled dan unavailable; live verification hanya bila akses sah tersedia.

## P4 — deduplikasi dan seleksi independen

Depends P3 **dan implementasi identitas pada ADR 001**. Baru: `src/local/research_workflow/access.rs`, `selection.rs`, `fulltext.rs`, `ledger.rs`; `src/store/research_access.rs`, `research_selection.rs`; frontend `selection/SelectionWorkspace.tsx`, `selection/ConflictResolution.tsx`, `selection/ReviewerAccess.tsx`. Integrasi `src/commands/up/research_workflow.rs` dan batas transport `src/commands/up_remote.rs` harus diuji; jangan menganggap token SSH adalah reviewerId. Baru `ui/tests/researchSelectionWorkflow.test.mjs`; tests HTTP multi-identity dalam handler Rust.

Simpan canonical/duplicate cluster dan undo, selection set immutable, keputusan awal manusia, adjudikasi dan retrieval status. Jangan expose keputusan B pada respons A sebelum syarat reveal terpenuhi. Fulltext not_retrieved tidak masuk excluded_after_fulltext. Ledger dihitung dari objek, unit report/study terpisah. Gate A10–A13/A25, fixture ledger dokumen 13 dan endpoint/file/job scope langsung. Jika identitas atau reviewer kedua belum tersedia, fitur berlabel latihan dan gate review lengkap tetap belum lulus.

## P5 — catatan sumber dan verifikasi

Depends P4. Baru: `src/local/research_workflow/charting.rs`, `src/store/research_charting.rs`; frontend `charting/ChartingWorkspace.tsx`, `charting/ChartingForm.tsx`, `charting/SourceLocator.tsx`. Reuse PdfPreview/Md melalui resolver fulltext yang scoped, bukan reader file umum tanpa batas. Baru `ui/tests/researchCharting.test.mjs` dan schema/cell tests Rust.

SchemaVersion, pilot, missing states, cell revisions/proposal dan locator/hash. Verifikasi anggota kedua mengikuti protokol; appraisal hanya jika dipilih dan dengan instrumen sesuai. Gate A14–A16/A24 dan perubahan schema menandai rows needs_review.

## P6 — peta temuan dan editor draft

Depends P5; editor kerangka awal sudah ada sejak P2. Baru: `src/local/research_workflow/synthesis.rs`, `draft.rs`, `impact.rs`; `src/store/research_synthesis.rs`, `research_draft.rs`; frontend `synthesis/SynthesisWorkspace.tsx`, `draft/DraftEditor.tsx`, `draft/ClaimEvidencePanel.tsx`. Baru `ui/tests/researchSynthesis.test.mjs`, `ui/tests/researchDraft.test.mjs` dan domain tests Rust.

Hitungan/denominator deterministik, source/row/cell revisions dipin, codebook dikonfirmasi. Claim support terpisah dari metadata DOI; stale propagation tidak menghapus tulisan. Proposal tulisan diterapkan melalui revisi. Gate A17–A19, kosong tanpa hasil rekaan dan dampak perubahan protokol/seleksi/charting.

## P7 — audit dan ekspor

Depends P6 untuk artikel lengkap; keluaran rencana pilihan dapat dikembangkan setelah P2. Baru: `src/local/research_workflow/audit.rs`, `export.rs`, `src/store/research_exports.rs`; frontend `audit/AuditWorkspace.tsx`, `audit/ExportPreview.tsx`. Baru `ui/tests/researchAudit.test.mjs`; ledger/reference/manifest/export-open tests di Rust atau script fixture yang sesuai format akhir.

Markdown/DOCX, appendix, checksums, dependency snapshots, secret/PDF exclusion dan render page mapping. Jangan memilih library besar sebelum kebutuhan eksportir diverifikasi. Existing LaTeX/Overleaf tetap terpisah, tidak wajib untuk pengguna review. Gate A20–A22 dan walkthrough utama/perubahan/error. Rollout flag dapat kembali ke legacy tanpa hapus data. Distribusi desktop memerlukan instruksi tahap tersendiri dari pengguna; P7 roadmap tidak membatalkan batas localhost saat ini.

## P8 — bantuan adaptif dan evaluasi belajar

Depends P1–P7 stabil. Baru: `src/local/research_workflow/assistance.rs`, `learning.rs`, `src/store/research_learning.rs`; frontend `assistance/StageAssistant.tsx`, `assistance/LearningDecisions.tsx`. Reuse runtime harness/chat melalui scope capability sempit. Baru `ui/tests/researchAssistance.test.mjs` dan stale/proposal/prompt-injection tests Rust.

LearningDecision/AssistanceEvent dapat mulai dicatat pada keputusan penting tahap awal; P8 menambah policy bantuan, transfer dan pengukuran terpisah. Pin model/prompt/policy dalam evaluasi. Gate A23/A24/A26; tidak mengklaim kompetensi dari mutu draft, klik atau durasi, dan tidak melatih foundation model.

## Pemeriksaan setiap tahap berikutnya

1. Catat HEAD/diff, baca spesifikasi tahap dan konfirmasi dependency gate dari hasil aktual.
2. Tulis/jalankan test invariant yang belum ada sebelum perubahan perilaku; implementasikan satu tahap saja.
3. Jalankan unit domain/UI yang relevan, `pnpm lint:styles`, `pnpm build`; untuk Rust gunakan fmt/test dan clippy sesuai perubahan/CI. GNU fallback mengikuti audit lingkungan; jangan menyatakan default MSVC lulus bila hanya GNU yang dijalankan.
4. Jaga generated bundle lewat tool build dan periksa diff. Uji browser localhost untuk acceptance UI; test fixture tidak membuktikan provider live atau reviewer independen.
5. Perbarui status tahap dengan hasil, file, migrasi, batas verifikasi dan dependency berikutnya. Jangan menandai P1–P8 selesai dari baseline P0.


## Pembaruan pelaksanaan P5–P6

Path aktual charting/sintesis berada di `src/local/research_workflow/evidence.rs`, `ui/src/features/research-workflow/evidence/` dan `draft/ManuscriptEditor.tsx`. Panel pendamping berada di `panels/ResearchPanel.tsx`; dropdown bersama di `ui/src/components/ui/Select.tsx`. Lihat [laporan P5–P6](p5-p6-delivery.md); path usulan sebelumnya tidak menyatakan bahwa file dengan nama usulan tersebut telah dibuat.
