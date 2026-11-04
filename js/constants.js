/* ==========================================================================
   JUNGLE HERO – CONSTANTS & CONFIGURATION (Action-Packed & Balanced Progression)
   ========================================================================== */

// Verschlüsseltes Koordinaten-Array für "N 50° 09.715 E 012° 07.591" (Bitmask + Lock auf >= 3000m)
const _cData = [167, 54, 154, 200, 145, 74, 71, 3, 47, 149, 100, 171, 213, 211, 3, 160, 162, 124, 163, 92, 53, 59, 253, 15, 108, 61];

const TARGET_DISTANCE = 3000; // 3.000m knackig-komprimierte Gesamtdistanz (5 Zonen à 600m)
const CACHE_HINT = "Angeln";   // Offizieller Geocache-Hinweis
const GC_CODE = "GCC04PH";     // Offizieller Geocaching GC-Code

// Bitweise Koordinaten-Entschlüsselung (erst ab TARGET_DISTANCE lesbar)
function _unlockFinal(encArr, currentDist) {
  if (currentDist < TARGET_DISTANCE) {
    return "🔒 GESPERRT: Erreiche 3.000m für die Koordinaten! 🔒";
  }
  const lock = 20;
  const kStr = String.fromCharCode(118, 101, 114, 115, 116, 101, 99, 107, 117, 108, 101, 115, 35) + lock;
  let res = "";
  for (let i = 0; i < encArr.length; i++) {
    const k = kStr.charCodeAt(i % kStr.length);
    const s = (i * 53 + k * 19 + 0x7D) & 0xFF;
    const dec = ((encArr[i] - (k & 0x3F) + 256) & 0xFF) ^ s;
    res += String.fromCharCode(dec);
  }
  return res;
}

// 5-Stufen Zonen-Progression (je 600m pro Zone -> 3.000m komprimierte Action ohne Längen!)
const ZONES = [
  {
    id: 1,
    name: "Zone 1: Sonnen-Urwald",
    start: 0,
    end: 600,
    baseSpeed: 320, // Knackiger Start mit Baumkronen, Gruben, Bongo, Looping & Seilbahn
    skyTop: "#062817",
    skyBottom: "#166534",
    waterColor: "#064e3b",
    sunColor: "rgba(254, 240, 138, 0.95)",
    sunGlow: "rgba(250, 204, 21, 0.4)",
    foliageTheme: { base: "#15803d", dark: "#14532d", highlight: "#4ade80", bark: "#78350f" },
    weather: "sunny",
    hasRain: false,
    hasLightning: false,
    hasGlowingRunes: false,
    desc: "Baumkronen, Bongo-Sprünge, 360° Looping & Seilrutsche!"
  },
  {
    id: 2,
    name: "Zone 2: Affenfelsen & Steinkugel",
    start: 600,
    end: 1200,
    baseSpeed: 400, // Loren-Start, Geysire, Hängebrücken & Steinkugel-Flucht
    skyTop: "#291508",
    skyBottom: "#ca8a04",
    waterColor: "#451a03",
    sunColor: "rgba(253, 224, 71, 0.95)",
    sunGlow: "rgba(234, 179, 8, 0.45)",
    foliageTheme: { base: "#a16207", dark: "#713f12", highlight: "#facc15", bark: "#451a03" },
    weather: "windy",
    hasRain: false,
    hasLightning: false,
    hasGlowingRunes: false,
    desc: "Loren-Schienen, Geysire, Hängebrücken & Steinkugel-Flucht!"
  },
  {
    id: 3,
    name: "Zone 3: Nebel-Wasserfall & Koloss",
    start: 1200,
    end: 1800,
    baseSpeed: 480, // Tropengewitter & Boss 1: Der Maya-Steinkoloss!
    skyTop: "#021727",
    skyBottom: "#034063",
    waterColor: "#082f49",
    sunColor: "rgba(186, 230, 253, 0.65)",
    sunGlow: "rgba(56, 189, 248, 0.25)",
    foliageTheme: { base: "#0e7490", dark: "#155e75", highlight: "#38bdf8", bark: "#1e293b" },
    weather: "storm",
    hasRain: true,
    hasLightning: true,
    hasGlowingRunes: false,
    desc: "Tropengewitter, Seilbahnen & Boss: Der Maya-Steinkoloss!"
  },
  {
    id: 4,
    name: "Zone 4: Maya-Krypten & Loren-Rush",
    start: 1800,
    end: 2400,
    baseSpeed: 570, // Schnelles Action-Tempo mit Loren-Schienen & Gongs
    skyTop: "#2e084e",
    skyBottom: "#581c87",
    waterColor: "#1e1b4b",
    sunColor: "rgba(245, 208, 254, 0.85)",
    sunGlow: "rgba(192, 132, 252, 0.35)",
    foliageTheme: { base: "#6b21a8", dark: "#4c1d95", highlight: "#c084fc", bark: "#3b0764" },
    weather: "crypt",
    hasRain: false,
    hasLightning: false,
    hasGlowingRunes: true,
    desc: "Lore-Minecart-Rush auf Schienen & Goldene Maya-Gongs!"
  },
  {
    id: 5,
    name: "Zone 5: Der Goldene Maya-Sonnentempel",
    start: 2400,
    end: 3000,
    baseSpeed: 660, // Hyper-Speed Finale zum Altar der Götter bei 3.000m!
    skyTop: "#451a03",
    skyBottom: "#d97706",
    waterColor: "#78350f",
    sunColor: "rgba(254, 249, 195, 1)",
    sunGlow: "rgba(250, 204, 21, 0.75)",
    foliageTheme: { base: "#b45309", dark: "#78350f", highlight: "#fef08a", bark: "#451a03" },
    weather: "golden",
    hasRain: false,
    hasLightning: false,
    hasGlowingRunes: true,
    desc: "Hyper-Speed Finale: Tempel-Einsturz & Altar der Götter!"
  }
];

