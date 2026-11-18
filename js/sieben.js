// 🍀 Sieben auf einen Streich – Zock-Kartenspiel (eigene Umsetzung, eigenes Design)
// Regeln: Karten sammeln, bei doppelter Zahl verzockt, 7 verschiedene Zahlen = +15 und Rundenende.
// Stapel: 79 Zahlenkarten (12×12, 11×11 … 1×1, 1×0), 6 Bonuskarten (×2, +2 … +10),
//         9 Aktionskarten (je 3× Einfrieren, Zweite Chance, Dreierzug).
// Benutzte Karten kommen auf die Ablage und werden erst neu gemischt, wenn der Stapel leer ist.
//
// Darstellung: runder Spieltisch, der sich zur Person dreht, die dran ist. Karten fliegen vom Stapel.
// Effekte: ❄️ Eis über den Karten, 🛡️ goldenes Schild (zerbricht bei Rettung), ⚡ Blitze beim Dreierzug,
//          verzockt = Karten auf der Rückseite, gestoppt = Karten als quer gelegter Stapel.

const SIEBEN_ACTIONS = {
  freeze: { emoji: "❄️", name: "Einfrieren" },
  second: { emoji: "🛡️", name: "Zweite Chance" },
  three: { emoji: "⚡", name: "Dreierzug" },
};
const NUM_COLORS = ["#9aa0b5", "#8a7cff", "#5a8cff", "#2fb5e0", "#22c7a0", "#4cc25a", "#9bd23a", "#ffc21a", "#ff9a2f", "#ff6b3d", "#ff4f7a", "#e04fd0", "#a84fff"];

