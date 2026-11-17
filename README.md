# 🎉 Konfetti – Partyspiele fürs Handy

Eine kleine Web-App für Partyabende, ganz ohne Installation, ohne Anmeldung und ohne Werbung. Einfach im Browser öffnen und optional über „Zum Home-Bildschirm“ wie eine App speichern.

## Spiele

| | Spiel | So geht's |
|---|---|---|
| 💶 | **20€ Draft** | Auktion: Jede:r hat 20 € und 3 Felder. Die Dinge eines Pakets werden reihum versteigert (mit Plus/Minus, Bieten, Passen oder Überspringen). Zum Schluss wird abgestimmt, wer das beste Team hat. 13 Pakete mit 32–84 Dingen (u. a. das perfekte Leben, der perfekte Garten, das perfekte Stadion, der perfekte Fußballspieler) |
| 🎭 | **Scharade** | Wie Heads-Up: Handy an die Stirn, nach vorne kippen heißt erraten, nach hinten kippen heißt überspringen (Tippen geht auch). Modi: Pantomime, Erklären, Zeichnen, Geräusche oder gemischt. 18 Kategorien mit ca. 500 Begriffen |
| 💣 | **Tickende Bombe** | Reihum etwas zur Kategorie sagen und das Handy weitergeben, bis es knallt. Die Zeit ist geheim, das Ticken wird immer schneller. Mit Leben und optionalem Anfangsbuchstaben. 80 Kategorien |
| 🤔 | **Wer würde eher?** | Frage vorlesen, auf 3 zeigen alle gleichzeitig auf eine Person |
| 🙈 | **Ich hab noch nie** | Wer's schon gemacht hat, muss es zugeben |
| 🔥 | **Wahrheit oder Pflicht** | Reihum mit euren Namen, 😇 harmlos oder 🌶️ spicy |

## Neue Inhalte hinzufügen ✍️

Alle Inhalte stehen in einfachen Listen. Für neue Inhalte musst du keinen Code anfassen:

- **Draft-Pakete:** `js/data/draft-packs.js` (5 Kategorien × 4 Optionen `[Emoji, Name, Preis]`)
- **Scharade-Begriffe:** `js/data/charades-words.js`
- **Bomben-Kategorien:** `js/data/bomb-categories.js`
- **Fragen & Aufgaben:** `js/data/card-games.js` (`{name}` wird durch eine zufällige Person ersetzt)

Danach `node tools/check-data.js` ausführen. Das Skript prüft zum Beispiel, ob jedes Draft-Paket mit 20 € überhaupt spielbar ist.

## Workflow mit Pull Requests 🔁

1. Neuen Branch anlegen, Änderung machen und einen Pull Request öffnen.
2. GitHub prüft die Inhalte automatisch (Workflow „Inhalte prüfen“).
3. Netlify baut für jeden PR eine eigene Vorschau-URL (Deploy Preview). Die steht als Kommentar im PR und lässt sich direkt am Handy testen.
4. Nach dem Merge in `main` veröffentlicht Netlify die neue Version automatisch.

## Lokal starten

Einfach `index.html` im Browser öffnen. Alternativ mit `npx serve .` starten.

## Aufbau

```
index.html            Einstieg
css/style.css         Design
js/app.js             Navigation, Spieler:innen, Startseite
js/draft.js           20€ Draft
js/charades.js        Scharade
js/cards.js           Wer würde eher? / Ich hab noch nie / Wahrheit oder Pflicht
js/bomb.js            Tickende Bombe
js/data/*.js          Alle Inhalte
tools/check-data.js   Inhalts-Check (läuft auch in GitHub Actions & Netlify)
```

Ein eigenes, privates Projekt. Es ist inspiriert von typischen Partyspiel-Apps, aber alle Texte und das Design sind selbst gemacht.