// Dynamische Spiel-, Gimmick- & Geschwindigkeits-Konstanten
const GAME_CONFIG = {
  BASE_SPEED: 300,            // Flotter, aktiver Anfangs-Speed
  MAX_RUN_SPEED: 680,         // Zunehmender Speed je Zone
  SLIDE_SPEED: 480,           // Schneller Wurzel-Slide
  MINECART_SPEED: 620,        // Rasende Lore auf den Schienen
  SUPER_SONIC_SPEED: 820,     // Rasender Hyper-Speed Komet (bombastischer Rausch)
  BARREL_SHOOT_SPEED: 880,    // Explosiver Kanonenschuss
  GRAVITY: 1250,              // Angenehme, griffige Schwerkraft
  JUMP_FORCE: -540,           // Sanfter, gut kontrollierbarer Sprung
  DOUBLE_JUMP_FORCE: -510,    // Echter Doppelsprung (360°-Salto in der Luft)
  MINECART_JUMP_FORCE: -520,  // Wuchtiger Lorensprung über Schienenlücken
  DROP_STOMP_FORCE: 820,      // Wuchtiger Drop-Stomp nach unten
  SLIDE_DURATION: 0.72,       // Slide-Dauer in Sekunden
  SUPER_SONIC_DURATION: 8.0,  // Frenzy-Dauer in Sekunden (mächtige Phase!)
  TOTAL_LIVES: 3,             // Genau 3 Leben (ohne Erweiterung)
  BANANA_CHARGE_RATE: 1.8,    // 1.8% pro Banane (~55 Bananen für vollen Frenzy-Rausch)
  DIAMOND_CHARGE: 35,         // Diamant-Banane gibt +35% Boost
  ROCKET_SPEED: 760,          // Raketen-Fass Supersonic-Flug
  ROCKET_THRUST: -560,        // Raketen-Fass Aufwärtsschub per Tippen
  ROCKET_DURATION: 9.0,       // Dauer des Raketen-Fass Rausches
  COMBO_TIMEOUT: 3.5,         // Sekunden bis die Combo verfällt

  // Spielzeit-Kalibrierung: 3000m dauern exakt 4–5 Minuten (~260–290 Sekunden)
  DIST_SCALE_DIVISOR: 41.5,

  // Gimmick- & Event-Konstanten
  BOULDER_RADIUS: 56,         // Radius der Indiana-Jones Maya-Steinkugel
  BOULDER_SPEED_RATIO: 0.95,  // Verfolger-Geschwindigkeit relativ zu Koko
  SLOWMO_FACTOR: 0.48,        // Zeitlupen-Faktor bei Kanonenschuss & Schanze
  SLOWMO_DURATION: 0.42,      // Dauer der Zeitlupe in Sekunden

  // Partikel & Wetter Limits
  MAX_SPARKS: 70,             // Funken-Partikel
  MAX_RAIN: 80,               // Regen-Tropfen im Gewitter
  MAX_SMOKE: 40,              // Rauch-Wolken bei Kanonen
  MAX_SPORES: 30              // Glühwürmchen & Dschungelsporen
};

// 3 Legendäre Versteck-Relikte der Autoren (Geocaching Easter Eggs & Kryptex-Schlüssel)
const RELICS = [
  {
    id: "helmet",
    name: "Versteckules' Goldener Tropenhelm",
    shortName: "Tropenhelm",
    meter: 520,
    icon: "🪖",
    color: "#facc15",
    desc: "Auf den geheimen Baumkronen vor Affenfelsen gefunden!",
    glyph: "🐒",
    glyphName: "Batz (Held Koko)",
    ringIndex: 0,
    targetGlyphIndex: 2
  },
  {
    id: "amulet",
    name: "Tschangos Maya-Sonnen-Amulett",
    shortName: "Sonnen-Amulett",
    meter: 1450,
    icon: "🧿",
    color: "#38bdf8",
    desc: "In der geheimen Wasserfall-Grotte entdeckt!",
    glyph: "☀️",
    glyphName: "Kinich (Sonne)",
    ringIndex: 1,
    targetGlyphIndex: 0
  },
  {
    id: "hook",
    name: "Der Heilige Goldene Angelhaken",
    shortName: "Goldener Angelhaken",
    meter: 2280,
    icon: "🪝",
    color: "#f59e0b",
    desc: "Über der Maya-Schienenkrypta geborgen!",
    glyph: "🏛️",
    glyphName: "Pop (Sonnentempel)",
    ringIndex: 2,
    targetGlyphIndex: 5
  }
];

