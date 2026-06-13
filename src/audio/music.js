// Secuenciador de la música de fondo: marimba/kalimba pentatónica relajada
// a 84 BPM con bajo, shaker y pájaros ocasionales. 8 compases precompuestos
// que loopean limpio, agendados por delante con setTimeout.

export function startMusic(engine) {
  const ctx = engine.ctx;
  const BPM = 84;
  const beat = 60 / BPM;
  const bar = beat * 4;
  // pentatónica-ish sobre Do: patrón de kalimba chill
  const SCALE = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3, 784.0];
  // patrón melódico: [paso de semicorchea, índice de escala] por compás
  const PATTERN = [
    [[0, 4], [3, 5], [6, 3], [10, 4], [12, 2]],
    [[0, 5], [4, 7], [8, 5], [11, 4], [14, 3]],
    [[0, 2], [3, 4], [6, 5], [10, 7], [12, 8]],
    [[0, 7], [4, 5], [8, 4], [12, 3]],
    [[0, 4], [3, 5], [6, 3], [10, 4], [12, 2]],
    [[0, 5], [4, 7], [8, 5], [11, 4], [14, 5]],
    [[2, 8], [5, 7], [8, 5], [11, 4], [14, 2]],
    [[0, 3], [4, 2], [8, 4], [12, 0]],
  ];
  const BASS = [130.8, 110.0, 87.3, 98.0, 130.8, 110.0, 174.6, 98.0]; // C A F G | C A F G
  let nextBar = 0;
  let barTime = ctx.currentTime + 0.1;

  const playMarimba = (freq, t, vol = 0.16) => {
    const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 4;
    const g1 = ctx.createGain(); const g2 = ctx.createGain();
    g1.gain.setValueAtTime(vol, t); g1.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    g2.gain.setValueAtTime(vol * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o1.connect(g1).connect(engine.musicBus);
    o2.connect(g2).connect(engine.musicBus);
    o1.start(t); o1.stop(t + 0.6); o2.start(t); o2.stop(t + 0.15);
  };
  const playBass = (freq, t) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + bar * 0.9);
    o.connect(g).connect(engine.musicBus);
    o.start(t); o.stop(t + bar);
  };
  const playShaker = (t, vol) => {
    const len = Math.ceil(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(engine.musicBus);
    src.start(t);
  };

  const schedule = () => {
    if (!engine.started) return;
    while (barTime < ctx.currentTime + 1.2) {
      const b = nextBar % 8;
      playBass(BASS[b], barTime);
      for (const [step, idx] of PATTERN[b]) {
        playMarimba(SCALE[idx], barTime + step * (beat / 4));
      }
      for (let s = 0; s < 8; s++) playShaker(barTime + s * (beat / 2), s % 2 ? 0.05 : 0.025);
      // pájaro ocasional
      if (b === 3 || b === 6) {
        const t = barTime + beat * (1 + (b % 3));
        engine.tone({ freq: 2200 + (b * 137) % 800, type: 'sine', dur: 0.1, vol: 0.05, slide: 600, delay: t - ctx.currentTime, bus: engine.musicBus });
        engine.tone({ freq: 2600, type: 'sine', dur: 0.08, vol: 0.04, slide: -400, delay: t - ctx.currentTime + 0.13, bus: engine.musicBus });
      }
      barTime += bar;
      nextBar++;
    }
    engine._musicTimer = setTimeout(schedule, 250);
  };
  schedule();
}
