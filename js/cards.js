// 🃏 Kartenspiele: Wer würde eher? · Ich hab noch nie · Wahrheit oder Pflicht

const LEVELS = [
  { id: "mild", emoji: "😇", name: "Harmlos" },
  { id: "spicy", emoji: "🌶️", name: "Spicy" },
  { id: "both", emoji: "🔀", name: "Beides" },
];

const Cards = {
  game: null, id: null, level: "mild", deck: [], turn: 0, used: { truth: [], dare: [] },
  levelIds() { return this.level === "both" ? ["mild", "spicy"] : [this.level]; },
  draw(list, key) {
    // Zieht ohne Wiederholung, bis der Stapel leer ist
    if (!this.used[key] || !this.used[key].length) this.used[key] = shuffle(list);
    return this.used[key].pop();
  },
};

App.screens.cards = (id) => {
  const game = CARD_GAMES[id];
  Cards.game = game; Cards.id = id;
  Cards.level = store.get("level:" + id, "mild");
  const draw = () => {
    App.render(`
      ${topbar(`${game.emoji} ${game.title}`)}
      <main class="wrap center">
        <div class="hero ${game.color}"><span>${game.emoji}</span></div>
        <p class="lead">${game.intro}</p>
        ${id === "wop" && App.players.length < 2 ? `<div class="notice">👥 Mit Spielernamen macht's mehr Spaß!<button class="btn btn-small btn-primary" data-go="players">Hinzufügen</button></div>` : ""}
        <h3 class="section">Stufe</h3>
        <div class="chips center">${LEVELS.map((l) => `<button class="chip ${l.id === Cards.level ? "on" : ""}" data-lv="${l.id}">${l.emoji} ${l.name}</button>`).join("")}</div>
        <button class="btn btn-primary wide" id="go">Los geht's 🎉</button>
      </main>`, { anim: false });
    App.on("[data-lv]", "click", (e, el) => { Cards.level = el.dataset.lv; store.set("level:" + id, Cards.level); draw(); });
    $("#go").onclick = () => {
      Cards.used = {};
      Cards.turn = 0;
      App.show(id === "wop" ? "wopTurn" : "cardPlay");
    };
  };
  draw();
};

// Wer würde eher? / Ich hab noch nie
App.screens.cardPlay = () => {
  const game = Cards.game;
  const list = Cards.levelIds().flatMap((lv) => game.levels[lv]);
  let count = 0;
  App.render(`
    ${topbar(`${game.emoji} ${game.title}`, "home")}
    <main class="wrap center">
      <button class="prompt-card ${game.color}" id="card"></button>
      <p class="muted small" id="cnt"></p>
      <button class="btn btn-primary wide" id="next">Nächste Karte ➡️</button>
    </main>`);
  const next = () => {
    count++;
    $("#card").innerHTML = `<span class="card-emoji">${game.emoji}</span><span class="card-text">${esc(App.fill(Cards.draw(list, "main")))}</span>`;
    $("#card").classList.remove("pop"); void $("#card").offsetWidth; $("#card").classList.add("pop");
    $("#cnt").textContent = `Karte ${count} · ${list.length} im Stapel`;
  };
  $("#next").onclick = next;
  $("#card").onclick = next;
  next();
};

// Wahrheit oder Pflicht
const wopPlayer = () => App.players.length ? App.players[Cards.turn % App.players.length] : null;

App.screens.wopTurn = () => {
  const name = wopPlayer();
  App.render(`
    ${topbar("🔥 Wahrheit oder Pflicht", "home")}
    <main class="wrap center">
      <div class="big-emoji">🫵</div>
      <h1 class="name">${name ? esc(name) : "Du"}</h1>
      <p class="lead">${name ? "ist dran! Was nimmst du?" : "bist dran! Was nimmst du?"}</p>
      <div class="choice">
        <button class="tile g-blue" data-kind="truth"><span class="tile-emoji">💬</span><span class="tile-title">Wahrheit</span></button>
        <button class="tile g-red" data-kind="dare"><span class="tile-emoji">💪</span><span class="tile-title">Pflicht</span></button>
      </div>
      <button class="link" data-kind="random">🎲 Zufall entscheidet</button>
    </main>`);
  App.on("[data-kind]", "click", (e, el) => {
    const kind = el.dataset.kind === "random" ? pick(["truth", "dare"]) : el.dataset.kind;
    App.show("wopCard", kind);
  });
};

App.screens.wopCard = (kind) => {
  const name = wopPlayer();
  const list = Cards.levelIds().flatMap((lv) => Cards.game.levels[lv][kind]);
  const text = App.fill(Cards.draw(list, kind), name);
  App.render(`
    ${topbar("🔥 Wahrheit oder Pflicht", "home")}
    <main class="wrap center">
      <p class="muted">${name ? esc(name) + " · " : ""}${kind === "truth" ? "💬 Wahrheit" : "💪 Pflicht"}</p>
      <div class="prompt-card ${kind === "truth" ? "g-blue" : "g-red"} pop">
        <span class="card-emoji">${kind === "truth" ? "💬" : "💪"}</span>
        <span class="card-text">${esc(text)}</span>
      </div>
      <button class="btn btn-primary wide" id="done">Erledigt ✅ – nächste Person</button>
      <button class="btn btn-ghost wide" id="chicken">🐔 Kneifen</button>
    </main>`);
  const next = () => { Cards.turn++; App.show("wopTurn"); };
  $("#done").onclick = next;
  $("#chicken").onclick = next;
};
