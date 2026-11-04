# Jungle Hero – Master-Dokumentation & Konzept-Spezifikation (Volumetrische 2.5D Canvas-Engine)

> **Dokumenten-Status:** Verbindliche Master-Spezifikation & Entwicklungs-Referenz (Aktueller Stand: November 2026).  
> **Projekt:** Jungle Hero – Offizieller Premium-Web-Geocache  
> **GC-Code:** `GCC04PH`  
> **Autoren des Geocaches:** Versteckules & Tschango  
> **Final-Koordinaten:** `N 50° 09.715 E 012° 07.591` (Bitmask-verschlüsselt in `_cData`, Freischaltung exakt ab $\ge 3.000\,\text{m}$).  
> **Offizieller Geocache-Hinweis:** `"Angeln"` (Spezial-Ausrüstung vor Ort erforderlich).  
> **Spieldistanz & Dauer:** Knackig-komprimierte **3.000 Meter** (5 Zonen à 600m, ca. 4–5 Minuten pure Action ohne Längen, kalibriert über `DIST_SCALE_DIVISOR = 41.5`).  
> **Architektur:** Modulare Multi-File Struktur mit optimierter 2.5D Canvas-Engine (Pixar / Donkey Kong Country Shading-Stil).

---

## 1. Nicht-Verhandelbare Kern-Leitplanken

1. **Leben, Gesundheit & Seltene Skill-Herzen:**
   - **Maximal 3 Herzen (`GAME_CONFIG.TOTAL_LIVES = 3`).**
   - Jede Rettung durch Pelikan Pico kostet genau 1 Herz. Erst bei 0 Herzen = Game Over mit Zonen-Checkpoint-Auswahl.
   - **Seltene Goldene Skill-Herzen (1x pro Zone):** Einmal pro Zone (bei ~295m, ~880m, ~1.410m, ~2.060m und ~2.630m) spawnt auf einem hohen 3. Baumkronen-Gipfeldeck (`groundY - 242`, nur durch getimtes Hochklettern + Doppel-Salto erreichbar) ein geflügeltes **Goldenes Maya-Herz (`skillHearts`)**. Es heilt **+1 verlorenes Herz** (bis max. 3 Herzen) oder verleiht bei vollen 3 Herzen **+50% Super-Sonic Boost-Ladung**!
2. **Spieldistanz & Zonen-Komprimierung (3.000 Meter):**
   - Ziel-Distanz: Exakt **3.000 Meter** (`TARGET_DISTANCE = 3000`), aufgeteilt in **5 Zonen à 600 Meter** ohne jede Länge.
   - **Distanz-Zuwachsformel:** `distance += (player.vx * dt) / 41.5;`.
3. **20% Anspruchsvolleres Jump & Run Gameplay (Skill-basiert & Dynamisch):**
   - **Bananen-Ökonomie:** Bananen-Dichte um 20% verringert. Bananen liegen nicht auf dem Boden, sondern bilden getimte Flugkurven-Guides (`groundY - 65` bis `groundY - 140`) für präzise Sprünge. Jede Gold-Banane gibt **+1.8% Boost**, seltene Diamant-Bananen geben **+35% Boost**.
   - **Tödliche Kokosnüsse aus den Wipfeln (`fallingCoconuts`):** Ab Zone 1 (~140m) stürzen in regelmäßigen Intervallen (7–12 Sekunden) schwere Kokosnüsse diagonal aus den Baumkronen herab (`COCONUT_CONFIG`). Ein pulsierender roter Bodenschatten warnt 1.25s vorher. Treffer ohne Unverwundbarkeit kostet **1 Herz**!
   - **Sprungintensive Gruben & Schluchten:** Plattformen erfordern aktives Springen und getimte Doppelsprünge – einfaches Durchrennen am Boden führt in den Abgrund.
4. **Physikalisch korrekte Fässer (Kein Schweben in der Luft):**
   - Rollende Holzfässer (`rolling_barrel`) spawnen bündig auf Plattformen und besitzen eine eigene Gravitation (`1100 px/s²`). Über Schluchten fallen sie physikalisch korrekt in die Tiefe und verschwinden.
   - **Donkey-Kong Kopf-Bounce:** Landet Koko von oben auf einem Tukan oder rollenden Fass, federt er per Kopf-Bounce (`vy = -610`) hoch in die Luft, lädt den Doppelsprung auf und erhält **+10% Boost**!
