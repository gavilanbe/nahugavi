import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { CameraRig } from './CameraRig.js';
import { Atmosphere } from './Atmosphere.js';
import { buildWorld } from '../world/index.js';
import { Particles } from '../entities/Particles.js';
import { Entities } from '../entities/index.js';
import { Player } from '../player/index.js';
import { AudioEngine } from '../audio/index.js';
import { UI } from '../ui/index.js';

// Orquestador del juego: crea todos los sistemas, los conecta a través del
// contexto compartido G y ejecuta el bucle principal. Todo el contenido
// (terreno, entidades, misión, textos) entra por el objeto `level`.

export class Game {
  constructor(canvas, level) {
    const G = this.G = {
      state: 'title',   // title | play | victory
      time: 0,
      mood: 0,          // 0 = atardecer eterno, 1 = día despierto
      moodTarget: 0,
      shakeT: 0,
      hitStopT: 0,
      cinema: null,     // { t, ang } — cámara cinemática para el baile del ídolo
      level,
    };
    window.G = G; // debug

    G.scene = new THREE.Scene();
    G.input = new Input(G);
    G.camRig = new CameraRig(G);
    G.camera = G.camRig.camera;
    G.renderer = new Renderer(G, canvas);
    G.world = buildWorld(G, level);
    G.atmosphere = new Atmosphere(G);
    G.ui = new UI(G);
    G.audio = new AudioEngine();
    G.fx = new Particles(G);
    G.player = new Player(G);
    G.ents = new Entities(G, level);

    // servicios compartidos
    G.fade = (on) => G.ui.fade(on);
    G.shake = (s) => { G.shakeT = Math.max(G.shakeT, s); };
    G.hitStop = (s) => { G.hitStopT = Math.max(G.hitStopT, s); };
    G.victory = () => {
      G.state = 'victory';
      G.paused = false;
      G.ui.hidePause();
      G.ui.hidePauseBtn();
      G.ui.showVictory({
        orchids: G.ents.counts.orchids,
        fireflies: G.ents.counts.fireflies,
        firefliesTotal: G.ents.collectibles.totalFireflies,
        feathers: G.ents.counts.feathers,
      });
    };

    // HUD inicial
    G.ui.setHealth(G.player.maxHp);
    G.ui.setFireflies(0, G.ents.collectibles.totalFireflies);
    G.ui.setFeathers(0, G.ents.collectibles.feathersTotal);

    // acciones por evento: avanzar diálogo y arrancar desde el título
    G.input.onAction((action) => {
      if ((action === 'interact' || action === 'enter' || action === 'jump') && G.ui.dialogActive) {
        G.ui.advanceDialog();
      }
      // ENTER o ESPACIO arrancan desde el título
      if ((action === 'enter' || action === 'jump') && G.state === 'title') this.startGame();
    });
    // …y un clic / toque en cualquier parte del título también arranca
    G.ui.el.title.addEventListener('pointerdown', () => {
      if (G.state === 'title') this.startGame();
    });

    // ---------- pausa ----------
    G.paused = false;
    this.togglePause = (on) => {
      if (G.state !== 'play') return;
      const want = (on == null) ? !G.paused : on;
      if (want === G.paused) return;
      G.paused = want;
      if (want) {
        G.ui.showPause();
      } else {
        G.ui.hidePause();
        G.input.keys.clear();      // suelta cualquier tecla "mantenida" durante la pausa
        G.input.pressed.clear();
      }
    };
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if ((e.code === 'Escape' || e.code === 'KeyP') && G.state === 'play') {
        e.preventDefault();
        this.togglePause();
      }
    });
    G.ui.el.pauseBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.togglePause(true); });
    document.getElementById('resume').addEventListener('pointerdown', (e) => { e.preventDefault(); this.togglePause(false); });
    document.getElementById('restart').addEventListener('pointerdown', (e) => { e.preventDefault(); location.reload(); });

    this.clock = new THREE.Clock();
  }

  startGame() {
    const G = this.G;
    if (G.state !== 'title') return;   // idempotente: tecla + clic a la vez no arrancan dos veces
    G.audio.start();
    G.ui.hideTitle();
    G.ui.showHUD();
    G.ui.showPauseBtn();
    G.state = 'play';
    G.input.pressed.clear();           // descarta la tecla/clic que arrancó (sin salto/zarpazo fantasma)
    G.camRig.snapBehindPlayer();
    setTimeout(() => G.ents.quest.intro(), 600);
  }

  start() {
    const G = this.G;
    const loop = () => {
      requestAnimationFrame(loop);
      const rawDt = Math.min(this.clock.getDelta(), 0.05);
      if (G.paused) { G.renderer.render(); G.input.endFrame(); return; }  // congela todo, mantiene el frame visible
      let dt = rawDt;
      if (G.hitStopT > 0) {           // congelación de frame en impactos gordos
        G.hitStopT -= rawDt;
        dt = 0;
      }
      G.time += dt;

      for (const fn of G.world.animated) fn(dt, G.time);

      if (G.state !== 'title') {
        const active = G.state === 'play' && !G.ui.dialogActive;
        G.player.frozen = !active;
        if (dt > 0) {
          G.player.update(dt, active);
          G.ents.update(dt);
          G.fx.update(dt);
        }
      }
      G.camRig.update(rawDt);         // rawDt: el shake decae durante el hit-stop
      G.atmosphere.update(dt);

      G.renderer.render();
      G.input.endFrame();
    };
    loop();
  }
}
