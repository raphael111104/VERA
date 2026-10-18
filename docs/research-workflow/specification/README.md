# VERA: Workflow Mahasiswa dan Paket Revisi Codex

Versi rancangan 1.2, 13 Oktober 2026, WIB.

VERA berarti **Veritas Evidence & Research Agent**. Paket ini merancang perjalanan mahasiswa dari menemukan bidang dan masalah sampai menyusun draft artikel Scoping Review melalui aktivitas yang tersimpan di satu aplikasi. Pengguna dapat mulai tanpa mengenal nama mata kuliah, kode tugas, atau istilah metode review. Jika membawa instruksi perkuliahan, VERA membantu menghubungkannya ke alur umum. Paket ini mencakup spesifikasi produk dan arahan implementasi bertahap, bukan klaim bahwa fitur sudah tersedia.

## Hasil yang dituju

1. Mahasiswa menemukan arah kajian melalui pertanyaan bertahap, eksplorasi literatur, dan pemilihan fokus yang dapat dijelaskan.
2. Mahasiswa dapat memakai alur umum VERA untuk menghasilkan rencana kajian dan draft awal. Jika pengguna membawa tugas tertentu, VERA dapat menyiapkan versi keluaran yang sesuai instruksi tersebut. Salah satu tugas perkuliahan tentang penyusunan rencana Scoping Review menjadi contoh pemetaan, bukan prasyarat bagi pengguna.
3. Mahasiswa melanjutkan proyek yang sama menjadi pelaksanaan review nyata dan draft artikel lengkap, tanpa mengarang hasil atau menyalin data antaraplikasi.
4. Proses penilaian awal, pemeriksaan bukti, bantuan, dan revisi tercatat untuk pembelajaran. Mutu draft tidak otomatis dianggap sebagai bukti kompetensi mandiri.

## Urutan membaca

| Dokumen | Kegunaan |
|---|---|
| [00](00_Memulai_Workflow_VERA.md) | Panduan awal bagi mahasiswa yang baru mulai |
| [01](01_Kajian_dan_Keputusan_Desain.md) | Kajian, alternatif, keputusan dan batas ruang lingkup |
| [02](02_Workflow_Mahasiswa_End_to_End.md) | Perjalanan mahasiswa, prasyarat, keluaran dan jalur kembali |
| [03](03_Penentuan_Bidang_Topik_Fokus.md) | Wawancara awal, eksplorasi dan Research Direction Brief |
| [04](04_Rencana_Kajian_dan_Pelaporan_Scoping_Review.md) | Rencana kajian, pelaporan, dan contoh pemetaan instruksi perkuliahan |
| [05](05_Database_Pencarian_dan_Impor.md) | Konektor nyata, log, cakupan dan kegagalan pencarian |
| [06](06_Seleksi_Fulltext_dan_Data_Charting.md) | Deduplikasi, dua reviewer, teks lengkap dan ekstraksi |
| [07](07_Sintesis_Draft_dan_Export.md) | Peta bukti, editor, audit dan ekspor |
| [08](08_Agent_dan_Mekanisme_Pembelajaran.md) | Orkestrasi agent dan keputusan mahasiswa |
| [09](09_UI_dan_Interaksi.md) | Struktur layar, keadaan UI dan aksesibilitas |
| [10](10_Kontrak_Data_State_dan_API.md) | Entitas, transisi, versioning, API usulan dan otorisasi |
| [11](11_Rencana_Implementasi_Bertahap.md) | Tahap P0 sampai P8, pekerjaan dan gerbang selesai |
| [12](12_Instruksi_Eksekusi_Codex.md) | Prompt siap digunakan, audit repo dan prosedur kerja |
| [13](13_Acceptance_Test_dan_Skenario.md) | Pemeriksaan fungsional, integritas dan kegagalan |
| [14](14_Referensi_dan_Traceability.md) | Sumber, batas verifikasi dan pemetaan kebutuhan |
| [15](15_Rancangan_Panduan_Agent_Sederhana.md) | Panduan kontekstual agent untuk pengguna baru |

## Cara menggunakan paket

Buka [panduan memulai](00_Memulai_Workflow_VERA.md) untuk memahami pengalaman mahasiswa, lalu baca dokumen teknis sesuai tahap. Untuk implementasi, berikan [instruksi Codex](12_Instruksi_Eksekusi_Codex.md) bersama seluruh folder. Mulai P0, kemudian kerjakan satu tahap sesuai dependensi.

Dokumen merupakan rancangan yang dapat ditinjau dan diubah. Nama tabel, endpoint dan berkas baru adalah usulan kontrak. Codex wajib menyesuaikannya dengan arsitektur checkout aktual, mencatat perubahan pemetaan, dan menjaga perilaku yang telah digunakan pengguna. Label layar menjelaskan pekerjaan dengan bahasa umum terlebih dahulu. Istilah akademik dan format tugas tertentu dijelaskan saat memang diperlukan.

## Batas bukti

Instruksi perkuliahan yang menjadi dasar rancangan dan bagian dasar dokumen konsep awal dibaca kembali untuk penyusunan paket ini. Akses ulang source GitHub gagal; informasi tentang UI sebelumnya bersumber dari analisis percakapan, belum diverifikasi terhadap commit saat ini. Tidak ada build, test aplikasi, atau perubahan repo dalam pekerjaan dokumentasi ini. P0 harus menghasilkan audit berdasarkan commit nyata.
