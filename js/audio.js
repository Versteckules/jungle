/* ==========================================================================
   JUNGLE HERO – AUDIO & SYNTHESIZER ENGINE (Extended Gimmick & Weather SFX)
   ========================================================================== */

class JungleAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.musicEnabled = true;
    this.bgMusic = document.getElementById("bg-music");
    this.musicToggleBtn = document.getElementById("music-toggle");
    this._lastClack = 0;
    this._unlockerArmed = false;

    if (this.bgMusic) {
      this.bgMusic.volume = 0.75;
      try { this.bgMusic.load(); } catch (e) {}
    }

    if (this.musicToggleBtn) {
      this.updateBtnText();
      const handleToggle = (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        this.toggleMusic();
      };
      this.musicToggleBtn.addEventListener("click", handleToggle);
      this.musicToggleBtn.addEventListener("touchend", handleToggle, { passive: false });
      window.addEventListener("resize", () => this.updateBtnText());
    }

    // Sofortiger Autoplay-Unlocker für GitHub Pages / HTTPS / iOS Safari
    this.armAutoplayUnlocker();
  }

  armAutoplayUnlocker() {
    if (this._unlockerArmed) return;
    this._unlockerArmed = true;

    const unlock = () => {
      this.init();
      if (this.musicEnabled && this.bgMusic && this.bgMusic.paused) {
        try {
          const p = this.bgMusic.play();
          if (p && typeof p.then === "function") {
            p.then(() => {
              this.updateBtnText();
              cleanup();
            }).catch(() => {});
          }
        } catch (e) {}
      } else if (this.bgMusic && !this.bgMusic.paused) {
        cleanup();
      }
    };

    const cleanup = () => {
      this._unlockerArmed = false;
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("touchend", unlock, true);
      window.removeEventListener("click", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };

    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("touchend", unlock, true);
    window.addEventListener("click", unlock, true);
    window.addEventListener("keydown", unlock, true);
  }

  updateBtnText() {
    if (!this.musicToggleBtn) return;
    const isSlim = typeof window !== "undefined" && window.innerWidth <= 360;
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 480;
    if (this.musicEnabled) {
      this.musicToggleBtn.innerText = isSlim ? "🎵" : (isMobile ? "🎵 ON" : "🎵 Musik: ON");
      this.musicToggleBtn.style.borderColor = "#34d399";
    } else {
      this.musicToggleBtn.innerText = isSlim ? "🔇" : (isMobile ? "🔇 OFF" : "🔇 Musik: OFF");
      this.musicToggleBtn.style.borderColor = "#94a3b8";
    }
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    if (this.bgMusic && this.bgMusic.readyState === 0) {
      try { this.bgMusic.load(); } catch (e) {}
    }
  }

  toggleMusic() {
    this.init();
    // Falls Musik an sein soll, aber der Browser sie blockiert hat (bgMusic.paused):
    // Klick auf den Button startet sie sofort, statt sie abzuschalten!
    if (this.musicEnabled && this.bgMusic && this.bgMusic.paused) {
      this.playMusic();
      this.updateBtnText();
      return;
    }

    this.musicEnabled = !this.musicEnabled;
    this.updateBtnText();
    if (this.musicEnabled) {
      this.playMusic();
    } else {
      if (this.bgMusic) this.bgMusic.pause();
    }
  }

  playMusic() {
    if (!this.musicEnabled) return;
    this.init();
    if (this.bgMusic && typeof this.bgMusic.play === "function") {
      try {
        if (this.bgMusic.readyState === 0) {
          try { this.bgMusic.load(); } catch (e) {}
        }
        const p = this.bgMusic.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            this.updateBtnText();
          }).catch((err) => {
            // Autoplay vom Browser (noch) abgelehnt -> Unlocker aktivieren
            this.armAutoplayUnlocker();
          });
        }
      } catch (e) {
        this.armAutoplayUnlocker();
      }
    }
  }

  stopMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
  }

  // Synthesizer Soundeffekte
  playSFX(type) {
    if (!this.musicEnabled || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (type === "jump") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.16);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "slide") {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(850, now);
        filter.frequency.linearRampToValueAtTime(220, now + 0.28);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === "banana") {
        [880, 1320].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.22, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.16);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.16);
        });
      } else if (type === "diamond") {
        // Funkelnder Kristall-Chime (3-Klang aufwärts)
        [987.77, 1318.51, 1975.53].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.35, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.35);
        });
      } else if (type === "gong") {
        // Epischer Maya-Tempelgong (tiefe Schwingung)
        [110, 164.8, 220].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + 1.2);
          gain.gain.setValueAtTime(0.45 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
          osc.start(now);
          osc.stop(now + 1.4);
        });
      } else if (type === "grapple") {
        // Lianen-Wurf & Schwing-Sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "stomp") {
        // Wuchtiger Drop-Stomp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === "barrel_enter") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "barrel_shoot") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.38);
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc.start(now);
        osc.stop(now + 0.42);
      } else if (type === "bongo") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.24);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === "frenzy") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.3, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.45);
        });
      } else if (type === "hit") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(35, now + 0.3);
        gain.gain.setValueAtTime(0.48, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === "smash") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.22);
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }

      // --- NEUE GIMMICK SFX: MINECART & TROPENGEWITTER ---
      else if (type === "minecart_jump") {
        // Wuchtiges metallisches Abheben der Lore
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.18);
        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (type === "minecart_clack") {
        // Rhythmisches Rad-Schienen-Klappern (gedrosselt auf max alle 110ms)
        if (now - this._lastClack < 0.11) return;
        this._lastClack = now;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(120 + Math.random() * 40, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "lightning") {
        // Knackender Blitzschlag-Impuls
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "thunder") {
        // Tief grollendes Donnergrollen
        [55, 78, 110].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sawtooth";
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(260, now);
          filter.frequency.linearRampToValueAtTime(70, now + 1.4);
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.linearRampToValueAtTime(freq * 0.7, now + 1.5);
          gain.gain.setValueAtTime(0.35 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
          osc.start(now);
          osc.stop(now + 1.6);
        });
      }

      // --- SPECTACULAR BOSS & CRYPTEX SFX (FAVORITENPUNKT SOUND ENGINE) ---
      else if (type === "colossus_roar") {
        // Uraltes, tiefes Erdbeben-Brüllen des Maya-Kolosses
        [40, 65, 88].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sawtooth";
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(140 + idx * 40, now);
          filter.Q.value = 3.0;
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.linearRampToValueAtTime(freq * 0.65, now + 1.8);
          gain.gain.setValueAtTime(0.42 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
          osc.start(now);
          osc.stop(now + 1.9);
        });
      } else if (type === "fist_slam") {
        // Wuchtiger Steinschlag der Koloss-Faust
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.linearRampToValueAtTime(45, now + 0.35);
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
      } else if (type === "relic_pickup") {
        // Funkelnder magischer Triumph-Akkord für Autoren-Relikte
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.32, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.55);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.55);
        });
      } else if (type === "cryptex_spin") {
        // Sattes, antikes Stein-Schleif- und Klickgeräusch beim Drehen der Maya-Räder
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(480 + Math.random() * 80, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "koko_letter") {
        // Jubelnder Donkey-Kong K-O-K-O Buchstaben Arpeggio
        [587.33, 739.99, 880.00, 1174.66, 1479.98].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.35, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.45);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.45);
        });
      } else if (type === "combo_up") {
        // Arcade Combo-Chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.16);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "rocket_thrust") {
        // Wuchtiges Raketen-Fass Fauchen
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.linearRampToValueAtTime(120, now + 0.28);
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.28);
        gain.gain.setValueAtTime(0.42, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "coconut_fall") {
        // Zischendes Pfeifen einer herabstürzenden Kokosnuss
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "coconut_shatter") {
        // Trockener, hölzerner Zersplitterungs-Knall
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "cryptex_error") {
        // Dumpfes, schweres Stein-Rumpeln bei falscher Kombination
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.setValueAtTime(82, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === "cryptex_open") {
        // Hymnische Altar-Fanfare bei Entriegelung der Final-Koordinaten
        [392.00, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.38, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 1.2);
        });
      }
    } catch (e) {}
  }
}

// Global verfügbare Audio-Instanz
const jungleAudio = new JungleAudioEngine();
