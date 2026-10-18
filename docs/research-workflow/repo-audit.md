# Audit P0 — workflow riset mahasiswa VERA

Tanggal: 14 Oktober 2026, WIB. Spesifikasi: `VERA_Workflow_Codex_Pack`, rancangan 1.2.

## Ruang lingkup dan status

P0 membaca seluruh dokumen 00–14 dan README paket, memeriksa checkout, menjalankan baseline, dan menetapkan pemetaan implementasi. P0 tidak mengubah perilaku aplikasi. Target implementasi berikutnya adalah web localhost; pembuatan paket, penggantian instalasi, dan smoke test desktop berada di luar pekerjaan ini.

- Checkout: `C:\Project 2026\VERA`, branch `main`.
- HEAD: `3432a41174290670153eb818f877402dc5d67586`.
- Status awal: hanya `?? VERA_Workflow_Codex_Pack/`; tidak ada perubahan tracked. Paket pengguna dipertahankan.
- Instruksi yang ditemukan melalui `rg --files -g AGENTS.md`: `AGENTS.md` di root. Tidak ada AGENTS.md bertingkat dalam checkout yang ditemukan.
- Tidak dibuat commit, branch, PR, ataupun perubahan metadata GitHub. SHA di atas adalah baseline, bukan commit implementasi workflow.

## Pemahaman spesifikasi

Produk yang dituju adalah satu proyek kajian yang dapat dilanjutkan: arah → rencana → pencarian → seleksi → catatan sumber → sintesis → draft → audit/ekspor. Instruksi perkuliahan merupakan format keluaran pilihan. Pengguna boleh mulai dari minat tanpa mengetahui PCC atau memiliki topik. Bahasa sederhana mendahului istilah metode.

State pekerjaan akademik harus terpisah dari status job AI. Keputusan dan versi data menentukan gate; model menghasilkan proposal. Pencarian eksploratif tidak masuk hitungan formal. Dua reviewer berarti dua manusia dengan identitas dan keputusan independen. Teks yang belum diperoleh tetap tidak dinilai. Draft dapat dibuka sejak awal, tetapi hasil tidak diisi sebelum tersedia bukti. Perubahan hulu menandai pekerjaan terkait untuk ditinjau tanpa menghapus tulisan pengguna.

P0–P8 adalah tahapan implementasi, bukan label layar mahasiswa. P2 hanya menghasilkan rencana dan draft awal; kelulusan P2 tidak menyatakan review lengkap sudah dilakukan.

## Stack dan perintah nyata

| Komponen | Bukti checkout/lingkungan |
|---|---|
| Rust CLI/backend | `Cargo.toml`: `openresearch-cli` 0.2.17, bin `orx`, edition 2021; Axum 0.8, rusqlite 0.32 bundled, Tokio, serde, rust-embed |
| Frontend | `ui/package.json`, `ui/vite.config.ts`: React, TypeScript, TanStack Router/Query, Vite, Tailwind 4, Paraglide |
| Dependency terpasang | React 19.2.7; TypeScript 5.9.3; Vite 6.4.3; Router 1.170.32; Query 5.102.8. Ini hasil pembacaan package.json dalam node_modules, bukan versi minimum manifest |
| Runtime lokal | Node 24.13.0; perintah pnpm melaporkan 11.25.0 melalui shim runtime Codex; Rust 1.99.0 |
| Toolchain | Default `stable-x86_64-pc-windows-msvc`; GNU Windows juga terpasang. `link.exe` tidak ditemukan dalam PATH shell ini |
| CI | `.github/workflows/ci.yml`: katalog i18n, style, dev-slot, release notes, typecheck, unit UI, kesesuaian dist, fmt, clippy, build/test Rust; job platform dan release mempunyai pemeriksaan tambahan |

Tidak memasang ulang dependency atau mengubah lockfile selama P0. Daftar hasil aktual ada pada bagian baseline; P0 tidak mengklaim keseluruhan CI lintas platform lulus.

## Routing dan pengalaman awal

