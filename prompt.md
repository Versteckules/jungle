# Jungle Hero – Master-Dokumentation & Konzept-Spezifikation (Volumetrische 2.5D Canvas-Engine)

> **Dokumenten-Status:** Verbindliche Master-Spezifikation & Entwicklungs-Referenz (Stand: November 2026).  
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
   - **Seltene Goldene Skill-Herzen (1x pro Zone auf schwer erreichbarer oberer Baumkrone):** Einmal pro Zone (bei ~295m, ~880m, ~1.410m, ~2.060m und ~2.630m) spawnt auf einem hohen 3. Baumkronen-Gipfeldeck (`groundY - 242`, nur durch getimtes Hochklettern + Doppel-Salto erreichbar) ein geflügeltes **Goldenes Maya-Herz (`skillHearts`)**. Es heilt **+1 verlorenes Herz** (bis max. 3 Herzen) oder gibt bei vollen 3 Herzen **+50% Super-Sonic Boost-Ladung**!
2. **Spieldistanz & Zonen-Komprimierung (3.000 Meter):**
   - Ziel-Distanz: Exakt **3.000 Meter** (`TARGET_DISTANCE = 3000`), aufgeteilt in **5 Zonen à 600 Meter** ohne jede Länge.
   - **Distanz-Zuwachsformel:** `distance += (player.vx * dt) / 41.5;`.
3. **Bananen-Mechanik & Super-Sonic Frenzy (Wertvoll & Skill-basiert):**
   - Jede Gold-Banane erhöht Kokos Geschwindigkeit leicht (+8 px/s) und lädt die Frenzy-Anzeige um **+1.8%** auf (~55 Bananen für vollen Frenzy-Rausch; 1 Frenzy alle 1–2 Zonen als echtes Highlight).
   - Seltene Diamant-Bananen geben **+35% Boost-Ladung**.
   - **Keine Boden-Bananen mehr:** Bananen liegen nicht mehr auf dem Boden herum, sondern bilden geschwungene Flugkurven-Guides (`groundY - 65` bis `groundY - 140`) für getimte Sprünge oder liegen in schnellen Wurzel-Rutschen.
   - Bei 100% Boost-Ladung zündet der **SUPER-SONIC FRENZY**:
     - **Bombastischer Arcade-Rausch:** Dynamische Speed-Lines rasen über den gesamten Bildschirm, pulsierende goldene Rand-Vignette.
     - **Koko bleibt voll sichtbar:** Dreifacher goldener Ghost-Schweif und flammende Aura um Koko (Koko wird NICHT durch einen Kreis ersetzt!).
     - **Arcade-Smash:** Hindernisse (Krokodile, Stacheln) zerspringen bei Berührung mit Schockwelle, 16 Funken, `"SMASH! 💥"` und wuchtigem SFX.
     - Bananen-Magnet (zieht alle Früchte im Umkreis von 260px an).
     - Rasendes Hyper-Tempo von 820 px/s für 8.0 Sekunden.
4. **Autoren-Präsentation (100% ungeschnitten & ohne Falsch-Zoom):**
   - `Avatar.jpg` (848×1264px Hochformat, Versteckules mit Tropenhelm & Signatur) und `tschango.jpg` (1024×1024px Quadrat, Tschango).
   - Werden in abgerundeten Karten mit `object-fit: contain` auf `#FAF6F0` Creme-Hintergrund dargestellt.
   - **Versteckules Tropenhelm und seine Signatur bleiben jederzeit zu 100% sichtbar!** Kein runder Kreis-Beschnitt!
   - `avatar_silhouette.png` & `tschango_silhouette.png` liegen als transparente Neon-Wasserzeichen zentriert im Hintergrund (reduzierte Deckkraft 0.14).
5. **Replayability- & WOW-Suchtpaket (Combo-Flow, K-O-K-O Jagd & Raketen-Fass):**
   - **Flow- & Combo-Multiplikator (`x1` bis `x8`):** Belohnt Kettenaktionen (Doppel-Salto, Bongo-Bounce, Zipline-Rush, Stomp, Kanone, Gong) mit fetten Punkten, Sound-Jingles und dynamischem HUD-Timer-Balken.
   - **K-O-K-O Buchstaben-Jagd:** 4 versteckte goldene Maya-Medaillons (K bei ~210m, O bei ~760m, K bei ~1.360m, O bei ~2.180m). Bei 4/4 verwandelt sich Koko in den legendären **Gold-Koko** und schaltet das goldene Meistersiegel auf dem Finisher-Stempel frei.
   - **Raketen-Fass (Jet-Barrel Powerup):** Spektakulärer 9-Sekunden-Raketenflug bei ~1.050m und ~2.480m mit Zwillings-Feuerstrahl und Smash-Garantie durch alle Hindernisse.
   - **100% faire Seilbahnen:** Garantierte Kollisions-Immunität und keine Piranhas mehr in der Seilbahn-Schlucht.
   - **Massiver Basalt-Boden & Maya-Koloss Overhaul:** Organische, tiefe Dschungelklippen ohne störende Hänge-Ringe sowie ein skulptierter 3D-Basalt-Titan mit Magma-Rissen und Rubin-Feueraugen.

