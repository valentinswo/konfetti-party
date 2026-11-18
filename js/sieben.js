// 🍀 Sieben auf einen Streich – Zock-Kartenspiel (eigene Umsetzung, eigenes Design)
// Regeln: Karten sammeln, bei doppelter Zahl verzockt, 7 verschiedene Zahlen = +15 und Rundenende.
// Stapel: 79 Zahlenkarten (12×12, 11×11 … 1×1, 1×0), 6 Bonuskarten (×2, +2 … +10),
//         9 Aktionskarten (je 3× Einfrieren, Zweite Chance, Dreierzug).

const SIEBEN_ACTIONS = {
  freeze: { emoji: "❄️", name: "Einfrieren", text: "Wähle eine Person: Sie ist raus und sichert ihre Punkte." },
  second: { emoji: "🛟", name: "Zweite Chance", text: "Rettet dich einmal vor einer doppelten Zahl." },
  three: { emoji: "🎴", name: "Dreierzug", text: "Wähle eine Person: Sie muss 3 Karten ziehen." },
};
const NUM_COLORS = ["#9aa0b5", "#8a7cff", "#5a8cff", "#2fb5e0", "#22c7a0", "#4cc25a", "#9bd23a", "#ffc21a", "#ff9a2f", "#ff6b3d", "#ff4f7a", "#e04fd0", "#a84fff"];

const Sieben = {
  settings: Object.assign({ target: 200 }, store.get("siebenSettings", {})),
  players: [], deck: [], discard: [], dealer: 0, round: 1, token: 0,
  focus: -1, last: null, msg: "", prompt: null, roundOver: false, log: [],
};

// ---------- Karten ----------
function siebenDeck() {
  const d = [{ t: "num", v: 0 }];
  for (let v = 1; v <= 12; v++) for (let i = 0; i < v; i++) d.push({ t: "num", v });
  ["x2", 2, 4, 6, 8, 10].forEach((v) => d.push({ t: "bonus", v }));
  ["freeze", "second", "three"].forEach((a) => { for (let i = 0; i < 3; i++) d.push({ t: "act", a }); });
  return shuffle(d);
}
function siebenDraw() {
  if (!Sieben.deck.length) {
    Sieben.deck = shuffle(Sieben.discard); Sieben.discard = [];
    if (Sieben.deck.length) Sieben.msg = "🔀 Stapel leer – Ablage wird neu gemischt!";
  }
  return Sieben.deck.pop() || null;
}
const cardHtml = (c, cls = "") => {
  if (!c) return "";
  if (c.t === "num") return `<div class="fcard num ${cls}" style="--c:${NUM_COLORS[c.v]}"><b>${c.v}</b></div>`;
  if (c.t === "bonus") return `<div class="fcard bonus ${cls}"><b>${c.v === "x2" ? "×2" : "+" + c.v}</b></div>`;
  const A = SIEBEN_ACTIONS[c.a];
  return `<div class="fcard act act-${c.a} ${cls}"><span>${A.emoji}</span><small>${A.name}</small></div>`;
};
const active = (p) => p.status === "active";
const nums = (p) => p.cards.filter((c) => c.t === "num");
function roundScore(p) {
  if (p.status === "busted") return 0;
  let s = nums(p).reduce((a, c) => a + c.v, 0);
  if (p.bonus.some((c) => c.v === "x2")) s *= 2;
  s += p.bonus.filter((c) => c.v !== "x2").reduce((a, c) => a + c.v, 0);
  if (p.flip7) s += 15;
  return s;
}

// ---------- Ablaufsteuerung (async, abbrechbar) ----------
const SIEBEN_ABORT = {};
function siebenGuard(tok) { if (tok !== Sieben.token) throw SIEBEN_ABORT; }
function siebenSleep(ms) { const tok = Sieben.token; return new Promise((res) => setTimeout(() => { if (tok === Sieben.token) res(); }, ms)); }
function siebenAsk(prompt) { const tok = Sieben.token; return new Promise((res) => { Sieben.prompt = { ...prompt, resolve: (v) => { if (tok === Sieben.token) { Sieben.prompt = null; res(v); } } }; siebenRender(); }); }

