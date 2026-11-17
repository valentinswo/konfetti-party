# Konfetti – Kontext für Claude

Private Partyspiel-Web-App (Deutsch, mobil zuerst). Reines HTML/CSS/JS ohne Build-Schritt und ohne Framework. Gehostet auf Netlify, Updates nur über Pull Requests (Netlify erstellt für jeden PR eine Deploy-Preview).

## Spiele & Regeln (so vom Owner gewünscht)

- **💶 20€ Draft (Auktion)**: Jede:r hat 20 € und genau 3 Felder. Die Dinge eines Pakets werden einzeln versteigert. Es wird reihum geboten, und der Startspieler wechselt mit jedem Ding. Bedienung: Stepper mit ＋/−, dann „Bieten“ oder „Passen“. Mindestgebot 1 €. Pro freiem weiterem Feld bleibt 1 € reserviert, das Höchstgebot am Anfang ist also 18 €. Ein Ding kann übersprungen werden, solange noch niemand geboten hat. Spielfeld: eine Zeile pro Person mit 3 Feldern (2 Leute = 2×3, 3 Leute = 3×3). Am Ende stimmt die Gruppe über das beste Team ab. Maximal 6 Spieler:innen. Werden die Dinge knapp und alle passen, geht ein „Restposten“ für 1 € an die Person mit dem meisten Geld.
- **🎭 Scharade**: Wie Heads-Up. Die ratende Person hält das Handy an die Stirn. Nach vorne kippen = erraten, nach hinten kippen = überspringen (über `deviceorientation`, Display-Normale `cos(beta)·cos(gamma)`). Zwischen zwei Aktionen muss das Handy wieder gerade gehalten werden. Tippen bleibt als Alternative. Modi: Pantomime, Erklären, Zeichnen, Geräusche, Gemischt. Spielt in 2–4 Teams mit Timer.
- **🤔 Wer würde eher?**, **🙈 Ich hab noch nie**, **🔥 Wahrheit oder Pflicht**: Stufen 😇 mild und 🌶️ spicy (spicy bleibt jugendfrei-frech, nicht explizit).

## Design

Dunkler Hintergrund, bunte Verlaufs-Kacheln, große abgerundete Buttons, überall Emojis. Die App ist an Splash angelehnt, übernimmt aber **keine** Texte, Logos oder Assets von Splash. Alle Inhalte sind selbst geschrieben.

## Aufbau

- `js/app.js`: Navigation (`App.show(screen, ...args)`, `App.render`), Spielerliste, Startseite (`GAMES`)
- `js/draft.js`, `js/charades.js`, `js/cards.js`: je ein Spiel
- `js/data/*.js`: alle Inhalte als einfache Listen
- `tools/check-data.js`: Inhalts-Check. Läuft in der GitHub Action „Inhalte prüfen“ und als Netlify-Build-Befehl.

## Arbeitsweise

- Für jede Änderung einen neuen Branch anlegen und einen PR auf `main` öffnen. Nicht direkt auf `main` pushen.
- Vor dem PR `node tools/check-data.js` und `node --check` für die JS-Dateien ausführen. Wenn möglich, im Handy-Viewport (390×844) im Browser durchklicken.
- Neues Spiel: Screen-Funktionen `App.screens.xyz` anlegen, die Kachel in `GAMES` eintragen und das Script in `index.html` einbinden.
