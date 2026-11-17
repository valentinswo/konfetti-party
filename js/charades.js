// 🎭 Scharade
// Teams spielen abwechselnd. Pro Zug läuft ein Timer – so viele Begriffe wie möglich darstellen!

const CHAR_MODES = [
  { id: "pantomime", emoji: "🎭", name: "Pantomime", hint: "Nur Gesten – kein Wort, kein Geräusch!" },
  { id: "erklaeren", emoji: "🗣️", name: "Erklären", hint: "Beschreiben, ohne das Wort (oder Teile davon) zu sagen." },
  { id: "zeichnen", emoji: "🎨", name: "Zeichnen", hint: "Nur zeichnen – keine Buchstaben, keine Zahlen!" },
  { id: "geraeusche", emoji: "🔊", name: "Geräusche", hint: "Nur Laute und Geräusche, keine echten Wörter." },
];
const MIX_MODE = { id: "mix", emoji: "🎲", name: "Gemischt", hint: "Jede Karte hat einen zufälligen Modus." };
const TEAM_DEFAULTS = ["Team Feuer 🔥", "Team Welle 🌊", "Team Blitz ⚡", "Team Blume 🌸"];

const Char = {
  settings: Object.assign(
    { teamCount: 2, teamNames: [...TEAM_DEFAULTS], mode: "pantomime", time: 60, rounds: 3, tilt: true, cats: CHARADES_CATEGORIES.map((c) => c.id) },
    store.get("charSettings", {})
  ),
  teams: [], pool: [], turn: 0, cards: [],
  save() { store.set("charSettings", this.settings); },
  modeById(id) { return [...CHAR_MODES, MIX_MODE].find((m) => m.id === id) || CHAR_MODES[0]; },
  nextCard() {
    if (!this.pool.length) {
      const cats = CHARADES_CATEGORIES.filter((c) => this.settings.cats.includes(c.id));
      this.pool = shuffle(cats.flatMap((c) => c.words.map((w) => ({ w, cat: c }))));
    }
    const card = this.pool.pop();
    card.mode = this.settings.mode === "mix" ? pick(CHAR_MODES) : this.modeById(this.settings.mode);
    return card;
  },
};
// Kategorien, die es nicht (mehr) gibt, aus alten Einstellungen entfernen
Char.settings.cats = Char.settings.cats.filter((id) => CHARADES_CATEGORIES.some((c) => c.id === id));
if (!Char.settings.cats.length) Char.settings.cats = CHARADES_CATEGORIES.map((c) => c.id);

const chipRow = (items, isOn, attr) => items.map((it) =>
  `<button class="chip ${isOn(it) ? "on" : ""}" ${attr}="${it.id}">${it.emoji ? it.emoji + " " : ""}${esc(it.name)}</button>`).join("");

