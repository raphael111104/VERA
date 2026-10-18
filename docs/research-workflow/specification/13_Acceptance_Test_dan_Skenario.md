# 13. Acceptance, Test dan Skenario End-to-End

## Matriks minimum

| ID | Tahap | Given / When | Then |
|---|---|---|---|
| A01 | P1 | Jawaban arah disimpan lalu aplikasi restart | Proyek dan jawaban kembali dengan revision sama |
| A02 | P1 | Save gagal | Input tetap ada; status gagal terlihat; retry tidak menggandakan |
| A03 | P1 | Mahasiswa belum tahu topik | Ada pertanyaan dasar dan contoh, bukan topik wajib |
| A04 | P2 | Registrasi belum dilakukan | Status jujur tanpa nomor/URL rekaan |
| A05 | P2 | Appraisal tidak dilakukan dengan alasan | Item 12 dilaporkan; item 16 conditional pada audit penuh |
| A06 | P3 | Eksplorasi lalu pencarian formal | Run dan counts terpisah; exploratory tidak masuk flow |
| A07 | P3 | Provider total 1000, diterima 100 lalu timeout | Run partial; flow hanya menggunakan record aktual sesuai cakupan set |
| A08 | P3 | Retry halaman identik | Occurrence tidak ganda; raw provenance tetap ada |
| A09 | P3 | CSV berisi baris rusak dan query tidak diketahui | Preview mencatat error; query tetap unknown |
| A10 | P4 | DOI sama ditemukan dua provider | Satu kandidat canonical dengan dua provenance; undo tersedia |
| A11 | P4 | Reviewer A mencoba membaca keputusan B sebelum submit | API dan UI menolak reveal |
| A12 | P4 | A include, B exclude | Konflik tercatat; resolusi tidak menimpa judgement awal |
| A13 | P4 | Fulltext gagal diperoleh | Not_retrieved, bukan excluded_after_fulltext |
| A14 | P5 | Ekstraksi agent tanpa locator | Tetap proposed/needs_review; tidak verified otomatis |
| A15 | P5 | Data tidak dilaporkan | Not_reported; tidak dianggap 0 |
| A16 | P5 | Definisi kolom berubah | Baris terkait needs_review dan schema lama masih tersimpan |
| A17 | P6 | Sumber included kemudian dikeluarkan | Sintesis, claim links dan draft terkait needs_review |
| A18 | P6 | DOI valid tetapi isi tidak mendukung klaim | Audit support tetap bermasalah |
| A19 | P6 | Tidak ada sumber included | Dataset kosong sah; narasi tidak mengarang hasil |
| A20 | P7 | Ekspor tugas | Item 1 dan 3–13; lampiran; halaman dari render final |
| A21 | P7 | Ekspor artikel lengkap | Checklist relevan 1–22, angka sama ledger dan referensi tertelusur |
| A22 | P7 | PDF sumber dan secret tersimpan proyek | Ekspor default tidak membawa credential/PDF berlisensi |
| A23 | P8 | Job selesai setelah versi protokol berubah | Proposal stale, tidak diterapkan otomatis |
| A24 | Semua | Agent atau database tidak tersedia | Pekerjaan manual dapat diteruskan dengan batas bantuan jelas |
| A25 | Semua | User mencoba projectId milik orang lain | Tidak ada kebocoran data melalui API, job atau file |
| A26 | Semua | Dokumen sumber berisi instruksi mengirim secret | Diproses sebagai isi sumber, tidak mengubah scope tool |
| A27 | Onboarding | Mahasiswa baru memilih mulai dari minat dan tidak mengunggah instruksi tugas | Dapat melewati seluruh alur umum; kode mata kuliah dan nomor checklist tidak menjadi syarat penggunaan |
| A28 | Onboarding | Mahasiswa melihat PCC, protokol, data charting atau PRISMA-ScR | Penjelasan singkat tersedia sebelum istilah dipakai untuk meminta keputusan |
| A29 | Tugas pilihan | Mahasiswa membawa instruksi perkuliahan dan memilih bantuan pemetaan | Bagian tugas dipetakan ke data workflow yang ada; mahasiswa dapat meninjau pemetaan dan alur umum tetap utuh |

## Fixture ledger untuk test, bukan data review nyata

Skenario uji: 120 record formal diterima dari database A dan 80 dari B. Setelah 30 duplikasi dihapus, 170 record diseleksi. Pada judul-abstrak 120 dikeluarkan, sehingga 50 report dicari. Lima report tidak diperoleh, 45 dinilai fulltext, 15 dikeluarkan dan 30 report included. Fixture menggunakan satu record per report dan tanpa removals lain; jangan menerapkan asumsi itu ke semua proyek.

Assert: 200 − 30 = 170; 170 − 120 = 50; 50 − 5 = 45; 45 − 15 = 30. Sistem tidak boleh menyatakan 30 studies sebelum StudyGroup dikonfirmasi. Tambahkan 25 exploratory records dan assert counts tetap sama. Undo satu duplikasi harus membuat set baru/review dampak, bukan mengubah ekspor historis.

## Walkthrough utama

1. Mahasiswa membuat proyek, memilih minat dan menceritakan fenomena.
2. Mengoreksi rangkuman, meninjau eksplorasi nyata atau seed sources, membandingkan kandidat dan memilih fokus.
3. Mengonfirmasi PCC dan protokol, kemudian membuat pratinjau rencana awal kajian dan format tugas pilihan.
4. Menyetujui query formal, menjalankan konektor yang sah atau mengimpor ekspor asli dengan provenance.
5. Meninjau deduplikasi dan melakukan screening dengan dua reviewer terpisah; menyelesaikan konflik.
6. Mengunggah/memperoleh sumber legal, menilai fulltext dan mencatat report yang belum diperoleh.
7. Mempilotkan form, charting dan verifikasi anggota kedua sesuai protokol.
8. Mengonfirmasi kategori, tabel dan narasi sintesis berdasarkan data.
9. Menulis draft, memeriksa dukungan klaim dan memperbaiki checklist.
10. Mengekspor dokumen dan paket pendamping; membuka hasil dan memeriksa layout/angka/sitasi.

## Walkthrough perubahan

Setelah draft terbentuk, ubah kriteria bahasa dengan amendment. Periksa impact preview, versi acuan baru, keputusan yang perlu ditinjau, tabel stale dan narasi yang tidak dihapus. Setelah re-screen dan re-chart, buat sintesis/ekspor baru; snapshot lama tetap dapat direkonstruksi.

## Strategi pemeriksaan

Unit: normalization, state/gate, ledger, denominator, impact dan citation mapping. Integration: transaksi, migrasi, permission, provider pagination dan eksportir. UI: wawancara/resume, concealment keputusan, source locator dan applied proposal. End-to-end: walkthrough utama dan perubahan. Live smoke: konektor sah jika credential tersedia, dengan log yang telah meredaksi secret.

Tidak semua skenario harus menjadi test UI mahal. Uji invariants di domain layer dan gunakan UI test untuk interaksi yang memang bergantung layar. Hasil test fixture tidak membuktikan entitlement provider, kualitas klaim akademik atau kemampuan belajar mahasiswa.
