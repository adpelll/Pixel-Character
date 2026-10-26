<<<<<<< HEAD
# Pixel-Character
like pets on vscode
=======
# Malioboro - Adpel & Kepin

Buka `index.html` di browser (klik dua kali, tidak perlu server).

- `index.html` : kerangka adegan
- `css/style.css` : semua gaya, siang/malam, tombol
- `js/script.js` : logika karakter (jalan dengan perspektif, ngobrol, kunjungan ke angkringan, parallax)
- `assets/adpel/`, `assets/kepin/` : frame sprite (front, left, right, back)
- `assets/layers/` : latar Malioboro versi siang dan malam (far, shops, ground)
- `assets/vehicles/` : andong dan becak (4 frame tiap jenis)
- `assets/angkringan/` : gerobak angkringan, kursi besi, gelas kopi joss (awning.png sudah tidak dipakai)

Andong dan becak melintas di jalur belakang setiap 17-30 detik (tombol Andong memanggilnya
saat itu juga). Sopirnya sesekali menawarkan jasa lewat balon teks, dan klik kendaraannya untuk
mendengar celotehnya. Kalimatnya ada di VEH_LINES / VEH_TAP di js/script.js, ukuran dan
kecepatan di objek VEH.

Angkringan: gerobak selalu ada di trotoar dengan uap mengepul dari teko (lampunya menyala saat
malam). Tiap 20-40 detik Adpel dan Kepin mampir, duduk di kursi besi menghadap gerobak, minum kopi
joss, dan ngobrol (kalimat di ANGK_TALK / ANGK_SOLO di js/script.js), lalu pergi lagi. Klik gerobaknya
untuk mengajak mereka mampir sekarang. Karakternya hanya dua: Adpel dan Kepin (tombol tambah karakter dan fitur bola sudah dihapus).

Hujan: tombol Hujan menyalakan rintik pixel dua lapis (di belakang dan di depan karakter), langit
mendung, lantai basah dengan genangan yang makin banyak dan riak. Di depan angkringan terbuka payung
warung besar (belang biru muda-biru tua seperti atap gerobak, kubah membulat, tiang bambu di tengah menembus meja kecil di antara dua kursi).
Tetes hujan berhenti di kubah payung, air menetes dari ujung-ujungnya, dan di bawahnya ada bayangan
teduh tanpa genangan. Kalau Adpel dan Kepin mampir berdua, Kepin duduk di kursi kanan menghadap kiri
dan Adpel di kursi kiri menghadap kanan, saling berhadapan sambil ngopi (gelas ada di atas meja) dan
ngobrol soal hujan (RAIN_TALK / RAIN_SOLO). Malam hari ada petir kecil, lampu jalan lebih terang, dan
pantulannya di trotoar. Tekan tombol lagi untuk menghentikan hujan.

Payung digambar lewat canvas di fungsi paintAwning, meja di makeTableSrc (js/script.js), jadi tidak
butuh file gambar baru. assets/angkringan/awning.png dan assets/rain/ dari versi sebelumnya sudah
tidak dipakai.

Kucing: seekor kucing oren keliling jalan, duduk, dan tidur siang. Kalau Adpel atau Kepin yang berjalan
mendekat, ia kabur. Klik kucingnya untuk mengelus (Meong~). Saat hujan ia lari ke bawah meja
payung dan meringkuk di sana sampai hujan reda. Sprite digambar lewat canvas (makeCatSprites), logikanya
di updateCat (js/script.js).

Waktu: tombol di kiri bawah mengganti Pagi, Siang, Senja, Malam secara berurutan (awalnya mengikuti
jam perangkat). Pagi berlangit pucat kemerahan, senja berlangit oranye keunguan dengan matahari rendah
dan lampu jalan mulai menyala, dan obrolan karakter ikut menyesuaikan. Petir juga muncul saat senja.

Suara: tombol Suara (default mati) menyalakan desis hujan dan gemuruh petir yang disintesis lewat
WebAudio (tanpa file audio). Volume hujan mengikuti intensitas hujan, petir terdengar sedikit setelah
kilatnya. Suara otomatis berhenti saat tab disembunyikan.

Sembunyikan GUI (untuk rekaman atau tangkapan layar): tombol Sembunyi menghilangkan toolbar, papan nama,
dan petunjuk. Untuk menampilkan lagi tekan H atau Esc, atau ketuk pojok kanan bawah layar (area tak
terlihat). Catatan singkat cara menampilkan kembali muncul sekitar 2,5 detik setelah menyembunyikan.