App.screens.charSetup = () => {
  const S = Char.settings;
  const draw = () => {
    const allOn = S.cats.length === CHARADES_CATEGORIES.length;
    App.render(`
      ${topbar("🎭 Scharade")}
      <main class="wrap with-bottom">
        <h3 class="section">👥 Teams</h3>
        <div class="chips">${chipRow([2, 3, 4].map((n) => ({ id: n, name: `${n} Teams` })), (it) => it.id === S.teamCount, "data-tc")}</div>
        <div class="team-inputs">
          ${Array.from({ length: S.teamCount }, (_, i) => `<input data-tn="${i}" maxlength="24" value="${esc(S.teamNames[i] || TEAM_DEFAULTS[i])}">`).join("")}
        </div>

        <h3 class="section">🎬 Modus</h3>
        <div class="chips">${chipRow([...CHAR_MODES, MIX_MODE], (m) => m.id === S.mode, "data-mode")}</div>
        <p class="muted small">${Char.modeById(S.mode).hint}</p>

        <h3 class="section">📱 Steuerung</h3>
        <div class="chips">${chipRow([{ id: "1", name: "📲 Kippen (Stirn)" }, { id: "0", name: "👆 Tippen" }], (it) => (it.id === "1") === S.tilt, "data-tilt")}</div>
        <p class="muted small">${S.tilt ? "Die ratende Person hält das Handy an die Stirn: nach vorne kippen = erraten ✅, nach hinten kippen = überspringen ⏭️." : "Die darstellende Person tippt auf ✅ oder ⏭️."}</p>

        <h3 class="section">⏱️ Zeit pro Zug</h3>
        <div class="chips">${chipRow([30, 45, 60, 90].map((t) => ({ id: t, name: `${t} s` })), (it) => it.id === S.time, "data-time")}</div>

        <h3 class="section">🔁 Runden pro Team</h3>
        <div class="chips">${chipRow([2, 3, 5, 8].map((r) => ({ id: r, name: `${r}` })), (it) => it.id === S.rounds, "data-rounds")}</div>

        <h3 class="section">📚 Kategorien <button class="link" id="allCats">${allOn ? "keine" : "alle"}</button></h3>
        <div class="chips">${chipRow(CHARADES_CATEGORIES, (c) => S.cats.includes(c.id), "data-cat")}</div>
        <p class="muted small">${CHARADES_CATEGORIES.filter((c) => S.cats.includes(c.id)).reduce((n, c) => n + c.words.length, 0)} Begriffe ausgewählt</p>
      </main>
      <div class="bottom-bar"><button class="btn btn-primary wide" id="start" ${S.cats.length ? "" : "disabled"}>Spiel starten 🎉</button></div>`, { anim: false });

    const set = (fn) => { fn(); Char.save(); draw(); };
    App.on("[data-tc]", "click", (e, el) => set(() => (S.teamCount = +el.dataset.tc)));
    App.on("[data-mode]", "click", (e, el) => set(() => (S.mode = el.dataset.mode)));
    App.on("[data-tilt]", "click", (e, el) => set(() => (S.tilt = el.dataset.tilt === "1")));
    App.on("[data-time]", "click", (e, el) => set(() => (S.time = +el.dataset.time)));
    App.on("[data-rounds]", "click", (e, el) => set(() => (S.rounds = +el.dataset.rounds)));
    App.on("[data-cat]", "click", (e, el) => set(() => {
      const id = el.dataset.cat;
      S.cats = S.cats.includes(id) ? S.cats.filter((c) => c !== id) : [...S.cats, id];
    }));
    $("#allCats").onclick = () => set(() => (S.cats = allOn ? [] : CHARADES_CATEGORIES.map((c) => c.id)));
    App.on("[data-tn]", "input", (e, el) => { S.teamNames[+el.dataset.tn] = el.value; Char.save(); });
    $("#start").onclick = () => App.show("charStart");
  };
  draw();
};

App.screens.charStart = () => {
  const S = Char.settings;
  Char.teams = Array.from({ length: S.teamCount }, (_, i) => ({ name: (S.teamNames[i] || "").trim() || TEAM_DEFAULTS[i], score: 0 }));
  Char.pool = [];
  Char.turn = 0;
  App.show("charReady");
};

// Bewegungssensor freischalten (iPhone fragt nach Erlaubnis). Gibt true zurück, wenn Kippen nutzbar ist.
async function requestTilt() {
  if (!("DeviceOrientationEvent" in window)) return false;
  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== "granted") return false;
    }
  } catch { return false; }
  // Prüfen, ob wirklich Sensordaten ankommen (Desktop-Browser liefern oft nichts)
  return new Promise((resolve) => {
    const t = setTimeout(() => { window.removeEventListener("deviceorientation", h); resolve(false); }, 1200);
    const h = (e) => {
      if (e.beta == null) return;
      clearTimeout(t); window.removeEventListener("deviceorientation", h); resolve(true);
    };
    window.addEventListener("deviceorientation", h);
  });
}

const miniScores = () => `<div class="mini-scores">${Char.teams.map((t, i) =>
  `<span class="${i === Char.turn % Char.teams.length ? "active" : ""}">${esc(t.name)} <b>${t.score}</b></span>`).join("")}</div>`;