---

## 2. Reine One-Button Jump & Run Steuerung (Smartphone, Tablet & Desktop)

Basierend auf der Grill-Me-Ausrichtung ist das Spiel als reines, intuitives **One-Button Jump & Run** konzipiert – überall auf dem Bildschirm tippen (oder `Leertaste` / `Pfeil-Hoch` / `Enter` drücken):

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
  - **Echter Doppelsprung mit 360°-Salto (`DOUBLE_JUMP_FORCE = -510`):** Koko dreht sich mit goldenem Luftwirbel um 360° (`DOPPEL-SALTO! 🤸✨`) und erreicht mühelos obere Baumkronen-Decks, Diamant-Bananen oder rettet sich über breite Schluchten.
* **Donkey-Kong Kopf-Bounce (Automatisch bei Landung von oben auf Gegnern):**
  - Springt Koko von oben auf einen flatternden Tukan oder ein rollendes Holzfass, prallt er im hohen Bogen nach oben ab (`vy = -610`, `+10%` Boost-Ladung) und lädt seinen Doppelsprung in der Luft sofort wieder auf!

---

## 3. Krisenfestes Rettungs- & Respawn-System (Lösung des Mehrfach-Absturzes)

### Die 3 mathematischen Fehlerursachen der alten Version:
1. **Ablage-Höhenfehler bei Pelikan Pico:**
   - *Fehler:* Pelikan Pico setzte Koko bei `WORLD_GROUND_Y - 25` ab. Da Koko 68 Pixel hoch ist, lagen seine Füße bei `WORLD_GROUND_Y + 43` (43px *unterhalb* der Plattformoberkante).
   - *Folge:* Die Kollisionserkennung prüfte nur den Bereich `platTop` bis `platTop + 26`. Da 43 > 26 war, wurde die Plattform ignoriert und Koko fiel sofort durch den Boden ins Wasser.
2. **Absturz-Blockade durch Unverwundbarkeit:**
   - *Fehler:* In `triggerRescue()` stand `if (player.invulnerableTimer > 0) return;`. Stürzte Koko während der Schutzzeit ab, wurde er nicht gerettet und fiel tausende Pixel tief ins bodenlose Nichts.
3. **Koordinaten-Fehler bei Checkpoint-Revanche:**
   - *Fehler:* In `resetGame(false)` wurde `player.x = lastCheckpointDist * 12` gerechnet (Faktor 12 statt des neuen Kalibrierungsfaktors 41.5). Koko spawnte mitten im Nirgendwo über leeren 400px Schluchten.

### Die implementierten, verifizierten Lösungen:
* **Millimetergenaue Landung:** Pelikan Pico setzt Koko exakt bei `WORLD_GROUND_Y - player.height` ab (`460 - 68 = 392`). Kokos Füße berühren exakt die Plattformoberfläche (`isGrounded = true`, `vy = 0`).
* **Kontinuierliche Lande-Prüfung:** `currBottom >= platTop - 4 && (currBottom <= platTop + 32 || prevBottom <= platTop + 14)` verhindert Tunneln selbst bei Framerate-Schwankungen auf älteren Mobilgeräten.
* **Garantierte 920px Sicherheits-Plattform:** Bei der Rettung wird eine breite Moos-Runway erzeugt (`rescue_safe_platform`, 920px). Alle Hindernisse auf und direkt nach der Plattform werden restlos eliminiert.
* **Sofortige Fallrettung:** Fluss-Abstürze (`player.y > WORLD_GROUND_Y + 70`) lösen ausnahmslos sofort `triggerRescue(true)` aus, frieren die Fallbewegung augenblicklich ein und bringen Koko sicher nach oben.
* **Garantierter Checkpoint-Spawn:** Bei Zonen-Neustart (`resetGame(false)`) wird `player.x = lastCheckpointDist * 41.5 + 100` berechnet und eine **960 Pixel breite, lückenlose Start-Runway** ohne jedes Hindernis erzeugt.
* **3.5s Schutzschild:** Nach jeder Rettung erhält Koko 3.5 Sekunden unzerstörbare Schutz-Aura. Folge-Abstürze sind physikalisch ausgeschlossen.

