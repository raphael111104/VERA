# Arsitektur Sistem VERA

UI diagram interaktif mandiri. Halaman langsung menampilkan arsitektur sistem.

## Menjalankan

- Windows: klik dua kali `Jalankan-Arsitektur.cmd`.
- Alternatif lintas platform: buka `index.html` langsung di browser modern.

Tidak memerlukan instalasi paket, Node.js, server VERA, atau proses build untuk melihat diagram. HTML berisi SVG, CSS, dan JavaScript viewer. Tautan rujukan kode membuka GitHub dan membutuhkan koneksi jaringan.

## Isi diagram

Sebelas komponen merangkum jalur utama dashboard React → API lokal orx/Axum → SQLite, beserta jendela desktop, orkestrasi percakapan, integrasi coding agent, alur kerja riset, sumber akademik, eksperimen, target eksekusi, dan berkas ruang kerja.

Diagram menggambarkan komponen logis. Beberapa kotak merupakan modul dalam proses Rust yang sama, bukan layanan terpisah. Panah menampilkan hubungan utama, bukan semua pemanggilan fungsi atau akses penyimpanan. Modul chat, eksperimen, dan riset juga menggunakan store lokal; hubungan ini diringkas melalui inti API. Panah HTTP/SSE/WebSocket menunjukkan kelompok transport antara dashboard dan backend, bukan satu request tunggal.

Target `local` berjalan di mesin pengguna. SSH, Slurm, Ray, Hugging Face Jobs, Modal, Kubernetes, dan Tinker merupakan pilihan backend yang dipakai sesuai konfigurasi pengguna. Klasifikasi External pada kotak target berarti batas adapter eksekusi, dan tidak berarti semua target berada di cloud. Konektor akademik dan backend eksekusi dikonfigurasi secara terpisah.

Harness mencakup Codex, Claude Code, OpenCode, Cursor, dan Antigravity; kemampuan deteksi, chat, dan pemasangan skill berbeda untuk setiap harness. CLI agent dapat berkomunikasi dengan provider model eksternal melalui konfigurasi/login milik pengguna. Model lokal adalah kemampuan opsional, bukan jaminan seluruh inferensi berjalan offline.

Sumber akademik meliputi Crossref, PubMed, OpenAlex, Scopus, alphaXiv, dan bioRxiv melalui OpenAlex. Scopus memerlukan API key dan entitlement; OpenAlex mengikuti konfigurasi kredensial provider. Hasil discovery merupakan metadata/abstrak bila tersedia, bukan jaminan full text. Nama sumber tambahan tampil pada detail komponen. Untuk jalur riset, model membantu dan keputusan penyelesaian akademik tetap dikendalikan validasi domain.

SQLite menyimpan state lokal. Log run berada dalam berkas `run-logs/`; proyek, artefak, Git, konfigurasi lingkungan, dan jalur kompatibilitas OpenResearch tetap lokal. Diagram ini merupakan dokumentasi mandiri dan tidak mengubah runtime, konfigurasi, database, atau paket VERA.

## Menggunakan viewer

Klik komponen untuk melihat detail dan rujukan kode. Viewer menyediakan pencarian, fokus hubungan, pan/zoom, tema Light/Dark, Present, dan menu Export. Isi diagram ditulis dalam bahasa Indonesia. Kontrol bawaan viewer dan atribut HTML `lang` menggunakan fallback bahasa Inggris karena versi Archify terpasang hanya mendukung locale viewer Inggris dan Mandarin.

## Dasar kode dan berkas sumber

- Audit: 19 Oktober 2026.
- Revisi kode: `1fec991dc4ed577c87c8bf872b491ea74c56eef8`.
- Repositori: https://github.com/raphael111104/VERA
- `vera.architecture.json`: spesifikasi diagram yang dapat diedit dan dibuat ulang menggunakan Archify.
- `index.html`: HTML hasil delivery, siap dibuka.
- `delivery-receipt.json`: identitas SHA-256, ukuran, 9 pemeriksaan showcase, dan verifikasi 25 rujukan kode.
- `index.visual-check.json`: bukti otomatis browser untuk HTML yang sama.
- `index.visual-check.html`: galeri empat tangkapan layar.
- `visual-review.json`: catatan tinjauan visual terpisah dari pemeriksaan otomatis.

Pemeriksaan akhir: 9/9 showcase, 0 error, 0 warning; pemeriksaan containment/readability browser lulus pada 1440×900, 1600×1000, 1920×1080, dan 2048×1320. Tangkapan layar terang/gelap pada 1440×900 dan 2048×1320 ditinjau secara visual. Bukti ini tidak menyatakan bahwa setiap tombol viewer atau setiap format ekspor telah diuji secara interaktif, dan tidak merupakan pengujian runtime VERA.

Untuk regenerasi dari root proyek dengan skill Archify terpasang:

```powershell
node "$env:USERPROFILE\.agents\skills\archify\bin\archify.mjs" validate architecture .\docs\architecture\vera.architecture.json --quality showcase --repo-root . --json
node "$env:USERPROFILE\.agents\skills\archify\bin\archify.mjs" deliver architecture .\docs\architecture\vera.architecture.json .\docs\architecture\index.html --quality showcase --repo-root . --json
node "$env:USERPROFILE\.agents\skills\archify\bin\archify.mjs" visual-check .\docs\architecture\index.html --json
```

Jalankan ulang pemeriksaan dan perbarui receipt setelah mengubah spesifikasi. Jangan mengedit HTML generated secara manual. Lihat [indeks dokumentasi](../README.md) untuk dokumen lainnya.
