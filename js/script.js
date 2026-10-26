(() => {
  "use strict";

  /* ===== aset karakter ===== */
  const COUNTS = { front: 2, left: 10, right: 10, back: 2 };
  const NAMES = ["adpel", "kepin"];
  const asset = (p) => (window.ASSETS && window.ASSETS[p]) || p;

  const FRAMES = {};
  for (const who of NAMES) {
    FRAMES[who] = {};
    for (const [dir, n] of Object.entries(COUNTS)) {
      FRAMES[who][dir] = Array.from({ length: n }, (_, i) => asset(`assets/${who}/${dir}_${i}.png`));
    }
  }
  // kendaraan: tiap jenis punya 4 frame (kuda melangkah / kaki mengayuh, roda berputar)
  const VEH = {
    andong: { n: 4, ratio: 76 / 44, hf: 1.45, speed: 0.070, fd: 150, shadow: 0.72 },
    becak:  { n: 4, ratio: 68 / 40, hf: 1.15, speed: 0.085, fd: 125, shadow: 0.80 },
  };
  const VF = {};
  for (const [name, cfg] of Object.entries(VEH)) {
    VF[name] = Array.from({ length: cfg.n }, (_, i) => asset(`assets/vehicles/${name}_${i}.png`));
  }

  const CART_SRC = asset("assets/angkringan/cart.png");
  const STOOL_SRC = asset("assets/angkringan/stool.png");
  const CUP_SRC = asset("assets/angkringan/cup.png");
  const AWN_SRC = asset("assets/angkringan/awning.png");

  // preload supaya tidak berkedip saat ganti frame
  [...Object.values(FRAMES).flatMap((c) => Object.values(c).flat()), ...Object.values(VF).flat(), CART_SRC, STOOL_SRC, CUP_SRC, AWN_SRC]
    .forEach((src) => { new Image().src = src; });

  /* ===== util ===== */
  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const actors = $("actors");
  const GROUND = 0.54;               // sama dengan --g di CSS (54vh)
  const SPRITE_RATIO = 160 / 232;    // lebar / tinggi frame
  const toolbar = $("toolbar");
  const root = document.documentElement;
  let W = innerWidth, H = innerHeight;
  let He = H;          // tinggi efektif: adegan diskalakan mengikuti lebar di layar portrait
  let G = H * GROUND;  // garis tanah (piksel dari atas)
  let boost = 1;       // karakter dibesarkan di layar portrait
  let padBottom = H * 0.035;
  const SMALL = () => W < 640;

  function layout() {
    W = innerWidth; H = innerHeight;
    He = Math.min(H, W * 0.95);
    const k = clamp(H / He - 1, 0, 1);            // 0 = landscape, 1 = portrait ramping
    boost = 1 + 0.35 * k;
    G = H * (GROUND + 0.02 * k);
    const tb = toolbar.getBoundingClientRect();
    padBottom = Math.max(H * 0.035, H - tb.top + 8);
    root.style.setProperty("--g", G + "px");
    root.style.setProperty("--He", He + "px");
    for (const id of ["rainFar", "rainNear", "skyfx", "batfx", "fireflyfx", "leaffx"]) { const cv = $(id); if (cv) { cv.width = W; cv.height = H; } }
  }
  addEventListener("resize", layout);
  addEventListener("orientationchange", () => setTimeout(layout, 200));
  layout();

  // t = kedalaman: 0 = dekat toko (jauh), 1 = paling depan (dekat layar)
  const depthY = (t) => lerp(G + He * 0.07, H - padBottom, t);                 // posisi kaki
  const depthH = (t) => lerp(He * 0.185, He * 0.30, t) * boost;                // tinggi karakter
  const tFromY = (y) => clamp((y - depthY(0)) / (depthY(1) - depthY(0)), 0, 1);

  /* ===== ikon pixel 12x12 (digambar dari teks) ===== */
  const ICONS = {
    sun: { pal: { y: "#ffd23f", o: "#ff9a1f" }, rows: [
      ".....oo.....", ".o...oo...o.", "..o......o..", "....yyyy....", "...yyyyyy...", "oo.yyyyyy.oo",
      "oo.yyyyyy.oo", "...yyyyyy...", "....yyyy....", "..o......o..", ".o...oo...o.", ".....oo....." ] },
    moon: { pal: { w: "#fff6c8" }, rows: [
      "...wwww.....", ".wwwww......", ".wwww.......", "wwww........", "wwww........", "wwww........",
      "wwww.....w..", "wwwww.......", ".wwwww..wwww", ".wwwwwwwwww.", "..wwwwwwww..", "....wwww...." ] },
    ball: { pal: { k: "#2a1a12", r: "#e74c3c", w: "#ffffff" }, rows: [
      "...kkkkkk...", "..krrrrrrk..", ".krrrrrrrrk.", "krrrrrrrrrrk", "krrrrrrrrrrk", "kkkkkwwkkkkk",
      "kkkkkwwkkkkk", "kwwwwwwwwwwk", "kwwwwwwwwwwk", ".kwwwwwwwwk.", "..kwwwwwwk..", "...kkkkkk..." ] },
    wheel: { pal: { w: "#fff6e0", g: "#ffd23f" }, rows: [
      "............", "....wwww....", "..ww.ww.ww..", ".w...ww...w.", ".w...ww...w.", "wwwwwggwwwww",
      "wwwwwggwwwww", ".w...ww...w.", ".w...ww...w.", "..ww.ww.ww..", "....wwww....", "............" ] },
    cloud: { pal: { w: "#ffffff", b: "#9fd0ff" }, rows: [
      "............", "...www......", "..wwwww.ww..", ".wwwwwwwwww.", "wwwwwwwwwwww", ".wwwwwwwwww.",
      "............", "..b..b..b...", "...b..b..b..", "..b..b..b...", "............", "............" ] },
    eye: { pal: { w: "#ffffff" }, rows: [
      "............", "............", "...wwwwww...", "..w..ww..w..", ".w..wwww..w.", ".w..wwww..w.",
      "..w..ww..w..", "...wwwwww...", "............", "............", "............", "............" ] },
    speaker: { pal: { w: "#ffffff" }, rows: [
      "............", "....w.......", "...ww...w...", "wwwww....w..", "wwwww..w.w..", "wwwww..w.w..",
      "wwwww..w.w..", "wwwww....w..", "...ww...w...", "....w.......", "............", "............" ] },
    mute: { pal: { w: "#ffffff" }, rows: [
      "............", "....w.......", "...ww.......", "wwwww.w..w..", "wwwww..ww...", "wwwww..ww...",
      "wwwww.w..w..", "wwwww.......", "...ww.......", "....w.......", "............", "............" ] },
    reset: { pal: { w: "#ffffff" }, rows: [
      "............", "...w........", "..ww........", ".wwwwwwwww..", "..ww.....ww.", "...w......ww",
      "..........ww", "..........ww", "..........ww", "..ww.....ww.", "..wwwwwwww..", "............" ] },
  };
  function icon(name) {
    const { rows, pal } = ICONS[name];
    let r = "";
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (pal[ch]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[ch]}"/>`;
    }));
    return `<svg class="ic" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  }
  $("btnRide").innerHTML = icon("wheel") + '<span class="lbl">Andong</span>';
  $("btnRain").innerHTML = icon("cloud") + '<span class="lbl">Hujan</span>';
  $("btnReset").innerHTML = icon("reset") + '<span class="lbl">Reset</span>';
  document.querySelectorAll("[data-asset]").forEach((img) => { img.src = asset(img.dataset.asset); });

  /* ===== pagi / siang / senja / malam ===== */
  const btnTime = $("btnTime");
  const TODS = ["pagi", "siang", "senja", "malam"];
  let tod = (() => { const h = new Date().getHours(); return h >= 18 || h < 5 ? "malam" : h < 9 ? "pagi" : h < 16 ? "siang" : "senja"; })();
  let night = tod === "malam";
  function setTod(v) {
    tod = v; night = v === "malam";
    const cl = document.body.classList;
    cl.toggle("night", night); cl.toggle("pagi", v === "pagi"); cl.toggle("senja", v === "senja");
    const nextTod = TODS[(TODS.indexOf(v) + 1) % 4];
    btnTime.innerHTML = icon(nextTod === "malam" ? "moon" : "sun") + `<span class="lbl">${nextTod[0].toUpperCase() + nextTod.slice(1)}</span>`;
    btnTime.title = "Ganti ke " + nextTod;
  }
  btnTime.onclick = () => setTod(TODS[(TODS.indexOf(tod) + 1) % 4]);
  setTod(tod);

  // bintang
  (() => {
    const box = $("stars");
    for (let i = 0, n = SMALL() ? 50 : 90; i < n; i++) {
      const s = document.createElement("i");
      s.className = "star";
      s.style.left = rand(0, 100) + "%";
      s.style.top = rand(0, 94) + "%";
      s.style.animationDelay = rand(0, 3) + "s";
      s.style.opacity = rand(0.5, 1);
      box.appendChild(s);
    }
  })();

  /* ===== parallax mengikuti mouse / sentuhan ===== */
  const pxEls = [...document.querySelectorAll("[data-px]")].map((el) => ({ el, k: +el.dataset.px }));
  let mxTarget = 0, mx = 0;
  const coarse = matchMedia("(pointer: coarse)").matches;
  addEventListener("pointermove", (e) => { mxTarget = (e.clientX / W - 0.5) * 2; });
  const releasePointer = (e) => { if (e.pointerType !== "mouse") mxTarget = 0; };
  addEventListener("pointerup", releasePointer);
  addEventListener("pointercancel", releasePointer);

  // di HP, pandangan ikut miring (Android langsung, iOS perlu izin saat tombol ditekan)
  let tiltOn = false;
  function enableTilt() {
    if (tiltOn || !coarse || !("DeviceOrientationEvent" in window)) return;
    const attach = () => {
      tiltOn = true;
      addEventListener("deviceorientation", (e) => {
        if (e.gamma == null) return;
        const g = (screen.orientation && screen.orientation.angle === 90) ? e.beta : e.gamma;
        mxTarget = clamp((g || 0) / 22, -1, 1);
      });
    };
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then((r) => { if (r === "granted") attach(); }).catch(() => {});
      } else attach();
    } catch (_) { /* abaikan */ }
  }
  $("toolbar").addEventListener("click", enableTilt, { once: true });

  /* ===== obrolan ===== */
  const TALK = {
    day: [
      ["Siang-siang begini panas ya", "Iya, yuk beli es teh!"],
      ["Mau cari batik, nih", "Ayo, aku temani"],
      ["Gudeg di sini enak lho", "Wah, yuk makan siang!"],
      ["Lihat, ada andong lewat!", "Lucu banget kudanya"],
      ["Foto dulu di sini yuk", "Siap! Satu, dua, tiga..."],
      ["Merapi kelihatan jelas hari ini", "Cerah banget ya"],
    ],
    pagi: [
      ["Udaranya segar ya pagi ini", "Enaknya sarapan gudeg"],
      ["Tokonya baru pada buka", "Masih sepi, enak jalan-jalan"],
      ["Wangi kopi dari angkringan", "Yuk, ngopi dulu!"],
      ["Merapi cantik kena matahari", "Duh, adem banget"],
    ],
    senja: [
      ["Langitnya oranye banget!", "Fotoin dong, bagus nih"],
      ["Sebentar lagi lampu jalan nyala", "Malioboro mulai ramai"],
      ["Senja di Jogja memang juara", "Yuk cari angkringan"],
      ["Matahari mau tenggelam", "Aduh, cantiknya"],
    ],
    night: [
      ["Malioboro malam hari bagus ya", "Lampunya cantik banget"],
      ["Cari angkringan yuk", "Aku mau sate usus!"],
      ["Kopi joss enak nih", "Hangat-hangat gitu ya"],
      ["Ramai banget malam ini", "Namanya juga Malioboro"],
      ["Jangan jauh-jauh ya", "Siap, aku di sini"],
      ["Bintangnya banyak!", "Langit Jogja memang juara"],
    ],
  };
  const SOLO = {
    day: ["Bakpia mana ya?", "Toko batiknya bagus", "Ayo jalan-jalan lagi!", "Hmm, enaknya makan apa?"],
    pagi: ["Sarapan apa ya?", "Masih ngantuk...", "Segar banget udaranya"],
    senja: ["Langitnya cantik...", "Pulang atau ngopi dulu?", "Lampu-lampu mulai nyala"],
    night: ["Brr, agak dingin", "Lampunya cantik...", "Lapar, cari nasi kucing", "Kapan ya ke Tugu?"],
  };
  const HELLO = ["Halo!", "Eh, kamu!", "Hehe 😄", "Selamat datang!", "Sini, jalan bareng"];

  const VEH_LINES = {
    andong: ["Monggo naik andong!", "Keliling Malioboro, Mbak?", "Hayo, Jaran, jalan!", "Andong, Mas? Murah kok!"],
    becak: ["Becak, Mas?", "Diantar ke Tugu, Mas?", "Monggo, monggo!", "Permisi, permisi!"],
  };
  const VEH_TAP = {
    andong: ["Hihihii~", "Klip-klop, klip-klop", "Jarannya lagi semangat!", "Monggo naik, Mas!"],
    becak: ["Ting-ting!", "Becak, Mas?", "Santai, Mas, pelan-pelan", "Monggo, Mas!"],
  };

  // obrolan di angkringan
  const ANGK_TALK = [
    ["Kopi joss-nya mantep, Mas", "Arangnya sampai mendesis ya"],
    ["Sate usus dua lagi, Pak!", "Aku nasi kucing satu"],
    ["Ngangkring begini enak ya", "Setuju, hangat-hangat gini"],
    ["Gorengannya masih panas", "Awas, jangan kegigit lidah"],
    ["Teh jahe-nya juga enak", "Wah, aku pesan juga deh"],
    ["Santai begini bikin betah", "Jogja memang begitu"],
  ];
  const ANGK_SOLO = ["Seruput dulu...", "Hangat banget kopinya", "Nasi kucingnya pas porsinya", "Ah, nikmatnya"];
  const CART_LINES = ["Monggo, kopi joss-nya!", "Ada nasi kucing, sate usus...", "Sini duduk, Mas, Mbak!", "Arangnya baru dinyalakan lho"];

  // obrolan saat hujan
  const RAIN_TALK = [
    ["Wah, hujannya deras banget", "Untung ada terpal di sini"],
    ["Jogja kalau hujan ngangenin", "Apalagi sambil ngopi joss"],
    ["Dengerin rintik hujannya deh", "Bikin ngantuk ya, hehe"],
    ["Genangannya makin banyak", "Jangan lompat-lompat ya"],
    ["Hujan begini enaknya gorengan", "Sama wedang jahe hangat"],
    ["Semoga cepat reda ya", "Hujannya bikin sejuk"],
  ];
  const RAIN_SOLO = ["Brr, dingin...", "Hujannya awet nih", "Tenang ya dengar rintik hujan", "Lampunya cantik kena hujan"];

  /* ===== karakter ===== */
  let pets = [];
  let balls = [];
  let petId = 0;
  let shelterList = [];
  let vehicles = [];
  let nextChat = performance.now() + 5000;
  let nextVeh = performance.now() + rand(4500, 7000);
  let vehLane = 0;
  let rideToggle = false;
  let nextVisit = performance.now() + rand(9000, 15000);
  let visiting = false;
  let angkChatAt = 0;

  function spawn(who, opts = {}) {
    if (pets.length >= (SMALL() ? 6 : 12)) return;
    const el = document.createElement("img");
    el.className = "pet";
    el.draggable = false;
    el.alt = who;
    const shadow = document.createElement("div");
    shadow.className = "shadow";
    actors.append(shadow, el);

    const p = {
      id: ++petId, who, el, shadow, frames: FRAMES[who],
      x: opts.x ?? rand(W * 0.1, W * 0.9),
      t: opts.t ?? rand(0.2, 0.9),
      tx: 0, tt: 0,
      state: "idle", until: performance.now() + rand(300, 1200),
      sf: rand(0.85, 1.15),        // variasi kecepatan
      face: "front", idleBack: false,
      frame: 0, nextFrame: 0, jump: 0, bubble: null,
    };
    p.tx = p.x; p.tt = p.t;
    el.addEventListener("click", () => greet(p));
    pets.push(p);
  }

  function greet(p) {
    if (!(p.visit && p.visit.phase === "sit")) p.jump = 1;
    const fy = depthY(p.t), h = depthH(p.t);
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = "❤";
    heart.style.left = p.x - 8 + "px";
    heart.style.top = fy - h - 18 + "px";
    actors.append(heart);
    setTimeout(() => heart.remove(), 1100);
    say(p, pick(HELLO), 1800);
  }

  function say(p, text, ms = 2600) {
    if (!pets.includes(p)) return;
    if (p.bubble) p.bubble.el.remove();
    const el = document.createElement("div");
    el.className = "bubble";
    el.textContent = text;
    actors.append(el);
    p.bubble = { el, until: performance.now() + ms };
  }

  function chooseWalk(p) {
    const far = rand(W * 0.14, W * 0.4) * (Math.random() < 0.5 ? -1 : 1);
    p.tx = clamp(p.x + far, W * 0.08, W * 0.92);
    p.tt = clamp(p.t + rand(-0.22, 0.22), 0, 1);
    if (Math.random() < 0.12) p.tt = rand(0, 1);        // sesekali pindah jalur jauh
  }

  function startChat(now) {
    const mode = tod === "siang" ? "day" : tod === "malam" ? "night" : tod;
    const free = pets.filter((p) => !p.visit);
    if (free.length >= 2 && Math.random() < 0.7) {
      const a = pick(free);
      const others = free.filter((q) => q !== a).sort((u, v) => Math.abs(u.x - a.x) - Math.abs(v.x - a.x));
      const b = others[0];
      const [l0, l1] = pick(rain.on ? RAIN_TALK : TALK[mode]);
      for (const p of [a, b]) { p.state = "idle"; p.idleBack = false; p.until = now + 5200; p.tx = p.x; p.tt = p.t; }
      say(a, l0, 2500);
      setTimeout(() => say(b, l1, 2500), 2300);
    } else if (free.length) {
      say(pick(free), pick(rain.on ? RAIN_SOLO : SOLO[mode]), 2600);
    }
  }

  /* ===== andong dan becak ===== */
  const vehH = (v) => depthH(0) * v.cfg.hf;

  function spawnVehicle(type) {
    if (vehicles.length >= (SMALL() ? 1 : 2)) return false;
    type = type || (Math.random() < 0.5 ? "andong" : "becak");
    const cfg = VEH[type];
    const el = document.createElement("img");
    el.className = "vehicle";
    el.draggable = false;
    el.alt = type;
    const shadow = document.createElement("div");
    shadow.className = "shadow";
    actors.append(shadow, el);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const v = {
      type, cfg, el, shadow, dir, lane: vehLane++ % 2, frame: 0, nextFrame: 0, cur: null, flipped: null,
      bubble: null, done: false, nextLine: performance.now() + rand(2500, 5000), x: 0,
    };
    const w = vehH(v) * cfg.ratio;
    v.x = dir > 0 ? -w / 2 - 10 : W + w / 2 + 10;
    el.addEventListener("click", () => vsay(v, pick(VEH_TAP[type]), 2200));
    vehicles.push(v);
    return true;
  }

  function vsay(v, text, ms = 2400) {
    if (!vehicles.includes(v)) return;
    if (v.bubble) v.bubble.el.remove();
    const el = document.createElement("div");
    el.className = "bubble";
    el.textContent = text;
    actors.append(el);
    v.bubble = { el, until: performance.now() + ms };
  }

  /* ===== angkringan dan kopi joss ===== */
  const CART_T = 0.24, SEAT_T = 0.30;      // kedalaman gerobak dan kursi di trotoar
  const cart = { el: null, stools: [], bubble: null, g: null, awL: 0, awR: 0, awTop: 0, u: 1, awKey: "", awTopY: [], awBotY: [], drips: [] };

  // meja kayu kecil pixel-art (dibuat sekali lewat canvas)
  function makeTableSrc() {
    const cv = document.createElement("canvas");
    cv.width = 32; cv.height = 20;
    const c = cv.getContext("2d");
    const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    px(1, 0, 30, 1, "#6b4122");                       // tepi belakang
    px(0, 1, 32, 3, "#d9a066");                       // permukaan meja
    for (const x of [8, 16, 24]) px(x, 1, 1, 3, "#b27a42");   // garis papan
    px(2, 1, 6, 1, "#efc088");                        // kilau
    px(0, 4, 32, 2, "#8a5a2e");                       // sisi depan meja
    px(0, 4, 32, 1, "#a8723a");
    for (const x of [3, 26]) {                        // kaki meja
      px(x, 6, 3, 14, "#7a4a24");
      px(x, 6, 1, 14, "#9c6a38");
    }
    px(5, 14, 22, 1, "#6b4122");                      // palang kaki
    return cv.toDataURL();
  }

  function buildCart() {
    const el = document.createElement("div");
    el.className = "cart";
    const img = document.createElement("img");
    img.src = CART_SRC; img.draggable = false; img.alt = "angkringan";
    const glow = document.createElement("div");
    glow.className = "lampglow";
    el.append(img, glow);
    // uap dari teko: [x%, y%, jeda]
    [[29, 45, 0], [29, 45, 0.7], [29, 45, 1.4], [17, 38, 0.35], [17, 38, 1.1]].forEach(([x, y, d]) => {
      const s = document.createElement("i");
      s.className = "steam";
      s.style.left = x + "%"; s.style.top = y + "%"; s.style.animationDelay = d + "s";
      el.appendChild(s);
    });
    actors.append(el);
    cart.el = el;
    const tb = document.createElement("img");
    tb.className = "table"; tb.src = makeTableSrc(); tb.draggable = false; tb.alt = "meja";
    actors.append(tb);
    cart.table = tb;
    // terpal tambahan yang dibentangkan saat hujan
    const aw = document.createElement("div");
    aw.className = "awning";
    const awn = document.createElement("i");
    awn.className = "awn";
    const awl = document.createElement("i");
    awl.className = "awl";
    aw.append(awn, awl);
    cart.awl = awl;
    actors.append(aw);
    // tiang payung: satu batang di tengah, diletakkan di belakang karakter
    cart.poles2 = [0].map(() => { const q = document.createElement("i"); q.className = "pole2"; actors.append(q); return q; });
    cart.awning = aw; cart.awn = awn;
    img.addEventListener("click", () => { cartSay(pick(CART_LINES)); startVisit(performance.now()); });
    for (let i = 0; i < 2; i++) {
      const st = document.createElement("img");
      st.className = "stool"; st.src = STOOL_SRC; st.draggable = false; st.alt = "kursi besi";
      actors.append(st);
      cart.stools.push(st);
    }
  }

  function cartSay(text, ms = 2600) {
    if (cart.bubble) cart.bubble.el.remove();
    const el = document.createElement("div");
    el.className = "bubble";
    el.textContent = text;
    actors.append(el);
    cart.bubble = { el, until: performance.now() + ms };
  }

  // payung warung pixel-art: kubah belang merah-krem, tepi bergerigi, rusuk tiap panel, kuncup kuningan di puncak
  function paintAwning(Wp, lampX) {
    const Hp = 22, OFF = 3, PW = 8, DOME = 10, cv = document.createElement("canvas");
    cv.width = Wp; cv.height = Hp;
    const c = cv.getContext("2d");
    const topY = [], botY = [], drips = [];
    for (let i = 0; i < Wp; i++) {
      const e = Wp > 1 ? 2 * i / (Wp - 1) - 1 : 0;
      const m = i % PW;
      const arc = (1 - Math.sqrt(1 - 0.94 * e * e)) / 0.755;   // profil lingkaran: puncak membulat, tepi menukik
      topY.push(OFF + Math.round(DOME * arc));
      botY.push(Math.min(Hp - 1, OFF + DOME + 3 + Math.round(1.6 * Math.sin(Math.PI * (m + 0.5) / PW)) - Math.round(3 * arc)));
      if (m === PW / 2 && i > 1 && i < Wp - 2) drips.push(i);
    }
    const RED = ["#3468ac", "#2b5a96", "#224a80"], CREAM = ["#68a0dc", "#5a90cc", "#4a7ab8"];   // biru seperti atap angkringan
    for (let i = 0; i < Wp; i++) {
      const ae = Wp > 1 ? Math.abs(2 * i / (Wp - 1) - 1) : 0;
      const tier = ae > 0.72 ? 2 : ae > 0.4 ? 1 : 0;
      const pal = Math.floor(i / PW) % 2 ? CREAM : RED;
      for (let y = topY[i]; y <= botY[i]; y++) {
        let col = pal[tier];
        if (i % PW === 0 && y > topY[i]) col = "#1c3a66";
        if (y === topY[i] + 1 && tier === 0) col = pal === RED ? "#5b8fd0" : "#a6cdf4";
        if (y === topY[i] || y === botY[i]) col = "#16294a";
        else if (y > topY[i] + 1 && y < botY[i] - 1 && (i * 7 + y * 13) % 31 === 0) col = "#e6f2ff";
        c.fillStyle = col;
        c.fillRect(i, y, 1, 1);
      }
    }
    const cx = Math.floor(Wp / 2);
    c.fillStyle = "#d9b977"; c.fillRect(cx - 1, 0, 2, OFF);
    c.fillStyle = "#fff0b8"; c.fillRect(cx - 1, 0, 1, 1);
    cart.awn.style.backgroundImage = `url("${cv.toDataURL()}")`;
    // pantulan lampu angkringan di kubah basah: hangat di sisi lampu, memudar ke arah lain, ada kilau titik air
    if (cart.awl) {
      const cl = document.createElement("canvas");
      cl.width = Wp; cl.height = Hp;
      const l = cl.getContext("2d");
      const lx = clamp(lampX, Wp * 0.5, Wp - 2), ly = 19, R = clamp(Wp * 0.6, 14, 30);
      for (let i = 0; i < Wp; i++) {
        for (let y = topY[i]; y <= botY[i]; y++) {
          const I = 1 - Math.hypot(i - lx, (y - ly) * 1.6) / R;
          if (I <= 0.08) continue;
          if (I > 0.25 && (i * 5 + y * 3) % 7 === 0) l.fillStyle = "rgba(255,246,205,.85)";
          else l.fillStyle = I > 0.66 ? "rgba(255,226,140,.55)" : I > 0.33 ? "rgba(255,200,105,.38)" : "rgba(255,180,85,.22)";
          l.fillRect(i, y, 1, 1);
        }
      }
      cart.awl.style.backgroundImage = `url("${cl.toDataURL()}")`;
    }
    cart.awTopY = topY; cart.awBotY = botY; cart.drips = drips;
  }

  function updateCart(now) {
    const h = depthH(CART_T) * 1.3, w = h * (72 / 64);
    const feet = depthY(CART_T);
    const cx = Math.min(W - w / 2 - 6, W * 0.84);
    const seatH = depthH(SEAT_T), petW = seatH * SPRITE_RATIO;
    const seat0 = cx - w * 0.5 - petW * 0.4;
    const seatX = [seat0, seat0 - petW * 1.4];
    const nSeats = seatX[1] - petW * 0.5 > 2 ? 2 : 1;
    const g = { cx, w, h, feet, seatX, nSeats, seatH, petW, stoolH: seatH * 0.30, seatFeet: depthY(SEAT_T) };
    cart.g = g;

    const s = cart.el.style;
    s.width = w + "px"; s.height = h + "px"; s.left = cx - w / 2 + "px"; s.top = feet - h + "px";
    s.zIndex = Math.floor(feet);
    s.setProperty("--u", h / 64 + "px");

    const sw = g.stoolH * 30 / 24;
    cart.stools.forEach((st, i) => {
      st.style.display = i < nSeats ? "" : "none";
      st.style.height = g.stoolH + "px";
      st.style.left = seatX[i] - sw / 2 + "px";
      st.style.top = g.seatFeet - g.stoolH + "px";
      st.style.zIndex = Math.floor(g.seatFeet) + 1;
    });

    // terpal tambahan memanjang dari kanopi gerobak ke atas kedua kursi
    const u = h / 64;
    // payung berpusat di antara kedua kursi, tiangnya jatuh di celah antara dua karakter
    const xc = (seatX[0] + seatX[nSeats - 1]) / 2, hw = nSeats > 1 ? (seatX[0] - seatX[1]) / 2 + petW * 0.8 : petW * 0.9;
    const Wp = Math.max(8, Math.round(2 * hw / u));
    const awL = Math.max(2, xc - Wp * u / 2), awR = awL + Wp * u, awTop = feet - h;
    cart.awL = awL; cart.awR = awR; cart.awTop = awTop; cart.u = u;
    const lampX = (cx - w / 2 + w * 0.104 - awL) / u;   // posisi lampu gerobak dalam piksel kanvas payung
    const key = Wp + ":" + u.toFixed(2) + ":" + Math.round(lampX);
    if (cart.awKey !== key) { cart.awKey = key; paintAwning(Wp, lampX); }
    const as = cart.awning.style;
    as.left = awL + "px"; as.width = Wp * u + "px"; as.top = awTop + "px"; as.height = 22 * u + "px";
    as.zIndex = Math.floor(g.seatFeet) + 3;
    as.setProperty("--u", u + "px");
    // meja kecil di antara dua kursi
    if (nSeats > 1) {
      const tw = petW * 0.62, th = tw / 1.6, tx = (seatX[0] + seatX[1]) / 2;
      g.tbl = { x: tx, w: tw, h: th, top: g.seatFeet + 1 - th };
      const ts = cart.table.style;
      ts.display = ""; ts.width = tw + "px"; ts.height = th + "px";
      ts.left = tx - tw / 2 + "px"; ts.top = g.tbl.top + "px"; ts.zIndex = Math.floor(g.seatFeet) + 1;
    } else { g.tbl = null; cart.table.style.display = "none"; }
    // tiang payung di tengah, di depan karakter (menembus meja kalau ada meja)
    const backFeet = nSeats > 1 ? g.seatFeet + u * 2 : depthY(SEAT_T + 0.05), backZ = Math.floor(g.seatFeet) + 2;
    const q = cart.poles2[0].style, px = awL + Wp * u * 0.5 - 1.1 * u;
    const topPx = awTop + cart.awBotY[Math.floor(Wp / 2)] * u;
    q.left = px + "px"; q.width = 2.2 * u + "px"; q.top = topPx + "px";
    q.height = Math.max(0, backFeet - topPx) + "px"; q.zIndex = backZ;
    q.setProperty("--u", u + "px");

    if (cart.bubble) {
      if (now > cart.bubble.until) { cart.bubble.el.remove(); cart.bubble = null; }
      else {
        cart.bubble.el.style.left = clamp(cx, 100, W - 100) + "px";
        cart.bubble.el.style.top = feet - h - 2 + "px";
      }
    }
  }

  // ajak karakter mampir: yang bukan sedang mengejar bola jalan ke kursi, duduk, minum, lalu pergi
  function startVisit() {
    if (!cart.g || balls.length || pets.some((p) => p.visit)) return false;
    const free = pets.filter((p) => !p.visit);
    if (!free.length) return false;
    const pool = free.slice().sort(() => Math.random() - 0.5);
    const chosen = [pool[0]];
    if (cart.g.nSeats > 1 && pool.length > 1) chosen.push(pool.find((q) => q !== pool[0] && q.who !== pool[0].who) || pool[1]);
    chosen.sort((a, b) => b.x - a.x);                         // yang paling kanan duduk paling dekat gerobak
    // kalau berdua: Kepin di kursi kanan menghadap kiri, Adpel di kursi kiri menghadap kanan, jadi saling berhadapan
    if (chosen.length === 2 && chosen[1].who === "kepin" && chosen[0].who !== "kepin") chosen.reverse();
    chosen.forEach((p, i) => { p.visit = { phase: "go", seat: i, dir: chosen.length > 1 && i === 0 ? "left" : "right", until: 0, cup: null, nextSip: 0 }; });
    return true;
  }

  function startSit(p, now) {
    const v = p.visit;
    v.phase = "sit";
    v.until = now + rand(14000, 22000);
    v.nextSip = now + rand(900, 2200);
    const el = document.createElement("div");
    el.className = "cup";
    const img = document.createElement("img");
    img.src = CUP_SRC; img.draggable = false;
    el.appendChild(img);
    actors.append(el);
    v.cup = el;
    p.face = v.dir; p.idleBack = false;
    angkChatAt = now + 2200;
  }

  function endVisit(p, now = performance.now()) {
    if (p.visit && p.visit.cup) p.visit.cup.remove();
    p.visit = null;
    p.state = "idle"; p.until = now + rand(600, 1600); p.tx = p.x; p.tt = p.t;
  }

  /* ===== hujan ===== */
  const toastEl = $("toast");
  let toastTimer = 0;
  function showToast(text, ms = 3200) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  const rain = { on: false, k: 0, wet: 0, was: false, drops: [], splashes: [], puddles: [], ripples: [], bolt: null, nextBolt: 0, nextRipple: 0 };
  const btnRain = $("btnRain"), wetEl = $("wet"), flashEl = $("flash");
  const fx = $("rainFar").getContext("2d");      // di belakang karakter: tetes jauh, genangan, pantulan lampu, petir
  const nx = $("rainNear").getContext("2d");     // di depan karakter: tetes dekat
  const SLOPE = 0.4;                             // kemiringan tetes (angin sedikit ke kiri)
  const rpx = () => Math.max(2, Math.round(He / 260));   // ukuran satu "pixel" hujan

  function makePuddles() {
    const n = SMALL() ? 5 : 8;
    rain.puddles = Array.from({ length: n }, () => ({ u: rand(0.04, 0.96), v: rand(0.05, 0.95), s: rand(0.6, 1.1) }));
  }
  function puddleGeom(pd, P) {
    const w = depthH(pd.v) * 0.95 * pd.s * Math.sqrt(rain.wet);
    const hh = Math.max(P, w * 0.085);
    return { x: pd.u * W, y: depthY(pd.v) - hh * 0.5, w, hh };
  }
  function newDrop(layer, stagger) {
    const sc = clamp(He / 720, 0.6, 1.2), far = layer === 0;
    const ly = G + (H - G) * (far ? rand(0, 0.45) : rand(0.3, 1));
    return { layer, on: true, lx: rand(0, W), ly, vy: (far ? rand(520, 640) : rand(820, 1000)) * sc, len: far ? 4 : 7,
             y: -rand(10, stagger ? Math.max(40, ly) : 160) };
  }
  function addSplash(x, y, layer) { if (rain.splashes.length < 90) rain.splashes.push({ x, y, layer, age: 0 }); }

  function makeBolt(now) {
    const P = rpx(), yMax = G - He * 0.28;
    let x = rand(W * 0.12, W * 0.88), y = 0;
    const pts = [[x, y]];
    while (y < yMax) { y += rand(P * 6, P * 12); x += rand(-P * 5, P * 5); pts.push([x, Math.min(y, yMax)]); }
    rain.bolt = { pts, until: now + 260 };
    thunder();
    flashEl.classList.remove("go");
    void flashEl.offsetWidth;
    flashEl.classList.add("go");
    setTimeout(() => flashEl.classList.remove("go"), 700);
  }
  function drawBolt(ctx, b, P) {
    for (const pass of [0, 1]) {
      ctx.fillStyle = pass ? "#ffffff" : "rgba(160,185,255,.35)";
      const s = pass ? P : P * 3, o = pass ? 0 : P;
      for (let i = 1; i < b.pts.length; i++) {
        const [x0, y0] = b.pts[i - 1], [x1, y1] = b.pts[i];
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / P));
        for (let k = 0; k <= n; k++) {
          ctx.fillRect(Math.round((x0 + (x1 - x0) * k / n) / P) * P - o, Math.round((y0 + (y1 - y0) * k / n) / P) * P - o, s, s);
        }
      }
    }
  }

  // lampu jalan di malam hujan: cahaya lebih terang dan pantulannya di trotoar basah
  function drawLamps(ctx, a, now, P) {
    const th = He * 0.38, tileW = th * 1024 / 230;             // ukuran satu ubin lapisan toko
    const off = -80 + (-mx * 22);                              // sama dengan posisi lapisan toko
    const ly = G - th + th * 86 / 230, R = th * 0.62;
    const flick = 0.93 + 0.07 * Math.sin(now / 170);
    for (const f of [343 / 1024, 855 / 1024]) {
      const first = off + f * tileW;
      for (let k = Math.floor((-R - first) / tileW); first + k * tileW < W + R; k++) {
        const x = first + k * tileW;
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(x, ly, 0, x, ly, R);
        g.addColorStop(0, `rgba(255,214,120,${(0.34 * a * flick).toFixed(3)})`);
        g.addColorStop(1, "rgba(255,214,120,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - R, ly - R, R * 2, R * 2);
        ctx.globalCompositeOperation = "source-over";
        const n = Math.floor((H - G) * 0.5 / (P * 2));        // pantulan bergelombang di lantai basah
        for (let j = 0; j < n; j++) {
          ctx.fillStyle = `rgba(255,214,120,${(0.3 * a * (1 - j / n)).toFixed(3)})`;
          const wd = P * (3 + (Math.sin(now / 260 + j * 0.9) > 0.3 ? 2 : 0));
          ctx.fillRect(Math.round((x - wd / 2) / P) * P, Math.round((G + 4 + j * P * 2) / P) * P, wd, P);
        }
      }
    }
  }

  function drawPuddle(ctx, pd, P) {
    const g = puddleGeom(pd, P);
    if (g.w < P * 3 || sheltered(g.x, g.y)) return;
    ctx.fillStyle = night ? "rgba(70,95,150,.62)" : "rgba(120,152,196,.55)";
    for (let j = -g.hh; j <= g.hh; j += P) {
      const kk = Math.sqrt(Math.max(0, 1 - (j / g.hh) * (j / g.hh)));
      const hw = Math.round(g.w * 0.5 * kk / P) * P;
      if (hw > 0) ctx.fillRect(Math.round((g.x - hw) / P) * P, Math.round((g.y + j) / P) * P, hw * 2, P);
    }
    ctx.fillStyle = night ? "rgba(190,205,255,.35)" : "rgba(235,245,255,.5)";
    ctx.fillRect(Math.round((g.x - g.w * 0.22) / P) * P, Math.round((g.y - g.hh) / P) * P, Math.max(P, Math.round(g.w * 0.18 / P) * P), P);
  }

  function setRain(on) {
    if (rain.on === on) return;
    rain.on = on;
    const now = performance.now();
    document.body.classList.toggle("rain", on);
    btnRain.classList.toggle("on", on);
    btnRain.title = on ? "Hentikan hujan" : "Hujan";
    if (on) {
      if (!rain.puddles.length) makePuddles();
      rain.nextBolt = now + rand(5000, 11000);
      showToast("Hujan! Yuk berteduh di angkringan");
      startVisit();                                           // dua karakter duduk ngopi sambil berteduh
    } else {
      for (const p of pets) {
        if (p.visit && p.visit.phase === "sit") p.visit.until = now + rand(2500, 6000);
        else if (!p.visit) { p.state = "idle"; p.until = now + rand(800, 3000); }
      }
      showToast("Hujan reda");
    }
  }

  // area kering di bawah terpal: tidak ada genangan, ada bayangan teduh
  function sheltered(x, y) {
    if (!cart.g || cart.awR <= cart.awL) return false;
    return x > cart.awL - cart.u * 2 && x < cart.awR && Math.abs(y - cart.g.seatFeet) < cart.u * 7;
  }
  function drawShade(ctx, P, a) {
    const x0 = cart.awL, x1 = cart.awR, yc = cart.g.seatFeet - cart.u * 2, hh = cart.u * 3.4;
    ctx.fillStyle = `rgba(10,20,45,${(0.22 * a).toFixed(3)})`;
    for (let j = -hh; j <= hh; j += P) {
      const k = Math.sqrt(Math.max(0, 1 - (j / hh) * (j / hh)));
      const inset = (1 - k) * (x1 - x0) * 0.1;
      const xa = Math.round((x0 + inset) / P) * P, xb = Math.round((x1 - inset) / P) * P;
      if (xb > xa) ctx.fillRect(xa, Math.round((yc + j) / P) * P, xb - xa, P);
    }
  }
  // tetes air yang menggantung di tepi bawah terpal lalu jatuh ke tanah
  const drips = [];
  function updateDrips(dt, P, a) {
    const g = cart.g, u = cart.u, n = cart.drips.length;
    if (a > 0.05 && drips.length < 30) {
      for (let s = 0; s < n; s++) {
        if (Math.random() < a * dt * 0.4) {
          const i = cart.drips[s];
          drips.push({ x: cart.awL + (i + 0.5) * u, y: cart.awTop + (cart.awBotY[i] + 1) * u, vy: 0,
                       land: g.seatFeet - u * 2 + rand(-u * 1.5, u * 2.5), hold: rand(0.2, 0.55) });
        }
      }
    }
    const grav = 900 * clamp(He / 720, 0.6, 1.2);
    nx.fillStyle = night ? "#bcd2f5" : "#f2f7ff";
    nx.globalAlpha = 0.9;
    for (let k = drips.length - 1; k >= 0; k--) {
      const d = drips[k];
      if (d.hold > 0) {
        d.hold -= dt;
        nx.fillRect(Math.round(d.x / P) * P, Math.round(d.y / P) * P, P, P);
      } else {
        d.vy += grav * dt; d.y += d.vy * dt;
        if (d.y >= d.land) { addSplash(d.x, d.land, 0); drips.splice(k, 1); continue; }
        nx.fillRect(Math.round(d.x / P) * P, Math.round(d.y / P) * P, P, P * 2);
      }
    }
    nx.globalAlpha = 1;
  }

  // tempat berteduh untuk karakter yang tidak sedang duduk: di bawah terpal tambahan, sedikit di belakang kursi
  function shelterSlot(p) {
    const g = cart.g, n = shelterList.length, i = Math.max(0, shelterList.indexOf(p));
    const xL = cart.awL + g.petW * 0.45, xR = Math.max(xL, g.seatX[0] + g.petW * 0.25);
    return { x: n <= 1 ? (xL + xR) / 2 : xL + (xR - xL) * i / (n - 1), t: SEAT_T - 0.05 };
  }

  function updateRain(now, dt) {
    const target = rain.on ? 1 : 0;
    rain.k += (target - rain.k) * Math.min(1, dt * 0.9);
    if (Math.abs(target - rain.k) < 0.01) rain.k = target;
    rain.wet = clamp(rain.wet + (rain.on ? dt / 18 : -dt / 14), 0, 1);

    if (!(rain.k > 0 || rain.wet > 0 || rain.bolt)) {
      if (rain.was) {
        fx.clearRect(0, 0, W, H); nx.clearRect(0, 0, W, H);
        wetEl.style.opacity = 0;
        rain.was = false; rain.puddles = []; rain.ripples = []; rain.splashes = []; drips.length = 0;
        rain.drops.forEach((d) => { d.on = false; });
      }
      return;
    }
    rain.was = true;
    const P = rpx();
    const aK = rain.on ? rain.k : 0, awOK = !!cart.g && cart.awR > cart.awL;
    if (!rain.drops.length) {
      const n = SMALL() ? 60 : 90;
      for (let l = 0; l < 2; l++) for (let i = 0; i < n; i++) rain.drops.push({ layer: l, on: false, lx: 0, ly: 0, vy: 0, len: 3, y: 0 });
    }
    fx.clearRect(0, 0, W, H); nx.clearRect(0, 0, W, H);
    wetEl.style.opacity = (rain.wet * 0.9).toFixed(3);

    if (night && rain.k > 0) drawLamps(fx, rain.k, now, P);
    if (awOK && aK > 0.02) drawShade(fx, P, aK);

    // genangan dan riak
    if (rain.wet > 0.04) for (const pd of rain.puddles) drawPuddle(fx, pd, P);
    if (rain.wet > 0.25 && rain.puddles.length && now > rain.nextRipple) {
      rain.ripples.push({ i: Math.floor(Math.random() * rain.puddles.length), age: 0 });
      rain.nextRipple = now + rand(120, 320);
    }
    rain.ripples = rain.ripples.filter((r) => (r.age += dt) < 0.9);
    for (const r of rain.ripples) {
      const pd = rain.puddles[r.i];
      if (!pd) continue;
      const g = puddleGeom(pd, P), f = r.age / 0.9;
      if (sheltered(g.x, g.y)) continue;
      const rx = lerp(P * 2, g.w * 0.42, f), ry = rx * 0.28;
      fx.fillStyle = `rgba(230,242,255,${(0.55 * (1 - f)).toFixed(3)})`;
      for (let a = 0; a < 6.28; a += 0.5) {
        fx.fillRect(Math.round((g.x + Math.cos(a) * rx) / P) * P, Math.round((g.y + Math.sin(a) * ry) / P) * P, P, P);
      }
    }

    // tetes hujan: gerakkan dulu, lalu gambar per lapisan (tiap tetes cukup 1-2 persegi panjang)
    for (const d of rain.drops) {
      if (!d.on) { if (Math.random() < rain.k * dt * 2.5) Object.assign(d, newDrop(d.layer, true)); continue; }
      d.y += d.vy * dt;
      if (awOK && aK > 0.3 && d.ly <= cart.g.seatFeet + 2) {          // tetes yang mengenai terpal berhenti di sana
        const x = d.lx + SLOPE * (d.ly - d.y);
        if (x > cart.awL && x < cart.awR) {
          const i = clamp(Math.floor((x - cart.awL) / cart.u), 0, cart.awTopY.length - 1);
          const ty = cart.awTop + cart.awTopY[i] * cart.u;
          if (d.y >= ty && d.y - d.vy * dt < ty) {
            if (Math.random() < 0.5) addSplash(x, ty, 1);
            if (Math.random() < rain.k) Object.assign(d, newDrop(d.layer, false)); else d.on = false;
            continue;
          }
        }
      }
      if (d.y >= d.ly) {
        addSplash(d.lx, d.ly, d.layer);
        if (Math.random() < rain.k) Object.assign(d, newDrop(d.layer, false)); else d.on = false;
      }
    }
    for (let layer = 0; layer < 2; layer++) {
      const ctx = layer ? nx : fx;
      ctx.globalAlpha = layer ? 0.85 : 0.55;
      ctx.fillStyle = night ? "#a9c4ee" : "#e8f1ff";
      for (const d of rain.drops) {
        if (!d.on || d.layer !== layer) continue;
        const x0 = d.lx + SLOPE * (d.ly - d.y);
        let sx = 0, sTop = 0, sN = 0;
        for (let i = 0; i < d.len; i++) {
          const xi = Math.round((x0 + i * SLOPE * P) / P) * P, yi = Math.floor((d.y - i * P) / P) * P;
          if (sN && xi === sx) { sN++; sTop = yi; }
          else { if (sN) ctx.fillRect(sx, sTop, P, sN * P); sx = xi; sTop = yi; sN = 1; }
        }
        ctx.fillRect(sx, sTop, P, sN * P);
      }
      ctx.globalAlpha = 1;
    }

    if (awOK) updateDrips(dt, P, aK);

    // percikan di lantai
    rain.splashes = rain.splashes.filter((s) => (s.age += dt) < 0.3);
    for (const s of rain.splashes) {
      const ctx = s.layer ? nx : fx, fr = Math.floor(s.age / 0.3 * 3);
      const x = Math.round(s.x / P) * P, y = Math.round(s.y / P) * P;
      ctx.fillStyle = `rgba(215,232,255,${[0.85, 0.7, 0.45][fr]})`;
      if (fr === 0) ctx.fillRect(x, y - P, P, P);
      else if (fr === 1) { ctx.fillRect(x - P, y - P, P, P); ctx.fillRect(x + P, y - P, P, P); ctx.fillRect(x, y - P * 2, P, P); }
      else { ctx.fillRect(x - P * 2, y, P, P); ctx.fillRect(x + P * 2, y, P, P); }
    }

    // petir kecil di malam hari
    if (rain.bolt) { if (now > rain.bolt.until) rain.bolt = null; else drawBolt(fx, rain.bolt, P); }
    if ((night || tod === "senja") && rain.on && !rain.bolt && now > rain.nextBolt) { makeBolt(now); rain.nextBolt = now + rand(9000, 20000); }
  }

  /* ===== bintang jatuh dan kembang api kecil di kejauhan (malam yang cerah) ===== */
  const skyCv = $("skyfx"), sky = skyCv.getContext("2d");
  const skyS = { stars: [], fw: [], next: 0, dirty: false };
  const FW_COLORS = ["#ffd27a", "#ff8fa3", "#8fd4ff", "#b9ff9a", "#e2a8ff", "#fff3c4"];
  function launchStar() {
    const dir = Math.random() < 0.5 ? -1 : 1, sp = rand(0.5, 0.75) * W;
    skyS.stars.push({ x: rand(W * 0.2, W * 0.8), y: rand(G * 0.05, G * 0.32), vx: dir * sp, vy: sp * rand(0.3, 0.5), age: 0, life: rand(0.9, 1.3) });
  }
  function launchFw() {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let b = 0; b < n; b++) {
      const y = rand(G * 0.16, G * 0.4);
      skyS.fw.push({ age: -b * rand(0.5, 0.9), x: rand(W * 0.12, W * 0.88), y, y0: G * 0.66, col: pick(FW_COLORS), parts: null });
    }
  }
  function updateSky(now, dt) {
    const calm = night && !rain.on && rain.k < 0.05 && !document.hidden;
    if (!night) {
      if (skyS.dirty || skyS.stars.length || skyS.fw.length) { skyS.stars.length = 0; skyS.fw.length = 0; sky.clearRect(0, 0, W, H); skyS.dirty = false; }
      skyS.next = 0;
      return;
    }
    if (calm) {
      if (!skyS.next) skyS.next = now + rand(3000, 7000);
      if (now > skyS.next) { (Math.random() < 0.65 ? launchStar : launchFw)(); skyS.next = now + rand(8000, 18000); }
    } else skyS.next = 0;
    if (!skyS.stars.length && !skyS.fw.length) {
      if (skyS.dirty) { sky.clearRect(0, 0, W, H); skyS.dirty = false; }
      return;
    }
    skyS.dirty = true;
    sky.clearRect(0, 0, W, H);
    const P = rpx(), snap = (v) => Math.round(v / P) * P, R = He * 0.075, grav = He * 0.05;

    // bintang jatuh: kepala putih dengan ekor yang memudar
    skyS.stars = skyS.stars.filter((s) => (s.age += dt) < s.life);
    for (const s of skyS.stars) {
      const fade = Math.min(1, s.age / 0.12, (s.life - s.age) / 0.35);
      for (let k = 0; k < 14; k++) {
        const tt = s.age - k * 0.016;
        if (tt < 0) break;
        sky.fillStyle = k === 0 ? `rgba(255,255,255,${fade.toFixed(3)})` : `rgba(205,225,255,${(fade * (1 - k / 14) * 0.8).toFixed(3)})`;
        sky.fillRect(snap(s.x + s.vx * tt), snap(s.y + s.vy * tt), P, P);
      }
    }

    // kembang api: meluncur sebentar, lalu meletus jadi dua cincin percikan
    skyS.fw = skyS.fw.filter((f) => (f.age += dt) < 0.55 + 1.5);
    for (const f of skyS.fw) {
      if (f.age < 0) continue;
      if (f.age < 0.55) {
        const q = f.age / 0.55, y = f.y0 + (f.y - f.y0) * (1 - (1 - q) * (1 - q));
        sky.fillStyle = "#fff0c0"; sky.fillRect(snap(f.x), snap(y), P, P);
        sky.fillStyle = "rgba(255,200,120,.5)"; sky.fillRect(snap(f.x), snap(y + P * 2), P, P);
        continue;
      }
      if (!f.parts) {
        f.parts = [];
        for (let a = 0; a < 30; a++) f.parts.push({ ang: (a / 30) * Math.PI * 2 + rand(-0.06, 0.06), r: a % 2 ? R : R * 0.62, tw: Math.random() });
      }
      const t = f.age - 0.55, life = 1.5, e = 1 - Math.exp(-3.4 * t), al = Math.max(0, 1 - t / life);
      if (t < 0.25) {                                  // kilatan lembut saat meletus
        const g = sky.createRadialGradient(f.x, f.y, 0, f.x, f.y, R * 1.3);
        g.addColorStop(0, `rgba(255,235,190,${(0.22 * (1 - t / 0.25)).toFixed(3)})`); g.addColorStop(1, "rgba(255,235,190,0)");
        sky.fillStyle = g; sky.fillRect(f.x - R * 1.3, f.y - R * 1.3, R * 2.6, R * 2.6);
      }
      for (const p of f.parts) {
        if (t > 0.9 && p.tw > 0.55 && Math.floor(t * 18) % 2) continue;   // berkelip saat padam
        sky.globalAlpha = al * al;
        sky.fillStyle = t < 0.18 ? "#ffffff" : f.col;
        sky.fillRect(snap(f.x + Math.cos(p.ang) * p.r * e), snap(f.y + Math.sin(p.ang) * p.r * e + 0.5 * grav * t * t), P, P);
      }
      sky.globalAlpha = 1;
    }
  }

  /* ===== kabut tipis di pagi hari (tile pixel dibuat di kanvas, digeser pelan, tanpa file gambar) ===== */
  function makeFogTile(w, h, n, seed, rxr, ryr, ylo, yhi) {
    let s = seed;
    const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    const blobs = Array.from({ length: n }, () => ({
      x: rnd() * w, y: (ylo + rnd() * (yhi - ylo)) * h,
      rx: (rxr[0] + rnd() * (rxr[1] - rxr[0])) * w, ry: (ryr[0] + rnd() * (ryr[1] - ryr[0])) * h,
    }));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const c = cv.getContext("2d"), img = c.createImageData(w, h);
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], A = [0, 52, 88, 128];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0;
      for (const b of blobs) for (const k of [-w, 0, w]) {          // x membungkus supaya tile menyambung
        const dx = (x - b.x + k) / b.rx, dy = (y - b.y) / b.ry, d = dx * dx + dy * dy;
        if (d < 1) v += (1 - d) * (1 - d);
      }
      v = Math.min(1.2, v) + (B[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.22;
      const lv = v > 0.7 ? 3 : v > 0.4 ? 2 : v > 0.14 ? 1 : 0, i = (y * w + x) * 4;
      img.data[i] = 255; img.data[i + 1] = lv === 3 ? 250 : 244; img.data[i + 2] = lv === 3 ? 244 : 236; img.data[i + 3] = A[lv];
    }
    c.putImageData(img, 0, 0);
    return cv.toDataURL();
  }
  const fogMount = $("fogMount"), fogRoad = $("fogRoad");
  const FOG = { k: 0, on: false, still: matchMedia("(prefers-reduced-motion: reduce)").matches };
  fogMount.style.backgroundImage = `url("${makeFogTile(256, 64, 15, 7, [0.06, 0.16], [0.12, 0.26], 0.3, 0.8)}")`;
  fogRoad.style.backgroundImage = `url("${makeFogTile(256, 40, 11, 31, [0.09, 0.2], [0.14, 0.28], 0.35, 0.75)}")`;
  function updateFog(now, dt) {
    const target = tod === "pagi" ? 1 : 0;
    FOG.k += (target - FOG.k) * Math.min(1, dt * 1.1);
    if (Math.abs(target - FOG.k) < 0.01) FOG.k = target;
    if (FOG.k === 0) {
      if (FOG.on) { fogMount.style.opacity = 0; fogRoad.style.opacity = 0; FOG.on = false; }
      return;
    }
    FOG.on = true;
    const calm = rain.on ? 0.55 : 1;                              // saat hujan kabutnya menipis
    fogMount.style.opacity = (FOG.k * calm * (0.86 + 0.14 * Math.sin(now / 5200))).toFixed(3);
    fogRoad.style.opacity = (FOG.k * calm * 0.9 * (0.8 + 0.2 * Math.sin(now / 4100 + 1))).toFixed(3);
    const drift = (el, hFrac, th, tw, speed, off) => {
      const ps = He * hFrac / th, fw = tw * ps;                   // ukuran satu pixel kabut dan lebar satu tile
      const pos = FOG.still ? 0 : -((now / 1000 * speed * He / 720 + off) % fw);
      el.style.backgroundPositionX = Math.round(pos / ps) * ps + "px";
    };
    drift(fogMount, 0.24, 64, 256, 6, 0);
    drift(fogRoad, 0.16, 40, 256, 11, 90);
  }

  /* ===== kunang-kunang (malam yang cerah): melayang pelan dekat jalan, berkedip, hilang saat hujan ===== */
  const ffCx = $("fireflyfx").getContext("2d");
  const FF = { k: 0, on: false, list: [] };
  function newFirefly() {
    return { x: rand(0, W), y: G - He * rand(-0.02, 0.26), a: rand(0, 6.28), turn: rand(-1, 1), t: rand(0, 10),
      sp: rand(7, 15) * He / 720, per: rand(2.2, 4.4), ph: rand(0, 6.28), rgb: Math.random() < 0.7 ? "190,255,90" : "255,235,110" };
  }
  function updateFireflies(now, dt) {
    const target = night && !rain.on && rain.k < 0.05 ? 1 : 0;
    FF.k += (target - FF.k) * Math.min(1, dt * 0.8);
    if (Math.abs(target - FF.k) < 0.01) FF.k = target;
    if (FF.k === 0) {
      if (FF.on) { ffCx.clearRect(0, 0, W, H); FF.on = false; FF.list.length = 0; }
      return;
    }
    FF.on = true;
    const n = clamp(Math.round(W / 85), 8, 22);
    while (FF.list.length < n) FF.list.push(newFirefly());
    FF.list.length = n;
    const P = rpx(), ymin = G - He * 0.3, ymax = G + He * 0.04;
    ffCx.clearRect(0, 0, W, H);
    for (const f of FF.list) {
      f.t += dt;
      f.turn = clamp(f.turn + (Math.random() - 0.5) * dt * 4, -1.2, 1.2);
      f.a += f.turn * dt * 1.4;
      f.x += Math.cos(f.a) * f.sp * dt;
      f.y += Math.sin(f.a) * f.sp * dt * 0.6 + Math.sin(f.t * 1.3 + f.ph) * 3 * dt;
      if (f.x < -20) f.x = W + 20; else if (f.x > W + 20) f.x = -20;
      if (f.y < ymin) { f.y = ymin; f.a = -f.a; } else if (f.y > ymax) { f.y = ymax; f.a = -f.a; }
      const s = Math.sin(now / 1000 / f.per * 6.283 + f.ph), b = s > 0 ? Math.pow(s, 2.2) : 0;   // menyala sebentar lalu redup
      f.b = b;
    }
    ffCx.globalCompositeOperation = "lighter";                       // pendar
    for (const f of FF.list) {
      const R = P * 6, g = ffCx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
      g.addColorStop(0, `rgba(${f.rgb},${(0.4 * (0.12 + 0.88 * f.b) * FF.k).toFixed(3)})`);
      g.addColorStop(1, `rgba(${f.rgb},0)`);
      ffCx.fillStyle = g; ffCx.fillRect(f.x - R, f.y - R, R * 2, R * 2);
    }
    ffCx.globalCompositeOperation = "source-over";                   // titik terang di tengah
    for (const f of FF.list) {
      ffCx.fillStyle = `rgba(240,255,170,${((0.3 + 0.7 * f.b) * FF.k).toFixed(3)})`;
      ffCx.fillRect(Math.round(f.x / P) * P, Math.round(f.y / P) * P, P, P);
    }
  }

  /* ===== kelelawar di senja: rombongan kecil melintas saat peralihan senja ke malam ===== */
  const batCx = $("batfx").getContext("2d");
  const BAT = { list: [], next: 0, lastSenja: -1e9, dirty: false };
  const BSPR = [["K.....K", "KK.K.KK", ".KKKKK.", "..K.K.."], ["..K.K..", ".KKKKK.", "KK.K.KK", "K.....K"]];   // sayap naik dan turun
  function launchBats() {
    const dir = Math.random() < 0.5 ? 1 : -1, n = 3 + Math.floor(Math.random() * 3), y0 = rand(G * 0.12, G * 0.46);
    const sp = Math.max(70, rand(0.1, 0.15) * W);
    for (let i = 0; i < n; i++) {
      BAT.list.push({
        dir, x: dir > 0 ? -30 - i * rand(22, 40) : W + 30 + i * rand(22, 40), y: y0 + rand(-He * 0.04, He * 0.04),
        vx: sp * rand(0.92, 1.08), vy: rand(-6, 6), ph: rand(0, 6.28), small: Math.random() < 0.4,
      });
    }
  }
  function updateBats(now, dt) {
    if (tod === "senja") BAT.lastSenja = now;
    if (tod === "pagi" || tod === "siang") {
      if (BAT.dirty || BAT.list.length) { BAT.list.length = 0; batCx.clearRect(0, 0, W, H); BAT.dirty = false; }
      BAT.next = 0;
      return;
    }
    const active = tod === "senja" || (tod === "malam" && now - BAT.lastSenja < 12000);   // masih ikut saat senja baru berganti malam
    if (active && !rain.on && !document.hidden) {
      if (!BAT.next) BAT.next = now + rand(1500, 3500);
      if (now > BAT.next) { launchBats(); BAT.next = now + rand(11000, 20000); }
    } else if (!active) BAT.next = 0;
    if (!BAT.list.length) {
      if (BAT.dirty) { batCx.clearRect(0, 0, W, H); BAT.dirty = false; }
      return;
    }
    BAT.dirty = true;
    const P = rpx();
    BAT.list = BAT.list.filter((b) => {
      b.x += b.dir * b.vx * dt; b.y += b.vy * dt + Math.sin(now / 700 + b.ph) * He * 0.02 * dt;
      return b.dir > 0 ? b.x < W + 60 : b.x > -60;
    });
    batCx.clearRect(0, 0, W, H);
    batCx.fillStyle = "rgba(24,16,36,.92)";
    for (const b of BAT.list) {
      const u = b.small ? Math.max(2, P - 1) : P, fr = BSPR[Math.floor(now / 1000 * 9 + b.ph) % 2];
      const x0 = Math.round((b.x - u * 3.5) / u) * u, y0 = Math.round(b.y / u) * u;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) if (fr[r][c] === "K") batCx.fillRect(x0 + c * u, y0 + r * u, u, u);
    }
  }

  /* ===== daun kering tertiup angin (angin ke kiri, sesekali menghembus kencang; hilang saat hujan) ===== */
  const leafCx = $("leaffx").getContext("2d");
  const WIND = { w: 0.3, nextGust: 0, gust: null };               // w: 0 (tenang) sampai 1 (kencang)
  const LEAF = { list: [], k: 1, init: false };
  const LEAF_COL = { day: ["#b8742c", "#d89a3c", "#8c5a24", "#a8452a"], night: ["#5b3a1c", "#6e4a22", "#45301a", "#5a2a1e"] };
  const LEAF_POSE = [[".XX", "XX."], ["X..", "XX.", ".X."], ["X", "X"], ["..X", ".XX", ".X."]];   // daun berputar saat melayang
  function updateWind(now, dt) {
    if (!WIND.nextGust) WIND.nextGust = now + rand(8000, 16000);
    if (now > WIND.nextGust) { WIND.gust = { s: now, e: now + rand(5000, 9000), a: rand(0.5, 0.75) }; WIND.nextGust = now + rand(20000, 40000); }
    let g = 0;
    if (WIND.gust) {
      if (now > WIND.gust.e) WIND.gust = null;
      else g = WIND.gust.a * Math.sin(Math.PI * (now - WIND.gust.s) / (WIND.gust.e - WIND.gust.s));
    }
    const base = 0.22 + 0.12 * Math.sin(now / 7300) + 0.08 * Math.sin(now / 2900 + 1);
    WIND.w += (clamp(base + g, 0, 1) - WIND.w) * Math.min(1, dt * 1.5);
  }
  function newLeaf(spread) {
    const k = He / 720, y = spread ? rand(G * 0.45, G + (H - G) * 0.5) : rand(G * 0.35, G + (H - G) * 0.4);
    return {
      x: spread ? rand(0, W) : W + rand(10, 60), y, t: 0, vf: rand(0.7, 1.2), sink: rand(12, 26) * k, ph: rand(0, 6.28), fs: rand(1.5, 2.6),
      amp: rand(10, 22) * k, col: Math.floor(Math.random() * 4), landY: Math.max(G + (H - G) * rand(0.3, 0.95), y + 20),
      grounded: false, gt: 0, life: rand(2.2, 4),
    };
  }
  function updateLeaves(now, dt) {
    updateWind(now, dt);
    const target = rain.on ? 0 : 1;
    LEAF.k += (target - LEAF.k) * Math.min(1, dt * 1.5);
    if (Math.abs(target - LEAF.k) < 0.01) LEAF.k = target;
    if (LEAF.k === 0) {
      if (LEAF.list.length || LEAF.init) { LEAF.list.length = 0; leafCx.clearRect(0, 0, W, H); LEAF.init = false; }
      return;
    }
    const k = He / 720, P = rpx(), want = Math.round(clamp(W / 160, 3, 10) * (0.35 + 2.3 * WIND.w));   // makin kencang, makin banyak
    if (!LEAF.init) { LEAF.init = true; for (let i = 0; i < want; i++) LEAF.list.push(newLeaf(true)); }
    else if (LEAF.list.length < Math.min(28, want) && Math.random() < dt * 2.5 && !document.hidden) LEAF.list.push(newLeaf(false));
    const base = 45 + 170 * WIND.w;
    LEAF.list = LEAF.list.filter((f) => {
      f.t += dt;
      const sp = base * k * f.vf;
      if (!f.grounded) {
        f.x -= sp * dt + Math.cos(f.t * f.fs + f.ph) * f.amp * 0.5 * dt;
        f.y += (f.sink + WIND.w * 18 * k) * dt + Math.sin(f.t * f.fs + f.ph) * f.amp * dt;
        if (f.y >= f.landY) { f.y = f.landY; f.grounded = true; }
      } else { f.x -= sp * 0.5 * dt; f.gt += dt; }
      return f.x > -30 && f.gt < f.life;
    });
    leafCx.clearRect(0, 0, W, H);
    const cols = night ? LEAF_COL.night : LEAF_COL.day;
    for (const f of LEAF.list) {
      const hop = f.grounded ? Math.abs(Math.sin(f.gt * 7 + f.ph)) * P * 2 * (0.3 + WIND.w) : 0;
      leafCx.globalAlpha = LEAF.k * (f.grounded ? clamp((f.life - f.gt) / 0.8, 0, 1) : 1);
      leafCx.fillStyle = cols[f.col];
      const pose = LEAF_POSE[Math.floor((f.t * f.fs * 1.3 + f.ph) % 4 + 4) % 4];
      const x0 = Math.round(f.x / P) * P, y0 = Math.round((f.y - hop) / P) * P;
      for (let r = 0; r < pose.length; r++) for (let c = 0; c < pose[r].length; c++) if (pose[r][c] === "X") leafCx.fillRect(x0 + c * P, y0 + r * P, P, P);
    }
    leafCx.globalAlpha = 1;
  }

  /* ===== loop utama ===== */
  let last = performance.now();
  /* ===== suara: hujan, petir, dan suasana (WebAudio, tanpa file; default mati) ===== */
  const snd = { on: false, ctx: null, master: null, bus: null, noise: null };
  function initAudio() {
    if (!snd.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { snd.on = false; return; }
      const c = snd.ctx = new AC();
      const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      snd.noise = buf;
      snd.master = c.createGain(); snd.master.gain.value = 0; snd.master.connect(c.destination);
      snd.bus = c.createGain(); snd.bus.gain.value = 0; snd.bus.connect(snd.master);
      snd.amb = c.createGain(); snd.amb.gain.value = 1; snd.amb.connect(snd.master);      // suara suasana
      const layer = (type, freq, q, gain, off) => {
        const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
        const g = c.createGain(); g.gain.value = gain;
        src.connect(f).connect(g).connect(snd.bus); src.start(0, off);
      };
      layer("highpass", 900, 0.5, 0.45, 0);          // desis rintik
      layer("bandpass", 1600, 0.6, 0.7, 0.9);        // tetes menimpa atap dan jalan
      layer("lowpass", 420, 0.5, 0.35, 1.4);         // gemuruh jauh
    }
    snd.ctx.resume();
    snd.master.gain.setTargetAtTime(1, snd.ctx.currentTime, 0.15);
  }
  // ----- suara suasana, semuanya disintesis WebAudio: klip-klop andong, kring becak -----
    function ambOut(pan) {
    const c = snd.ctx;
    if (!c.createStereoPanner) return snd.amb;
    const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(snd.amb);
    return p;
  }
  function clop(t, vol, pan, hi) {                                   // satu ketukan kuku kuda di jalan
    const c = snd.ctx, out = ambOut(pan);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = snd.noise; f.type = "bandpass"; f.frequency.value = hi ? 1500 : 950; f.Q.value = 3;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(f).connect(g).connect(out); s.start(t, rand(0, 1.5)); s.stop(t + 0.08);
    const o = c.createOscillator(), og = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(hi ? 300 : 240, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.06);
    og.gain.setValueAtTime(vol * 0.6, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(og).connect(out); o.start(t); o.stop(t + 0.08);
  }
  function bell(t0, vol, pan) {                                      // "kring-kring" bel becak: dua denting logam
    const c = snd.ctx, out = ambOut(pan);
    for (let k = 0; k < 2; k++) for (const fr of [2300, 3450]) {
      const t = t0 + k * 0.16, o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = fr;
      g.gain.setValueAtTime(vol * (fr === 2300 ? 1 : 0.5), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.42);
    }
  }
  function updateSound(now) {
    if (!snd.on || !snd.ctx || snd.ctx.state !== "running") return;
    const c = snd.ctx, ct = c.currentTime;
    snd.bus.gain.setTargetAtTime(0.3 * rain.k, ct, 0.25);
    // kendaraan: klip-klop andong dan kring becak, makin keras saat lewat di tengah, bergeser kiri-kanan
    for (const v of vehicles) {
      if (v.done) continue;
      const near = clamp(1 - Math.abs(v.x - W / 2) / (W * 0.65), 0.15, 1), pan = (v.x - W / 2) / (W / 2);
      if (v.type === "andong") {
        if (!(v.nextClop > now)) { clop(ct + 0.01, 0.22 * near, pan, true); clop(ct + 0.17, 0.2 * near, pan, false); v.nextClop = now + 520; }
      } else if (!(v.nextBell > now)) {
        if (v.nextBell) bell(ct + 0.02, 0.07 * near, pan);
        v.nextBell = now + (v.nextBell ? rand(3500, 6000) : 600);
      }
    }
  }
  function thunder() {
    if (!snd.on || !snd.ctx) return;
    const c = snd.ctx, t0 = c.currentTime + rand(0.3, 1.1);
    for (const [d, a] of [[0, 0.9], [0.8, 0.5]]) {
      const t = t0 + d, s = c.createBufferSource();
      s.buffer = snd.noise;
      const f = c.createBiquadFilter(); f.type = "lowpass";
      f.frequency.setValueAtTime(520, t); f.frequency.exponentialRampToValueAtTime(70, t + 2.6);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      s.connect(f).connect(g).connect(snd.master); s.start(t, rand(0, 0.8)); s.stop(t + 3.1);
    }
  }
  const btnSound = $("btnSound");
  function paintSound() {
    btnSound.innerHTML = icon(snd.on ? "speaker" : "mute") + '<span class="lbl">Suara</span>';
    btnSound.classList.toggle("on", snd.on); btnSound.setAttribute("aria-pressed", String(snd.on));
  }
  btnSound.onclick = () => {
    snd.on = !snd.on;
    if (snd.on) initAudio(); else if (snd.ctx) snd.master.gain.setTargetAtTime(0, snd.ctx.currentTime, 0.1);
    paintSound(); showToast(snd.on ? "Suara hidup" : "Suara mati", 1200);
  };
  document.addEventListener("visibilitychange", () => { if (snd.ctx) { if (document.hidden) snd.ctx.suspend(); else if (snd.on) snd.ctx.resume(); } });
  paintSound();

  /* ===== kucing: keliling jalan, kabur kalau didekati, tidur di bawah meja saat hujan ===== */
  const cat = { el: null, x: 0, t: 0.62, state: "sit", until: 0, tx: 0, tt: 0, flip: false, frame: 0, nf: 0, cur: "", srcs: null, init: false };
  function makeCatSprites() {
    const O = "#d98a3d", D = "#a85f22", L = "#f3c58a", K = "#2a1a12", P = "#f2a0a0";
    const draw = (rects) => {
      const cv = document.createElement("canvas"); cv.width = 16; cv.height = 12;
      const c = cv.getContext("2d");
      for (const [x, y, w, h, col] of rects) { c.fillStyle = col; c.fillRect(x, y, w, h); }
      return cv.toDataURL();
    };
    const head = [[11, 2, 4, 4, O], [11, 1, 1, 1, D], [14, 1, 1, 1, D], [13, 3, 1, 1, K], [15, 4, 1, 1, P]];
    const body = [[3, 4, 8, 4, O], [5, 4, 1, 2, D], [8, 4, 1, 2, D], [3, 7, 8, 1, L], [2, 3, 1, 4, O], [1, 2, 1, 2, D]];
    const walk = (a) => draw([...body, ...head, [4, 8, 1, a ? 3 : 2, D], [9, 8, 1, a ? 3 : 2, D], [6, 8, 1, a ? 2 : 3, D], [11, 8, 1, a ? 2 : 3, D]]);
    return {
      walk: [walk(1), walk(0)],
      sit: draw([[3, 5, 5, 6, O], [2, 7, 2, 4, D], [6, 1, 5, 4, O], [6, 0, 1, 1, D], [10, 0, 1, 1, D], [9, 2, 1, 1, K], [11, 3, 1, 1, P],
                 [7, 5, 2, 5, L], [8, 9, 1, 2, L], [0, 10, 3, 1, O], [0, 9, 1, 1, D]]),
      sleep: draw([[2, 6, 10, 5, O], [5, 6, 1, 3, D], [8, 6, 1, 3, D], [2, 10, 10, 1, L], [11, 7, 4, 4, O], [11, 6, 1, 1, D], [14, 6, 1, 1, D],
                   [13, 8, 2, 1, K], [15, 9, 1, 1, P], [0, 8, 2, 3, D]]),
    };
  }
  function updateCat(now, dt) {
    if (!cat.el) {
      cat.srcs = makeCatSprites();
      const el = document.createElement("img");
      el.className = "cat"; el.draggable = false; el.alt = "kucing";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        showToast("Meong~", 1400);
        const hh = document.createElement("div");
        hh.className = "heart"; hh.textContent = "\u2764";
        hh.style.left = cat.x - 8 + "px"; hh.style.top = depthY(cat.t) - depthH(cat.t) * 0.4 + "px";
        actors.append(hh); setTimeout(() => hh.remove(), 1100);
      });
      actors.append(el); cat.el = el;
    }
    if (!cat.init && W) { cat.init = true; cat.x = W * 0.25; cat.until = now + 2000; }
    const ch = depthH(cat.t) * 0.3, span = depthY(1) - depthY(0), sc = clamp(He / 720, 0.6, 1.3);

    // takut kalau karakter yang berjalan atau bola mendekat (kecuali sedang berteduh)
    if (cat.state !== "shelter" && cat.state !== "flee") {
      const near = (x, t, r) => Math.abs(x - cat.x) < r && Math.abs(t - cat.t) < 0.2;
      const th = pets.find((q) => !(q.visit && q.visit.phase === "sit") && near(q.x, q.t, ch * 2.4)) || balls.find((b) => near(b.x, b.t, ch * 3));
      if (th) {
        const away = cat.x >= th.x ? 1 : -1;
        cat.tx = clamp(cat.x + away * rand(150, 280), 24, W - 24); cat.tt = clamp(cat.t + rand(-0.12, 0.12), 0.35, 0.95);
        cat.state = "flee";
      }
    }
    // hujan: lari ke bawah meja payung dan meringkuk
    if (rain.on && cart.g && cat.state !== "shelter" && cat.state !== "go") {
      cat.tx = cart.g.tbl ? cart.g.tbl.x : (cart.awL + cart.awR) / 2; cat.tt = SEAT_T - 0.015; cat.state = "go";
    }
    if (!rain.on && cat.state === "shelter" && now > cat.until) { cat.state = "sit"; cat.until = now + rand(1500, 4000); }

    if (cat.state === "walk" || cat.state === "flee" || cat.state === "go") {
      const v = (cat.state === "flee" ? 240 : cat.state === "go" ? 150 : 65) * sc, dx = cat.tx - cat.x, dtt = cat.tt - cat.t;
      cat.x += Math.sign(dx) * Math.min(Math.abs(dx), v * dt);
      cat.t += Math.sign(dtt) * Math.min(Math.abs(dtt), v * dt * 0.6 / span);
      if (Math.abs(dx) > 2) cat.flip = dx < 0;
      if (Math.abs(dx) < 2 && Math.abs(dtt) < 0.005) {
        if (cat.state === "go") { cat.state = "shelter"; cat.flip = false; cat.until = now + 99999; }
        else { cat.state = "sit"; cat.until = now + rand(3000, 8000); }
        if (!rain.on && cat.state === "shelter") cat.until = now;
      }
      if (now > cat.nf) { cat.frame ^= 1; cat.nf = now + (cat.state === "flee" ? 90 : 150); }
    } else if (cat.state === "sit" && now > cat.until) {
      if (Math.random() < 0.35) { cat.state = "sleep"; cat.until = now + rand(8000, 15000); }
      else { cat.state = "walk"; cat.tx = rand(W * 0.05, W * 0.95); cat.tt = rand(0.35, 0.9); }
    } else if (cat.state === "sleep" && now > cat.until) { cat.state = "sit"; cat.until = now + rand(2000, 5000); }

    const src = cat.state === "shelter" || cat.state === "sleep" ? cat.srcs.sleep : cat.state === "sit" ? cat.srcs.sit : cat.srcs.walk[cat.frame];
    if (src !== cat.cur) { cat.el.src = src; cat.cur = src; }
    const st = cat.el.style, fy = depthY(cat.t);
    st.height = ch + "px"; st.width = ch * 16 / 12 + "px"; st.left = cat.x - ch * 16 / 24 + "px"; st.top = fy - ch + "px";
    st.zIndex = Math.floor(fy); st.transform = cat.flip ? "scaleX(-1)" : "";
  }

  /* ===== merpati di trotoar (siang): mematuk-matuk, terbang kaget kalau didekati karakter, kucing, atau bola ===== */
  const pigeons = [];
  let pigeonSprites = null;
  function makePigeonSprites() {
    const G = "#8d96a6", D = "#5f6878", L = "#c9d0dc", S = "#7bb59f", V = "#9a7fb8", E = "#e8742a", B = "#d8cfba", F = "#d9778a";
    const draw = (rects) => {
      const cv = document.createElement("canvas"); cv.width = 12; cv.height = 9;
      const c = cv.getContext("2d");
      for (const [x, y, w, h, col] of rects) { c.fillStyle = col; c.fillRect(x, y, w, h); }
      return cv.toDataURL();
    };
    const body = [[3, 3, 5, 1, G], [2, 4, 7, 2, G], [3, 6, 5, 1, L], [0, 5, 2, 1, D], [3, 4, 4, 1, D]];
    const up = [[7, 2, 2, 2, G], [8, 1, 3, 3, G], [8, 3, 2, 1, S], [9, 2, 1, 1, E], [11, 2, 1, 1, B]];
    const low = [[7, 3, 2, 2, G], [9, 4, 2, 2, G], [8, 4, 1, 1, S], [10, 4, 1, 1, E], [11, 5, 1, 1, B], [8, 5, 1, 1, V]];
    const legs = (a) => a === 0 ? [[4, 7, 1, 2, F], [6, 7, 1, 2, F]] : a === 1 ? [[4, 7, 1, 2, F], [6, 7, 1, 1, F]] : [[4, 7, 1, 1, F], [6, 7, 1, 2, F]];
    const fly = [[3, 4, 6, 2, G], [0, 5, 3, 1, D], [8, 3, 3, 2, G], [9, 3, 1, 1, E], [11, 4, 1, 1, B]];
    return {
      stand: draw([...body, ...up, ...legs(0)]), peck: draw([...body, ...low, ...legs(0)]),
      walk: [draw([...body, ...up, ...legs(1)]), draw([...body, ...up, ...legs(2)])],
      fly: [draw([...fly, [3, 0, 4, 4, L], [2, 1, 1, 3, L]]), draw([...fly, [3, 6, 5, 2, L], [2, 7, 2, 1, L]])],   // sayap naik dan turun
    };
  }
  function scarePigeons(p, dir, now) {                                  // satu kaget, yang di dekatnya ikut terbang
    const sc = clamp(He / 720, 0.6, 1.3);
    for (const q of pigeons) {
      if (q.state === "away" || q.state === "fly_in" || q.state === "fly_out" || q.fleeAt) continue;
      if (q === p) { q.fleeAt = now + rand(0, 200); q.fleeDir = dir; continue; }
      if (Math.abs(q.x - p.x) < 220 * sc && Math.abs(q.t - p.t) < 0.3) { q.fleeAt = now + rand(60, 380); q.fleeDir = Math.random() < 0.8 ? dir : -dir; }
    }
  }
  function startLanding(p) {                                            // terbang dari tepi layar lalu mendarat, kadang dekat merpati lain
    const sc = clamp(He / 720, 0.6, 1.3), ground = pigeons.filter((q) => q !== p && !q.fleeAt && ["stand", "peck", "walk"].includes(q.state));
    const near = ground.length && Math.random() < 0.5 ? pick(ground) : null;
    p.x0 = Math.random() < 0.5 ? -40 : W + 40;
    p.tx = near ? clamp(near.x + rand(-90, 90), 24, W - 24) : rand(W * 0.08, W * 0.92);
    p.t = near ? clamp(near.t + rand(-0.08, 0.08), 0.38, 0.92) : rand(0.38, 0.92);
    p.alt0 = rand(He * 0.25, He * 0.5); p.u = 0; p.x = p.x0; p.alt = p.alt0;
    p.dur = Math.max(1.6, Math.abs(p.tx - p.x0) / (190 * sc));
    p.flip = p.tx < p.x0; p.state = "fly_in"; p.fleeAt = 0;
  }
  function updatePigeons(now, dt) {
    if (!pigeonSprites) {
      pigeonSprites = makePigeonSprites();
      for (let i = 0, n = SMALL() ? 2 : 5; i < n; i++) {
        const el = document.createElement("img");
        el.className = "pigeon"; el.draggable = false; el.alt = "merpati"; el.style.display = "none";
        const p = { el, state: "away", returnAt: now + rand(500, 4000), x: 0, t: 0.6, alt: 0, flip: false, until: 0, frame: 0, nf: 0, cur: "", tx: 0, fleeAt: 0, fleeDir: 1, ph: rand(0, 6.28) };
        el.addEventListener("click", (e) => { e.stopPropagation(); if (["stand", "peck", "walk"].includes(p.state)) scarePigeons(p, Math.random() < 0.5 ? 1 : -1, performance.now()); });
        actors.append(el); pigeons.push(p);
      }
    }
    const active = tod === "siang" && !rain.on, sc = clamp(He / 720, 0.6, 1.3);
    for (const p of pigeons) {
      if (p.state === "away") { if (active && now > p.returnAt) startLanding(p); else continue; }
      const ch = depthH(p.t) * 0.225, grounded = p.state === "stand" || p.state === "peck" || p.state === "walk";
      if (grounded) {
        const R = ch * 3.4, th = pets.find((q) => !(q.visit && q.visit.phase === "sit") && Math.abs(q.x - p.x) < R && Math.abs(q.t - p.t) < 0.2)
          || ((cat.state === "walk" || cat.state === "flee" || cat.state === "go") && Math.abs(cat.x - p.x) < R * 0.8 && Math.abs(cat.t - p.t) < 0.15 ? cat : null)
          || balls.find((b) => Math.abs(b.x - p.x) < R && Math.abs(b.t - p.t) < 0.2);
        if (th && !p.fleeAt) scarePigeons(p, p.x >= th.x ? 1 : -1, now);
        else if (!active && !p.fleeAt) { p.fleeAt = now + rand(0, 3000); p.fleeDir = Math.random() < 0.5 ? 1 : -1; }   // siang berakhir atau hujan: pergi satu-satu
        if (p.fleeAt && now >= p.fleeAt) {
          p.state = "fly_out"; p.vx = p.fleeDir * rand(230, 320) * sc; p.vy = rand(190, 260) * sc; p.flip = p.vx < 0; p.fleeAt = 0;
        }
      }
      if (p.state === "fly_in") {
        p.u += dt / p.dur;
        const e = Math.min(1, p.u);
        p.x = p.x0 + (p.tx - p.x0) * e;
        p.alt = p.alt0 * Math.pow(1 - e, 1.6) + Math.sin(now / 180 + p.ph) * 3 * (1 - e);
        if (p.u >= 1) { p.alt = 0; p.state = "stand"; p.until = now + rand(400, 1200); p.flip = Math.random() < 0.5; }
      } else if (p.state === "fly_out") {
        p.x += p.vx * dt; p.alt += p.vy * dt; p.vy *= 1 - dt * 0.25;
        if (p.x < -50 || p.x > W + 50 || p.alt > H) { p.state = "away"; p.returnAt = now + rand(9000, 22000); p.el.style.display = "none"; continue; }
      } else if (p.state === "walk") {
        const dx = p.tx - p.x;
        p.x += Math.sign(dx) * Math.min(Math.abs(dx), 32 * sc * dt);
        if (now > p.nf) { p.frame ^= 1; p.nf = now + 140; }
        if (Math.abs(dx) < 1) { p.state = "stand"; p.until = now + rand(300, 900); }
      } else if (now > p.until) {                                     // berdiri atau mematuk bergantian, sesekali melangkah
        const r = Math.random();
        if (p.state === "stand") {
          if (r < 0.6) { p.state = "peck"; p.until = now + rand(250, 480); }
          else if (r < 0.85) {
            let d = rand(20, 80) * sc * (Math.random() < 0.5 ? -1 : 1);
            p.tx = clamp(p.x + d, 24, W - 24); d = p.tx - p.x;
            if (Math.abs(d) > 8) { p.state = "walk"; p.flip = d < 0; } else p.until = now + rand(300, 700);
          } else { p.flip = !p.flip; p.until = now + rand(400, 1000); }
        } else { p.state = r < 0.8 ? "stand" : "peck"; p.until = now + (p.state === "peck" ? rand(220, 420) : rand(250, 700)); }
      }
      const flying = p.state === "fly_in" || p.state === "fly_out";
      if (flying && now > p.nf) { p.frame ^= 1; p.nf = now + 70; }
      const src = flying && p.alt > 4 ? pigeonSprites.fly[p.frame] : p.state === "peck" ? pigeonSprites.peck : p.state === "walk" ? pigeonSprites.walk[p.frame] : pigeonSprites.stand;
      if (src !== p.cur) { p.el.src = src; p.cur = src; }
      const st = p.el.style, fy = depthY(p.t);
      st.display = ""; st.height = ch + "px"; st.width = ch * 12 / 9 + "px"; st.left = p.x - ch * 12 / 18 + "px"; st.top = fy - ch - p.alt + "px";
      st.zIndex = p.alt > 8 ? 6500 : Math.floor(fy); st.transform = p.flip ? "scaleX(-1)" : "";
    }
  }

  function tickBody(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // parallax halus
    mx += (mxTarget - mx) * Math.min(1, dt * 4);
    for (const { el, k } of pxEls) el.style.transform = `translate3d(${(-mx * k).toFixed(2)}px,0,0)`;

    // bola jatuh dan memantul
    for (const b of balls) {
      const floor = depthY(b.t) - b.size;
      if (!b.rest) {
        b.vy += 1500 * dt;
        b.y += b.vy * dt;
        if (b.y >= floor) {
          b.y = floor; b.vy *= -0.45;
          if (Math.abs(b.vy) < 120) { b.rest = true; b.restAt = now; }
        }
      } else if (now - b.restAt > 5000) b.gone = true;
      b.el.style.left = b.x - b.size / 2 + "px";
      b.el.style.top = b.y + "px";
      b.el.style.zIndex = Math.floor(depthY(b.t));
    }
    balls = balls.filter((b) => { if (b.gone) b.el.remove(); return !b.gone; });
    const ball = balls.find((b) => b.rest) || balls[0];
    const fast = ball || rain.on;                     // lari saat mengejar bola atau mencari tempat berteduh

    // obrolan acak
    if (now > nextChat) { startChat(now); nextChat = now + rand(7000, 13000); }

    // kendaraan lewat di jalur belakang karakter
    if (now > nextVeh) { spawnVehicle(); nextVeh = now + rand(17000, 30000); }
    for (const v of vehicles) {
      const cfg = v.cfg;
      const vh = vehH(v), vw = vh * cfg.ratio;
      v.x += v.dir * clamp(W * cfg.speed, 36, 120) * dt;
      if (now > v.nextFrame) { v.frame = (v.frame + 1) % cfg.n; v.nextFrame = now + cfg.fd; }
      const src = VF[v.type][v.frame];
      if (v.cur !== src) { v.el.src = src; v.cur = src; }
      const flip = v.dir < 0;
      if (v.flipped !== flip) { v.el.classList.toggle("flip", flip); v.flipped = flip; }
      const feet = G + He * (v.lane ? 0.052 : 0.032);
      const bob = Math.sin(now / (cfg.fd * 2)) * vh * 0.006;
      v.el.style.height = vh + "px";
      v.el.style.left = v.x - vw / 2 + "px";
      v.el.style.top = feet - vh - bob + "px";
      v.el.style.zIndex = Math.floor(feet);
      const sw = vw * cfg.shadow, sh = vh * 0.05;
      v.shadow.style.width = sw + "px";
      v.shadow.style.height = sh + "px";
      v.shadow.style.left = v.x - sw / 2 + "px";
      v.shadow.style.top = feet - sh * 0.5 + "px";
      v.shadow.style.zIndex = Math.floor(feet) - 1;

      // sopir sesekali menawarkan jasa
      if (!v.bubble && now > v.nextLine && v.x > W * 0.12 && v.x < W * 0.88) {
        vsay(v, pick(VEH_LINES[v.type]), 2400);
        v.nextLine = now + rand(7000, 11000);
      }
      if (v.bubble) {
        if (now > v.bubble.until) { v.bubble.el.remove(); v.bubble = null; }
        else {
          v.bubble.el.style.left = clamp(v.x, 100, W - 100) + "px";
          v.bubble.el.style.top = feet - vh - 2 + "px";
        }
      }

      if ((v.dir > 0 && v.x > W + vw / 2 + 30) || (v.dir < 0 && v.x < -vw / 2 - 30)) v.done = true;
    }
    vehicles = vehicles.filter((v) => {
      if (v.done) { v.el.remove(); v.shadow.remove(); if (v.bubble) v.bubble.el.remove(); }
      return !v.done;
    });

    // angkringan: gerobak, jadwal kunjungan, obrolan sambil minum
    updateCart(now);
    const anyVisit = pets.some((p) => p.visit);
    if (visiting && !anyVisit) nextVisit = now + rand(20000, 38000);
    visiting = anyVisit;
    if (!anyVisit && !ball && now > nextVisit) {
      if (startVisit()) visiting = true; else nextVisit = now + 5000;
    }
    const seated = pets.filter((p) => p.visit && p.visit.phase === "sit");
    if (seated.length && now > angkChatAt) {
      if (seated.length >= 2) {
        const order = Math.random() < 0.5 ? [seated[0], seated[1]] : [seated[1], seated[0]];
        const [l0, l1] = pick(rain.on ? RAIN_TALK : ANGK_TALK);
        say(order[0], l0, 2600);
        setTimeout(() => say(order[1], l1, 2600), 2400);
      } else say(seated[0], pick(rain.on ? RAIN_SOLO : ANGK_SOLO), 2600);
      angkChatAt = now + rand(6500, 9500);
    }

    // hujan: daftar yang berteduh berdiri, lalu gambar efek hujan
    shelterList = rain.on ? pets.filter((q) => !q.visit).sort((a, b) => a.id - b.id) : [];
    updateFireflies(now, dt);
    updateRain(now, dt);
    updateSky(now, dt);
    updateBats(now, dt);
    updateFog(now, dt);
    updateLeaves(now, dt);
    updateCat(now, dt);
    updatePigeons(now, dt);
    updateSound(now);

    for (const p of pets) {
      const h = depthH(p.t), fy = depthY(p.t), w = h * SPRITE_RATIO;

      // ---- keputusan perilaku ----
      if (p.visit && ball) endVisit(p, now);
      if (ball) {
        p.tx = ball.x; p.tt = ball.t; p.state = "walking"; p.until = now + 500;
      } else if (p.visit) {
        const g = cart.g, vis = p.visit;
        if (vis.phase === "go") {
          p.tx = g.seatX[vis.seat]; p.tt = SEAT_T; p.state = "walking"; p.until = now + 500;
        } else {                                        // duduk di kursi besi, menghadap gerobak
          p.state = "idle"; p.until = now + 500;
          p.x = g.seatX[vis.seat]; p.t = SEAT_T; p.face = vis.dir;
          if (now > vis.until && !rain.on) endVisit(p, now);   // saat hujan tetap duduk berteduh
        }
      } else if (rain.on) {                             // berteduh di bawah terpal
        const sl = shelterSlot(p);
        p.tx = sl.x; p.tt = sl.t;
        if (Math.abs(p.tx - p.x) > 8 || Math.abs(p.tt - p.t) > 0.02) { p.state = "walking"; p.until = now + 500; }
        else { p.state = "idle"; p.until = now + 500; p.x = p.tx; p.t = p.tt; p.idleBack = false; }
      } else if (now > p.until) {
        if (p.state === "idle") {
          p.state = "walking"; chooseWalk(p);
          p.until = now + 9000;                         // dibatalkan saat sampai tujuan
        } else {
          p.state = "idle"; p.idleBack = Math.random() < 0.25;
          p.until = now + rand(1200, 3200);
        }
      }

      // ---- gerak ----
      let dx = 0, dTpx = 0;
      if (p.state === "walking") {
        dx = p.tx - p.x;
        const dT = p.tt - p.t;
        dTpx = dT * (depthY(1) - depthY(0)) * 0.9;
        const sp = h * 0.55 * p.sf * (fast ? 1.8 : 1) * dt;           // piksel per frame
        const vt = (0.13 * p.sf * (fast ? 1.8 : 1)) * dt;             // kedalaman per frame
        if (Math.abs(dx) > 5) p.x += clamp(dx, -sp, sp);
        if (Math.abs(dT) > 0.006) p.t += clamp(dT, -vt, vt);
        if (Math.abs(dx) <= 6 && Math.abs(dT) <= 0.012) {
          p.state = "idle"; p.idleBack = false; p.until = now + (ball ? 600 : rand(1200, 3200));
        }
        // arah menghadap
        if (Math.abs(dx) > Math.abs(dTpx) * 0.8) p.face = dx < 0 ? "left" : "right";
        else p.face = dTpx < 0 ? "back" : "front";
      }
      p.x = clamp(p.x, w / 2, W - w / 2);
      if (p.visit && p.visit.phase === "go" && Math.abs(p.tx - p.x) <= 8 && Math.abs(p.tt - p.t) <= 0.02) startSit(p, now);
      const sitting = !!(p.visit && p.visit.phase === "sit");

      // ---- frame ----
      let src, bob = 0;
      if (p.state === "walking") {
        const horizontal = p.face === "left" || p.face === "right";
        if (now > p.nextFrame) {
          p.frame = (p.frame + 1) % (horizontal ? 10 : 2);
          p.nextFrame = now + (horizontal ? 85 : 210);
        }
        src = p.frames[p.face][p.frame % p.frames[p.face].length];
        if (!horizontal) bob = Math.abs(Math.sin(now / 130)) * h * 0.025;
      } else if (sitting) {
        src = p.frames[p.visit.dir][0];                 // duduk: satu menghadap gerobak, atau berhadapan dengan temannya
      } else {
        if (now > p.nextFrame) { p.frame ^= 1; p.nextFrame = now + 650; }
        src = p.frames[p.idleBack ? "back" : "front"][p.frame & 1];
      }
      if (p.cur !== src) { p.el.src = src; p.cur = src; }

      // ---- lompat saat diklik ----
      let jumpY = 0;
      if (p.jump > 0) { jumpY = Math.sin((1 - p.jump) * Math.PI) * h * 0.16; p.jump = Math.max(0, p.jump - dt * 2.4); }

      // ---- tampilkan ----
      const fyNow = depthY(p.t), hNow = depthH(p.t), wNow = hNow * SPRITE_RATIO;
      p.el.style.height = hNow + "px";
      p.el.style.left = p.x - wNow / 2 + "px";
      p.el.style.top = fyNow - hNow - jumpY - bob + "px";
      p.el.style.zIndex = Math.floor(fyNow);
      if (sitting !== p.clipped) { p.el.style.clipPath = sitting ? "inset(0 0 29% 0)" : ""; p.clipped = sitting; }

      // gelas kopi joss: dipegang di depan badan, sesekali diangkat ke mulut
      if (sitting && p.visit.cup) {
        const vis = p.visit, topY = fyNow - hNow - jumpY - bob;
        let sip = 0;
        if (now >= vis.nextSip) {
          const u = (now - vis.nextSip) / 1800;
          if (u >= 1) vis.nextSip = now + rand(3500, 6500);
          else sip = u < 0.25 ? u / 0.25 : u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
        }
        const ch = hNow * 0.12;
        const sg = vis.dir === "left" ? -1 : 1;
        const tb = cart.g.tbl, onTable = !!tb && pets.filter((q) => q.visit).length > 1;
        const restX = onTable ? tb.x - sg * tb.w * 0.24 : p.x + sg * wNow * 0.36;
        const restY = onTable ? tb.top + tb.h * 0.14 - ch * 0.35 : topY + hNow * 0.64;
        const cxp = lerp(restX, p.x + sg * wNow * 0.31, sip);
        const cyp = lerp(restY, topY + hNow * 0.47, sip);
        const cs = vis.cup.style;
        cs.width = ch + "px"; cs.height = ch + "px"; cs.left = cxp - ch / 2 + "px"; cs.top = cyp - ch / 2 + "px";
        cs.zIndex = Math.floor(fyNow) + 2;
      }
      const sw = hNow * 0.46, sh = hNow * 0.07;
      p.shadow.style.width = sw + "px";
      p.shadow.style.height = sh + "px";
      p.shadow.style.left = p.x - sw / 2 + "px";
      p.shadow.style.top = fyNow - sh * 0.6 + "px";
      p.shadow.style.zIndex = Math.floor(fyNow) - 1;
      p.shadow.style.opacity = 1 - jumpY / (hNow * 0.4);

      if (p.bubble) {
        if (now > p.bubble.until) { p.bubble.el.remove(); p.bubble = null; }
        else {
          p.bubble.el.style.left = clamp(p.x, 100, W - 100) + "px";
          p.bubble.el.style.top = fyNow - hNow - jumpY - 6 + "px";
        }
      }
    }
  }
  // satu error di dalam satu frame tidak boleh menghentikan seluruh animasi
  function tick(now) {
    try { tickBody(now); } catch (err) { console.error(err); }
    requestAnimationFrame(tick);
  }

  /* ===== tombol ===== */
  function reset() {
    pets.forEach((p) => { if (p.visit && p.visit.cup) p.visit.cup.remove(); p.el.remove(); p.shadow.remove(); if (p.bubble) p.bubble.el.remove(); });
    balls.forEach((b) => b.el.remove());
    vehicles.forEach((v) => { v.el.remove(); v.shadow.remove(); if (v.bubble) v.bubble.el.remove(); });
    pets = []; balls = []; vehicles = [];
    nextVeh = performance.now() + rand(4500, 7000);
    nextVisit = performance.now() + rand(9000, 15000); visiting = false;
    spawn("adpel", { x: W * 0.32, t: 0.55 });
    spawn("kepin", { x: W * 0.62, t: 0.7 });
  }
  $("btnRide").onclick = () => { rideToggle = !rideToggle; spawnVehicle(rideToggle ? "andong" : "becak"); };
  btnRain.onclick = () => setRain(!rain.on);

  // petunjuk singkat di awal
  setTimeout(() => showToast(coarse ? "Ketuk Adpel, Kepin, atau kucingnya untuk menyapa" : "Klik Adpel, Kepin, atau kucingnya untuk menyapa", 4600), 600);
  $("btnReset").onclick = reset;

  // sembunyikan GUI untuk rekaman / tangkapan layar: tekan H atau Esc, atau ketuk pojok kanan bawah untuk menampilkan lagi
  const btnHud = $("btnHud"), hudNote = $("hudNote");
  btnHud.innerHTML = icon("eye") + '<span class="lbl">Sembunyi</span>';
  let hudTimer = 0;
  function setHud(hidden) {
    document.body.classList.toggle("nohud", hidden);
    clearTimeout(hudTimer);
    hudNote.classList.toggle("show", hidden);
    if (hidden) hudTimer = setTimeout(() => hudNote.classList.remove("show"), 2600);
  }
  btnHud.onclick = () => setHud(true);
  $("hudBack").onclick = () => setHud(false);
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "h" || e.key === "H") setHud(!document.body.classList.contains("nohud"));
    else if (e.key === "Escape") setHud(false);
  });

  buildCart();
  reset();
  requestAnimationFrame(tick);
})();
