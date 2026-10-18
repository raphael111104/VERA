# P5–P6 dan panel pendamping — web localhost

Pelaksanaan 14 Oktober 2026. Permintaan pengguna memperluas pekerjaan setelah P1–P4: dropdown konsisten, panel kanan, konektor akademik lama, P5 dan P6. Paket desktop/installer tidak diganti.

## Perilaku yang tersedia

- Semua select di source UI, termasuk onboarding, memakai pembungkus `ui/src/components/ui/Select.tsx`. Popup menggunakan Base UI Select untuk focus, keyboard, typeahead, Escape dan pemilihan; gaya memakai token VERA. Dependensi dikunci pada `@base-ui/react` 1.9.0.
- `panels/ResearchPanel.tsx` menyediakan pratinjau Markdown dengan toggle sumber, metadata/abstrak, PDF terotorisasi, berkas teks yang ditambahkan, keluaran kajian, daftar sumber, browser bersandbox dan sidechat. Panel dapat ditutup atau diperluas. Daftar sumber dan PDF dipindahkan dari badan workspace; run lama dapat diringkas.
- Browser mempertahankan tautan eksternal karena sebagian penerbit melarang embedding. Panel berkas adalah berkas lokal milik kajian ini, bukan penjelajah seluruh disk komputer.
- Sidechat memakai harness/model terpasang, pilihan usaha yang mengikuti katalog model, sesi per proyek/pemilik/harness, dan konteks kajian tersimpan. Runtime chat lama membutuhkan Git: folder runtime terisolasi di data development diinisialisasi dengan helper Git existing. Tidak mengadopsi checkout pengguna atau proyek demo. Tidak ada remote Git yang ditambahkan. Kebijakan plan/ask dan instruksi pendamping membatasi tindakan agent; jawaban tidak mengubah keputusan akademik.

## P5 — catatan sumber dan verifikasi

Domain: `src/local/research_workflow/evidence.rs`. UI: `evidence/ChartingWorkspace.tsx`.

- Form terbatas 1–30 kolom dengan ID unik, tipe text/number/category, wajib/tidak, allowedValues, missingPolicy dan extractionGuidance. Alasan wajib untuk versi baru.
- Pilot memakai subset laporan included dan alasan sampel pilihan tim. Penyelesaian pilot memerlukan semua sel wajib pada sampel terkonfirmasi. Tidak ada ukuran sampel universal.
- Sel disimpan sebagai event baru: proposed, confirmed atau needs_review dengan alasan perbedaan. Nilai missing tidak boleh berisi angka/teks pengganti. Nilai angka harus finite; kategori mengikuti codebook.
- Locator menyimpan artifactId, page/section, quote dan SHA-256 yang dibandingkan dengan dokumen aktif milik record/proyek. Usulan tanpa locator boleh tersimpan, tetapi tidak dapat dikonfirmasi. Kutipan/lokasi dimasukkan dan diperiksa manusia; aplikasi belum membuktikan otomatis bahwa kutipan benar-benar ada pada halaman PDF.
- Pada mode dua reviewer, verifier harus identitas terdaftar yang berbeda dari extractor. Mode satu penilai diberi label latihan. Riwayat perbedaan tetap tersedia.
- Hanya laporan formal canonical yang lolos judul-abstrak dan teks lengkap dengan retrieval aktif yang dapat dicatat. Perubahan keputusan, sumber, form atau protokol membuat nilai lama tidak memenuhi versi aktif.
- Appraisal hanya muncul bila protokol memilihnya. Instrumen/versi, judgement per domain dan locator dicatat tanpa skor universal. Ini form penilaian manual; bukan implementasi otomatis semua instrumen appraisal.

## P6 — sintesis dan draft

UI: `evidence/SynthesisWorkspace.tsx`, `draft/ManuscriptEditor.tsx`.

- Sintesis menyimpan SelectionRevision, ProtocolRevision, SchemaVersion, recordIds dan cellIds. Tabel dihitung oleh kode dari baris aktif yang seluruh kolom wajibnya terkonfirmasi; kolom opsional yang belum dikonfirmasi masuk missing tersendiri.
- Denominator selalu eksplisit. Kategori ganda dipisahkan titik koma dan dihitung sekali per laporan per kategori, sehingga total kategori dapat melebihi jumlah laporan. Dataset kosong valid dan tidak menghasilkan temuan buatan.
- Codebook berasal dari definisi kolom yang disetujui pengguna. Sidechat dapat dipakai mendiskusikan usulan tema; hasil AI tidak menjadi kategori final atau bukti terkonfirmasi secara otomatis.
- Editor memiliki sembilan bagian dan status empty/outline/draft/needs_review/verified. Tombol **Simpan bagian** membuat revisi server; perubahan yang belum dikirim disalin ke penyimpanan lokal browser untuk pemulihan. Penyimpanan bagian bersifat eksplisit, berbeda dari autosave arah/protokol.
- Usulan kerangka ditampilkan untuk ditinjau. Penerapan menambahkan teks melalui revisi, tanpa menimpa tulisan manual secara diam-diam.
- Claim links menyimpan teks persis pada bagian draft, jenis klaim, sumber, sel, locator, level metadata/abstract/fulltext, reviewer dan fingerprint dependensi. Statistik tidak dapat diverifikasi hanya dengan DOI/metadata; harus menunjuk sel terkonfirmasi dan sintesis terkini. Klaim lama dapat ditarik/diganti dengan alasan tersimpan.
- Perubahan makna arah/protokol atau bukti formal menandai bagian dan klaim needs_review serta sintesis stale. Navigasi langkah wawancara dan impor eksploratif tidak mengubah dependency bukti formal; keduanya diuji. Tulisan manual tidak dihapus. Pemeriksaan dukungan, generalisasi dan cakupan klaim tetap merupakan judgement manusia; belum ada pemeriksa semantik otomatis seluruh naskah.
- Markdown draft dan JSON sintesis tersedia. DOCX, audit pelaporan lengkap, pemetaan halaman final dan P8 tetap tahap berikutnya.