const Sieben = {
  settings: Object.assign({ target: 200 }, store.get("siebenSettings", {})),
  players: [], deck: [], discard: [], dealer: 0, round: 1, token: 0,
  focus: -1, last: null, msg: "", prompt: null, roundOver: false, three: null, rot: 0, rotAnim: 0,
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
    if (Sieben.deck.length) Sieben.msg = "🔀 Stapel leer – die Ablage wird jetzt neu gemischt!";
  }
  return Sieben.deck.pop() || null;
}
const cardHtml = (c, cls = "") => {
  if (!c) return "";
  if (c.t === "num") return `<div class="fcard num ${cls}" style="--c:${NUM_COLORS[c.v]}"><b>${c.v}</b></div>`;
  if (c.t === "bonus") return `<div class="fcard bonus ${cls}"><b>${c.v === "x2" ? "×2" : "+" + c.v}</b></div>`;
  if (c.t === "back") return `<div class="fcard back ${cls}"><span>🍀</span></div>`;
  const A = SIEBEN_ACTIONS[c.a];
  return `<div class="fcard act act-${c.a} ${cls}"><span>${A.emoji}</span><small>${A.name}</small></div>`;
};
const SHIELD_SVG = `<svg viewBox="0 0 40 48" class="shield-svg"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6b0"/><stop offset=".45" stop-color="#ffcf2f"/><stop offset="1" stop-color="#c88400"/></linearGradient></defs>
  <path d="M20 2 L37 8 V22 C37 34 29 42 20 46 C11 42 3 34 3 22 V8Z" fill="url(#sg)" stroke="#fff3b8" stroke-width="2"/>
  <path d="M20 8 L31 12 V22 C31 30 26 36 20 39 C14 36 9 30 9 22 V12Z" fill="none" stroke="#a86a00" stroke-width="1.5" opacity=".6"/>
  <path d="M20 15 l2.6 5.4 5.9.8 -4.3 4.1 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.1 5.9 -.8Z" fill="#fff8d0"/>
  <ellipse cx="13" cy="13" rx="4" ry="7" fill="#fff" opacity=".45" transform="rotate(25 13 13)"/></svg>`;
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
function siebenAsk(prompt) { const tok = Sieben.token; return new Promise((res) => { Sieben.prompt = { ...prompt, resolve: (v) => { if (tok === Sieben.token) { Sieben.prompt = null; siebenRender(); res(v); } } }; siebenRender(); }); }

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
  siebenSetFocus(i); Sieben.last = null; Sieben.msg = "";
  if (Sieben.three && Sieben.three.i === i) Sieben.three.n++;
  siebenRender();
  await siebenFly(c, "#s7-deck", `#seat-${i} .seat-cards`); siebenGuard(tok);
  Sieben.last = c;
  if (c.t === "num") {
    if (nums(p).some((x) => x.v === c.v)) {
      if (p.sc) {
        const sc = p.sc; p.sc = null;
        Sieben.msg = `🛡️ Doppelte ${c.v} – aber das goldene Schild rettet ${esc(p.name)}!`;
        siebenFx(i, "shield-break"); siebenRender(); App.beep(1200, 0.12); App.vibrate([30, 30, 30]);
        await siebenFly(c, `#seat-${i} .seat-cards`, "#s7-disc", "bounce"); siebenGuard(tok);
        Sieben.discard.push(c, sc);
      } else {
        p.cards.push(c); p.status = "busted";
        Sieben.msg = `💥 Doppelte ${c.v}! ${esc(p.name)} hat sich verzockt.`;
        App.vibrate([120, 60, 120]); App.beep(180, 0.35);
        siebenRender(); siebenFx(i, "bust");
      }
    } else {
      p.cards.push(c); App.beep(520 + c.v * 30, 0.08);
      if (nums(p).length >= 7) {
        p.flip7 = true; Sieben.roundOver = true;
        Sieben.msg = `🍀 SIEBEN AUF EINEN STREICH! ${esc(p.name)} bekommt +15 und beendet die Runde!`;
        siebenRender(); siebenFx(i, "flip7"); App.confetti(); App.vibrate([60, 40, 60, 40, 200]);
      }
    }
  } else if (c.t === "bonus") {
    p.bonus.push(c); App.beep(880, 0.1);
  } else {
    Sieben.msg = `${SIEBEN_ACTIONS[c.a].emoji} ${esc(p.name)} zieht <b>${SIEBEN_ACTIONS[c.a].name}</b>!`;
    siebenRender(); await siebenSleep(800); siebenGuard(tok);
    if (c.a === "second") {
      if (!p.sc) { p.sc = c; Sieben.msg = `🛡️ ${esc(p.name)} bekommt ein goldenes Schild (Zweite Chance).`; siebenRender(); siebenFx(i, "shield-gain"); }
      else {
        const t = await siebenChooseTarget(i, "2. Schild weitergeben an", (q) => active(q) && !q.sc && q !== p);
        siebenGuard(tok);
        if (t >= 0) {
          await siebenFly(c, `#seat-${i} .seat-cards`, `#seat-${t} .seat-cards`); siebenGuard(tok);
          Sieben.players[t].sc = c; Sieben.msg = `🛡️ ${esc(p.name)} gibt das zweite Schild an ${esc(Sieben.players[t].name)}.`;
          siebenRender(); siebenFx(t, "shield-gain");
        } else { Sieben.discard.push(c); Sieben.msg = "🛡️ Das zweite Schild wird abgeworfen – niemand kann es nehmen."; }
      }
    } else if (deferred) {
      deferred.push({ c, from: i }); Sieben.msg = `${SIEBEN_ACTIONS[c.a].emoji} ${SIEBEN_ACTIONS[c.a].name} kommt erst nach dem Dreierzug dran.`;
    } else {
      await siebenAction(c, i); siebenGuard(tok);
    }
  }
  siebenRender(); await siebenSleep(Sieben.three ? 450 : c.t === "num" ? 650 : 900); siebenGuard(tok);
}

async function siebenAction(c, from) {
  const tok = Sieben.token;
  Sieben.discard.push(c);
  const others = Sieben.players.some((q, k) => k !== from && active(q));
  const verb = c.a === "freeze" ? "Wen einfrieren? ❄️" : "Wer muss 3 Karten ziehen? ⚡";
  const t = others ? await siebenChooseTarget(from, verb) : from;
  siebenGuard(tok);
  if (t < 0) return;
  const tp = Sieben.players[t];
  if (c.a === "freeze") {
    tp.status = "frozen"; siebenSetFocus(t);
    Sieben.msg = `❄️ ${esc(tp.name)} ist eingefroren und sichert ${roundScore(tp)} Punkte.`;
    siebenRender(); siebenFx(t, "freeze"); App.beep(1500, 0.25);
    await siebenSleep(1300); siebenGuard(tok);
  } else {
    Sieben.msg = `⚡ ${esc(tp.name)} muss 3 Karten ziehen!`; siebenSetFocus(t);
    Sieben.three = { i: t, n: 0 };
    siebenRender(); siebenFx(t, "three"); App.beep(300, 0.2);
    await siebenSleep(1000); siebenGuard(tok);
    const pending = [];
    for (let k = 0; k < 3; k++) {
      if (!active(tp) || Sieben.roundOver) break;
      await siebenGive(t, pending); siebenGuard(tok);
    }
    Sieben.three = null; siebenRender();
    if (active(tp) && !Sieben.roundOver) for (const d of pending) { if (Sieben.roundOver) break; await siebenAction(d.c, d.from); siebenGuard(tok); }
    else pending.forEach((d) => Sieben.discard.push(d.c));
  }
}

