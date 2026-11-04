/* ==========================================================================
   JUNGLE HERO – MAIN GAME ENGINE (Action-Packed Supersonic Gimmick Engine)
   ========================================================================== */

(function () {
  "use strict";

  // --- 1. DOM SETUP ---
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const distCounterEl = document.getElementById("dist-counter");
  const bananaCountEl = document.getElementById("banana-count");
  const zoneBadgeEl = document.getElementById("zone-badge");
  const boostBarFill = document.getElementById("boost-bar-fill");
  const boostBadge = document.getElementById("boost-badge");
  const zoneBanner = document.getElementById("zone-banner");
  const zoneBannerTitle = document.getElementById("zone-banner-title");
  const zoneBannerSub = document.getElementById("zone-banner-sub");
  const actionPopup = document.getElementById("action-popup");
  const startMenu = document.getElementById("start-menu");
  const btnStartGame = document.getElementById("btn-start-game");
  const gameOverModal = document.getElementById("game-over-modal");
  const btnRetry = document.getElementById("btn-retry");
  const btnRestartZero = document.getElementById("btn-restart-zero");
  const victoryPopup = document.getElementById("victory-popup");
  const finalCoordsEl = document.getElementById("final-coords");
  const btnCopyCoords = document.getElementById("btn-copy-coords");

  const heartEls = [
    document.getElementById("heart-1"),
    document.getElementById("heart-2"),
    document.getElementById("heart-3")
  ];

  const scoreCountEl = document.getElementById("score-count");
  const comboBadgeEl = document.getElementById("combo-badge");
  const comboBarFillEl = document.getElementById("combo-bar-fill");

  const graphics = new JungleGraphicsEngine(canvas, ctx);

  // --- 2. GAME STATE ---
  let isPlaying = false;
  let isGameOver = false;
  let isVictory = false;
  let lastTimestamp = 0;

  let distance = 0;
  let bananasCollected = 0;
  let boostCharge = 0;
  let isSuperSonic = false;
  let superSonicTimer = 0;
  let currentZoneId = 1;
  let lastCheckpointDist = 0;
  let lives = GAME_CONFIG.TOTAL_LIVES;

  // Flow- & Combo-System (Multiplikatoren x1 bis x8, Highscore & Tricks)
  let score = 0;
  let combo = 0;
  let comboTimer = 0;
  let maxCombo = 1;

  // 4 Versteckte K-O-K-O Buchstaben (Schaltet Gold-Koko & Finisher-Siegel frei)
  let kokoLetters = [];
  let kokoCollected = [false, false, false, false];
  let kokoSpawned = [false, false, false, false];

  // Spektakuläres Raketen-Fass (Jet-Barrel Powerup)
  let rocketBarrels = [];
  let rocketSpawned = [false, false];

  // Cinematic Slow-Motion
  let slowmoTimer = 0;
  let timeScale = 1.0;
  let lightningCooldown = 5.2;

  // Held Koko (Sportlich & schlank für präzise Steuerung & mobile Sichtbarkeit)
  const player = {
    x: 100,
    y: 350,
    vx: GAME_CONFIG.BASE_SPEED,
    vy: 0,
    width: 52,
    height: 58,
    state: "running", // "running", "jumping", "sliding", "in_barrel", "barrel_flying", "grapple_swing", "in_loop", "in_minecart", "in_rocket", "rescued"
    isGrounded: false,
    doubleJumpAvailable: true, // Echter Doppelsprung in der Luft
    isDoubleJumping: false,    // Aktiv während des 360°-Saltos
    flipAngle: 0,              // Rotationswinkel für den 360°-Salto
    slideTimer: 0,
    isMinecartDucking: false,
    minecartDuckTimer: 0,
    jumpHeld: false,
    invulnerableTimer: 0,
    barrelCooldown: 0,
    activeBarrel: null,
    speechBubble: null,
    speechTimer: 0,
    loopProgress: 0,
    currentLoop: null,
    rocketTimer: 0,
    isGoldKoko: false,
    coyoteTimer: 0,      // 0.12s Puffer nach Kanten-Verlassen für faire Sprünge
    jumpBufferTimer: 0   // 0.15s Puffer vor der Landung (Pre-Jump)
  };

  // One-Thumb Mobile Touch State (Tippen = Sprung, Halten = Turbo-Slide / Ducken)
  const touchState = {
    isDown: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    isHoldingSlide: false
  };

  // Lianen-Peitsche (Grapple Hook)
  const grappleHook = {
    active: false,
    anchorX: 0,
    anchorY: 0,
    length: 160,
    angle: -0.8,
    angleVel: 0
  };

  // Indiana Jones Riesen-Steinkugel (Giant Boulder)
  const giantBoulder = {
    active: false,
    x: -300,
    y: 400,
    radius: GAME_CONFIG.BOULDER_RADIUS,
    speed: 0,
    rotation: 0,
    endDistance: 0
  };

  // Dynamische Kamera mit Screen Shake
  const camera = {
    x: 0,
    y: 0,
    scale: 1,
    shake: 0
  };

  // Pelikan Pico
  const pelican = {
    active: false,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    timer: 0
  };

  // Welt-Objekte
  let chunks = [];
  let bananas = [];
  let barrels = [];
  let hazards = [];
  let bongoPads = [];
  let mayaGongs = [];
  let grappleAnchors = [];
  let minecartStarters = [];
  let ziplines = [];
  let geysers = [];
  let enemies = [];
  let skillHearts = [];
  let coconuts = [];
  let coconutTimer = 4.0;
  let zoneHeartSpawned = { 1: false, 2: false, 3: false, 4: false, 5: false };
  let lastChunkEndX = 0;
  let lastChunkType = "runway";
  let recentChunkTypes = [];
  let chunksSinceLastBarrel = 99;
  let zone1Milestones = {
    canopy1: false,
    bongo1: false,
    barrel1: false,
    loop1: false,
    zipline1: false,
    geyser1: false
  };
  let zone2Milestones = {
    bridge1: false,
    minecart1: false,
    gong1: false
  };

  // 3 Legendäre Autoren-Relikte, Wiederholte Maya-Stelen & Kryptex-Zustand
  let relics = [];
  let mayaSteles = [];
  let discoveredGlyphs = [false, false, false];
  let failedCryptexAttempts = 0;
  const colossus = {
    active: false,
    x: 0,
    riseY: 120,
    fistState: "idle", // "idle", "warning", "slam"
    targetX: 0,
    fistY: -300,
    slamProgress: 0,
    attackTimer: 1.2,
    hitSoundPlayed: false
  };
  const templeCollapse = {
    active: false,
    pillars: [],
    fallingRocks: [],
    spawnTimer: 0.3
  };
  let cryptexRings = [0, 2, 4];
  let cryptexUnlocked = false;

  const WORLD_GROUND_Y = 460;

  // --- 3. RESIZE & VOLL ADAPTIVER KAMERA-ZOOM (HOCHFORMAT & QUERFORMAT) ---
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const logicalW = window.innerWidth;
    const logicalH = window.innerHeight;
    const isPortrait = logicalH > logicalW;

    if (isPortrait) {
      // Hochformat (Handy): 780px Welt-Voraussicht für viel besseren Überblick nach vorne!
      const targetVisibleW = 780;
      camera.scale = Math.min(1.0, logicalW / targetVisibleW);
    } else {
      // Querformat: Breites Sichtfeld für maximale Voraussicht
      const targetVisibleW = Math.max(900, logicalW * 0.95);
      camera.scale = Math.min(1.08, logicalW / targetVisibleW);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => {
    setTimeout(resize, 100);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
  }
  resize();

  // --- 4. SPRECHBLASEN & POPUP HELPER ---
  function showSpeechBubble(text, duration = 1.4) {
    player.speechBubble = text;
    player.speechTimer = duration;
  }

  function showActionPopup(text) {
    actionPopup.innerText = text;
    actionPopup.classList.add("show");
    clearTimeout(actionPopup._t);
    actionPopup._t = setTimeout(() => {
      actionPopup.classList.remove("show");
    }, 950);
  }

  function showZoneBanner(zone) {
    zoneBannerTitle.innerText = `🌴 ${zone.name.toUpperCase()} 🌴`;
    zoneBannerSub.innerText = zone.desc;
    zoneBanner.classList.add("show");
    clearTimeout(zoneBanner._t);
    zoneBanner._t = setTimeout(() => {
      zoneBanner.classList.remove("show");
    }, 2500);
  }

  // Physikalische Plattformabfrage für rollende Fässer & dynamische Elemente
  function getGroundYAt(x) {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      if (x >= c.x - 80 && x <= c.x + c.width + 80) {
        for (let j = 0; j < c.platforms.length; j++) {
          const p = c.platforms[j];
          if (p.isLooping || (p.isBridge && (p.dropY || 0) > 26)) continue;
          if (p.isSlope) {
            if (x >= p.x && x <= p.endX) {
              const ratio = (x - p.x) / (p.endX - p.x);
              return p.y + ratio * (p.endY - p.y);
            }
          } else if (x >= p.x && x <= p.x + p.width) {
            return p.y + (p.dropY || 0);
          }
        }
      }
    }
    return null;
  }

  function updateLivesHUD() {
    for (let i = 0; i < 3; i++) {
      if (i < lives) {
        heartEls[i].classList.remove("lost");
      } else {
        heartEls[i].classList.add("lost");
      }
    }
  }

  // --- 4b. FLOW-, COMBO- & HIGHSCORE-SYSTEM ---
  function addScore(pts) {
    const mult = Math.max(1, combo);
    const earned = pts * mult;
    score += earned;
    if (scoreCountEl) scoreCountEl.innerText = score.toLocaleString();
    return earned;
  }

  function triggerTrick(name, basePts = 150) {
    combo = Math.min(8, combo + 1);
    maxCombo = Math.max(maxCombo, combo);
    comboTimer = GAME_CONFIG.COMBO_TIMEOUT || 3.5;

    jungleAudio.playSFX("combo_up");
    const earned = addScore(basePts);

    if (comboBadgeEl) {
      comboBadgeEl.innerText = `x${combo}`;
      comboBadgeEl.classList.remove("pop");
      void comboBadgeEl.offsetWidth; // re-flow
      comboBadgeEl.classList.add("pop");
    }
    if (comboBarFillEl) comboBarFillEl.style.width = "100%";

    showActionPopup(`🎯 ${name} x${combo} (+${earned})`);
  }

  function updateBoostHUD() {
    boostBarFill.style.width = Math.min(100, boostCharge) + "%";
    const boostTitleEl = document.getElementById("boost-title");
    if (isSuperSonic) {
      boostBarFill.classList.add("frenzy");
      boostBadge.style.display = "block";
      if (boostTitleEl) boostTitleEl.innerText = "🔥 SUPER-SONIC!";
    } else {
      boostBarFill.classList.remove("frenzy");
      boostBadge.style.display = "none";
      if (boostTitleEl) boostTitleEl.innerText = "⚡ BANANEN-BOOST";
    }
  }

  // --- 5. LEVEL GENERATOR MIT MAXIMALER ABWECHSLUNG (3.000m KOMPRIMIERT & SKILL-HERZEN!) ---
  function pickVariedChunk(pool) {
    // Filtert Typen heraus, die in den letzten 3 Abschnitten schon vorkamen oder Cooldown haben
    const valid = pool.filter(t => {
      // KANONEN SELTEN HALTEN: Mindestens 9 Chunks (~300m) Pause zwischen zwei Kanonen!
      if (t === "barrel_cascade" && chunksSinceLastBarrel < 9) return false;
      if (t !== "runway" && recentChunkTypes.includes(t)) return false;
      return true;
    });
    if (valid.length === 0) return "runway";
    return valid[Math.floor(Math.random() * valid.length)];
  }

  function spawnChunk(startX) {
    const groundY = WORLD_GROUND_Y;
    const approxMeter = startX / (GAME_CONFIG.DIST_SCALE_DIVISOR || 41.5);
    let type = "runway";
    let spawnSkillHeartHere = false;

    // 1x PRO ZONE: SELTENES GOLDENES SKILL-HERZ AUF HOHER BAUMKRONEN-EBENE!
    const heartTargetMeters = { 1: 295, 2: 880, 3: 1410, 4: 2060, 5: 2630 };
    if (!zoneHeartSpawned[currentZoneId] && approxMeter >= (heartTargetMeters[currentZoneId] || 300)) {
      type = "canopy_tiers";
      spawnSkillHeartHere = true;
      zoneHeartSpawned[currentZoneId] = true;
    } else if (currentZoneId === 1) {
      // Zone 1 (0–600m): Alle ~75m ein neues spektakuläres Highlight!
      if (approxMeter >= 70 && !zone1Milestones.canopy1) {
        type = "canopy_tiers";
        zone1Milestones.canopy1 = true;
      } else if (approxMeter >= 145 && !zone1Milestones.bongo1) {
        type = "bongo_sky";
        zone1Milestones.bongo1 = true;
      } else if (approxMeter >= 220 && !zone1Milestones.barrel1) {
        type = "barrel_cascade";
        zone1Milestones.barrel1 = true;
        chunksSinceLastBarrel = 99;
      } else if (approxMeter >= 370 && !zone1Milestones.loop1) {
        type = "looping_run";
        zone1Milestones.loop1 = true;
      } else if (approxMeter >= 445 && !zone1Milestones.zipline1) {
        type = "zipline_rush";
        zone1Milestones.zipline1 = true;
      } else if (approxMeter >= 520 && !zone1Milestones.geyser1) {
        type = "geyser_islands";
        zone1Milestones.geyser1 = true;
      } else if (approxMeter > 100 && lastChunkType === "runway") {
        type = pickVariedChunk(["canopy_tiers", "slide_ramp", "bongo_sky", "zipline_rush", "geyser_islands"]);
      } else {
        type = "runway";
      }
    } else if (currentZoneId === 2) {
      // Zone 2 (600–1200m): Hängebrücke bei 640m, Lore bei 720m, Maya-Gong bei 980m!
      if (approxMeter >= 635 && !zone2Milestones.bridge1) {
        type = "bridge_collapse";
        zone2Milestones.bridge1 = true;
      } else if (approxMeter >= 720 && !zone2Milestones.minecart1) {
        type = "minecart_track";
        zone2Milestones.minecart1 = true;
      } else if (approxMeter >= 980 && !zone2Milestones.gong1) {
        type = "temple_gong";
        zone2Milestones.gong1 = true;
      } else {
        type = pickVariedChunk([
          "canopy_tiers", "zipline_rush", "geyser_islands", "bridge_collapse",
          "looping_run", "minecart_track", "temple_gong", "slide_ramp",
          "bongo_sky", "barrel_cascade", "runway"
        ]);
      }
    } else if (currentZoneId === 3) {
      // Zone 3 (1200–1800m): Nebel-Wasserfall, Geysire, Ziplines, Loopings & Steinkoloss-Boss!
      type = pickVariedChunk([
        "geyser_islands", "zipline_rush", "looping_run", "canopy_tiers",
        "bridge_collapse", "bongo_sky", "temple_gong", "barrel_cascade", "runway"
      ]);
    } else if (currentZoneId === 4) {
      // Zone 4 (1800–2400m): Maya-Krypten, Loren-Achterbahn, Hängebrücken & Gongs!
      type = pickVariedChunk([
        "minecart_track", "bridge_collapse", "canopy_tiers", "temple_gong",
        "zipline_rush", "looping_run", "slide_ramp", "geyser_islands", "runway"
      ]);
    } else {
      // Zone 5 (2400–3000m): Goldener Sonnentempel – Großes Finale mit allen Highlights!
      type = pickVariedChunk([
        "minecart_track", "looping_run", "zipline_rush", "canopy_tiers",
        "bridge_collapse", "geyser_islands", "temple_gong", "barrel_cascade", "runway"
      ]);
    }

    // STRENGER COOLDOWN & SICHERHEITS-GARANTIE:
    // 1. Nach einer Kanonen- oder Bongo-Schlucht folgt IMMER ein sicherer Runway- oder Baumkronen-Abschnitt!
    if (!spawnSkillHeartHere && (lastChunkType === "barrel_cascade" || lastChunkType === "bongo_sky")) {
      type = Math.random() < 0.5 ? "runway" : "canopy_tiers";
    }
    // 2. Zwischen zwei Kanonen-Passagen müssen IMMER mindestens 9 andere Abschnitte (~300m) liegen!
    if (type === "barrel_cascade" && chunksSinceLastBarrel < 9) {
      type = pickVariedChunk(["canopy_tiers", "zipline_rush", "slide_ramp", "runway"]);
    }

    if (type === "barrel_cascade") {
      chunksSinceLastBarrel = 0;
    } else {
      chunksSinceLastBarrel++;
    }
    lastChunkType = type;
    if (type !== "runway") {
      recentChunkTypes.push(type);
      if (recentChunkTypes.length > 3) recentChunkTypes.shift();
    }

    const chunk = {
      type,
      x: startX,
      width: 0,
      platforms: []
    };

    if (type === "runway") {
      const w = 520 + Math.random() * 160;

      // MEHR LÖCHER & SCHLUCHTEN: Ab 80m kein reines Durchlaufen mehr – getimte Sprünge über Abgründe!
      const hasChasm = approxMeter > 80 && Math.random() < 0.65;
      if (hasChasm) {
        const plat1W = 160 + Math.random() * 50;
        const gapW = 105 + Math.random() * 25; // 105–130px fair überspringbar
        const plat2W = Math.max(160, w - plat1W - gapW);
        chunk.width = plat1W + gapW + plat2W;

        chunk.platforms.push({ x: startX, y: groundY, width: plat1W, height: 42, isSlide: false, isRail: false });
        chunk.platforms.push({ x: startX + plat1W + gapW, y: groundY, width: plat2W, height: 42, isSlide: false, isRail: false });

        // Bananen-Bogen als Sprung-Guide über die Schlucht (3 Früchte)
        for (let i = 0; i < 3; i++) {
          const ratio = i / 2;
          bananas.push({
            x: startX + plat1W + 18 + i * 36,
            y: groundY - 65 - Math.sin(ratio * Math.PI) * 60,
            collected: false,
            isDiamond: (Math.random() < 0.12 && currentZoneId >= 2)
          });
        }

        // Hänge-Liane als alternative Luft-Passage
        if (Math.random() < 0.35) {
          grappleAnchors.push({
            x: startX + plat1W + gapW * 0.5,
            y: groundY - 170
          });
        }

        // Gegner oder Dornen auf dem 2. Plattformteil
        if (Math.random() < 0.6) {
          if (Math.random() < 0.45) {
            hazards.push({
              x: startX + plat1W + gapW + plat2W * 0.55,
              y: groundY - 12,
              width: 38,
              height: 22,
              type: "thorns_bush"
            });
          } else {
            const isBarrel = Math.random() < 0.5;
            enemies.push({
              type: isBarrel ? "rolling_barrel" : "toucan",
              x: startX + plat1W + gapW + plat2W * 0.65,
              y: isBarrel ? groundY - 20 : groundY - 58,
              baseY: isBarrel ? groundY - 20 : groundY - 58,
              vx: isBarrel ? -95 : -80,
              width: 42,
              height: isBarrel ? 40 : 32,
              radius: 20,
              vy: 0,
              stomped: false,
              defeated: false
            });
          }
        }
      } else {
        chunk.width = w;
        chunk.platforms.push({ x: startX, y: groundY, width: w, height: 42, isSlide: false, isRail: false });

        // Bananen in moderaten Bögen (3 Früchte, 25% reduziert)
        if (Math.random() < 0.6) {
          const bCount = 3;
          const arcBaseX = startX + 110 + Math.random() * Math.max(20, w - 240);
          for (let i = 0; i < bCount; i++) {
            const ratio = i / (bCount - 1);
            bananas.push({
              x: arcBaseX + i * 38,
              y: groundY - 65 - Math.sin(ratio * Math.PI) * 75,
              collected: false,
              isDiamond: (Math.random() < 0.14 && currentZoneId >= 1)
            });
          }

          if (approxMeter > 100 && Math.random() < 0.35) {
            grappleAnchors.push({
              x: arcBaseX + 45,
              y: groundY - 175
            });
          }
        }

        // Gegner / Dornen
        if (distance > 90 && Math.random() < 0.6) {
          const enemyRoll = Math.random();
          if (enemyRoll < 0.45) {
            enemies.push({
              type: "toucan",
              x: startX + w * 0.65,
              y: groundY - 62,
              baseY: groundY - 62,
              vx: -75,
              width: 44,
              height: 32,
              stomped: false,
              defeated: false
            });
          } else if (enemyRoll < 0.8) {
            enemies.push({
              type: "rolling_barrel",
              x: startX + w * 0.68,
              y: groundY - 20,
              vx: -95,
              width: 40,
              height: 40,
              radius: 20,
              rot: 0,
              stomped: false,
              defeated: false
            });
          } else {
            hazards.push({
              x: startX + w * 0.55,
              y: groundY - 12,
              width: 42,
              height: 22,
              type: "thorns_bush"
            });
          }
        }
      }
    } else if (type === "canopy_tiers") {
      // BAUMKRONEN-DOPPELDECKER (Jetzt mit Boden-Schlucht: Springen oder Klettern Pflicht!)
      const w = spawnSkillHeartHere ? 760 : 680;
      chunk.width = w;

      // Untere Haupt-Ebene mit 115px Boden-Schlucht
      const floor1W = 210;
      const floorGapW = 115;
      const floor2W = Math.max(200, w - floor1W - floorGapW);
      chunk.platforms.push({ x: startX, y: groundY, width: floor1W, height: 42, isSlide: false, isRail: false });
      chunk.platforms.push({ x: startX + floor1W + floorGapW, y: groundY, width: floor2W, height: 42, isSlide: false, isRail: false });

      // Ebene 2: Mittleres Baumhaus-Deck (von unten durchspringbar!)
      const deck1X = startX + 75;
      const deck1Y = groundY - 98;
      chunk.platforms.push({ x: deck1X, y: deck1Y, width: 220, height: 26, isTreehouse: true, isSlide: false, isRail: false });

      for (let i = 0; i < 3; i++) {
        bananas.push({
          x: deck1X + 40 + i * 52,
          y: deck1Y - 40,
          collected: false,
          isDiamond: false
        });
      }

      // Ebene 3: Hohes Baumkronen-Deck mit garantiertem Diamant-Bananen-Jackpot!
      const deck2X = startX + 325;
      const deck2Y = groundY - 168;
      chunk.platforms.push({ x: deck2X, y: deck2Y, width: 235, height: 26, isTreehouse: true, isSlide: false, isRail: false });

      for (let i = 0; i < 4; i++) {
        bananas.push({
          x: deck2X + 35 + i * 48,
          y: deck2Y - 42,
          collected: false,
          isDiamond: (i === 2)
        });
      }

      // WENN DIESER CHUNK DAS SELTENE SKILL-HERZ DER ZONE TRÄGT:
      // Ebene 4 (Schwer erreichbares Gipfel-Deck auf groundY - 242, erfordert präzisen Doppelsprung vom oberen Baumhaus!)
      if (spawnSkillHeartHere) {
        const deck3X = startX + 520;
        const deck3Y = groundY - 242;
        chunk.platforms.push({ x: deck3X, y: deck3Y, width: 175, height: 26, isTreehouse: true, isSlide: false, isRail: false });

        skillHearts.push({
          x: deck3X + 88,
          y: deck3Y - 36,
          collected: false
        });
      }

      // Unten rollt ein Tiki-Fass oder fliegt ein Tukan vorbei
      const isBarrel = Math.random() < 0.5;
      enemies.push({
        type: isBarrel ? "rolling_barrel" : "toucan",
        x: startX + 430,
        y: isBarrel ? groundY - 20 : groundY - 58,
        baseY: groundY - 58,
        vx: isBarrel ? -90 : -75,
        width: 42,
        height: 36,
        radius: 20,
        rot: 0,
        stomped: false,
        defeated: false
      });
    } else if (type === "zipline_rush") {
      // NEU 2: SEILBAHN / ZIPLINE – LEICHT ZU TREFFEN DANK BREITER STARTPLATTFORM & TIEFEREM EINSTIEG!
      const w = 720;
      chunk.width = w;

      // Breite Anlauf-Plattform (190px) mit kleiner Absprung-Hilfe am Ende
      chunk.platforms.push({ x: startX, y: groundY, width: 190, height: 42, isSlide: false, isRail: false });

      // Das Seil startet direkt über dem Ende der Anlauf-Plattform auf optimaler Sprunghöhe (groundY - 98)!
      const zipX1 = startX + 145;
      const zipY1 = groundY - 98;
      const zipX2 = startX + 525;
      const zipY2 = groundY - 46;

      ziplines.push({
        x1: zipX1,
        y1: zipY1,
        x2: zipX2,
        y2: zipY2
      });

      // Bananen-Spur exakt entlang der Zipline
      for (let i = 0; i < 6; i++) {
        const t = (i + 0.5) / 6;
        bananas.push({
          x: zipX1 + (zipX2 - zipX1) * t,
          y: zipY1 + (zipY2 - zipY1) * t + 28,
          collected: false,
          isDiamond: (i === 4)
        });
      }

      // Garantiert 100% faire Zipline-Fahrt OHNE Hindernis-Barriere im Flug!
      chunk.platforms.push({ x: startX + 485, y: groundY, width: 235, height: 42, isSlide: false, isRail: false });
    } else if (type === "geyser_islands") {
      // NEU 3: WASSER-GEYSIRE & FELSENINSEL-HÜPFEN!
      const w = 680;
      chunk.width = w;

      chunk.platforms.push({ x: startX, y: groundY, width: 120, height: 42, isSlide: false, isRail: false });

      // Geysir 1
      geysers.push({
        x: startX + 195,
        y: groundY + 25,
        height: 155
      });

      // Mittlere Felseninsel (etwas erhöht)
      chunk.platforms.push({ x: startX + 260, y: groundY - 28, width: 130, height: 38, isSlide: false, isRail: false });

      // Geysir 2
      geysers.push({
        x: startX + 450,
        y: groundY + 25,
        height: 165
      });

      for (let i = 0; i < 5; i++) {
        const ratio = i / 4;
        bananas.push({
          x: startX + 170 + i * 75,
          y: groundY - 125 - Math.sin(ratio * Math.PI) * 55,
          collected: false,
          isDiamond: (i === 2)
        });
      }

      chunk.platforms.push({ x: startX + 510, y: groundY, width: 170, height: 42, isSlide: false, isRail: false });
    } else if (type === "bridge_collapse") {
      // NEU 4: KRACHENDE HOLZ-HÄNGEBRÜCKE ÜBER DIE SCHLUCHT!
      const w = 640;
      chunk.width = w;

      chunk.platforms.push({ x: startX, y: groundY, width: 100, height: 42, isSlide: false, isRail: false });

      // 6 einzeln einstürzende Holzbrücken-Segmente
      for (let i = 0; i < 6; i++) {
        const sag = Math.sin((i / 5) * Math.PI) * 14;
        chunk.platforms.push({
          x: startX + 100 + i * 65,
          y: groundY + sag,
          width: 65,
          height: 20,
          isBridge: true,
          triggered: false,
          dropTimer: 0,
          dropY: 0,
          isSlide: false,
          isRail: false
        });
      }

      for (let i = 0; i < 4; i++) {
        const ratio = i / 3;
        bananas.push({
          x: startX + 165 + i * 75,
          y: groundY - 75 - Math.sin(ratio * Math.PI) * 55,
          collected: false,
          isDiamond: (i === 2)
        });
      }

      // Tieffliegender Tukan über der Hängebrücke zum Draufspringen-Bouncen!
      enemies.push({
        type: "toucan",
        x: startX + 360,
        y: groundY - 68,
        baseY: groundY - 68,
        vx: -70,
        width: 44,
        height: 32,
        stomped: false,
        defeated: false
      });

      chunk.platforms.push({ x: startX + 490, y: groundY, width: 150, height: 42, isSlide: false, isRail: false });
    } else if (type === "barrel_cascade") {
      // HIGHLIGHT TIKI-FASS-KANONE (Präzise Flugbahn & breite Landeplattform!)
      const w = 780;
      chunk.width = w;

      chunk.platforms.push({ x: startX, y: groundY, width: 120, height: 42, isSlide: false, isRail: false });

      // Fass 1 (Rotierendes Ziel-Fass, zentriert auf Fass 2)
      const b1X = startX + 185;
      const b1Y = groundY - 60;
      barrels.push({
        x: b1X,
        y: b1Y,
        radius: 30,
        angle: -0.30,
        angleSpeed: currentZoneId === 1 ? 1.15 : 1.55,
        isAuto: false,
        cooldown: 0
      });

      // Fass 2 (Auto-Fire Ketten-Fass – kalibriert für punktgenaue Landung auf der End-Plattform!)
      const b2X = startX + 380;
      const b2Y = groundY - 115;
      barrels.push({
        x: b2X,
        y: b2Y,
        radius: 32,
        angle: -0.16,
        shootSpeed: 560,
        angleSpeed: 0,
        isAuto: true,
        cooldown: 0
      });

      for (let i = 1; i <= 3; i++) {
        bananas.push({ x: b1X + i * 48, y: b1Y - 18 - i * 14, collected: false, isDiamond: (i === 2) });
      }

      // Krokodil unter der Schlucht
      hazards.push({
        x: startX + 280,
        y: groundY + 80,
        width: 80,
        height: 28,
        type: "crocodile"
      });

      // Extra breite, sichere Landeplattform (460 bis 780 = 320px breit!)
      chunk.platforms.push({ x: startX + 460, y: groundY, width: 320, height: 42, isSlide: false, isRail: false });
    } else if (type === "slide_ramp") {
      // Wurzel-Rutsche mit Schanze am Ende
      const w = 580;
      chunk.width = w;
      const slopeStartX = startX;
      const slopeStartY = groundY - 80;
      const slopeEndX = startX + 410;
      const slopeEndY = groundY + 30;

      chunk.platforms.push({
        x: slopeStartX,
        y: slopeStartY,
        endX: slopeEndX,
        endY: slopeEndY,
        width: 410,
        isSlide: true,
        isSlope: true,
        isRail: false
      });

      // Kick-Schanze
      chunk.platforms.push({
        x: slopeEndX,
        y: slopeEndY - 16,
        width: 100,
        height: 30,
        isSlide: false,
        isKicker: true,
        isRail: false
      });

      for (let i = 0; i < 6; i++) {
        const ratio = i / 5;
        bananas.push({
          x: slopeStartX + ratio * 410,
          y: slopeStartY + ratio * 110 - 26,
          collected: false,
          isDiamond: (i === 3 && Math.random() < 0.25)
        });
      }

      chunk.platforms.push({
        x: startX + 460,
        y: groundY,
        width: 120,
        height: 40,
        isSlide: false,
        isRail: false
      });
    } else if (type === "minecart_track") {
      // LORE / MINECART-RUSH AUF SCHIENEN
      const w = 780;
      chunk.width = w;

      chunk.platforms.push({ x: startX, y: groundY, width: 120, height: 38, isSlide: false, isRail: true });

      minecartStarters.push({
        x: startX + 60,
        y: groundY - 28,
        active: true
      });

      chunk.platforms.push({
        x: startX + 120,
        y: groundY,
        width: 200,
        height: 38,
        isSlide: false,
        isRail: true,
        isBoostRail: true
      });

      for (let i = 0; i < 4; i++) {
        bananas.push({
          x: startX + 140 + i * 45,
          y: groundY - 70,
          collected: false,
          isDiamond: (i === 2 && Math.random() < 0.35)
        });
      }

      // Schienen-Lücke über Abgrund: Loren-Hopp (1x oder 2x Tippen)!
      const rail2X = startX + 380;
      chunk.platforms.push({
        x: rail2X,
        y: groundY,
        width: 220,
        height: 38,
        isSlide: false,
        isRail: true
      });

      for (let i = 0; i < 3; i++) {
        bananas.push({
          x: rail2X + 40 + i * 48,
          y: groundY - 65 - Math.sin((i / 2) * Math.PI) * 45,
          collected: false,
          isDiamond: false
        });
      }

      chunk.platforms.push({
        x: rail2X + 220,
        y: groundY - 14,
        width: 90,
        height: 32,
        isSlide: false,
        isRail: true,
        isKicker: true
      });

      chunk.platforms.push({
        x: startX + 710,
        y: groundY,
        width: 90,
        height: 42,
        isSlide: false,
        isRail: false
      });
    } else if (type === "looping_run") {
      // Sonic 360° Looping
      const w = 620;
      chunk.width = w;
      const loopRadius = 85;

      chunk.platforms.push({ x: startX, y: groundY, width: 120, height: 42, isSlide: false, isRail: false });

      chunk.platforms.push({
        x: startX + 130,
        y: groundY - loopRadius * 2 + 10,
        radius: loopRadius,
        isLooping: true,
        isRail: false
      });

      for (let a = 0; a < 6; a++) {
        const rad = (a / 6) * Math.PI * 2;
        bananas.push({
          x: startX + 130 + loopRadius + Math.cos(rad) * (loopRadius - 16),
          y: groundY - loopRadius + Math.sin(rad) * (loopRadius - 16),
          collected: false,
          isDiamond: (a === 3)
        });
      }

      chunk.platforms.push({ x: startX + 320, y: groundY, width: 300, height: 42, isSlide: false, isRail: false });
    } else if (type === "bongo_sky") {
      const w = 540;
      chunk.width = w;
      chunk.platforms.push({ x: startX, y: groundY, width: 100, height: 42, isSlide: false, isRail: false });

      bongoPads.push({
        x: startX + 180,
        y: groundY + 14,
        radius: 32
      });

      grappleAnchors.push({
        x: startX + 270,
        y: groundY - 190
      });

      for (let i = 0; i < 5; i++) {
        const rad = (i / 4) * Math.PI;
        bananas.push({
          x: startX + 180 + Math.cos(rad - Math.PI / 2) * 110,
          y: groundY - 150 - Math.sin(rad) * 100,
          collected: false,
          isDiamond: (i === 2 && currentZoneId >= 3)
        });
      }

      chunk.platforms.push({ x: startX + 360, y: groundY - 45, width: 180, height: 42, isSlide: false, isRail: false });
    } else {
      // temple_gong oder runway
      const w = 580;
      chunk.width = w;
      chunk.platforms.push({ x: startX, y: groundY, width: 170, height: 42, isSlide: false, isRail: false });

      mayaGongs.push({
        x: startX + 230,
        y: groundY - 70,
        radius: 36,
        ringTimer: 0
      });

      chunk.platforms.push({ x: startX + 290, y: groundY, width: 95, height: 24, isSlide: false, isCrumbling: true, isRail: false });
      chunk.platforms.push({ x: startX + 410, y: groundY, width: 170, height: 42, isSlide: false, isRail: false });

      for (let i = 0; i < 4; i++) {
        const gongRatio = i / 3;
        bananas.push({
          x: startX + 300 + i * 44,
          y: groundY - 70 - Math.sin(gongRatio * Math.PI) * 45,
          collected: false,
          isDiamond: (i === 2 && Math.random() < 0.25)
        });
      }
    }

    // K-O-K-O Buchstaben Spawn-Check (4 versteckte Medaillons)
    if (typeof KOKO_LETTERS_CONFIG !== "undefined") {
      KOKO_LETTERS_CONFIG.forEach((cfg, idx) => {
        if (!kokoSpawned[idx] && approxMeter >= cfg.meter && approxMeter < cfg.meter + 110) {
          kokoSpawned[idx] = true;
          kokoLetters.push({
            index: idx,
            char: cfg.char,
            x: startX + 220,
            y: groundY - 130,
            collected: false,
            width: 44,
            height: 44
          });
        }
      });
    }

    // Raketen-Fass (Jet-Barrel) Spawn-Check
    if (typeof ROCKET_BARREL_METERS !== "undefined") {
      ROCKET_BARREL_METERS.forEach((meter, idx) => {
        if (!rocketSpawned[idx] && approxMeter >= meter && approxMeter < meter + 120) {
          rocketSpawned[idx] = true;
          rocketBarrels.push({
            index: idx,
            x: startX + 190,
            y: groundY - 48,
            collected: false,
            width: 48,
            height: 48
          });
        }
      });
    }

    chunks.push(chunk);
    lastChunkEndX = startX + chunk.width;
  }

  function ensureChunksAhead() {
    const viewAhead = camera.x + window.innerWidth / camera.scale + 950;
    while (lastChunkEndX < viewAhead) {
      // Keine Lücke direkt nach Kanonen-, Bongo- oder Rettungs-Abschnitten!
      const allowSmallGap = (lastChunkType === "runway" && Math.random() < 0.16);
      spawnChunk(lastChunkEndX + (allowSmallGap ? 36 : 0));
    }

    const cleanLimit = camera.x - 700;
    chunks = chunks.filter(c => (c.x + c.width) > cleanLimit);
    bananas = bananas.filter(b => b.x > cleanLimit);
    barrels = barrels.filter(b => b.x > cleanLimit);
    hazards = hazards.filter(h => h.x > cleanLimit);
    bongoPads = bongoPads.filter(p => p.x > cleanLimit);
    mayaGongs = mayaGongs.filter(g => g.x > cleanLimit);
    grappleAnchors = grappleAnchors.filter(a => a.x > cleanLimit);
    minecartStarters = minecartStarters.filter(m => m.x > cleanLimit);
    ziplines = ziplines.filter(z => z.x2 > cleanLimit);
    geysers = geysers.filter(g => g.x > cleanLimit);
    enemies = enemies.filter(e => e.x > cleanLimit && !e.defeated);
    skillHearts = skillHearts.filter(sh => sh.x > cleanLimit && !sh.collected);
    mayaSteles = mayaSteles.filter(s => s.x > cleanLimit || !s.collected);
    kokoLetters = kokoLetters.filter(l => l.x > cleanLimit || !l.collected);
    rocketBarrels = rocketBarrels.filter(r => r.x > cleanLimit || !r.collected);
  }

  // --- 6. RESET & RESPAWN ---
  function resetGame(fullReset = true) {
    jungleAudio.init();
    isGameOver = false;
    isVictory = false;
    gameOverModal.style.display = "none";
    victoryPopup.style.display = "none";

    if (fullReset) {
      distance = 0;
      bananasCollected = 0;
      boostCharge = 0;
      currentZoneId = 1;
      lives = GAME_CONFIG.TOTAL_LIVES;
      lastCheckpointDist = 0;
      player.x = 100;

      // Zone 1, Zone 2 & Skill-Herz Meilensteine zurücksetzen
      zone1Milestones = {
        canopy1: false,
        bongo1: false,
        barrel1: false,
        loop1: false,
        zipline1: false,
        geyser1: false
      };
      zone2Milestones = {
        bridge1: false,
        minecart1: false,
        gong1: false
      };
      zoneHeartSpawned = { 1: false, 2: false, 3: false, 4: false, 5: false };

      // 3 Legendäre Autoren-Relikte & Wiederholte Maya-Stelen initialisieren
      relics = RELICS.map(r => ({
        ...r,
        x: r.meter * (GAME_CONFIG.DIST_SCALE_DIVISOR || 41.5),
        y: r.id === "helmet" ? WORLD_GROUND_Y - 145 : (r.id === "hook" ? WORLD_GROUND_Y - 110 : WORLD_GROUND_Y - 80),
        collected: false
      }));

      mayaSteles = (typeof MAYA_STELES_CONFIG !== "undefined" ? MAYA_STELES_CONFIG : []).map(s => ({
        ...s,
        x: s.meter * (GAME_CONFIG.DIST_SCALE_DIVISOR || 41.5),
        y: WORLD_GROUND_Y,
        collected: false
      }));

      discoveredGlyphs = [false, false, false];
      failedCryptexAttempts = 0;

      // Relikt- & Glyphen-Badges im HUD zurücksetzen (auf gesperrt & Icon + ?)
      const badgeData = [
        { id: "helmet", defaultText: "🪖 ?" },
        { id: "amulet", defaultText: "🧿 ?" },
        { id: "hook", defaultText: "🪝 ?" }
      ];
      badgeData.forEach(item => {
        const b = document.getElementById("relic-hud-" + item.id);
        if (b) {
          b.classList.remove("unlocked");
          b.classList.add("locked");
          b.innerText = item.defaultText;
        }
      });

      const oracleBtn = document.getElementById("btn-oracle-help");
      if (oracleBtn) oracleBtn.style.display = "none";

      coconuts = [];
      coconutTimer = 4.0;
      cryptexRings = [0, 2, 4];
      cryptexUnlocked = false;

      // Flow-Score, Combo, K-O-K-O & Raketen-Status voll zurücksetzen
      score = 0;
      combo = 0;
      comboTimer = 0;
      maxCombo = 1;
      kokoLetters = [];
      kokoCollected = [false, false, false, false];
      kokoSpawned = [false, false, false, false];
      rocketBarrels = [];
      rocketSpawned = [false, false];
      player.isGoldKoko = false;
      player.rocketTimer = 0;

      if (scoreCountEl) scoreCountEl.innerText = "0";
      if (comboBadgeEl) comboBadgeEl.innerText = "x1";
      if (comboBarFillEl) comboBarFillEl.style.width = "0%";
      for (let i = 0; i < 4; i++) {
        const kb = document.getElementById("koko-" + i);
        if (kb) { kb.classList.remove("collected"); kb.classList.add("locked"); }
      }
    } else {
      distance = lastCheckpointDist;
      lives = GAME_CONFIG.TOTAL_LIVES;
      combo = 0;
      comboTimer = 0;
      player.rocketTimer = 0;
      if (comboBadgeEl) comboBadgeEl.innerText = "x1";
      if (comboBarFillEl) comboBarFillEl.style.width = "0%";
      // Aktuelle Zone darf ihr Skill-Herz bei Checkpoint-Neustart nochmal spawnen
      zoneHeartSpawned[currentZoneId] = false;
      // Exakte Umrechnung auf Welt-Koordinaten über DIST_SCALE_DIVISOR (kein Absturz mehr!)
      player.x = lastCheckpointDist * (GAME_CONFIG.DIST_SCALE_DIVISOR || 41.5) + 100;

      // Stelen ab Checkpoint re-aktivieren, falls Glyphe noch nicht entdeckt wurde
      mayaSteles.forEach(s => {
        if (s.meter >= lastCheckpointDist && !discoveredGlyphs[s.ringIndex]) {
          s.collected = false;
        }
      });
    }

    coconuts = [];
    coconutTimer = 4.0;

    lastChunkType = "runway";
    recentChunkTypes = [];
    chunksSinceLastBarrel = 99;

    // Boss- & Pelikan-Zustände zurücksetzen
    pelican.active = false;
    pelican.timer = 0;

    colossus.active = false;
    colossus.fistState = "idle";
    colossus.riseY = 120;
    colossus.attackTimer = 1.2;
    colossus.hitSoundPlayed = false;

    templeCollapse.active = false;
    templeCollapse.pillars = [];
    templeCollapse.fallingRocks = [];

    isSuperSonic = false;
    superSonicTimer = 0;
    slowmoTimer = 0;
    timeScale = 1.0;
    lightningCooldown = 5.2;

    // Koko startet exakt bündig auf der Plattformoberkante (kein Durchfallen!)
    player.y = WORLD_GROUND_Y - player.height;
    player.vx = ZONES[currentZoneId - 1].baseSpeed;
    player.vy = 0;
    player.state = "running";
    player.isGrounded = true;
    player.doubleJumpAvailable = true;
    player.isDoubleJumping = false;
    player.flipAngle = 0;
    player.invulnerableTimer = 3.5;
    player.barrelCooldown = 0;
    player.activeBarrel = null;
    player.activeZipline = null;
    player.speechBubble = null;
    player.speechTimer = 0;
    player.isMinecartDucking = false;
    player.minecartDuckTimer = 0;
    player.coyoteTimer = 0.12;
    player.jumpBufferTimer = 0;

    touchState.isDown = false;
    touchState.isHoldingSlide = false;
    grappleHook.active = false;
    giantBoulder.active = false;

    const mobileHintReset = document.getElementById("mobile-hint");
    if (mobileHintReset) mobileHintReset.style.opacity = "1";

    // KRITISCHER KAMERA-RESET VOR DEM CHUNK-SPAWN (verhindert Löschen der Startplattform nach Tod!)
    const logicalW = window.innerWidth;
    const logicalH = window.innerHeight;
    const isPortrait = logicalH > logicalW;
    const leadFactor = isPortrait ? 0.17 : 0.22;
    camera.x = player.x - (logicalW / camera.scale) * leadFactor;
    camera.y = player.y - (logicalH / camera.scale) * (isPortrait ? 0.62 : 0.54);
    camera.shake = 0;

    chunks = [];
    bananas = [];
    barrels = [];
    hazards = [];
    bongoPads = [];
    mayaGongs = [];
    grappleAnchors = [];
    minecartStarters = [];
    ziplines = [];
    geysers = [];
    enemies = [];
    skillHearts = [];

    // GARANTIERTE SICHERE START-RUNWAY BEIM SPAWN / CHECKPOINT (1080px breit, keine Löcher, keine Hindernisse!)
    const spawnStartX = player.x - 100;
    const initialRunwayW = 1080;
    const spawnChunk = {
      type: "safe_spawn_runway",
      x: spawnStartX,
      width: initialRunwayW,
      platforms: [{ x: spawnStartX, y: WORLD_GROUND_Y, width: initialRunwayW, height: 42, isSlide: false, isRail: false }]
    };
    chunks.push(spawnChunk);
    lastChunkEndX = spawnStartX + initialRunwayW;

    // Erster Tutorial-Sprungbogen (Bananen leiten den ersten Sprung an!)
    const startArcCount = 4;
    for (let i = 0; i < startArcCount; i++) {
      const arcRatio = i / (startArcCount - 1);
      bananas.push({
        x: player.x + 180 + i * 42,
        y: WORLD_GROUND_Y - 65 - Math.sin(arcRatio * Math.PI) * 70,
        collected: false,
        isDiamond: false
      });
    }

    ensureChunksAhead();

    updateLivesHUD();
    updateBoostHUD();
    distCounterEl.innerHTML = `${Math.floor(distance)} <span>/ 3000 m</span>`;
    bananaCountEl.innerText = bananasCollected;
    zoneBadgeEl.innerText = ZONES[currentZoneId - 1].name.toUpperCase();

    isPlaying = true;
  }

  // --- 7. TOUCH-, DAUMEN-BUTTON- & GESTEN-STEUERUNG ---
  function triggerSlowMotion(duration = GAME_CONFIG.SLOWMO_DURATION) {
    slowmoTimer = duration;
    timeScale = GAME_CONFIG.SLOWMO_FACTOR;
  }

  function handleActionJumpOrShoot() {
    if (!isPlaying || isGameOver || isVictory) return;

    // 0. IM RAKETEN-FASS: JETPACK-SCHUB NACH OBEN!
    if (player.state === "in_rocket") {
      player.vy = GAME_CONFIG.ROCKET_THRUST || -560;
      jungleAudio.playSFX("rocket_thrust");
      camera.shake = 5;
      graphics.emitSparks(player.x - 22, player.y + 24, 8);
      return;
    }

    // 1. KANONE ABFEUERN!
    if (player.state === "in_barrel" && player.activeBarrel) {
      const b = player.activeBarrel;
      jungleAudio.playSFX("barrel_shoot");

      camera.shake = 18;
      triggerSlowMotion(0.42);
      graphics.emitBarrelExplosion(b.x, b.y, b.angle);

      const shootSpeed = b.shootSpeed || GAME_CONFIG.BARREL_SHOOT_SPEED;
      player.vx = Math.cos(b.angle) * shootSpeed;
      player.vy = Math.sin(b.angle) * shootSpeed;
      player.state = "barrel_flying";
      player.doubleJumpAvailable = true;
      player.isDoubleJumping = false;
      player.flipAngle = 0;

      player.barrelCooldown = 0.42;
      b.cooldown = 0.55;
      player.activeBarrel = null;

      triggerTrick("TIKI-KATAPULT!", 200);
      showSpeechBubble("TIKI-BOOM! 🚀", 1.2);
      return;
    }

    // 2. IN DER LORE: LOREN-HOPP!
    if (player.state === "in_minecart") {
      if (player.isGrounded) {
        player.vy = GAME_CONFIG.MINECART_JUMP_FORCE;
        player.isGrounded = false;
        player.doubleJumpAvailable = true;
        jungleAudio.playSFX("minecart_jump");
        camera.shake = 9;
        triggerTrick("LOREN-HOPP!", 120);
        showSpeechBubble("HOPP! 🚂", 1.0);
      } else if (player.doubleJumpAvailable) {
        player.doubleJumpAvailable = false;
        player.vy = GAME_CONFIG.MINECART_JUMP_FORCE * 0.92;
        jungleAudio.playSFX("minecart_jump");
        triggerTrick("DOPPEL-HOPP!", 160);
      }
      return;
    }

    // 3. LIANEN-SCHWUNG LÖSEN (KATAPULT-ABWURF)
    if (player.state === "grapple_swing" && grappleHook.active) {
      grappleHook.active = false;
      player.state = "jumping";
      player.doubleJumpAvailable = true;
      player.isDoubleJumping = false;
      player.flipAngle = 0;
      player.vx = Math.max(player.vx, 520);
      player.vy = -490;
      jungleAudio.playSFX("jump");
      triggerTrick("LIANEN-KATAPULT!", 200);
      showSpeechBubble("YAAHOO! 🌿", 1.0);
      return;
    }

    // 3b. ZIPLINE VERLASSEN (KATAPULT-ABWURF VOM SEIL)
    if (player.state === "on_zipline" && player.activeZipline) {
      player.activeZipline = null;
      player.state = "jumping";
      player.doubleJumpAvailable = true;
      player.isDoubleJumping = false;
      player.flipAngle = 0;
      player.vx = Math.max(player.vx, 560);
      player.vy = -490;
      jungleAudio.playSFX("jump");
      triggerTrick("ZIPLINE-BOOST!", 200);
      showSpeechBubble("WOOHOO! 🚡", 1.0);
      return;
    }

    // 4. IN DER LUFT: ZUERST SICHTBARE HÄNGE-LIANE PRÜFEN!
    if (!player.isGrounded && (player.state === "jumping" || player.state === "barrel_flying")) {
      let nearestAnchor = null;
      let minDist = 195;
      for (let a of grappleAnchors) {
        const d = Math.hypot(player.x - a.x, player.y - a.y);
        if (d < minDist && a.x > player.x - 45 && a.x < player.x + 175) {
          minDist = d;
          nearestAnchor = a;
        }
      }

      if (nearestAnchor) {
        grappleHook.active = true;
        grappleHook.anchorX = nearestAnchor.x;
        grappleHook.anchorY = nearestAnchor.y;
        grappleHook.length = Math.max(85, Math.min(185, Math.hypot(player.x - nearestAnchor.x, player.y - nearestAnchor.y)));
        grappleHook.angle = Math.atan2(player.x - nearestAnchor.x, player.y - nearestAnchor.y);
        grappleHook.angleVel = (player.vx / grappleHook.length) * 0.9;
        player.state = "grapple_swing";
        player.doubleJumpAvailable = true;
        player.isDoubleJumping = false;
        player.flipAngle = 0;
        jungleAudio.playSFX("grapple");
        showActionPopup("LIANE GEFASST! 🌿");
        showSpeechBubble("SWING! 🌿", 1.0);
        return;
      }
    }

    // 5. AM BODEN (ODER WÄHREND COYOTE-TIME): ERSTER SPRUNG
    if ((player.isGrounded || player.coyoteTimer > 0) && player.state !== "in_barrel" && player.state !== "in_minecart") {
      player.vy = GAME_CONFIG.JUMP_FORCE;
      player.isGrounded = false;
      player.doubleJumpAvailable = true;
      player.isDoubleJumping = false;
      player.flipAngle = 0;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.state = "jumping";
      jungleAudio.playSFX("jump");
      return;
    }

    // 6. IN DER LUFT: ECHTER DOPPELSPRUNG MIT 360°-SALTO!
    if (!player.isGrounded && player.doubleJumpAvailable && player.state !== "in_barrel" && player.state !== "in_loop" && player.state !== "rescued") {
      player.doubleJumpAvailable = false;
      player.isDoubleJumping = true;
      player.flipAngle = 0.01;
      player.vy = GAME_CONFIG.DOUBLE_JUMP_FORCE || -510;
      player.vx = Math.max(player.vx, ZONES[currentZoneId - 1].baseSpeed + 35);
      player.state = "jumping";
      jungleAudio.playSFX("jump");
      graphics.emitSparks(player.x, player.y + player.height * 0.8, 10);
      triggerTrick("360°-SALTO!", 150);
      showSpeechBubble("SALTO! 🤸✨", 1.0);
      return;
    }

    // 7. JUMP BUFFERING (bis zu 0.15s vor Bodenkontakt speichern, falls Doppelsprung schon verbraucht)
    if (!player.isGrounded && player.state === "jumping") {
      player.jumpBufferTimer = 0.15;
    }
  }

  // REINE ONE-BUTTON JUMP & RUN STEUERUNG (1x Tippen = Sprung/Kanone/Liane, 2x Tippen = Doppel-Salto!)
  window.addEventListener("pointerdown", (e) => {
    if (e.target.closest("#start-menu, #game-over-modal, #victory-popup, #music-toggle, .btn-modal")) return;
    jungleAudio.init();

    touchState.isDown = true;
    player.jumpHeld = true;

    // Überall auf dem Bildschirm tippen = 1x Sprung / 2x Doppel-Salto / Liane / Kanonenschuss!
    handleActionJumpOrShoot();
  });

  function endTouch() {
    touchState.isDown = false;
    player.jumpHeld = false;
  }

  window.addEventListener("pointerup", endTouch);
  window.addEventListener("pointercancel", endTouch);

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") {
      e.preventDefault();
      player.jumpHeld = true;
      handleActionJumpOrShoot();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") {
      player.jumpHeld = false;
    }
  });

  // --- 8. PELIKAN PICO RETTUNG (100% GARANTIERTER SICHERER RESPAWN OHNE ABSTURZ!) ---
  function triggerRescue(isFall = false) {
    if (player.state === "rescued") return;
    if (player.invulnerableTimer > 0 && !isFall) return;

    lives--;
    updateLivesHUD();
    jungleAudio.playSFX("hit");
    camera.shake = 16;

    if (lives <= 0) {
      isPlaying = false;
      isGameOver = true;
      document.getElementById("game-over-desc").innerText =
        `Nach ${Math.floor(distance)} Metern abgestürzt! Zone ${currentZoneId} wartet auf deine Revanche.`;
      gameOverModal.style.display = "flex";
      return;
    }

    // Absturzbewegung sofort stoppen & Y einfrieren (kein Tiefen-Absturz!)
    player.vy = 0;
    player.vx = 0;
    player.activeBarrel = null;
    player.activeZipline = null;
    player.currentLoop = null;
    if (player.y > WORLD_GROUND_Y) {
      player.y = WORLD_GROUND_Y + 10;
    }

    // ALLE BEREITS GENERIERTEN CHUNKS & GEFAHREN AB DEM RETTUNGSPUNKT SAUBER KAPPEN,
    // DAMIT DIE 1080px RETTUNGS-RUNWAY NAHTLOS UND OHNE LÖCHER ANGESCHLOSSEN WIRD!
    const rescueStartX = player.x + 80;
    const rescueW = 1080;

    chunks = chunks.filter(c => c.x < rescueStartX - 20);
    for (let c of chunks) {
      c.platforms = c.platforms.filter(p => p.x < rescueStartX);
    }
    hazards = hazards.filter(h => h.x < rescueStartX - 60);
    barrels = barrels.filter(b => b.x < rescueStartX - 60);
    bongoPads = bongoPads.filter(p => p.x < rescueStartX - 60);
    mayaGongs = mayaGongs.filter(g => g.x < rescueStartX - 60);
    grappleAnchors = grappleAnchors.filter(a => a.x < rescueStartX - 60);
    minecartStarters = minecartStarters.filter(m => m.x < rescueStartX - 60);
    ziplines = ziplines.filter(z => z.x2 < rescueStartX - 60);
    geysers = geysers.filter(g => g.x < rescueStartX - 60);
    enemies = enemies.filter(e => e.x < rescueStartX - 60);
    skillHearts = skillHearts.filter(sh => sh.x < rescueStartX - 60);
    bananas = bananas.filter(b => b.x < rescueStartX - 20);
    coconuts = [];
    coconutTimer = 5.0;

    const rescueChunk = {
      type: "rescue_safe_platform",
      x: rescueStartX,
      width: rescueW,
      platforms: [{ x: rescueStartX, y: WORLD_GROUND_Y, width: rescueW, height: 42, isSlide: false, isRail: false }]
    };
    chunks.push(rescueChunk);
    lastChunkEndX = rescueStartX + rescueW;
    lastChunkType = "runway";
    chunksSinceLastBarrel = Math.max(chunksSinceLastBarrel, 5);

    // Willkommens-Bananenbogen auf der Rettungs-Runway
    for (let i = 0; i < 4; i++) {
      const ratio = i / 3;
      bananas.push({
        x: rescueStartX + 420 + i * 42,
        y: WORLD_GROUND_Y - 65 - Math.sin(ratio * Math.PI) * 65,
        collected: false,
        isDiamond: false
      });
    }

    ensureChunksAhead();

    pelican.active = true;
    pelican.x = player.x - 90;
    pelican.y = player.y - 80;
    pelican.targetX = rescueStartX + 180;
    pelican.targetY = WORLD_GROUND_Y - player.height;
    pelican.timer = 1.25;

    player.state = "rescued";
    player.isMinecartDucking = false;
    player.minecartDuckTimer = 0;
    player.doubleJumpAvailable = true;
    player.isDoubleJumping = false;
    player.flipAngle = 0;
    player.invulnerableTimer = 3.5; // 3.5 Sekunden Schutz-Aura (kein Nach-Absturz möglich!)
    player.coyoteTimer = 0.12;
    player.jumpBufferTimer = 0;
    touchState.isHoldingSlide = false;
    grappleHook.active = false;

    showActionPopup("🛡️ PELIKAN PICO RETTET DICH! (-1 💖)");
    showSpeechBubble("DANKE PICO! 🛡️", 1.4);
  }

  // --- 9. HAUPT-UPDATE-LOGIK ---
  function update(rawDt) {
    if (!isPlaying || isGameOver || isVictory) return;

    if (slowmoTimer > 0) {
      slowmoTimer -= rawDt;
      timeScale = GAME_CONFIG.SLOWMO_FACTOR;
    } else {
      timeScale += (1.0 - timeScale) * 6 * rawDt;
    }
    const dt = rawDt * timeScale;

    // Distanz (kalibriert auf 3.000m komprimierte Action)
    distance += (player.vx * dt) / (GAME_CONFIG.DIST_SCALE_DIVISOR || 41.5);
    distCounterEl.innerHTML = `${Math.floor(distance)} <span>/ 3000 m</span>`;

    // Mobile Steuerungshinweis nach den ersten 120m (Tutorial-Runway) sanft ausblenden
    const mobileHintEl = document.getElementById("mobile-hint");
    if (mobileHintEl) {
      if (distance > 120 && mobileHintEl.style.opacity !== "0") {
        mobileHintEl.style.opacity = "0";
      } else if (distance <= 120 && mobileHintEl.style.opacity === "0") {
        mobileHintEl.style.opacity = "1";
      }
    }

    // Zonenwechsel
    const activeZone = ZONES[currentZoneId - 1];
    for (let z of ZONES) {
      if (distance >= z.start && distance < z.end && currentZoneId !== z.id) {
        currentZoneId = z.id;
        lastCheckpointDist = z.start;
        zoneBadgeEl.innerText = z.name.toUpperCase();
        showZoneBanner(z);
        camera.shake = 12;
        break;
      }
    }

    // 3.000m Geocaching Finalkoordinaten Unlock & Maya-Kryptex
    if (distance >= TARGET_DISTANCE && !isVictory) {
      isVictory = true;
      isPlaying = false;
      player.vx = 0;
      player.vy = 0;
      camera.shake = 16;
      jungleAudio.playSFX("frenzy");
      showActionPopup("🏛️ MAYA-ALTAR DER GÖTTER ERREICHT! ☀️");
      showSpeechBubble("DER ALTAR! 🏛️☀️", 2.2);
      openCryptexModal();
      return;
    }

    // Sprechblasen-Timer
    if (player.speechTimer > 0) {
      player.speechTimer -= rawDt;
      if (player.speechTimer <= 0) player.speechBubble = null;
    }

    // Flow- & Combo-Multiplikator Decay
    if (comboTimer > 0) {
      comboTimer -= rawDt;
      if (comboBarFillEl) {
        const pct = Math.max(0, (comboTimer / (GAME_CONFIG.COMBO_TIMEOUT || 3.5)) * 100);
        comboBarFillEl.style.width = `${pct}%`;
      }
      if (comboTimer <= 0) {
        combo = 0;
        if (comboBadgeEl) comboBadgeEl.innerText = "x1";
        if (comboBarFillEl) comboBarFillEl.style.width = "0%";
      }
    }

    // Cooldowns
    if (player.barrelCooldown > 0) player.barrelCooldown -= dt;
    for (let b of barrels) {
      if (b.cooldown > 0) b.cooldown -= dt;
    }
    for (let g of mayaGongs) {
      if (g.ringTimer > 0) g.ringTimer -= dt;
    }

    // Gewitter-Blitze in Zone 3
    if (activeZone.hasLightning) {
      lightningCooldown -= dt;
      if (lightningCooldown <= 0) {
        lightningCooldown = 4.2 + Math.random() * 3.8;
        graphics.triggerLightning();
        jungleAudio.playSFX("lightning");
        setTimeout(() => jungleAudio.playSFX("thunder"), 180);
        camera.shake = 16;
      }
    }

    // Indiana Jones Steinkugel bei 780m (Zone 2) & 1980m (Zone 4) – passend auf 3.000m komprimiert!
    if ((distance >= 780 && distance <= 1080) || (distance >= 1980 && distance <= 2220)) {
      if (!giantBoulder.active) {
        giantBoulder.active = true;
        giantBoulder.x = player.x - 320;
        giantBoulder.y = WORLD_GROUND_Y - GAME_CONFIG.BOULDER_RADIUS;
        giantBoulder.speed = player.vx * GAME_CONFIG.BOULDER_SPEED_RATIO;
        showActionPopup("⚠️ FLUCHT VOR DER STEINKUGEL! 🪨");
        showSpeechBubble("WHOOOA! 🪨 RUN! 🚀", 1.8);
      }
      giantBoulder.speed = player.vx * 0.96;
      giantBoulder.x += giantBoulder.speed * dt;
      giantBoulder.rotation += (giantBoulder.speed / giantBoulder.radius) * dt;

      if (Math.random() < 0.3) camera.shake = Math.max(camera.shake, 4);

      if (giantBoulder.x + giantBoulder.radius > player.x - player.width * 0.4 && player.invulnerableTimer <= 0 && !isSuperSonic) {
        triggerRescue();
        giantBoulder.x = player.x - 320;
      }
    } else {
      giantBoulder.active = false;
    }

    // BOSS 1: MAYA-STEINKOLOSS BEI 2.080m – 2.360m (ZONE 3)
    if (distance >= BOSS_CONFIG.COLOSSUS_START && distance <= BOSS_CONFIG.COLOSSUS_END) {
      if (!colossus.active) {
        colossus.active = true;
        colossus.x = player.x + 240;
        colossus.riseY = 120;
        colossus.fistState = "idle";
        colossus.attackTimer = 1.2;
        colossus.targetX = player.x + 240;
        jungleAudio.playSFX("colossus_roar");
        camera.shake = 20;
        showActionPopup("🗿 DER MAYA-STEINKOLOSS ERWACHT! 🗿");
        showSpeechBubble("EIN GIGANT! 🗿⚡", 2.0);
      }

      if (colossus.riseY > 0) {
        colossus.riseY = Math.max(0, colossus.riseY - 90 * dt);
      }
      colossus.x += (player.x + 190 - colossus.x) * 4 * dt;

      colossus.attackTimer -= dt;
      if (colossus.attackTimer <= 0) {
        if (colossus.fistState === "idle") {
          colossus.fistState = "warning";
          colossus.targetX = player.x + 220;
          colossus.attackTimer = 0.95;
        } else if (colossus.fistState === "warning") {
          colossus.fistState = "slam";
          colossus.fistY = -280;
          colossus.slamProgress = 0;
          colossus.attackTimer = 0.75;
        } else if (colossus.fistState === "slam") {
          colossus.fistState = "idle";
          colossus.attackTimer = 2.4;
        }
      }

      if (colossus.fistState === "slam") {
        colossus.fistY += 1200 * dt;
        if (colossus.fistY >= WORLD_GROUND_Y - 40) {
          colossus.fistY = WORLD_GROUND_Y - 40;
          colossus.slamProgress = Math.min(1.0, (colossus.slamProgress || 0) + 2.5 * dt);
          if (!colossus.hitSoundPlayed) {
            colossus.hitSoundPlayed = true;
            jungleAudio.playSFX("fist_slam");
            camera.shake = 22;
            graphics.emitSparks(colossus.targetX, WORLD_GROUND_Y - 20, 20);
          }

          if (
            Math.abs(player.x - colossus.targetX) < 68 &&
            player.isGrounded &&
            !isSuperSonic &&
            player.invulnerableTimer <= 0
          ) {
            triggerRescue();
          }
        }
      } else {
        colossus.hitSoundPlayed = false;
      }
    } else if (colossus.active) {
      colossus.active = false;
      showActionPopup("KOLOSS ÜBERWUNDEN! 💨🗿");
      showSpeechBubble("GESCHAFFT! 💨", 1.5);
    }

    // BOSS 2: TEMPEL-EINSTURZ BEI 3.740m – 3.960m (ZONE 5 VOR DEM FINALE)
    if (distance >= BOSS_CONFIG.COLLAPSE_START && distance <= BOSS_CONFIG.COLLAPSE_END) {
      if (!templeCollapse.active) {
        templeCollapse.active = true;
        templeCollapse.pillars = [
          { x: player.x + 350, angle: 0.12 },
          { x: player.x + 680, angle: -0.16 },
          { x: player.x + 1020, angle: 0.22 }
        ];
        templeCollapse.fallingRocks = [];
        templeCollapse.spawnTimer = 0.3;
        jungleAudio.playSFX("thunder");
        camera.shake = 22;
        showActionPopup("⚠️ TEMPEL-EINSTURZ! FLUCHT ZUM ALTAR! 🔥⚠️");
        showSpeechBubble("FLUCHT! ALLES STÜRZT EIN! 🔥", 2.2);
      }

      camera.shake = Math.max(camera.shake, 6 + Math.random() * 8);

      templeCollapse.spawnTimer -= dt;
      if (templeCollapse.spawnTimer <= 0) {
        templeCollapse.spawnTimer = 0.28 + Math.random() * 0.22;
        templeCollapse.fallingRocks.push({
          x: player.x + 120 + Math.random() * 550,
          y: -40,
          radius: 14 + Math.random() * 12,
          speed: 480 + Math.random() * 220,
          rot: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 8
        });
      }

      for (let r of templeCollapse.fallingRocks) {
        r.y += r.speed * dt;
        r.rot += r.rotSpeed * dt;

        if (
          Math.hypot(player.x - r.x, (player.y + player.height * 0.5) - r.y) < r.radius + 18 &&
          !isSuperSonic &&
          player.invulnerableTimer <= 0
        ) {
          r.y = 9999;
          triggerRescue();
        }
      }
      templeCollapse.fallingRocks = templeCollapse.fallingRocks.filter(r => r.y < WORLD_GROUND_Y + 100);
    } else if (templeCollapse.active) {
      templeCollapse.active = false;
    }

    // TÖDLICHE HERABFALLENDE KOKOSNÜSSE AUS DEM BLÄTTERDACH (AB ZONE 1 ~140m)
    if (distance >= (COCONUT_CONFIG.START_DIST || 140) && !isVictory && !isGameOver) {
      coconutTimer -= dt;
      if (coconutTimer <= 0) {
        // Spawne herabstürzende Kokosnuss diagonal aus dem Blätterdach auf Kokos Laufbahn
        const targetX = player.x + 90 + Math.random() * 260;
        const targetY = WORLD_GROUND_Y;
        const startX = targetX - 220;
        const startY = -60;
        const distTotal = Math.hypot(targetX - startX, targetY - startY);
        const speed = COCONUT_CONFIG.FALL_SPEED || 520;
        const vx = ((targetX - startX) / distTotal) * speed;
        const vy = ((targetY - startY) / distTotal) * speed;

        coconuts.push({
          x: startX,
          y: startY,
          vx: vx,
          vy: vy,
          startX: startX,
          startY: startY,
          targetX: targetX,
          targetY: targetY,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: 3.5 + Math.random() * 4.0,
          radius: 16,
          shattered: false
        });

        const minInt = COCONUT_CONFIG.MIN_INTERVAL || 7.0;
        const maxInt = COCONUT_CONFIG.MAX_INTERVAL || 12.0;
        coconutTimer = minInt + Math.random() * (maxInt - minInt);
        jungleAudio.playSFX("coconut_fall");
      }

      for (let c of coconuts) {
        if (c.shattered) continue;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rotation += c.rotSpeed * dt;

        // Bodenaufschlag & Zerschellen
        if (c.y >= c.targetY - 10) {
          c.shattered = true;
          graphics.emitCoconutShatter(c.targetX, c.targetY);
          jungleAudio.playSFX("coconut_shatter");
          camera.shake = Math.max(camera.shake, 6);
          continue;
        }

        // Kollision mit Held Koko
        const playerCenterY = player.y + player.height * 0.5;
        const distToPlayer = Math.hypot(player.x - c.x, playerCenterY - c.y);
        if (distToPlayer < (c.radius + player.width * 0.38)) {
          c.shattered = true;
          graphics.emitCoconutShatter(c.x, c.y);
          jungleAudio.playSFX("coconut_shatter");

          if (isSuperSonic || player.invulnerableTimer > 0 || player.state === "in_rocket") {
            // Unverwundbar / Schild / Raketen-Smash
            camera.shake = Math.max(camera.shake, 12);
            triggerTrick("KOKOSNUSS-SMASH!", 150);
          } else if (player.state !== "rescued") {
            // Tödlicher Treffer! Zieht 1 Leben ab & Pelikan Pico rettet
            camera.shake = 18;
            showActionPopup("KOKOSNUSS-TREFFER! 🥥💥 (-1 💖)");
            showSpeechBubble("AUA! KOKOSNUSS! 🥥💥", 1.5);
            triggerRescue(false);
            break;
          }
        }
      }
      coconuts = coconuts.filter(c => !c.shattered && c.y < WORLD_GROUND_Y + 120);
    }

    // Minecart Einstieg
    for (let ms of minecartStarters) {
      if (ms.active && Math.hypot(player.x - ms.x, player.y - ms.y) < 55) {
        ms.active = false;
        player.state = "in_minecart";
        player.vx = Math.max(player.vx + 140, GAME_CONFIG.MINECART_SPEED);
        jungleAudio.playSFX("minecart_jump");
        camera.shake = 10;
        showActionPopup("LORE BESTIEGEN! 🚂💨");
        showSpeechBubble("HOLD TIGHT! 🚂🔥", 1.5);
        break;
      }
    }

    // Lore-Ducken Timer
    if (player.state === "in_minecart") {
      if (player.minecartDuckTimer > 0) {
        player.minecartDuckTimer -= dt;
        if (player.minecartDuckTimer <= 0) {
          player.isMinecartDucking = false;
        }
      }

      if (player.isGrounded) {
        graphics.emitSparks(player.x - 22, player.y + player.height * 0.5 + 8, 2);
        jungleAudio.playSFX("minecart_clack");
      }
    }

    // Super-Sonic Frenzy
    if (isSuperSonic) {
      superSonicTimer -= dt;
      player.vx = GAME_CONFIG.SUPER_SONIC_SPEED;
      boostCharge = (superSonicTimer / GAME_CONFIG.SUPER_SONIC_DURATION) * 100;
      updateBoostHUD();

      if (superSonicTimer <= 0) {
        isSuperSonic = false;
        boostCharge = 0;
        updateBoostHUD();
        showActionPopup("NORMAL SPEED 🌴");
      }
    } else {
      const targetBaseSpeed = activeZone.baseSpeed;
      if (player.state === "in_minecart") {
        if (player.vx < GAME_CONFIG.MINECART_SPEED) player.vx += 160 * dt;
      } else {
        if (player.vx > targetBaseSpeed && player.state !== "sliding" && player.state !== "barrel_flying" && player.state !== "in_loop") {
          player.vx -= 40 * dt;
        } else if (player.vx < targetBaseSpeed) {
          player.vx += 70 * dt;
        }
      }
    }

    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer -= dt;
    }

    // Pelikan-Animation (Sichere Landung bündig auf Plattformhöhe + Kamera folgt geschmeidig!)
    if (pelican.active) {
      pelican.timer -= dt;
      pelican.x += (pelican.targetX - pelican.x) * 6 * dt;
      pelican.y += (pelican.targetY - pelican.y) * 6 * dt;
      player.x = pelican.x;
      player.y = pelican.y;

      const logicalW = window.innerWidth;
      const logicalH = window.innerHeight;
      const isPortrait = logicalH > logicalW;
      const leadFactor = isPortrait ? 0.17 : 0.22;
      const targetCamX = player.x - (logicalW / camera.scale) * leadFactor;
      const targetCamY = player.y - (logicalH / camera.scale) * (isPortrait ? 0.62 : 0.54);
      camera.x += (targetCamX - camera.x) * 7 * rawDt;
      camera.y += (targetCamY - camera.y) * 5 * rawDt;

      if (pelican.timer <= 0) {
        pelican.active = false;
        player.x = pelican.targetX;
        player.y = WORLD_GROUND_Y - player.height; // Exakt bündig auf der 1080px Rettungs-Plattform!
        player.state = "running";
        player.isGrounded = true;
        player.doubleJumpAvailable = true;
        player.isDoubleJumping = false;
        player.flipAngle = 0;
        player.vx = activeZone.baseSpeed;
        player.vy = 0;
        player.invulnerableTimer = 3.5;
        player.coyoteTimer = 0.12;
        player.jumpBufferTimer = 0;
        ensureChunksAhead();
      }
      return;
    }

    // Sonic 360° Wurzel-Looping
    if (player.state === "in_loop" && player.currentLoop) {
      const loop = player.currentLoop;
      player.loopProgress += (player.vx / loop.radius) * dt;

      player.x = (loop.x + loop.radius) - Math.sin(player.loopProgress) * loop.radius;
      player.y = (loop.y + loop.radius) + Math.cos(player.loopProgress) * loop.radius - player.height;

      if (player.loopProgress >= Math.PI * 2) {
        player.state = "running";
        player.vx += 120;
        player.isGrounded = true;
        player.doubleJumpAvailable = true;
        player.isDoubleJumping = false;
        player.flipAngle = 0;
        player.currentLoop = null;
        showActionPopup("LOOPING GESCHAFFT! ⚡");
        showSpeechBubble("LOOPING! ⚡", 1.2);
        camera.shake = 10;
      }
      return;
    }

    // Grapple Hook Physik
    if (player.state === "grapple_swing" && grappleHook.active) {
      const gAngleAcc = -18 * Math.sin(grappleHook.angle);
      grappleHook.angleVel += gAngleAcc * dt;
      grappleHook.angle += grappleHook.angleVel * dt;

      player.x = grappleHook.anchorX + Math.sin(grappleHook.angle) * grappleHook.length;
      player.y = grappleHook.anchorY + Math.cos(grappleHook.angle) * grappleHook.length - player.height * 0.5;

      if (grappleHook.angle > 0.65) {
        handleActionJumpOrShoot();
      }
      return;
    }

    // Zipline Seilrutsche Physik
    if (player.state === "on_zipline" && player.activeZipline) {
      const z = player.activeZipline;
      player.vx = Math.max(player.vx, 620);
      player.x += player.vx * dt;
      const t = Math.max(0, Math.min(1, (player.x - z.x1) / (z.x2 - z.x1)));
      const sag = Math.sin(t * Math.PI) * 18;
      const cableY = z.y1 + (z.y2 - z.y1) * t + sag;
      player.y = cableY + 8;
      player.vy = 0;
      graphics.emitSparks(player.x, cableY, 1);

      if (player.x >= z.x2 - 18) {
        player.activeZipline = null;
        player.state = "jumping";
        player.vy = -410;
        player.vx = Math.max(player.vx, 540);
        player.doubleJumpAvailable = true;
        jungleAudio.playSFX("jump");
        showActionPopup("ZIPLINE-FINISH! 🚡💨");
      }
    } else if (player.state !== "in_barrel" && player.state !== "in_loop" && player.state !== "rescued") {
      // GROSSER MAGNET-FANGBEREICH FÜR SEILBAHN (Egal ob im Aufwärtssprung, Fall oder Lauf an der Klippe!)
      for (let z of ziplines) {
        if (player.x >= z.x1 - 50 && player.x <= z.x2 - 60) {
          const t = Math.max(0, Math.min(1, (player.x - z.x1) / (z.x2 - z.x1)));
          const cableY = z.y1 + (z.y2 - z.y1) * t + Math.sin(t * Math.PI) * 18;
          if (Math.abs((player.y + 18) - cableY) < 92) {
            player.state = "on_zipline";
            player.activeZipline = z;
            player.doubleJumpAvailable = true;
            player.isDoubleJumping = false;
            player.flipAngle = 0;
            player.vx = Math.max(player.vx + 110, 620);
            jungleAudio.playSFX("grapple");
            camera.shake = 7;
            showActionPopup("ZIPLINE-RUSH! 🚡⚡");
            showSpeechBubble("ZIPLINE! 🚡💨", 1.2);
            break;
          }
        }
      }
    }

    // Spieler-Status-Physik
    if (player.state === "on_zipline") {
      // Bereits oben aktualisiert
    } else if (player.state === "in_barrel") {
      const b = player.activeBarrel;
      if (b) {
        player.x = b.x;
        player.y = b.y;
        if (!b.isAuto) {
          b.angle += b.angleSpeed * dt;
          if (b.angle > -0.10 || b.angle < -0.48) {
            b.angleSpeed = -b.angleSpeed;
          }
        } else {
          b._autoTimer = (b._autoTimer || 0) + dt;
          if (b._autoTimer > 0.28) {
            b._autoTimer = 0;
            handleActionJumpOrShoot();
          }
        }
      }
    } else if (player.state === "sliding") {
      player.slideTimer -= dt;
      player.x += player.vx * dt;
      player.vy += 1200 * dt;
      player.y += player.vy * dt;

      graphics.emitSparks(player.x - 14, player.y + player.height * 0.5, 1);

      // Bei Daumen-Button-Halten: Slide aktiv halten solange gedrückt!
      if (touchState.isHoldingSlide) {
        player.slideTimer = 0.35;
      }

      if (player.slideTimer <= 0) {
        // Prüfen ob Koko gerade unter einem Hindernis (z.B. low_thorns) durchrutscht
        let underCeiling = false;
        for (let h of hazards) {
          if (h.type === "low_thorns" && Math.abs(player.x - h.x) < 55) {
            underCeiling = true;
            break;
          }
        }
        if (!underCeiling) {
          player.state = "running";
        } else {
          player.slideTimer = 0.15; // Noch kurz geduckt bleiben bis Hindernis passiert ist!
        }
      }
    } else if (player.state === "barrel_flying") {
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.vy += 680 * dt;
      checkBarrelCollisions();
    } else if (player.state === "in_rocket") {
      player.rocketTimer -= dt;
      player.vx = GAME_CONFIG.ROCKET_SPEED || 760;
      player.vy += 650 * dt;
      player.vy = Math.max(-620, Math.min(520, player.vy));

      player.x += player.vx * dt;
      player.y += player.vy * dt;

      if (player.y < 80) {
        player.y = 80;
        player.vy = 0;
      }
      if (player.y > WORLD_GROUND_Y - player.height) {
        player.y = WORLD_GROUND_Y - player.height;
        player.vy = -180;
      }

      if (Math.random() < 0.45) {
        graphics.emitSparks(player.x - 28, player.y + 20, 2);
      }
      camera.shake = Math.max(camera.shake, 1.8);

      if (player.rocketTimer <= 0) {
        player.state = "jumping";
        player.vy = -520;
        player.doubleJumpAvailable = true;
        jungleAudio.playSFX("barrel_shoot");
        camera.shake = 12;
        graphics.emitBarrelExplosion(player.x, player.y, -Math.PI * 0.4);
        showActionPopup("🚀 BOOM! JETPACK AUSGEKLINGT!");
        showSpeechBubble("YEEEHAW! 💥", 1.5);
      }
    } else {
      player.x += player.vx * dt;
      const g = (player.jumpHeld && player.vy < 0) ? 1020 : GAME_CONFIG.GRAVITY;
      player.vy += g * dt;
      player.y += player.vy * dt;

      // 360°-Salto Rotation beim Doppelsprung animieren
      if (player.isDoubleJumping && player.flipAngle > 0) {
        player.flipAngle += Math.PI * 2 * 2.2 * dt;
        if (player.flipAngle >= Math.PI * 2) {
          player.flipAngle = 0;
        }
      }
    }

    // Plattform- & Schienen-Kollision
    if (player.state !== "in_barrel" && player.state !== "in_loop" && player.state !== "on_zipline" && player.state !== "in_rocket") {
      player.isGrounded = false;

      for (let c of chunks) {
        for (let p of c.platforms) {
          // Bröckelnde Hängebrücke aktualisieren
          if (p.isBridge && p.triggered) {
            p.dropTimer = (p.dropTimer || 0) + dt;
            if (p.dropTimer > 0.16) {
              p.dropY = (p.dropY || 0) + 420 * dt;
            }
          }

          if (p.isLooping) {
            if (Math.abs(player.x - p.x) < 35 && Math.abs((player.y + player.height) - WORLD_GROUND_Y) < 30 && player.vx > 350) {
              player.state = "in_loop";
              player.currentLoop = p;
              player.loopProgress = 0;
              jungleAudio.playSFX("frenzy");
              break;
            }
          } else if (p.isSlope) {
            if (player.x >= p.x && player.x <= p.endX) {
              const ratio = (player.x - p.x) / (p.endX - p.x);
              const slopeY = p.y + ratio * (p.endY - p.y);

              if (player.y + player.height >= slopeY - 14 && player.y + player.height <= slopeY + 30) {
                player.y = slopeY - player.height;
                player.vy = 0;
                player.isGrounded = true;
                player.doubleJumpAvailable = true;
                player.isDoubleJumping = false;
                player.flipAngle = 0;
                player.vx = Math.max(player.vx, GAME_CONFIG.SLIDE_SPEED);
              }
            }
          } else {
            if (p.isBridge && (p.dropY || 0) > 26) continue;

            if (player.x + player.width * 0.5 >= p.x && player.x - player.width * 0.5 <= p.x + p.width) {
              const platTop = p.y + (p.dropY || 0);
              const prevBottom = (player.y - player.vy * dt) + player.height;
              const currBottom = player.y + player.height;

              // Kontinuierliche Lande-Prüfung (verhindert Tunneln selbst bei Framerate-Schwankungen)
              if (currBottom >= platTop - 4 && (currBottom <= platTop + 32 || prevBottom <= platTop + 14) && player.vy >= 0) {
                player.y = platTop - player.height;
                player.vy = 0;
                player.isGrounded = true;
                player.doubleJumpAvailable = true;
                player.isDoubleJumping = false;
                player.flipAngle = 0;

                if (p.isBridge && !p.triggered) {
                  p.triggered = true;
                  camera.shake = Math.max(camera.shake, 3);
                }

                if (player.state === "barrel_flying" || player.state === "jumping") {
                  player.state = p.isRail ? "in_minecart" : "running";
                }

                if (p.isBoostRail) {
                  player.vx = Math.max(player.vx + 90, GAME_CONFIG.MINECART_SPEED + 80);
                  camera.shake = 6;
                }

                if (p.isKicker) {
                  if (player.state === "in_minecart") {
                    player.state = "jumping";
                    player.vy = -730;
                    player.vx += 140;
                    player.isGrounded = false;
                    player.doubleJumpAvailable = true;
                    jungleAudio.playSFX("barrel_shoot");
                    camera.shake = 14;
                    triggerSlowMotion(0.44);
                    graphics.emitSparks(player.x, player.y, 8);
                    showActionPopup("LOREN-EJEKTOR! 🚀");
                    showSpeechBubble("YAHOOO! 🚀", 1.3);
                  } else {
                    player.vy = -700;
                    player.vx += 120;
                    player.isGrounded = false;
                    player.doubleJumpAvailable = true;
                    player.state = "jumping";
                    jungleAudio.playSFX("jump");
                    camera.shake = 10;
                    triggerSlowMotion(0.38);
                    showActionPopup("RAMPEN-KATAPULT! 🚀");
                    showSpeechBubble("AYOOOH! 🚀", 1.2);
                  }
                }
              }
            }
          }
        }
      }

      // Coyote-Time & Jump Buffering Logik
      if (player.isGrounded) {
        player.coyoteTimer = 0.12; // 120ms Puffer nach Kanten-Verlassen

        // Jump Buffering: Wenn kurz vor der Landung getippt wurde, sofort abspringen!
        if (player.jumpBufferTimer > 0 && player.state !== "in_minecart") {
          player.jumpBufferTimer = 0;
          player.coyoteTimer = 0;
          player.vy = GAME_CONFIG.JUMP_FORCE;
          player.isGrounded = false;
          player.doubleJumpAvailable = true;
          player.isDoubleJumping = false;
          player.flipAngle = 0;
          player.state = "jumping";
          jungleAudio.playSFX("jump");
        }
      } else {
        if (player.coyoteTimer > 0) player.coyoteTimer -= dt;
        if (player.jumpBufferTimer > 0) player.jumpBufferTimer -= dt;
      }
    }

    // Wasser-Geysire (Aufwind-Fontänen)
    for (let g of geysers) {
      g.phase = (g.phase || 0) + dt * 4;
      if (Math.abs(player.x - g.x) < 42 && (player.y + player.height) >= g.y - g.height && (player.y + player.height) <= g.y + 30) {
        if (player.vy > -450 && player.state !== "on_zipline") {
          player.vy = -680;
          player.vx = Math.max(player.vx, activeZone.baseSpeed + 75);
          player.state = "jumping";
          player.isGrounded = false;
          player.doubleJumpAvailable = true;
          player.isDoubleJumping = false;
          player.flipAngle = 0;
          jungleAudio.playSFX("bongo");
          camera.shake = 9;
          graphics.emitSparks(player.x, player.y + player.height, 10);
          showActionPopup("GEYSIR-AUFWIND! ⛲🌊");
          showSpeechBubble("WHOOOA! 🌊🚀", 1.1);
        }
      }
    }

    // Lebendige Gegner (Flatternde Tukane, Rollende Fässer, Springende Piranhas) & Donkey-Kong Kopf-Bounce!
    for (let e of enemies) {
      if (e.defeated || e.stomped) continue;
      // Garantiert 100% faire Zipline-Fahrt – kein Treffer im Seilbahnflug!
      if (player.state === "on_zipline") continue;

      e.phase = (e.phase || 0) + dt * 5;
      if (e.type === "toucan") {
        e.x += (e.vx || -75) * dt;
        e.y = e.baseY + Math.sin(e.phase) * 18;
      } else if (e.type === "rolling_barrel") {
        e.x += (e.vx || -90) * dt;
        e.rot = (e.rot || 0) - 5.5 * dt;

        // Echte Bodenhaftung & Schwerkraft (verhindert Schweben in der Luft!)
        const groundUnder = getGroundYAt(e.x);
        if (groundUnder !== null && (e.y + 20) >= groundUnder - 14 && (e.y + 20) <= groundUnder + 35) {
          e.y = groundUnder - 20; // Bündig auf der Plattform
          e.vy = 0;
        } else {
          // Im freien Fall über Abgründen:
          e.vy = (e.vy || 0) + 1100 * dt;
          e.y += e.vy * dt;
          if (e.y > WORLD_GROUND_Y + 180) {
            e.defeated = true;
          }
        }
      } else if (e.type === "piranha") {
        const prevY = e.y;
        e.y = e.baseY - Math.abs(Math.sin(e.phase * 0.65)) * 185;
        e.vy = e.y - prevY;
      }

      const ew = e.width || 42;
      const eh = e.height || 36;
      const dx = Math.abs(player.x - e.x);
      const dy = Math.abs((player.y + player.height * 0.5) - e.y);
      if (dx < (ew * 0.45 + player.width * 0.38) && dy < (eh * 0.45 + player.height * 0.42)) {
        if (isSuperSonic || player.state === "in_rocket") {
          e.defeated = true;
          e.stomped = true;
          camera.shake = 12;
          graphics.emitSparks(e.x, e.y, 16);
          jungleAudio.playSFX("smash");
          triggerTrick(player.state === "in_rocket" ? "RAKETEN-CRASH!" : "SMASH!", 300);
          continue;
        }
        // Donkey-Kong Stomp Bounce von oben auf Tukan oder Fass!
        const isStompFromAbove = (e.type !== "piranha") && (player.vy >= -50) && ((player.y + player.height * 0.72) <= e.y + 14);
        if (isStompFromAbove) {
          e.defeated = true;
          e.stomped = true;
          player.vy = -610;
          player.isGrounded = false;
          player.doubleJumpAvailable = true;
          player.isDoubleJumping = false;
          player.flipAngle = 0;
          player.state = "jumping";
          boostCharge = Math.min(100, boostCharge + 10);
          updateBoostHUD();
          jungleAudio.playSFX("bongo");
          camera.shake = 11;
          graphics.emitSparks(e.x, e.y, 16);
          triggerTrick("KOPF-BOUNCE!", 250);
          showSpeechBubble("BOING! 🦍✨", 1.1);
        } else if (player.invulnerableTimer <= 0) {
          triggerRescue();
          break;
        }
      }
    }

    // Maya-Gongs
    for (let g of mayaGongs) {
      if (Math.hypot(player.x - g.x, player.y - g.y) < g.radius + 25) {
        if (g.ringTimer <= 0) {
          g.ringTimer = 1.0;
          jungleAudio.playSFX("gong");
          camera.shake = 22;
          triggerSlowMotion(0.45);
          graphics.impactFlash = 0.08;

          for (let h of hazards) {
            if (Math.abs(h.x - player.x) < 450) {
              bananas.push({ x: h.x, y: h.y, collected: false, isDiamond: true });
              h.x = -9999;
            }
          }
          triggerTrick("MAYA-GONG!", 400);
          showSpeechBubble("GONG! 🔔✨", 1.5);
        }
      }
    }

    // Bongo-Pilze
    for (let pad of bongoPads) {
      const dx = player.x - pad.x;
      const dy = (player.y + player.height) - pad.y;
      if (Math.abs(dx) < pad.radius + 18 && Math.abs(dy) < 26 && player.vy > 0) {
        player.vy = -790;
        player.state = "jumping";
        player.isGrounded = false;
        player.doubleJumpAvailable = true;
        player.isDoubleJumping = false;
        player.flipAngle = 0;
        jungleAudio.playSFX("bongo");
        camera.shake = 8;
        triggerTrick("BONGO-BOUNCE!", 180);
        break;
      }
    }

    if (player.state !== "in_barrel") {
      checkBarrelCollisions();
    }

    // Bananen einsammeln (Präzise Hitbox auf Körpermitte, kein automatisches Einsammeln!)
    const playerCenterY = player.y + player.height * 0.5;
    for (let b of bananas) {
      if (b.collected) continue;

      // Im Super-Sonic Frenzy: Magnetischer Bananen-Sog
      if (isSuperSonic) {
        const dist = Math.hypot(player.x - b.x, playerCenterY - b.y);
        if (dist < 260) {
          b.x += (player.x - b.x) * 12 * dt;
          b.y += (playerCenterY - b.y) * 12 * dt;
        }
      }

      // Präziser Kollisionsradius (28px statt 42px)
      if (Math.hypot(player.x - b.x, playerCenterY - b.y) < 28) {
        b.collected = true;
        bananasCollected++;
        bananaCountEl.innerText = bananasCollected;

        if (b.isDiamond) {
          jungleAudio.playSFX("diamond");
          addScore(250);
          boostCharge = Math.min(100, boostCharge + (GAME_CONFIG.DIAMOND_CHARGE || 35));
          if (boostCharge >= 100 && !isSuperSonic) {
            isSuperSonic = true;
            superSonicTimer = GAME_CONFIG.SUPER_SONIC_DURATION;
            jungleAudio.playSFX("frenzy");
            camera.shake = 16;
            graphics.impactFlash = 0.08;
            showActionPopup("💎 DIAMANT SUPER-SONIC! 💎");
            showSpeechBubble("DIAMOND POWER! 💎⚡", 1.4);
          } else {
            showActionPopup("+35% BOOST CHARGE! 💎");
            showSpeechBubble("DIAMOND! 💎", 1.0);
          }
        } else {
          jungleAudio.playSFX("banana");
          addScore(50);
          player.vx += 8;
          boostCharge += (GAME_CONFIG.BANANA_CHARGE_RATE || 1.8);

          if (boostCharge >= 100 && !isSuperSonic) {
            isSuperSonic = true;
            superSonicTimer = GAME_CONFIG.SUPER_SONIC_DURATION;
            jungleAudio.playSFX("frenzy");
            camera.shake = 16;
            graphics.impactFlash = 0.08;
            showActionPopup("⚡ SUPER-SONIC FRENZY! ⚡");
            showSpeechBubble("SUPER-SONIC! ⚡", 1.4);
          }
        }
        updateBoostHUD();
      }
    }

    // 3 Legendäre Autoren-Relikte einsammeln (Geocaching Easter Eggs & Kryptex-Schlüssel)
    for (let r of relics) {
      if (r.collected) continue;
      if (Math.hypot(player.x - r.x, playerCenterY - r.y) < 42) {
        r.collected = true;
        discoveredGlyphs[r.ringIndex] = true;
        jungleAudio.playSFX("relic_pickup");
        camera.shake = 16;
        graphics.impactFlash = 0.08;
        graphics.emitSparks(r.x, r.y, 24);

        const countFound = discoveredGlyphs.filter(Boolean).length;
        const hudBadge = document.getElementById("relic-hud-" + r.id);
        if (hudBadge) {
          hudBadge.classList.remove("locked");
          hudBadge.classList.add("unlocked");
          hudBadge.innerText = `${r.icon} ${r.glyph}`;
        }

        triggerTrick(`RELIKT: ${r.shortName}!`, 1000);
        showActionPopup(`🏆 RELIKT ${countFound}/3: ${r.shortName}! Symbol aufgedeckt: ${r.glyph} (${r.glyphName})`);
        showSpeechBubble(`${r.shortName}! ${r.glyph}✨`, 2.5);
      }
    }

    // Wiederholte Maya-Glyphen-Stelen einsammeln (Zusätzliche Chancen, falls Relikt verpasst wurde!)
    for (let s of mayaSteles) {
      if (s.collected) continue;
      if (Math.hypot(player.x - s.x, playerCenterY - s.y) < 46) {
        s.collected = true;
        discoveredGlyphs[s.ringIndex] = true;
        jungleAudio.playSFX("relic_pickup");
        camera.shake = 14;
        graphics.impactFlash = 0.08;
        graphics.emitSparks(s.x, s.y - 30, 22);

        const countFound = discoveredGlyphs.filter(Boolean).length;
        const badgeMap = ["helmet", "amulet", "hook"];
        const id = badgeMap[s.ringIndex];
        const hudBadge = document.getElementById("relic-hud-" + id);
        if (hudBadge) {
          hudBadge.classList.remove("locked");
          hudBadge.classList.add("unlocked");
          hudBadge.innerText = `${s.icon} ${s.glyph}`;
        }

        triggerTrick(`MAYA-STELE: ${s.glyph}!`, 600);
        showActionPopup(`🗿 MAYA-STELE (${countFound}/3): Symbol aufgedeckt: ${s.glyph} (${s.name})`);
        showSpeechBubble(`STELE: ${s.glyph}! 🗿✨`, 2.5);
      }
    }

    // Seltene Goldene Skill-Herzen einsammeln (1x pro Zone auf schwer erreichbarer oberer Baumkrone!)
    for (let sh of skillHearts) {
      if (sh.collected) continue;
      if (Math.hypot(player.x - sh.x, playerCenterY - sh.y) < 38) {
        sh.collected = true;
        jungleAudio.playSFX("relic_pickup");
        camera.shake = 14;
        graphics.impactFlash = 0.08;
        graphics.emitSparks(sh.x, sh.y, 22);

        if (lives < GAME_CONFIG.TOTAL_LIVES) {
          lives = Math.min(GAME_CONFIG.TOTAL_LIVES, lives + 1);
          updateLivesHUD();
          triggerTrick("SKILL-HERZ! (+1 LEBEN)", 750);
          showSpeechBubble("NEUES LEBEN! 💖✨", 1.8);
        } else {
          boostCharge = Math.min(100, boostCharge + 50);
          updateBoostHUD();
          triggerTrick("SKILL-HERZ BONUS!", 500);
          showSpeechBubble("MAX HERZEN! +50% BOOST! 💖⚡", 1.8);
        }
      }
    }

    // DIE 4 GOLDENEN K-O-K-O BUCHSTABEN-MEDAILLONS EINSAMMELN
    for (let item of kokoLetters) {
      if (item.collected) continue;
      if (Math.hypot(player.x - item.x, playerCenterY - item.y) < 44) {
        item.collected = true;
        kokoCollected[item.index] = true;
        jungleAudio.playSFX("koko_letter");
        camera.shake = 15;
        graphics.impactFlash = 0.08;
        graphics.emitSparks(item.x, item.y, 25);

        const badge = document.getElementById("koko-" + item.index);
        if (badge) {
          badge.classList.remove("locked");
          badge.classList.add("collected");
        }

        triggerTrick(`BUCHSTABE '${item.char}'!`, 600);

        // Prüfen ob alle 4 Buchstaben gesammelt wurden -> SUPER-KOKO ERWACHT!
        if (kokoCollected.every(Boolean) && !player.isGoldKoko) {
          player.isGoldKoko = true;
          player.invulnerableTimer = 6.0;
          camera.shake = 22;
          graphics.impactFlash = 0.15;
          jungleAudio.playSFX("frenzy");
          showActionPopup("👑 100% K-O-K-O! GOLD-KOKO ERWACHT! 👑");
          showSpeechBubble("ICH BIN GOLD-KOKO! 🍌✨👑", 2.5);
        }
      }
    }

    // RAKETEN-FASS (JET-BARREL) PICKUPS EINSAMMELN
    for (let rb of rocketBarrels) {
      if (rb.collected) continue;
      if (Math.hypot(player.x - rb.x, playerCenterY - rb.y) < 46) {
        rb.collected = true;
        player.state = "in_rocket";
        player.rocketTimer = GAME_CONFIG.ROCKET_DURATION || 9.0;
        player.vy = -260;
        jungleAudio.playSFX("rocket_thrust");
        camera.shake = 16;
        graphics.impactFlash = 0.1;
        graphics.emitSparks(rb.x, rb.y, 26);
        showActionPopup("🚀 RAKETEN-FASS! TIPPEN ZUM STEIGEN! 🚀");
        showSpeechBubble("WHOOOOSH! 🚀💥", 2.0);
        triggerTrick("JET-FASS START!", 500);
      }
    }

    // Hindernisse & Super-Sonic / Rocket Smash (Hindernisse zerspringen im Flug!)
    if (isSuperSonic || player.state === "in_rocket") {
      for (let h of hazards) {
        if (
          player.x + player.width * 0.6 > h.x - h.width * 0.5 &&
          player.x - player.width * 0.6 < h.x + h.width * 0.5 &&
          player.y + player.height > h.y - h.height * 0.5 &&
          player.y < h.y + h.height * 0.5
        ) {
          h.x = -9999;
          camera.shake = Math.max(camera.shake, 14);
          graphics.emitSparks(player.x + 20, player.y + player.height * 0.5, 16);
          jungleAudio.playSFX("smash");
          triggerTrick("SMASH!", 150);
        }
      }
    } else if (player.invulnerableTimer <= 0 && player.state !== "on_zipline") {
      for (let h of hazards) {
        if (
          player.x + player.width * 0.4 > h.x - h.width * 0.5 &&
          player.x - player.width * 0.4 < h.x + h.width * 0.5 &&
          player.y + player.height > h.y - h.height * 0.5 &&
          player.y < h.y + h.height * 0.5
        ) {
          if (h.type === "low_thorns" && player.state === "sliding") {
            continue;
          }
          if (h.type === "low_spikes" && player.state === "in_minecart" && player.isMinecartDucking) {
            continue;
          }
          triggerRescue();
          break;
        }
      }
    }

    // Absturz in den Fluss (garantierte Pelikan-Rettung, egal ob unverwundbar oder nicht)
    if (player.y > WORLD_GROUND_Y + 70) {
      triggerRescue(true);
    }

    // Dynamische Kameraverfolgung (Koko weiter links auf dem Handy für maximale Vorausschau!)
    const logicalW = window.innerWidth;
    const logicalH = window.innerHeight;
    const isPortrait = logicalH > logicalW;
    const leadFactor = isPortrait ? 0.17 : 0.22;
    const targetCamX = player.x - (logicalW / camera.scale) * leadFactor;
    const targetCamY = player.y - (logicalH / camera.scale) * (isPortrait ? 0.62 : 0.54);

    camera.x += (targetCamX - camera.x) * 7 * rawDt;
    camera.y += (targetCamY - camera.y) * 5 * rawDt;

    if (camera.shake > 0) {
      camera.shake *= 0.88;
      if (camera.shake < 0.2) camera.shake = 0;
    }

    ensureChunksAhead();
  }

  function checkBarrelCollisions() {
    if (player.barrelCooldown > 0) return;

    const catchBonus = player.state === "barrel_flying" ? 34 : 24;
    for (let b of barrels) {
      if (b.cooldown > 0) continue;
      if (Math.hypot(player.x - b.x, player.y - b.y) < b.radius + catchBonus) {
        player.state = "in_barrel";
        player.activeBarrel = b;
        player.doubleJumpAvailable = true;
        player.isDoubleJumping = false;
        player.flipAngle = 0;
        player.vx = 0;
        player.vy = 0;
        player.x = b.x;
        player.y = b.y;
        camera.shake = 8;
        jungleAudio.playSFX("barrel_enter");
        break;
      }
    }
  }

  // --- 10. HAUPT-RENDER-SCHLEIFE ---
  function draw() {
    const logicalW = window.innerWidth;
    const logicalH = window.innerHeight;
    const zone = ZONES[currentZoneId - 1];

    ctx.clearRect(0, 0, logicalW, logicalH);

    // Parallax Hintergrund mit 3D-Bäumen & lebendigem Wasserfall
    graphics.drawParallaxBackground(camera, zone, logicalW, logicalH, 0.016);

    // Spielwelt mit Screen Shake
    ctx.save();
    ctx.scale(camera.scale, camera.scale);

    const sx = camera.shake > 0 ? (Math.random() - 0.5) * camera.shake : 0;
    const sy = camera.shake > 0 ? (Math.random() - 0.5) * camera.shake : 0;
    ctx.translate(-camera.x + sx, -camera.y + sy);

    // 4000m Altar der Götter im Hintergrund
    graphics.drawAltarBackdrop(distance, WORLD_GROUND_Y);

    // Wasser-Geysire (Aufwind-Fontänen)
    graphics.drawGeysers(geysers);

    // Plattformen, Wurzel-Rutschen, Loopings, Baumkronen-Decks, Hängebrücken & Schienen
    for (let c of chunks) {
      graphics.drawPlatforms(c.platforms, zone);
    }

    // Zipline-Seilrutschen
    graphics.drawZiplines(ziplines, player);

    // Boss 1: Maya-Steinkoloss (Midground)
    graphics.drawMayanColossus(colossus, WORLD_GROUND_Y);

    // Maya-Gongs
    graphics.drawMayaGongs(mayaGongs);

    // Fass-Kanonen
    graphics.drawBarrels(barrels, player);

    // Bongo-Pilze
    graphics.drawBongoPads(bongoPads);

    // Indiana Jones Riesen-Steinkugel
    graphics.drawGiantBoulder(giantBoulder);

    // Boss 2: Tempel-Einsturz (Kippende Säulen & fallende Felsen)
    graphics.drawTempleCollapse(templeCollapse, WORLD_GROUND_Y);

    // Hindernisse
    graphics.drawHazards(hazards);

    // Tödliche herabfallende Kokosnüsse aus den Baumkronen
    graphics.drawFallingCoconuts(coconuts);

    // Lebendige Gegner (Tukane, Fässer, Piranhas)
    graphics.drawEnemies(enemies);

    // Bananen (Gold & Diamant)
    graphics.drawBananas(bananas);

    // 3 Legendäre Autoren-Relikte
    graphics.drawRelics(relics);

    // Wiederholte Maya-Glyphen-Stelen (Zusätzliche Chancen!)
    graphics.drawMayaSteles(mayaSteles);

    // 4 Versteckte K-O-K-O Buchstaben-Medaillons
    graphics.drawKOKOLetters(kokoLetters);

    // Raketen-Fass (Jet-Barrel) Pickups
    graphics.drawRocketBarrels(rocketBarrels);

    // Seltene Goldene Skill-Herzen auf hohen Baumkronen
    graphics.drawSkillHearts(skillHearts);

    // Klar sichtbare Hänge-Lianen mit goldenem Greif-Ring
    graphics.drawGrappleAnchors(grappleAnchors, player, grappleHook);

    // Gespannte Lianen-Peitsche beim Schwingen
    graphics.drawGrappleVine(player, grappleHook);

    // Held Koko ODER Minecart Lore
    if (player.state === "in_minecart") {
      graphics.drawMinecart(player, player.isMinecartDucking);
    } else {
      graphics.drawKoko(player, isSuperSonic, timeScale);
    }

    // Pelikan Pico
    graphics.drawPelican(pelican);

    ctx.restore();

    // Partikel-System (Funken, Rauch, Glühwürmchen, Monsun-Regen, Blitze & Impact-Flash)
    graphics.updateAndDrawParticles(0.016, zone, logicalW, logicalH);

    // Vordergrund-Farnblätter
    graphics.drawForeground(camera, logicalW, logicalH);

    // Super-Sonic Arcade Speed-Lines & Goldener Bildschirm-Glow
    graphics.drawSuperSonicEffects(logicalW, logicalH, isSuperSonic);
  }

  // --- 11. ANIMATIONS-LOOP ---
  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    try {
      update(dt);
      draw();
    } catch (err) {
      console.error("Game loop error:", err);
    }

    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

  // --- 12. BUTTON & MODAL EVENTS (SOFORT-REAKTION AUF TOUCH & CLICK) ---
  function startExpedition(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    if (isPlaying) return;
    startMenu.style.display = "none";
    jungleAudio.init();
    try {
      jungleAudio.playMusic();
    } catch (err) {}
    resetGame(true);
  }

  btnStartGame.addEventListener("click", startExpedition);
  btnStartGame.addEventListener("pointerdown", startExpedition);
  btnStartGame.addEventListener("touchend", startExpedition);

  function retryCheckpoint(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    resetGame(false);
  }
  btnRetry.addEventListener("click", retryCheckpoint);
  btnRetry.addEventListener("pointerdown", retryCheckpoint);
  btnRetry.addEventListener("touchend", retryCheckpoint);

  function restartFromZero(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    resetGame(true);
  }
  btnRestartZero.addEventListener("click", restartFromZero);
  btnRestartZero.addEventListener("pointerdown", restartFromZero);
  btnRestartZero.addEventListener("touchend", restartFromZero);

  // --- 13. INTERAKTIVES 3D MAYA-KRYPTEX & GEOCACHING FINISHER-STEMPEL ---
  function updateCryptexUI() {
    for (let r = 0; r < 3; r++) {
      const ringEl = document.getElementById(`ring-${r}`);
      if (!ringEl) continue;
      const curIdx = cryptexRings[r];
      const prevIdx = (curIdx - 1 + CRYPTEX_GLYPHS.length) % CRYPTEX_GLYPHS.length;
      const nextIdx = (curIdx + 1) % CRYPTEX_GLYPHS.length;

      const prevEl = ringEl.querySelector(".glyph-prev");
      const curEl = ringEl.querySelector(".glyph-cur");
      const nextEl = ringEl.querySelector(".glyph-next");
      if (prevEl) prevEl.innerText = CRYPTEX_GLYPHS[prevIdx].char;
      if (curEl) curEl.innerText = CRYPTEX_GLYPHS[curIdx].char;
      if (nextEl) nextEl.innerText = CRYPTEX_GLYPHS[nextIdx].char;

      // Hinweis-Tag und Ring-Glanz aktualisieren
      const clueEl = document.getElementById(`ring-clue-${r}`);
      const relicForRing = RELICS.find(rel => rel.ringIndex === r);
      const icon = relicForRing ? relicForRing.icon : "🪖";
      const glyphChar = CRYPTEX_GLYPHS[CRYPTEX_SOLUTION[r]].char;

      if (discoveredGlyphs[r]) {
        if (clueEl) {
          clueEl.classList.add("revealed");
          clueEl.innerText = `✓ ${icon} ${glyphChar}`;
        }
        ringEl.style.borderColor = "#facc15";
        ringEl.style.boxShadow = "0 0 16px rgba(250, 204, 21, 0.45)";
      } else {
        if (clueEl) {
          clueEl.classList.remove("revealed");
          clueEl.innerText = `${icon} ?`;
        }
        ringEl.style.borderColor = "";
        ringEl.style.boxShadow = "";
      }
    }
  }

  function rotateRing(ringIndex, delta = 1) {
    if (cryptexUnlocked) return;
    cryptexRings[ringIndex] = (cryptexRings[ringIndex] + delta + CRYPTEX_GLYPHS.length) % CRYPTEX_GLYPHS.length;
    jungleAudio.playSFX("cryptex_spin");
    updateCryptexUI();
  }

  function openCryptexModal() {
    cryptexUnlocked = false;
    const stage = document.getElementById("cryptex-stage");
    const reveal = document.getElementById("cryptex-reveal");
    if (stage) stage.style.display = "block";
    if (reveal) reveal.style.display = "none";

    const allFound = discoveredGlyphs[0] && discoveredGlyphs[1] && discoveredGlyphs[2];
    const foundCount = discoveredGlyphs.filter(Boolean).length;

    // 1. Altar-Inventar der Autoren aktualisieren
    for (let r = 0; r < 3; r++) {
      const slotEl = document.getElementById(`inv-slot-${r}`);
      const statusEl = document.getElementById(`inv-status-${r}`);
      const relic = RELICS[r];
      const glyphChar = CRYPTEX_GLYPHS[CRYPTEX_SOLUTION[r]].char;

      if (discoveredGlyphs[r]) {
        if (slotEl) slotEl.classList.add("found");
        if (statusEl) statusEl.innerHTML = `✓ Entschlüsselt: <b>${glyphChar}</b>`;
        // Gefundene Ringe direkt auf die Lösung setzen!
        cryptexRings[r] = CRYPTEX_SOLUTION[r];
      } else {
        if (slotEl) slotEl.classList.remove("found");
        if (statusEl) statusEl.innerHTML = `❓ Im Dschungel verpasst`;
      }
    }

    // 2. Dynamisches Maya-Rätsel / Inschrift aktualisieren
    const riddleTitleEl = document.getElementById("riddle-title");
    const riddleTextEl = document.getElementById("riddle-text");
    const btnUnlock = document.getElementById("btn-unlock-cryptex");

    if (allFound) {
      if (riddleTitleEl) riddleTitleEl.innerText = "✨ ALLE 3 AUTOREN-RELIKTE GEBORGEN! ✨";
      if (riddleTextEl) {
        riddleTextEl.innerHTML = `
          <div class="riddle-complete-msg">
            🏆 <b>Perfekte Expedition!</b> Du hast alle 3 Relikte geborgen.<br>
            Das Maya-Kryptex hat sich auf <b>🐒 – ☀️ – 🏛️</b> ausgerichtet!
          </div>
        `;
      }
      if (btnUnlock) {
        btnUnlock.innerText = "✨ ALLES GEBORGEN: KRYPTEX ÖFFNEN (1 KLICK) 🔓";
      }
    } else {
      if (riddleTitleEl) riddleTitleEl.innerText = `📜 MAYA-INSCHRIFT (${foundCount}/3 RELIKTE GEBORGEN):`;
      if (riddleTextEl) {
        let versesHtml = "";
        for (let r = 0; r < 3; r++) {
          const v = (typeof CRYPTEX_VERSES !== "undefined" && CRYPTEX_VERSES[r]) ? CRYPTEX_VERSES[r] : {
            relicName: RELICS[r].name,
            glyphChar: CRYPTEX_GLYPHS[CRYPTEX_SOLUTION[r]].char,
            verse: `Ring ${r + 1}: Erforsche die Glyphen der Maya.`
          };
          if (discoveredGlyphs[r]) {
            versesHtml += `<div class="riddle-verse-item solved">✓ <b>${v.relicName}</b> gefunden ➔ Symbol: <b>${v.glyphChar}</b></div>`;
          } else {
            versesHtml += `<div class="riddle-verse-item">❓ <b>${v.verse}</b></div>`;
          }
        }
        riddleTextEl.innerHTML = versesHtml;
      }
      if (btnUnlock) {
        btnUnlock.innerText = "⚡ KRYPTEX ENTSCHLÜSSELN ⚡";
      }
    }

    // 3. Statuszeile und Orakel
    for (let r = 0; r < 3; r++) {
      const ringEl = document.getElementById(`ring-${r}`);
      if (ringEl) {
        ringEl.style.borderColor = "";
        ringEl.style.boxShadow = "";
      }
    }
    const hintEl = document.querySelector(".cryptex-hint");
    if (hintEl) {
      hintEl.style.color = "";
      if (allFound) {
        hintEl.innerText = "✨ Ringe perfekt ausgerichtet – 1 Klick zum Öffnen!";
      } else {
        hintEl.innerText = (failedCryptexAttempts >= 3 && !cryptexUnlocked)
          ? "🔮 Orakel-Hilfe unten bereit oder Ringe weiter drehen"
          : "👆 Drehe die noch fehlenden Ringe passend zum Rätselvers";
      }
    }

    const oracleBtn = document.getElementById("btn-oracle-help");
    if (oracleBtn) oracleBtn.style.display = (failedCryptexAttempts >= 3 && !cryptexUnlocked) ? "block" : "none";

    updateCryptexUI();
    victoryPopup.style.display = "flex";
  }

  function unlockCryptex() {
    if (cryptexUnlocked) return;

    // Prüfen, ob die 3 Ringe die heilige Maya-Kombination [🐒, ☀️, 🏛️] (Indizes [2, 0, 5]) zeigen
    const isSolved = (
      cryptexRings[0] === CRYPTEX_SOLUTION[0] &&
      cryptexRings[1] === CRYPTEX_SOLUTION[1] &&
      cryptexRings[2] === CRYPTEX_SOLUTION[2]
    );

    const cylinderEl = document.querySelector(".cryptex-cylinder");

    if (!isSolved) {
      failedCryptexAttempts++;
      // Falsche Kombination -> Fehler-Sound, Rüttel-Animation und Hilfestellung!
      jungleAudio.playSFX("cryptex_error");
      if (cylinderEl) {
        cylinderEl.classList.remove("shake-error");
        void cylinderEl.offsetWidth; // re-flow
        cylinderEl.classList.add("shake-error");
        setTimeout(() => {
          if (cylinderEl) cylinderEl.classList.remove("shake-error");
        }, 500);
      }
      showActionPopup("❌ KRYPTEX BLOCKIERT! Falsche Symbol-Reihe!");

      const oracleBtn = document.getElementById("btn-oracle-help");
      if (failedCryptexAttempts >= 3 && oracleBtn) {
        oracleBtn.style.display = "block";
      }

      const hintEl = document.querySelector(".cryptex-hint");
      if (hintEl) {
        hintEl.style.color = "#f87171";
        if (failedCryptexAttempts >= 3) {
          hintEl.innerText = "🔮 Das Maya-Orakel ist erwacht! Klicke unten auf das Orakel für die Lösung.";
        } else {
          hintEl.innerText = `❌ Versuch ${failedCryptexAttempts}/3 fehlgeschlagen! Beachte Relikte & Altar-Rätsel!`;
        }
        setTimeout(() => {
          if (hintEl && !cryptexUnlocked) {
            hintEl.style.color = "";
            hintEl.innerText = (failedCryptexAttempts >= 3)
              ? "🔮 Orakel-Hilfe unten bereit oder Ringe weiter drehen"
              : "👆 Tippe auf die Pfeile oder Ringe zum Drehen";
          }
        }, 3500);
      }
      return;
    }

    // Richtige Kombination! Kryptex öffnet sich feierlich
    cryptexUnlocked = true;
    const oracleBtn = document.getElementById("btn-oracle-help");
    if (oracleBtn) oracleBtn.style.display = "none";

    jungleAudio.playSFX("cryptex_open");
    camera.shake = 22;
    graphics.impactFlash = 0.15;
    showActionPopup("✨ KRYPTEX ENTSCHLÜSSELT! DER ALTAR ÖFFNET SICH! ☀️✨");

    // Ringe leuchten grün/golden auf
    for (let r = 0; r < 3; r++) {
      const ringEl = document.getElementById(`ring-${r}`);
      if (ringEl) {
        ringEl.style.borderColor = "#4ade80";
        ringEl.style.boxShadow = "0 0 20px rgba(74, 222, 128, 0.6)";
      }
    }

    setTimeout(() => {
      const stage = document.getElementById("cryptex-stage");
      const reveal = document.getElementById("cryptex-reveal");
      if (stage) stage.style.display = "none";
      if (reveal) reveal.style.display = "block";

      const coords = _unlockFinal(_cData, TARGET_DISTANCE);
      finalCoordsEl.innerText = coords;

          // Befülle Finisher-Stempel
          const foundRelicsCount = relics.filter(r => r.collected).length;
          const stampBananasEl = document.getElementById("stamp-bananas");
          const stampRelicCountEl = document.getElementById("stamp-relic-count");
          const stampScoreEl = document.getElementById("stamp-score");
          const stampKokoEl = document.getElementById("stamp-koko");
          const stampKokoSealEl = document.getElementById("stamp-koko-seal");

          if (stampBananasEl) stampBananasEl.innerText = bananasCollected;
          if (stampRelicCountEl) stampRelicCountEl.innerText = `${foundRelicsCount} / 3`;
          if (stampScoreEl) stampScoreEl.innerText = score.toLocaleString();

          const foundKokoCount = kokoCollected.filter(Boolean).length;
          if (stampKokoEl) stampKokoEl.innerText = `${foundKokoCount} / 4`;
          if (stampKokoSealEl) {
            stampKokoSealEl.style.display = player.isGoldKoko ? "block" : "none";
          }

          const relicTags = [
            { el: document.getElementById("stamp-relic-1"), id: "helmet" },
            { el: document.getElementById("stamp-relic-2"), id: "amulet" },
            { el: document.getElementById("stamp-relic-3"), id: "hook" }
          ];
          relicTags.forEach(rt => {
            if (!rt.el) return;
            const isFound = relics.some(r => r.id === rt.id && r.collected);
            if (isFound) {
              rt.el.classList.add("found");
              if (!rt.el.innerText.includes("✓")) rt.el.innerText += " ✓";
            }
          });

          const rankEl = document.getElementById("stamp-rank");
          if (rankEl) {
            if (player.isGoldKoko && score >= 20000) {
              rankEl.innerText = "👑 MAYA-SONNENGOTT (RANG S+) - 100% GOLD-KOKO 👑";
              rankEl.style.background = "linear-gradient(90deg, #facc15, #eab308)";
            } else if (score >= 15000 || foundRelicsCount === 3) {
              rankEl.innerText = "🥇 GOLD-ENTDECKER DER MAYA (RANG S) 🥇";
              rankEl.style.background = "#facc15";
            } else if (score >= 9000 || foundRelicsCount >= 1) {
              rankEl.innerText = "🥈 SILBER-ABENTEUERER (RANG A) 🥈";
              rankEl.style.background = "#e2e8f0";
            } else {
              rankEl.innerText = "🥉 BRONZE-KLETTERER (RANG B) 🥉";
              rankEl.style.background = "#fed7aa";
            }
          }
      }, 400);
  }

  // Kryptex Events (Sofortige Touch- & Klick-Reaktion ohne 300ms Verzögerung)
  function bindFastClick(el, handler) {
    if (!el) return;
    el.addEventListener("click", handler);
    el.addEventListener("touchend", (e) => {
      if (typeof e.preventDefault === "function") e.preventDefault();
      handler(e);
    }, { passive: false });
  }

  for (let r = 0; r < 3; r++) {
    const ringEl = document.getElementById(`ring-${r}`);
    if (ringEl) {
      const btnUp = ringEl.querySelector(".btn-up");
      const btnDown = ringEl.querySelector(".btn-down");
      const viewport = ringEl.querySelector(".ring-viewport");

      if (btnUp) bindFastClick(btnUp, (e) => { if (e && e.stopPropagation) e.stopPropagation(); rotateRing(r, -1); });
      if (btnDown) bindFastClick(btnDown, (e) => { if (e && e.stopPropagation) e.stopPropagation(); rotateRing(r, 1); });
      if (viewport) bindFastClick(viewport, (e) => { if (e && e.stopPropagation) e.stopPropagation(); rotateRing(r, 1); });
    }
  }

  const btnUnlockCryptex = document.getElementById("btn-unlock-cryptex");
  if (btnUnlockCryptex) {
    bindFastClick(btnUnlockCryptex, unlockCryptex);
  }

  const btnOracleHelp = document.getElementById("btn-oracle-help");
  if (btnOracleHelp) {
    bindFastClick(btnOracleHelp, (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      if (cryptexUnlocked) return;
      btnOracleHelp.style.display = "none";
      jungleAudio.playSFX("frenzy");
      camera.shake = 18;
      graphics.impactFlash = 0.14;

      // Orakel dreht die Ringe automatisch auf die richtige Lösung [2, 0, 5]
      cryptexRings = [...CRYPTEX_SOLUTION];
      updateCryptexUI();

      showActionPopup("🔮 DAS MAYA-ORAKEL ENTSCHLÜSSELT DEN ALTAR! ☀️✨");
      showSpeechBubble("DAS ORAKEL HILFT! 🔮✨", 2.0);

      setTimeout(() => {
        unlockCryptex();
      }, 550);
    });
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("execCommand failed"));
      } catch (err) {
        reject(err);
      }
    });
  }

  function handleCopyCoords(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const gcStr = typeof GC_CODE !== "undefined" ? GC_CODE : "GCC04PH";
    const text = `Jungle Hero (${gcStr})\n${finalCoordsEl.innerText}\nHinweis: Angeln\n(Finisher – Versteckules & Tschango)`;
    copyTextToClipboard(text).then(() => {
      btnCopyCoords.innerText = "✅ In die Zwischenablage kopiert!";
      setTimeout(() => {
        btnCopyCoords.innerText = "📋 Koordinaten & Angel-Tipp kopieren";
      }, 2500);
    }).catch(() => {
      btnCopyCoords.innerText = "⚠️ Bitte manuell markieren & kopieren";
      setTimeout(() => {
        btnCopyCoords.innerText = "📋 Koordinaten & Angel-Tipp kopieren";
      }, 2500);
    });
  }

  bindFastClick(btnCopyCoords, handleCopyCoords);

  // Initiales Szenen-Setup (Start-Runway, Koko & Bananen sofort rendern)
  resetGame(true);
  isPlaying = false;

})();