5. **Kryptex-Rätsel, Wiederholte Maya-Stelen & Orakel-Schutz:**
   - **Autoren-Relikte:** Versteckules' Goldener Tropenhelm (520m), Tschangos Sonnen-Amulett (1.450m), Der Heilige Goldene Angelhaken (2.280m).
   - **Wiederholte Maya-Stelen (`mayaSteles`):** Wer ein Relikt verpasst, erhält in den Zonen an 9 wiederholten Maya-Stelen (alle 350–450m) weitere Chancen, das jeweilige Glyphen-Symbol aufzudecken.
   - **Transparenz:** Gefundene Symbole leuchten im oberen HUD und werden am Final-Altar im **„DEINE GEFUNDENEN GLYPHEN“**-Panel mit Bild und Bedeutung angezeigt.
   - **Anti-Frust-Garantie (Orakel von Palenque):** Nach 3 Fehlversuchen am Kryptex (`failedCryptexAttempts >= 3`) erscheint das mystische Maya-Orakel, das die Ringe auf Wunsch magisch ausrichtet – kein Geocacher scheitert vor Ort an den Koordinaten.
6. **Autoren-Präsentation (100% ungeschnitten & ohne Falsch-Zoom):**
   - `Avatar.jpg` (848×1264px Hochformat, Versteckules mit Tropenhelm & Signatur) und `tschango.jpg` (1024×1024px Quadrat, Tschango).
   - Werden in abgerundeten Karten mit `object-fit: contain` auf `#FAF6F0` Creme-Hintergrund dargestellt.
   - **Versteckules' Tropenhelm und seine Signatur bleiben jederzeit zu 100% sichtbar!** Kein runder Kreis-Beschnitt!
   - `avatar_silhouette.png` & `tschango_silhouette.png` liegen als transparente Neon-Wasserzeichen zentriert im Hintergrund (reduzierte Deckkraft 0.14).
7. **Replayability- & WOW-Suchtpaket (Combo-Flow, K-O-K-O Jagd & Raketen-Fass):**
   - **Flow- & Combo-Multiplikator (`x1` bis `x8`):** Belohnt Kettenaktionen (Doppel-Salto, Bongo-Bounce, Zipline-Rush, Stomp, Kanone, Gong) mit Punkten, Sound-Jingles und dynamischem HUD-Timer-Balken.
   - **K-O-K-O Buchstaben-Jagd:** 4 versteckte goldene Maya-Medaillons (K bei ~210m, O bei ~760m, K bei ~1.360m, O bei ~2.180m). Bei 4/4 verwandelt sich Koko in den legendären **Gold-Koko** und schaltet das goldene Meistersiegel auf dem Finisher-Stempel frei.
   - **Raketen-Fass (Jet-Barrel Powerup):** Spektakulärer 9-Sekunden-Raketenflug bei ~1.050m und ~2.480m mit Zwillings-Feuerstrahl und Smash-Garantie durch alle Hindernisse.
   - **100% faire Seilbahnen:** Garantierte Kollisions-Immunität während der Seilbahnfahrt; keine Piranhas in der Seilbahnschlucht.
   - **Massiver Basalt-Boden & Maya-Koloss Overhaul:** Organische, tiefe Dschungelklippen ohne störende Hänge-Ringe sowie ein skulptierter 3D-Basalt-Titan mit Magma-Rissen und Rubin-Feueraugen.

---

## 2. Reine One-Button Jump & Run Steuerung (Smartphone, Tablet & Desktop)

Das Spiel ist als reines, intuitives **One-Button Jump & Run** konzipiert – überall auf dem Bildschirm tippen (oder `Leertaste` / `Pfeil-Hoch` / `Enter` drücken):

```
┌────────────────────────────────────────────────────────┐
│        GESAMTER BILDSCHIRM (ONE-BUTTON TOUCH)          │
│  • 1x Tippen = SPRUNG / KANONE / LIANE / ZIPLINE / HOPP│
│  • 2x Tippen (in der Luft) = 360° DOPPELSPRUNG-SALTO!  │
└────────────────────────────────────────────────────────┘
```