1. `ui/src/main.tsx` memasang `StartupSplash`, QueryClient dan RouterProvider. `ui/src/components/StartupSplash.tsx` menampilkan landing sebelum workspace.
2. `ui/src/routes/__root.tsx` menggunakan `RuntimeRoot` dari `ui/src/RemoteRuntime.tsx` untuk konteks lokal/SSH. `ui/src/routes/index.tsx` membuka `ResumeGlobal`.
3. `ui/src/routePages.tsx` menangani resume dan onboarding. `ui/src/routeResume.ts` mencari proyek/sesi coding dan lokasi tersimpan.
4. `ui/src/routes/projects.$projectId.tsx` memasang `App`. Di `ui/src/App.tsx::App`, hanya ID tepat `DEMO_PROJECT_ID` yang membuka `ResearchDemoWorkspace`; proyek lain membuka `LocalWorkspaceApp`.
5. `ui/src/api.ts` menetapkan `DEMO_PROJECT_ID = demo_nanochat_v1`. `src/local/demo.rs` masih memiliki seed nanochat dan identitas historis yang sama. Jangan mengganti ID atau seed sebagai cara membuat proyek riset nyata.
6. `ui/src/components/ResearchDemoWorkspace.tsx` membungkus `ResearchFolders`; tiga tahapnya adalah bidang/fokus, pertanyaan lanjutan, dan tinjauan tren. Form awal mensyaratkan bidang serta fokus dan membutuhkan harness siap. Ini belum memenuhi jalur mulai dari minat/manual tanpa AI pada paket baru.
7. `ui/src/workspaceState.ts::safeLocation` dan `src/workspace_state.rs::valid_location` hanya mengenal tujuan coding tertentu. Route riset baru harus mempunyai validasi/resume sendiri atau perluasan yang diuji di kedua sisi; menambah route saja tidak cukup.

## Persistence, revision dan migrasi existing

- `src/store.rs::Store::open_at_with_move_lock` membuka `orx.db`, memakai WAL/busy timeout, membuat tabel dan menjalankan migrasi existing. Tidak ada direktori migrasi terpisah yang menjadi mekanisme utama.
- `src/store.rs::data_dir`: ORX_DATA_DIR → pilihan dataDir yang tersimpan → XDG_DATA_HOME/openresearch → direktori default historis.
- `src/config.rs::config_dir` tetap memakai nama `openresearch`; VERA_APP_HOME dan XDG_CONFIG_HOME memengaruhi lokasi. Nama historis merupakan kompatibilitas yang harus dipertahankan.
- `src/local/model.rs::LocalProject` adalah proyek repository/eksperimen; `src/local/projects.rs::create_project` mempersiapkan repository dan Git. Objek tersebut belum menjadi proyek scoping review bebas Git.
- `src/store/research_folders.rs`: `ResearchFolder { id, name, brief, jobId, selection, revision }`; tabel `research_folders` menyimpan dokumen JSON dan revision. INSERT awal dan UPDATE dengan revision yang diharapkan menolak penimpaan konflik. Data yang tersedia hanya versi mutakhir, belum riwayat DirectionBriefVersion.
- `ui/src/researchFolders.ts::ResearchFolderWriter` menserialisasi/coalesce save per folder, menyimpan revisi balasan, dan mempertahankan draft yang gagal untuk retry. `ui/src/components/ResearchFolders.tsx` menangani pemilihan folder, kegagalan save, retry dan konflik.
- localStorage menyimpan pilihan folder/ID pemulihan job; dokumen folder sendiri sudah di backend. Migrasi lama pada komponen memakai `vera:research-demo:job:v2`, bukan tabel workflow baru.
- `src/local/research.rs` menyimpan `research-jobs/<uuid>.json`. Job yang masih running dari instance server lain berubah menjadi error saat dibaca; ini bukan resume checkpoint. Job tidak membawa identitas proyek riset dan sesi agent memakai proyek demo tetap.

P1 harus memakai transaksi SQLite untuk project, revisi brief dan event; tidak mengambil file JSON job sebagai sumber kebenaran tahap. Konflik folder existing saat ini dipetakan ke bad request dengan pesan, belum respons 409 terstruktur beserta currentRevision yang diminta kontrak baru.

## API, konektor dan bantuan AI

