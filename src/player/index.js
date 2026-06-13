import * as THREE from 'three';
import { PHYSICS, POUND, WATER_Y } from '../config.js';
import { buildPlayerMesh } from './mesh.js';
import { PlayerFx } from './fx.js';
import { animatePlayer } from './animate.js';

// Controlador del jugador: estado, físicas (correr / saltar / aletear /
// nadar / bucear), acciones de combate (zarpazo, picotazo, bombazo) y
// vida/aire. La malla vive en mesh.js, la pose en animate.js y los FX en
// fx.js — este archivo es solo gameplay.

const { GRAVITY, RUN_SPEED, JUMP_V, FLAP_V, MAX_FLAPS } = PHYSICS;

export class Player {
  constructor(G) {
    this.G = G;
    this.pos = new THREE.Vector3(0, 2, 2);
    this.vel = new THREE.Vector3();
    this.heading = Math.PI;
    this.onGround = false;
    this.flapsLeft = MAX_FLAPS;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.hp = 5;
    this.maxHp = 5;
    this.invuln = 0;
    this.frozen = false;
    this.swimming = false;
    this.diving = false;
    this.air = 1;          // medidor de aire estilo BK (1 = lleno)
    this.bubbleT = 0;
    this.strokeT = 0;
    this.drownT = 0;
    this.beepT = 0;
    this.swimTipShown = false;

    this.action = '';      // '', swipe, peck, pound, celebrate, jiggy
    this.actionT = 0;
    this.attackHit = null;
    this.poundLanded = null;
    this.poundLandT = 0;   // temporizador de la pose de impacto del bombazo
    this._slammed = false; // ¿ya disparó el desplome del bombazo?
    this.celebrateT = 0;
    this.swipeSide = 1;    // alterna la zarpa
    this.flapAnim = 0;

    this.walkPhase = 0;
    this.airTime = 0;
    this.usedFlapEver = false;

    // estado de "juice"
    this.squash = 0;       // squash vertical con muelle (-: chafado, +: estirado)
    this.squashV = 0;
    this.hurtFlash = 0;
    this.idleT = 0;
    this.sleeping = false;
    this.sleepZT = 0;
    this.blinkT = 1.5 + Math.random() * 2;
    this.blink = 0;
    this.stepT = 0;
    this.gaviGlanceT = 0;
    this.gaviGlance = 0;

    this.fxs = new PlayerFx(G);
    buildPlayerMesh(this, G);
  }

  // ================== gameplay ==================
  damage(n, fromX, fromZ) {
    if (this.invuln > 0 || this.hp <= 0 || this.action === 'celebrate' || this.action === 'jiggy') return;
    this.hp = Math.max(0, this.hp - n);
    this.invuln = 1.6;
    this.hurtFlash = 0.35;
    this.G.audio.hurt();
    this.G.ui.setHealth(this.hp);
    this.G.ui.damageFlash();
    this.G.shake(0.25);
    const dx = this.pos.x - fromX, dz = this.pos.z - fromZ;
    const d = Math.hypot(dx, dz) || 1;
    this.vel.x = (dx / d) * 9;
    this.vel.z = (dz / d) * 9;
    this.vel.y = 6;
    this.onGround = false;
    if (this.hp <= 0) this.faint();
  }

  faint() {
    const G = this.G;
    G.fade(true);
    setTimeout(() => {
      this.pos.set(0, G.world.heightAt(0, 2) + 1, 2);
      this.vel.set(0, 0, 0);
      this.hp = this.maxHp;
      this.air = 1;
      this.diving = false;
      this.invuln = 2;
      G.ui.setHealth(this.hp);
      G.fade(false);
      G.ui.showHint('Tata Axol te ha despertado junto al altar...', 3.5);
    }, 700);
  }

  heal(n) {
    this.hp = Math.min(this.maxHp, this.hp + n);
    this.G.ui.setHealth(this.hp);
  }

  celebrate(dur = 2.6) {
    this.action = 'celebrate';
    this.actionT = 0;
    this.celebrateT = dur;
    this.vel.set(0, 0, 0);
    this.sleeping = false;
  }

