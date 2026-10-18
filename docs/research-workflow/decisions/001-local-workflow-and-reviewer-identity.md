# ADR 001 — proyek riset lokal, kompatibilitas dan identitas reviewer

Tanggal: 14 Oktober 2026, WIB. Status: keputusan implementasi untuk roadmap; belum merupakan fitur yang berjalan. Baseline `3432a41174290670153eb818f877402dc5d67586`.

Update implementasi P1–P4: proyek lokal dan capability owner/reviewer sudah tersedia. Owner memakai capability acak browser yang dapat dicadangkan, bukan identitas instalasi anonim; ini menghindari endpoint bootstrap yang dapat memberikan hak owner kepada reviewer. Storage memakai aggregate snapshots `rw_versions` dan marker `rw_schema` tersendiri. Detail aktual dan batas localhost/administrator tepercaya pada [laporan implementasi](../p1-p4-delivery.md) menggantikan usulan yang berbeda di ADR awal ini. Kolaborasi multi-mesin dan pelaksanaan review oleh dua manusia nyata belum diverifikasi.

## Masalah

`LocalProject` membutuhkan repository/eksperimen. Folder riset yang sudah ada mempunyai data nyata tetapi hanya tampil melalui route demo, menyimpan brief empat kolom dan satu revision mutakhir. Tidak ada membership reviewer. Paket meminta workspace riset, versi keputusan dan review independen tanpa menambah akun produk/organisasi atau mengganti sistem lokal yang sudah dipakai.

## Alternatif

1. Menambah semua state ke ResearchDemoWorkspace: murah pada awalnya, tetapi mengikat proyek nyata ke ID demo dan membuat status AI menjadi status workflow.
2. Mengubah seluruh LocalProject menjadi proyek review: mengganggu kontrak Git, eksperimen dan pengguna lama.
3. Menambah domain research-workflow dalam Store SQLite yang sama, route tersendiri, dan menghubungkan kemampuan existing melalui adapter: dipilih.

## Proyek, route dan versioning

- Proyek riset baru memakai UUID dan tabel additive `research_projects`; tidak memerlukan repository Git. `LocalProject` dan `research_folders` existing tetap dapat dibuka melalui jalur legacy.
- Route baru yang direncanakan adalah `/research` dan `/research/$researchProjectId`. Route coding `/projects/...` dan ID demo historis dipertahankan. P1 menambahkan pintu masuk dan navigasi balik yang jelas, bukan mengandalkan URL yang diketik manual.
- State riset dipisahkan dari task/pane coding. Resume memvalidasi route, project identity dan aktivitas tersimpan. Jangan memasukkan URL riset ke validasi `safeLocation` existing tanpa memperbarui kontrak backend yang sesuai.
- `direction_brief_versions` menyimpan snapshot append-only; `research_events` menyimpan actor, revision dan jenis perubahan tanpa credential. Penyimpanan project/current activity, versi brief dan event dilakukan dalam satu transaksi dengan expectedRevision.
- Retry membutuhkan operation/idempotency key dan respons revision konsisten, termasuk saat server sudah menyimpan tetapi respons tidak diterima. Unique key mencegah dua brief dari retry yang sama. Conflict memberi HTTP 409 dan currentRevision; draft browser tetap dipertahankan untuk rekonsiliasi eksplisit.
- Koreksi menghasilkan versi baru. Gate deterministik berada di backend; navigation tidak mengesahkan tahap; hasil job/proposal tidak dapat mengubah completion langsung.

## Kompatibilitas dan rollback

Tidak mengonversi folder lama otomatis menjadi protokol atau project dengan keputusan rekaan. P1 boleh menawarkan salin eksplisit ke proyek baru dengan field asli, asal legacy dan ketidakpastian yang kosong; sumber lama tetap utuh. Tanpa tindakan pengguna, mode legacy tetap tersedia. Data job lama tidak dipromosikan ke formal SearchRun.

Skema baru mengikuti integrasi `Store::open_at_with_move_lock`, tetapi memakai migrasi berversi dan transaksi yang tidak menelan error DDL selain kondisi yang diketahui. Jangan menggunakan loop ALTER best-effort existing untuk menjamin keberhasilan migrasi baru. Periksa pemakaian PRAGMA user_version existing sebelum menentukan nomor berikutnya. Uji reopen dan database fixture legacy.