// Die exakte, geheime Maya-Kryptex Lösung: [Ring 1 = 🐒, Ring 2 = ☀️, Ring 3 = 🏛️]
const CRYPTEX_SOLUTION = [2, 0, 5];
const CRYPTEX_RIDDLE = "Der kühne Affe (🐒) eilt unter der ewigen Sonne (☀️) zum heiligen Tempel (🏛️).";

// Tödliche herabfallende Kokosnüsse (Gefahr aus den Baumkronen)
const COCONUT_CONFIG = {
  START_DIST: 140,      // Startet ab Zone 1 (~140m)
  MIN_INTERVAL: 7.0,    // Alle 7 bis 12 Sekunden
  MAX_INTERVAL: 12.0,
  FALL_SPEED: 520,      // Schneller diagonaler Sturz
  WARN_TIME: 1.25,      // 1.25s Vorwarnung per rotem Einschlag-Schatten am Boden
  DAMAGE: 1             // Zieht 1 Herz ab (bzw. Pelikan-Rettung)
};

// Seltene Goldene Skill-Herzen (1x pro Zone auf einer hohen oberen Baumkronen-Plattform!)
const SKILL_HEART_METERS = [320, 900, 1420, 2080, 2640];

// Die 4 Legendären K-O-K-O Dschungel-Buchstaben (wie bei Donkey Kong Country)
const KOKO_LETTERS_CONFIG = [
  { index: 0, char: "K", meter: 210, name: "Goldenes K" },
  { index: 1, char: "O", meter: 760, name: "Goldenes O" },
  { index: 2, char: "K", meter: 1360, name: "Goldenes K" },
  { index: 3, char: "O", meter: 2180, name: "Goldenes O" }
];

// Raketen-Fass (Jet-Barrel) Spektakel-Meilensteine
const ROCKET_BARREL_METERS = [1050, 2480];

// Boss-Event Meilensteine (skaliert auf 3.000m)
const BOSS_CONFIG = {
  COLOSSUS_START: 1520,
  COLOSSUS_END: 1750,
  COLLAPSE_START: 2760,
  COLLAPSE_END: 2960
};

// Wiederholte Maya-Glyphen-Stelen (Zusätzliche Chancen, falls man ein Relikt verpasst hat!)
const MAYA_STELES_CONFIG = [
  // Ring 1 (🐒 Batz): Relikt bei 520m, Stelen bei 380m, 850m, 1250m
  { ringIndex: 0, meter: 380, glyph: "🐒", name: "Batz (Held Koko)", icon: "🪖" },
  { ringIndex: 0, meter: 850, glyph: "🐒", name: "Batz (Held Koko)", icon: "🪖" },
  { ringIndex: 0, meter: 1250, glyph: "🐒", name: "Batz (Held Koko)", icon: "🪖" },

  // Ring 2 (☀️ Kinich): Relikt bei 1450m, Stelen bei 950m, 1720m, 2150m
  { ringIndex: 1, meter: 950, glyph: "☀️", name: "Kinich (Sonne)", icon: "🧿" },
  { ringIndex: 1, meter: 1720, glyph: "☀️", name: "Kinich (Sonne)", icon: "🧿" },
  { ringIndex: 1, meter: 2150, glyph: "☀️", name: "Kinich (Sonne)", icon: "🧿" },

  // Ring 3 (🏛️ Pop): Relikt bei 2280m, Stelen bei 1600m, 2520m, 2820m
  { ringIndex: 2, meter: 1600, glyph: "🏛️", name: "Pop (Tempel)", icon: "🪝" },
  { ringIndex: 2, meter: 2520, glyph: "🏛️", name: "Pop (Tempel)", icon: "🪝" },
  { ringIndex: 2, meter: 2820, glyph: "🏛️", name: "Pop (Tempel)", icon: "🪝" }
];

// Maya-Kryptex Glyphen für das interaktive 3D-Zylinder-Rätsel bei 4.000m
const CRYPTEX_GLYPHS = [
  { char: "☀️", name: "Kinich (Sonne)" },
  { char: "🐆", name: "Balam (Jaguar)" },
  { char: "🐒", name: "Batz (Held Koko)" },
  { char: "🐍", name: "Kukulkan (Schlange)" },
  { char: "🦅", name: "K'awiil (Pelikan Pico)" },
  { char: "🏛️", name: "Pop (Sonnentempel)" }
];