async function siebenRound() {
  const tok = Sieben.token, n = Sieben.players.length;
  Sieben.roundOver = false; Sieben.three = null; Sieben.msg = `🎩 ${esc(Sieben.players[Sieben.dealer].name)} teilt aus …`;
  Sieben.players.forEach((p) => Object.assign(p, { cards: [], bonus: [], sc: null, status: "active", flip7: false }));
  Sieben.last = null; siebenSetFocus((Sieben.dealer + 1) % n, true);
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
    siebenSetFocus(i); Sieben.last = null;
    const choice = await siebenAsk({ type: "turn", who: i }); siebenGuard(tok);
    if (choice === "stop") {
      p.status = "stopped"; Sieben.msg = `✋ ${esc(p.name)} steigt aus und sichert ${roundScore(p)} Punkte.`;
      siebenRender(); await siebenSleep(800); siebenGuard(tok);
    } else { await siebenGive(i); siebenGuard(tok); }
  }
  await siebenSleep(900); siebenGuard(tok);
  App.show("siebenRoundEnd");
}

// ---------- Tisch: Drehung, Flugkarten, Effekte ----------
const siebenReduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

function siebenSetFocus(i, instant = false) {
  if (Sieben.focus === i && !instant) return;
  Sieben.focus = i;
  const n = Sieben.players.length;
  let from = Sieben.rot, to = i;
  // kürzester Weg im Kreis
  while (to - from > n / 2) to -= n;
  while (from - to > n / 2) to += n;
  if (instant || siebenReduced()) { Sieben.rotAnim++; Sieben.rot = to; siebenPlaceSeats(); return; }
  const start = performance.now(), dur = 750, id = ++Sieben.rotAnim;
  const step = (t) => {
    if (id !== Sieben.rotAnim) return;
    const k = Math.min(1, (t - start) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    Sieben.rot = from + (to - from) * e; siebenPlaceSeats();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function siebenPlaceSeats() {
  const n = Sieben.players.length, tbl = document.querySelector(".s7-table");
  // Radius so wählen, dass die Plätze nie über den Rand ragen (wichtig auf schmalen Handys)
  const tw = tbl ? tbl.clientWidth : 800, th = tbl ? tbl.clientHeight : 550;
  const rx = Math.max(22, Math.min(40, 50 - (82 / tw) * 100)), ry = Math.max(22, Math.min(37, 50 - (52 / th) * 100));
  Sieben.players.forEach((p, i) => {
    const el = document.getElementById(`seat-${i}`); if (!el) return;
    const a = (Math.PI / 2) + ((i - Sieben.rot) / n) * Math.PI * 2;
    const x = 50 + rx * Math.cos(a), y = 50 + ry * Math.sin(a);
    const front = Math.max(0, Math.sin(a));
    el.style.left = x + "%"; el.style.top = y + "%";
    el.style.transform = `translate(-50%, -50%) scale(${0.82 + 0.3 * front})`;
    el.style.zIndex = Math.round(10 + y);
  });
}

function siebenFly(card, fromSel, toSel, kind = "") {
  const from = document.querySelector(fromSel), to = document.querySelector(toSel);
  if (!from || !to || siebenReduced() || !document.body.animate) return Promise.resolve();
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "s7-fly"; el.innerHTML = cardHtml(card);
  el.style.left = a.left + a.width / 2 + "px"; el.style.top = a.top + a.height / 2 + "px";
  document.body.appendChild(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const frames = kind === "bounce"
    ? [{ transform: "translate(-50%,-50%) scale(1)" }, { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3 - 60}px)) rotate(200deg) scale(1.1)` }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(400deg) scale(.6)`, opacity: 0.4 }]
    : [{ transform: "translate(-50%,-50%) rotateY(180deg) scale(.9)" }, { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 30}px)) rotateY(90deg) scale(1.25)` }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotateY(0) scale(.85)` }];
  const anim = el.animate(frames, { duration: kind === "bounce" ? 650 : Sieben.three ? 330 : 460, easing: "cubic-bezier(.3,.7,.3,1)" });
  return anim.finished.then(() => el.remove(), () => el.remove());
}