### Die One-Button Aktionslogik im Detail:
* **1x Tippen:**
  - **Am Boden (oder während 120ms Coyote-Time):** Führt den Standard-Sprung aus (`JUMP_FORCE = -540`).
  - **In der Fass-Kanone (`in_barrel`):** Feuert die Tiki-Kanone sofort in Schussrichtung ab (`BARREL_SHOOT_SPEED = 860`).
  - **In der Lore (`in_minecart`):** Führt den Loren-Hopp über Schienenlücken und Stacheln aus (`MINECART_JUMP_FORCE = -520`).
  - **An der Liane (`grapple_swing`) oder Zipline (`on_zipline`):** Löst den Schwung bzw. die Seilrutsche mit einem Katapult-Sprung nach vorn oben (`vy = -490`).
  - **In der Luft nahe einer sichtbaren Hänge-Liane:** Greift die Liane sofort und startet den Tarzan-Schwung.
* **2x Tippen (in der Luft):**
  - **Echter Doppelsprung mit 360°-Salto (`DOUBLE_JUMP_FORCE = -510`):** Koko dreht sich mit goldenem Luftwirbel um 360° (`DOPPEL-SALTO! 🤸✨`) und erreicht obere Baumkronen-Decks, Diamant-Bananen oder weicht fallenden Kokosnüssen und breiten Schluchten aus.
* **Donkey-Kong Kopf-Bounce (Automatisch bei Landung von oben auf Gegnern):**
  - Springt Koko von oben auf einen Tukan oder ein rollendes Holzfass, prallt er im hohen Bogen nach oben ab (`vy = -610`, `+10%` Boost-Ladung) und lädt seinen Doppelsprung in der Luft sofort wieder auf!

---

## 3. Krisenfestes Rettungs- & Respawn-System

* **Millimetergenaue Landung:** Pelikan Pico setzt Koko exakt bei `WORLD_GROUND_Y - player.height` ab (`460 - 68 = 392`). Kokos Füße berühren exakt die Plattformoberfläche (`isGrounded = true`, `vy = 0`).
* **Kontinuierliche Lande-Prüfung:** Verhindert Tunneln selbst bei Framerate-Schwankungen auf älteren Mobilgeräten.
* **Garantierte 1.080px Sicherheits-Plattform:** Bei der Rettung wird eine breite Runway erzeugt (`rescue_safe_platform`). Alle Hindernisse auf und direkt nach der Plattform werden restlos eliminiert.
* **Sofortige Fallrettung:** Fluss-Abstürze lösen sofort `triggerRescue(true)` aus, frieren die Fallbewegung augenblicklich ein und bringen Koko sicher nach oben.
* **Garantierter Checkpoint-Spawn:** Bei Zonen-Neustart (`resetGame(false)`) wird `player.x = lastCheckpointDist * 41.5 + 100` berechnet und eine **960 Pixel breite, lückenlose Start-Runway** ohne jedes Hindernis erzeugt.
* **3.5s Schutzschild:** Nach jeder Rettung erhält Koko 3.5 Sekunden unzerstörbare Schutz-Aura. Folge-Abstürze sind physikalisch ausgeschlossen.

---

## 4. Plattform-Hilfen, Balance & Mobile UX

* **Coyote-Time (120 ms Kanten-Kulanz):**
  - Läuft Koko über eine Plattformkante, bleibt der Absprung für 120 ms nach Verlassen des Bodens gültig. Verhindert unfaire Kanten-Abstürze bei Touch-Latenz.
* **Jump-Buffering (150 ms Vor-Sprung):**
  - Tippt der Spieler bis zu 150 ms vor der Landung auf den Bildschirm, springt Koko im exakten Moment des Bodenkontakts sofort wieder ab.
* **Gefahren-Telegraphing (ab Tempo $\ge 380\,\text{px/s}$):**
  - Dezente Vorwarn-Banner kündigen Engstellen und Schienenbrüche 1,5 Sekunden vor dem Erreichen an.