async function siebenChooseTarget(fromIdx, verb, filter = active) {
  const opts = Sieben.players.map((p, i) => i).filter((i) => filter(Sieben.players[i]));
  if (!opts.length) return -1;
  if (opts.length === 1) return opts[0];
  return siebenAsk({ type: "target", from: fromIdx, verb, opts });
}

// Eine Karte an Person i geben. deferred: Liste für Aktionen während eines Dreierzugs.
async function siebenGive(i, deferred = null) {
  const tok = Sieben.token, p = Sieben.players[i];
  const c = siebenDraw();
  if (!c) { Sieben.msg = "Keine Karten mehr – die Runde endet."; Sieben.roundOver = true; return; }
  Sieben.focus = i; Sieben.last = c; Sieben.msg = "";
  if (c.t === "num") {
    if (nums(p).some((x) => x.v === c.v)) {
      if (p.sc) {
        Sieben.discard.push(c, p.sc); p.sc = null;
        Sieben.msg = `🛟 Doppelte ${c.v} – aber die Zweite Chance rettet ${esc(p.name)}!`;
      } else {
        p.cards.push(c); p.status = "busted";
        Sieben.msg = `💥 Doppelte ${c.v}! ${esc(p.name)} hat sich verzockt.`;
        App.vibrate([120, 60, 120]); App.beep(180, 0.35);
      }
    } else {
      p.cards.push(c); App.beep(520 + c.v * 30, 0.08);
      if (nums(p).length >= 7) {
        p.flip7 = true; Sieben.roundOver = true;
        Sieben.msg = `🍀 SIEBEN AUF EINEN STREICH! ${esc(p.name)} bekommt +15 und beendet die Runde!`;
        App.confetti(); App.vibrate([60, 40, 60, 40, 200]);
      }
    }
  } else if (c.t === "bonus") {
    p.bonus.push(c); App.beep(880, 0.1);
  } else {
    siebenRender(); await siebenSleep(700); siebenGuard(tok);
    if (c.a === "second") {
      if (!p.sc) { p.sc = c; Sieben.msg = `🛟 ${esc(p.name)} behält eine Zweite Chance.`; }
      else {
        const t = await siebenChooseTarget(i, "Zweite Chance weitergeben an", (q) => active(q) && !q.sc && q !== p);
        siebenGuard(tok);
        if (t >= 0) { Sieben.players[t].sc = c; Sieben.msg = `🛟 ${esc(p.name)} gibt die zweite Zweite Chance an ${esc(Sieben.players[t].name)}.`; }
        else { Sieben.discard.push(c); Sieben.msg = "🛟 Zweite Chance wird abgeworfen – niemand kann sie nehmen."; }
      }
    } else if (deferred) {
      deferred.push({ c, from: i }); Sieben.msg = `${SIEBEN_ACTIONS[c.a].emoji} ${SIEBEN_ACTIONS[c.a].name} wird nach dem Dreierzug ausgeführt.`;
    } else {
      await siebenAction(c, i); siebenGuard(tok);
    }
  }
  siebenRender(); await siebenSleep(c.t === "num" ? 650 : 900); siebenGuard(tok);
}

async function siebenAction(c, from) {
  const tok = Sieben.token;
  Sieben.discard.push(c);
  const others = Sieben.players.some((q, k) => k !== from && active(q));
  const verb = c.a === "freeze" ? "Wen einfrieren?" : "Wer muss 3 Karten ziehen?";
  const t = others ? await siebenChooseTarget(from, verb) : from;
  siebenGuard(tok);
  if (t < 0) return;
  const tp = Sieben.players[t];
  if (c.a === "freeze") {
    tp.status = "frozen"; Sieben.focus = t;
    Sieben.msg = `❄️ ${esc(tp.name)} ist eingefroren und sichert ${roundScore(tp)} Punkte.`;
    siebenRender(); await siebenSleep(900); siebenGuard(tok);
  } else {
    Sieben.msg = `🎴 ${esc(tp.name)} muss 3 Karten ziehen!`; Sieben.focus = t;
    siebenRender(); await siebenSleep(800); siebenGuard(tok);
    const pending = [];
    for (let k = 0; k < 3; k++) {
      if (!active(tp) || Sieben.roundOver) break;
      await siebenGive(t, pending); siebenGuard(tok);
    }
    if (active(tp) && !Sieben.roundOver) for (const d of pending) { if (Sieben.roundOver) break; await siebenAction(d.c, d.from); siebenGuard(tok); }
    else pending.forEach((d) => Sieben.discard.push(d.c));
  }
}