function siebenParticles(el, chars, count = 14, spread = 90) {
  if (!el || siebenReduced() || !document.body.animate) return;
  const r = el.getBoundingClientRect();
  for (let k = 0; k < count; k++) {
    const s = document.createElement("span");
    s.className = "s7-particle"; s.textContent = chars[k % chars.length];
    s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + r.height / 2 + "px";
    document.body.appendChild(s);
    const ang = Math.random() * Math.PI * 2, d = spread * (0.5 + Math.random() * 0.7);
    s.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * d}px), calc(-50% + ${Math.sin(ang) * d}px)) rotate(${Math.random() * 360}deg) scale(1)`, opacity: 0 }],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.3,1)" }).finished.then(() => s.remove(), () => s.remove());
  }
}

function siebenFx(i, type) {
  const seat = document.getElementById(`seat-${i}`), hand = document.getElementById("s7-hand");
  const targets = [seat, Sieben.focus === i ? hand : null].filter(Boolean);
  const pulse = (cls, ms) => targets.forEach((el) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); });
  if (type === "freeze") { pulse("fx-freeze", 1400); siebenParticles(seat, ["❄️", "❄", "✦"], 18, 110); }
  if (type === "shield-gain") { pulse("fx-shield-gain", 900); siebenParticles(seat, ["✨", "⭐"], 10, 70); }
  if (type === "shield-break") {
    targets.forEach((el) => {
      const sh = el.querySelector(".shield-slot"); if (!sh) return;
      const r = sh.getBoundingClientRect(), box = document.createElement("div");
      box.className = "s7-shatter"; box.style.left = r.left + "px"; box.style.top = r.top + "px"; box.style.width = r.width + "px"; box.style.height = r.height + "px";
      box.innerHTML = `<div class="half l">${SHIELD_SVG}</div><div class="half r">${SHIELD_SVG}</div>`;
      document.body.appendChild(box); setTimeout(() => box.remove(), 1000);
    });
    siebenParticles(seat, ["✨", "💛"], 12, 80);
  }
  if (type === "three") pulse("fx-three", 1100);
  if (type === "bust") { pulse("fx-bust", 700); siebenParticles(seat, ["💥", "💢"], 8, 70); }
  if (type === "flip7") { pulse("fx-flip7", 2000); siebenParticles(seat, ["🍀", "✨", "⭐"], 22, 140); }
}

// ---------- Darstellung ----------
const statusLabel = { active: "🎲 im Spiel", stopped: "✋ gestoppt", busted: "💥 verzockt", frozen: "❄️ eingefroren" };

function cardsBlock(p, big) {
  const cls = big ? "" : "sm";
  let row;
  if (p.status === "busted") row = p.cards.map(() => cardHtml({ t: "back" }, cls + " flipback")).join("");
  else row = [...nums(p), ...p.bonus].map((c) => cardHtml(c, cls + (Sieben.last === c ? " new" : ""))).join("");
  if (!row) row = `<span class="s7-empty">${p.status === "frozen" ? "❄️" : "–"}</span>`;
  return `<div class="cards-row ${p.status === "stopped" ? "stacked" : ""}">${row}</div>
    ${p.status === "frozen" ? `<div class="ice"><i></i></div>` : ""}
    ${p.sc ? `<div class="shield-slot">${SHIELD_SVG}</div>` : ""}`;
}

function siebenRender() {
  if (App.current !== "siebenPlay" || !document.getElementById("s7")) return;
  const S = Sieben, P = S.players;
  // Kopfzeile & Stapel
  $("#s7-round").textContent = `Runde ${S.round}`;
  $("#s7-deckn").textContent = S.deck.length;
  $("#s7-discn").textContent = S.discard.length;
  $("#s7-disc .disc-top").innerHTML = S.discard.length ? cardHtml(S.discard[S.discard.length - 1], "sm") : "";
  // Plätze
  P.forEach((p, i) => {
    const el = document.getElementById(`seat-${i}`);
    const keep = [...el.classList].filter((c) => c.startsWith("fx-"));
    el.className = `seat ${p.status} ${i === S.focus ? "focus" : ""} ${S.three && S.three.i === i ? "three" : ""} ${p.flip7 ? "flip7" : ""} ${keep.join(" ")}`;
    el.querySelector(".seat-head").innerHTML = `${App.avatar(p.name)}<b>${esc(p.name)}</b>${i === S.dealer ? `<span class="dealer">🎩 gibt</span>` : ""}
      <span class="seat-pts">${p.status === "busted" ? "💥" : roundScore(p)}</span><span class="seat-tot">Σ ${p.total}</span>`;
    el.querySelector(".seat-cards").innerHTML = cardsBlock(p, false);
    el.querySelector(".seat-three").innerHTML = S.three && S.three.i === i ? `⚡ ${Math.min(3, S.three.n)}/3` : "";
  });
  // Hand der Person im Fokus
  const f = P[S.focus];
  const pr = S.prompt;
  if (f) {
    const hand = $("#s7-hand");
    const keep = [...hand.classList].filter((c) => c.startsWith("fx-"));
    hand.className = `s7-hand ${f.status} ${S.three && S.three.i === S.focus ? "three" : ""} ${f.flip7 ? "flip7" : ""} ${keep.join(" ")}`;
    hand.innerHTML = `
      <div class="s-head">${App.avatar(f.name, "big")}<div><b class="s-name">${esc(f.name)}</b><span class="muted small">${statusLabel[f.status]} · Gesamt ${f.total}</span></div>
        <div class="s-pts"><b>${roundScore(f)}</b><small>Runde</small></div></div>
      ${S.three && S.three.i === S.focus ? `<div class="hand-three">⚡ Dreierzug ${Math.min(3, S.three.n)}/3</div>` : ""}
      <div class="hand-cards">${cardsBlock(f, true)}</div>
      <div class="s-count">${[...Array(7)].map((_, k) => `<i class="${k < nums(f).length ? "on" : ""}"></i>`).join("")}<span>${nums(f).length}/7</span></div>`;
  }
  $("#s7-msg").innerHTML = S.msg || "&nbsp;";
  let actions = "";
  if (pr && pr.type === "turn") {
    actions = `<div class="s7-btns"><button class="btn btn-ghost big-choice" data-ch="stop">✋ Stopp<small>${roundScore(P[pr.who])} Punkte sichern</small></button>
      <button class="btn btn-primary big-choice" data-ch="more">🃏 Noch eine<small>${S.deck.length} im Stapel</small></button></div>`;
  } else if (pr && pr.type === "target") {
    actions = `<p class="s7-ask"><b>${esc(P[pr.from].name)}</b>: ${pr.verb}</p>
      <div class="chips center">${pr.opts.map((i) => `<button class="chip" data-t="${i}">${App.avatar(P[i].name)} ${esc(P[i].name)}${i === pr.from ? " (du)" : ""}</button>`).join("")}</div>`;
  }
  $("#s7-act").innerHTML = actions;
  App.on("[data-ch]", "click", (e, el) => pr.resolve(el.dataset.ch));
  App.on("[data-t]", "click", (e, el) => pr.resolve(+el.dataset.t));
  siebenPlaceSeats();
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
        <p class="muted small">📱 Tipp: Im Querformat liegt der Spieltisch links und deine Karten rechts.</p>
        <details class="rules-box"><summary>📖 Regeln & Karten</summary>
          <p><b>Ablauf:</b> Zuerst bekommt jede:r eine Karte. Dann wird reihum gefragt: <b>✋ Stopp</b> (aussteigen & Punkte sichern) oder <b>🃏 Noch eine</b>. Die Runde endet, wenn niemand mehr im Spiel ist oder jemand 7 verschiedene Zahlen hat.</p>
          <p><b>Zahlenkarten 0–12:</b> Je höher die Zahl, desto öfter ist sie im Stapel (12× die 12 … 1× die 1, eine 0). Doppelte Zahl = verzockt = 0 Punkte – die Karten werden umgedreht.</p>
          <p><b>Bonuskarten:</b> +2, +4, +6, +8, +10 kommen dazu, ×2 verdoppelt deine Zahlen (nicht die Boni, nicht die +15).</p>
          <p><b>❄️ Einfrieren:</b> Wähle jemanden (auch dich): Die Karten frieren ein, die Person steigt aus und sichert ihre Punkte.<br>
          <b>🛡️ Zweite Chance:</b> Ein goldenes Schild schützt dich einmal vor einer doppelten Zahl. Nur ein Schild pro Person – ein zweites musst du weitergeben.<br>
          <b>⚡ Dreierzug:</b> Wähle jemanden (auch dich), der 3 Karten nacheinander ziehen muss. Aktionen, die dabei gezogen werden, kommen erst danach dran.</p>
          <p><b>Stapel:</b> Benutzte Karten kommen auf die Ablage und erst zurück, wenn der Stapel komplett leer ist – merkt euch, was schon da war! 🧠</p>
        </details>
      </main>
      <div class="bottom-bar"><button class="btn btn-primary wide" id="start" ${n >= 2 && n <= 18 ? "" : "disabled"}>Spiel starten 🍀</button></div>`, { anim: false });
    App.on("[data-target]", "click", (e, el) => { S.target = +el.dataset.target; store.set("siebenSettings", S); draw(); });
    $("#start").onclick = () => {
      App.unlockAudio();
      Object.assign(Sieben, { players: App.players.map((name) => ({ name, total: 0, cards: [], bonus: [], sc: null, status: "active", flip7: false })),
        deck: siebenDeck(), discard: [], dealer: Math.floor(Math.random() * App.players.length), round: 1, rot: 0, focus: -1 });
      App.show("siebenPlay");
    };
  };
  draw();
};

