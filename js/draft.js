// 💶 20€ Draft – Auktion
// Jede:r hat 20 € und 3 freie Felder. Die Dinge eines Pakets werden nacheinander versteigert.
// Reihum wird geboten (mind. 1 €). Wer passt, ist für dieses Ding raus. Das Höchstgebot gewinnt.
// Man muss sich immer noch 1 € pro freiem Feld aufheben → Höchstgebot am Anfang: 18 €.

const BUDGET = 20;
const SLOTS = 3;
const MAX_PLAYERS = 6;
const Draft = { packIdx: 0, items: [], idx: 0, players: [], round: 0, auction: null, wins: {}, played: new Set() };

const slotsLeft = (p) => SLOTS - p.items.length;
const maxBid = (p) => p.money - (slotsLeft(p) - 1); // 1 € pro weiterem Feld zurückhalten
const minBid = () => (Draft.auction.high || 0) + 1;
const canBid = (p) => slotsLeft(p) > 0 && maxBid(p) >= minBid();
const openSlots = () => Draft.players.reduce((n, p) => n + slotsLeft(p), 0);
const itemsLeft = () => Draft.items.length - Draft.idx; // inkl. aktuellem Ding
const scarce = () => itemsLeft() <= openSlots();
// 🧩 Übersicht: pro Person eine Zeile mit 3 Feldern (bei 3 Leuten = 3×3-Feld)
const draftBoard = (reveal = false) => {
  const A = Draft.auction;
  return `<div class="board">
    ${Draft.players.map((p, i) => {
      const cls = reveal || !A ? "" : [
        i === A.turn ? "active" : "",
        i === A.highBy ? "lead" : "",
        A.passed.has(i) || (!canBid(p) && i !== A.highBy) ? "out" : "",
      ].join(" ");
      return `<div class="board-row ${cls}">
        <div class="board-name">${App.avatar(p.name)}<b>${esc(p.name)}</b><span>💶 ${p.money} €</span>${!reveal && A && i === A.highBy ? `<span class="lead-tag">🔨 ${A.high} €</span>` : ""}</div>
        ${Array.from({ length: SLOTS }, (_, k) => {
          const it = p.items[k];
          return it
            ? `<div class="cell filled"><span class="cell-e">${it.e}</span><span class="cell-n">${esc(it.n)}</span><span class="price">${it.price} €</span></div>`
            : `<div class="cell empty"><span>＋</span></div>`;
        }).join("")}
      </div>`;
    }).join("")}
  </div>`;
};

const dots = (p) => "●".repeat(p.items.length) + "○".repeat(slotsLeft(p));

App.screens.draftSetup = () => {
  const n = App.players.length;
  const ok = n >= 2 && n <= MAX_PLAYERS;
  App.render(`
    ${topbar("💶 20€ Draft")}
    <main class="wrap">
      <p class="lead">Jede:r hat <b>20 €</b> und <b>3 Felder</b>. Die Dinge werden reihum <b>versteigert</b> – wer am meisten bietet, bekommt's. Am Ende stimmt ihr ab, wer das beste Team hat! 🏆</p>
      ${ok ? "" : `<div class="notice">👥 ${n < 2 ? "Ihr braucht mindestens 2 Spieler:innen." : `Maximal ${MAX_PLAYERS} Spieler:innen pro Draft.`}<button class="btn btn-small btn-primary" data-go="players">Spieler:innen</button></div>`}
      <h3 class="section">Paket wählen</h3>
      <div class="grid">
        <button class="tile g-rainbow pack" data-pack="-1" ${ok ? "" : "disabled"}>
          <span class="tile-emoji">🎲</span><span class="tile-title">Zufall</span>
        </button>
        ${DRAFT_PACKS.map((p, i) => `
          <button class="tile ${p.color} pack" data-pack="${i}" ${ok ? "" : "disabled"}>
            <span class="tile-emoji">${p.emoji}</span><span class="tile-title">${esc(p.title)}</span>
            ${Draft.played.has(i) ? `<span class="badge">✓ gespielt</span>` : ""}
          </button>`).join("")}
      </div>
    </main>`);
  App.on(".pack", "click", (e, el) => {
    let i = +el.dataset.pack;
    if (i < 0) {
      const all = DRAFT_PACKS.map((_, k) => k);
      const fresh = all.filter((k) => !Draft.played.has(k));
      i = pick(fresh.length ? fresh : all);
    }
    App.show("draftIntro", i);
  });
};