## Provider

`search.rs` mempertahankan OpenAlex/Scopus dan menambahkan Crossref, PubMed, alphaXiv/arXiv serta bioRxiv melalui filter OpenAlex existing. Tidak ada fallback berupa record contoh ketika API gagal. Query, status parsial, jumlah diterima, reportedTotal, checkpoint dan respons mentah tetap tercatat.

- Crossref: cursor `/works`, 25 record, metadata deposit penerbit. Run baru memakai `sort=score&order=desc` secara eksplisit; query/cursor/urutan dicatat pada `_veraRequest`. Resume run uji lama tanpa marker urutan mempertahankan urutan lamanya agar checkpoint tidak berubah diam-diam. Acuan [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) dan [pagination/cursor](https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api).
- PubMed: ESearch JSON dan EFetch XML, parser PubMed existing, 25 ID/halaman, batas 10.000 ID per query ESearch. Acuan [NLM E-utilities](https://www.nlm.nih.gov/dataguide/eutilities/utilities.html) dan [NCBI E-utilities parameters](https://www.ncbi.nlm.nih.gov/books/NBK25499/).
- alphaXiv: konektor discovery existing `client::discover_papers_by_keyword`, tanpa total/pagination yang dapat dianggap pencarian menyeluruh arXiv. Ketersediaan API eksternal harus dibedakan dari sekadar tersedianya pilihan UI.
- bioRxiv: filter source `S4306402567` milik konektor lama pada OpenAlex; label menjelaskan bahwa hasil adalah metadata preprint.
- Scopus tetap membutuhkan konfigurasi/entitlement pengguna. Akses PDF tidak dianggap tersedia hanya karena metadata ditemukan.

## Bukti pemeriksaan

- `pnpm test`: 251 lulus.
- `cargo ... test ... research_workflow`: 9 lulus; mencakup contract Crossref, replay nested evidence dan pengujian domain/storage sebelumnya. Pemeriksaan akhir `cargo +stable-x86_64-pc-windows-gnu test --locked --target x86_64-pc-windows-gnu`: 976 unit test lulus, 3 ignored, serta 6 integration test lulus.
- `scripts/test_research_workflow.py`: lulus pada data sementara terisolasi. Skenario tambahan mencakup tiga status missing, hash/locator, konflik nilai, verifier berbeda, pilot gate, denominator/tumpang tindih, dataset kosong, statistik tanpa sel ditolak, claim retirement, stale propagation, tulisan tetap ada, file/path validation, restart dan akses sidechat.
- Transport error tambahan diuji untuk proxy 502 kosong, kegagalan koneksi sidechat dan konflik 409; input/envelope tidak dimutasi.
- Riwayat evidence memakai delta nested untuk sel/form/berkas yang ditambahkan, sehingga corpus sebelumnya tidak disalin pada setiap sel baru. Uji replay dari snapshot P1–P4 tanpa field evidence dan batas ukuran history lulus. Tidak ada migrasi direktori/config lama.
- Rust formatting, build GNU dan Clippy all-targets `-D warnings` lulus. Build/style UI dan sinkronisasi `ui/dist` dilakukan setelah perubahan akhir; warning chunk besar dan CSS `::highlight` berasal dari pipeline existing, bukan kegagalan build.
- Browser: popup database, source metadata, browser sumber/tautan eksternal, penyimpanan form, penyimpanan/pemulihan bagian draft, rendered/source Markdown, lampiran `.md` yang disimpan pada panel berkas, dan jawaban sidechat nyata diperiksa. Proyek UI terpisah berlabel **Uji UI P5–P6 — data pengujian** menyimpan uji tersebut.
- Live Crossref akhir dengan urutan relevansi eksplisit: 25 record diterima, termasuk judul tentang threshold concepts/scoping review medical education. Run pertama sebelum urutan eksplisit tetap disimpan terpisah. Pada run pertama, 25 record diterima untuk query uji `scoping review medical education`, reportedTotal 15.414.116, status partial. Live PubMed: 25 record, reportedTotal 5.814, status partial. Angka adalah snapshot saat pengujian, bukan klaim cakupan review.
- OpenAlex 25 record eksploratif dari pekerjaan sebelumnya tetap tersimpan pada proyek contoh pengguna. Scopus live belum diverifikasi. bioRxiv melalui OpenAlex mengembalikan 25 record (reportedTotal 100.938) untuk `single cell`. alphaXiv mengembalikan 25 record untuk `machine learning`, total tidak diketahui dan status tetap partial. Respons 400 pertama teratasi dengan `prioritize=default` yang diterima skema provider; riwayat kegagalan tetap tersimpan.

Fixture yang memakai dua token adalah pengujian kontrol akses dan prosedur perangkat lunak; bukan dua manusia yang melakukan review akademik nyata. PDF fixture kosong hanya menguji penyimpanan/otorisasi/hash; tidak membuktikan akurasi ekstraksi akademik. Status P5–P6 pada laporan ini berarti implementasi tersedia dan pemeriksaan perangkat lunak yang disebut lulus, bukan suatu review ilmiah selesai.


Bukti visual: `target/vera-workflow-sidebar-dropdown-localhost.jpg` (popup database dan panel kanan) dan `target/vera-workflow-p6-editor-localhost.jpg` (editor dan pratinjau). Log pengujian akhir berada pada `target/workflow-p5-p6-*.log`. Backend localhost tetap pada 4901 dan Vite pada 5201.