---

## 4. Plattform-Hilfen & Balance (Faires Gameplay über 5–7 Minuten)

* **Coyote-Time (120 ms Kanten-Kulanz):**
  - Läuft Koko über eine Plattformkante, bleibt der Absprung für 120 ms nach Verlassen des Bodens gültig. Verhindert unfaire Kanten-Abstürze bei Touch-Latenz.
* **Jump-Buffering (150 ms Vor-Sprung):**
  - Tippt der Spieler bis zu 150 ms vor der Landung auf den Bildschirm, springt Koko im exakten Moment des Bodenkontakts sofort wieder ab.
* **Gefahren-Telegraphing (ab Tempo $\ge 380\,\text{px/s}$):**
  - Dezente Vorwarn-Banner (`⚠️ TURBO-SLIDE!`, `⚠️ DUCKEN!`) kündigen Engstellen und Schienenbrüche 1,5 Sekunden vor dem Erreichen an.
* **Voll adaptive Bildschirm-Ausrichtung:**
  - **Querformat (Landscape):** Breites Sichtfeld, Koko wird bei 28% der Bildschirmbreite platziert (72% freie Voraussicht nach vorn).
  - **Hochformat (Portrait):** Intelligenter Kamera-Zoom (`camera.scale` garantiert mindestens 680px Welt-Voraussicht, Koko bei 24% platziert).
  - Volle Unterstützung für `resize`, `orientationchange` und `visualViewport`.

---

## 5. Grafik-Architektur (Volumetrischer 2.5D Shading-Stil)

* **Volumetrisch 3D-schattierte Banyan-Bäume:**
  - Zylindrischer 5-Stufen-Farbverlauf über die Baumstämme (Tiefer Rindenschatten $\rightarrow$ Holzbraun $\rightarrow$ goldene Sonnenkante $\rightarrow$ Rindenschatten).
  - Plastische Rindenwülste und dreidimensionale Aststrukturen.
  - Kugelförmig schattierte Blätter-Ballen mit sonnendurchfluteten Glanzlichtern oben und tiefem Dschungelschatten unten.
* **Mehrschichtiger, lebendiger 3D-Wasserfall:**
  - Schicht 1: Dunkles Sturzwasser im Hintergrund mit Tiefenwirkung.
  - Schicht 2: Rauschende weiße Sturzbäche und Strömungs-Schlieren mit hoher vertikaler Geschwindigkeit.
  - Schicht 3: Aufprallende Gischt & Schaumbällchen am Beckenrand mit sanft aufsteigenden Nebelwolken.
