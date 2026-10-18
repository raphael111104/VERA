# Implementasi P1–P4 pada web localhost

Tanggal: 14 Oktober 2026, WIB. Baseline Git: `3432a41174290670153eb818f877402dc5d67586`. Perubahan belum di-commit. Paket spesifikasi asli tetap utuh.

## Perilaku yang dapat dicoba

Buka `http://127.0.0.1:5201/research`, atau pilih **Mulai kajian baru** pada landing VERA. Route baru tidak memerlukan onboarding model AI atau repository Git. **Workspace sebelumnya** membuka jalur lama; proyek dan folder lama tidak dikonversi otomatis.

| Tahap | Implementasi |
|---|---|
| P1 | Proyek lokal non-demo, tiga titik masuk, enam kelompok wawancara manual, maksimum tiga kandidat, pemilihan fokus/alasan, definisi PCC, pemeriksaan tujuan pemetaan, konfirmasi arah, ringkasan arah, autosave, draft browser untuk pemulihan, optimistic revision, retry operation yang sama, dan riwayat snapshot |
| P2 | Editor rencana, aturan sumber, query/provider, seleksi/charting/appraisal/sintesis yang direncanakan, status registrasi nyata, pilihan format tugas, alasan amendment, pemilihan versi acuan dan penandaan seleksi usang. Pratinjau draft awal dan unduh Markdown tersedia |
| P3 | Adapter OpenAlex dan Scopus, query formal sesuai acuan dan approval, run eksploratif/formal terpisah, satu halaman per request, total provider terpisah dari record aktual, checkpoint/resume, retry terbatas untuk 429, raw response/hash, impor CSV/RIS/BibTeX, preview/pemetaan kolom, error parsial dan original-file provenance |
| P4 | Kandidat duplikasi DOI/judul, merge eksplisit dan undo, pembekuan set berversi, latihan satu reviewer, undangan capability untuk dua identitas manusia, API concealment, keputusan append-only, konflik/adjudikasi, pencatatan retrieval, unggah PDF legal maksimal 4 MB, akses PDF scoped dan ledger record/laporan |

P1–P4 adalah implementasi kemampuan aplikasi, bukan klaim bahwa suatu review akademik sudah selesai. P4 tidak meluluskan prosedur dua manusia hanya dari adanya dua token. Identitas manusia berbeda tetap memerlukan deklarasi dan pelaksanaan nyata. Charting terverifikasi, sintesis, editor artikel lengkap, audit artikel/DOCX dan pemetaan halaman final belum dikerjakan (P5–P7).

## Pemetaan akhir dan perubahan terhadap rancangan P0

- Domain: `src/local/research_workflow/mod.rs`, `direction.rs`, `protocol.rs`, `search.rs`, `import.rs`, `selection.rs`; didaftarkan dalam `src/local/mod.rs`.
- Persistence: `src/store/research_workflow.rs`, diintegrasikan melalui `src/store.rs`. Enam tabel additive: `rw_schema`, `rw_projects`, `rw_versions`, `rw_operations`, `rw_members`, `rw_artifacts`. PRAGMA user_version untuk chat lama tidak diubah. Skema workflow memiliki marker versinya sendiri.
- State aktif menyimpan aggregate proyek beserta direction, protocol, run, keputusan dan dependensinya. Riwayat menyimpan snapshot awal dan delta immutable bertanda versi: perubahan field serta append pada array. Replay menyusun kembali snapshot revisi yang diminta; korpus yang tidak berubah tidak disalin ulang pada setiap simpan/keputusan. Cache operation hanya menyimpan pointer revisi. Pembaca tetap menerima snapshot penuh lama yang sudah tersimpan. Ini menggantikan usulan banyak tabel per tahap pada P0 untuk cakupan P1–P4; pemisahan storage per domain dapat dilanjutkan jika dibutuhkan.
- HTTP: `src/commands/up/research_workflow.rs`, dipasang di router `src/commands/up.rs`. `GET/POST /api/research/projects`; `GET/POST /api/research/projects/{id}`; `POST /api/research/projects/{id}/import-preview`; `GET /api/research/projects/{id}/artifacts/{file}`. Mutasi memakai command bertipe action/data, expectedRevision dan operationId, bukan satu endpoint PUT untuk setiap form. Gate, permission dan revisi tetap divalidasi backend.
- UI: `ui/src/features/research-workflow/` berisi API/types/persistence/shared, project list, workspace shell, direction interview/brief, protocol editor, search workspace, selection workspace dan initial draft. File route `research.tsx`, `research.index.tsx`, `research.$researchProjectId.tsx`; routeTree dihasilkan generator.
- Entry: `VeraLandingPage.tsx` menambahkan pintu masuk; `StartupSplash.tsx` mengizinkan deep link `/research` langsung membuka workspace. Resume aktivitas riset disimpan di proyek backend dan tidak mencampur validator task/pane coding.
- Bahasa Indonesia pada fitur baru mengikuti pola copy riset existing. Tidak menambahkan katalog locale palsu atau mengedit Paraglide generated output.

