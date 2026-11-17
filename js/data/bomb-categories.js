// 💣 Tickende Bombe – Kategorien
// Reihum muss jede:r etwas aus der Kategorie sagen und das Handy weitergeben.
// Neue Kategorie? [Emoji, Name] anhängen → Pull Request. 🙌
// letter: false = passt nicht gut zu „mit Anfangsbuchstabe“

const BOMB_CATEGORIES = [
  ["🚗", "Automarken"], ["👟", "Modemarken"], ["🦸", "Superheld:innen"], ["🎨", "Hobbys"],
  ["📚", "Buchautor:innen"], ["🎤", "Sänger:innen"], ["✏️", "Dinge im Schulranzen"], ["🌍", "Länder"],
  ["🏛️", "Hauptstädte"], ["🏙️", "Städte in Deutschland"], ["⚽", "Fußballvereine"], ["🧑‍🦱", "Fußballspieler:innen"],
  ["🐾", "Tiere"], ["🍎", "Obstsorten"], ["🥦", "Gemüsesorten"], ["🍬", "Süßigkeiten"],
  ["🥤", "Getränke"], ["🍸", "Cocktails"], ["🍕", "Pizzabeläge"], ["🏰", "Disney-Filme"],
  ["📺", "Serien"], ["🎬", "Filme"], ["🎭", "Schauspieler:innen"], ["🎧", "Rapper:innen"],
  ["🎸", "Bands"], ["🎻", "Musikinstrumente"], ["🏅", "Sportarten"], ["👷", "Berufe"],
  ["🦵", "Körperteile"], ["👕", "Kleidungsstücke"], ["🛁", "Dinge im Badezimmer"], ["🍳", "Dinge in der Küche"],
  ["📱", "Apps"], ["🎮", "Videospiele"], ["🎲", "Brettspiele"], ["🧚", "Märchenfiguren"],
  ["🦆", "Zeichentrickfiguren"], ["🧑", "Vornamen"], ["🌈", "Farben"], ["🌸", "Blumen"],
  ["🌳", "Bäume"], ["🔧", "Werkzeuge"], ["🏖️", "Dinge am Strand"], ["⚪", "Dinge, die rund sind"],
  ["🧳", "Dinge für den Urlaub"], ["🛒", "Supermärkte & Läden"], ["🍔", "Fast-Food-Ketten"], ["♈", "Sternzeichen", false],
  ["🪐", "Planeten & Himmelskörper"], ["🇩🇪", "Deutsche Promis"], ["📖", "Schulfächer"], ["🎓", "Studiengänge"],
  ["🐶", "Hunderassen"], ["🧀", "Käsesorten"], ["🍝", "Nudelsorten"], ["🧁", "Kuchen & Torten"],
  ["🌶️", "Gewürze"], ["🚌", "Verkehrsmittel"], ["🏠", "Möbelstücke"], ["⛰️", "Dinge in der Natur"],
  ["🎄", "Dinge an Weihnachten"], ["🎃", "Halloween-Kostüme"], ["🧙", "Fantasy-Wesen"], ["🦖", "Dinosaurier", false],
  ["💼", "Firmen & Marken"], ["🏎️", "Formel-1-Fahrer", false], ["🥇", "Olympische Sportarten"], ["🗺️", "Flüsse"],
  ["🌋", "Berge & Gebirge", false], ["🗣️", "Sprachen"], ["😂", "Gründe, zu spät zu kommen", false], ["💔", "Dinge, die man nie beim Date sagen sollte", false],
  ["😴", "Dinge, die man im Bett macht", false], ["🧴", "Kosmetikprodukte"], ["🚀", "Dinge im Weltall"], ["🐟", "Meerestiere"],
  ["🐦", "Vögel"], ["🦋", "Insekten"], ["🍺", "Biersorten & -marken"], ["☕", "Kaffeespezialitäten"],
];

if (typeof module !== "undefined") module.exports = BOMB_CATEGORIES;
