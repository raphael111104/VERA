# 14. Referensi, Dasar Bukti dan Traceability

Tanggal pemeriksaan sumber: 13 Oktober 2026 WIB. Rekomendasi desain pada dokumen 01–13 adalah sintesis rancangan, bukan fitur yang dinyatakan sudah berjalan.

## Sumber primer dan penggunaannya

| Sumber | Bagian yang digunakan | Batas |
|---|---|---|
| Instruksi perkuliahan tentang penyusunan rencana Scoping Review, dokumen yang diberikan pengguna | Teks instruksi halaman 1–3 dan checklist awal: item 1 dan 3–13, bahasa Indonesia, dua reviewer, lampiran dan nomor halaman | Tenggat historis; tidak diubah menjadi aturan tenggat proyek baru |
| VERITAS_SPS_Kajian_Mendalam_September_2026.docx, dokumen konsep pengguna | Bagian dasar definisi, tujuan, judgement, provenance, bantuan dan pemisahan outcome | Pembacaan terarah bagian awal, bukan audit ulang seluruh referensi SOTA |
| [JBI Manual, Scoping reviews](https://jbi-global-wiki.refined.site/space/MANUAL/355862497/10.%2BScoping%2Breviews) | Kerangka metodologis Scoping Review | Versi pedoman yang dipakai tim harus dicatat ketika protokol disahkan |
| [JBI: Forming the right team](https://jbi-global-wiki.refined.site/space/MANUAL/2042298373/10.2.1.1%2BForming%2Bthe%2Bright%2Bteam) | Pelibatan minimal dua orang untuk seleksi dan ekstraksi; tim perlu kompetensi yang sesuai | Agent tidak setara reviewer manusia |
| [JBI: aligning eligibility with objectives and questions](https://jbi-global.atlassian.net/wiki/spaces/MANUAL/pages/355862707/10.2.4%2BDeveloping%2Band%2Baligning%2Bthe%2Beligibility%2Bcriteria%2Bwith%2Bthe%2Bobjective%2Bs%2Band%2Bquestion%2Bs) | PCC dan operasionalisasi kelayakan | Jenis sumber bukti dapat melampaui artikel empiris |
| [PRISMA-ScR official](https://www.prisma-statement.org/scoping) | Pelaporan: 20 item utama, dua opsional/bersyarat pada appraisal | Checklist pelaporan bukan pengganti metode pelaksanaan |
| [Tricco et al., 2018](https://doi.org/10.7326/M18-0850) | Identitas publikasi penjelasan PRISMA-ScR dari situs resmi | Tidak dilakukan appraisal baru terhadap paper ini |
| [Elsevier Scopus APIs](https://dev.elsevier.com/sc_apis.html) | API menyediakan data bibliografis/abstrak dan akses tunduk pada konfigurasi/kebijakan | API key tidak menjamin fulltext atau seluruh entitlement |
| [Repository VERA](https://github.com/raphael111104/VERA.git) | Target implementasi | Akses ulang gagal pada sesi ini; tidak ada SHA source yang diverifikasi |

Link pedoman dapat berubah. Codex memeriksa dokumentasi API aktual saat mengimplementasikan adapter; simpan versi/dependency dan tanggal verifikasi. Jangan memakai statistik ukuran database pada portal sebagai angka hasil pencarian proyek.

## Hal yang berasal dari konteks sebelumnya

Analisis percakapan sebelumnya menyebut VERA sebagai turunan OpenResearch, Rust + React/TypeScript, SQLite, workspace riset khusus demo dan proyek biasa memakai workspace coding. Paket menggunakan informasi itu sebagai hipotesis P0. Tidak ada pernyataan bahwa perilaku tersebut masih pasti sama pada checkout terbaru.

## Kebutuhan pengguna ke implementasi

Prinsip bahasa pengguna merupakan persyaratan produk: mahasiswa yang belum pernah menyusun review atau mengenal istilah metodenya harus dapat memulai dari minat, memahami istilah saat muncul, menyelesaikan workflow umum, dan menulis draft. Instruksi perkuliahan yang dibaca digunakan sebagai contoh untuk memeriksa apakah data dan tahapan aplikasi dapat menghasilkan format tugas yang diminta. Pemetaan opsional ini tidak membuat instruksi tugas menjadi nama workflow, kebutuhan onboarding atau syarat penggunaan.

| Kebutuhan | Dokumen spesifikasi | Tahap | Acceptance |
|---|---|---|---|
| Mulai dari pertanyaan bidang/topik/fokus | 03 | P1 | A01–A03 |
| Workflow yang dapat dimulai tanpa pengalaman sebelumnya | 00, 01, 02, 03, 09, 12 | P1–P2, P7 | A27–A29 |
| Pemetaan instruksi perkuliahan sebagai format keluaran pilihan | 04, 11 | P2, P7 | A04–A05, A20, A29 |
| Database akademik benar-benar digunakan | 05 | P3 | A06–A09 |
| Review sistematis dalam aplikasi | 06 | P4–P5 | A10–A16 |
| Output berupa draft artikel | 07 | P6–P7 | A17–A22 |
| Pembelajaran dan judgement mahasiswa | 08 | P1–P8 | A12, A14, A23–A24 |
| UI kurang teknis dan satu proyek | 09 | P1–P7 | Walkthrough utama |
| Revisi bertahap untuk Codex | 10–12 | P0–P8 | Pemetaan exact path dan gate per tahap |
| Seluruh workflow dapat dilanjutkan | 02, 10 | P1–P7 | A01–A02, walkthrough perubahan |

## Keputusan terbuka yang diselesaikan melalui audit

Belum diketahui: auth/multiuser aktual, entitlement Scopus yang tersedia, export pipeline existing, kapasitas reader, storage lokasi file dan baseline tests. Semua menjadi pekerjaan P0 atau verifikasi P3, bukan alasan membuat hasil palsu. Default produk ditetapkan dalam paket; keputusan teknis aktual dicatat melalui implementation-map dan decision record.

## Batas klaim akhir

Paket merancang draft yang tertelusur, tidak menjamin artikel layak terbit, novelty, kelengkapan seluruh literatur atau peningkatan kompetensi. Kemampuan tersebut membutuhkan audit akademik atau evaluasi empiris tersendiri. Fokus implementasi pertama adalah keberjalanan proses dan integritas data.