## Data, kompatibilitas dan akses

Migrasi hanya menambah tabel. Tidak memindah/menghapus data OpenResearch, SSH, local_projects, research_folders, atau research-jobs. Tidak ada backfill brief/protokol dari nilai perkiraan. Database fixture dan data development dipisahkan dari instalasi desktop.

Pemilik memakai capability acak di browser. Backend menyimpan hash dan membatasi daftar/baca/mutasi proyek berdasarkan capability tersebut. Undangan reviewer menyimpan hash, project scope, actor, nama, masa berlaku 30 hari dan status pencabutan. ReviewerId berasal dari hasil autentikasi backend. Respons proyek menyaring keputusan orang lain sebelum submit kedua pihak; riwayat tidak memberikan dokumen snapshot mentah kepada reviewer. Artifact PDF memvalidasi project capability sebelum mengembalikan bytes.

Kunci pemilik dapat diunduh/dipulihkan lewat kontrol terpisah di daftar proyek. Ini ekspor credential yang dilakukan eksplisit oleh pemilik, bukan bagian ekspor penelitian. Gunakan browser/profil terpisah untuk dua reviewer. Pemilik OS, administrator, orang yang memperoleh kunci, dan browser dengan akses storage pemilik tetap pihak tepercaya. Deployment tidak dibuka ke jaringan; kolaborasi multi-mesin/SSH reviewer belum divalidasi. Tidak ada akun produk, organisasi, layanan cloud terkelola atau fitur LMS baru.

Rollback tampilan dilakukan dengan kembali ke **Workspace sebelumnya**. Tabel baru tidak perlu dihapus. Feature flag konfigurasi khusus belum ditambahkan; jalur lama dan baru tersedia berdampingan. Paket desktop lama tidak diganti.

## Hasil pemeriksaan aktual

| Pemeriksaan | Hasil |
|---|---|
| `cargo fmt --all --check` | Lulus |
| GNU `cargo test --locked --target x86_64-pc-windows-gnu` | 973 unit test lulus, 3 ignored; 6 integration test lulus; test up_auto_restart tidak berjalan pada Windows |
| Pengujian terarah workflow setelah perbaikan penyimpanan akhir | 7 test lulus: reopen/retry, rekonstruksi revisi lama, pertumbuhan riwayat tanpa penggandaan korpus, ledger, parser dan partial pagination; HTTP acceptance juga lulus ulang |
| GNU `cargo clippy --locked --target x86_64-pc-windows-gnu --all-targets -- -D warnings` | Lulus |
| `pnpm test` di ui | 248 lulus, tanpa kegagalan/skipped |
| `pnpm lint:styles` | Lulus |
| `pnpm build` | Lulus; i18n, generator, TypeScript dan Vite; ui/dist diperbarui oleh build |
| `python scripts/test_research_workflow.py --binary target/x86_64-pc-windows-gnu/debug/orx.exe` | Lulus menggunakan backend dan database terisolasi |
| Browser localhost | Create proyek, seluruh wawancara, konfirmasi arah, save/lock rencana, pencarian OpenAlex, ledger tanpa data formal, draft rendered dan reload/resume diperiksa |