  // el baile del ídolo: agachada → saltos girando con el ídolo → pose de héroe
  startJiggy(dur = 4.8) {
    this.action = 'jiggy';
    this.actionT = 0;
    this.celebrateT = dur;
    this.vel.set(0, 0, 0);
    this.sleeping = false;
    this.squashV -= 2; // squash de anticipación
  }

  wake() {
    if (this.sleeping) {
      this.sleeping = false;
      this.squashV += 3; // saltito de sobresalto
    }
    this.idleT = 0;
  }

  update(dt, active) {
    const G = this.G;
    const input = G.input;
    const heightAt = G.world.heightAt;
    const colliders = G.world.colliders;
    this.attackHit = null;
    this.poundLanded = null;

    if (this.invuln > 0) this.invuln -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.poundLandT > 0) this.poundLandT -= dt;

    const camYaw = G.camRig.yaw;

    // ----- input -----
    let mx = 0, mz = 0;
    if (active && !this.frozen && this.action !== 'celebrate') {
      const axis = input.moveAxis();
      mx = axis.x; mz = axis.z;
    }
    const moving = (mx !== 0 || mz !== 0);
    if (moving || input.pressed.size > 0) this.wake();
    let wx = 0, wz = 0;
    if (moving) {
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      wx = mx * Math.cos(camYaw) + mz * Math.sin(camYaw);
      wz = -mx * Math.sin(camYaw) + mz * Math.cos(camYaw);
    }

    // ----- agua -----
    const terrainY = heightAt(this.pos.x, this.pos.z);
    this.swimming = terrainY < WATER_Y - 0.6 && this.pos.y < WATER_Y + 0.35;
    if (!this.swimming) this.diving = false;
    if (this.swimming && !this.swimTipShown && active) {
      this.swimTipShown = true;
      G.ui.showHint('¡A nadar! <b>K</b> — bucear · <b>ESPACIO</b> — subir / saltar', 3.5);
    }
    // ¡al fondo!
    if (this.swimming && !this.diving && active && !this.frozen && input.pressed.has('pound')) {
      this.diving = true;
      this.vel.y = -5;
      G.audio.splash();
      G.fx.bubbles(this.pos.x, WATER_Y - 0.4, this.pos.z, 8);
    }

    // ----- acciones -----
    if (this.action && this.action !== 'celebrate') {
      this.actionT += dt;
      if (this.action === 'swipe') {
        if (this.actionT > 0.08 && this.actionT < 0.26) {
          const fx2 = this.pos.x + Math.sin(this.heading) * 1.1;
          const fz2 = this.pos.z + Math.cos(this.heading) * 1.1;
          this.attackHit = { x: fx2, y: this.pos.y + 0.9, z: fz2, r: 1.3, type: 'swipe' };
        }
        if (this.actionT > 0.36) {
          this.action = '';
          for (const a of this.arms) a.claws.visible = false;
        }
      } else if (this.action === 'peck') {
        // ra-ta-tá: tres picotazos rápidos, cada uno con estela + pío + micro-dash
        const PECK_TIMES = [0.04, 0.18, 0.32];
        if (this._peckN < 3 && this.actionT >= PECK_TIMES[this._peckN]) {
          this._peckN++;
          this.fxs.peckStreak(this, this._peckN);
          G.audio.peck();
          this.vel.x += Math.sin(this.heading) * 2.4;
          this.vel.z += Math.cos(this.heading) * 2.4;
          G.fx.pop(
            this.pos.x + Math.sin(this.heading) * 1.4,
            this.pos.y + 1.6,
            this.pos.z + Math.cos(this.heading) * 1.4,
            '#dff4ff', 0.5
          );
        }
        if (this.actionT < 0.44) {
          const fx2 = this.pos.x + Math.sin(this.heading) * 1.25;
          const fz2 = this.pos.z + Math.cos(this.heading) * 1.25;
          this.attackHit = { x: fx2, y: this.pos.y + 1.3, z: fz2, r: 1.3, type: 'peck' };
        }
        if (this.actionT > 0.48) this.action = '';
      }
    }
    if (this.action === 'celebrate' || this.action === 'jiggy') {
      this.celebrateT -= dt;
      this.actionT += dt;
      if (this.celebrateT <= 0) this.action = '';
    }