async function siebenRound() {
  const tok = Sieben.token, n = Sieben.players.length;
  Sieben.roundOver = false; Sieben.msg = `🃏 ${esc(Sieben.players[Sieben.dealer].name)} teilt aus …`;
  Sieben.players.forEach((p) => Object.assign(p, { cards: [], bonus: [], sc: null, status: "active", flip7: false }));
  Sieben.focus = -1; Sieben.last = null;
  siebenRender(); await siebenSleep(900); siebenGuard(tok);
  // Austeilen: jede:r eine Karte, beginnend links vom Geber, Geber zuletzt
  for (let k = 1; k <= n; k++) {
    const i = (Sieben.dealer + k) % n;
    if (Sieben.roundOver) break;
    if (active(Sieben.players[i])) { await siebenGive(i); siebenGuard(tok); }
  }
  // Reihum: Stopp oder Noch eine
  let k = 1;
  while (!Sieben.roundOver && Sieben.players.some(active)) {
    const i = (Sieben.dealer + k) % n; k++;
    const p = Sieben.players[i];
    if (!active(p)) continue;
    Sieben.focus = i; Sieben.last = null;
    const choice = await siebenAsk({ type: "turn", who: i }); siebenGuard(tok);
    if (choice === "stop") {
      p.status = "stopped"; Sieben.msg = `✋ ${esc(p.name)} steigt aus mit ${roundScore(p)} Punkten.`;
      siebenRender(); await siebenSleep(700); siebenGuard(tok);
    } else { await siebenGive(i); siebenGuard(tok); }
  }
  await siebenSleep(600); siebenGuard(tok);
  App.show("siebenRoundEnd");
}

// ---------- Darstellung ----------
const statusLabel = { active: "🎲 im Spiel", stopped: "✋ gestoppt", busted: "💥 verzockt", frozen: "❄️ eingefroren" };

