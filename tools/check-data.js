// Prüft alle Spielinhalte auf Fehler. Ausführen mit: node tools/check-data.js
const path = require("path");
const packs = require(path.join(__dirname, "../js/data/draft-packs.js"));
const cats = require(path.join(__dirname, "../js/data/charades-words.js"));
const cards = require(path.join(__dirname, "../js/data/card-games.js"));
const bombCats = require(path.join(__dirname, "../js/data/bomb-categories.js"));

const errors = [];
const ids = new Set();

for (const p of packs) {
  const where = `Draft-Paket "${p.title}"`;
  if (ids.has(p.id)) errors.push(`${where}: doppelte id "${p.id}"`);
  ids.add(p.id);
  if (!p.emoji || !p.title || !p.color) errors.push(`${where}: emoji, title oder color fehlt`);
  if (!Array.isArray(p.slots) || p.slots.length < 3) errors.push(`${where}: braucht mindestens 3 Kategorien`);
  for (const s of p.slots || []) {
    if (!Array.isArray(s.options) || s.options.length < 2) { errors.push(`${where} / ${s.name}: braucht mindestens 2 Optionen`); continue; }
    for (const o of s.options) {
      if (o.length !== 3 || typeof o[2] !== "number" || o[2] < 0) errors.push(`${where} / ${s.name}: Option ${JSON.stringify(o)} muss [Emoji, Name, Preis] sein`);
    }
  }
  const nieten = (p.slots || []).flatMap((s) => s.options || []).filter((o) => o[2] === 0).length;
  if (nieten < 3) errors.push(`${where}: braucht mindestens 3 Nieten (Richtpreis 0) – hat ${nieten}`);
  const total = (p.slots || []).reduce((n, s) => n + (s.options || []).length, 0);
  if (total < 18) errors.push(`${where}: nur ${total} Dinge – für 6 Spieler:innen × 3 Felder braucht es mindestens 18`);
}

const catIds = new Set();
for (const c of cats) {
  if (catIds.has(c.id)) errors.push(`Scharade: doppelte Kategorie-id "${c.id}"`);
  catIds.add(c.id);
  if (!c.words || c.words.length < 10) errors.push(`Scharade "${c.name}": mindestens 10 Begriffe nötig`);
  const seen = new Set();
  for (const w of c.words || []) {
    if (seen.has(w)) errors.push(`Scharade "${c.name}": "${w}" ist doppelt`);
    seen.add(w);
  }
}

for (const [id, g] of Object.entries(cards)) {
  for (const lv of ["mild", "spicy"]) {
    const l = g.levels[lv];
    if (!l) { errors.push(`${g.title}: Stufe "${lv}" fehlt`); continue; }
    const lists = Array.isArray(l) ? { karten: l } : l;
    for (const [k, arr] of Object.entries(lists)) {
      if (!arr.length) errors.push(`${g.title} / ${lv} / ${k}: leer`);
    }
  }
}

const bombSeen = new Set();
for (const c of bombCats) {
  if (!Array.isArray(c) || c.length < 2 || !c[0] || !c[1]) errors.push(`Bombe: Kategorie ${JSON.stringify(c)} muss [Emoji, Name] sein`);
  if (bombSeen.has(c[1])) errors.push(`Bombe: "${c[1]}" ist doppelt`);
  bombSeen.add(c[1]);
}
if (bombCats.length < 20) errors.push("Bombe: mindestens 20 Kategorien nötig");

if (errors.length) {
  console.error("❌ Fehler gefunden:\n- " + errors.join("\n- "));
  process.exit(1);
}
const words = cats.reduce((n, c) => n + c.words.length, 0);
console.log(`✅ Alles gut: ${packs.length} Draft-Pakete, ${cats.length} Scharade-Kategorien (${words} Begriffe), ${Object.keys(cards).length} Kartenspiele, ${bombCats.length} Bomben-Kategorien.`);