App.screens.draftIntro = (i) => {
  const pack = DRAFT_PACKS[i];
  Draft.packIdx = i;
  Draft.items = shuffle(pack.slots.flatMap((s) => s.options.map(([e, n]) => ({ e, n, cat: s }))));
  Draft.idx = 0;
  Draft.round = 0;
  Draft.players = shuffle(App.players).map((name) => ({ name, money: BUDGET, items: [] }));
  App.render(`
    ${topbar("💶 20€ Draft", "draftSetup")}
    <main class="wrap center">
      <div class="hero ${pack.color}"><span>${pack.emoji}</span></div>
      <h1>${esc(pack.title)}</h1>
      <div class="rules">
        <div>💶 Jede:r startet mit <b>20 €</b></div>
        <div>🧩 Jede:r braucht genau <b>3 Dinge</b></div>
        <div>🔨 Reihum bieten, Mindestgebot <b>1 €</b></div>
        <div>🙅 Wer passt, ist für dieses Ding raus</div>
        <div>🔒 Pro freiem Feld bleibt 1 € reserviert → max. <b>18 €</b> fürs erste Ding</div>
        <div>⏭️ Ein Ding kann auch übersprungen werden</div>
      </div>
      <p class="muted">Startreihenfolge: ${Draft.players.map((p) => esc(p.name)).join(" → ")}</p>
      <button class="btn btn-primary wide" id="go">Auktion starten 🔨</button>
    </main>`);
  $("#go").onclick = () => App.show("draftNext");
};

// Nächstes Ding aufrufen (oder Spielende)
App.screens.draftNext = () => {
  if (Draft.players.every((p) => slotsLeft(p) === 0) || Draft.idx >= Draft.items.length) return App.show("draftReveal");
  const n = Draft.players.length;
  Draft.auction = { item: Draft.items[Draft.idx], high: 0, highBy: -1, passed: new Set(), turn: -1, value: 1 };
  // Wer startet, wechselt mit jedem Ding
  const start = Draft.round++ % n;
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    if (canBid(Draft.players[i])) { Draft.auction.turn = i; break; }
  }
  Draft.auction.value = minBid();
  App.show("draftAuction");
};

const draftAdvance = () => {
  const A = Draft.auction, n = Draft.players.length;
  for (let k = 1; k <= n; k++) {
    const i = (A.turn + k) % n;
    if (i !== A.highBy && !A.passed.has(i) && canBid(Draft.players[i])) {
      A.turn = i;
      A.value = minBid();
      return App.show("draftAuction", { anim: false });
    }
  }
  draftResolve();
};

const draftResolve = () => {
  const A = Draft.auction;
  if (A.highBy >= 0) return App.show("draftSold", A.highBy, A.high, false);
  if (scarce()) {
    // Es gibt nicht mehr genug Dinge, um alle Felder zu füllen → Restposten für 1 €
    const cand = Draft.players.map((p, i) => ({ p, i })).filter(({ p }) => slotsLeft(p) > 0)
      .sort((a, b) => b.p.money - a.p.money)[0];
    return App.show("draftSold", cand.i, 1, true);
  }
  App.show("draftSold", -1, 0, false);
};