Toolchain GNU mengikuti fallback launcher karena MSVC link.exe tidak tersedia pada shell awal. Binary debug standalone memerlukan WebView2Loader.dll; loader dari crate yang terpasang disalin ke direktori target debug untuk smoke test standalone. Tidak ada pemasangan/penggantian distribusi desktop.

HTTP acceptance menguji create/retry/restart/resume; 409 revision conflict; isolation capability; protocol lock; CSV malformed preview; tanggal/query impor tetap unknown; pemisahan eksploratif/formal; merge/undo; concealment reviewer; role denial; adjudikasi; not_retrieved bukan exclusion; PDF upload/akses; keputusan teks lengkap; invalidasi resolusi setelah koreksi; revoke; amendment/stale. Data HTTP merupakan fixture berlabel TEST, bukan publikasi atau review nyata.

Unit fixture ledger mengikuti dokumen 13: 200 formal, 30 duplicate, 170 screened, 120 title exclusions, 50 sought, 5 not retrieved, 45 fulltext assessed, 15 fulltext exclusions, 30 included reports. Tambahan 25 exploratory tidak mengubah counts. Studies tetap null. Contract test page memakai reported total 1000 dan 100 diterima; timeout tetap partial; retry tidak menggandakan occurrence.

## Batas verifikasi dan tindak lanjut

Satu pencarian OpenAlex nyata diuji melalui browser pada proyek **Uji localhost — Alur kajian**, query `AI higher education`: 25 record diterima, total yang dilaporkan provider 939932, status partial dan checkpoint tersedia. Ini hasil satu request pada waktu pengujian, bukan estimasi cakupan literatur, mutu, relevansi atau jumlah studi. Hitungan formal proyek tetap 0 karena run bersifat exploratory.

Scopus sudah memiliki adapter, namun credential/entitlement dan pencarian Scopus live belum diverifikasi. Gunakan SCOPUS_API_KEY (SCOPUS_INST_TOKEN bila diperlukan) dalam konfigurasi environment backend atau impor ekspor asli database. OpenAlex dapat memakai OPENALEX_API_KEY; API key tidak disimpan dalam query UI atau ekspor penelitian. Respons provider disanitasi terhadap credential yang dikonfigurasi sebelum disimpan.

Impor bibliografi adalah parser terbatas, bukan semua ekstensi/macro BibTeX. Preview wajib ditinjau. Pemetaan tugas saat ini berbentuk pilihan dan keterangan pemetaan; belum parser otomatis semua rubrik kampus, DOCX/checklist final atau pemetaan halaman. PDF diuji melalui API dengan fixture legal buatan; pembacaan ilmiah teks penuh oleh dua orang belum dilakukan. Pencarian formal lengkap, pergantian provider real-world, jaringan putus pada semua titik, dan kolaborasi dua manusia di mesin berbeda belum diklaim lulus.

## Dokumentasi provider yang diperiksa

- [Elsevier Scopus Search API](https://dev.elsevier.com/documentation/SCOPUSSearchAPI.wadl): endpoint, STANDARD view, API key/institution header dan cursor.
- [Elsevier API key settings](https://dev.elsevier.com/api_key_settings.html): entitlement dan batas page/view.
- [OpenAlex authentication](https://help.openalex.org/api/authentication/): bearer credential, keyless access, per_page dan rate limits.

Pemeriksaan dokumentasi: 14 Oktober 2026 WIB. Verifikasi kontrak fixture dan satu pencarian OpenAlex tidak membuktikan seluruh entitlement atau stabilitas pagination provider.