Tampilan HP (portrait): adegan diskalakan mengikuti lebar layar, tombol jadi ikon,
ketuk karakter atau kucing untuk menyapa, dan pandangan ikut miring kalau HP mengizinkan.

Font pixel (Pixelify Sans) diambil dari Google Fonts saat online; kalau offline otomatis
pakai font monospace biasa.

Kustomisasi cepat (js/script.js): kalimat obrolan ada di TALK / SOLO / HELLO,
kecepatan jalan di fungsi tick (angka 0.55 dan 0.13), ukuran karakter di depthH().

Langit malam: saat malam cerah (tidak hujan), sesekali (8-18 detik) muncul bintang jatuh atau kembang api
kecil di kejauhan (dua cincin percikan, kadang beruntun 1-3 letusan). Logikanya di updateSky (js/script.js),
digambar di kanvas #skyfx di belakang gunung dan deretan toko. Berhenti saat hujan atau bukan malam.

Pantulan lampu: saat malam hujan, kubah payung angkringan memantulkan cahaya hangat lampu gerobak
(lapisan .awl, digambar di paintAwning) lengkap dengan kilau titik air dan kedip pelan.

Kabut pagi: saat waktu Pagi, dua lapis kabut pixel melayang pelan ke kiri, satu di kaki Merapi (di balik
deretan toko) dan satu tipis di atas jalan, lalu menghilang saat ganti waktu. Saat hujan kabutnya menipis.
Tile kabut digambar di kanvas (makeFogTile), geraknya di updateFog (js/script.js), posisi dan tinggi lapisan
di css/style.css (.fog.mount, .fog.road). Asap Merapi juga lebih tebal dan tinggi di pagi hari (class .smoke.xtra).

Lava Merapi: di malam hari asap gunung berganti lava. Kawah berpijar (kedip pelan), tiga aliran lava merah-oranye
dengan titik panas yang merayap turun lewat lereng, dan beberapa bara kecil naik dari puncak. Digambar sebagai SVG
sebaris di index.html (group .lava), animasinya di akhir css/style.css. Siang dan pagi tetap asap (pagi lebih tebal).

Kunang-kunang: saat malam yang cerah (tidak hujan) belasan titik cahaya kuning kehijauan melayang pelan di sekitar
jalan dan kaki toko, berkedip bergantian, lalu hilang perlahan saat hujan atau bukan malam. Digambar di kanvas
#fireflyfx (updateFireflies di js/script.js). Deretan lampu kabel gantung di antara tiang lampu jalan tetap ada
di gambar toko malam (assets/layers/shops_night.svg).

Kelelawar: saat Senja (dan beberapa detik pertama setelah berganti ke malam) rombongan 3-5 kelelawar kecil berupa
siluet pixel dengan sayap mengepak melintas di langit setiap 11-20 detik, dari kiri atau kanan, di belakang deretan
toko. Tidak muncul saat hujan, siang, atau pagi. Logikanya di updateBats (js/script.js), kanvas #batfx.

Suara suasana (tombol Suara, default mati, semua disintesis WebAudio tanpa file audio): hujan dan petir seperti
sebelumnya; klip-klop kuku kuda saat andong lewat dan kring bel saat becak lewat, makin keras di tengah layar dan
bergeser kiri-kanan mengikuti posisi kendaraan. Kodenya di blok suara js/script.js (clop, bell,
updateSound).

Daun jatuh: daun kering (cokelat, jingga, merah bata; lebih gelap saat malam) melayang ke kiri melintasi jalan, berputar
dan berayun, lalu sebagian mendarat dan menggelinding di aspal sebelum memudar. Anginnya (WIND di js/script.js)
berubah pelan dan sesekali menghembus kencang selama 5-9 detik tiap 20-40 detik: makin kencang, daun makin banyak dan
makin cepat. Saat hujan daun memudar dan tidak muncul (updateLeaves, kanvas #leaffx di depan karakter).

Merpati: saat Siang (tidak hujan) lima merpati abu-abu (dua di layar kecil) terbang dari tepi layar, mendarat di
trotoar dan jalan (kadang berkelompok), lalu berdiri, mematuk-matuk, dan melangkah pendek. Kalau karakter yang berjalan,
kucing yang bergerak, atau bola mendekat, atau merpatinya diklik, merpati itu kaget dan terbang menjauh, yang ada di
dekatnya ikut terbang sepersekian detik kemudian. Setelah 9-22 detik satu per satu kembali. Saat siang berakhir atau
hujan mulai, mereka terbang pergi bergantian. Kodenya updatePigeons (js/script.js), sprite digambar di kanvas kecil
seperti kucing (makePigeonSprites).
>>>>>>> 27d0371 (first commit)
