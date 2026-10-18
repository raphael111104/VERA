# 05. Database Akademik, Pencarian dan Impor

## Tujuan operasional

Database digunakan untuk retrieval nyata dan provenance, bukan sekadar mencantumkan nama layanan. Scopus menjadi konektor prioritas sesuai kebutuhan pengguna. Konektor yang tersedia di checkout, misalnya OpenAlex, dapat dipakai ulang setelah diverifikasi; jangan menampilkan OpenAlex sebagai hasil Scopus.

API key tidak menjamin semua entitlement. Metadata, abstrak dan akses teks lengkap merupakan kemampuan berbeda. UI menampilkan status konektor, cakupan data dan keterbatasan akses, tanpa memperlihatkan rahasia.

## Siklus pencarian formal

1. Susun concept blocks, sinonim, field dan Boolean dari protokol.
2. Adaptasi query ke sintaks setiap database. Simpan query asli dan query yang benar-benar dikirim.
3. Mahasiswa meninjau dan menyetujui query serta filter.
4. Layanan menjalankan request dengan job ID, pagination/checkpoint dan batas akses provider.
5. Simpan respons mentah sesuai kebijakan penggunaan, normalized records, provenance dan jumlah aktual.
6. Tampilkan reportedTotal, retrievedCount dan status complete/partial/failed/cancelled. Nilai reportedTotal tidak boleh digunakan sebagai jumlah records yang sudah diterima.
7. Mahasiswa mengesahkan cakupan kumpulan formal atau mencatat keterbatasan sebelum seleksi.

## Kontrak adapter usulan

`validateQuery(query, filters) -> ValidationResult`

`getCapabilities() -> {fields, abstractAccess, paginationMode, exportFormats, limits}`

`executeSearch(request, checkpoint?) -> SearchPage {records, nextCheckpoint, reportedTotal, warnings}`

Adapter menerjemahkan sintaks dan normalisasi; layanan SearchRun menangani persistence, retry dan state. Browser tidak memanggil provider dengan credential rahasia. Credential tersimpan di konfigurasi backend/secret store yang sesuai pola repo, terhapus dari log dan ekspor.

## Data pencarian minimum

runId, projectId, purpose, protocolVersionId, provider, databaseLabel, queryOriginal, queryExecuted, filters, startedAt, endedAt, timezone, reportedTotal, retrievedCount, status, paginationCheckpoint, responseArtifactIds, checksum, warnings, initiatedBy dan approvalId.

RecordOccurrence mempertahankan hubungan setiap hasil dengan run dan raw ID. EvidenceRecord merupakan record bibliografis gabungan. Satu record yang ditemukan di dua database tetap punya dua occurrence. Penyatuan metadata menyimpan asal setiap field penting dan konflik yang belum selesai.

## Impor sebagai jalur pendamping

Dukung RIS, BibTeX dan CSV dengan pemetaan kolom sebelum commit. Tampilkan preview, encoding, jumlah valid, jumlah gagal dan field tidak tersedia. Simpan berkas asli, hash, waktu impor, database asal dan catatan query/tanggal yang diketahui pengguna. Nilai tidak diketahui tetap null; jangan mengisi tanggal pencarian dari tanggal impor.

Impor tanpa log tetap dapat digunakan sebagai bukti tambahan, tetapi audit menyatakan ketidaklengkapan provenance. Jangan menghentikan latihan hanya karena ekspor database tidak membawa seluruh field.

## Error dan pemulihan

| Kondisi | Perilaku |
|---|---|
| Credential/entitlement gagal | Tampilkan akses belum tersedia, pilihan konfigurasi layanan atau impor |
| Rate limit | Respect Retry-After jika tersedia, retry terbatas dengan backoff; progres tersimpan |
| Timeout pada halaman berikut | Mark partial; resume dari checkpoint tanpa duplikasi occurrence |
| Query tidak valid | Pesan provider dan field terkait; jangan otomatis mengganti query formal yang disetujui |
| Nol hasil | Simpan run sah dengan 0; tawarkan revisi eksplisit, bukan mengarang sumber |
| Aplikasi offline | Pekerjaan lokal tetap tersedia; pencarian baru menunggu jaringan |
| Data provider berubah saat resume | Catat ketidakstabilan pagination; jangan menjamin kelengkapan palsu |

Run yang diulang memiliki ID baru dan hubungan supersedes; retry halaman dalam run memakai idempotency key. Hasil exploratory tidak dihitung dalam flow review formal. Citation chasing atau pencarian situs lembaga memakai jalur sumber lain dengan log dan kategori tersendiri.

## Batas integrasi

Pencarian metadata dapat berjalan dalam aplikasi. Teks penuh bergantung pada hak akses dan ketersediaan; aplikasi menawarkan DOI/landing page, retrieval legal bila ada, serta unggah PDF. Jangan menjanjikan seluruh database akademik dapat diakses hanya dengan satu API key. Tambahan konektor di luar yang diuji harus muncul sebagai belum dikonfigurasi.
