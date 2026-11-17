// 🎉 Konfetti – Kern der App: Navigation, Spieler, Hilfsfunktionen, Startseite

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("konfetti:" + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("konfetti:" + key, JSON.stringify(value)); } catch { /* privater Modus o. ä. */ }
  },
};

const topbar = (title, back = "home") => `
  <header class="top">
    <button class="icon-btn" data-go="${back}" aria-label="Zurück">←</button>
    <h2>${title}</h2>
    <span class="icon-btn ghost"></span>
  </header>`;

const App = {
  root: null,
  players: [],
  screens: {},
  cleanups: [],

  start() {
    this.root = $("#app");
    this.players = store.get("players", []);
    this.avatars = store.get("avatars", {});
    this.root.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go]");
      if (go && !go.disabled) this.show(go.dataset.go);
    });
    this.show("home");
  },

  show(name, ...args) {
    this.cleanups.forEach((fn) => { try { fn(); } catch {} });
    this.cleanups = [];
    window.scrollTo(0, 0);
    this.screens[name](...args);
  },

  render(html, { anim = true } = {}) {
    this.root.innerHTML = html;
    if (anim) { this.root.classList.remove("enter"); void this.root.offsetWidth; this.root.classList.add("enter"); }
  },

  on(selector, event, fn) {
    $$(selector, this.root).forEach((el) => el.addEventListener(event, (e) => fn(e, el)));
  },

  onLeave(fn) { this.cleanups.push(fn); },

  savePlayers() { store.set("players", this.players); },

  audio: null,
  unlockAudio() {
    try { this.audio = this.audio || new (window.AudioContext || window.webkitAudioContext)(); this.audio.resume(); } catch {}
  },
  beep(freq = 660, dur = 0.15) {
    try {
      const ctx = this.audio; if (!ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; o.type = "triangle";
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  },

  vibrate(pattern) { try { navigator.vibrate && navigator.vibrate(pattern); } catch {} },

  async keepAwake() {
    try {
      if (!("wakeLock" in navigator)) return;
      const lock = await navigator.wakeLock.request("screen");
      this.onLeave(() => lock.release().catch(() => {}));
    } catch {}
  },

  confetti() {
    const box = document.createElement("div");
    box.className = "confetti";
    const emojis = ["🎉", "🎊", "✨", "🥳", "⭐", "💥", "🍾"];
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("span");
      s.textContent = pick(emojis);
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDelay = Math.random() * 0.8 + "s";
      s.style.fontSize = 18 + Math.random() * 22 + "px";
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3500);
  },

  // 🧑‍🎤 Avatare: jede Person bekommt ein Emoji-Bild mit Farbe (antippen in der Spielerliste ändert es)
  AVATARS: ["🧑‍🎤", "👩‍🚀", "🧑‍🍳", "🦸", "🧙", "🧛", "🥷", "🤠", "👸", "🤴", "🧜‍♀️", "🧑‍🎨", "🧝", "🧞", "🦹", "🧑‍🚒", "🕵️", "💃", "🕺", "🧑‍🚀", "🐶", "🐱", "🦊", "🐼", "🐸", "🦄", "🐵", "🐯", "🐨", "🐷"],
  avatars: {},
  avatarOf(name) {
    if (!this.avatars[name]) {
      const used = new Set(this.players.map((p) => this.avatars[p]).filter(Boolean));
      const free = this.AVATARS.filter((a) => !used.has(a));
      this.avatars[name] = pick(free.length ? free : this.AVATARS);
      store.set("avatars", this.avatars);
    }
    return this.avatars[name];
  },
  avatar(name, size = "") {
    const e = this.avatarOf(name);
    const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
    return `<span class="ava ${size}" style="--h:${hue}">${e}</span>`;
  },

  // Zufälligen Spielernamen in {name} einsetzen
  fill(text, exclude) {
    if (!text.includes("{name}")) return text;
    const pool = this.players.filter((p) => p !== exclude);
    return text.replaceAll("{name}", pool.length ? pick(pool) : "jemandem hier");
  },
};