function siebenRender() {
  if (App.current !== "siebenPlay") return;
  const S = Sieben, P = S.players;
  const fi = S.focus >= 0 ? S.focus : S.prompt?.who ?? -1;
  const f = P[fi];
  const pr = S.prompt;
  let actions = "";
  if (pr && pr.type === "turn") {
    actions = `<p class="lead center"><b>${App.avatar(P[pr.who].name)} ${esc(P[pr.who].name)}</b>, was machst du?</p>
      <div class="bid-btns"><button class="btn btn-ghost big-choice" data-ch="stop">✋ Stopp<small>${roundScore(P[pr.who])} Punkte sichern</small></button>
      <button class="btn btn-primary big-choice" data-ch="more">🃏 Noch eine<small>${S.deck.length} im Stapel</small></button></div>`;
  } else if (pr && pr.type === "target") {
    actions = `<p class="lead center"><b>${esc(P[pr.from].name)}</b>: ${pr.verb}</p>
      <div class="chips center">${pr.opts.map((i) => `<button class="chip" data-t="${i}">${App.avatar(P[i].name)} ${esc(P[i].name)}${i === pr.from ? " (du)" : ""}</button>`).join("")}</div>`;
  }
  App.render(`
    ${topbar(`🍀 Runde ${S.round}`, "siebenSetup")}
    <main class="wrap sieben">
      <div class="s-top"><span>🎯 Ziel ${S.settings.target}</span><span>🂠 ${S.deck.length} im Stapel</span><span>🗑️ ${S.discard.length}</span></div>
      ${f ? `
      <div class="s-focus ${f.status}">
        <div class="s-head">${App.avatar(f.name, "big")}<div><b class="s-name">${esc(f.name)}</b><span class="muted small">${statusLabel[f.status]} · Gesamt ${f.total}</span></div>
          <div class="s-pts"><b>${roundScore(f)}</b><small>Runde</small></div></div>
        ${S.last ? `<div class="s-drawn">${cardHtml(S.last, "huge new")}</div>` : ""}
        <div class="s-row">${nums(f).map((c, k) => cardHtml(c, S.last === c ? "new" : "")).join("") || `<span class="muted small">Noch keine Zahlen</span>`}</div>
        ${f.bonus.length || f.sc ? `<div class="s-row small">${f.bonus.map((c) => cardHtml(c, "sm")).join("")}${f.sc ? cardHtml(f.sc, "sm") : ""}</div>` : ""}
        <div class="s-count">${[...Array(7)].map((_, k) => `<i class="${k < nums(f).length ? "on" : ""}"></i>`).join("")}<span>${nums(f).length}/7</span></div>
      </div>` : `<div class="s-focus"><p class="lead center">Mischen …</p></div>`}
      ${S.msg ? `<div class="s-msg">${S.msg}</div>` : ""}
      ${actions}
      <div class="s-others">
        ${P.map((p, i) => `<div class="s-p ${p.status} ${i === fi ? "focus" : ""}">
          ${App.avatar(p.name)}<b>${esc(p.name)}</b>${i === S.dealer ? `<span title="Gibt">🃏</span>` : ""}
          <span class="s-mini">${nums(p).map((c) => `<em style="--c:${NUM_COLORS[c.v]}">${c.v}</em>`).join("")}${p.bonus.map((c) => `<em class="b">${c.v === "x2" ? "×2" : "+" + c.v}</em>`).join("")}${p.sc ? "🛟" : ""}</span>
          <span class="s-st">${statusLabel[p.status].split(" ")[0]} ${roundScore(p)}</span><span class="s-tot">${p.total}</span>
        </div>`).join("")}
      </div>
    </main>`, { anim: false });
  App.on("[data-ch]", "click", (e, el) => pr.resolve(el.dataset.ch));
  App.on("[data-t]", "click", (e, el) => pr.resolve(+el.dataset.t));
}

// ---------- Screens ----------
App.screens.siebenSetup = () => {
  const S = Sieben.settings, n = App.players.length;
  const draw = () => {
    App.render(`
      ${topbar("🍀 Sieben auf einen Streich")}
      <main class="wrap with-bottom">
        <p class="lead">Sammle Zahlenkarten – aber <b>keine doppelt</b>, sonst hast du dich verzockt! Schaffst du <b>7 verschiedene Zahlen</b>, gibt's +15 und die Runde ist sofort vorbei. 🍀</p>
        ${n < 2 ? `<div class="notice">👥 Ihr braucht mindestens 2 Spieler:innen (ideal ab 3).<button class="btn btn-small btn-primary" data-go="players">Hinzufügen</button></div>`
          : n > 18 ? `<div class="notice">👥 Maximal 18 Spieler:innen.</div>`
          : `<div class="ava-row">${App.players.map((p) => `<span class="ava-chip">${App.avatar(p)} ${esc(p)}</span>`).join("")}</div>`}
        <h3 class="section">🎯 Spielen bis</h3>
        <div class="chips">${chipRow([100, 150, 200, 300].map((t) => ({ id: t, name: `${t} Punkte` })), (it) => it.id === S.target, "data-target")}</div>
        <details class="rules-box"><summary>📖 Regeln & Karten</summary>
          <p><b>Ablauf:</b> Zuerst bekommt jede:r eine Karte. Dann wird reihum gefragt: <b>✋ Stopp</b> (aussteigen & Punkte sichern) oder <b>🃏 Noch eine</b>. Die Runde endet, wenn niemand mehr im Spiel ist oder jemand 7 verschiedene Zahlen hat.</p>
          <p><b>Zahlenkarten 0–12:</b> Je höher die Zahl, desto öfter ist sie im Stapel (12× die 12 … 1× die 1, eine 0). Doppelte Zahl = verzockt = 0 Punkte.</p>
          <p><b>Bonuskarten:</b> +2, +4, +6, +8, +10 kommen dazu, ×2 verdoppelt deine Zahlen (nicht die Boni, nicht die +15).</p>
          <p><b>❄️ Einfrieren:</b> Wähle jemanden (auch dich), der sofort aussteigt und seine Punkte sichert.<br>
          <b>🛟 Zweite Chance:</b> Rettet dich einmal vor einer doppelten Zahl. Nur eine pro Person – eine zweite musst du weitergeben.<br>
          <b>🎴 Dreierzug:</b> Wähle jemanden (auch dich), der 3 Karten nacheinander ziehen muss. Aktionen, die dabei gezogen werden, kommen erst danach dran.</p>
          <p><b>Stapel:</b> Benutzte Karten kommen erst zurück, wenn der Stapel leer ist – merkt euch, was schon da war! 🧠</p>
        </details>
      </main>
      <div class="bottom-bar"><button class="btn btn-primary wide" id="start" ${n >= 2 && n <= 18 ? "" : "disabled"}>Spiel starten 🍀</button></div>`, { anim: false });
    App.on("[data-target]", "click", (e, el) => { S.target = +el.dataset.target; store.set("siebenSettings", S); draw(); });
    $("#start").onclick = () => {
      App.unlockAudio();
      Object.assign(Sieben, { players: App.players.map((name) => ({ name, total: 0, cards: [], bonus: [], sc: null, status: "active", flip7: false })),
        deck: siebenDeck(), discard: [], dealer: Math.floor(Math.random() * App.players.length), round: 1 });
      App.show("siebenPlay");
    };
  };
  draw();
};

