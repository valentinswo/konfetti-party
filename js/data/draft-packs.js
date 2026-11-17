// 💶 20€ Draft – Pakete
// Jedes Paket hat Kategorien (slots) mit Optionen: [Emoji, Name, Richtpreis in €].
// Im Spiel werden alle Optionen eines Pakets nacheinander versteigert (der Richtpreis wird nicht angezeigt).
// Regel: Ein Paket braucht mindestens 18 Dinge (6 Spieler:innen × 3 Felder)
// (wird von `node tools/check-data.js` geprüft).
// Neues Paket? Einfach unten anhängen und einen Pull Request aufmachen. 🙌

const DRAFT_PACKS = [
  {
    id: "urlaub", emoji: "🏖️", title: "Traumurlaub", color: "g-teal",
    slots: [
      { emoji: "📍", name: "Reiseziel", options: [["🏕️", "Campingplatz an der Ostsee", 2], ["🏔️", "Hütte in den Alpen", 4], ["🗽", "Roadtrip durch die USA", 6], ["🏝️", "Privatinsel auf den Malediven", 9]] },
      { emoji: "🛏️", name: "Unterkunft", options: [["⛺", "Zelt mit Loch", 1], ["🛏️", "Hostel-Schlafsaal mit 12 Betten", 2], ["🏨", "4-Sterne-Hotel mit Frühstück", 5], ["🏰", "Eigene Villa mit Pool", 8]] },
      { emoji: "🧳", name: "Anreise", options: [["🚌", "Fernbus, 19 Stunden", 1], ["🚗", "Mit dem Auto deiner Eltern", 3], ["✈️", "Business Class", 6], ["🚁", "Privater Helikopter", 8]] },
      { emoji: "👯", name: "Begleitung", options: [["🧓", "Deine Oma", 1], ["🐶", "Ein sehr guter Hund", 3], ["🫶", "Deine beste Freundin / dein bester Freund", 4], ["🌟", "Dein heimlicher Schwarm", 7]] },
      { emoji: "✨", name: "Extra", options: [["🧴", "Unbegrenzt Sonnencreme", 1], ["🍹", "All-inclusive-Bar", 4], ["📸", "Eigener Fotograf für Insta", 5], ["🐬", "Mit Delfinen schwimmen", 6]] },
    ],
  },
  {
    id: "superheld", emoji: "🦸", title: "Dein Superheld", color: "g-blue",
    slots: [
      { emoji: "⚡", name: "Superkraft", options: [["🐌", "Super-langsam laufen", 1], ["🅿️", "Findet immer einen Parkplatz", 3], ["🫥", "Unsichtbarkeit", 6], ["⏳", "Zeit anhalten", 9]] },
      { emoji: "🦹", name: "Kostüm", options: [["🛍️", "Ikea-Tüte als Umhang", 1], ["🩱", "Glitzer-Ganzkörperanzug", 3], ["🕶️", "Lederjacke & Sonnenbrille", 4], ["🦾", "Hightech-Rüstung", 7]] },
      { emoji: "🤝", name: "Sidekick", options: [["🐹", "Ein Hamster namens Kevin", 1], ["🦜", "Sprechender Papagei", 3], ["🤖", "KI-Roboter", 5], ["🐉", "Kleiner Drache", 8]] },
      { emoji: "🏎️", name: "Fahrzeug", options: [["🛴", "E-Scooter mit 12 % Akku", 1], ["🚲", "Tandem (du fährst allein)", 2], ["🏍️", "Turbo-Motorrad", 5], ["🛸", "Unsichtbares Raumschiff", 8]] },
      { emoji: "💔", name: "Schwäche", options: [["💤", "Schläft jeden Tag um 21 Uhr ein", 1], ["🐝", "Panische Angst vor Bienen", 2], ["🍫", "Wird bei Schokolade schwach", 4], ["😇", "Gar keine Schwäche", 7]] },
    ],
  },
  {
    id: "zombie", emoji: "🧟", title: "Zombie-Apokalypse", color: "g-green",
    slots: [
      { emoji: "🗡️", name: "Waffe", options: [["🥄", "Ein Holzlöffel", 1], ["🍳", "Bratpfanne", 3], ["🏏", "Baseballschläger", 5], ["⚔️", "Katana", 8]] },
      { emoji: "🏚️", name: "Versteck", options: [["🚽", "Dixi-Klo", 1], ["🏫", "Deine alte Schule", 3], ["🛍️", "Riesiges Einkaufszentrum", 5], ["🏰", "Mittelalterliche Burg", 8]] },
      { emoji: "🚙", name: "Fahrzeug", options: [["🛒", "Einkaufswagen", 1], ["🚐", "Alter VW-Bus", 3], ["🚜", "Traktor", 4], ["🪖", "Panzer", 9]] },
      { emoji: "🧑‍🤝‍🧑", name: "Teammitglied", options: [["🗯️", "Jemand, der nur redet", 1], ["🧑‍🍳", "Sternekoch", 4], ["🩺", "Ärztin", 6], ["🎖️", "Ex-Elitesoldat", 8]] },
      { emoji: "🥫", name: "Vorrat", options: [["🍬", "Eine Tüte Gummibärchen", 1], ["🥫", "Dosenravioli für einen Monat", 3], ["💧", "Wasserfilter", 5], ["🌱", "Eigener Gemüsegarten", 6]] },
    ],
  },
  {
    id: "abend", emoji: "🍕", title: "Der perfekte Abend", color: "g-orange",
    slots: [
      { emoji: "🍽️", name: "Essen", options: [["🍜", "Instant-Nudeln", 1], ["🌯", "Döner vom Lieblingsladen", 3], ["🍣", "All-you-can-eat-Sushi", 5], ["🥩", "5-Gänge-Menü vom Sternekoch", 8]] },
      { emoji: "🥤", name: "Getränk", options: [["🚰", "Leitungswasser", 1], ["🧉", "Eiskalte Mate", 2], ["🍾", "Sekt", 4], ["🥂", "Champagner ohne Ende", 7]] },
      { emoji: "📍", name: "Location", options: [["🛋️", "Dein Sofa", 1], ["🌇", "Dachterrasse über der Stadt", 5], ["🎡", "Riesenrad-Gondel nur für euch", 6], ["🏖️", "Privatstrand bei Sonnenuntergang", 7]] },
      { emoji: "🎯", name: "Aktivität", options: [["📺", "Serie bingen", 1], ["🎲", "Spieleabend", 2], ["🎤", "Karaoke", 4], ["🎢", "Freizeitpark nachts nur für euch", 8]] },
      { emoji: "🎶", name: "Musik", options: [["📻", "Radio mit Werbung", 1], ["🎧", "Deine Lieblingsplaylist", 3], ["🎻", "Live-Streichquartett", 5], ["🎸", "Deine Lieblingsband spielt privat", 9]] },
    ],
  },
  {
    id: "wg", emoji: "🏠", title: "Traum-WG", color: "g-pink",
    slots: [
      { emoji: "🧑", name: "Mitbewohner:in", options: [["🧦", "Lässt überall Socken liegen", 1], ["🎮", "Zockt nachts laut", 2], ["🧹", "Putz-Profi", 5], ["🧑‍🍳", "Kocht jeden Abend für alle", 7]] },
      { emoji: "🗺️", name: "Lage", options: [["🌾", "Dorf, Bus fährt zweimal am Tag", 1], ["🏘️", "Vorort", 3], ["🏙️", "Mitten in der Innenstadt", 6], ["🌊", "Direkt am See", 7]] },
      { emoji: "🚪", name: "Zimmer", options: [["📦", "Abstellkammer, 6 m²", 1], ["🛏️", "Normales Zimmer", 3], ["🛁", "Mit eigenem Bad", 5], ["🏙️", "Loft mit Dachterrasse", 8]] },
      { emoji: "🐾", name: "Haustier", options: [["🪳", "Die WG-Kakerlake Günther", 1], ["🐟", "Goldfisch", 2], ["🐱", "Verschmuste Katze", 4], ["🦙", "Ein Alpaka im Garten", 6]] },
      { emoji: "✨", name: "Extra", options: [["📶", "WLAN, das nur im Flur geht", 1], ["🧺", "Eigene Waschmaschine", 2], ["🧖", "Sauna im Keller", 5], ["🍺", "Zapfanlage in der Küche", 6]] },
    ],
  },
  {
    id: "party", emoji: "🎉", title: "Die ultimative Party", color: "g-purple",
    slots: [
      { emoji: "📍", name: "Location", options: [["🏚️", "Garage deiner Eltern", 1], ["🏡", "Garten mit Lichterketten", 3], ["🛥️", "Yacht", 7], ["🏯", "Ein Schloss", 8]] },
      { emoji: "🎵", name: "Musik", options: [["🔊", "Bluetooth-Box mit Wackelkontakt", 1], ["🎶", "Jemand mit Premium-Account", 2], ["🎧", "Professioneller DJ", 5], ["🎤", "Live-Auftritt eines Weltstars", 9]] },
      { emoji: "🍔", name: "Essen", options: [["🥨", "Salzstangen", 1], ["🌭", "Grill mit Würstchen", 3], ["🍔", "Burger-Truck", 5], ["🍫", "Schokobrunnen & Fingerfood", 6]] },
      { emoji: "👥", name: "Gäste", options: [["🫥", "Nur Leute, die du nicht kennst", 1], ["🧑‍🤝‍🧑", "Deine engsten Freunde", 4], ["🕺", "Die ganze Stadt", 5], ["⭐", "Freunde plus ein paar Promis", 8]] },
      { emoji: "🎆", name: "Special", options: [["🎈", "Luftballons", 1], ["🫧", "Schaumparty", 4], ["🎆", "Feuerwerk", 5], ["🦄", "Einhorn-Reiten (echt!)", 7]] },
    ],
  },
  {
    id: "weltraum", emoji: "🚀", title: "Weltraum-Mission", color: "g-night",
    slots: [
      { emoji: "🛰️", name: "Raumschiff", options: [["🧺", "Umgebaute Waschmaschine", 1], ["🚀", "Gebrauchte Rakete", 4], ["🛰️", "Moderne Raumstation", 6], ["🛸", "Alien-Schiff mit Warp-Antrieb", 9]] },
      { emoji: "👩‍🚀", name: "Crew", options: [["🐒", "Ein Affe", 1], ["🧑‍🎓", "Praktikant:in", 2], ["👩‍🚀", "Erfahrene Astronautin", 6], ["🧠", "Genie-Wissenschaftler", 7]] },
      { emoji: "🎯", name: "Ziel", options: [["🌙", "Mond", 2], ["🔴", "Mars", 4], ["🪐", "Saturnringe", 6], ["🌌", "Eine andere Galaxie", 8]] },
      { emoji: "🍱", name: "Proviant", options: [["💊", "Essen in Tablettenform", 1], ["🥫", "Dosensuppe", 2], ["🍕", "Pizza-Automat", 5], ["🖨️", "3D-Drucker für jedes Essen", 7]] },
      { emoji: "🔧", name: "Gadget", options: [["🔦", "Taschenlampe", 1], ["📡", "Funkgerät nach Hause", 3], ["🔫", "Laser-Pistole", 5], ["🌀", "Teleporter", 8]] },
    ],
  },
  {
    id: "fussball", emoji: "⚽", title: "Chaos-Fußballteam", color: "g-lime",
    slots: [
      { emoji: "🧤", name: "Torwart", options: [["📦", "Mauer aus Umzugskartons", 1], ["👨‍🏫", "Dein alter Sportlehrer", 3], ["🦍", "Ein Gorilla", 5], ["🐙", "Krake mit 8 Armen", 7]] },
      { emoji: "🛡️", name: "Abwehr", options: [["👵", "Rentner-Gang", 1], ["🌳", "Ein Baum", 2], ["🦏", "Nashorn", 5], ["🐘", "Elefant", 6]] },
      { emoji: "🎯", name: "Sturm", options: [["🐌", "Schnecke", 1], ["🏃", "Der Dorf-Torjäger", 3], ["🐆", "Gepard", 7], ["🚀", "Mensch mit Raketenschuhen", 8]] },
      { emoji: "📋", name: "Trainer", options: [["📺", "Typ vom Sofa, der alles besser weiß", 1], ["👴", "Opa mit Taktiktafel", 3], ["🧙", "Ein Zauberer", 6], ["🤖", "Taktik-KI", 7]] },
      { emoji: "📣", name: "Fans", options: [["🦗", "Zirpende Grillen", 1], ["🗣️", "Drei laute Väter", 2], ["🎺", "Blaskapelle", 4], ["🏟️", "Volles Stadion", 6]] },
    ],
  },
  {
    id: "insel", emoji: "🏝️", title: "Einsame Insel", color: "g-yellow",
    slots: [
      { emoji: "🌴", name: "Insel", options: [["🪨", "Felsen mit einer Palme", 1], ["🏝️", "Kleine Sandinsel", 3], ["🌋", "Vulkaninsel mit heißen Quellen", 5], ["🏞️", "Paradies mit Wasserfall", 7]] },
      { emoji: "🧑", name: "Begleitung", options: [["🏐", "Ein Volleyball mit Gesicht", 1], ["🐒", "Ein Affe", 3], ["🧑‍🔧", "Handwerker:in", 6], ["🗺️", "Überlebensexpertin", 8]] },
      { emoji: "🎒", name: "Gegenstand", options: [["🪥", "Zahnbürste", 1], ["⛺", "Zelt", 3], ["🔪", "Taschenmesser", 4], ["🛶", "Schlauchboot", 8]] },
      { emoji: "🍽️", name: "Essen", options: [["🥥", "Nur Kokosnüsse", 1], ["🎣", "Angel & Fische", 3], ["🍫", "100 Tafeln Schokolade", 4], ["🛵", "Lieferdienst (er kommt wirklich!)", 8]] },
      { emoji: "🎮", name: "Unterhaltung", options: [["🪨", "Ein schöner Stein", 1], ["📖", "Ein dickes Buch", 2], ["🎸", "Gitarre", 4], ["📱", "Handy mit Netz & Ladegerät", 9]] },
    ],
  },
];

if (typeof module !== "undefined") module.exports = DRAFT_PACKS;