* **3D-plastischer Held Koko im Diddy-Kong / Entdecker-Style (Detailreich & Voll Animiert):**
  - **Skalierung:** Koko ist auf sportliche 1.08x skaliert (`width: 52, height: 58`), damit er agil und passgenau über Hindernisse springt und keine Bananen automatisch vom Boden aufsaugt.
  - **Artikulierte Gliedmaßen & Lauf-/Sprung-Posen:** Echt schwingender Hinter- und Vorderarm mit modellierten Affenhänden & goldenem Maya-Armreif, animierte Hinter- und Vorderbeine mit abgerundeten Affenfüßen & Zehen sowie dynamische Körperneigung beim Sprinten, Springen, Lianen-/Zipline-Hängen und 360°-Salto.
  - **S-förmiger Greifschwanz:** Lebendig mitschwingender Affenschwanz mit eingerollter Spiral-Spitze.
  - **Charakteristischer Entdecker-Look:** Rote Entdecker-Kappe mit goldenem Maya-Emblem, cooler Fliegerbrille (Goggles) auf der Stirn, flatternden roten Stirnband-Bändern im Fahrtwind, kleiner rot-goldener Entdecker-Weste und grünem Mini-Expeditionsrucksack mit gerollter Schatzkarte.
  - **Ausdrucksstarkes Affengesicht:** Herzförmige helle Gesichtsmaske (`#fef3c7`), plastische 3D-Schnauze mit Nasenlöchern, lebendige Mimik (fröhliches Lächeln beim Laufen, begeistertes „O"-Staunen beim Salto/Flug), große glänzende Augen mit doppelten Lichtreflexen, abstehende Ohren und flauschiger Haarschopf.
  - **Dynamischer Schlagschatten:** Weiche Schatten-Ellipse unter Koko auf den Plattformen für echte Bodenhaftung.

---

## 6. Level-Progression, 10 Chunk-Typen & Volles Abwechslungs-Paket (0 bis 3.000m)

Damit es zu keinem Zeitpunkt eintönig wird, kombiniert der Level-Generator **10 abwechslungsreiche Chunk-Archetypen** mit einem Anti-Wiederholungs-Filter (`pickVariedChunk`), einem **strengen Kanonen-Cooldown (`chunksSinceLastBarrel >= 9`, nur ca. 1 Kanone alle 300m)** sowie **lebendigen Gegnern**:

### Die 4 neuen Abwechslungs-Abschnitte, Skill-Herzen & Lebendigen Gegner:
1. **Zweistöckige & Dreistöckige Baumkronen-Ebenen (`canopy_tiers` + Skill-Herzen):**
   - Unten lauert die Gefahr, oben führen Bambus-Baumhaus-Decks mit Diamant-Bananen entlang (erreichbar per Doppelsprung).
   - **1x pro Zone:** Ein zusätzliches 3. Gipfel-Deck (`groundY - 242`) trägt ein **Goldenes Maya-Skill-Herz** (+1 verlorenes Leben zurückgewinnen, erfordert präzises Hochklettern über die Baumkronen mit Doppel-Salto!).
2. **Kinderleicht treffbare Dschungel-Seilrutsche (`zipline_rush`):**
   - Breite Anlauf-Plattform (`190px`), tiefer gesetzter Seil-Einstieg (`groundY - 98`) mit pulsierendem Zielring (`"🚡 SEILBAHN!"`) und großer magnetischer Fangbereich (`92px` Radius auch während des Aufwärtssprungs!).
3. **Wasser-Geysire (`geyser_islands`):**
   - Sprudelnde Wasserfontänen zwischen Felsinseln katapultieren Koko bei Kontakt im hohen Bogen (`vy = -680`) in den Himmel und laden den Doppelsprung neu auf.
4. **Bröckelnde Hängebrücke (`bridge_collapse`):**
   - Alte Maya-Holzplanken an Seilen wackeln bei Berührung und stürzen kurz hinter Koko in die Tiefe – purer Nervenkitzel!
5. **Lebendige Gegner mit Donkey-Kong Kopf-Bounce (`enemies`):**
   - **Flatternde Tukane (`toucan`)** in der Luft, **rollende Holzfässer (`rolling_barrel`)** auf Plattformen und **schnappende Piranhas (`piranha`)** aus den Abgründen.
   - Springt Koko von oben auf einen Tukan oder ein rollendes Fass, federt er per **Donkey-Kong Kopf-Bounce** (`KOPF-BOUNCE! 🦍💥`) hoch in die Luft, erhält **+10% Boost-Ladung** und lädt seinen Doppelsprung sofort wieder auf!

| Zone & Distanz | Tempo & freigeschaltete Features |
|---|---|
| **Zone 1: Sonnen-Urwald (0 – 600m)** | **Speed 300 (Volles Feuerwerk ab Meter 70):** **Baumkronen-Ebenen bei ~70m**, **Bongo-Pilz bei ~145m**, **Tiki-Kanone bei ~220m**, **Skill-Herz #1 auf Gipfel-Deck bei ~295m**, **Sonic 360°-Wurzel-Looping bei ~370m**, **Zipline-Seilrutsche bei ~445m**, **Wasser-Geysire & Relikt 1 (Versteckules' Goldener Tropenhelm 🪖) bei 520m**! |
| **Zone 2: Affenfelsen (600 – 1200m)** | **Speed 380:** **Bröckelnde Hängebrücke bei ~640m**, **Erster Loren-Rush auf Schienen (`minecart_track`) bei ~720m**, **Indiana-Jones-Steinkugel (780–1.080m)**, **Skill-Herz #2 bei ~880m**, **Goldener Maya-Gong bei ~980m**! |
| **Zone 3: Nebel-Wasserfall & Koloss (1200 – 1800m)** | **Speed 460:** **Tropengewitter** mit Monsun-Regen, Blitzen und Donner. **Skill-Herz #3 bei ~1.410m**, **Relikt 2 (Tschangos Sonnen-Amulett 🧿) bei 1.450m**! **BOSS 1 (1.520–1.750m):** Der monumentale **Maya-Steinkoloss** erwacht! |
| **Zone 4: Maya-Krypten (1800 – 2400m)** | **Speed 550:** Rasante **Lore / Minecart-Strecken**, **Steinkugel 2 (1.980–2.220m)**, **Skill-Herz #4 bei ~2.060m** und **Relikt 3 (Der Heilige Goldene Angelhaken 🪝) bei 2.280m**! |
| **Zone 5: Sonnentempel & Einsturz (2400 – 3000m)** | **Speed 640:** **Skill-Herz #5 bei ~2.630m**, **BOSS 2 (2.760–2.960m): Tempel-Einsturz!** **Bei 3.000m:** **Interaktives 3D-Maya-Kryptex** mit Drehringen, Altar-Lichtstrahlen & offiziellem Geocaching-Finisher-Stempel! |

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
      return "🔒 GESPERRT: Erreiche 4.000m für die Koordinaten! 🔒";
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
* **Sicherheits-Garantie:** Vor Erreichen der 4.000m ist kein Teil-String sichtbar; DevTools-Abfragen vor 4.000m werden durch die Guard-Clause abgewiesen.
* **Interaktives 3D-Maya-Kryptex bei 4.000m:**
  - Koko stoppt vor dem Altar der Götter. Ein 3D-Zylinder mit 3 drehbaren Steinringen (Maya-Glyphen: Sonne, Jaguar, Koko, Schlange, Pico, Tempel) erscheint.
  - Der Spieler rotiert die Ringe per Klick/Tap.
  - Tippen auf "ALTAR ENTSCHLÜSSELN" rotiert die Ringe mit metallisch-steinernem Rattern (`cryptex_spin`), bis alle auf der Sonne einrasten.
  - Eine Lichtstrahl-Explosion (`cryptex_open`) öffnet das Kryptex und enthüllt die Koordinaten, den Angel-Hinweis und das offizielle Geocaching Finisher-Zertifikat mit Screenshot-Aufforderung.

---

## 8. Modulare Dateistruktur & Verantwortlichkeiten

```
c:\Users\flaem\Desktop\Hero\JungleHero\
├── index.html              # HTML5 Shell, Canvas, Glassmorphic HUD, Relikte-HUD, Maya-Kryptex & Finisher-Stempel
├── css/
│   └── style.css           # Glassmorphic HUD, ungeschnittene Avatar-Cards (#FAF6F0), 3D-Kryptex, Finisher-Stempel
├── js/
│   ├── constants.js        # Zonen-Settings, RELICS, BOSS_CONFIG, CRYPTEX_GLYPHS, GAME_CONFIG, _cData & _unlockFinal
│   ├── audio.js            # Polyphoner Web Audio Synthesizer (SFX: Koloss, Einsturz, Relikt, Kryptex, Fanfare)
│   ├── graphics.js         # JungleGraphicsEngine (Maya-Koloss, Tempel-Einsturz, Relikte, Altar-Backdrop, 2.5D Shading)
│   └── game.js             # Engine, Boss State-Machines, Relikt-Sammeln, Kryptex-Interaktion, One-Thumb Gesten
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
2. **Koko Redesign:** 35% vergrößert gerendert (`1.35x`), leuchtend warmes Honigbraun-Fell (`#f59e0b` / `#d97706`), fette 3.2px Kontur.
3. **Pacing & 5-7 Minuten Kalibrierung:** `DIST_SCALE_DIVISOR = 41.5` für 5.5 bis 6.3 Minuten Gesamtdauer bei 4.000m. Zone 1 beginnt bei gemütlichen 280 px/s.
4. **Finalkoordinaten & Hinweis:** `N 50° 09.715 E 012° 07.591` und Hinweis `"Angeln"` fest im Code und Victory-Popup verankert.
5. **Mehrfach-Absturz behoben:** Pelikan Pico landet Koko millimetergenau auf Plattformhöhe (`WORLD_GROUND_Y - player.height`), kontinuierliche Kollisionsprüfung gegen Tunneln, Checkpoint-Spawn überarbeitet (`lastCheckpointDist * 41.5 + 100`) mit garantierter 960px Sicherheits-Runway.
6. **One-Thumb Mobile-Steuerung:** Tippen = Sprung / Fass / Lore; Halten / Swipe-Down = Slide / Ducken / Stomp mit automatischem Deckenschutz.
7. **Plattform-Hilfen:** Coyote-Time (120ms) und Jump-Buffering (150ms) sowie Gefahren-Telegraphing ab Zone 2 implementiert.
8. **Voll adaptive Ausrichtung:** Nahtlose Umschaltung zwischen Querformat (hohe Voraussicht) und Hochformat (automatischer Zoom auf min. 680px Sichtfeld).
9. **Start-Screen & Mobile Viewport Optimierung:** Beseitigung der überlangen Textanleitung zugunsten einer 2-zeiligen, extrem prägnanten Kurz-Einweisung; automatische Skalierung für Mobilgeräte (`@media (max-height: 740px)` und `540px`); `touch-action: pan-y` auf `#start-menu` für verlässliches Scrollen.
10. **Sofort-Start per Touch & Click:** Direkte Event-Verknüpfung (`pointerdown`, `touchend`, `click`) mit `stopPropagation()` auf `#btn-start-game` für verzögerungsfreien Start auf iPhones, iPads und Android; Bereinigung doppelter Funktionsschließungen in `game.js`.
11. **Bananen-Ökonomie & Sprung-Guides:** Bananen liegen nicht mehr auf dem Boden, sondern bilden geschwungene Flugkurven-Guides (`groundY - 65` bis `groundY - 140`) für getimte Sprünge. Ladungsrate auf +1.8% balanciert (~55 Bananen für vollen Frenzy), Diamant-Bananen geben +35%. Kokos Maße auf wendige 52×58px (1.08x) angepasst mit präzisem 28px Sammelradius.
12. **Dynamischer Zone-1-Ablauf (0–800m):** Beseitigung des langweiligen Geradeauslaufens: Einführung des Bongo-Sprungpilzes ab ~180m, erster Donkey Kong Tiki-Kanonen ab ~320m, Wurzel-Rutsche mit Schanze ab ~480m und Lianen-Schwüngen ab ~620m für sofortigen Spielspaß ab Sekunde 1.
13. **Bombastischer Super-Sonic Frenzy:** Koko bleibt während des Frenzy vollständig sichtbar (inklusive 3-fachem Kometen-Schweif & Flammen-Aura statt gelber Ersatzkugel); Vollbild-Speed-Lines und pulsierende goldene Rand-Vignette; Arcade-Smash-Effekt zerschmettert alle getroffenen Hindernisse mit Funkenexplosion, `"SMASH! 💥"`-Popup und Soundeffekt.
14. **Zwei-Phasen Boss-Setpieces:**
    - **Boss 1 (2.080–2.360m):** Der monumentale **Maya-Steinkoloss** erwacht im Wasserfall-Gewitter, warnt per Telegraphen-Bodenmarker und zerschmettert Plattformen mit Fäusten und Schockwellen.
    - **Boss 2 (3.740–3.960m):** **Tempel-Einsturz** kurz vor dem Finale mit kippenden Säulen, Felsregen und rasenden Ketten-Kanonen vor das versiegelte Altartor.
15. **3 Legendäre Versteck-Relikte der Autoren:**
    - Versteckules' Goldener Tropenhelm (740m), Tschangos Sonnen-Amulett (1.950m) und Der Heilige Goldene Angelhaken (3.120m) als Dschungel-Easter-Eggs mit HUD-Anzeige und Jubel-Fanfare.
16. **Interaktives 3D-Maya-Kryptex & Offizieller Finisher-Stempel:**
    - Dreidimensionale rotierbare Steinzylinder am Altar bei 4.000m, Entschlüsselungs-Sound & Altar-Lichtstrahlen.
    - Offizieller "Dschungel-Held" Finisher-Stempel mit unbeschnittenen Versteckules- & Tschango-Karten, gesammelten Relikten, Rang ("Meister-Geocacher der Maya") und Statistiken zum Teilen im Log auf Geocaching.com.
17. **Kanonen-Highlight-Dosierung & Cooldown:**
    - Beseitigung aufeinanderfolgender Kanonen-Passagen durch Einzel-Meilenstein-Flags in Zone 1 (`zone1Milestones`) und einen globalen Kanonen-Cooldown (`chunksSinceLastBarrel >= 3`). Nach jeder Kanonen- oder Bongo-Schlucht folgt garantiert ein sicherer, lückenloser Runway-Abschnitt.
    - Präzisions-Kalibrierung der Ketten-Kanone (`b2.shootSpeed = 560, angle = -0.16`) mit 320px breiter Landeplattform für 100% sichere Landungen.
18. **Garantierter Respawn ohne Absturz ins Leere (`resetGame` & `triggerRescue`):**
    - Kamera-Reset (`camera.x`, `camera.y`) in `resetGame()` vor `ensureChunksAhead()`, sodass die Startplattform nach einem Neustart niemals durch `cleanLimit` gelöscht wird.
    - Bei Pelikan-Rettung (`triggerRescue`) werden vorab generierte Abgründe/Hindernisse ab dem Rettungspunkt sauber gekappt, eine 1.080px lange Sicherheits-Runway nahtlos eingesetzt und die Kamera während des Pelikan-Flugs geschmeidig mitgeführt.
19. **Echter Doppelsprung (360°-Salto) & Klar sichtbare Hänge-Lianen:**
    - Koko beherrscht in der Luft einen echten, jederzeit verlässlichen **Doppelsprung mit 360°-Salto-Animation** (`DOUBLE_JUMP_FORCE = -510`, `flipAngle` + goldener Luftwirbel).
    - Alle Lianen (`grappleAnchors`) werden durch `drawGrappleAnchors()` als echte, sanft im Wind schwingende Dschungel-Lianen von den Baumkronen mit Blättern, goldenem Maya-Greifring und Reichweiten-Indikator (`"🌿 LIANE GREIFEN!"`) gezeichnet.
20. **Komplettes Mobile-UX-Upgrade & Reine One-Button Steuerung:**
    - Dynamischer Mobile-Zoom (`targetVisibleW = 780` im Hochformat, `leadFactor = 0.17`) für deutlich mehr Vorausschau auf dem Smartphone.
    - Überlappungsfreies 2-Zeilen Mobile-HUD (`@media (max-width: 768px)`).
    - **Reine One-Button Jump & Run Steuerung:** Überall auf dem Bildschirm tippen (oder Leertaste/Pfeil-Hoch) = **1x Tippen** für Sprung, Liane, Zipline, Kanone & Loren-Hopp; **2x Tippen** in der Luft für den **360°-Doppelsprung-Salto**. Keine komplizierten Slide-/Duck-Buttons oder Wischgesten – alle Hindernisse sind auf reines Überspringen ausgelegt.
21. **Koko Grafik-Redesign im Diddy-Kong / Entdecker-Style (`drawKoko` in `graphics.js`):**
    - Komplett neu gezeichneter, detailreicher und animierter Held Koko mit artikulierten schwingenden Armen + Händen (inkl. goldenem Maya-Armreif), animierten Beinen + Füßen mit Zehen, S-förmigem Greifschwanz mit Spiral-Spitze, grün-goldenem Mini-Entdeckerrucksack mit Schatzkarte, rot-goldener Entdecker-Weste, herzförmiger Affen-Gesichtsmaske, plastischer 3D-Schnauze mit lebendiger Mimik, flauschigem Haarschopf und roter Entdecker-Kappe mit Fliegerbrille (Goggles) & flatternden Stirnbändern.
22. **Volles Abwechslungs-Paket (10 Chunk-Typen, Frühe Highlights ab 70m & Lebendige Gegner mit Kopf-Bounce):**
    - **Frühere Highlights:** Wurzel-Looping schon ab ~370m (Zone 1), Loren-Rush auf Schienen ab ~720m und Goldener Maya-Gong ab ~980m (Zone 2) sowie Anti-Wiederholungs-Filter (`pickVariedChunk`).
    - **4 neue Level-Abschnitte:** Zweistöckige Baumkronen-Ebenen (`canopy_tiers`), Dschungel-Seilrutsche (`zipline_rush`), Wasser-Geysire (`geyser_islands`) und bröckelnde Hängebrücke (`bridge_collapse`).
    - **Lebendige Gegner & Donkey-Kong Stomp Bounce (`enemies`):** Flatternde Tukane (`toucan`), rollende Fässer (`rolling_barrel`) und springende Piranhas (`piranha`). Ein Sprung von oben auf Tukane oder Fässer katapultiert Koko per **Kopf-Bounce** (`KOPF-BOUNCE! 🦍💥`) hoch in die Luft, lädt den Doppelsprung neu auf und gibt **+10% Boost-Ladung**!
23. **3.000m Komprimierung, Seltene Kanonen, Leichter Seilbahn-Einstieg & Goldene Skill-Herzen:**
    - **Komprimierung auf 3.000m (`TARGET_DISTANCE = 3000`):** 5 knackige Zonen à 600m ohne Längen; Relikte bei 520m, 1.450m und 2.280m; Bosse bei 1.520–1.750m und 2.760–2.960m.
    - **Deutlich weniger Kanonen (`chunksSinceLastBarrel >= 9`):** Zwischen zwei Kanonen-Passagen liegen immer mindestens 9 andere Chunks (~300m), sodass Kanonen echte Highlights bleiben.
    - **Kinderleichter Seilbahn-Einstieg (`zipline_rush`):** Breitere Anlaufplattform (`190px`), tieferer Einstiegspunkt (`groundY - 98`) mit pulsierendem Zielring (`"🚡 SEILBAHN!"`) und großer magnetischer Fangbereich (`92px`), der auch während des Aufwärtssprungs sofort greift.
    - **Seltene Goldene Skill-Herzen (`skillHearts`, `drawSkillHearts`):** 1x pro Zone spawnt auf einem hohen 3. Baumkronen-Gipfeldeck (`groundY - 242`, nur mit präzisem Hochklettern + Doppel-Salto erreichbar) ein Goldenes Maya-Herz, das **+1 verlorenes Herz** (bis max. 3 Herzen) wiederherstellt (oder bei vollen 3 Herzen +50% Boost gibt).
24. **Grafik-Überarbeitung (Boden & Maya-Koloss), Seilbahn-Barriere Beseitigung & WOW-Suchtpaket (Stand: November 2026):**
    - **Massiver, organischer Dschungelboden (Zero Rings):** Vollständiges Entfernen aller merkwürdigen Hänge-Ringe unter den Plattformen! Die Plattformen reichen nun als tiefe, massive Basalt- und Erdklippen bis `y + 260` hinab, verziert mit eingemeißelten antiken Maya-Steinblöcken, organisch geschwungenen Banyan-Wurzeln mit Blatt-Trieben und 3D-Moosballen mit sonnigen Lichtkanten.
    - **Monumentaler Maya-Steinkoloss Overhaul (`drawMayanColossus`):** Vom simplen Kasten zum ehrfurchtgebietenden, skulptierten 3D-Basalt-Titanen mit gestuften Tempel-Schulterstücken, Türkis-Inlays, glühenden Magma-Fugen (`#ef4444`/`#f59e0b`), furchterregenden Rubin-Feueraugen mit Lichtstrahlen, goldener Azteken-Sonnenkrone, scharfen Obsidian-Zähnen, aufsteigenden Glutpartikeln und telegrafiertem Faustschlag mit gewaltigen Bodenschockwellen und Felskratern!
    - **100% faire Seilbahn (`zipline_rush`):** Vollständiges Entfernen des springenden Piranhas aus der Seilbahnschlucht sowie garantierte Kollisions-Immunität während `player.state === "on_zipline"` – kein unfairer Lebensverlust mehr mitten im Seilbahnflug!
    - **Wasserzeichen-Transparenz:** Zurücknahme der Deckkraft der Autoren-Wasserzeichen (`.guardian-wrapper`) von 0.38 auf dezente 0.14 für glasklare Sicht auf das Spielgeschehen.
    - **WOW 1: Flow- & Combo-System:** Dynamischer Multiplikator (`x1` bis `x8`) mit ablaufendem Timer-Balken für Tricks (Doppel-Salto, Bongo-Bounce, Zipline-Rush, Stomp, Kanonenschuss, Gong) und Highscore-Zähler im HUD sowie Highscore-Rängen (Bronze, Silber, Gold, Maya-Sonnengott S+) auf dem Finisher-Stempel.
    - **WOW 2: K-O-K-O Buchstaben-Jagd:** 4 versteckte, 3D-rotierende Gold-Medaillons (K bei ~210m, O bei ~760m, K bei ~1.360m, O bei ~2.180m) mit Live-HUD-Anzeige. Bei 100% K-O-K-O erwacht der legendäre **Gold-Koko** (strahlend goldenes Fell, royal goldene Kappe & Weste, glitzernde Sternchen-Aura) und schaltet das goldene Meistersiegel auf dem Finisher-Stempel frei.
    - **WOW 3: Spektakuläres Raketen-Fass (Jet-Barrel Powerup):** Bei ~1.050m und ~2.480m wartet ein High-Tech Tiki-Raketenfass auf einem Altar. Bei Berührung schießt Koko für 9 Sekunden im Jet-Flug vorwärts (`ROCKET_SPEED = 760`), steigt bei jedem Fingertippen mit lautem Zwillings-Raketenschub empor (`ROCKET_THRUST = -560`), zieht gigantische Flammen- und Rauchfahnen hinter sich her und zerschmettert alle Hindernisse und Gegner mit wuchtigen Explosionen und Schockwellen!