App.screens.siebenPlay = () => {
  Sieben.token++; Sieben.prompt = null;
  const tok = Sieben.token;
  App.onLeave(() => { if (Sieben.token === tok) Sieben.token++; });
  App.keepAwake();
  siebenRender();
  siebenRound().catch((e) => { if (e !== SIEBEN_ABORT) throw e; });
};

App.screens.siebenRoundEnd = () => {
  const S = Sieben;
  S.players.forEach((p) => { p.last = roundScore(p); p.total += p.last; });
  // Alle Karten der Runde auf die Ablage
  S.players.forEach((p) => { S.discard.push(...p.cards, ...p.bonus); if (p.sc) S.discard.push(p.sc); p.cards = []; p.bonus = []; p.sc = null; });
  const ranked = [...S.players].sort((a, b) => b.total - a.total);
  const done = ranked[0].total >= S.settings.target && (ranked.length < 2 || ranked[0].total > ranked[1].total);
  const tie = ranked[0].total >= S.settings.target && !done;
  App.render(`
    ${topbar(`🍀 Runde ${S.round} vorbei`, "siebenSetup")}
    <main class="wrap">
      ${done ? `<div class="center"><div class="big-emoji bounce">🏆</div><h1 class="name">${App.avatar(ranked[0].name, "big")} ${esc(ranked[0].name)}</h1><p class="lead">gewinnt mit ${ranked[0].total} Punkten!</p></div>` : ""}
      ${tie ? `<div class="notice soft center">🤝 Gleichstand an der Spitze – es gibt eine Extrarunde!</div>` : ""}
      <div class="scoreboard">
        ${ranked.map((p, i) => `<div class="score-row"><span>${["🥇", "🥈", "🥉"][i] || "🎖️"} ${App.avatar(p.name)} ${esc(p.name)}</span>
          <span class="muted small">${p.status === "busted" ? "💥 0" : (p.flip7 ? "🍀 " : p.status === "frozen" ? "❄️ " : "+") + p.last}</span><b>${p.total}</b></div>`).join("")}
      </div>
      ${done
        ? `<button class="btn btn-primary wide" data-go="siebenSetup">🔁 Neues Spiel</button><button class="btn btn-ghost wide" data-go="home">🏠 Startseite</button>`
        : `<p class="muted center small">Als Nächstes gibt ${esc(S.players[(S.dealer + 1) % S.players.length].name)} 🃏</p><button class="btn btn-primary wide" id="next">Nächste Runde ➡️</button>`}
    </main>`);
  if (done) App.confetti();
  else $("#next").onclick = () => { S.dealer = (S.dealer + 1) % S.players.length; S.round++; App.show("siebenPlay"); };
};