App.screens.siebenPlay = () => {
  Sieben.token++; Sieben.prompt = null; Sieben.three = null;
  const tok = Sieben.token;
  App.onLeave(() => { if (Sieben.token === tok) Sieben.token++; Sieben.rotAnim++; document.body.classList.remove("s7-on"); });
  document.body.classList.add("s7-on");
  App.keepAwake();
  App.render(`
    <div class="s7" id="s7">
      <div class="s7-bar">
        <button class="icon-btn" data-go="siebenSetup" aria-label="Zurück">←</button>
        <b id="s7-round"></b><span class="muted small">🎯 ${Sieben.settings.target}</span>
      </div>
      <div class="s7-tablewrap"><div class="s7-table">
        <div class="felt"></div>
        <div class="s7-center">
          <div class="pile" id="s7-deck"><div class="fcard back"><span>🍀</span></div><div class="fcard back st"><span>🍀</span></div><em id="s7-deckn"></em></div>
          <div class="pile disc" id="s7-disc"><div class="disc-top"></div><em>🗑️ <span id="s7-discn"></span></em></div>
        </div>
        ${Sieben.players.map((p, i) => `<div class="seat" id="seat-${i}"><div class="seat-three"></div><div class="seat-head"></div><div class="seat-cards"></div></div>`).join("")}
      </div></div>
      <aside class="s7-panel">
        <div id="s7-hand" class="s7-hand"></div>
        <div id="s7-msg" class="s-msg"></div>
        <div id="s7-act"></div>
      </aside>
    </div>`);
  Sieben.rot = (Sieben.dealer + 1) % Sieben.players.length; Sieben.focus = -1;
  siebenRender();
  const onResize = () => siebenPlaceSeats();
  window.addEventListener("resize", onResize); App.onLeave(() => window.removeEventListener("resize", onResize));
  siebenRound().catch((e) => { if (e !== SIEBEN_ABORT) throw e; });
};

