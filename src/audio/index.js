import { sfx } from './sfx.js';
import { startMusic } from './music.js';

// Motor de audio 100% procedural (WebAudio, cero assets): buses master /
// sfx / música, y los generadores básicos tone() y noise() sobre los que
// se montan todos los SFX (sfx.js) y el secuenciador (music.js).

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.noteStep = 0;      // pitch ascendente estilo BK en recogidas seguidas
    this.lastPickup = 0;
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.8;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.42;
    this.musicBus.connect(this.master);
    startMusic(this);
  }

  // ---------- generadores básicos ----------
  tone({ freq = 440, type = 'sine', dur = 0.2, vol = 0.3, attack = 0.005, slide = 0, delay = 0, bus = null }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(bus || this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.2, vol = 0.2, freq = 1200, q = 1, delay = 0, slide = 0 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.ceil(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t0);
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t0);
  }
}

// los SFX se definen como mixin para mantener este archivo en lo esencial
Object.assign(AudioEngine.prototype, sfx);