App.screens.draftAuction = ({ anim = true } = {}) => {
  const A = Draft.auction, pack = DRAFT_PACKS[Draft.packIdx];
  const me = Draft.players[A.turn];
  const lo = minBid(), hi = maxBid(me);
  A.value = Math.min(Math.max(A.value, lo), hi);
  const canSkip = A.high === 0 && !scarce();

  App.render(`
    ${topbar(`${pack.emoji} Ding ${Draft.idx + 1}`, "draftSetup")}
    <main class="wrap center">
      <div class="auction-item ${pack.color}">
        <span class="cat">${A.item.cat.emoji} ${esc(A.item.cat.name)}</span>
        <span class="auction-emoji">${A.item.e}</span>
        <span class="auction-name">${esc(A.item.n)}</span>
      </div>
      <div class="high">${A.highBy >= 0
        ? `🔨 Höchstgebot: <b>${A.high} €</b> von <b>${esc(Draft.players[A.highBy].name)}</b>`
        : `Noch kein Gebot`}</div>

      <div class="turn">
        <p class="muted">Am Zug</p>
        <h2 class="name">${App.avatar(me.name, "big")} ${esc(me.name)}</h2>
        <p class="muted small">💶 ${me.money} € · ${dots(me)} · max. ${hi} € möglich</p>
      </div>

      <div class="stepper">
        <button class="step" id="minus" ${A.value <= lo ? "disabled" : ""}>−</button>
        <div class="step-val"><span id="val">${A.value}</span> €</div>
        <button class="step" id="plus" ${A.value >= hi ? "disabled" : ""}>＋</button>
      </div>
      <div class="bid-btns">
        <button class="btn btn-ghost" id="pass">🙅 Passen</button>
        <button class="btn btn-primary" id="bid">🔨 Bieten</button>
      </div>
      ${canSkip ? `<button class="link" id="skip">⏭️ Ding überspringen – niemand bekommt's</button>` : ""}

      ${draftBoard()}
    </main>`, { anim });

  const setVal = (v) => {
    A.value = Math.min(Math.max(v, lo), hi);
    $("#val").textContent = A.value;
    $("#minus").disabled = A.value <= lo;
    $("#plus").disabled = A.value >= hi;
    App.vibrate(10);
  };
  $("#minus").onclick = () => setVal(A.value - 1);
  $("#plus").onclick = () => setVal(A.value + 1);
  $("#bid").onclick = () => { A.high = A.value; A.highBy = A.turn; App.vibrate(25); draftAdvance(); };
  $("#pass").onclick = () => { A.passed.add(A.turn); draftAdvance(); };
  if (canSkip) $("#skip").onclick = () => App.show("draftSold", -1, 0, false);
};

App.screens.draftSold = (winner, price, forced) => {
  const A = Draft.auction;
  Draft.idx++;
  if (winner >= 0) {
    const p = Draft.players[winner];
    p.money -= price;
    p.items.push({ ...A.item, price });
  }
  App.render(`
    <main class="wrap center">
      <div class="big-emoji bounce">${winner >= 0 ? "🔨" : "🗑️"}</div>
      <p class="lead">${A.item.e} <b>${esc(A.item.n)}</b></p>
      ${winner >= 0
        ? `<p class="muted">${forced ? "Restposten 🛒 geht automatisch an" : "Verkauft an"}</p>
           <h1 class="name">${App.avatar(Draft.players[winner].name, "big")} ${esc(Draft.players[winner].name)}</h1>
           <p class="lead">für <b>${price} €</b></p>`
        : `<h1 class="name">Niemand!</h1><p class="muted">Das Ding fliegt raus.</p>`}
      ${draftBoard(true)}
      <button class="btn btn-primary wide" id="go">Weiter ➡️</button>
    </main>`);
  if (winner >= 0) App.vibrate([40, 60, 40]);
  $("#go").onclick = () => App.show("draftNext");
};

App.screens.draftReveal = () => {
  const pack = DRAFT_PACKS[Draft.packIdx];
  App.render(`
    ${topbar(`${pack.emoji} Die Teams`, "draftSetup")}
    <main class="wrap">
      <p class="lead center">Jede:r stellt sein Team vor und verteidigt es! 🗣️</p>
      ${draftBoard(true)}
      <h3 class="section center">🗳️ Wer hat das beste Team?</h3>
      <div class="vote">
        ${Draft.players.map((t, i) => `<button class="btn btn-ghost" data-win="${i}">🏆 ${App.avatar(t.name)} ${esc(t.name)}</button>`).join("")}
      </div>
    </main>`);
  App.on("[data-win]", "click", (e, el) => App.show("draftWinner", Draft.players[+el.dataset.win].name));
};

App.screens.draftWinner = (name) => {
  Draft.wins[name] = (Draft.wins[name] || 0) + 1;
  Draft.played.add(Draft.packIdx);
  const board = Object.entries(Draft.wins).sort((a, b) => b[1] - a[1]);
  App.render(`
    <main class="wrap center">
      <div class="big-emoji bounce">🏆</div>
      <p class="muted">Gewinner:in der Runde</p>
      <h1 class="name">${App.avatar(name, "big")} ${esc(name)}</h1>
      <div class="scoreboard">
        ${board.map(([n, w], i) => `<div class="score-row"><span>${["🥇", "🥈", "🥉"][i] || "🎖️"} ${esc(n)}</span><b>${w}</b></div>`).join("")}
      </div>
      <button class="btn btn-primary wide" data-go="draftSetup">🔁 Nächstes Paket</button>
      <button class="btn btn-ghost wide" data-go="home">🏠 Startseite</button>
    </main>`);
  App.confetti();
};