    const canAct = active && !this.frozen && this.action !== 'celebrate' && this.action !== 'jiggy' && !this.swimming;
    const canSwimCtl = this.swimming && active && !this.frozen && this.action !== 'celebrate' && this.action !== 'jiggy';

    if (canAct && input.pressed.has('attack')) {
      if (this.onGround && !this.action) {
        this.action = 'swipe'; this.actionT = 0;
        this.swipeSide *= -1;
        // paso de embestida
        this.vel.x += Math.sin(this.heading) * 3.5;
        this.vel.z += Math.cos(this.heading) * 3.5;
        this.fxs.slash(this);
        for (const a of this.arms) a.claws.visible = true;
        G.audio.swipe();
      } else if (!this.onGround && this.action !== 'pound' && !this.action) {
        this.action = 'peck'; this.actionT = 0;
        this._peckN = 0;
        this.vel.x += Math.sin(this.heading) * 3.5;
        this.vel.z += Math.cos(this.heading) * 3.5;
        if (this.vel.y < 1.5) this.vel.y = 1.5; // saltito hacia el vuelo estático
      }
    }
    if (canAct && input.pressed.has('pound') && !this.onGround && this.action !== 'pound') {
      this.action = 'pound'; this.actionT = 0;
      this._slammed = false;
      this.vel.set(0, POUND.POP_V, 0); // se recoge en bola y se eleva un poco
      this.squashV += 2.6;             // estirón al recogerse
    }
    if (this.action === 'pound') {
      if (this.actionT >= POUND.HANG_FROM && this.actionT < POUND.HANG_TO) {
        // ápice: flota un instante (el "suspense") y mata la deriva → cae a plomo
        this.vel.y += (0.6 - this.vel.y) * Math.min(1, 16 * dt);
        this.vel.x *= 1 - Math.min(1, 12 * dt);
        this.vel.z *= 1 - Math.min(1, 12 * dt);
      } else if (this.actionT >= POUND.HANG_TO) {
        if (!this._slammed) { this._slammed = true; G.audio.poundStart(); } // whoosh al caer
        if (this.vel.y > -POUND.SLAM_V) this.vel.y = -POUND.SLAM_V;          // ¡DESPLOME!
      }
    }

    // ----- movimiento horizontal -----
    const inControl = (canAct || canSwimCtl) && this.action !== 'pound';
    const speed = this.swimming ? (this.diving ? PHYSICS.DIVE_SPEED : PHYSICS.SWIM_SPEED) : RUN_SPEED;
    const accel = this.onGround ? 46 : 22;
    if (inControl && moving) {
      this.vel.x += (wx * speed - this.vel.x) * Math.min(1, accel * dt / speed);
      this.vel.z += (wz * speed - this.vel.z) * Math.min(1, accel * dt / speed);
      const targetH = Math.atan2(wx, wz);
      let dh = targetH - this.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      // polvo de giro brusco
      if (Math.abs(dh) > 2.4 && this.onGround && Math.hypot(this.vel.x, this.vel.z) > 5) {
        G.fx.dustRing(this.pos.x, this.pos.y, this.pos.z, 0.3);
      }
      this.heading += dh * Math.min(1, 14 * dt);
    } else if (this.onGround || this.swimming) {
      const fr = Math.min(1, 26 * dt);
      this.vel.x *= 1 - fr;
      this.vel.z *= 1 - fr;
    }

    // ----- salto / aleteo -----
    if (this.onGround) { this.coyote = PHYSICS.COYOTE; this.flapsLeft = MAX_FLAPS; this.airTime = 0; }
    else { this.coyote -= dt; this.airTime += dt; }
    if (this.swimming) this.flapsLeft = MAX_FLAPS; // Gavi siempre puede aletear al salir del agua
    if (input.pressed.has('jump') && (canAct || canSwimCtl)) this.jumpBuffer = PHYSICS.JUMP_BUFFER;
    else this.jumpBuffer -= dt;