App.screens.charReady = () => {
  const S = Char.settings;
  const team = Char.teams[Char.turn % Char.teams.length];
  const round = Math.floor(Char.turn / Char.teams.length) + 1;
  const mode = Char.modeById(S.mode);
  App.render(`
    ${topbar(`Runde ${round} / ${S.rounds}`, "charSetup")}
    <main class="wrap center">
      ${miniScores()}
      <div class="big-emoji">${mode.emoji}</div>
      <h1 class="name">${esc(team.name)}</h1>
      ${S.tilt
        ? `<p class="lead">ist dran! Eine Person rät, die anderen im Team stellen dar.</p>
           <div class="notice soft">📲 Ratende Person: Handy quer an die Stirn, Display zu den anderen.<br>
             <b>Nach vorne kippen</b> = erraten ✅ · <b>nach hinten kippen</b> = weiter ⏭️<br>
             Darstellen: ${mode.hint} ⏱️ ${S.time} Sekunden.</div>`
        : `<p class="lead">ist dran! Eine Person stellt dar, der Rest des Teams rät.</p>
           <div class="notice soft">${mode.hint}<br>Halte das Handy so, dass nur du es siehst. ⏱️ ${S.time} Sekunden.</div>`}
      <button class="btn btn-primary wide" id="go">▶️ Start</button>
    </main>`);
  $("#go").onclick = async () => {
    App.unlockAudio();
    Char.tiltOn = false;
    if (S.tilt) Char.tiltOn = await requestTilt();
    App.show("charCountdown");
  };
};

App.screens.charCountdown = () => {
  let n = 3;
  App.render(`<main class="wrap center countdown">${Char.tiltOn ? `<p class="lead">📲 Handy an die Stirn!</p>` : ""}<div class="count" id="c">3</div></main>`);
  const iv = setInterval(() => {
    n--;
    if (n <= 0) { clearInterval(iv); App.show("charPlay"); return; }
    $("#c").textContent = n;
    $("#c").classList.remove("pop"); void $("#c").offsetWidth; $("#c").classList.add("pop");
    App.vibrate(40);
  }, 800);
  App.onLeave(() => clearInterval(iv));
};

App.screens.charPlay = () => {
  const S = Char.settings;
  Char.cards = [];
  let card = Char.nextCard();
  const end = Date.now() + S.time * 1000;
  App.keepAwake();

  App.render(`
    <main class="play">
      <div class="timer"><i id="tf"></i><span id="tt">${S.time}</span></div>
      <div class="word-card" id="wc"></div>
      <div class="play-btns">
        <button class="btn btn-skip" id="skip">⏭️ Weiter</button>
        <button class="btn btn-ok" id="ok">✅ Erraten</button>
      </div>
      <p class="muted center small" id="cnt">${Char.tiltOn ? "📲 vorne kippen = ✅ · hinten kippen = ⏭️ · " : S.tilt ? "📲 Kippen hier nicht verfügbar – nutze die Buttons · " : ""}0 erraten</p>
      <div class="flash" id="flash"></div>
    </main>`);

  const show = () => {
    $("#wc").innerHTML = `
      <span class="cat">${card.cat.emoji} ${esc(card.cat.name)}</span>
      ${S.mode === "mix" ? `<span class="mode-badge">${card.mode.emoji} ${card.mode.name}</span>` : ""}
      <div class="word">${esc(card.w)}</div>`;
    $("#wc").classList.remove("pop"); void $("#wc").offsetWidth; $("#wc").classList.add("pop");
  };
  const advance = (ok) => {
    Char.cards.push({ ...card, ok });
    App.vibrate(ok ? 60 : [20, 40, 20]);
    App.beep(ok ? 880 : 300, ok ? 0.15 : 0.2);
    const f = $("#flash");
    f.className = "flash show " + (ok ? "ok" : "skip");
    f.textContent = ok ? "✅ Richtig!" : "⏭️ Weiter";
    clearTimeout(Char.flashT);
    Char.flashT = setTimeout(() => { f.className = "flash"; }, 650);
    $("#cnt").textContent = `${Char.tiltOn ? "📲 vorne = ✅ · hinten = ⏭️ · " : ""}${Char.cards.filter((c) => c.ok).length} erraten`;
    card = Char.nextCard();
    show();
  };
  $("#ok").onclick = () => advance(true);
  $("#skip").onclick = () => advance(false);

  // 📲 Kippen: Bildschirm zeigt nach unten (vorne kippen) = erraten, nach oben (hinten kippen) = weiter.
  // Zwischen zwei Aktionen muss das Handy wieder gerade (senkrecht) gehalten werden.
  if (Char.tiltOn) {
    let armed = false, last = 0;
    const onTilt = (e) => {
      if (e.beta == null || e.gamma == null) return;
      const rad = Math.PI / 180;
      const up = Math.cos(e.beta * rad) * Math.cos(e.gamma * rad); // +1 Display nach oben, −1 nach unten, 0 senkrecht
      if (Math.abs(up) < 0.4) { armed = true; return; }
      if (!armed || Date.now() - last < 700) return;
      if (up < -0.65) { armed = false; last = Date.now(); advance(true); }
      else if (up > 0.65) { armed = false; last = Date.now(); advance(false); }
    };
    window.addEventListener("deviceorientation", onTilt);
    App.onLeave(() => window.removeEventListener("deviceorientation", onTilt));
  }

  const iv = setInterval(() => {
    const left = Math.max(0, end - Date.now());
    const sec = Math.ceil(left / 1000);
    $("#tt").textContent = sec;
    $("#tf").style.width = (left / (S.time * 1000)) * 100 + "%";
    $(".timer").classList.toggle("urgent", sec <= 10);
    if (left <= 0) {
      clearInterval(iv);
      Char.cards.push({ ...card, ok: false, last: true });
      App.vibrate([200, 100, 200]);
      App.beep(220, 0.6);
      App.show("charSummary");
    }
  }, 200);
  App.onLeave(() => clearInterval(iv));
  show();
};

