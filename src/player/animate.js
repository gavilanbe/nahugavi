import * as THREE from 'three';
import { PHYSICS, POUND } from '../config.js';

// Animación procedural del dúo: squash & stretch con muelle, ciclo de
// carrera, nado (crol y braza), poses de combate, sueño, celebración y el
// baile del ídolo. Pura pose por frame — no toca la física.

export function animatePlayer(p, dt) {
  const G = p.G;
  const t = G.time;
  const hSpeed = Math.hypot(p.vel.x, p.vel.z);

  p.root.position.copy(p.pos);
  p.root.rotation.y = p.heading;

  // squash & stretch con muelle
  p.squashV += -p.squash * 180 * dt - p.squashV * 12 * dt;
  p.squash += p.squashV * dt;
  const sq = THREE.MathUtils.clamp(p.squash, -0.4, 0.35);
  p.body.scale.set(1 - sq * 0.5, 1 + sq, 1 - sq * 0.5);

  // flash de daño
  const flashOn = p.hurtFlash > 0;
  for (const m of p.matsFlash) {
    m.emissive.setRGB(flashOn ? 0.55 : 0, 0, 0);
  }

  // parpadeo
  p.blinkT -= dt;
  if (p.blinkT <= 0) { p.blinkT = 1.8 + Math.random() * 2.4; p.blink = 0.12; }
  if (p.blink > 0) p.blink -= dt;
  const eyesClosed = p.blink > 0 || p.sleeping;
  for (const e of p.eyes) {
    e.white.scale.y = eyesClosed ? 0.12 : 1;
    e.pupil.visible = !eyesClosed;
  }

  // Gavi se incorpora + alas
  if (p.flapAnim > 0) p.flapAnim -= dt;
  const wantPop = (!p.onGround && (p.flapAnim > 0 || p.action === 'peck' || p.action === 'pound'))
    || p.action === 'celebrate' || p.action === 'jiggy';
  p.gaviPop += ((wantPop ? 1 : 0) - p.gaviPop) * Math.min(1, 12 * dt);
  p.gavi.position.y = 0.55 + p.gaviPop * 0.38;
  const flapping = p.flapAnim > 0 || p.action === 'celebrate' || p.action === 'peck'
    || (p.action === 'jiggy' && p.actionT > 0.4 && p.actionT < 2.7);
  for (const w of p.wings) {
    const open = p.gaviPop;
    const flap = flapping ? Math.sin(t * 26) * 0.75 : 0;
    w.shoulder.rotation.z = w.side * (1.25 - open * 1.5) + w.side * flap * open;
    w.elbow.rotation.z = w.side * (-2.2 + open * 2.0) + w.side * flap * 0.6 * open;
  }
  // miradas de Gavi en idle + cabeceo
  p.gaviGlanceT -= dt;
  if (p.gaviGlanceT <= 0) {
    p.gaviGlanceT = 1.4 + Math.random() * 2.2;
    p.gaviGlance = (Math.random() - 0.5) * 1.6;
  }
  p.gaviHead.rotation.y += (p.gaviGlance - p.gaviHead.rotation.y) * Math.min(1, 6 * dt);
  p.gaviHead.position.y = 0.5 + Math.sin(t * 2.7) * 0.015;

  // objetivos de pose neutros
  let leanX = 0, bobY = 0, rollZ = 0;
  const L = p.legs, A = p.arms;

  if (p.poundLandT > 0 && p.onGround) {
    // ---- impacto del bombazo: aplastado contra el suelo, recupera con muelle ----
    const k = 1 - p.poundLandT / POUND.LAND_T;               // 0 → 1
    const splat = Math.pow(Math.max(0, 1 - k / 0.5), 1.4);   // máximo al tocar, 0 a mitad
    bobY = -0.34 * splat;
    leanX = 0.5 * splat;
    A[0].shoulder.rotation.x = 0.3 + splat * 1.0;            // brazos al frente, palmas al suelo
    A[1].shoulder.rotation.x = 0.3 + splat * 1.0;
    A[0].shoulder.rotation.z = 0.5 + splat * 0.7;            // abiertos de par en par
    A[1].shoulder.rotation.z = -(0.5 + splat * 0.7);
    L[0].hip.rotation.x = -0.2 - splat * 0.6;                // piernas despatarradas
    L[1].hip.rotation.x = -0.2 - splat * 0.6;
    L[0].knee.rotation.x = 0.3 + splat * 0.9;
    L[1].knee.rotation.x = 0.3 + splat * 0.9;
    p.head.rotation.x = 0.45 * splat;
    p.body.rotation.x = 0;                                    // limpia el giro del desplome
    p.mouth.scale.set(1 + splat * 0.5, 1 + splat * 0.8, 1);  // boca abierta "¡GUH!"
    for (const e of p.eyes) e.brow.rotation.z = e.side * 0.3 * splat;
  } else if (p.swimming) {
    const swimMoving = hSpeed > 1.5;
    p.walkPhase += dt * (swimMoving ? (p.diving ? 7 : 10.5) : 3.5);
    const ph = p.walkPhase;
    if (p.diving) {
      // braza subacuática: cuerpo en horizontal, brazadas amplias, pataleo
      leanX = 1.5;
      bobY = -0.6;
      A[0].shoulder.rotation.x = -1.1 + Math.sin(ph) * 0.7;
      A[1].shoulder.rotation.x = -1.1 + Math.sin(ph) * 0.7;
      A[0].shoulder.rotation.z = 0.55 + Math.sin(ph + 1.2) * 0.4;
      A[1].shoulder.rotation.z = -0.55 - Math.sin(ph + 1.2) * 0.4;
      L[0].hip.rotation.x = Math.sin(ph * 2) * 0.45;
      L[1].hip.rotation.x = -Math.sin(ph * 2) * 0.45;
      L[0].knee.rotation.x = 0.3; L[1].knee.rotation.x = 0.3;
      p.head.rotation.x = -0.55;
    } else {
      // crol en superficie: molinillo de brazos, balanceo, pataleo
      leanX = 1.35;
      bobY = -0.52 + Math.sin(t * 2.6) * 0.04;
      rollZ = swimMoving ? Math.sin(ph) * 0.18 : 0;
      if (swimMoving) {
        A[0].shoulder.rotation.x = -ph;            // brazadas completas
        A[1].shoulder.rotation.x = -ph + Math.PI;
        A[0].shoulder.rotation.z = 0.25;
        A[1].shoulder.rotation.z = -0.25;
      } else {
        // flotando
        A[0].shoulder.rotation.x = Math.sin(ph) * 0.5 - 0.3;
        A[1].shoulder.rotation.x = Math.sin(ph + Math.PI) * 0.5 - 0.3;
      }
      L[0].hip.rotation.x = Math.sin(ph * 2.3) * 0.35;
      L[1].hip.rotation.x = -Math.sin(ph * 2.3) * 0.35;
      L[0].knee.rotation.x = 0.15; L[1].knee.rotation.x = 0.15;
      p.head.rotation.x = -0.6;                    // cabeza fuera del agua
    }
    p.mouth.scale.set(1, 1, 1);
  } else if (p.action === 'pound') {
    // bola compacta: brazos abrazando las rodillas, rodillas al pecho
    const ARM_X = -1.9, ARM_Z = 0.6, HIP = 1.7, KNEE = 1.9;
    const tt = p.actionT;
    if (tt < POUND.HANG_FROM) {
      // RECOGIDA: de extendido a bola en un instante
      const k = tt / POUND.HANG_FROM;
      p.body.rotation.x = k * 0.8;
      A[0].shoulder.rotation.x = -0.4 + (ARM_X + 0.4) * k;
      A[1].shoulder.rotation.x = -0.4 + (ARM_X + 0.4) * k;
      A[0].shoulder.rotation.z = ARM_Z * k; A[1].shoulder.rotation.z = -ARM_Z * k;
      L[0].hip.rotation.x = HIP * k; L[1].hip.rotation.x = HIP * k;
      L[0].knee.rotation.x = KNEE * k; L[1].knee.rotation.x = KNEE * k;
      p.head.rotation.x = 0.5 * k;
      bobY = -0.1 * k;
    } else {
      // ÁPICE (gira lento, suspense) y DESPLOME (drill rápido a plomo)
      const spin = tt < POUND.HANG_TO ? 6 : 30;
      p.body.rotation.x += dt * spin;
      A[0].shoulder.rotation.x = ARM_X; A[1].shoulder.rotation.x = ARM_X;
      A[0].shoulder.rotation.z = ARM_Z; A[1].shoulder.rotation.z = -ARM_Z;
      L[0].hip.rotation.x = HIP; L[1].hip.rotation.x = HIP;
      L[0].knee.rotation.x = KNEE; L[1].knee.rotation.x = KNEE;
      p.head.rotation.x = 0.5;
    }
  } else if (p.action === 'jiggy') {
    const tt = p.actionT;
    p.body.rotation.x = 0;
    const A0 = A[0].shoulder, A1 = A[1].shoulder;
    if (tt < 0.4) {
      // agachada de anticipación
      const k = tt / 0.4;
      bobY = -0.32 * k;
      A0.rotation.x = A1.rotation.x = 0.6 * k;
      L[0].hip.rotation.x = L[1].hip.rotation.x = -0.8 * k;
      L[0].knee.rotation.x = L[1].knee.rotation.x = 1.4 * k;
      p.head.rotation.x = 0.3 * k;
    } else {
      // saltos girando que decaen hasta la pose de héroe, de cara a cámara
      const k = Math.min(1, (tt - 0.4) / 2.3);
      const spin = Math.PI * 6 * (1 - Math.pow(1 - k, 2.4));
      p.root.rotation.y = p.heading + spin;
      bobY = Math.abs(Math.sin((tt - 0.4) * 9)) * 0.38 * (1 - k * 0.85);
      if (k < 1) {
        A0.rotation.x = A1.rotation.x = -2.9;   // ídolo en alto
        A0.rotation.z = -0.35; A1.rotation.z = 0.35;
        L[0].hip.rotation.x = -0.4; L[1].hip.rotation.x = -0.2;
        L[0].knee.rotation.x = 0.7; L[1].knee.rotation.x = 0.4;
        p.head.rotation.x = -0.25;
      } else {
        // pose de héroe: brazos en V, pecho fuera, sonrisota
        A0.rotation.x = A1.rotation.x = -2.3;
        A0.rotation.z = -0.7; A1.rotation.z = 0.7;
        L[0].hip.rotation.x = L[1].hip.rotation.x = 0;
        L[0].knee.rotation.x = L[1].knee.rotation.x = 0.05;
        p.head.rotation.x = -0.35;
        leanX = -0.1;
      }
      p.mouth.scale.set(1.5, 2.4, 1);
      for (const e of p.eyes) e.brow.rotation.z = -e.side * 0.2;
    }
  } else if (p.action === 'celebrate') {
    p.root.rotation.y = p.heading + p.actionT * 7;
    bobY = Math.abs(Math.sin(p.actionT * 9)) * 0.4;
    A[0].shoulder.rotation.x = -2.9; A[1].shoulder.rotation.x = -2.9; // ¡brazos arriba!
    A[0].shoulder.rotation.z = -0.4; A[1].shoulder.rotation.z = 0.4;
    L[0].hip.rotation.x = -0.3; L[1].hip.rotation.x = -0.3;
    L[0].knee.rotation.x = 0.5; L[1].knee.rotation.x = 0.5;
    p.mouth.scale.set(1.4, 2.2, 1);
    p.body.rotation.x = 0;
  } else if (!p.onGround) {
    p.body.rotation.x = 0;
    leanX = THREE.MathUtils.clamp(-p.vel.y * 0.02, -0.32, 0.4);
    if (p.flapAnim > 0) {
      // agarrado a las correas mientras Gavi aletea
      A[0].shoulder.rotation.x = -0.5; A[1].shoulder.rotation.x = -0.5;
      A[0].shoulder.rotation.z = 0.5; A[1].shoulder.rotation.z = -0.5;
      L[0].hip.rotation.x = 0.5; L[1].hip.rotation.x = 0.2;
      L[0].knee.rotation.x = 0.9; L[1].knee.rotation.x = 0.6;
    } else if (p.vel.y > 2) {
      // subiendo: brazos atrás, rodillas arriba
      A[0].shoulder.rotation.x = 0.9; A[1].shoulder.rotation.x = 0.9;
      L[0].hip.rotation.x = -0.7; L[1].hip.rotation.x = -0.4;
      L[0].knee.rotation.x = 1.2; L[1].knee.rotation.x = 0.9;
    } else {
      // cayendo: manoteo ligero
      A[0].shoulder.rotation.x = -1.6 + Math.sin(t * 9) * 0.25;
      A[1].shoulder.rotation.x = -1.6 + Math.cos(t * 9) * 0.25;
      L[0].hip.rotation.x = -0.3 + Math.sin(t * 7) * 0.15;
      L[1].hip.rotation.x = -0.1 - Math.sin(t * 7) * 0.15;
      L[0].knee.rotation.x = 0.7; L[1].knee.rotation.x = 0.9;
    }
  } else if (p.sleeping) {
    // sentado, cabeza caída, respiración
    bobY = -0.42;
    leanX = 0.2 + Math.sin(t * 1.3) * 0.025;
    L[0].hip.rotation.x = -1.5; L[1].hip.rotation.x = -1.5;
    L[0].knee.rotation.x = 1.2; L[1].knee.rotation.x = 1.2;
    A[0].shoulder.rotation.x = -0.15; A[1].shoulder.rotation.x = -0.15;
    A[0].shoulder.rotation.z = 0.35; A[1].shoulder.rotation.z = -0.35;
    p.head.rotation.x = 0.45;
    p.mouth.scale.set(1, Math.sin(t * 1.3) > 0.6 ? 2.4 : 1, 1); // ronquido suave
  } else if (hSpeed > 0.6) {
    // ---- ciclo de carrera bípedo ----
    p.walkPhase += dt * (5 + hSpeed * 1.5);
    const ph = p.walkPhase;
    const k = Math.min(1, hSpeed / PHYSICS.RUN_SPEED);
    L[0].hip.rotation.x = Math.sin(ph) * 0.95 * k;
    L[1].hip.rotation.x = Math.sin(ph + Math.PI) * 0.95 * k;
    L[0].knee.rotation.x = Math.max(0, Math.sin(ph + Math.PI * 0.75)) * 1.5 * k;
    L[1].knee.rotation.x = Math.max(0, Math.sin(ph - Math.PI * 0.25)) * 1.5 * k;
    A[0].shoulder.rotation.x = Math.sin(ph + Math.PI) * 0.8 * k;
    A[1].shoulder.rotation.x = Math.sin(ph) * 0.8 * k;
    A[0].shoulder.rotation.z = 0.18; A[1].shoulder.rotation.z = -0.18;
    leanX = 0.14 + k * 0.1;
    bobY = Math.abs(Math.sin(ph)) * 0.09 * k;
    rollZ = Math.sin(ph) * 0.045 * k;
    p.head.rotation.x = -0.1;
    p.mouth.scale.set(1, 1, 1);
  } else {
    // idle: respirar, asentar extremidades
    const settle = 1 - Math.min(1, 9 * dt);
    for (const l of L) { l.hip.rotation.x *= settle; l.knee.rotation.x *= settle; }
    for (const a of A) { a.shoulder.rotation.x *= settle; a.shoulder.rotation.z *= settle; }
    bobY = Math.sin(t * 2.1) * 0.03;
    p.chest.scale.x = 1 + Math.sin(t * 2.1) * 0.015;
    p.head.rotation.x = Math.sin(t * 0.6) * 0.06;
    p.ears[0].rotation.z = Math.sin(t * 0.7) > 0.96 ? 0.35 : 0;
    p.ears[1].rotation.z = Math.cos(t * 0.9) > 0.96 ? -0.35 : 0;
    p.mouth.scale.set(1, 1, 1);
    p.body.rotation.x = 0;
  }

  // zarpazo: preparación y cruce con la zarpa activa
  if (p.action === 'swipe') {
    const tt = p.actionT;
    const arm = p.swipeSide > 0 ? A[1] : A[0];
    const other = p.swipeSide > 0 ? A[0] : A[1];
    if (tt < 0.08) {
      const k = tt / 0.08;
      arm.shoulder.rotation.x = 0.9 * k;                 // preparación atrás
      p.body.rotation.y = -p.swipeSide * 0.35 * k;
    } else {
      const k = Math.min(1, (tt - 0.08) / 0.16);
      arm.shoulder.rotation.x = 0.9 - k * 3.4;           // gran barrido
      arm.shoulder.rotation.z = -p.swipeSide * k * 0.8;
      p.body.rotation.y = p.swipeSide * 0.5 * Math.sin(k * Math.PI);
      other.shoulder.rotation.x = k * 0.6;
    }
    leanX = 0.25;
    // cejas enfadadas
    for (const e of p.eyes) e.brow.rotation.z = e.side * 0.35;
  } else if (p.action === 'peck') {
    // tres picotazos rápidos: Gavi martillea mientras Nahu se echa atrás
    const jab = Math.abs(Math.sin(p.actionT * 21.5));
    p.gavi.rotation.x = 0.5 + jab * 0.8;
    p.gavi.position.z = -0.52 + jab * 0.78;
    p.gaviHead.rotation.x = jab * 0.5;
    leanX = -0.22;                               // Nahu le cede el escenario a Gavi
    p.body.rotation.y = Math.sin(p.actionT * 21.5) * 0.12;
    p.head.rotation.x = 0.2;
    for (const e of p.eyes) e.brow.rotation.z = e.side * 0.35;
  } else {
    p.gavi.rotation.x *= 1 - Math.min(1, 10 * dt);
    p.gavi.position.z += (-0.52 - p.gavi.position.z) * Math.min(1, 10 * dt);
    p.body.rotation.y *= 1 - Math.min(1, 12 * dt);
    for (const e of p.eyes) e.brow.rotation.z *= 1 - Math.min(1, 8 * dt);
  }

  // aplicar pose del cuerpo
  if (p.action !== 'pound') {
    p.body.rotation.x += (leanX - p.body.rotation.x) * Math.min(1, 10 * dt);
  }
  p.body.position.y = bobY;
  p.body.rotation.z += (rollZ - p.body.rotation.z) * Math.min(1, 10 * dt);

  // ondulación de la cola (más viva corriendo)
  const tailAmp = 0.3 + Math.min(0.3, hSpeed * 0.04);
  for (let i = 0; i < 4; i++) {
    p.tailSegs[i].rotation.y = Math.sin(t * 3.2 + i * 0.85) * tailAmp;
    p.tailSegs[i].rotation.x = 0.3 + Math.sin(t * 2.2 + i * 0.6) * 0.14;
  }

  // parpadeo de invulnerabilidad
  const blinkVis = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0;
  p.root.visible = !blinkVis;

  // sombra blob
  const blobY = G.world.colliders.groundAt(p.pos.x, p.pos.z, p.pos.y);
  p.blob.position.set(p.pos.x, blobY + 0.03, p.pos.z);
  const hgt = Math.max(0, p.pos.y - blobY);
  const s = THREE.MathUtils.clamp(1 - hgt * 0.06, 0.35, 1);
  p.blob.scale.setScalar(s);
  p.blob.material.opacity = 0.4 * s;
  p.blob.visible = !p.swimming;
}