    if (this.jumpBuffer > 0 && this.action !== 'pound') {
      if (this.swimming && !this.diving) {
        this.vel.y = JUMP_V; // salto a plena potencia desde el agua
        this.jumpBuffer = 0;
        this.airTime = 0;
        G.audio.jump();
        G.fx.splash(this.pos.x, this.pos.z);
      } else if (!this.swimming && this.coyote > 0) {
        this.vel.y = JUMP_V;
        this.onGround = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.squashV += 2.5; // estirón al despegar
        G.audio.jump();
        G.fx.dustRing(this.pos.x, this.pos.y, this.pos.z, 0.25);
      } else if (!this.swimming && this.flapsLeft > 0 && this.airTime > 0.08) {
        this.vel.y = Math.max(this.vel.y, 0) * 0.2 + FLAP_V;
        this.flapsLeft--;
        this.jumpBuffer = 0;
        this.flapAnim = 0.45;
        this.squashV += 1.8;
        G.audio.flap();
        if (!this.usedFlapEver) {
          this.usedFlapEver = true;
          G.ui.showHint(`¡Gavi aletea! Hasta ${MAX_FLAPS} aleteos por salto`, 2.5);
        }
      }
    }

    // ----- gravedad / flotabilidad -----
    if (this.diving) {
      // nado 3D libre: Espacio = subir, K = bajar, flotabilidad casi neutra
      let vy = 0.2;
      if (active && !this.frozen) {
        if (input.isDown('Space')) vy = 4.6;
        else if (input.isDown('KeyK')) vy = -4.6;
      }
      this.vel.y += (vy - this.vel.y) * Math.min(1, 6 * dt);
      // emerger
      if (this.pos.y > WATER_Y - 0.4 && this.vel.y > 0.5) {
        this.diving = false;
        G.audio.gasp();
        G.fx.splash(this.pos.x, this.pos.z);
      }
    } else if (this.swimming) {
      const target = WATER_Y - 0.12;
      this.vel.y += (target - this.pos.y) * 14 * dt - this.vel.y * 4 * dt;
    } else {
      // el picotazo flota (las alas de Gavi sostienen), el bombazo cae a saco
      const g = (this.action === 'pound')
        ? (this.actionT < POUND.HANG_TO ? GRAVITY * 0.5 : GRAVITY * 2.2) // ligera al subir/flotar, brutal al desplomar
        : (this.action === 'peck') ? GRAVITY * 0.2 : GRAVITY;
      this.vel.y -= g * dt;
      if (this.vel.y < -PHYSICS.MAX_FALL) this.vel.y = -PHYSICS.MAX_FALL;
    }

    // ----- integración -----
    const wasInWater = this.swimming;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vel.y * dt;

    const dCenter = Math.hypot(this.pos.x, this.pos.z);
    if (dCenter > PHYSICS.WORLD_RADIUS) {
      this.pos.x *= PHYSICS.WORLD_RADIUS / dCenter;
      this.pos.z *= PHYSICS.WORLD_RADIUS / dCenter;
    }

    colliders.pushOut(this.pos, 0.45);

