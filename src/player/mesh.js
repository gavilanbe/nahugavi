import * as THREE from 'three';
import { makePeltTex } from '../world/textures.js';

// Construcción del modelo del dúo: Nahu (jaguar bípedo con mochila) y Gavi
// (gavilán posado en ella). Asigna en `p` todas las referencias que la
// animación necesita: legs, arms, head, eyes, wings, tailSegs, blob...

export function buildPlayerMesh(p, G) {
  const pelt = makePeltTex();
  const peltMat = new THREE.MeshLambertMaterial({ map: pelt });
  const peltSolid = new THREE.MeshLambertMaterial({ color: '#e8923a' });
  const peltDark = new THREE.MeshLambertMaterial({ color: '#b86a24' });
  const creamMat = new THREE.MeshLambertMaterial({ color: '#ffe8c8' });
  const darkMat = new THREE.MeshLambertMaterial({ color: '#3a2210' });
  const whiteMat = new THREE.MeshLambertMaterial({ color: '#fff8ee' });
  const packMat = new THREE.MeshLambertMaterial({ color: '#3a6ac8' });
  const packMatD = new THREE.MeshLambertMaterial({ color: '#2a4a9a' });
  const buckleMat = new THREE.MeshLambertMaterial({ color: '#ffce4a' });
  p.matsFlash = [peltMat, peltSolid, peltDark, creamMat];

  p.root = new THREE.Group();   // origen en los pies, mira a +Z
  p.body = new THREE.Group();   // pivote de squash/lean/bob (en la cadera)
  p.body.position.y = 0;
  p.root.add(p.body);

  // ----- piernas (digitígradas, dos segmentos) -----
  p.legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.26, 0.92, 0);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.5, 0.32), peltMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.47;
    hip.add(knee);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.24), peltSolid);
    shin.position.y = -0.2;
    knee.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 0.46), creamMat);
    foot.position.set(0, -0.41, 0.1);
    foot.castShadow = true;
    knee.add(foot);
    p.body.add(hip);
    p.legs.push({ hip, knee, foot });
  }

  // ----- pelvis + torso (forma de pera, muy Banjo) -----
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.45, 0.56), peltMat);
  hips.position.y = 1.02;
  hips.castShadow = true;
  p.body.add(hips);
  p.chest = new THREE.Group();
  p.chest.position.y = 1.25;
  p.body.add(p.chest);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.62, 0.58), peltMat);
  torso.position.y = 0.18;
  torso.castShadow = true;
  p.chest.add(torso);
  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.1), creamMat);
  belly.position.set(0, 0.12, 0.27);
  p.chest.add(belly);

  // ----- brazos -----
  p.arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.54, 0.42, 0.02);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.26), peltMat);
    upper.position.y = -0.26;
    upper.castShadow = true;
    shoulder.add(upper);
    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.28), creamMat);
    paw.position.y = -0.58;
    shoulder.add(paw);
    // garras — visibles solo durante el zarpazo
    const claws = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
      const cl = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 4), whiteMat);
      cl.position.set(i * 0.08, -0.72, 0.08);
      cl.rotation.x = Math.PI;
      claws.add(cl);
    }
    claws.visible = false;
    shoulder.add(claws);
    p.chest.add(shoulder);
    p.arms.push({ shoulder, claws });
  }

  // ----- cabeza -----
  p.head = new THREE.Group();
  p.head.position.set(0, 0.78, 0.08);
  p.chest.add(p.head);
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.66), peltMat);
  skull.castShadow = true;
  p.head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.3), creamMat);
  muzzle.position.set(0, -0.12, 0.42);
  p.head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.06), darkMat);
  nose.position.set(0, -0.04, 0.59);
  p.head.add(nose);
  p.mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.16), darkMat);
  p.mouth.position.set(0, -0.28, 0.44);
  p.head.add(p.mouth);
  // ojos expresivos: blancos + pupilas + cejas
  p.eyes = [];
  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.2, 0.05), whiteMat);
    white.position.set(side * 0.18, 0.08, 0.32);
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.03), darkMat);
    pupil.position.set(side * 0.16, 0.07, 0.36);
    p.head.add(white, pupil);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.07), peltDark);
    brow.position.set(side * 0.18, 0.24, 0.32);
    p.head.add(brow);
    p.eyes.push({ white, pupil, brow, side });
  }
  // pelusa de mejillas
  for (const side of [-1, 1]) {
    const fluff = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.3), creamMat);
    fluff.position.set(side * 0.4, -0.12, 0.18);
    p.head.add(fluff);
  }
  // orejas + interior
  p.ears = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.26, 0.36, -0.02);
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4), peltSolid);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 4), creamMat);
    inner.position.set(0, -0.02, 0.05);
    ear.add(outer, inner);
    p.head.add(ear);
    p.ears.push(ear);
  }

  // ----- cola (4 segmentos encadenados) -----
  p.tailSegs = [];
  let parent = p.body;
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Group();
    seg.position.set(0, i === 0 ? 0.95 : 0, -0.3);
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.17 - i * 0.025, 0.17 - i * 0.025, 0.36),
      i === 3 ? darkMat : (i % 2 ? peltSolid : peltMat)
    );
    m.position.z = -0.15;
    seg.add(m);
    parent.add(seg);
    p.tailSegs.push(seg);
    parent = seg;
  }

  // ----- mochila -----
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.72, 0.4), packMat);
  pack.position.set(0, 0.22, -0.52);
  pack.castShadow = true;
  p.chest.add(pack);
  const packFlap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.2, 0.44), packMatD);
  packFlap.position.set(0, 0.56, -0.52);
  p.chest.add(packFlap);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), buckleMat);
  buckle.position.set(0, 0.3, -0.3);
  p.chest.add(buckle);
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.62), packMatD);
    strap.position.set(side * 0.3, 0.5, -0.2);
    p.chest.add(strap);
  }

  // ================== GAVI ==================
  const gBrown = new THREE.MeshLambertMaterial({ color: '#7a5638' });
  const gLight = new THREE.MeshLambertMaterial({ color: '#c8a878' });
  const gCream = new THREE.MeshLambertMaterial({ color: '#efe0c0' });
  const gMask = new THREE.MeshLambertMaterial({ color: '#46301e' });
  const gBeak = new THREE.MeshLambertMaterial({ color: '#ffb13a' });
  const gBeakD = new THREE.MeshLambertMaterial({ color: '#c87a1a' });
  const gWhite = new THREE.MeshLambertMaterial({ color: '#fff8ee' });

  p.gavi = new THREE.Group();
  p.gavi.position.set(0, 0.55, -0.52);
  p.chest.add(p.gavi);

  const gBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.34), gBrown);
  gBody.position.y = 0.16;
  p.gavi.add(gBody);
  const gChest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.08), gCream);
  gChest.position.set(0, 0.12, 0.16);
  p.gavi.add(gChest);

  // cabeza con máscara fiera de halcón
  p.gaviHead = new THREE.Group();
  p.gaviHead.position.y = 0.5;
  p.gavi.add(p.gaviHead);
  const gSkull = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.3), gLight);
  p.gaviHead.add(gSkull);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.26), gMask);
  mask.position.set(0, 0.05, 0.04);
  p.gaviHead.add(mask);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.03), gWhite);
    eye.position.set(side * 0.12, 0.05, 0.17);
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), gMask);
    pupil.position.set(side * 0.11, 0.045, 0.19);
    // ceja inclinada y fiera
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.05), gMask);
    brow.position.set(side * 0.11, 0.13, 0.16);
    brow.rotation.z = side * -0.45;
    p.gaviHead.add(eye, pupil, brow);
  }
  // pico curvo: superior + gancho
  const beakUp = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), gBeak);
  beakUp.rotation.x = Math.PI / 2;
  beakUp.position.set(0, -0.02, 0.26);
  const hook = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 4), gBeakD);
  hook.rotation.x = Math.PI;
  hook.position.set(0, -0.07, 0.34);
  p.gaviHead.add(beakUp, hook);
  // cresta
  for (let i = 0; i < 2; i++) {
    const cr = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), gBrown);
    cr.position.set(0, 0.2, -0.06 - i * 0.07);
    cr.rotation.x = -0.5 - i * 0.3;
    p.gaviHead.add(cr);
  }

  // alas de dos segmentos con plumas-dedo
  p.wings = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.2, 0.28, -0.02);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.22), gBrown);
    inner.position.x = side * 0.17;
    shoulder.add(inner);
    const elbow = new THREE.Group();
    elbow.position.x = side * 0.34;
    shoulder.add(elbow);
    const outer = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.2), gLight);
    outer.position.x = side * 0.17;
    elbow.add(outer);
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.07), i === 1 ? gCream : gLight);
      f.position.set(side * (0.38 + i * 0.02), 0, -0.06 + i * 0.07);
      elbow.add(f);
    }
    p.gavi.add(shoulder);
    p.wings.push({ shoulder, elbow, side });
  }
  // cola en abanico
  p.gaviTail = new THREE.Group();
  p.gaviTail.position.set(0, 0.1, -0.18);
  for (let i = -1; i <= 1; i++) {
    const tf = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.26), i === 0 ? gLight : gBrown);
    tf.position.set(i * 0.08, 0, -0.12);
    tf.rotation.y = i * 0.3;
    p.gaviTail.add(tf);
  }
  p.gavi.add(p.gaviTail);
  // garras agarrando el borde de la mochila
  for (const side of [-1, 1]) {
    const talon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.12), gBeak);
    talon.position.set(side * 0.12, -0.06, 0.12);
    p.gavi.add(talon);
  }
  // alas plegadas en reposo
  for (const w of p.wings) {
    w.shoulder.rotation.z = w.side * 1.25;
    w.elbow.rotation.z = w.side * -2.2;
  }
  p.gaviPop = 0;

  // sombra blob
  p.blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 12),
    new THREE.MeshBasicMaterial({ color: '#10202a', transparent: true, opacity: 0.4, depthWrite: false })
  );
  p.blob.rotation.x = -Math.PI / 2;
  G.scene.add(p.blob);

  G.scene.add(p.root);
}