* **Voll adaptive Bildschirm-Ausrichtung & Kamera-Zoom:**
  - **Hochformat (Portrait):** `targetVisibleW = 780px`, `camera.scale = Math.min(1.0, logicalW / 780)` (~0.47 – 0.50). Koko ist bei 17% horizontaler Position platziert für maximale Weitsicht nach vorn.
  - **Handy-Querformat (Mobile Landscape `logicalH <= 520`):** `targetVisibleH = 800px`, `camera.scale = Math.min(0.50, Math.max(0.44, logicalH / 800))` (~0.47 – 0.50). Exakt selbe harmonische Zoomstufe wie im Hochformat! Über 1.700px Vorausschau nach rechts und 45% vertikaler Freiraum für fallende Kokosnüsse. Kein „zu dicht dran“-Effekt mehr.
  - **Desktop-Querformat:** `targetVisibleW = Math.max(900, logicalW * 0.95)`, `camera.scale = Math.min(1.08, ...)`.
* **Kollisionsfreies 2-Zeilen Mobile-HUD:**
  - Responsive Anordnung mit separatem Spacing: Links Multiplikator & Bananenzähler, mittig K-O-K-O Medaillons, rechts Herzen & `🎵 Musik`-Toggle.
* **Mobiles Audio & Autoplay-Garantie:**
  - Native, synchrone User-Activation auf dem Start-Button ohne blockierendes `.load()`.
  - Globaler Capture-Unlocker fängt erste Touch-Gesten auf GitHub Pages / iOS Safari ab.
  - Smarter Musik-Button: Ein Klick bei blockiertem Autoplay startet die Musik direkt neu, statt sie auszuschalten.

---

## 5. Grafik-Architektur (Volumetrischer 2.5D Shading-Stil)

* **Volumetrisch 3D-schattierte Banyan-Bäume & Felsmassive:**
  - Zylindrischer 5-Stufen-Farbverlauf über die Baumstämme. Plastische Rindenwülste und 3D-Aststrukturen.
  - Plattformen reichen als massive Basalt- und Erdklippen bis `y + 260` hinab, verziert mit antiken Maya-Steinblöcken, Moosballen und Farnen (keine Hänge-Ringe).
* **Mehrschichtiger 3D-Wasserfall & dynamisches Wetter:**
  - Sturzwasser, weiße Strömungs-Schlieren, aufprallende Gischt mit Schaumbällchen und Nebel.
  - Tropengewitter mit Monsunregen, Donnergrollen und Blitzen in Zone 3.
* **3D-plastischer Held Koko im Diddy-Kong / Entdecker-Style:**
  - Kompakte 52×58px Skalierung (1.08x) für präzise Sprünge.
  - Artikulierte Arme mit goldenem Maya-Armreif, animierte Beine, S-förmiger Greifschwanz.
  - Rote Kappe mit goldenem Maya-Emblem, Fliegerbrille auf der Stirn, rot-goldene Entdecker-Weste und grüner Expeditionsrucksack mit gerollter Schatzkarte.
  - Dynamischer Schlagschatten für echte Bodenhaftung.
* **Monumentaler Maya-Steinkoloss (`drawMayanColossus`):**
  - Skulptierter 3D-Basalt-Titan mit gestuften Tempel-Schultern, Magma-Rissen, Rubin-Feueraugen, Obsidian-Zähnen und telegrafiertem Faustschlag mit Schockwellen.
* **Maya-Stelen & Tödliche Kokosnüsse:**
  - Antike Steinsäulen mit Reliefs und leuchtenden Glyphen-Symbolen (`drawMayaSteles`).
  - Drehende Kokosnüsse im freien Fall mit rotem Gefahren-Bodenschatten und Holzsplitter-Partikeln beim Aufprall (`drawFallingCoconuts`).

---

## 6. Level-Progression, 10 Chunk-Typen & Zonen-Ablauf (0 bis 3.000m)

