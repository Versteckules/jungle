/* ==========================================================================
   JUNGLE HERO – GRAPHICS & RENDERING ENGINE (Volumetric 2.5D Shaded Art)
   ========================================================================== */

class JungleGraphicsEngine {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.animTime = 0;

    // Partikel-Systeme
    this.sparks = [];
    this.smokePuffs = [];
    this.rainDrops = [];
    this.spores = [];

    // Wetter & Blitz
    this.lightningFlash = 0;
    this.impactFlash = 0;

    this.initWeatherParticles();
  }

  initWeatherParticles() {
    this.rainDrops = [];
    for (let i = 0; i < GAME_CONFIG.MAX_RAIN; i++) {
      this.rainDrops.push({
        x: Math.random() * 1400,
        y: Math.random() * 800,
        speed: 950 + Math.random() * 450,
        length: 24 + Math.random() * 20,
        alpha: 0.4 + Math.random() * 0.45
      });
    }

    this.spores = [];
    for (let i = 0; i < GAME_CONFIG.MAX_SPORES; i++) {
      this.spores.push({
        x: Math.random() * 1600,
        y: Math.random() * 700,
        radius: 1.8 + Math.random() * 2.4,
        phase: Math.random() * Math.PI * 2,
        speedX: -15 + Math.random() * 30,
        speedY: -20 - Math.random() * 20
      });
    }
  }

  // --- PARTIKEL EMITTER HELPER ---
  emitSparks(x, y, count = 3, spreadY = 1.0) {
    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= GAME_CONFIG.MAX_SPARKS) this.sparks.shift();
      const angle = Math.PI * 0.75 + (Math.random() - 0.5) * 0.8 * spreadY;
      const speed = 140 + Math.random() * 300;
      this.sparks.push({
        x,
        y,
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed * 0.6,
        life: 0.3 + Math.random() * 0.25,
        maxLife: 0.45,
        size: 2.2 + Math.random() * 2.5,
        color: Math.random() < 0.4 ? "#ffffff" : (Math.random() < 0.7 ? "#facc15" : "#f97316")
      });
    }
  }

  emitBarrelExplosion(x, y, angle) {
    this.impactFlash = 0.08;
    for (let i = 0; i < 16; i++) {
      if (this.smokePuffs.length >= GAME_CONFIG.MAX_SMOKE) this.smokePuffs.shift();
      const pAngle = angle + (Math.random() - 0.5) * 0.9;
      const speed = 180 + Math.random() * 380;
      this.smokePuffs.push({
        x,
        y,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        radius: 14 + Math.random() * 20,
        alpha: 0.85,
        decay: 1.8 + Math.random() * 1.4,
        isFire: i < 7
      });
    }
  }

  emitCoconutShatter(x, y) {
    this.impactFlash = 0.06;
    for (let i = 0; i < 14; i++) {
      if (this.sparks.length >= GAME_CONFIG.MAX_SPARKS) this.sparks.shift();
      const angle = (Math.random() * Math.PI) + Math.PI; // Nach oben spritzend
      const speed = 130 + Math.random() * 280;
      this.sparks.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.8,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.5,
        size: 3.0 + Math.random() * 3.5,
        color: i % 3 === 0 ? "#ffffff" : (i % 2 === 0 ? "#78350f" : "#451a03")
      });
    }
  }

  triggerLightning() {
    this.lightningFlash = 0.24;
  }

  // --- 1. PARALLAX HINTERGRUND MIT VOLUMETRISCHEN 3D-BÄUMEN & WASSERFÄLLEN ---
  drawParallaxBackground(camera, zone, logicalW, logicalH, dt = 0.016) {
    const ctx = this.ctx;
    this.animTime += dt;

    // 1.1 Himmel-Farbverlauf
    const skyGrad = ctx.createLinearGradient(0, 0, 0, logicalH);
    if (this.lightningFlash > 0.05 && zone.hasLightning) {
      skyGrad.addColorStop(0, "#e0f2fe");
      skyGrad.addColorStop(0.5, "#7dd3fc");
      skyGrad.addColorStop(1, "#0369a1");
    } else {
      skyGrad.addColorStop(0, zone.skyTop);
      skyGrad.addColorStop(0.55, zone.skyBottom);
      skyGrad.addColorStop(1, "#020f06");
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, logicalW, logicalH);

    // 1.2 Tropensonne & rotierende God-Rays
    if (!zone.hasRain) {
      ctx.save();
      const sunBaseX = (logicalW * 0.72 - camera.x * 0.04) % (logicalW + 280);
      const sunX = sunBaseX < -140 ? sunBaseX + logicalW + 280 : sunBaseX;
      const sunY = 90;

      const coronaGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 160);
      coronaGrad.addColorStop(0, zone.sunColor);
      coronaGrad.addColorStop(0.35, zone.sunGlow);
      coronaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 160, 0, Math.PI * 2);
      ctx.fill();

      // God-Rays
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(0.25 + Math.sin(this.animTime * 0.4) * 0.04);
      ctx.fillStyle = "rgba(254, 240, 138, 0.09)";
      for (let r = 0; r < 8; r++) {
        const angle = (r / 8) * Math.PI * 0.9 + 0.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle - 0.07) * 950, Math.sin(angle - 0.07) * 950);
        ctx.lineTo(Math.cos(angle + 0.07) * 950, Math.sin(angle + 0.07) * 950);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    }

    // 1.3 Parallax Ebene 1: Maya-Stufenpyramiden mit 3D-Lichtkanten
    ctx.save();
    const pyrSpacing = 540;
    const pyrOffset = (camera.x * 0.12) % pyrSpacing;
    for (let i = -1; i < 5; i++) {
      const px = i * pyrSpacing - pyrOffset;
      const py = logicalH - 100;

      // Schattierte 3D-Fläche der Pyramide
      ctx.fillStyle = (this.lightningFlash > 0.05 && zone.hasLightning) ? "rgba(12, 74, 110, 0.85)" : "rgba(6, 78, 59, 0.55)";
      ctx.beginPath();
      ctx.moveTo(px - 150, py);
      ctx.lineTo(px - 100, py - 65);
      ctx.lineTo(px - 85, py - 65);
      ctx.lineTo(px - 55, py - 130);
      ctx.lineTo(px - 45, py - 130);
      ctx.lineTo(px - 25, py - 175);
      ctx.lineTo(px + 25, py - 175);
      ctx.lineTo(px + 45, py - 130);
      ctx.lineTo(px + 55, py - 130);
      ctx.lineTo(px + 85, py - 65);
      ctx.lineTo(px + 100, py - 65);
      ctx.lineTo(px + 150, py);
      ctx.closePath();
      ctx.fill();

      // Sonnen-Lichtkante links
      ctx.strokeStyle = "rgba(254, 240, 138, 0.28)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px - 150, py);
      ctx.lineTo(px - 100, py - 65);
      ctx.lineTo(px - 55, py - 130);
      ctx.lineTo(px - 25, py - 175);
      ctx.stroke();

      // Altar-Tempel auf der Pyramide mit goldenem Portal
      ctx.fillStyle = "rgba(4, 47, 30, 0.75)";
      ctx.fillRect(px - 18, py - 198, 36, 23);
      ctx.fillStyle = zone.hasGlowingRunes ? "#38bdf8" : "#facc15";
      ctx.fillRect(px - 6, py - 188, 12, 13);
    }
    ctx.restore();

    // 1.4 Parallax Ebene 2: VOLUMETRISCHE 3D-BÄUME & LEBENDIGER WASSERFALL
    ctx.save();
    const treeSpacing = 420;
    const treeOffset = (camera.x * 0.26) % treeSpacing;
    for (let i = -1; i < 6; i++) {
      const tx = i * treeSpacing - treeOffset;
      const ty = logicalH - 105;

      // 3D-SCHATTIERTER BAUMSTAMM (Zylindrischer Verlauf von Schatten zu Licht)
      const trunkW = 42;
      const trunkGrad = ctx.createLinearGradient(tx - trunkW * 0.5, 0, tx + trunkW * 0.5, 0);
      trunkGrad.addColorStop(0, "#271203");
      trunkGrad.addColorStop(0.28, "#451a03");
      trunkGrad.addColorStop(0.55, "#78350f");
      trunkGrad.addColorStop(0.82, "#451a03");
      trunkGrad.addColorStop(1, "#180a02");
      ctx.fillStyle = trunkGrad;

      ctx.beginPath();
      ctx.moveTo(tx - trunkW * 0.65, ty);
      ctx.quadraticCurveTo(tx - trunkW * 0.35, ty - 140, tx - trunkW * 0.3, ty - 290);
      ctx.lineTo(tx + trunkW * 0.3, ty - 290);
      ctx.quadraticCurveTo(tx + trunkW * 0.35, ty - 140, tx + trunkW * 0.65, ty);
      ctx.closePath();
      ctx.fill();

      // 3D Rinden-Wülste & Moos-Lianen um den Stamm
      ctx.strokeStyle = "rgba(22, 101, 52, 0.75)";
      ctx.lineWidth = 4;
      for (let r = 0; r < 4; r++) {
        const ry = ty - 45 - r * 60;
        ctx.beginPath();
        ctx.arc(tx, ry, trunkW * 0.42, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      // 3D BAUMKRONE (Kugelförmig schattierte Blätter-Ballen)
      const foliageGrad = ctx.createRadialGradient(tx - 15, ty - 310, 10, tx, ty - 290, 95);
      foliageGrad.addColorStop(0, "#22c55e");
      foliageGrad.addColorStop(0.45, "#15803d");
      foliageGrad.addColorStop(0.85, "#14532d");
      foliageGrad.addColorStop(1, "#052e16");
      ctx.fillStyle = foliageGrad;

      ctx.beginPath();
      ctx.arc(tx, ty - 290, 85, 0, Math.PI * 2);
      ctx.arc(tx - 52, ty - 270, 62, 0, Math.PI * 2);
      ctx.arc(tx + 52, ty - 270, 62, 0, Math.PI * 2);
      ctx.fill();

      // --- LEBENDIGER, MEHRSCHICHTIGER 3D-WASSERFALL ---
      if (i % 2 === 0) {
        const wfX = tx + 160;
        const wfY = ty - 220;
        const wfH = 220;
        const wfW = 32;

        // Schicht 1: Dunkles Sturzwasser im Hintergrund
        const wfBackGrad = ctx.createLinearGradient(wfX, 0, wfX + wfW, 0);
        wfBackGrad.addColorStop(0, "rgba(8, 47, 73, 0.8)");
        wfBackGrad.addColorStop(0.5, "rgba(14, 116, 144, 0.85)");
        wfBackGrad.addColorStop(1, "rgba(8, 47, 73, 0.8)");
        ctx.fillStyle = wfBackGrad;
        ctx.fillRect(wfX, wfY, wfW, wfH);

        // Schicht 2: Weiße Sturzbäche & Stromschnellen-Schlieren
        ctx.fillStyle = "rgba(224, 242, 254, 0.75)";
        for (let w = 0; w < 8; w++) {
          const streamY = wfY + ((this.animTime * 140 + w * 28) % wfH);
          const streamX = wfX + 4 + (w % 3) * 8;
          ctx.fillRect(streamX, streamY, 5, 22);
        }

        // Schicht 3: Gischt & Schaumwolken am Aufprall-Becken
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        for (let f = 0; f < 5; f++) {
          const foamX = wfX - 8 + f * 10 + Math.sin(this.animTime * 6 + f) * 4;
          const foamY = wfY + wfH - 6 + Math.cos(this.animTime * 7 + f) * 3;
          ctx.beginPath();
          ctx.arc(foamX, foamY, 7 + (f % 3) * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Aufsteigender Dschungel-Nebel / Sprühnebel
        const mistGrad = ctx.createRadialGradient(wfX + wfW * 0.5, wfY + wfH, 5, wfX + wfW * 0.5, wfY + wfH, 45);
        mistGrad.addColorStop(0, "rgba(224, 242, 254, 0.45)");
        mistGrad.addColorStop(1, "rgba(224, 242, 254, 0)");
        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.arc(wfX + wfW * 0.5, wfY + wfH, 45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 1.5 Dschungelfluss unten mit 3D-Lichtreflexionen
    ctx.save();
    const riverY = logicalH - 55;
    const riverGrad = ctx.createLinearGradient(0, riverY, 0, logicalH);
    riverGrad.addColorStop(0, zone.waterColor);
    riverGrad.addColorStop(1, "#020d05");
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, riverY, logicalW, logicalH - riverY);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2.5;
    for (let rx = 0; rx < logicalW; rx += 70) {
      const waveY = riverY + 8 + Math.sin(rx * 0.05 + this.animTime * 3) * 4;
      ctx.beginPath();
      ctx.arc(rx, waveY, 16, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- 2. VOLUMETRISCHE PLATTFORMEN, WURZEL-RUTSCHEN & MINECART-SCHIENEN ---
  drawPlatforms(platforms, zone) {
    const ctx = this.ctx;
    const theme = zone.foliageTheme;

    for (let p of platforms) {
      if (p.isLooping) {
        // --- SONIC 360° WURZEL-LOOPING ---
        ctx.save();
        ctx.translate(p.x + p.radius, p.y + p.radius);

        ctx.strokeStyle = theme.bark;
        ctx.lineWidth = 34;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = theme.highlight;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 3.5;
        ctx.setLineDash([20, 25]);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius - 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#facc15";
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡ 360° LOOPING ⚡", 0, -p.radius - 18);
        ctx.restore();
      } else if (p.isRail) {
        // --- 3D-PLASTISCHE MINECART SCHIENEN & BRÜCKEN ---
        ctx.save();
        const ph = p.height || 36;

        // Holz-Bockstützen
        if (!p.isSlope) {
          ctx.strokeStyle = "#381704";
          ctx.lineWidth = 6;
          for (let tx = p.x + 20; tx < p.x + p.width - 15; tx += 65) {
            ctx.beginPath();
            ctx.moveTo(tx - 12, p.y + ph);
            ctx.lineTo(tx, p.y + ph + 85);
            ctx.moveTo(tx + 12, p.y + ph);
            ctx.lineTo(tx, p.y + ph + 85);
            ctx.stroke();
          }
        }

        // Längsbalken mit 3D Holzmaserung
        const woodBeamGrad = ctx.createLinearGradient(0, p.y + 6, 0, p.y + ph);
        woodBeamGrad.addColorStop(0, "#92400e");
        woodBeamGrad.addColorStop(0.5, "#78350f");
        woodBeamGrad.addColorStop(1, "#451a03");
        ctx.fillStyle = woodBeamGrad;
        ctx.fillRect(p.x, p.y + 6, p.width, ph - 6);

        // Querschwellen mit Bolzen
        const tieSpacing = 28;
        for (let tx = p.x + 6; tx < p.x + p.width - 6; tx += tieSpacing) {
          ctx.fillStyle = "#381704";
          ctx.fillRect(tx - 7, p.y + 2, 14, 12);
          ctx.fillStyle = "#1e0a02";
          ctx.fillRect(tx - 5, p.y + 3, 10, 3);

          // Eiserne Schienenklammern
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(tx - 4, p.y - 1, 3, 4);
          ctx.fillRect(tx + 1, p.y - 1, 3, 4);
        }

        // Glänzende Stahlschiene mit Reflexion
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.width, p.y);
        ctx.stroke();

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 2);
        ctx.lineTo(p.x + p.width, p.y - 2);
        ctx.stroke();

        if (p.isBoostRail) {
          ctx.fillStyle = "#facc15";
          ctx.font = "900 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡ TURBO-SCHIENE ⚡", p.x + p.width * 0.5, p.y - 14);
        } else if (p.isKicker) {
          ctx.fillStyle = "#ef4444";
          ctx.font = "900 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🚀 EJEKTOR-SCHANZE!", p.x + p.width * 0.5, p.y - 14);
        }
        ctx.restore();
      } else if (p.isSlope) {
        // --- 3D WURZEL-RUTSCHE ---
        ctx.save();
        ctx.strokeStyle = theme.bark;
        ctx.lineWidth = 32;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 15);
        ctx.lineTo(p.endX, p.endY + 15);
        ctx.stroke();

        ctx.strokeStyle = theme.highlight;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.endX, p.endY);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
        ctx.lineWidth = 3;
        ctx.setLineDash([16, 14]);
        ctx.beginPath();
        ctx.moveTo(p.x + 12, p.y - 1);
        ctx.lineTo(p.endX - 12, p.endY - 1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (p.isBridge) {
        // --- KRACHENDE HOLZ-HÄNGEBRÜCKE ---
        ctx.save();
        const dropOffset = p.dropY || 0;
        const shakeX = p.triggered && dropOffset < 10 ? (Math.random() - 0.5) * 5 : 0;
        ctx.translate(shakeX, dropOffset);
        if (dropOffset > 0) {
          ctx.translate(p.x + p.width * 0.5, p.y);
          ctx.rotate((dropOffset * 0.008) * (p.x % 2 === 0 ? 1 : -1));
          ctx.translate(-(p.x + p.width * 0.5), -p.y);
        }

        // Tragseile
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 4);
        ctx.lineTo(p.x + p.width, p.y + 4);
        ctx.stroke();

        // Einzelne Holzbohlen
        const plankW = 14;
        for (let bx = p.x + 2; bx < p.x + p.width - 4; bx += plankW + 3) {
          const pGrad = ctx.createLinearGradient(0, p.y, 0, p.y + 18);
          pGrad.addColorStop(0, p.triggered ? "#f59e0b" : "#b45309");
          pGrad.addColorStop(0.6, "#78350f");
          pGrad.addColorStop(1, "#451a03");
          ctx.fillStyle = pGrad;
          ctx.strokeStyle = "#1e0a02";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, p.y, plankW, 18, 4);
          else ctx.rect(bx, p.y, plankW, 18);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      } else {
        // --- MASSIVER VOLUMETRISCHER DSCHUNGEL-BODEN & BAUMKRONEN-DECKS ---
        ctx.save();
        const ph = p.height || 42;

        if (p.isTreehouse) {
          // --- 2. EBENE: BAMBUS-BAUMHAUS-DECKS ---
          // Bambus-Stützpfeiler mit geschnitzten Knoten
          ctx.fillStyle = "#92400e";
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 2.2;
          [p.x + 22, p.x + p.width - 28].forEach(postX => {
            ctx.fillRect(postX, p.y + ph - 4, 12, 160);
            ctx.strokeRect(postX, p.y + ph - 4, 12, 160);
            // Bambus-Knotenringe
            for (let ky = p.y + ph + 20; ky < p.y + ph + 150; ky += 32) {
              ctx.fillStyle = "#b45309";
              ctx.fillRect(postX - 2, ky, 16, 5);
              ctx.strokeRect(postX - 2, ky, 16, 5);
            }
          });

          // Bambus-Planken Deck
          const deckGrad = ctx.createLinearGradient(0, p.y, 0, p.y + ph);
          deckGrad.addColorStop(0, "#d97706");
          deckGrad.addColorStop(0.5, "#b45309");
          deckGrad.addColorStop(1, "#78350f");
          ctx.fillStyle = deckGrad;
          ctx.strokeStyle = "#1e0a02";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(p.x + 2, p.y + 2, p.width - 4, ph - 2, 8);
          else ctx.rect(p.x + 2, p.y + 2, p.width - 4, ph - 2);
          ctx.fill();
          ctx.stroke();

          // Bambus-Musterung / Längsrillen
          ctx.strokeStyle = "rgba(69, 26, 3, 0.45)";
          ctx.lineWidth = 2;
          for (let bx = p.x + 16; bx < p.x + p.width - 12; bx += 18) {
            ctx.beginPath();
            ctx.moveTo(bx, p.y + 4);
            ctx.lineTo(bx, p.y + ph - 2);
            ctx.stroke();
          }

          // Goldene Glanzkante oben
          ctx.fillStyle = "#fde047";
          ctx.fillRect(p.x + 4, p.y + 2, p.width - 8, 4);

          // Lianen-Hängebüschel an den Ecken (ohne Ringe!)
          ctx.strokeStyle = theme.base;
          ctx.lineWidth = 3;
          [p.x + 12, p.x + p.width - 16].forEach(vx => {
            ctx.beginPath();
            ctx.moveTo(vx, p.y + ph);
            ctx.quadraticCurveTo(vx + 6, p.y + ph + 24, vx - 2, p.y + ph + 42);
            ctx.stroke();
          });
        } else {
          // --- MASSIVER HAUPT-DSCHUNGELBODEN (Fels & Erde reicht tief hinab, KEINE KEKSE & KEINE RINGE!) ---
          const deepDepth = 260; // Reicht tief hinab bis in den Fluss / unteren Rand
          
          // 1. Tiefere Basalt- & Erdschicht (dunkle massive Klippenwand)
          const cliffGrad = ctx.createLinearGradient(0, p.y, 0, p.y + deepDepth);
          cliffGrad.addColorStop(0, p.isKicker ? "#c2410c" : theme.bark);
          cliffGrad.addColorStop(0.2, "#3b1a06");
          cliffGrad.addColorStop(0.55, "#241004");
          cliffGrad.addColorStop(1, "#0d0501");
          ctx.fillStyle = cliffGrad;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y + 6);
          // Organischer Klippenrand links
          ctx.lineTo(p.x - 3, p.y + 45);
          ctx.lineTo(p.x + 2, p.y + 110);
          ctx.lineTo(p.x - 2, p.y + deepDepth);
          // Unterer Abschluss
          ctx.lineTo(p.x + p.width + 2, p.y + deepDepth);
          // Organischer Klippenrand rechts
          ctx.lineTo(p.x + p.width - 2, p.y + 110);
          ctx.lineTo(p.x + p.width + 3, p.y + 45);
          ctx.lineTo(p.x + p.width, p.y + 6);
          ctx.closePath();
          ctx.fill();

          // 2. Eingemeißelte antike Maya-Steinblöcke im Fels
          ctx.fillStyle = "rgba(51, 65, 85, 0.4)";
          ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
          ctx.lineWidth = 2;
          const blockStep = 75;
          for (let bx = p.x + 24; bx < p.x + p.width - 55; bx += blockStep) {
            const by = p.y + 36 + ((bx * 7) % 35);
            ctx.fillRect(bx, by, 48, 26);
            ctx.strokeRect(bx, by, 48, 26);
            // Spiral-Relief im Stein
            ctx.beginPath();
            ctx.arc(bx + 24, by + 13, 7, 0, Math.PI * 1.5);
            ctx.stroke();
          }

          // 3. Organisch herabhängende Dschungel-Wurzeln (OHNE RINGE!)
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 3.8;
          ctx.lineCap = "round";
          for (let rx = p.x + 28; rx < p.x + p.width - 20; rx += 52) {
            const rootLen = 35 + ((rx * 13) % 45);
            ctx.beginPath();
            ctx.moveTo(rx, p.y + 24);
            ctx.quadraticCurveTo(rx + 8, p.y + 24 + rootLen * 0.5, rx - 4, p.y + 24 + rootLen);
            ctx.stroke();

            // Zarte grüne Blatt-Triebe an der Wurzel
            ctx.fillStyle = theme.base;
            ctx.beginPath();
            ctx.ellipse(rx - 5, p.y + 24 + rootLen, 4.5, 2.5, 0.4, 0, Math.PI * 2);
            ctx.fill();
          }

          // 4. Volumetrische Moos-Krone oben (dichte 3D Moosballen & Gras-Kante)
          const puffR = 16;
          for (let px = p.x + 12; px <= p.x + p.width - 12; px += 22) {
            const mossPuffGrad = ctx.createRadialGradient(px - 3, p.y + 3, 2, px, p.y + 4, puffR);
            mossPuffGrad.addColorStop(0, theme.highlight);
            mossPuffGrad.addColorStop(0.65, theme.base);
            mossPuffGrad.addColorStop(1, theme.dark);
            ctx.fillStyle = mossPuffGrad;
            ctx.beginPath();
            ctx.arc(px, p.y + 4, puffR, 0, Math.PI * 2);
            ctx.fill();
          }

          // Helle sonnige Gras-Lichtkante oben
          ctx.fillStyle = theme.highlight;
          ctx.fillRect(p.x, p.y, p.width, 5);

          // Feine Gras-Halme auf der Oberfläche
          ctx.strokeStyle = "#86efac";
          ctx.lineWidth = 1.8;
          for (let gx = p.x + 8; gx < p.x + p.width - 8; gx += 14) {
            ctx.beginPath();
            ctx.moveTo(gx, p.y + 1);
            ctx.lineTo(gx + 3, p.y - 6);
            ctx.stroke();
          }
        }

        if (p.isKicker) {
          ctx.fillStyle = "#fef08a";
          ctx.font = "900 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🚀 RAMPE!", p.x + p.width * 0.5, p.y - 12);
        }
        ctx.restore();
      }
    }
  }

  // --- 3. 3D-SCHATTIERTE LORE / MINECART RENDERING ---
  drawMinecart(player, isMinecartDucking) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y + player.height * 0.5);

    const cartW = 62;
    const cartH = 32;

    // 1. KOKO IN DER LORE
    ctx.save();
    if (isMinecartDucking) {
      // GEDUCKT: Koko hockt tief in der Lore
      ctx.translate(4, -6);
      const headGrad = ctx.createRadialGradient(-2, -4, 2, 0, 0, 12);
      headGrad.addColorStop(0, "#b45309");
      headGrad.addColorStop(0.7, "#92400e");
      headGrad.addColorStop(1, "#451a03");
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 11, Math.PI, 0);
      ctx.fill();

      // Stirnband
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-10, -5, 20, 4);

      // Fliegerbrille
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.2;
      ctx.fillRect(-7, -2, 14, 6);
      ctx.strokeRect(-7, -2, 14, 6);
    } else {
      // NORMAL SITZEND MIT 3D-SCHATTIERUNG
      ctx.translate(6, -18);

      // Stirnband weht
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-10, -14, 20, 5);
      ctx.beginPath();
      ctx.moveTo(-10, -12);
      ctx.lineTo(-32, -6 + Math.sin(Date.now() * 0.02) * 5);
      ctx.lineTo(-24, -14);
      ctx.closePath();
      ctx.fill();

      // Kopf 3D-Kugel
      const headGrad = ctx.createRadialGradient(4, -9, 2, 6, -6, 12);
      headGrad.addColorStop(0, "#b45309");
      headGrad.addColorStop(0.75, "#92400e");
      headGrad.addColorStop(1, "#381704");
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(-8, -6, 5, 0, Math.PI * 2);
      ctx.arc(6, -6, 11, 0, Math.PI * 2);
      ctx.fill();

      // Schnauze
      const snoutGrad = ctx.createRadialGradient(10, -6, 1, 11, -5, 7);
      snoutGrad.addColorStop(0, "#ffffff");
      snoutGrad.addColorStop(0.5, "#fef3c7");
      snoutGrad.addColorStop(1, "#fde68a");
      ctx.fillStyle = snoutGrad;
      ctx.beginPath();
      ctx.ellipse(11, -5, 7, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Augen / Brille
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(11, -7, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(10, -8, 1, 0, Math.PI * 2);
      ctx.fill();

      // Pfoten am Rand
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.arc(18, 12, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. 3D-LOREN-KÖRPER (RUSTIKALER KÜBEL MIT EISENBESCHLÄGEN)
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, cartH * 0.5 + 8, cartW * 0.55, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const woodGrad = ctx.createLinearGradient(0, -cartH * 0.5, 0, cartH * 0.5);
    woodGrad.addColorStop(0, "#a16207");
    woodGrad.addColorStop(0.4, "#78350f");
    woodGrad.addColorStop(1, "#381704");
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.moveTo(-cartW * 0.5, -cartH * 0.5);
    ctx.lineTo(cartW * 0.5, -cartH * 0.5);
    ctx.lineTo(cartW * 0.42, cartH * 0.5);
    ctx.lineTo(-cartW * 0.42, cartH * 0.5);
    ctx.closePath();
    ctx.fill();

    // Eisenbänder mit metallischem Glanz
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 4;
    ctx.stroke();

    const ironGrad = ctx.createLinearGradient(0, -cartH * 0.5 - 1, 0, -cartH * 0.5 + 4);
    ironGrad.addColorStop(0, "#94a3b8");
    ironGrad.addColorStop(0.5, "#475569");
    ironGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = ironGrad;
    ctx.fillRect(-cartW * 0.5 - 2, -cartH * 0.5 - 1, cartW + 4, 5);
    ctx.fillRect(-6, -cartH * 0.5, 12, cartH);

    // 3. EISERNE RÄDER MIT ROTIERENDEN SPEICHEN
    const wheelR = 11;
    const wheelY = cartH * 0.5 + 2;
    const wheelRot = Date.now() * 0.02;

    [-cartW * 0.28, cartW * 0.28].forEach(wx => {
      ctx.save();
      ctx.translate(wx, wheelY);
      ctx.rotate(wheelRot);

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-wheelR, 0); ctx.lineTo(wheelR, 0);
      ctx.moveTo(0, -wheelR); ctx.lineTo(0, wheelR);
      ctx.stroke();

      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  // --- 4. 3D-KUGELFÖRMIGE MAYA-STEINKUGEL ---
  drawGiantBoulder(boulder) {
    if (!boulder || !boulder.active) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(boulder.x, boulder.y);
    ctx.rotate(boulder.rotation);

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, boulder.radius * 0.9, boulder.radius * 1.1, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D-KUGEL SCHATTIERUNG (Licht oben-links, tiefer Schatten unten-rechts)
    const stoneGrad = ctx.createRadialGradient(
      -boulder.radius * 0.35,
      -boulder.radius * 0.35,
      boulder.radius * 0.1,
      0,
      0,
      boulder.radius
    );
    stoneGrad.addColorStop(0, "#cbd5e1");
    stoneGrad.addColorStop(0.35, "#64748b");
    stoneGrad.addColorStop(0.75, "#334155");
    stoneGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.arc(0, 0, boulder.radius, 0, Math.PI * 2);
    ctx.fill();

    // Totenkopf-Relief
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-14, -8, 6, 0, Math.PI * 2);
    ctx.arc(14, -8, 6, 0, Math.PI * 2);
    ctx.moveTo(0, -2); ctx.lineTo(-4, 6); ctx.lineTo(4, 6); ctx.closePath();
    ctx.moveTo(-18, 16); ctx.lineTo(18, 16);
    ctx.stroke();

    // Risse
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-28, -25); ctx.lineTo(-12, -18); ctx.lineTo(-24, 0);
    ctx.moveTo(22, -30); ctx.lineTo(15, -15); ctx.lineTo(32, 10);
    ctx.stroke();

    ctx.restore();
  }

  // --- 5. DONKEY KONG TIKI-FASS-KANONEN MIT 3D-ZYLINDER-EFFEKT ---
  drawBarrels(barrels, player) {
    const ctx = this.ctx;

    for (let b of barrels) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // 3D-Zylinder Bauch-Schattierung
      const barrelGrad = ctx.createLinearGradient(0, -b.radius, 0, b.radius);
      barrelGrad.addColorStop(0, b.isAuto ? "#ef4444" : "#b45309");
      barrelGrad.addColorStop(0.45, b.isAuto ? "#b91c1c" : "#78350f");
      barrelGrad.addColorStop(1, b.isAuto ? "#7f1d1d" : "#381704");
      ctx.fillStyle = barrelGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.radius * 1.38, b.radius, 0, 0, Math.PI * 2);
      ctx.fill();

      // Goldene Reifen mit Lichtkante
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      // Mündung
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      ctx.ellipse(b.radius * 1.25, 0, 10, b.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = b.isAuto ? "#ef4444" : "#facc15";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Zündschnur
      const fuseX = -b.radius * 1.35;
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fuseX, 0);
      ctx.quadraticCurveTo(fuseX - 12, -8, fuseX - 16, -18);
      ctx.stroke();

      ctx.fillStyle = (Math.floor(Date.now() / 60) % 2 === 0) ? "#facc15" : "#ef4444";
      ctx.beginPath();
      ctx.arc(fuseX - 16, -18, 4.5 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();

      // ZIELSTRAHL
      if (player.state === "in_barrel" && player.activeBarrel === b) {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.95)";
        ctx.lineWidth = 3.5;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(b.radius * 1.3, 0);
        ctx.lineTo(b.radius * 1.3 + 320, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        const targetX = b.radius * 1.3 + 320;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(targetX, 0, 15, 0, Math.PI * 2);
        ctx.moveTo(targetX - 20, 0); ctx.lineTo(targetX + 20, 0);
        ctx.moveTo(targetX, -20); ctx.lineTo(targetX, 20);
        ctx.stroke();

        ctx.fillStyle = "#facc15";
        ctx.font = "900 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎯 TIPPEN ZUM FEUER!", 0, -b.radius - 18);
      }
      ctx.restore();
    }
  }


  // --- TÖDLICHE HERABFALLENDE KOKOSNÜSSE MIT BODEN-WARNUNG ---
  drawFallingCoconuts(coconuts) {
    if (!coconuts || !coconuts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let c of coconuts) {
      if (c.shattered) continue;

      // 1. Roter Warn-Schatten / Ziel-Retikel am Boden
      ctx.save();
      const warnRatio = Math.max(0, Math.min(1, 1 - (c.targetY - c.y) / 460));
      const pulse = Math.sin(now * 0.02) * 2;
      ctx.translate(c.targetX, c.targetY);

      // Rote pulsierende Gefahrenzone
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 + warnRatio * 0.45})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + warnRatio * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Schrumpfender Countdown-Zielring
      const shrinkRadius = Math.max(0, (1 - warnRatio) * 36);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + shrinkRadius, 7.5 + shrinkRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warn-Icon "⚠️" solange noch im Anflug
      if (warnRatio < 0.88) {
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText("⚠️", 0, -14);
        ctx.fillText("⚠️", 0, -14);
      }
      ctx.restore();

      // 2. Die herabstürzende Kokosnuss
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation || (now * 0.008));

      // Dunkelbraune Kokos-Schale
      const nutGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      nutGrad.addColorStop(0, "#a16207");
      nutGrad.addColorStop(0.4, "#78350f");
      nutGrad.addColorStop(0.85, "#451a03");
      nutGrad.addColorStop(1, "#1c0b02");
      ctx.fillStyle = nutGrad;
      ctx.strokeStyle = "#1c0b02";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Faserige Rillen
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -0.6, 0.6);
      ctx.arc(0, 0, 11, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();

      // 3 typische dunkle Kokosnuss-Augen
      ctx.fillStyle = "#1c0b02";
      [-4, 4].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, -6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Weißer Glanzpunkt
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(-5, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- 6. 3D-SCHATTIERTER HELD KOKO (PIXAR / VOLUMETRIC CARTOON ART) ---
  drawKoko(player, isSuperSonic, slowmoFactor) {
    const ctx = this.ctx;
    if (player.state === "in_barrel" || player.state === "in_minecart") return;

    ctx.save();
    ctx.translate(player.x, player.y + player.height * 0.5);

    // KOKO SPORTLICH & SCHLANK SKALIEREN (1.08x für präzise Steuerung & harmonische Proportionen)
    ctx.scale(1.08, 1.08);

    // Dynamischer Schlagschatten auf dem Boden
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.beginPath();
    ctx.ellipse(0, 24, 18, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // SPRECHBLASE
    if (player.speechBubble) {
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-36, -58, 105, 25, 8);
      else ctx.rect(-36, -58, 105, 25);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(player.speechBubble, 16, -42);
      ctx.restore();
    }

    // MOTION BLUR NACHBILD
    if (slowmoFactor < 0.9) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.translate(-player.vx * 0.02, -player.vy * 0.02);
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Schutz-Schild
    if (player.invulnerableTimer > 0) {
      const shieldAlpha = 0.55 + Math.sin(Date.now() * 0.02) * 0.4;
      ctx.strokeStyle = `rgba(250, 204, 21, ${shieldAlpha})`;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.stroke();
    }

    // KÖNIGLICHE GOLD-KOKO AURA (100% K-O-K-O MEISTER)
    if (player.isGoldKoko) {
      const goldPulse = Math.sin(Date.now() * 0.02) * 5;
      const goldAura = ctx.createRadialGradient(0, 0, 8, 0, 0, 42 + goldPulse);
      goldAura.addColorStop(0, "rgba(254, 240, 138, 0.95)");
      goldAura.addColorStop(0.5, "rgba(250, 204, 21, 0.55)");
      goldAura.addColorStop(1, "rgba(234, 179, 8, 0)");
      ctx.fillStyle = goldAura;
      ctx.beginPath();
      ctx.arc(0, 0, 42 + goldPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // SUPER-SONIC FRENZY GLÜHENDE AURA & GHOST-TRAILS (KOKO BLEIBT VOLL SICHTBAR!)
    if (isSuperSonic) {
      // Dreifacher goldener Kometen-Schweif / Ghost-Afterimages hinter Koko
      [-32, -20, -10].forEach((offsetX, idx) => {
        ctx.save();
        ctx.translate(offsetX, Math.sin((Date.now() * 0.02) + idx) * 3);
        ctx.globalAlpha = 0.16 + idx * 0.14;
        ctx.fillStyle = idx === 2 ? "#facc15" : "#f97316";
        ctx.beginPath();
        ctx.ellipse(0, 4, 18 + idx * 2, 15 + idx * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Flammende goldene Aura um Koko
      const auraPulse = Math.sin(Date.now() * 0.035) * 4;
      ctx.save();
      ctx.strokeStyle = "rgba(250, 204, 21, 0.95)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 2, 32 + auraPulse, 0, Math.PI * 2);
      ctx.stroke();

      const auraGrad = ctx.createRadialGradient(0, 2, 6, 0, 2, 36 + auraPulse);
      auraGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      auraGrad.addColorStop(0.45, "rgba(250, 204, 21, 0.35)");
      auraGrad.addColorStop(0.8, "rgba(249, 115, 22, 0.18)");
      auraGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 2, 36 + auraPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- DIDDY-KONG / ENTDECKER-STYLE: ARTIKULIERTER 2.5D AFFEN-HELD KOKO ---
    const OUTLINE = "#1e0a02";
    const now = Date.now();
    const isFlying = (player.state === "jumping" || player.state === "barrel_flying" || player.state === "grapple_swing" || player.state === "on_zipline");
    const isHanging = (player.state === "grapple_swing" || player.state === "on_zipline");
    const runPhase = now * 0.019;
    const runCycle = isFlying ? 0.65 : Math.sin(runPhase);
    const bounceY = isFlying ? 0 : Math.abs(Math.cos(runPhase)) * -3.5;

    ctx.translate(0, bounceY);

    // 360°-SALTO ROTATION BEIM DOPPELSPRUNG IN DER LUFT
    if (player.isDoubleJumping && player.flipAngle > 0 && !player.isGrounded) {
      ctx.rotate(player.flipAngle);
      ctx.save();
      ctx.strokeStyle = "rgba(250, 204, 21, 0.8)";
      ctx.lineWidth = 3.2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 1.65);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (player.state === "barrel_flying") {
      ctx.rotate(0.28);
    } else if (!isFlying) {
      // Sportliche Vorwärtsneigung beim Sprinten
      ctx.rotate(0.10);
    }

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Helper für artikulierte Affen-Gliedmaßen (Oberarm/Unterarm bzw. Bein + Hand/Fuß)
    const drawLimb = (sx, sy, ex, ey, handX, handY, furColor, isArm, hasWristband) => {
      ctx.save();
      // Dunkle Cartoon-Außenkontur
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = isArm ? 10.5 : 11.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(ex, ey, handX, handY);
      ctx.stroke();

      // Warmes Affenfell innen
      ctx.strokeStyle = furColor;
      ctx.lineWidth = isArm ? 6.2 : 7.0;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(ex, ey, handX, handY);
      ctx.stroke();

      // Goldenes Entdecker-Schweißband am Handgelenk
      if (hasWristband) {
        const wx = ex * 0.35 + handX * 0.65;
        const wy = ey * 0.35 + handY * 0.65;
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(wx, wy, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Helle Affen-Hand / Pfote / Fuß
      ctx.fillStyle = "#fde68a";
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      if (isArm) {
        ctx.arc(handX, handY, 5.2, 0, Math.PI * 2);
      } else {
        ctx.ellipse(handX + 2.5, handY, 6.8, 4.2, 0.15, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    // 1. HINTERES BEIN & HINTERER ARM (Für echte 3D-Tiefenstaffelung hinter dem Körper)
    const backLegAngle = -runCycle;
    const bKneeX = -3 + backLegAngle * 6;
    const bKneeY = 14 + Math.max(0, -backLegAngle * 4);
    const bFootX = -4 + backLegAngle * 13;
    const bFootY = isFlying ? 19 : 23 - Math.max(0, backLegAngle * 6);
    drawLimb(-3, 9, bKneeX, bKneeY, bFootX, bFootY, "#92400e", false, false);

    if (isHanging) {
      drawLimb(4, -3, 8, -16, 6, -26, "#92400e", true, false);
    } else {
      const backArmAngle = runCycle;
      const bElbowX = 2 + backArmAngle * 7;
      const bElbowY = 2 + Math.abs(backArmAngle) * 3;
      const bHandX = 6 + backArmAngle * 14;
      const bHandY = isFlying ? -8 : 5 - backArmAngle * 7;
      drawLimb(2, -2, bElbowX, bElbowY, bHandX, bHandY, "#92400e", true, false);
    }

    // 2. LANGER, GESCHWUNGENER GREIFSCHWANZ (S-Kurve mit Kringelspitze)
    const tailWave = Math.sin(now * 0.014) * 7;
    ctx.save();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 9.5;
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.bezierCurveTo(-26, 10 + tailWave * 0.5, -34, -10 + tailWave, -22, -20 + tailWave);
    ctx.stroke();

    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 5.5;
    ctx.stroke();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Kringelspitze am Schwanzende
    ctx.fillStyle = "#d97706";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(-22, -20 + tailWave, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. RAKETEN-FASS (JETPACK) ODER ENTDECKER-RUCKSACK AM RÜCKEN
    ctx.save();
    if (player.state === "in_rocket") {
      // Spektakuläres Jet-Barrel auf Kokos Rücken mit Zwillings-Feuerstrahl!
      const jetGrad = ctx.createLinearGradient(-30, -18, -10, 18);
      jetGrad.addColorStop(0, "#f87171");
      jetGrad.addColorStop(0.4, "#dc2626");
      jetGrad.addColorStop(0.85, "#991b1b");
      jetGrad.addColorStop(1, "#450a0a");
      ctx.fillStyle = jetGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-28, -14, 18, 28, 5);
      else ctx.rect(-28, -14, 18, 28);
      ctx.fill();
      ctx.stroke();

      // Goldene Reifen am Jetpack
      ctx.fillStyle = "#facc15";
      [-10, 6].forEach(by => {
        ctx.fillRect(-28, by, 18, 3.5);
      });

      // Zwillings-Feuerstrahl nach hinten-unten
      const flameLen = 28 + Math.sin(now * 0.04) * 12;
      const flameGrad = ctx.createLinearGradient(-26, 14, -26 - flameLen * 0.7, 14 + flameLen);
      flameGrad.addColorStop(0, "#ffffff");
      flameGrad.addColorStop(0.2, "#fef08a");
      flameGrad.addColorStop(0.5, "#f97316");
      flameGrad.addColorStop(0.85, "#ef4444");
      flameGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-28, 14);
      ctx.lineTo(-28 - flameLen * 0.8, 14 + flameLen * 0.6);
      ctx.lineTo(-12, 14);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#15803d";
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-16, -6, 11, 15, 4);
      else ctx.rect(-16, -6, 11, 15);
      ctx.fill();
      ctx.stroke();

      // Goldene Rucksack-Schnalle & Schlafrollen-Aufsatz
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-15, -1, 6, 3.5);
      ctx.fillStyle = "#ca8a04";
      ctx.beginPath();
      ctx.ellipse(-11, -7, 5, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 4. TORSO (Warmes Honigbraun + heller Bauch + Rote Diddy-Kong Entdecker-Weste)
    ctx.save();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.0;

    const bodyGrad = ctx.createRadialGradient(-2, 0, 2, -1, 3, 16);
    bodyGrad.addColorStop(0, "#fcd34d");
    bodyGrad.addColorStop(0.45, "#d97706");
    bodyGrad.addColorStop(0.85, "#92400e");
    bodyGrad.addColorStop(1, "#451a03");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(-1, 3, 13.5, 14.5, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cremefarbener Affenbauch
    const bellyGrad = ctx.createRadialGradient(4, 3, 1, 3, 4, 10);
    bellyGrad.addColorStop(0, "#ffffff");
    bellyGrad.addColorStop(0.6, "#fef3c7");
    bellyGrad.addColorStop(1, "#fde68a");
    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.ellipse(3.5, 4, 8.5, 10.5, 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Entdecker-Weste mit Goldrand (königlich goldene Weste bei Gold-Koko!)
    const vestGrad = ctx.createLinearGradient(-10, -8, 6, 10);
    if (player.isGoldKoko) {
      vestGrad.addColorStop(0, "#fef08a");
      vestGrad.addColorStop(0.5, "#facc15");
      vestGrad.addColorStop(1, "#b45309");
    } else {
      vestGrad.addColorStop(0, "#ef4444");
      vestGrad.addColorStop(0.6, "#dc2626");
      vestGrad.addColorStop(1, "#991b1b");
    }
    ctx.fillStyle = vestGrad;
    ctx.beginPath();
    ctx.moveTo(-11, -6);
    ctx.quadraticCurveTo(-2, -10, 6, -5);
    ctx.lineTo(3, 8);
    ctx.quadraticCurveTo(-5, 9, -11, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Goldener Stern / Kompass-Pin auf der Weste
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(-2, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. VORDERES BEIN MIT FUSS
    const frontLegAngle = runCycle;
    const fKneeX = -1 + frontLegAngle * 7;
    const fKneeY = 14 + Math.max(0, -frontLegAngle * 4);
    const fFootX = -1 + frontLegAngle * 14;
    const fFootY = isFlying ? 17 : 23 - Math.max(0, frontLegAngle * 7);
    drawLimb(-1, 10, fKneeX, fKneeY, fFootX, fFootY, "#d97706", false, false);

    // 6. KOPF MIT HERZFÖRMIGER AFFEN-MASKE, GROSSEN OHREN & ENTDECKER-CAP
    ctx.save();
    ctx.translate(6, -12);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.0;

    // Hinteres Ohr (rechts/vorne leicht sichtbar)
    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.arc(10, -4, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Haupt-Schädel (Flauschiges Honigbraun)
    const headGrad = ctx.createRadialGradient(0, -3, 2, 1, -1, 13);
    headGrad.addColorStop(0, "#fbbf24");
    headGrad.addColorStop(0.5, "#d97706");
    headGrad.addColorStop(0.9, "#92400e");
    headGrad.addColorStop(1, "#451a03");
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(1, -1, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Flauschige Backen-Fellbüschel
    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.lineTo(-12, 5);
    ctx.lineTo(-7, 7);
    ctx.fill();

    // Großes seitliches Affen-Ohr (links) mit rosa Innenohr
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.arc(-9, -1, 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fda4af";
    ctx.beginPath();
    ctx.arc(-8.5, -1, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Typische herzförmige helle Affen-Gesichtsmaske um die Augen
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(3, -3, 6.2, 0, Math.PI * 2);
    ctx.arc(8.5, -3, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Plastische 3D-Affenschnauze (Muzzle)
    const snoutGrad = ctx.createRadialGradient(8, 2, 1, 7, 3, 9.5);
    snoutGrad.addColorStop(0, "#ffffff");
    snoutGrad.addColorStop(0.55, "#fef3c7");
    snoutGrad.addColorStop(1, "#f59e0b");
    ctx.fillStyle = snoutGrad;
    ctx.beginPath();
    ctx.ellipse(8.5, 3.2, 8.8, 6.5, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kleine Nasenlöcher
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.ellipse(11.5, 1.2, 1.3, 1.8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(14.2, 1.5, 1.1, 1.6, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Ausdrucksstarker Mund (Jubelnd offen im Flug, selbstbewusstes Lächeln beim Laufen)
    if (isFlying || isSuperSonic) {
      ctx.fillStyle = "#7f1d1d";
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(9.5, 4.8, 3.8, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Zunge
      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.arc(9.5, 6.5, 2.1, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(8.5, 3.8, 4.8, 0.18, Math.PI - 0.25);
      ctx.stroke();
    }

    // GROSSE EXPRESSIVE AUGEN MIT DOPPELTEM GLANZPUNKT
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(5.5, -3.2, 3.8, 5.2, 0.05, 0, Math.PI * 2);
    ctx.ellipse(10.5, -3.0, 3.2, 4.6, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lebendige dunkle Pupillen + braune Iris
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.arc(6.6, -3.0, 2.5, 0, Math.PI * 2);
    ctx.arc(11.3, -2.8, 2.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.arc(6.9, -3.0, 1.6, 0, Math.PI * 2);
    ctx.arc(11.5, -2.8, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Strahlende Glanzlichter in den Augen
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(6.0, -4.4, 1.2, 0, Math.PI * 2);
    ctx.arc(10.8, -4.1, 1.0, 0, Math.PI * 2);
    ctx.arc(7.4, -1.8, 0.55, 0, Math.PI * 2);
    ctx.fill();

    // ROTE DIDDY-KONG ENTDECKER-CAP + WEHENDES STIRNBAND + FLIEGERBRILLE
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;

    // Wehende Bandana-Bänder im Wind hinter dem Kopf (golden bei Gold-Koko)
    const bandWave = Math.sin(now * 0.024) * 4.5;
    ctx.fillStyle = player.isGoldKoko ? "#f59e0b" : "#dc2626";
    ctx.beginPath();
    ctx.moveTo(-9, -7);
    ctx.quadraticCurveTo(-20, -10 + bandWave, -27, -5 + bandWave);
    ctx.lineTo(-24, -1 + bandWave);
    ctx.quadraticCurveTo(-16, -5 + bandWave * 0.5, -9, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Entdecker-Cap-Kuppel oben auf dem Kopf (golden bei Gold-Koko)
    const capGrad = ctx.createLinearGradient(-8, -16, 10, -6);
    if (player.isGoldKoko) {
      capGrad.addColorStop(0, "#ffffff");
      capGrad.addColorStop(0.4, "#facc15");
      capGrad.addColorStop(1, "#ca8a04");
    } else {
      capGrad.addColorStop(0, "#f87171");
      capGrad.addColorStop(0.4, "#ef4444");
      capGrad.addColorStop(1, "#b91c1c");
    }
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(0.5, -6.5, 11.5, Math.PI * 1.05, Math.PI * 1.98);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cap-Schirm (Visor) nach vorne
    ctx.fillStyle = player.isGoldKoko ? "#eab308" : "#dc2626";
    ctx.beginPath();
    ctx.moveTo(4, -9);
    ctx.quadraticCurveTo(18, -11, 20, -6.5);
    ctx.quadraticCurveTo(12, -5.5, 3, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Flauschiger Haar-Schopf, der frech unter der Kappe hervorschaut
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(3, -8);
    ctx.lineTo(7, -13);
    ctx.lineTo(8, -8.5);
    ctx.lineTo(12, -12);
    ctx.lineTo(10, -7);
    ctx.closePath();
    ctx.fill();

    // Goldene Entdecker-Fliegerbrille (auf der Stirn der Cap sitzend)
    ctx.fillStyle = "#38bdf8";
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(0, -13.5, 6.5, 5, 2);
      ctx.roundRect(7, -13.5, 6.5, 5, 2);
    } else {
      ctx.rect(0, -13.5, 6.5, 5);
      ctx.rect(7, -13.5, 6.5, 5);
    }
    ctx.fill();
    ctx.stroke();

    // GOLDENE MAYA-KRONE FÜR DEN 100% K-O-K-O MEISTER
    if (player.isGoldKoko) {
      ctx.save();
      ctx.translate(2, -20);
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-9, 3);
      ctx.lineTo(-10, -5);
      ctx.lineTo(-5, -1);
      ctx.lineTo(0, -8);
      ctx.lineTo(5, -1);
      ctx.lineTo(10, -5);
      ctx.lineTo(9, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rubin & Saphir Juwelen in der Krone
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, -1, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(-5, 0, 1.2, 0, Math.PI * 2);
      ctx.arc(5, 0, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Krone Glitzerstern
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, -7, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // 7. VORDERER ARM MIT HAND & GOLDENEM SCHWEISSBAND (Vor dem Körper gezeichnet!)
    if (isHanging) {
      // Greift hoch zur Liane oder Zipline-Rolle!
      drawLimb(-1, -2, 3, -15, 4, -27, "#f59e0b", true, true);
    } else {
      const frontArmAngle = -runCycle;
      const fElbowX = -2 + frontArmAngle * 7;
      const fElbowY = 3 + Math.abs(frontArmAngle) * 3.5;
      const fHandX = 3 + frontArmAngle * 14;
      const fHandY = isFlying ? -7 : 5 + frontArmAngle * 7;
      drawLimb(-2, -1, fElbowX, fElbowY, fHandX, fHandY, "#f59e0b", true, true);
    }
    ctx.restore();
  }

  // --- 7. WEITERE OBJEKTE (GONGS, HINDERNISSE, BANANEN, PELIKAN) ---
  drawMayaGongs(gongs) {
    const ctx = this.ctx;
    for (let g of gongs) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-g.radius - 8, -g.radius - 20, 10, g.radius * 2 + 25);
      ctx.fillRect(g.radius - 2, -g.radius - 20, 10, g.radius * 2 + 25);
      ctx.fillRect(-g.radius - 8, -g.radius - 22, g.radius * 2 + 20, 8);

      const gongGrad = ctx.createRadialGradient(-g.radius * 0.3, -g.radius * 0.3, 4, 0, 0, g.radius);
      gongGrad.addColorStop(0, "#fef9c3");
      gongGrad.addColorStop(0.4, "#facc15");
      gongGrad.addColorStop(0.8, "#ca8a04");
      gongGrad.addColorStop(1, "#592b02");
      ctx.fillStyle = gongGrad;
      ctx.beginPath();
      ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
      ctx.fill();

      if (g.ringTimer > 0) {
        ctx.strokeStyle = `rgba(250, 204, 21, ${g.ringTimer * 1.5})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, g.radius + (1 - g.ringTimer) * 85, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }


  // --- TÖDLICHE HERABFALLENDE KOKOSNÜSSE MIT BODEN-WARNUNG ---
  drawFallingCoconuts(coconuts) {
    if (!coconuts || !coconuts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let c of coconuts) {
      if (c.shattered) continue;

      // 1. Roter Warn-Schatten / Ziel-Retikel am Boden
      ctx.save();
      const warnRatio = Math.max(0, Math.min(1, 1 - (c.targetY - c.y) / 460));
      const pulse = Math.sin(now * 0.02) * 2;
      ctx.translate(c.targetX, c.targetY);

      // Rote pulsierende Gefahrenzone
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 + warnRatio * 0.45})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + warnRatio * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Schrumpfender Countdown-Zielring
      const shrinkRadius = Math.max(0, (1 - warnRatio) * 36);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + shrinkRadius, 7.5 + shrinkRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warn-Icon "⚠️" solange noch im Anflug
      if (warnRatio < 0.88) {
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText("⚠️", 0, -14);
        ctx.fillText("⚠️", 0, -14);
      }
      ctx.restore();

      // 2. Die herabstürzende Kokosnuss
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation || (now * 0.008));

      // Dunkelbraune Kokos-Schale
      const nutGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      nutGrad.addColorStop(0, "#a16207");
      nutGrad.addColorStop(0.4, "#78350f");
      nutGrad.addColorStop(0.85, "#451a03");
      nutGrad.addColorStop(1, "#1c0b02");
      ctx.fillStyle = nutGrad;
      ctx.strokeStyle = "#1c0b02";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Faserige Rillen
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -0.6, 0.6);
      ctx.arc(0, 0, 11, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();

      // 3 typische dunkle Kokosnuss-Augen
      ctx.fillStyle = "#1c0b02";
      [-4, 4].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, -6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Weißer Glanzpunkt
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(-5, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- SICHTBARE HÄNGE-LIANEN MIT GOLDENEM GREIF-RING ---
  drawGrappleAnchors(grappleAnchors, player, hook) {
    if (!grappleAnchors || !grappleAnchors.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let a of grappleAnchors) {
      // Wenn Koko bereits genau an diesem Anker schwingt, zeichnet drawGrappleVine die gespannte Liane
      const isAttachedHere = hook && hook.active && Math.abs(hook.anchorX - a.x) < 5 && Math.abs(hook.anchorY - a.y) < 5;
      const swayX = isAttachedHere ? 0 : Math.sin(now * 0.003 + a.x * 0.02) * 14;
      const ringX = a.x + swayX;
      const ringY = a.y;
      const canopyY = a.y - 310;

      ctx.save();

      // 1. Haupt-Liane von den Baumkronen bis zum Greif-Ring
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, canopyY);
      ctx.quadraticCurveTo(a.x + swayX * 0.55, (canopyY + ringY) * 0.5, ringX, ringY);
      ctx.stroke();

      // Hellgrüne Lichtkante auf der Liane
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.x - 1.5, canopyY);
      ctx.quadraticCurveTo(a.x + swayX * 0.55 - 1.5, (canopyY + ringY) * 0.5, ringX - 1.5, ringY);
      ctx.stroke();

      // Kleine tropische Blätter entlang der Hänge-Liane
      for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        const lx = a.x + swayX * t * 0.85;
        const ly = canopyY + (ringY - canopyY) * t;
        const side = i % 2 === 0 ? 1 : -1;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(side * 0.45 + swayX * 0.01);
        ctx.fillStyle = i % 2 === 0 ? "#22c55e" : "#4ade80";
        ctx.beginPath();
        ctx.ellipse(side * 9, 0, 10, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Pulsierender Ziel-Halo um den Greif-Ring
      const distToPlayer = player ? Math.hypot(player.x - a.x, player.y - a.y) : 999;
      const inRange = player && !isAttachedHere && distToPlayer < 195 && a.x > player.x - 45 && a.x < player.x + 175;
      const pulse = Math.sin(now * 0.008 + a.x) * 4;

      ctx.strokeStyle = inRange ? "rgba(74, 222, 128, 0.95)" : "rgba(250, 204, 21, 0.55)";
      ctx.lineWidth = inRange ? 3.5 : 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(ringX, ringY, 24 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Goldener Maya-Greifring am Ende der Liane
      ctx.fillStyle = "rgba(250, 204, 21, 0.28)";
      ctx.beginPath();
      ctx.arc(ringX, ringY, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(ringX, ringY, 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = inRange ? "#4ade80" : "#fef08a";
      ctx.beginPath();
      ctx.arc(ringX, ringY, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Visueller Hinweis wenn Koko in Greif-Reichweite ist
      if (inRange) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(ringX - 56, ringY - 46, 112, 22, 8);
        else ctx.rect(ringX - 56, ringY - 46, 112, 22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#4ade80";
        ctx.font = "900 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🌿 LIANE GREIFEN!", ringX, ringY - 31);
      }

      ctx.restore();
    }
  }

  drawGrappleVine(player, hook) {
    if (!hook || !hook.active) return;
    const ctx = this.ctx;
    ctx.save();
    // Gespannte Liane vom Ankerpunkt zu Koko
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + 8);
    ctx.quadraticCurveTo((player.x + hook.anchorX) * 0.5, Math.min(player.y, hook.anchorY) + 12, hook.anchorX, hook.anchorY);
    ctx.stroke();

    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + 8);
    ctx.quadraticCurveTo((player.x + hook.anchorX) * 0.5, Math.min(player.y, hook.anchorY) + 12, hook.anchorX, hook.anchorY);
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(hook.anchorX, hook.anchorY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBongoPads(bongoPads) {
    const ctx = this.ctx;
    for (let pad of bongoPads) {
      ctx.save();
      ctx.translate(pad.x, pad.y);
      ctx.fillStyle = "#15803d";
      ctx.fillRect(-7, 0, 14, 30);

      const capGrad = ctx.createRadialGradient(0, -6, 5, 0, -6, pad.radius);
      capGrad.addColorStop(0, "#f472b6");
      capGrad.addColorStop(0.7, "#db2777");
      capGrad.addColorStop(1, "#831843");
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.arc(0, -4, pad.radius, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawBananas(bananas) {
    const ctx = this.ctx;
    const now = Date.now() * 0.005;
    for (let b of bananas) {
      if (b.collected) continue;
      ctx.save();
      ctx.translate(b.x, b.y + Math.sin(now + b.x * 0.06) * 4);

      if (b.isDiamond) {
        const dGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, 22);
        dGrad.addColorStop(0, "rgba(245, 208, 254, 0.95)");
        dGrad.addColorStop(0.5, "rgba(192, 132, 252, 0.65)");
        dGrad.addColorStop(1, "rgba(147, 51, 234, 0)");
        ctx.fillStyle = dGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 7.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0.35, 2.75);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(250, 204, 21, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0.35, 2.75);
        ctx.stroke();

        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0.7, 2.4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }


  // --- TÖDLICHE HERABFALLENDE KOKOSNÜSSE MIT BODEN-WARNUNG ---
  drawFallingCoconuts(coconuts) {
    if (!coconuts || !coconuts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let c of coconuts) {
      if (c.shattered) continue;

      // 1. Roter Warn-Schatten / Ziel-Retikel am Boden
      ctx.save();
      const warnRatio = Math.max(0, Math.min(1, 1 - (c.targetY - c.y) / 460));
      const pulse = Math.sin(now * 0.02) * 2;
      ctx.translate(c.targetX, c.targetY);

      // Rote pulsierende Gefahrenzone
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 + warnRatio * 0.45})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + warnRatio * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Schrumpfender Countdown-Zielring
      const shrinkRadius = Math.max(0, (1 - warnRatio) * 36);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + shrinkRadius, 7.5 + shrinkRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warn-Icon "⚠️" solange noch im Anflug
      if (warnRatio < 0.88) {
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText("⚠️", 0, -14);
        ctx.fillText("⚠️", 0, -14);
      }
      ctx.restore();

      // 2. Die herabstürzende Kokosnuss
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation || (now * 0.008));

      // Dunkelbraune Kokos-Schale
      const nutGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      nutGrad.addColorStop(0, "#a16207");
      nutGrad.addColorStop(0.4, "#78350f");
      nutGrad.addColorStop(0.85, "#451a03");
      nutGrad.addColorStop(1, "#1c0b02");
      ctx.fillStyle = nutGrad;
      ctx.strokeStyle = "#1c0b02";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Faserige Rillen
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -0.6, 0.6);
      ctx.arc(0, 0, 11, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();

      // 3 typische dunkle Kokosnuss-Augen
      ctx.fillStyle = "#1c0b02";
      [-4, 4].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, -6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Weißer Glanzpunkt
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(-5, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- 7b. 3 LEGENDÄRE AUTOREN-RELIKTE (GEOCACHING EASTER EGGS) ---
  drawRelics(relics) {
    const ctx = this.ctx;
    const now = Date.now();
    for (let r of relics) {
      if (r.collected) continue;
      ctx.save();
      const hoverY = Math.sin(now * 0.005 + r.x) * 7;
      ctx.translate(r.x, r.y + hoverY);

      // Sanfter Lichtstrahl nach oben (Beacon)
      const rayGrad = ctx.createLinearGradient(0, -90, 0, 10);
      rayGrad.addColorStop(0, "rgba(250, 204, 21, 0)");
      rayGrad.addColorStop(0.7, "rgba(250, 204, 21, 0.22)");
      rayGrad.addColorStop(1, "rgba(250, 204, 21, 0.45)");
      ctx.fillStyle = rayGrad;
      ctx.fillRect(-18, -90, 36, 100);

      // Goldener Puls-Aura Kreis
      const haloPulse = Math.sin(now * 0.008 + r.x) * 4;
      ctx.strokeStyle = r.color || "#facc15";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, 26 + haloPulse, 0, Math.PI * 2);
      ctx.stroke();

      const bgGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 26);
      bgGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      bgGrad.addColorStop(0.5, r.color || "rgba(250, 204, 21, 0.65)");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();

      // Relikt-Icon
      ctx.font = "26px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(r.icon, 0, 2);

      // Glyphen-Hinweis über dem Relikt
      if (r.glyph) {
        ctx.font = "900 11px sans-serif";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText(`KRYPTEX: ${r.glyph}`, 0, -34);
        ctx.fillStyle = "#fef08a";
        ctx.fillText(`KRYPTEX: ${r.glyph}`, 0, -34);
      }

      // Glitzersterne
      for (let s = 0; s < 4; s++) {
        const starAngle = (now * 0.003 + s * (Math.PI / 2)) % (Math.PI * 2);
        const starDist = 32 + Math.sin(now * 0.006 + s) * 4;
        const sx = Math.cos(starAngle) * starDist;
        const sy = Math.sin(starAngle) * starDist;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- 7b2. WIEDERHOLTE MAYA-GLYPHEN-STELEN (ZUSÄTZLICHE KRYPTEX-CHANCEN) ---
  drawMayaSteles(steles) {
    if (!steles || !steles.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let s of steles) {
      if (s.collected) continue;
      ctx.save();
      ctx.translate(s.x, s.y);

      // 1. Sanfter Sonnen-Aura Glow am Boden
      const glowGrad = ctx.createRadialGradient(0, -25, 6, 0, -25, 48);
      glowGrad.addColorStop(0, "rgba(250, 204, 21, 0.55)");
      glowGrad.addColorStop(0.5, "rgba(234, 179, 8, 0.25)");
      glowGrad.addColorStop(1, "rgba(234, 179, 8, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, -25, 48, 0, Math.PI * 2);
      ctx.fill();

      // 2. Antike gemeißelte Maya-Stele (Steinmonolith)
      const steleGrad = ctx.createLinearGradient(-16, 0, 16, 0);
      steleGrad.addColorStop(0, "#334155");
      steleGrad.addColorStop(0.3, "#475569");
      steleGrad.addColorStop(0.7, "#64748b");
      steleGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = steleGrad;
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-14, -54);
      ctx.quadraticCurveTo(0, -62, 14, -54);
      ctx.lineTo(16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eingemeißelte Runenlinien
      ctx.strokeStyle = "rgba(250, 204, 21, 0.65)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-8, -42); ctx.lineTo(8, -42);
      ctx.moveTo(-10, -26); ctx.lineTo(10, -26);
      ctx.moveTo(-6, -10); ctx.lineTo(6, -10);
      ctx.stroke();

      // 3. Schwebende, pulsierende Glyphe über der Stele
      const floatY = -78 + Math.sin(now * 0.005 + s.x) * 6;
      ctx.font = "900 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 12;
      ctx.fillText(s.glyph, 0, floatY);
      ctx.shadowBlur = 0;

      // Beschriftung: "🗿 STELE" + Ring-Nummer
      ctx.font = "900 10.5px sans-serif";
      ctx.fillStyle = "#fef08a";
      ctx.strokeStyle = "#1e0a02";
      ctx.lineWidth = 2.8;
      const label = `🗿 RING ${s.ringIndex + 1}`;
      ctx.strokeText(label, 0, floatY - 20);
      ctx.fillText(label, 0, floatY - 20);

      ctx.restore();
    }
  }

  // --- 7c. BOSS 1: DER MAYA-STEINKOLOSS (ZONE 3, ~2.100m) ---
  drawMayanColossus(colossus, worldGroundY) {
    if (!colossus || !colossus.active) return;
    const ctx = this.ctx;
    const now = Date.now();

    ctx.save();
    ctx.translate(colossus.x, worldGroundY - 260 + colossus.riseY);

    // 1. Gewaltiger Stein-Torso im Hintergrund (Volumetrischer Maya-Götze)
    const stoneGrad = ctx.createLinearGradient(-150, 0, 150, 0);
    stoneGrad.addColorStop(0, "#1e293b");
    stoneGrad.addColorStop(0.3, "#334155");
    stoneGrad.addColorStop(0.7, "#475569");
    stoneGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = stoneGrad;

    // Schultern & Nacken
    ctx.beginPath();
    ctx.moveTo(-160, 240);
    ctx.lineTo(-130, 80);
    ctx.lineTo(-70, 40);
    ctx.lineTo(70, 40);
    ctx.lineTo(130, 80);
    ctx.lineTo(160, 240);
    ctx.closePath();
    ctx.fill();

    // Koloss-Kopf mit Maya-Helm
    ctx.fillStyle = "#334155";
    ctx.fillRect(-70, -70, 140, 120);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 4;
    ctx.strokeRect(-70, -70, 140, 120);

    // Maya-Helm Federschmuck / Steinzinnen
    ctx.fillStyle = "#ca8a04";
    ctx.beginPath();
    ctx.moveTo(-75, -70);
    ctx.lineTo(-45, -120);
    ctx.lineTo(-15, -70);
    ctx.lineTo(0, -135);
    ctx.lineTo(15, -70);
    ctx.lineTo(45, -120);
    ctx.lineTo(75, -70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Risse mit glühender Lava in der Steinhaut
    ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-40, -40); ctx.lineTo(-20, -15); ctx.lineTo(-30, 20);
    ctx.moveTo(35, -50); ctx.lineTo(15, -10); ctx.lineTo(25, 30);
    ctx.stroke();

    // Drohende, pulsierende Rubin-Augen
    const eyeGlow = 0.65 + Math.sin(now * 0.01) * 0.35;
    ctx.fillStyle = `rgba(239, 68, 68, ${eyeGlow})`;
    ctx.beginPath();
    ctx.arc(-28, -25, 9, 0, Math.PI * 2);
    ctx.arc(28, -25, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-26, -26, 3, 0, Math.PI * 2);
    ctx.arc(30, -26, 3, 0, Math.PI * 2);
    ctx.fill();

    // Maya-Zähne
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-35, 12, 70, 14);
    ctx.fillStyle = "#e2e8f0";
    for (let z = -30; z < 30; z += 12) {
      ctx.fillRect(z, 14, 8, 10);
    }
    ctx.restore();

    // 2. Telegraphed Faustschlag
    if (colossus.fistState === "warning") {
      ctx.save();
      const warnAlpha = 0.45 + Math.sin(now * 0.02) * 0.35;
      ctx.fillStyle = `rgba(239, 68, 68, ${warnAlpha})`;
      ctx.fillRect(colossus.targetX - 70, worldGroundY - 8, 140, 16);

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.strokeRect(colossus.targetX - 70, worldGroundY - 8, 140, 16);

      ctx.fillStyle = "#fef08a";
      ctx.font = "900 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚠️ FAUSTSCHLAG! ⚠️", colossus.targetX, worldGroundY - 24);
      ctx.restore();
    } else if (colossus.fistState === "slam") {
      ctx.save();
      ctx.translate(colossus.targetX, colossus.fistY);

      const fistGrad = ctx.createRadialGradient(-10, -10, 8, 0, 0, 55);
      fistGrad.addColorStop(0, "#64748b");
      fistGrad.addColorStop(0.6, "#334155");
      fistGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = fistGrad;
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 4;

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-60, -50, 120, 90, 16);
      else ctx.rect(-60, -50, 120, 90);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f59e0b";
      for (let k = -42; k <= 30; k += 24) {
        ctx.fillRect(k, -18, 16, 26);
      }

      if (colossus.fistY >= worldGroundY - 45) {
        const shockRadius = (colossus.slamProgress || 0.2) * 140;
        ctx.strokeStyle = `rgba(250, 204, 21, ${1 - (colossus.slamProgress || 0.2)})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(0, 40, shockRadius, shockRadius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }


  // --- TÖDLICHE HERABFALLENDE KOKOSNÜSSE MIT BODEN-WARNUNG ---
  drawFallingCoconuts(coconuts) {
    if (!coconuts || !coconuts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let c of coconuts) {
      if (c.shattered) continue;

      // 1. Roter Warn-Schatten / Ziel-Retikel am Boden
      ctx.save();
      const warnRatio = Math.max(0, Math.min(1, 1 - (c.targetY - c.y) / 460));
      const pulse = Math.sin(now * 0.02) * 2;
      ctx.translate(c.targetX, c.targetY);

      // Rote pulsierende Gefahrenzone
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 + warnRatio * 0.45})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + warnRatio * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Schrumpfender Countdown-Zielring
      const shrinkRadius = Math.max(0, (1 - warnRatio) * 36);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + shrinkRadius, 7.5 + shrinkRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warn-Icon "⚠️" solange noch im Anflug
      if (warnRatio < 0.88) {
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText("⚠️", 0, -14);
        ctx.fillText("⚠️", 0, -14);
      }
      ctx.restore();

      // 2. Die herabstürzende Kokosnuss
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation || (now * 0.008));

      // Dunkelbraune Kokos-Schale
      const nutGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      nutGrad.addColorStop(0, "#a16207");
      nutGrad.addColorStop(0.4, "#78350f");
      nutGrad.addColorStop(0.85, "#451a03");
      nutGrad.addColorStop(1, "#1c0b02");
      ctx.fillStyle = nutGrad;
      ctx.strokeStyle = "#1c0b02";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Faserige Rillen
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -0.6, 0.6);
      ctx.arc(0, 0, 11, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();

      // 3 typische dunkle Kokosnuss-Augen
      ctx.fillStyle = "#1c0b02";
      [-4, 4].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, -6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Weißer Glanzpunkt
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(-5, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- 7d. BOSS 2: DER EINSTÜRZENDE MAYA-TEMPEL (ZONE 5, ~3.750m) ---
  drawTempleCollapse(collapse, worldGroundY) {
    if (!collapse || !collapse.active) return;
    const ctx = this.ctx;
    ctx.save();

    // 1. Kippende Säulen
    if (collapse.pillars) {
      for (let p of collapse.pillars) {
        ctx.save();
        ctx.translate(p.x, worldGroundY);
        ctx.rotate(p.angle);
        
        const colGrad = ctx.createLinearGradient(-25, 0, 25, 0);
        colGrad.addColorStop(0, "#78350f");
        colGrad.addColorStop(0.5, "#d97706");
        colGrad.addColorStop(1, "#451a03");
        ctx.fillStyle = colGrad;
        ctx.fillRect(-25, -280, 50, 280);

        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, -180); ctx.lineTo(10, -140); ctx.lineTo(-8, -100);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Herabstürzende glühende Felsbrocken
    if (collapse.fallingRocks) {
      for (let r of collapse.fallingRocks) {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rot);

        const rGrad = ctx.createRadialGradient(-r.radius * 0.3, -r.radius * 0.3, 2, 0, 0, r.radius);
        rGrad.addColorStop(0, "#fef08a");
        rGrad.addColorStop(0.4, "#f97316");
        rGrad.addColorStop(0.85, "#78350f");
        rGrad.addColorStop(1, "#1c1917");
        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // --- 7e. ALTAR DER GÖTTER (BEI 3.000m) ---
  drawAltarBackdrop(distance, worldGroundY) {
    const targetDist = typeof TARGET_DISTANCE !== "undefined" ? TARGET_DISTANCE : 3000;
    if (distance < targetDist - 120) return;
    const ctx = this.ctx;
    const now = Date.now();
    const altarX = targetDist * (GAME_CONFIG.DIST_SCALE_DIVISOR || 41.5) + 120;

    ctx.save();
    ctx.translate(altarX, worldGroundY);

    // Stufen-Pyramide
    for (let s = 0; s < 5; s++) {
      const stepW = 420 - s * 60;
      const stepH = 30;
      ctx.fillStyle = s % 2 === 0 ? "#b45309" : "#d97706";
      ctx.fillRect(-stepW * 0.5, -s * stepH - stepH, stepW, stepH);
    }

    // Altar-Podest
    ctx.fillStyle = "#facc15";
    ctx.fillRect(-65, -180, 130, 32);
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 3.5;
    ctx.strokeRect(-65, -180, 130, 32);

    // Goldene Sonnenscheibe
    const sunPulse = Math.sin(now * 0.006) * 6;
    const sunGrad = ctx.createRadialGradient(0, -235, 10, 0, -235, 55 + sunPulse);
    sunGrad.addColorStop(0, "#ffffff");
    sunGrad.addColorStop(0.4, "#fef08a");
    sunGrad.addColorStop(0.8, "#f59e0b");
    sunGrad.addColorStop(1, "rgba(217, 119, 6, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(0, -235, 55 + sunPulse, 0, Math.PI * 2);
    ctx.fill();

    // Flammenschalen links & rechts
    [-80, 80].forEach(bx => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(bx - 14, -175, 28, 25);

      const fH = 24 + Math.sin(now * 0.02 + bx) * 7;
      const fGrad = ctx.createRadialGradient(bx, -180 - fH * 0.5, 2, bx, -180 - fH * 0.5, 18);
      fGrad.addColorStop(0, "#ffffff");
      fGrad.addColorStop(0.4, "#facc15");
      fGrad.addColorStop(0.8, "#ef4444");
      fGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.ellipse(bx, -180 - fH * 0.5, 11, fH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Lichtstrahl in den Himmel
    const beamGrad = ctx.createLinearGradient(0, -550, 0, -180);
    beamGrad.addColorStop(0, "rgba(254, 240, 138, 0)");
    beamGrad.addColorStop(0.5, "rgba(250, 204, 21, 0.28)");
    beamGrad.addColorStop(1, "rgba(255, 255, 255, 0.75)");
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-45, -180);
    ctx.lineTo(45, -180);
    ctx.lineTo(100, -550);
    ctx.lineTo(-100, -550);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- 7f. ZIPLINE-SEILRUTSCHEN, WASSER-GEYSIRE & LEBENDIGE DSCHUNGEL-GEGNER ---
  drawZiplines(ziplines, player) {
    if (!ziplines || !ziplines.length) return;
    const ctx = this.ctx;
    for (let z of ziplines) {
      ctx.save();
      // Start- und End-Holzmasten
      ctx.fillStyle = "#78350f";
      ctx.strokeStyle = "#1e0a02";
      ctx.lineWidth = 2.5;
      ctx.fillRect(z.x1 - 6, z.y1 - 12, 12, 155);
      ctx.strokeRect(z.x1 - 6, z.y1 - 12, 12, 155);
      ctx.fillRect(z.x2 - 6, z.y2 - 12, 12, 65);
      ctx.strokeRect(z.x2 - 6, z.y2 - 12, 12, 65);

      // Gespanntes goldenes Zipline-Stahlseil
      ctx.strokeStyle = "#1e0a02";
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(z.x1, z.y1);
      ctx.lineTo(z.x2, z.y2);
      ctx.stroke();

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(z.x1, z.y1);
      ctx.lineTo(z.x2, z.y2);
      ctx.stroke();

      // Zipline-Rolle (entweder bei Koko oder am Startpunkt)
      const isRidingThis = player && player.state === "on_zipline" && player.activeZipline === z;
      const pulleyX = isRidingThis ? player.x : z.x1 + 14;
      const ratio = Math.max(0, Math.min(1, (pulleyX - z.x1) / (z.x2 - z.x1)));
      const pulleyY = z.y1 + ratio * (z.y2 - z.y1);

      ctx.fillStyle = "#ef4444";
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pulleyX, pulleyY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Haltegriff unter der Rolle
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pulleyX, pulleyY + 8);
      ctx.lineTo(pulleyX, pulleyY + 22);
      ctx.moveTo(pulleyX - 8, pulleyY + 22);
      ctx.lineTo(pulleyX + 8, pulleyY + 22);
      ctx.stroke();

      if (!isRidingThis) {
        // Pulsierender goldener Fang-Indikator am Einstieg, damit man die Seilbahn leicht trifft!
        const pulse = Math.sin(Date.now() * 0.01) * 5;
        ctx.strokeStyle = "rgba(250, 204, 21, 0.7)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(z.x1 + 14, z.y1 + 14, 34 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#fef08a";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 3;
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.strokeText("🚡 SEILBAHN!", z.x1 + 24, z.y1 - 18);
        ctx.fillText("🚡 SEILBAHN!", z.x1 + 24, z.y1 - 18);
      }
      ctx.restore();
    }
  }


  // --- TÖDLICHE HERABFALLENDE KOKOSNÜSSE MIT BODEN-WARNUNG ---
  drawFallingCoconuts(coconuts) {
    if (!coconuts || !coconuts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let c of coconuts) {
      if (c.shattered) continue;

      // 1. Roter Warn-Schatten / Ziel-Retikel am Boden
      ctx.save();
      const warnRatio = Math.max(0, Math.min(1, 1 - (c.targetY - c.y) / 460));
      const pulse = Math.sin(now * 0.02) * 2;
      ctx.translate(c.targetX, c.targetY);

      // Rote pulsierende Gefahrenzone
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 + warnRatio * 0.45})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + warnRatio * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Schrumpfender Countdown-Zielring
      const shrinkRadius = Math.max(0, (1 - warnRatio) * 36);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + shrinkRadius, 7.5 + shrinkRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warn-Icon "⚠️" solange noch im Anflug
      if (warnRatio < 0.88) {
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText("⚠️", 0, -14);
        ctx.fillText("⚠️", 0, -14);
      }
      ctx.restore();

      // 2. Die herabstürzende Kokosnuss
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation || (now * 0.008));

      // Dunkelbraune Kokos-Schale
      const nutGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      nutGrad.addColorStop(0, "#a16207");
      nutGrad.addColorStop(0.4, "#78350f");
      nutGrad.addColorStop(0.85, "#451a03");
      nutGrad.addColorStop(1, "#1c0b02");
      ctx.fillStyle = nutGrad;
      ctx.strokeStyle = "#1c0b02";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Faserige Rillen
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -0.6, 0.6);
      ctx.arc(0, 0, 11, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();

      // 3 typische dunkle Kokosnuss-Augen
      ctx.fillStyle = "#1c0b02";
      [-4, 4].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, -6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Weißer Glanzpunkt
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(-5, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- SELTENE GOLDENE SKILL-HERZEN (1x PRO ZONE AUF HOHER BAUMKRONE) ---
  drawSkillHearts(skillHearts) {
    if (!skillHearts || !skillHearts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let sh of skillHearts) {
      if (sh.collected) continue;
      ctx.save();
      const bob = Math.sin(now * 0.006 + sh.x) * 7;
      const scale = 1 + Math.sin(now * 0.01) * 0.08;
      ctx.translate(sh.x, sh.y + bob);
      ctx.scale(scale, scale);

      // Heiligenschein / Gold-Rubin Aura
      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
      aura.addColorStop(0, "rgba(254, 240, 138, 0.95)");
      aura.addColorStop(0.45, "rgba(244, 63, 94, 0.55)");
      aura.addColorStop(1, "rgba(244, 63, 94, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();

      // Goldene Maya-Flügel links & rechts
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = "#1e0a02";
      ctx.lineWidth = 2.2;
      const wingFlap = Math.sin(now * 0.015) * 4;
      [-1, 1].forEach(dir => {
        ctx.save();
        ctx.scale(dir, 1);
        ctx.beginPath();
        ctx.moveTo(10, -2);
        ctx.quadraticCurveTo(26, -16 + wingFlap, 30, -4 + wingFlap);
        ctx.quadraticCurveTo(24, 6, 10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // Plastisches Rubin-Gold-Herz in der Mitte
      ctx.fillStyle = "#e11d48";
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.bezierCurveTo(-18, 0, -18, -14, -8, -14);
      ctx.bezierCurveTo(-2, -14, 0, -8, 0, -6);
      ctx.bezierCurveTo(0, -8, 2, -14, 8, -14);
      ctx.bezierCurveTo(18, -14, 18, 0, 0, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glanzpunkt
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-6, -8, 3, 0, Math.PI * 2);
      ctx.fill();

      // Label darüber
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#1e0a02";
      ctx.lineWidth = 3;
      ctx.strokeText("💖 +1 HERZ", 0, -22);
      ctx.fillStyle = "#fef08a";
      ctx.fillText("💖 +1 HERZ", 0, -22);

      ctx.restore();
    }
  }

  // --- DIE 4 GOLDENEN K-O-K-O BUCHSTABEN-MEDAILLONS (DONKEY KONG STYLE) ---
  drawKOKOLetters(kokoLetters) {
    if (!kokoLetters || !kokoLetters.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let item of kokoLetters) {
      if (item.collected) continue;
      ctx.save();

      // Schwebende Bob- & Dreh-Animation
      const hoverY = Math.sin(now * 0.005 + item.x) * 6;
      const pulseScale = 1.0 + Math.sin(now * 0.008 + item.index) * 0.06;
      ctx.translate(item.x, item.y + hoverY);
      ctx.scale(pulseScale, pulseScale);

      // 1. Goldener Heiligenschein / Sonnen-Aura
      const auraGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 36);
      auraGrad.addColorStop(0, "rgba(254, 240, 138, 0.95)");
      auraGrad.addColorStop(0.45, "rgba(250, 204, 21, 0.45)");
      auraGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();

      // 2. Äußerer rotierender Sonnen-Strahlenkranz (Maya-Sonne)
      const rayAngle = now * 0.0018 + item.index;
      ctx.save();
      ctx.rotate(rayAngle);
      ctx.fillStyle = "rgba(250, 204, 21, 0.28)";
      for (let r = 0; r < 8; r++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(-3, -20);
        ctx.lineTo(0, -30);
        ctx.lineTo(3, -20);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 3. 3D-Prägung des goldenen Medaillons
      ctx.fillStyle = "#1e0a02";
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();

      const coinGrad = ctx.createRadialGradient(-5, -6, 2, 0, 0, 20);
      coinGrad.addColorStop(0, "#ffffff");
      coinGrad.addColorStop(0.25, "#fef08a");
      coinGrad.addColorStop(0.6, "#facc15");
      coinGrad.addColorStop(0.9, "#ca8a04");
      coinGrad.addColorStop(1, "#78350f");
      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      // Aztekische Innen-Rille
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Der Buchstabe (K oder O) in 3D-Relief-Schrift
      ctx.font = "900 24px 'Impact', 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Schlagschatten
      ctx.fillStyle = "#451a03";
      ctx.fillText(item.char, 1.5, 2.5);

      // Goldene Schrift mit Lichtreflex
      const textGrad = ctx.createLinearGradient(0, -12, 0, 12);
      textGrad.addColorStop(0, "#ffffff");
      textGrad.addColorStop(0.35, "#fef08a");
      textGrad.addColorStop(0.7, "#facc15");
      textGrad.addColorStop(1, "#b45309");
      ctx.fillStyle = textGrad;
      ctx.strokeStyle = "#1e0a02";
      ctx.lineWidth = 2.2;
      ctx.strokeText(item.char, 0, 1);
      ctx.fillText(item.char, 0, 1);

      // 5. Glitzersternchen
      const glintPulse = Math.sin(now * 0.012 + item.x) * 0.5 + 0.5;
      if (glintPulse > 0.3) {
        ctx.fillStyle = `rgba(255, 255, 255, ${glintPulse})`;
        ctx.beginPath();
        ctx.arc(11, -11, 2.8 * glintPulse, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- SPEKTAKULÄRES RAKETEN-FASS (JET-BARREL PICKUP) ---
  drawRocketBarrels(rocketBarrels) {
    if (!rocketBarrels || !rocketBarrels.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let rb of rocketBarrels) {
      if (rb.collected) continue;
      ctx.save();

      const hoverY = Math.sin(now * 0.006 + rb.x) * 6;
      const tilt = Math.sin(now * 0.005) * 0.1;
      ctx.translate(rb.x, rb.y + hoverY);
      ctx.rotate(tilt);

      // 1. Feuerschein / Flammen-Aura
      const fireAura = ctx.createRadialGradient(0, 0, 8, 0, 0, 42);
      fireAura.addColorStop(0, "rgba(254, 240, 138, 0.9)");
      fireAura.addColorStop(0.35, "rgba(249, 115, 22, 0.65)");
      fireAura.addColorStop(0.75, "rgba(239, 68, 68, 0.25)");
      fireAura.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = fireAura;
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.fill();

      // 2. Flammen aus den Zwillings-Düsen unten
      const flamePulse = Math.sin(now * 0.035) * 4;
      [-11, 11].forEach(nx => {
        const flameGrad = ctx.createLinearGradient(nx, 16, nx, 36 + flamePulse);
        flameGrad.addColorStop(0, "#ffffff");
        flameGrad.addColorStop(0.2, "#facc15");
        flameGrad.addColorStop(0.65, "#f97316");
        flameGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(nx - 4, 16);
        ctx.lineTo(nx, 36 + flamePulse);
        ctx.lineTo(nx + 4, 16);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(nx - 5, 12, 10, 6);
        ctx.fill();
        ctx.stroke();
      });

      // 3. Raketen-Fass Korpus (Donkey Kong Stil)
      const OUTLINE = "#1e0a02";
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;

      const bGrad = ctx.createRadialGradient(-4, -4, 4, 0, 0, 24);
      bGrad.addColorStop(0, "#f87171");
      bGrad.addColorStop(0.4, "#dc2626");
      bGrad.addColorStop(0.85, "#991b1b");
      bGrad.addColorStop(1, "#450a0a");
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-18, -20, 36, 36, 10);
      else ctx.rect(-18, -20, 36, 36);
      ctx.fill();
      ctx.stroke();

      // Goldene Verstärkungs-Bänder mit Nieten
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      [-14, 10].forEach(by => {
        ctx.beginPath();
        ctx.rect(-18, by, 36, 5);
        ctx.fill();
        ctx.stroke();
        [-12, 0, 12].forEach(rx => {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(rx, by + 2.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#facc15";
        });
      });

      // Gelbes Raketen-Symbol in der Mitte
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.font = "900 18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText("🚀", 0, -2);
      ctx.fillText("🚀", 0, -2);

      // Aerodynamische Spitze oben
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-10, -20);
      ctx.lineTo(0, -32);
      ctx.lineTo(10, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Leuchtender Banner
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#1e0a02";
      ctx.lineWidth = 3;
      ctx.strokeText("🚀 RAKETEN-FASS", 0, -38);
      ctx.fillStyle = "#fef08a";
      ctx.fillText("🚀 RAKETEN-FASS", 0, -38);

      ctx.restore();
    }
  }

  drawGeysers(geysers) {
    if (!geysers || !geysers.length) return;
    const ctx = this.ctx;
    const now = Date.now();
    for (let g of geysers) {
      ctx.save();
      const pulseH = g.height + Math.sin(now * 0.015 + g.x) * 18;
      const topY = g.y - pulseH;

      // Sprudelnde blaue Wasserfontäne
      const gGrad = ctx.createLinearGradient(g.x, topY, g.x, g.y + 40);
      gGrad.addColorStop(0, "rgba(224, 242, 254, 0.95)");
      gGrad.addColorStop(0.35, "rgba(56, 189, 248, 0.85)");
      gGrad.addColorStop(0.8, "rgba(2, 132, 199, 0.75)");
      gGrad.addColorStop(1, "rgba(3, 105, 161, 0.2)");
      ctx.fillStyle = gGrad;

      ctx.beginPath();
      ctx.moveTo(g.x - 16, g.y + 30);
      ctx.quadraticCurveTo(g.x - 24, (g.y + topY) * 0.5, g.x - 28, topY);
      ctx.quadraticCurveTo(g.x, topY - 18, g.x + 28, topY);
      ctx.quadraticCurveTo(g.x + 24, (g.y + topY) * 0.5, g.x + 16, g.y + 30);
      ctx.closePath();
      ctx.fill();

      // Schaumkrone oben auf dem Geysir
      for (let i = -2; i <= 2; i++) {
        const bx = g.x + i * 10;
        const by = topY + Math.sin(now * 0.02 + i) * 5;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bx, by, 9 - Math.abs(i) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }


  // --- TÖDLICHE HERABFALLENDE KOKOSNÜSSE MIT BODEN-WARNUNG ---
  drawFallingCoconuts(coconuts) {
    if (!coconuts || !coconuts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let c of coconuts) {
      if (c.shattered) continue;

      // 1. Roter Warn-Schatten / Ziel-Retikel am Boden
      ctx.save();
      const warnRatio = Math.max(0, Math.min(1, 1 - (c.targetY - c.y) / 460));
      const pulse = Math.sin(now * 0.02) * 2;
      ctx.translate(c.targetX, c.targetY);

      // Rote pulsierende Gefahrenzone
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 + warnRatio * 0.45})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + warnRatio * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Schrumpfender Countdown-Zielring
      const shrinkRadius = Math.max(0, (1 - warnRatio) * 36);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + shrinkRadius, 7.5 + shrinkRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warn-Icon "⚠️" solange noch im Anflug
      if (warnRatio < 0.88) {
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText("⚠️", 0, -14);
        ctx.fillText("⚠️", 0, -14);
      }
      ctx.restore();

      // 2. Die herabstürzende Kokosnuss
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation || (now * 0.008));

      // Dunkelbraune Kokos-Schale
      const nutGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      nutGrad.addColorStop(0, "#a16207");
      nutGrad.addColorStop(0.4, "#78350f");
      nutGrad.addColorStop(0.85, "#451a03");
      nutGrad.addColorStop(1, "#1c0b02");
      ctx.fillStyle = nutGrad;
      ctx.strokeStyle = "#1c0b02";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Faserige Rillen
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -0.6, 0.6);
      ctx.arc(0, 0, 11, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();

      // 3 typische dunkle Kokosnuss-Augen
      ctx.fillStyle = "#1c0b02";
      [-4, 4].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, -6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Weißer Glanzpunkt
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(-5, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawEnemies(enemies) {
    if (!enemies || !enemies.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let e of enemies) {
      if (e.stomped) continue;
      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.type === "toucan") {
        // Tieffliegender Regenwald-Tukan (nach links fliegend, Kopf-Bounce möglich!)
        const flap = Math.sin(now * 0.028 + e.x * 0.05) * 14;
        // Körper
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(4, 0, 17, 11, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gelbe Brust
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(-6, 1, 8, 0, Math.PI * 2);
        ctx.fill();

        // Schlagender Flügel
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.moveTo(2, -2);
        ctx.lineTo(14, -16 + flap);
        ctx.lineTo(18, -1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Riesiger bunter Tukan-Schnabel (nach links zeigend)
        const beakGrad = ctx.createLinearGradient(-34, -4, -10, 4);
        beakGrad.addColorStop(0, "#ef4444");
        beakGrad.addColorStop(0.4, "#f97316");
        beakGrad.addColorStop(1, "#facc15");
        ctx.fillStyle = beakGrad;
        ctx.beginPath();
        ctx.moveTo(-10, -7);
        ctx.quadraticCurveTo(-32, -8, -34, 2);
        ctx.quadraticCurveTo(-22, 6, -10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Auge
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(-8, -3, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(-8.5, -3, 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === "rolling_barrel") {
        // Rollendes Tiki-Holzfass (Kopf-Bounce oder Überspringen!)
        ctx.rotate(e.rot || 0);
        const r = e.radius || 20;
        const bGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, r);
        bGrad.addColorStop(0, "#d97706");
        bGrad.addColorStop(0.65, "#92400e");
        bGrad.addColorStop(1, "#451a03");
        ctx.fillStyle = bGrad;
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eisenring & Tiki-Kreuz
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
        ctx.moveTo(-r * 0.65, 0); ctx.lineTo(r * 0.65, 0);
        ctx.moveTo(0, -r * 0.65); ctx.lineTo(0, r * 0.65);
        ctx.stroke();
      } else if (e.type === "piranha") {
        // Aus der Schlucht springender Schnapp-Piranha!
        ctx.rotate(e.vy < 0 ? -Math.PI * 0.42 : Math.PI * 0.42);
        ctx.fillStyle = "#dc2626";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Grüner Rücken & Schwanzflosse
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-24, -9);
        ctx.lineTo(-24, 9);
        ctx.closePath();
        ctx.fill();

        // Weiße Zähne
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(8, -4); ctx.lineTo(14, -1); ctx.lineTo(8, 2);
        ctx.fill();

        // Böses gelbes Auge
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(6, -5, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }


  // --- TÖDLICHE HERABFALLENDE KOKOSNÜSSE MIT BODEN-WARNUNG ---
  drawFallingCoconuts(coconuts) {
    if (!coconuts || !coconuts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let c of coconuts) {
      if (c.shattered) continue;

      // 1. Roter Warn-Schatten / Ziel-Retikel am Boden
      ctx.save();
      const warnRatio = Math.max(0, Math.min(1, 1 - (c.targetY - c.y) / 460));
      const pulse = Math.sin(now * 0.02) * 2;
      ctx.translate(c.targetX, c.targetY);

      // Rote pulsierende Gefahrenzone
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 + warnRatio * 0.45})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + warnRatio * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Schrumpfender Countdown-Zielring
      const shrinkRadius = Math.max(0, (1 - warnRatio) * 36);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + shrinkRadius, 7.5 + shrinkRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warn-Icon "⚠️" solange noch im Anflug
      if (warnRatio < 0.88) {
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText("⚠️", 0, -14);
        ctx.fillText("⚠️", 0, -14);
      }
      ctx.restore();

      // 2. Die herabstürzende Kokosnuss
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation || (now * 0.008));

      // Dunkelbraune Kokos-Schale
      const nutGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      nutGrad.addColorStop(0, "#a16207");
      nutGrad.addColorStop(0.4, "#78350f");
      nutGrad.addColorStop(0.85, "#451a03");
      nutGrad.addColorStop(1, "#1c0b02");
      ctx.fillStyle = nutGrad;
      ctx.strokeStyle = "#1c0b02";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Faserige Rillen
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -0.6, 0.6);
      ctx.arc(0, 0, 11, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();

      // 3 typische dunkle Kokosnuss-Augen
      ctx.fillStyle = "#1c0b02";
      [-4, 4].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, -6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Weißer Glanzpunkt
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(-5, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawHazards(hazards) {
    const ctx = this.ctx;
    for (let h of hazards) {
      ctx.save();
      if (h.type === "crocodile") {
        ctx.translate(h.x, h.y);
        ctx.fillStyle = "#14532d";
        ctx.beginPath();
        ctx.ellipse(0, 8, h.width * 0.5, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        const snap = Math.sin(Date.now() * 0.01) * 6;
        ctx.fillStyle = "#166534";
        ctx.beginPath();
        ctx.ellipse(h.width * 0.25, -snap, 26, 14, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        for (let t = -6; t <= 20; t += 6) {
          ctx.beginPath();
          ctx.moveTo(t, 2); ctx.lineTo(t + 3, -8); ctx.lineTo(t + 6, 2);
          ctx.fill();
        }

        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(16, -10 - snap * 0.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (h.type === "low_thorns" || h.type === "low_spikes" || h.type === "thorns_bush") {
        // Dornen-Hindernis am Boden zum Überspringen (One-Button Jump & Run!)
        ctx.translate(h.x, h.y);
        ctx.fillStyle = "#451a03";
        ctx.beginPath();
        ctx.arc(0, 6, h.width * 0.48, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = "#dc2626";
        for (let a = 0.25; a < Math.PI; a += 0.45) {
          const dx = Math.cos(a) * h.width * 0.44;
          const dy = 6 - Math.sin(a) * h.width * 0.44;
          ctx.beginPath();
          ctx.moveTo(dx - 5, dy); ctx.lineTo(dx, dy - 13); ctx.lineTo(dx + 5, dy);
          ctx.fill();
        }
      } else if (h.type === "snake") {
        ctx.translate(h.x, h.y);
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // --- TÖDLICHE HERABFALLENDE KOKOSNÜSSE MIT BODEN-WARNUNG ---
  drawFallingCoconuts(coconuts) {
    if (!coconuts || !coconuts.length) return;
    const ctx = this.ctx;
    const now = Date.now();

    for (let c of coconuts) {
      if (c.shattered) continue;

      // 1. Roter Warn-Schatten / Ziel-Retikel am Boden
      ctx.save();
      const warnRatio = Math.max(0, Math.min(1, 1 - (c.targetY - c.y) / 460));
      const pulse = Math.sin(now * 0.02) * 2;
      ctx.translate(c.targetX, c.targetY);

      // Rote pulsierende Gefahrenzone
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 + warnRatio * 0.45})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + warnRatio * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Schrumpfender Countdown-Zielring
      const shrinkRadius = Math.max(0, (1 - warnRatio) * 36);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + shrinkRadius, 7.5 + shrinkRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warn-Icon "⚠️" solange noch im Anflug
      if (warnRatio < 0.88) {
        ctx.font = "900 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#1e0a02";
        ctx.lineWidth = 2.5;
        ctx.strokeText("⚠️", 0, -14);
        ctx.fillText("⚠️", 0, -14);
      }
      ctx.restore();

      // 2. Die herabstürzende Kokosnuss
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation || (now * 0.008));

      // Dunkelbraune Kokos-Schale
      const nutGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      nutGrad.addColorStop(0, "#a16207");
      nutGrad.addColorStop(0.4, "#78350f");
      nutGrad.addColorStop(0.85, "#451a03");
      nutGrad.addColorStop(1, "#1c0b02");
      ctx.fillStyle = nutGrad;
      ctx.strokeStyle = "#1c0b02";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Faserige Rillen
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -0.6, 0.6);
      ctx.arc(0, 0, 11, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();

      // 3 typische dunkle Kokosnuss-Augen
      ctx.fillStyle = "#1c0b02";
      [-4, 4].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, -6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Weißer Glanzpunkt
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(-5, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawPelican(pelican) {
    if (!pelican.active) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(pelican.x, pelican.y);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(18, -6);
    ctx.lineTo(48, 2);
    ctx.quadraticCurveTo(26, 20, 18, 13);
    ctx.closePath();
    ctx.fill();

    const wingFlap = Math.sin(Date.now() * 0.025) * 18;
    ctx.fillStyle = "#f1f5f9";
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(8, -28 + wingFlap);
    ctx.lineTo(18, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // --- 8. PARTIKEL-UPDATE & BLITZE ---
  updateAndDrawParticles(dt, zone, logicalW, logicalH) {
    const ctx = this.ctx;

    // Funken
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 450 * dt;

      ctx.save();
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.life / s.maxLife;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Rauch & Feuer
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const p = this.smokePuffs[i];
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.smokePuffs.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += 18 * dt;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.isFire ? "#f97316" : "#cbd5e1";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Glühwürmchen
    ctx.save();
    for (let sp of this.spores) {
      sp.phase += dt * 3;
      sp.x += sp.speedX * dt;
      sp.y += sp.speedY * dt;
      if (sp.y < 0) sp.y = logicalH;
      if (sp.x < 0) sp.x = logicalW;
      if (sp.x > logicalW) sp.x = 0;

      const alpha = 0.35 + Math.sin(sp.phase) * 0.35;
      ctx.fillStyle = zone.hasGlowingRunes ? "#38bdf8" : "#fef08a";
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Monsun-Regen
    if (zone.hasRain) {
      ctx.save();
      ctx.strokeStyle = "rgba(186, 230, 253, 0.65)";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      for (let r of this.rainDrops) {
        r.y += r.speed * dt;
        r.x -= r.speed * 0.35 * dt;
        if (r.y > logicalH) {
          r.y = -20;
          r.x = Math.random() * (logicalW + 300);
        }
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 7, r.y + r.length);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Blitzeinschlag
    if (this.lightningFlash > 0) {
      this.lightningFlash -= dt;
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.65, this.lightningFlash * 3)})`;
      ctx.fillRect(0, 0, logicalW, logicalH);
      ctx.restore();
    }

    // Impact-Flash
    if (this.impactFlash > 0) {
      this.impactFlash -= dt;
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.impactFlash * 10})`;
      ctx.fillRect(0, 0, logicalW, logicalH);
      ctx.restore();
    }
  }

  drawForeground(camera, logicalW, logicalH) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(2, 44, 18, 0.88)";
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.quadraticCurveTo(130, 20, 190, 120);
    ctx.quadraticCurveTo(90, 90, -10, 100);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(logicalW + 10, logicalH + 10);
    ctx.quadraticCurveTo(logicalW - 100, logicalH - 30, logicalW - 150, logicalH - 100);
    ctx.quadraticCurveTo(logicalW - 55, logicalH - 45, logicalW + 10, logicalH - 35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- 8. SUPER-SONIC FRENZY ARCADE SPEED-LINES & GOLDENER VIGNETTEN-GLOW ---
  drawSuperSonicEffects(logicalW, logicalH, isSuperSonic) {
    if (!isSuperSonic) return;
    const ctx = this.ctx;
    const now = Date.now();

    ctx.save();

    // 1. Goldene Rand-Vignette (Pulsierender Hyper-Speed Glow an den Bildschirmrändern)
    const pulseAlpha = 0.22 + Math.sin(now * 0.015) * 0.08;
    const vignette = ctx.createRadialGradient(
      logicalW * 0.5, logicalH * 0.5, Math.min(logicalW, logicalH) * 0.35,
      logicalW * 0.5, logicalH * 0.5, Math.max(logicalW, logicalH) * 0.72
    );
    vignette.addColorStop(0, "rgba(250, 204, 21, 0)");
    vignette.addColorStop(0.7, `rgba(250, 204, 21, ${pulseAlpha * 0.6})`);
    vignette.addColorStop(1, `rgba(249, 115, 22, ${pulseAlpha})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, logicalW, logicalH);

    // 2. Horizontale Speed-Lines (dynamisch von rechts nach links durch den Raum schießend)
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    const lineCount = 20;
    for (let i = 0; i < lineCount; i++) {
      const speed = 1400 + (i % 5) * 220;
      const seedY = (i * 97) % logicalH;
      const length = 120 + (i % 7) * 45;
      const xProgress = (now * speed * 0.001 + i * 210) % (logicalW + length + 200);
      const lineX = logicalW + 100 - xProgress;
      const lineY = seedY + Math.sin(now * 0.005 + i) * 12;

      const lineGrad = ctx.createLinearGradient(lineX, lineY, lineX + length, lineY);
      lineGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      lineGrad.addColorStop(0.4, "rgba(250, 204, 21, 0.65)");
      lineGrad.addColorStop(1, "rgba(249, 115, 22, 0)");

      ctx.strokeStyle = lineGrad;
      ctx.beginPath();
      ctx.moveTo(lineX, lineY);
      ctx.lineTo(lineX + length, lineY);
      ctx.stroke();
    }

    ctx.restore();
  }
}
