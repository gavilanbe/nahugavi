// SFX procedurales: cada función es un mixin sobre AudioEngine y usa
// this.tone()/this.noise(). Chunky, cortos y con carácter BK.

export const sfx = {
  jump() { this.tone({ freq: 320, type: 'square', dur: 0.18, vol: 0.14, slide: 280 }); },
  flap() {
    this.noise({ dur: 0.16, vol: 0.3, freq: 900, q: 0.8, slide: -500 });
    this.tone({ freq: 520, type: 'triangle', dur: 0.12, vol: 0.1, slide: 160 });
  },
  land() { this.noise({ dur: 0.08, vol: 0.18, freq: 300, q: 1 }); },
  step() { this.noise({ dur: 0.04, vol: 0.07, freq: 400 + Math.random() * 200, q: 1.2 }); },
  thump() {
    this.noise({ dur: 0.1, vol: 0.3, freq: 220, q: 1 });
    this.tone({ freq: 140, type: 'square', dur: 0.1, vol: 0.14, slide: -60 });
  },
  swipe() { this.noise({ dur: 0.14, vol: 0.3, freq: 1800, q: 0.7, slide: -1200 }); },
  peck() {
    this.tone({ freq: 900, type: 'square', dur: 0.06, vol: 0.16 });
    this.tone({ freq: 1100, type: 'square', dur: 0.06, vol: 0.16, delay: 0.07 });
  },
  poundStart() { this.tone({ freq: 600, type: 'sawtooth', dur: 0.3, vol: 0.12, slide: -450 }); },
  poundHit() {
    this.noise({ dur: 0.3, vol: 0.5, freq: 180, q: 0.8 });
    this.tone({ freq: 80, type: 'sine', dur: 0.3, vol: 0.4, slide: -40 });
  },
  hurt() {
    this.tone({ freq: 280, type: 'sawtooth', dur: 0.25, vol: 0.2, slide: -140 });
    this.tone({ freq: 140, type: 'square', dur: 0.3, vol: 0.12, slide: -60, delay: 0.05 });
  },
  splash() { this.noise({ dur: 0.4, vol: 0.35, freq: 1000, q: 0.6, slide: -700 }); },
  stroke() { this.noise({ dur: 0.12, vol: 0.13, freq: 850, q: 0.8, slide: -350 }); },
  bubble() { this.tone({ freq: 280 + Math.random() * 220, type: 'sine', dur: 0.09, vol: 0.05, slide: 260 }); },
  gasp() {
    this.noise({ dur: 0.2, vol: 0.22, freq: 1100, q: 1, slide: 700 });
    this.tone({ freq: 480, type: 'triangle', dur: 0.14, vol: 0.07, slide: 320 });
  },
  airBeep() {
    this.tone({ freq: 880, type: 'square', dur: 0.09, vol: 0.1 });
    this.tone({ freq: 660, type: 'square', dur: 0.09, vol: 0.08, delay: 0.13 });
  },
  poof() {
    this.noise({ dur: 0.25, vol: 0.3, freq: 600, q: 1, slide: 600 });
    this.tone({ freq: 220, type: 'triangle', dur: 0.2, vol: 0.15, slide: 300 });
  },
  crateBreak() {
    this.noise({ dur: 0.2, vol: 0.4, freq: 500, q: 0.7 });
    this.noise({ dur: 0.3, vol: 0.25, freq: 1500, q: 0.8, delay: 0.04 });
  },

  // recogida de luciérnaga: semitonos ascendentes como las notas de BK
  collectFirefly(now) {
    if (now - this.lastPickup > 2.2) this.noteStep = 0;
    this.lastPickup = now;
    const f = 660 * Math.pow(2, Math.min(this.noteStep, 12) / 12);
    this.noteStep++;
    this.tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.22 });
    this.tone({ freq: f * 2, type: 'sine', dur: 0.18, vol: 0.1, delay: 0.02 });
  },

  collectFeather() {
    const seq = [523, 659, 784, 1046];
    seq.forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.18, vol: 0.18, delay: i * 0.07 }));
  },

  collectOrchid() {
    // acorde místico
    const seq = [392, 494, 587, 784, 988];
    seq.forEach((f, i) => {
      this.tone({ freq: f, type: 'sine', dur: 0.8, vol: 0.14, delay: i * 0.09 });
      this.tone({ freq: f * 2, type: 'triangle', dur: 0.4, vol: 0.05, delay: i * 0.09 });
    });
    this.noise({ dur: 0.6, vol: 0.08, freq: 4000, q: 2, slide: 2000 });
  },

  heal() {
    [440, 554, 659].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.15, vol: 0.15, delay: i * 0.06 }));
  },

  questJingle() {
    [523, 659, 880].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.3, vol: 0.16, delay: i * 0.12 }));
  },

  // chillido de halcón de Gavi: ¡KREEEE!
  screech(delay = 0) {
    this.tone({ freq: 1400, type: 'square', dur: 0.14, vol: 0.09, slide: 1100, delay });
    this.tone({ freq: 2400, type: 'sine', dur: 0.3, vol: 0.14, slide: -1500, delay: delay + 0.13 });
    this.tone({ freq: 2350, type: 'sawtooth', dur: 0.28, vol: 0.04, slide: -1450, delay: delay + 0.14 });
  },

  // gruñido ronroneante de Nahu: rrr-RAU
  growl(delay = 0) {
    for (let i = 0; i < 7; i++) {
      this.tone({ freq: 82 - i * 2, type: 'sawtooth', dur: 0.05, vol: 0.2, delay: delay + i * 0.055 });
    }
    this.noise({ dur: 0.45, vol: 0.22, freq: 150, q: 2, delay });
    this.tone({ freq: 110, type: 'sawtooth', dur: 0.28, vol: 0.18, slide: -45, delay: delay + 0.4 });
  },

  // LA fanfarria del jiggy, edición Nahu & Gavi:
  // toms → llamada → respuesta → gran acorde → dueto chillido+gruñido → golpe final
  jiggyFanfare() {
    // toms ascendentes de entrada
    [[0, 200], [0.12, 300], [0.24, 430]].forEach(([d, f]) =>
      this.noise({ dur: 0.09, vol: 0.38, freq: f, q: 1.3, delay: d }));
    // frase de llamada
    const ph1 = [[0.36, 659, 0.15], [0.52, 784, 0.15], [0.68, 880, 0.15], [0.88, 1046, 0.5]];
    // frase de respuesta
    const ph2 = [[1.42, 880, 0.14], [1.57, 784, 0.14], [1.72, 659, 0.14], [1.87, 784, 0.18]];
    for (const [d, f, dur] of [...ph1, ...ph2]) {
      this.tone({ freq: f, type: 'square', dur, vol: 0.11, delay: d });
      this.tone({ freq: f / 2, type: 'triangle', dur, vol: 0.16, delay: d });
      this.tone({ freq: f * 1.004, type: 'sawtooth', dur, vol: 0.04, delay: d });
    }
    [0.36, 0.88, 1.42, 1.87].forEach((d) => this.noise({ dur: 0.1, vol: 0.22, freq: 260, q: 1, delay: d }));
    // gran acorde de resolución
    for (const f of [523, 659, 784, 1046]) {
      this.tone({ freq: f, type: 'sawtooth', dur: 0.9, vol: 0.06, delay: 2.12 });
      this.tone({ freq: f, type: 'triangle', dur: 0.9, vol: 0.1, delay: 2.12 });
    }
    this.tone({ freq: 131, type: 'sine', dur: 1.0, vol: 0.28, delay: 2.12 });
    this.noise({ dur: 0.9, vol: 0.12, freq: 6500, q: 2.5, slide: -3500, delay: 2.12 });
    this.noise({ dur: 0.14, vol: 0.4, freq: 200, q: 1, delay: 2.12 });
    // ---- la firma del dúo ----
    this.screech(3.0);   // Gavi: ¡KREEEE!
    this.growl(3.45);    // Nahu: rrr-RAU
    // golpe final al unísono "¡GUH!"
    [131, 262, 523, 1046].forEach((f) =>
      this.tone({ freq: f, type: f < 300 ? 'square' : 'triangle', dur: 0.4, vol: f < 300 ? 0.2 : 0.1, delay: 4.0 }));
    this.noise({ dur: 0.18, vol: 0.42, freq: 240, q: 1, delay: 4.0 });
    this.noise({ dur: 0.5, vol: 0.1, freq: 7000, q: 3, slide: -4000, delay: 4.0 });
  },

  // farfulleo de voz estilo BK: blips cortos por sílaba
  voice(who) {
    const r = Math.random();
    if (who === 'axol') {
      this.tone({ freq: 95 + r * 50, type: 'sine', dur: 0.09, vol: 0.3, slide: -20 });
      this.tone({ freq: 190 + r * 80, type: 'triangle', dur: 0.07, vol: 0.12 });
    } else if (who === 'gavi') {
      this.tone({ freq: 620 + r * 320, type: 'square', dur: 0.05, vol: 0.07, slide: 120 });
    } else { // nahu
      this.tone({ freq: 130 + r * 60, type: 'sawtooth', dur: 0.08, vol: 0.1, slide: -30 });
    }
  },
};