| Zone & Distanz | Tempo & freigeschaltete Features |
|---|---|
| **Zone 1: Sonnen-Urwald (0 – 600m)** | **Speed 300:** Baumkronen-Ebenen bei ~70m, **Fallende Kokosnüsse ab ~140m**, Bongo-Pilz bei ~145m, Tiki-Kanone bei ~220m, Skill-Herz #1 auf Gipfel-Deck bei ~295m, Sonic 360°-Looping bei ~370m, **Maya-Stele 1 (🐒) bei ~380m**, Zipline-Seilrutsche bei ~445m, Geysire & **Relikt 1 (Versteckules' Goldener Tropenhelm 🪖 / 🐒 Batz) bei 520m**! |
| **Zone 2: Affenfelsen (600 – 1.200m)** | **Speed 380:** Bröckelnde Hängebrücke bei ~640m, Loren-Rush auf Schienen bei ~720m, Indiana-Jones-Steinkugel (780–1.080m), **Maya-Stele 2 (🐒) bei ~850m**, Skill-Herz #2 bei ~880m, **Maya-Stele 3 (☀️) bei ~950m**, Goldener Maya-Gong bei ~980m, Raketen-Fass bei ~1.050m! |
| **Zone 3: Nebel-Wasserfall & Koloss (1.200 – 1.800m)** | **Speed 460:** Tropengewitter mit Monsun-Regen & Blitzen. **Maya-Stele 4 (🐒) bei ~1.250m**, Skill-Herz #3 bei ~1.410m, **Relikt 2 (Tschangos Sonnen-Amulett 🧿 / ☀️ Kinich) bei 1.450m**! **BOSS 1 (1.520–1.750m): Maya-Steinkoloss erwacht!** **Maya-Stele 5 (🏛️) bei ~1.600m**, **Maya-Stele 6 (☀️) bei ~1.720m**. |
| **Zone 4: Maya-Krypten (1.800 – 2.400m)** | **Speed 550:** Rasante Minecart-Strecken, Steinkugel 2 (1.980–2.220m), Skill-Herz #4 bei ~2.060m, **Maya-Stele 7 (☀️) bei ~2.150m**, **Relikt 3 (Der Heilige Goldene Angelhaken 🪝 / 🏛️ Pop) bei 2.280m**! |
| **Zone 5: Sonnentempel & Einsturz (2.400 – 3.000m)** | **Speed 640:** Raketen-Fass bei ~2.480m, **Maya-Stele 8 (🏛️) bei ~2.520m**, Skill-Herz #5 bei ~2.630m, **BOSS 2 (2.760–2.960m): Tempel-Einsturz!**, **Maya-Stele 9 (🏛️) bei ~2.820m**. **Bei 3.000m: Interaktives Maya-Kryptex am Altar der Götter!** |

---

## 7. Geocaching Final-Koordinaten & Krypto-Spezifikation

* **Offizielle Final-Koordinaten:** `N 50° 09.715 E 012° 07.591`
* **Offizieller Hinweis zum Versteck:** `"Angeln"` (Spezial-Ausrüstung vor Ort erforderlich).
* **Verschlüsselungs-Array (`_cData` in `constants.js`):**
  ```javascript
  const _cData = [167, 54, 154, 200, 145, 74, 71, 3, 47, 149, 100, 171, 213, 211, 3, 160, 162, 124, 163, 92, 53, 59, 253, 15, 108, 61];
  ```
* **Entschlüsselungs-Logik (`_unlockFinal`):**
  ```javascript
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
  ```
