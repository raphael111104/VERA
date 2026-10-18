# Alur riset mahasiswa VERA

Catatan ini menjelaskan workflow demo awal. Untuk implementasi ruang kajian
yang lebih baru, gunakan [status implementasi workflow](README.md).

Demo riset memakai harness AI yang sudah dikonfigurasi di aplikasi. Model membaca bidang dan fokus mahasiswa untuk menentukan dua pertanyaan lanjutan, kemudian memakai konteks dan alasan mahasiswa untuk membuat dua query akademik. OpenAlex selalu dicari; agent dapat menambahkan PubMed, bioRxiv (melalui indeks OpenAlex), atau alphaXiv sesuai disiplin. Pencarian sumber dan query berjalan paralel.

Koordinator memakai sesi utama. Sub-agent bukti per sumber dan sub-agent penalaran bekerja paralel di sesi anak; koordinator menyintesis hasilnya, kemudian sub-agent pemeriksa bukti menilai dukungan setiap klaim. Pemeriksaan aplikasi membuang klaim dengan referensi yang tidak ada di korpus. Semua respons agent dan jejak pencarian disimpan dalam job lokal. Sesi penelitian diarsipkan agar tidak memenuhi daftar chat utama.

Assistence adalah side chat AI yang menerima konteks terbaru dari brief dan hasil penelitian. Percakapan tetap tersedia saat panel ditutup atau ketika pengguna berpindah ke File/Output. Pertanyaan di Assistence tidak mengubah jawaban pada workflow utama.

Pemilih model Assistence berada di bawah kotak pesan, di sebelah tombol Kirim. Jika model menyediakan pilihan tingkat penalaran, pilihan itu muncul di samping model dan mengikuti katalog model ketika pengguna mengganti pilihan. Model dan tingkat penalaran berlaku pada pesan berikutnya dalam percakapan yang sama; model workflow utama tetap mengikuti sesi fokus. Kecepatan normal (1×), akses penuh sesuai kemampuan harness, dan mode agentic ditetapkan pada permintaan aktual tanpa kontrol tambahan. Sesi baru workflow riset memakai pengaturan tetap yang sama; job lama tetap dapat dibaca.

## Output dan batas cakupan

- Grafik SVG menghitung artikel unik yang benar-benar dikembalikan konektor, berdasarkan tahun publikasi.
- Daftar sitasi tertinggi hanya mengurutkan artikel yang ditandai relevan oleh sub-agent sumber, dengan ID yang tervalidasi dalam korpus. Seleksi relevansi AI masih perlu ditinjau mahasiswa; sitasi bukan ukuran kualitas penelitian. Grafik tetap menghitung seluruh hasil pencarian agar seleksi AI tidak disamakan dengan jumlah publikasi database.
- Catatan Markdown dan bukti JSON menyertakan brief, model, query, tanggal akses, kegagalan sumber, respons agent, referensi, dan keterbatasan.
- Rentang default adalah lima tahun kalender sampai tanggal pencarian. Tahun berjalan belum lengkap. Maksimal 25 hasil per query per sumber, dengan query pertama diprioritaskan menurut kebaruan dan kedua menurut sitasi/popularitas konektor.
- Artikel tanpa tanggal dalam rentang atau judul tidak digunakan. Dedup berdasarkan judul; sumber berbeda dapat memiliki cakupan dan metadata berbeda.
- Penilaian menggunakan metadata/abstrak, bukan pembacaan full text atau tinjauan sistematis. Hasil kosong, model tidak tersedia, atau sumber gagal dilaporkan secara eksplisit tanpa pengganti sintetis.
- Perbarui tren menjalankan kembali pencarian aktual untuk brief yang sama. Ini bukan pemantauan berkala di latar belakang.

Workflow berhenti pada output sementara. Metodologi dan penulisan artikel belum dilanjutkan. Mahasiswa tetap menentukan fokus dan alasan penelitian.

## Penyimpanan dan distribusi Windows

Job berada di direktori data aplikasi `research-jobs/<uuid>.json`; browser menyimpan ID job terakhir. Setelah server dimulai ulang, job yang masih berjalan ditandai gagal agar dapat dicoba kembali dengan jawaban yang tersimpan. Penghentian membatalkan job dan menginterupsi sesi agent terkait.

UI dibangun ke `ui/dist`, lalu disematkan ke server Rust. Launcher Windows menyertakan server dan WebView2 loader. Perubahan localhost baru masuk ke `dist/VERA.exe` setelah ketiga lapisan tersebut dibangun ulang. Validasi rilis membandingkan hash seluruh aset yang dilayani EXE dengan `ui/dist`, memeriksa server yang diekstrak, startup native, serta endpoint riset.