| Kemampuan | Klasifikasi | Sumber nyata dan batas |
|---|---|---|
| CRUD proyek repository, eksperimen, runs, artifacts | Tersedia | `src/commands/up.rs::router`, `src/local/projects.rs`, `src/store.rs`; pertahankan jalur coding |
| Folder riset lokal + optimistic revision | Tersedia, perlu diperluas | `/api/research/folders`, `src/store/research_folders.rs`; belum project/stage/version history |
| Job fokus dan tren | Tersedia, perlu dipisahkan dari workflow | `/api/research/jobs`, `src/local/research.rs`; job complete bukan bukti completion akademik |
| Discovery akademik | Tersedia dalam source | `src/client.rs`: alphaXiv, OpenAlex, bioRxiv, PubMed, Crossref. Tidak diuji live pada P0 |
| Scopus | Belum tersedia pada jalur yang diaudit | Tidak ditemukan adapter/config Scopus pada `src`/`ui/src`; verifikasi dokumentasi dan entitlement dijadwalkan P3 |
| SearchRun formal + pagination/checkpoint/occurrences | Belum tersedia | Job tren membatasi hasil, menggabungkan query, dan dedup judul; bukan ledger review formal |
| RIS/BibTeX/CSV import review | Belum tersedia pada workflow | Ekspor CSV bukti existing bukan importer bibliografi |
| Model/harness lokal dan cloud | Tersedia | `src/local/harness/`, `src/local/chat/`, `src/local/local_models.rs`, `ui/src/components/ModelPicker.tsx`, `docs/local-models.md` |
| Judgement/proposal berversi | Belum tersedia sebagai domain workflow | Jangan menafsirkan hasil pemeriksa AI sebagai konfirmasi manusia |

`src/local/research.rs::run` menyusun query melalui model, mencari maksimal 25 hasil per query/provider, menggabungkan hasil, menyaring tanggal dan dedup judul. Jika semua sumber yang direncanakan gagal, ada fallback Crossref dengan log/keterbatasan. Reuse hanya sebagai eksplorasi dengan provenance. Pencarian formal tidak boleh memakai fallback provider/query tanpa persetujuan atau menyamakan jumlah hasil terbatas dengan total provider.

`src/client.rs::LitHit` cukup untuk tampilan discovery, tetapi belum memuat seluruh metadata, raw response, author/year provenance dan identitas occurrence yang diperlukan review formal. `src/config.rs` menyimpan konfigurasi endpoint; tidak membaca atau menyalin nilai credential pengguna pada audit ini.

## Identitas dan otorisasi

`src/commands/up.rs::router` memakai loopback guard dari `src/commands/up_remote.rs`. `require_remote_auth` mempunyai attachment/callback token untuk workspace SSH. Ini kontrol koneksi, bukan user identity reviewer atau project membership. `LocalProject.github_owner` adalah metadata repository, bukan owner manusia untuk screening.

Tidak ditemukan membership reviewer, peran adjudikator, assignment independen atau concealment keputusan pada model/tabel/router yang diaudit. Deployment P1 tetap satu operator lokal. Keputusan dan prasyarat P4 dicatat dalam [ADR 001](decisions/001-local-workflow-and-reviewer-identity.md). A25 dan gate dua reviewer belum dinyatakan terpenuhi oleh deployment sekarang.

## Reader, editor, sitasi dan ekspor

- `ui/src/components/FileViewer.tsx` menampilkan Markdown/HTML rendered, source toggle dan penyuntingan file; `PdfPreview.tsx` adalah pembaca PDF. `src/local/files.rs` dan route file pada `up.rs` mengelola akses/penulisan berkas. Fasilitas ini mengikuti proyek coding; proyek riset baru memerlukan resolver artefak yang memvalidasi project scope.
- `src/local/latex.rs`, `src/local/latex_templates.rs`, `src/local/overleaf.rs` dan `overleaf_live.rs` adalah kemampuan dokumen existing. Kompilasi LaTeX bukan pipeline ekspor artikel DOCX/checklist dengan nomor halaman final.
- `ui/src/researchWorkflow.ts` menghasilkan catatan Markdown, SVG dan CSV bukti aktual; `ResearchDemoWorkspace.tsx` menyediakan download berkas tersebut. CSV memiliki BOM/escaping formula. Job JSON tersimpan di backend, tetapi bukan tombol ekspor paket JSON/ZIP pada komponen yang diaudit.
- `ui/src/chatRendering.ts::transcriptMarkdown` mengekspor percakapan. Ini belum editor bagian artikel, bibliografi APA, claim-evidence graph atau audit dukungan sitasi.
- Screening dua manusia, charting terverifikasi, synthesis snapshot, manuscript audit dan export manifest baru belum tersedia sebagai domain workflow.

