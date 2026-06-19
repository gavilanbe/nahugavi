import { PALETTES, ICONS, drawIcon } from './assets.js';
import { Dialog } from './Dialog.js';

// HUD (vida, contadores, aire), pistas, banners, fundidos, pantalla de
// victoria y la caja de diálogo (delegada en Dialog.js).

export class UI {
  constructor(G) {
    this.G = G;
    this.el = {
      hud: document.getElementById('hud'),
      health: document.getElementById('health'),
      nFirefly: document.getElementById('n-firefly'),
      nFeather: document.getElementById('n-feather'),
      orchidSlots: document.getElementById('orchid-slots'),
      rowIdol: document.getElementById('row-idol'),
      hint: document.getElementById('hint'),
      banner: document.getElementById('banner'),
      bannerH: document.getElementById('banner-h'),
      bannerP: document.getElementById('banner-p'),
      title: document.getElementById('title'),
      victory: document.getElementById('victory'),
      pause: document.getElementById('pause'),
      pauseBtn: document.getElementById('pause-btn'),
      stats: document.getElementById('stats'),
      vignette: document.getElementById('vignette-dmg'),
      fader: document.getElementById('fader'),
      air: document.getElementById('air'),
      airFill: document.getElementById('air-fill'),
    };

    this.dialog = new Dialog(G, {
      dialog: document.getElementById('dialog'),
      name: document.getElementById('dlg-name'),
      text: document.getElementById('dlg-text'),
      portrait: document.getElementById('dlg-portrait'),
      next: document.getElementById('dlg-next'),
    });

    // iconos del HUD
    drawIcon(document.getElementById('i-firefly'), ICONS.firefly, PALETTES.firefly);
    drawIcon(document.getElementById('i-feather'), ICONS.feather, PALETTES.feather);
    drawIcon(document.getElementById('i-idol'), ICONS.idol, PALETTES.idol);

    // huecos de vida (mangos)
    this.healthCanvases = [];
    for (let i = 0; i < 5; i++) {
      const c = document.createElement('canvas');
      drawIcon(c, ICONS.mango, PALETTES.mango);
      this.el.health.appendChild(c);
      this.healthCanvases.push(c);
    }
    // huecos de orquídeas
    this.orchidCanvases = [];
    for (let i = 0; i < 5; i++) {
      const c = document.createElement('canvas');
      drawIcon(c, ICONS.orchid, PALETTES.orchid);
      c.className = 'empty';
      this.el.orchidSlots.appendChild(c);
      this.orchidCanvases.push(c);
    }

    this._hintTimer = null;
    this._bannerTimer = null;
  }

  // ---------- diálogo (delegado) ----------
  get dialogActive() { return this.dialog.active; }
  showDialog(lines, onDone) { this.dialog.show(lines, onDone); }
  advanceDialog() { this.dialog.advance(); }

  // ---------- HUD ----------
  showHUD() { this.el.hud.style.display = 'block'; }
  hideTitle() { this.el.title.style.display = 'none'; }

  // ---------- pausa ----------
  showPause() { this.el.pause.classList.add('show'); }
  hidePause() { this.el.pause.classList.remove('show'); }
  showPauseBtn() { this.el.pauseBtn.classList.add('show'); }
  hidePauseBtn() { this.el.pauseBtn.classList.remove('show'); }

  setHealth(n) {
    this.healthCanvases.forEach((c, i) => c.classList.toggle('lost', i >= n));
  }
  setAir(frac) {
    if (frac == null) { this.el.air.style.display = 'none'; return; }
    this.el.air.style.display = 'block';
    this.el.airFill.style.width = (frac * 100).toFixed(0) + '%';
    this.el.airFill.style.background = frac < 0.25 ? '#ff5a5a' : 'linear-gradient(90deg,#7ee0ff,#3eafd8)';
  }
  setFireflies(n, total) { this.el.nFirefly.textContent = `${n}/${total}`; }
  setFeathers(n, total) { this.el.nFeather.textContent = `${n}/${total}`; }
  setOrchids(n) {
    this.orchidCanvases.forEach((c, i) => c.classList.toggle('empty', i >= n));
  }
  showIdol() { this.el.rowIdol.style.display = 'flex'; }

  showHint(html, dur = 0) {
    this.el.hint.innerHTML = html;
    this.el.hint.classList.add('show');
    clearTimeout(this._hintTimer);
    if (dur > 0) this._hintTimer = setTimeout(() => this.hideHint(), dur * 1000);
  }
  hideHint() { this.el.hint.classList.remove('show'); }

  banner(title, sub = '', dur = 2.6) {
    this.el.bannerH.textContent = title;
    this.el.bannerP.textContent = sub;
    this.el.banner.classList.add('show');
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => this.el.banner.classList.remove('show'), dur * 1000);
  }

  damageFlash() {
    this.el.vignette.style.opacity = 1;
    setTimeout(() => { this.el.vignette.style.opacity = 0; }, 220);
  }

  fade(on) { this.el.fader.style.opacity = on ? 1 : 0; }

  // ---------- victoria ----------
  showVictory(stats) {
    const rows = [
      ['idol', PALETTES.idol, `Ídolo del Sol <b>1/1</b>`],
      ['orchid', PALETTES.orchid, `Orquídeas de Luna <b>${stats.orchids}/5</b>`],
      ['firefly', PALETTES.firefly, `Luciérnagas <b>${stats.fireflies}/${stats.firefliesTotal}</b>`],
      ['feather', PALETTES.feather, `Plumas de Quetzal <b>${stats.feathers}/5</b>`],
    ];
    this.el.stats.innerHTML = '';
    for (const [icon, pal, html] of rows) {
      const div = document.createElement('div');
      div.className = 'stat-row';
      const c = document.createElement('canvas');
      drawIcon(c, ICONS[icon], pal);
      const span = document.createElement('span');
      span.innerHTML = html;
      div.append(c, span);
      this.el.stats.appendChild(div);
    }
    this.el.victory.classList.add('show');
    document.getElementById('again').onclick = () => location.reload();
  }
}