Sebelum migrasi yang mengubah data, buat backup SQLite yang konsisten termasuk WAL melalui API backup rusqlite (feature backup sudah diaktifkan Cargo.toml); jangan hanya menyalin orx.db aktif. Helper backup Rust untuk workflow masih perlu dibuat dan diuji. `scripts/dev-slot.mjs` mempunyai contoh backup lewat executable sqlite3, tetapi test copy-nya skipped pada lingkungan ini sehingga bukan bukti jalur backup Windows sudah siap. P0 tidak melakukan migrasi atau backup data pengguna karena tidak mengubah data. Nama OpenResearch/config/data/SSH historis dipertahankan.

P1 menyediakan flag tampilan workflow di konfigurasi lokal, dengan jalur legacy yang dapat dibuka kembali. Mematikan flag hanya menyembunyikan pintu masuk baru dan tidak menjatuhkan tabel/artefak. Jangan menjanjikan downgrade binary lama terhadap skema baru tanpa pengujian; restore backup adalah prosedur pemulihan bila kompatibilitas tidak terbukti. Deployment tahap ini hanya localhost.

## Keputusan identitas dan deployment P4

P1–P3 memakai satu operator lokal, berlabel kemampuan satu pengguna. OwnerId berasal dari identitas instalasi lokal yang disediakan backend untuk workflow, bukan nama yang dikirim browser; ini belum autentikasi dua manusia.

Model target P4 adalah **satu layanan lokal yang menyimpan proyek bersama, dengan sesi terautentikasi untuk setiap reviewer manusia dan membership per proyek**. Tidak ada akun layanan VERA pusat, organisasi atau cloud terkelola. Reviewer dapat memakai browser terpisah pada host yang sama; akses dari mesin lain hanya melalui transport terautentikasi yang sesuai pola SSH existing setelah diuji. Server tetap loopback; jangan membuka bind jaringan umum demi fitur kolaborasi.

Token attachment SSH existing hanya otorisasi transport. P4 harus menambahkan actor/session dan membership workflow lokal di atasnya, merekam deklarasi manusia yang berbeda, dan mengikat reviewerId dari sesi backend. Token capability reviewer harus dibatasi ke proyek/peran, dapat dicabut, disimpan sebagai hash, dan tidak memberi akses shell/settings/file proyek lain. Detail masa berlaku/penyerahan token diuji pada implementasi P4; belum ada kredensial reviewer yang dibuat pada P0.

Semua endpoint riset bersama, job, artefak dan ekspor harus memvalidasi actor/membership. Mode reviewer tidak boleh melewati kontrol dengan memanggil API lokal anonim/legacy; endpoint lama harus ditolak atau diisolasi pada permukaan reviewer. OS administrator/pemilik penyimpanan tetap dipercaya dan dapat membaca file lokal; concealment bukan perlindungan terhadap administrator host.

Jika sesi/membership dan dua manusia belum tersedia atau belum lolos pengujian, screening hanya latihan satu reviewer. Jangan mengganti identitas lewat dropdown anonim, memakai AI sebagai reviewer B, atau menyatakan prosedur independen selesai. Keputusan deployment ini menutup pilihan arsitektur P0; implementasi dan pembuktian keamanannya adalah prasyarat P4, bukan kelulusan P0.

## Dampak pada acceptance

- A01/A02: versi dan operation key memungkinkan reopen/retry tanpa hilang/ganda.
- A03/A24/A27/A28: pertanyaan deterministik dan penjelasan tersedia tanpa AI, topik awal atau instruksi tugas.
- A06–A09: discovery existing tetap exploratory; adapter formal baru menyimpan occurrence dan checkpoint sendiri.
- A11/A12/A25: belum dipenuhi deployment sekarang; wajib test HTTP langsung memakai identitas terpisah sebelum gate review lengkap.
- A23/A26: job membawa scope/input versions; keluaran stale dan dokumen sebagai data tidak boleh menaikkan permission atau completion.

Kontrak nama pada dokumen 10 adalah usulan. Prefix API yang dipilih di implementation map ialah `/api/research/projects/...`, agar tidak berbenturan dengan `/api/projects` coding. Invariants dokumen 10 tetap berlaku. Peta implementasi ini menjadi pemetaan kanonik checkout; spesifikasi asli pengguna tidak ditimpa.