## Mode localhost

`Jalankan-VERA-Localhost.cmd` memakai backend `127.0.0.1:4901` dan Vite `127.0.0.1:5201`. Direktori dev dihitung dari hash root checkout di `%LOCALAPPDATA%\VERA\dev-slots\<hash>`, dengan data, cache dan config terisolasi. Launcher menyetel ORX_BACKEND/ORX_UI_DEV_ORIGIN; fallback toolchain GNU dan VERA_SKIP_WINDOWS_ICON sudah ada.

`ui/vite.config.ts` sendiri default proxy ke port 4791 bila ORX_BACKEND tidak disetel. Untuk menjalankan proyek nanti, gunakan launcher repo, bukan mengasumsikan `pnpm dev` tersambung ke 4901. P0 tidak memulai server atau menguji interaksi browser. Build UI memproduksi dist; tidak membangun/mengganti paket VERA.exe.

## Baseline 14 Oktober 2026

| Perintah | Hasil aktual |
|---|---|
| `pnpm lint:styles` di ui | Exit 0; style token lint passed |
| `pnpm test` di ui | Exit 0; 246 passed, 0 failed/skipped |
| `pnpm build` di ui | Exit 0; lint i18n, generator Paraglide/routes, TypeScript dan Vite selesai. Dist sesuai checkout setelah build |
| `cargo fmt --all --check` | Exit 0 |
| `cargo test --locked` | Exit 1 sebelum test: linker `link.exe` tidak ditemukan pada toolchain MSVC default |
| GNU fallback: `$env:VERA_SKIP_WINDOWS_ICON='1'; cargo +stable-x86_64-pc-windows-gnu test --locked --target x86_64-pc-windows-gnu` | Exit 0; 967 unit test passed, 3 ignored; integration invocation_gate_cli 1, logs_cli 4, run_supervision 1 passed; up_auto_restart 0 test pada Windows |
| `node --test scripts/dev-slot.test.mjs` | Exit 0; 7 passed, 2 skipped (sqlite3 executable dan locking macOS/Linux tidak tersedia) |
| `python scripts/test_release_notes.py` | Exit 0; 6 test OK. Warning fixture gh gagal listing issue bukan kegagalan suite |

Warning build existing: circular dependency generator router, dua warning optimisasi CSS `::highlight`, dan bundle lebih dari 500 kB. Tidak diperbaiki dalam P0 yang membatasi perubahan pada dokumentasi. Tidak ada dependency baru.

Pemeriksaan akhir `git status --porcelain -- ui/dist ui/src/routeTree.gen.ts ui/src/paraglide` tidak mengeluarkan perubahan: build baseline tidak meninggalkan drift tracked pada bundle/generated source. Katalog yang ada menggunakan baseLocale en dan belum mempunyai id pada `ui/project.inlang/settings.json`; sebagian copy riset Indonesia ditulis langsung di komponen. P1 harus memilih penanganan copy baru yang konsisten tanpa mengarang path `ui/messages/id.json` sebagai berkas existing.

Belum dijalankan: clippy, launcher fmt/clippy, build release, pemeriksaan channel telemetry release, instalasi dependency frozen, job Linux/AppImage/installer Windows, konektor live, walkthrough browser. Baseline bukan klaim kelulusan seluruh CI atau acceptance P1–P8.

## Handoff

Gate P0 lulus: sumber routing/storage/provider ditemukan, baseline dan keterbatasannya dicatat, pemetaan tahap serta keputusan kompatibilitas/identitas tersedia. Default MSVC tetap gagal karena linker; jalur GNU localhost lulus. Tidak ada baseline test failure pada jalur GNU yang dijalankan.

Peta implementasi: [implementation-map.md](implementation-map.md). Kontrak/kompatibilitas: [ADR 001](decisions/001-local-workflow-and-reviewer-identity.md). Tahap berikutnya P1; tidak ada perubahan UI yang dinyatakan selesai oleh audit ini.