App.screens.charSummary = () => {
  const team = Char.teams[Char.turn % Char.teams.length];
  const draw = () => {
    const pts = Char.cards.filter((c) => c.ok).length;
    App.render(`
      ${topbar("⏰ Zeit ist um!", "charSetup")}
      <main class="wrap with-bottom">
        <p class="lead center"><b>${esc(team.name)}</b> holt <b class="big-num">${pts}</b> Punkt${pts === 1 ? "" : "e"}</p>
        <p class="muted center small">Tippe auf einen Begriff, um ihn zu korrigieren.</p>
        <ul class="summary">
          ${Char.cards.map((c, i) => `<li><button class="sum-item ${c.ok ? "ok" : ""}" data-i="${i}">${c.ok ? "✅" : "❌"} ${esc(c.w)} <span class="muted small">${c.cat.emoji}</span></button></li>`).join("")}
        </ul>
      </main>
      <div class="bottom-bar"><button class="btn btn-primary wide" id="next">Weiter ➡️</button></div>`, { anim: false });
    App.on("[data-i]", "click", (e, el) => { const c = Char.cards[+el.dataset.i]; c.ok = !c.ok; draw(); });
    $("#next").onclick = () => {
      team.score += pts;
      Char.turn++;
      App.show(Char.turn >= Char.teams.length * Char.settings.rounds ? "charEnd" : "charReady");
    };
  };
  draw();
};

App.screens.charEnd = () => {
  const ranked = [...Char.teams].sort((a, b) => b.score - a.score);
  const tie = ranked.length > 1 && ranked[0].score === ranked[1].score;
  App.render(`
    <main class="wrap center">
      <div class="big-emoji bounce">${tie ? "🤝" : "🏆"}</div>
      <h1 class="name">${tie ? "Unentschieden!" : esc(ranked[0].name)}</h1>
      <p class="muted">${tie ? "Da hilft nur eine Revanche 😤" : "gewinnt die Scharade!"}</p>
      <div class="scoreboard">
        ${ranked.map((t, i) => `<div class="score-row"><span>${["🥇", "🥈", "🥉"][i] || "🎖️"} ${esc(t.name)}</span><b>${t.score}</b></div>`).join("")}
      </div>
      <button class="btn btn-primary wide" data-go="charStart">🔁 Revanche</button>
      <button class="btn btn-ghost wide" data-go="charSetup">⚙️ Einstellungen</button>
      <button class="btn btn-ghost wide" data-go="home">🏠 Startseite</button>
    </main>`);
  App.confetti();
};