    const gY = colliders.groundAt(this.pos.x, this.pos.z, this.pos.y);
    if (this.diving) {
      // flota sobre el lecho del lago en vez de aterrizar
      if (this.pos.y <= gY + 0.55) {
        this.pos.y = gY + 0.55;
        if (this.vel.y < 0) this.vel.y = 0;
      }
    } else if (this.pos.y <= gY && this.vel.y <= 0) {
      const fell = this.vel.y;
      this.pos.y = gY;
      this.vel.y = 0;
      if (!this.onGround) {
        this.onGround = true;
        this.squashV -= Math.min(5, -fell * 0.25); // squash de aterrizaje según impacto
        if (this.action === 'pound') {
          this.action = '';
          this.poundLandT = POUND.LAND_T;      // dispara la pose de aplastamiento
          this.squashV -= 4;                   // chafado extra de impacto
          this.poundLanded = { x: this.pos.x, y: this.pos.y, z: this.pos.z, r: 3.0 };
          this.fxs.shockwave(this);
          G.audio.poundHit();
          G.shake(0.6);
          G.hitStop(0.08);
          G.fx.dustRing(this.pos.x, gY, this.pos.z, 1.5);   // anillo de polvo más ancho
          G.fx.pop(this.pos.x, gY + 0.2, this.pos.z, '#ffe6a0', 1.7); // destello del golpe
          G.fx.burst(this.pos.x, gY + 0.1, this.pos.z, '#c8b088', 9, 5); // terrones de tierra
        } else if (fell < -14) {
          G.fx.dustRing(this.pos.x, gY, this.pos.z, 0.5);
          G.audio.land();
        } else if (fell < -4) {
          G.audio.land();
        }
      }
    } else if (this.pos.y > gY + 0.05) {
      this.onGround = false;
    }

    const nowSwim = heightAt(this.pos.x, this.pos.z) < WATER_Y - 0.5 && this.pos.y < WATER_Y + 0.3;
    if (nowSwim && !wasInWater && this.vel.y < -3) {
      G.audio.splash();
      G.fx.splash(this.pos.x, this.pos.z);
    }

    if (this.pos.y < PHYSICS.KILL_Y) this.faint();

    // ----- medidor de aire (estilo BK) -----
    if (this.diving) {
      this.air = Math.max(0, this.air - dt / PHYSICS.AIR_SECONDS);
      this.bubbleT -= dt;
      if (this.bubbleT <= 0) {
        this.bubbleT = 0.55;
        G.fx.bubbles(
          this.pos.x + Math.sin(this.heading) * 0.8,
          this.pos.y + 1.0,
          this.pos.z + Math.cos(this.heading) * 0.8, 2);
        G.audio.bubble();
      }
      if (this.air < 0.25) {
        this.beepT -= dt;
        if (this.beepT <= 0) { this.beepT = 1; G.audio.airBeep(); }
      }
      if (this.air <= 0) {
        this.drownT -= dt;
        if (this.drownT <= 0) {
          this.drownT = 1.6;
          this.damage(1, this.pos.x - Math.sin(this.heading), this.pos.z - Math.cos(this.heading));
          this.vel.y = 3; // patada de pánico hacia la superficie
        }
      }
    } else {
      this.air = Math.min(1, this.air + dt / PHYSICS.AIR_REFILL);
      this.drownT = 0;
    }
    G.ui.setAir((this.diving || this.air < 1) && this.hp > 0 ? this.air : null);

    // estela de crol + brazadas / pasos con polvo
    const hSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (this.swimming && !this.diving && hSpeed > 2.5) {
      this.strokeT -= dt;
      if (this.strokeT <= 0) {
        this.strokeT = 0.42;
        G.audio.stroke();
        G.fx.wake(this.pos.x, this.pos.z);
      }
    }
    if (this.onGround && hSpeed > 5 && !this.swimming) {
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = 0.21;
        G.audio.step();
        G.fx.stepPuff(this.pos.x, gY, this.pos.z);
      }
    }

    // ----- idle / dormirse -----
    if (this.onGround && hSpeed < 0.5 && !this.action && active && !this.swimming) {
      this.idleT += dt;
      if (this.idleT > 9 && !this.sleeping) {
        this.sleeping = true;
        this.sleepZT = 0;
      }
    } else {
      this.idleT = 0;
      if (this.sleeping && (hSpeed > 0.5 || this.action)) this.sleeping = false;
    }
    if (this.sleeping) {
      this.sleepZT -= dt;
      if (this.sleepZT <= 0) {
        this.sleepZT = 1.1;
        this.fxs.zzz(this);
      }
    }

    animatePlayer(this, dt);
    this.fxs.update(dt);
  }
}
