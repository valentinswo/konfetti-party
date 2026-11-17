// 💣 Tickende Bombe
// Eine Kategorie wird gezogen. Reihum sagt jede:r etwas Passendes und gibt das Handy weiter (Button tippen).
// Die Bombe hat eine geheime Zufallszeit. Wer das Handy hält, wenn sie explodiert, verliert ein Leben.
// Wer zuletzt noch Leben hat, gewinnt.

const BOMB_TIMES = { kurz: [10, 25], mittel: [20, 45], lang: [35, 75] };
const BOMB_LETTERS = "ABDEFGHKLMNPRSTW".split("");

const Bomb = {
  settings: Object.assign({ time: "mittel", lives: 2, letter: false }, store.get("bombSettings", {})),
  players: [], start: 0, holder: 0, cat: null, letter: null, used: [], passes: 0,
  save() { store.set("bombSettings", this.settings); },
  alive() { return this.players.filter((p) => p.lives > 0); },
  nextAlive(i) {
    const n = this.players.length;
    for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (this.players[j].lives > 0) return j; }
    return i;
  },
  drawCategory() {
    if (!this.used.length) this.used = shuffle(BOMB_CATEGORIES);
    const [e, n, letterOk] = this.used.pop();
    this.cat = { e, n };
    this.letter = this.settings.letter && letterOk !== false ? pick(BOMB_LETTERS) : null;
  },
};

const hearts = (p) => "❤️".repeat(p.lives) + "🖤".repeat(Math.max(0, Bomb.settings.lives - p.lives));

// Sounds
const bombTick = (hi) => App.beep(hi ? 1400 : 1000, 0.035);
const bombBoom = () => {
  try {
    const ctx = App.audio; if (!ctx) return;
    const len = ctx.sampleRate * 1.2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    const g = ctx.createGain(); g.gain.value = 0.9;
    src.connect(f).connect(g).connect(ctx.destination); src.start();
  } catch {}
};

App.screens.bombSetup = () => {
  const S = Bomb.settings;
  const n = App.players.length;
  const draw = () => {
    App.render(`
      ${topbar("💣 Tickende Bombe")}
      <main class="wrap with-bottom">
        <p class="lead">Eine Kategorie, ein Handy, eine Bombe. Sag etwas Passendes, tippe auf <b>Weitergeben</b> und reich das Handy weiter. Wer es hält, wenn's knallt, verliert ein Leben! 💥</p>
        ${n < 2 ? `<div class="notice">👥 Ihr braucht mindestens 2 Spieler:innen.<button class="btn btn-small btn-primary" data-go="players">Hinzufügen</button></div>` : `
          <div class="ava-row">${App.players.map((p) => `<span class="ava-chip">${App.avatar(p)} ${esc(p)}</span>`).join("")}</div>`}
        <h3 class="section">⏱️ Zündschnur</h3>
        <div class="chips">${chipRow([{ id: "kurz", name: "🔥 Kurz" }, { id: "mittel", name: "🧨 Mittel" }, { id: "lang", name: "🕯️ Lang" }], (it) => it.id === S.time, "data-time")}</div>
        <p class="muted small">Die genaue Zeit ist geheim – zwischen ${BOMB_TIMES[S.time][0]} und ${BOMB_TIMES[S.time][1]} Sekunden.</p>
        <h3 class="section">❤️ Leben pro Person</h3>
        <div class="chips">${chipRow([1, 2, 3].map((l) => ({ id: l, name: "❤️".repeat(l) })), (it) => it.id === S.lives, "data-lives")}</div>
        <h3 class="section">🔤 Extra schwer</h3>
        <div class="chips">${chipRow([{ id: "0", name: "Nur Kategorie" }, { id: "1", name: "Kategorie + Anfangsbuchstabe" }], (it) => (it.id === "1") === S.letter, "data-letter")}</div>
        <p class="muted small">${BOMB_CATEGORIES.length} Kategorien – jede Runde eine neue.</p>
      </main>
      <div class="bottom-bar"><button class="btn btn-primary wide" id="start" ${n < 2 ? "disabled" : ""}>Spiel starten 💣</button></div>`, { anim: false });
    const set = (fn) => { fn(); Bomb.save(); draw(); };
    App.on("[data-time]", "click", (e, el) => set(() => (S.time = el.dataset.time)));
    App.on("[data-lives]", "click", (e, el) => set(() => (S.lives = +el.dataset.lives)));
    App.on("[data-letter]", "click", (e, el) => set(() => (S.letter = el.dataset.letter === "1")));
    $("#start").onclick = () => {
      Bomb.players = shuffle(App.players).map((name) => ({ name, lives: S.lives }));
      Bomb.start = 0;
      App.show("bombRound");
    };
  };
  draw();
};