App.screens.siebenRoundEnd = () => {
  const S = Sieben;
  S.players.forEach((p) => { p.last = roundScore(p); p.lastStatus = p.status; p.lastFlip = p.flip7; p.total += p.last; });
  // Alle Karten der Runde auf die Ablage (sie werden erst gemischt, wenn der Stapel leer ist)
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
          <span class="muted small">${p.lastStatus === "busted" ? "💥 0" : (p.lastFlip ? "🍀 +" : p.lastStatus === "frozen" ? "❄️ +" : "+") + p.last}</span><b>${p.total}</b></div>`).join("")}
      </div>
      <p class="muted center small">🂠 ${S.deck.length} Karten im Stapel · 🗑️ ${S.discard.length} auf der Ablage</p>
      ${done
        ? `<button class="btn btn-primary wide" data-go="siebenSetup">🔁 Neues Spiel</button><button class="btn btn-ghost wide" data-go="home">🏠 Startseite</button>`
        : `<p class="muted center small">Als Nächstes gibt 🎩 ${esc(S.players[(S.dealer + 1) % S.players.length].name)}</p><button class="btn btn-primary wide" id="next">Nächste Runde ➡️</button>`}
    </main>`);
  if (done) App.confetti();
  else $("#next").onclick = () => { S.dealer = (S.dealer + 1) % S.players.length; S.round++; App.show("siebenPlay"); };
};