// ---------- Startseite ----------
const GAMES = [
  { screen: "draftSetup", emoji: "💶", title: "20€ Draft", sub: "Bau mit 20 € das beste Team", cls: "g-orange", big: true },
  { screen: "charSetup", emoji: "🎭", title: "Scharade", sub: "Pantomime, Erklären, Zeichnen …", cls: "g-purple", big: true },
  { screen: "cards:wwe", emoji: "🤔", title: "Wer würde eher?", sub: "Zeigt auf die Person!", cls: "g-blue" },
  { screen: "cards:ihnn", emoji: "🙈", title: "Ich hab noch nie", sub: "Geständnisse garantiert", cls: "g-pink" },
  { screen: "bombSetup", emoji: "💣", title: "Tickende Bombe", sub: "Schnell sein – sonst BOOM!", cls: "g-fire" },
  { screen: "cards:wop", emoji: "🔥", title: "Wahrheit oder Pflicht", sub: "Der Klassiker", cls: "g-red" },
];

App.screens.home = () => {
  const n = App.players.length;
  App.render(`
    <main class="wrap home">
      <div class="brand">
        <div class="logo">🎉</div>
        <h1>Konfetti</h1>
        <p class="muted">Partyspiele für eure Runde</p>
      </div>
      <button class="players-chip" data-go="players">${n ? `<span class="ava-stack">${App.players.slice(0, 5).map((p) => App.avatar(p)).join("")}</span> ${n} Spieler:innen` : "👥 Spieler:innen hinzufügen"} <span>✏️</span></button>
      <div class="games">
        ${GAMES.map((g) => `
          <button class="tile ${g.cls} ${g.big ? "big" : ""}" data-game="${g.screen}">
            <span class="tile-emoji">${g.emoji}</span>
            <span class="tile-title">${g.title}</span>
            <span class="tile-sub">${g.sub}</span>
          </button>`).join("")}
      </div>
      <p class="foot muted">Neue Spielidee? Ab ins Repo damit 💡</p>
    </main>`);
  App.on("[data-game]", "click", (e, el) => {
    const [screen, arg] = el.dataset.game.split(":");
    App.show(screen, arg);
  });
};

// ---------- Spieler:innen ----------
App.screens.players = () => {
  const draw = () => {
    App.render(`
      ${topbar("👥 Spieler:innen")}
      <main class="wrap">
        <form class="add-row" id="addForm">
          <input id="nameInput" maxlength="20" placeholder="Name eingeben …" autocomplete="off" enterkeyhint="done">
          <button class="btn btn-primary btn-small" type="submit">＋</button>
        </form>
        <ul class="player-list">
          ${App.players.map((p, i) => `<li><button class="ava-btn" data-ava="${i}" aria-label="Bild ändern">${App.avatar(p, "big")}</button><span class="pname">${esc(p)}</span><button class="icon-btn small" data-del="${i}" aria-label="Entfernen">✕</button></li>`).join("")}
        </ul>
        ${App.players.length ? `<p class="muted center small">Tipp aufs Bild, um es zu ändern 🎨</p>` : ""}
        ${App.players.length < 2 ? `<p class="muted center">Mindestens 2 Leute für den 20€ Draft und die Bombe.</p>` : ""}
        <button class="btn btn-primary wide" data-go="home">Fertig ✅</button>
      </main>`, { anim: false });
    const input = $("#nameInput");
    $("#addForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (name && !App.players.includes(name)) { App.players.push(name); App.savePlayers(); }
      draw();
      $("#nameInput").focus();
    });
    App.on("[data-ava]", "click", (e, el) => {
      const name = App.players[+el.dataset.ava];
      const list = App.AVATARS;
      App.avatars[name] = list[(list.indexOf(App.avatarOf(name)) + 1) % list.length];
      store.set("avatars", App.avatars);
      draw();
    });
    App.on("[data-del]", "click", (e, el) => { App.players.splice(+el.dataset.del, 1); App.savePlayers(); draw(); });
  };
  draw();
};