* **Sicherheits-Garantie:** Vor Erreichen der 3.000m ist kein Teil-String sichtbar; DevTools-Abfragen vor 3.000m werden durch die Guard-Clause abgewiesen.
* **Interaktives Maya-Kryptex bei 3.000m:**
  - Koko erreicht den Altar der Götter. Ein 3D-Zylinder mit 3 drehbaren Steinringen (Maya-Glyphen: ☀️ Kinich, 🐆 Balam, 🐒 Batz, 🐍 Kukulkan, 🦅 K'awiil, 🏛️ Pop) erscheint.
  - **Die korrekte Lösung:** `[2, 0, 5]` = **[🐒 Held Koko / Batz, ☀️ Heilige Sonne / Kinich, 🏛️ Sonnentempel / Pop]**, korrespondierend zu den drei Relikten (Tropenhelm, Sonnen-Amulett, Angelhaken).
  - **Altar-Inventar (`altar-inventory`):** Zeigt gesammelte Symbole live an. Wurden alle 3 Symbole gesammelt, kann das Kryptex mit einem Klick auf "MIT GEFUNDENEN GLYPHEN ÖFFNEN" sofort gelöst werden.
  - **Orakel von Palenque:** Nach 3 Fehlversuchen (`failedCryptexAttempts >= 3`) erscheint der Notfall-Button **„🔮 ORAKEL VON PALENQUE UM HILFE BITTEN“**, der die Ringe automatisch richtig ausrichtet und das Tor öffnet.
  - **Finisher-Zertifikat:** Enthüllt die Finalkoordinaten, den Hinweis „Angeln“, unbeschnittene Autoren-Karten von Versteckules & Tschango und eine Copy-to-Clipboard-Funktion für das Log auf Geocaching.com.

---

## 8. Modulare Dateistruktur & Verantwortlichkeiten

```
c:\Users\flaem\Desktop\Hero\JungleHero\
├── index.html              # HTML5 Shell, Canvas, Glassmorphic HUD, Relikte-HUD, Maya-Kryptex, Altar-Inventar & Finisher-Stempel
├── css/
│   └── style.css           # Glassmorphic HUD, ungeschnittene Avatar-Cards (#FAF6F0), 3D-Kryptex, Responsive Breakpoints
├── js/
│   ├── constants.js        # Zonen-Settings, RELICS, MAYA_STELES_CONFIG, COCONUT_CONFIG, CRYPTEX_GLYPHS, CRYPTEX_SOLUTION, _cData & _unlockFinal
│   ├── audio.js            # Synthesizer Engine & SFX (Koloss, Kokosnuss, Relikt, Kryptex, Fanfare) mit Mobile Autoplay Unlocker
│   ├── graphics.js         # JungleGraphicsEngine (Maya-Koloss, Stelen, Kokosnüsse, Tempel-Einsturz, Relikte, Altar-Backdrop, 2.5D Shading)
│   └── game.js             # One-Button Input, Physik, Schwerkraft für Fässer, Stelen-Sammeln, Kryptex-Logik & Palenque-Orakel
├── Avatar.jpg              # Original-Bild Versteckules (848×1264px, Tropenhelm & Signatur ungeschnitten)
├── tschango.jpg            # Original-Bild Tschango (1024×1024px, quadratisch)
├── avatar_silhouette.png   # Neon-Smaragd Wasserzeichen im Hintergrund
├── tschango_silhouette.png # Neon-Gold Wasserzeichen im Hintergrund
├── music.mp3               # Hintergrundmusik
└── prompt.md               # Diese verbindliche Master-Dokumentation & Konzept-Spezifikation
```

---

## 9. Changelog & Historie aller Beschlüsse

1. **Rückkehr zu 2.5D Canvas:** Vollständige Abkehr von Three.js WebGL zurück zu 2.5D Canvas mit volumetrischem Pixar/DKC Shading für maximale Performance und Reaktionsfreude.
2. **Koko Redesign:** Skaliert auf wendige 52×58px (1.08x), warmes Honigbraun-Fell, detaillierte Entdecker-Kappe und Fliegerbrille.
3. **Pacing & Kalibrierung:** `DIST_SCALE_DIVISOR = 41.5` für 4–5 Minuten Gesamtdauer bei 3.000m. Zone 1 beginnt bei 300 px/s.
4. **Finalkoordinaten & Hinweis:** `N 50° 09.715 E 012° 07.591` und Hinweis `"Angeln"` fest im Code und Victory-Popup verankert.
5. **Mehrfach-Absturz behoben:** Pelikan Pico landet Koko millimetergenau auf Plattformhöhe (`WORLD_GROUND_Y - player.height`), kontinuierliche Kollisionsprüfung, Checkpoint-Spawn mit garantierter Sicherheits-Runway.
6. **Reine One-Button Jump & Run Steuerung:** 1x Tippen = Sprung / Fass / Lore / Liane / Zipline; 2x Tippen = 360° Doppel-Salto. Keine komplizierten Wischgesten nötig.
7. **Plattform-Hilfen:** Coyote-Time (120ms) und Jump-Buffering (150ms) sowie Gefahren-Telegraphing ab Zone 2 implementiert.
8. **Voll adaptive Ausrichtung:** Nahtlose Umschaltung zwischen Querformat und Hochformat mit dynamischer Vorausschau.
9. **Start-Screen Optimierung:** Prägnante 2-zeilige Kurz-Einweisung; automatische Skalierung für Mobilgeräte.
10. **Sofort-Start per Touch & Click:** Direkte Event-Verknüpfung mit synchronem Audio-Unlocker auf `#btn-start-game`.
11. **Bananen-Ökonomie:** Keine Boden-Bananen mehr; geschwungene Flugkurven-Guides für getimte Sprünge. +1.8% Boost pro Banane, Diamant-Bananen geben +35%.
12. **Dynamischer Zone-1-Ablauf (0–600m):** Bongo-Sprungpilz ab ~145m, Tiki-Kanone ab ~220m, Wurzel-Looping ab ~370m, Zipline ab ~445m.
13. **Bombastischer Super-Sonic Frenzy:** Koko bleibt voll sichtbar mit 3-fachem Kometen-Schweif & Flammen-Aura; Vollbild-Speed-Lines; Arcade-Smash zerschmettert Hindernisse mit Funkenexplosion.
14. **Zwei-Phasen Boss-Setpieces:** Boss 1 (1.520–1.750m) Maya-Steinkoloss; Boss 2 (2.760–2.960m) Tempel-Einsturz kurz vor dem Ziel.
15. **3 Legendäre Versteck-Relikte:** Tropenhelm (520m), Sonnen-Amulett (1.450m), Goldener Angelhaken (2.280m).
16. **Interaktives 3D-Maya-Kryptex & Finisher-Stempel:** Dreidimensionale rotierbare Steinringe am Altar bei 3.000m; Finisher-Zertifikat mit unbeschnittenen Versteckules- & Tschango-Karten.
17. **Kanonen-Highlight-Dosierung:** Cooldown von mindestens 9 Chunks (~300m) zwischen Kanonen-Passagen.
18. **Garantierter Respawn ohne Absturz ins Leere:** Robuster Kamera-Reset vor `ensureChunksAhead()`, 1.080px Runway bei Pelikan-Rettung.
19. **Echter Doppelsprung & Sichtbare Hänge-Lianen:** 360°-Salto mit goldenem Wirbel; sanft schwingende Dschungel-Lianen mit Greifring.
20. **Komplettes Mobile-UX-Upgrade:** Dynamischer Zoom (`targetVisibleW = 780` im Hochformat) und überlappungsfreies 2-Zeilen-HUD.
21. **Koko Grafik-Redesign im Diddy-Kong / Entdecker-Style:** Artikulierte Arme, Beine, S-Schwanz, Rucksack mit Schatzkarte, herzförmige Gesichtsmaske.
22. **Volles Abwechslungs-Paket:** 10 Chunk-Typen, lebendige Gegner (Tukane, rollende Fässer, Piranhas) mit Donkey-Kong Kopf-Bounce.
23. **3.000m Komprimierung & Skill-Herzen:** 5 Zonen à 600m; 1 Goldenes Skill-Herz pro Zone auf schwer erreichbarem Gipfeldeck (+1 Leben zurück).
24. **Massiver Dschungelboden & Maya-Koloss Overhaul:** Entfernung aller Hänge-Ringe; tiefe Basalt-Klippen; skulptierter 3D-Koloss mit Magma-Rissen und Rubin-Augen; WOW-Paket (Combo x1–x8, K-O-K-O Jagd, Jet-Raketenfass).
25. **20% Schwierigkeits-Balancing:** 20% weniger Bananen, Einführung tödlicher herabfallender Kokosnüsse aus den Wipfeln (`COCONUT_CONFIG`, Warn-Schatten, Schaden -1 Herz) und sprungintensiverer Schluchten gegen reines Durchrennen.
26. **Wiederholte Maya-Stelen, Altar-Inventar & Palenque-Orakel:** 9 wiederholte Maya-Stelen (`mayaSteles`) verteilt über alle Zonen als zusätzliche Sammel-Chancen für verpasste Symbole; Live-Inventar im HUD & Altar-Screen; Notfall-Hilfe durch das Orakel von Palenque nach 3 Fehlversuchen am Kryptex.
27. **Fässer-Physik & Schwerkraft:** Rollende Holzfässer besitzen echte Schwerkraft (`1100 px/s²`), rollen bündig auf Plattformen und stürzen über Abgründen in die Tiefe (kein Schweben in der Luft mehr).
28. **Mobile Querformat-Kamera & Robustes Audio-Autoplay:**
    - Handy-Querformat (`logicalH <= 520`) mit Zielhöhe 800px auf Zoomfaktor `0.46 – 0.50` kalibriert (identisch zum Hochformat-Zoom) für über 1.700px Vorausschau ohne Nähe-Überwältigung.
    - Vollständige Behebung des Autoplay-Abbruchs auf mobilen WebKit-/iOS-Browsern durch Entfernen asynchroner `.load()`-Aufrufe, synchrone Aktivierung im Start-Button und globalen Capture-Unlocker.