App.screens.bombRound = () => {
  Bomb.drawCategory();
  const draw = () => {
    const starter = Bomb.players[Bomb.start];
    App.render(`
      ${topbar("💣 Tickende Bombe", "bombSetup")}
      <main class="wrap center">
        <div class="lives-row">${Bomb.players.map((p) => `<span class="${p.lives > 0 ? "" : "dead"}">${App.avatar(p.name)} ${esc(p.name)} <small>${p.lives > 0 ? hearts(p) : "💀"}</small></span>`).join("")}</div>
        <div class="bomb-cat g-fire">
          <span class="bomb-cat-e">${Bomb.cat.e}</span>
          <span class="bomb-cat-n">${esc(Bomb.cat.n)}</span>
          ${Bomb.letter ? `<span class="letter">mit <b>${Bomb.letter}</b></span>` : ""}
        </div>
        <p class="lead">${App.avatar(starter.name)} <b>${esc(starter.name)}</b> fängt an!</p>
        <button class="btn btn-primary wide" id="go">💣 Bombe scharf machen</button>
        <button class="link" id="other">🔁 Andere Kategorie</button>
      </main>`, { anim: false });
    $("#other").onclick = () => { Bomb.drawCategory(); draw(); };
    $("#go").onclick = () => { App.unlockAudio(); App.show("bombPlay"); };
  };
  draw();
};

App.screens.bombPlay = () => {
  const [lo, hi] = BOMB_TIMES[Bomb.settings.time];
  const total = (lo + Math.random() * (hi - lo)) * 1000;
  const startAt = Date.now();
  Bomb.holder = Bomb.start;
  Bomb.passes = 0;
  App.keepAwake();

  App.render(`
    <main class="wrap center bomb-play">
      <div class="bomb-cat small g-fire">
        <span class="bomb-cat-e">${Bomb.cat.e}</span>
        <span class="bomb-cat-n">${esc(Bomb.cat.n)}</span>
        ${Bomb.letter ? `<span class="letter">mit <b>${Bomb.letter}</b></span>` : ""}
      </div>
      <div class="bomb" id="bomb">💣</div>
      <p class="muted">Die Bombe hält gerade</p>
      <h1 class="name" id="holder"></h1>
      <button class="btn btn-pass" id="pass"></button>
      <p class="muted small" id="passes">0 Antworten</p>
    </main>`);

  const show = () => {
    const p = Bomb.players[Bomb.holder];
    const next = Bomb.players[Bomb.nextAlive(Bomb.holder)];
    $("#holder").innerHTML = `${App.avatar(p.name)} ${esc(p.name)}`;
    $("#pass").innerHTML = `Weitergeben 👉 ${App.avatar(next.name)} ${esc(next.name)}`;
    $("#passes").textContent = `${Bomb.passes} Antwort${Bomb.passes === 1 ? "" : "en"}`;
  };
  $("#pass").onclick = () => {
    Bomb.holder = Bomb.nextAlive(Bomb.holder);
    Bomb.passes++;
    App.vibrate(20);
    show();
  };
  show();

  // Ticken – wird gegen Ende schneller
  let timer, alt = false;
  const tick = () => {
    const elapsed = Date.now() - startAt;
    if (elapsed >= total) {
      bombBoom();
      App.vibrate([400, 100, 400]);
      return App.show("bombBoom");
    }
    const prog = elapsed / total;
    alt = !alt;
    bombTick(alt);
    $("#bomb").classList.remove("tick"); void $("#bomb").offsetWidth; $("#bomb").classList.add("tick");
    timer = setTimeout(tick, Math.max(140, 700 - 520 * prog * prog));
  };
  timer = setTimeout(tick, 300);
  App.onLeave(() => clearTimeout(timer));
};

App.screens.bombBoom = () => {
  let loser = Bomb.holder;
  const draw = () => {
    const p = Bomb.players[loser];
    App.render(`
      <main class="wrap center boom">
        <div class="boom-e">💥</div>
        <h1>BOOM!</h1>
        <p class="lead"><span class="name">${App.avatar(p.name)} ${esc(p.name)}</span><br>hatte die Bombe und verliert ein Leben!</p>
        <p class="muted small">Falsch? Wer hatte die Bombe wirklich?</p>
        <div class="chips center">${Bomb.players.map((q, i) => q.lives > 0
          ? `<button class="chip ${i === loser ? "on" : ""}" data-l="${i}">${App.avatar(q.name)} ${esc(q.name)}</button>` : "").join("")}</div>
        <button class="btn btn-primary wide" id="go">Weiter ➡️</button>
      </main>`, { anim: false });
    App.on("[data-l]", "click", (e, el) => { loser = +el.dataset.l; draw(); });
    $("#go").onclick = () => {
      Bomb.players[loser].lives--;
      if (Bomb.alive().length <= 1) return App.show("bombEnd");
      // Wer verloren hat, fängt an – wenn raus, die nächste Person
      Bomb.start = Bomb.players[loser].lives > 0 ? loser : Bomb.nextAlive(loser);
      App.show("bombRound");
    };
  };
  draw();
};

App.screens.bombEnd = () => {
  const winner = Bomb.alive()[0];
  App.render(`
    <main class="wrap center">
      <div class="big-emoji bounce">🏆</div>
      <p class="muted">Überlebt hat</p>
      <h1 class="name">${App.avatar(winner.name)} ${esc(winner.name)}</h1>
      <p class="lead">Nerven aus Stahl! 😎</p>
      <button class="btn btn-primary wide" id="again">🔁 Nochmal</button>
      <button class="btn btn-ghost wide" data-go="bombSetup">⚙️ Einstellungen</button>
      <button class="btn btn-ghost wide" data-go="home">🏠 Startseite</button>
    </main>`);
  App.confetti();
  $("#again").onclick = () => {
    Bomb.players = shuffle(App.players).map((name) => ({ name, lives: Bomb.settings.lives }));
    Bomb.start = 0;
    App.show("bombRound");
  };
};
