import * as THREE from 'three';

// Tata Axol, el chamán ajolote. NPC con idle animado (branquias, parpadeo,
// bastón) que muestra "¡" cuando la quest tiene novedades y dialoga con E.

export class Axol {
  constructor(G, ents, pos) {
    this.G = G;
    this.ents = ents;
    this._hintShown = false;
    this.build(pos.x, pos.z);
  }

  build(ax, az) {
    const G = this.G;
    // paleta del ajolote chamán
    const skin   = new THREE.MeshLambertMaterial({ color: '#f4a6cb' });
    const skinD  = new THREE.MeshLambertMaterial({ color: '#e98cb6' });
    const belly  = new THREE.MeshLambertMaterial({ color: '#ffd9ea' });
    const frill  = new THREE.MeshLambertMaterial({ color: '#ff6fb0', emissive: '#a01f63', emissiveIntensity: 0.35 });
    const finMat = new THREE.MeshLambertMaterial({ color: '#ff8cbe', transparent: true, opacity: 0.9 });
    const cheek  = new THREE.MeshLambertMaterial({ color: '#ff97c2' });
    const white  = new THREE.MeshLambertMaterial({ color: '#fff6fb' });
    const straw  = new THREE.MeshLambertMaterial({ color: '#c9a45a' });
    const strawD = new THREE.MeshLambertMaterial({ color: '#9f7a38' });
    const jade   = new THREE.MeshLambertMaterial({ color: '#37b89a', emissive: '#125c4a', emissiveIntensity: 0.3 });
    const wood   = new THREE.MeshLambertMaterial({ color: '#7a4a26' });
    const dark   = this.ents.mat.dark;
    const g = new THREE.Group();

    // ----- cuerpo rechoncho con barriga clara y lomo -----
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.6, 1.18), skin);
    body.position.y = 0.46; body.castShadow = true; g.add(body);
    const hump = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.34, 0.92), skinD);
    hump.position.set(0, 0.74, -0.06); hump.castShadow = true; g.add(hump);
    const tummy = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.4, 0.12), belly);
    tummy.position.set(0, 0.4, 0.58); g.add(tummy);

    // ----- cabeza ancha y simpática -----
    const head = new THREE.Group();
    head.position.set(0, 0.92, 0.58);
    g.add(head);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.64, 0.7), skin);
    skull.castShadow = true; head.add(skull);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.18, 0.58), skinD);
    crown.position.set(0, 0.38, -0.02); head.add(crown);

    // ojos grandes (el parpadeo escala el grupo en Y)
    this.eyes = [];
    for (const s of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(s * 0.28, 0.07, 0.34);
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.25, 0.06), white);
      const pup = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.04), dark); pup.position.set(0, -0.02, 0.04);
      const shine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), white); shine.position.set(s * 0.05, 0.06, 0.07);
      eye.add(w, pup, shine); head.add(eye); this.eyes.push(eye);
    }
    // mejillas sonrojadas
    for (const s of [-1, 1]) {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.1, 0.05), cheek);
      ch.position.set(s * 0.36, -0.12, 0.31); head.add(ch);
    }
    // sonrisa ancha (boca + comisuras hacia arriba) y fosas nasales
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.05), dark);
    mouth.position.set(0, -0.2, 0.35); head.add(mouth);
    for (const s of [-1, 1]) {
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.05), dark);
      up.position.set(s * 0.2, -0.16, 0.35); up.rotation.z = s * -0.7; head.add(up);
      const nostril = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), skinD);
      nostril.position.set(s * 0.08, -0.05, 0.37); head.add(nostril);
    }

    // ----- branquias frondosas (3 por lado, animadas) -----
    this.gills = [];
    const makeFrond = (s) => {
      const fr = new THREE.Group();
      const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), frill);
      stalk.position.set(s * 0.2, 0, 0); fr.add(stalk);
      for (let p = 0; p < 3; p++) {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.155 - p * 0.02, 0), frill);
        puff.position.set(s * (0.32 + p * 0.07), p === 1 ? 0.07 : -0.02, (p - 1) * 0.06);
        fr.add(puff);
      }
      return fr;
    };
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const fr = makeFrond(s);
        fr.position.set(s * 0.48, 0.12 + i * 0.05, 0.06 - i * 0.24);
        const base = s * (0.5 + i * 0.26);
        fr.rotation.z = base;
        head.add(fr);
        this.gills.push({ mesh: fr, base, side: s, i });
      }
    }
    this.blinkT = 2;

    // ----- diadema de chamán: banda + gema de jade + plumas -----
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.13, 0.74), straw);
    band.position.set(0, 0.24, 0); head.add(band);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), jade);
    gem.position.set(0, 0.26, 0.37); head.add(gem);
    for (const [s, mat] of [[-1, frill], [0, straw], [1, jade]]) {
      const fe = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.46, 4), mat);
      fe.position.set(s * 0.16, 0.5, -0.22); fe.rotation.set(-0.7, 0, s * 0.25); head.add(fe);
    }

    // ----- collar de cuentas (oro + jade) -----
    for (let i = -2; i <= 2; i++) {
      const beadMat = (i % 2 === 0) ? this.ents.mat.gold : jade;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5), beadMat);
      bead.position.set(i * 0.13, 0.66 - Math.abs(i) * 0.03, 0.56); g.add(bead);
    }

    // ----- aleta caudal con doble pala (translúcida) -----
    const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.66), finMat);
    tail1.position.set(0, 0.58, -0.82); g.add(tail1);
    const tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.46), finMat);
    tail2.position.set(0, 0.52, -1.15); g.add(tail2);

    // ----- patitas con piececitos -----
    for (const [lx, lz] of [[-0.32, 0.42], [0.32, 0.42], [-0.32, -0.42], [0.32, -0.42]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.22), skinD);
      leg.position.set(lx, 0.16, lz); g.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.3), belly);
      foot.position.set(lx, 0.05, lz + 0.05); g.add(foot);
    }

    // ----- bastón con grip de cuero, pluma colgante y orbe brillante -----
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.85, 6), wood);
    staff.position.set(0.8, 0.92, 0.34); g.add(staff);
    for (let i = 0; i < 3; i++) {
      const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 6), strawD);
      wrap.position.set(0.8, 0.78 + i * 0.11, 0.34); g.add(wrap);
    }
    const hang = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 4), frill);
    hang.position.set(0.66, 1.5, 0.34); hang.rotation.z = 0.5; g.add(hang);
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), this.ents.mat.glow);
    orb.position.set(0.8, 1.96, 0.34); g.add(orb);
    this.orb = orb;

    const baseY = G.world.heightAt(ax, az);
    g.position.set(ax, baseY, az);
    g.rotation.y = -0.5;
    G.scene.add(g);

    // signo de exclamación
    const exc = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), this.ents.mat.gold);
    bar.position.y = 0.35;
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), this.ents.mat.gold);
    exc.add(bar, dot);
    exc.position.set(ax, baseY + 2.4, az);
    G.scene.add(exc);

    this.mesh = g;
    this.exc = exc;
    this.x = ax;
    this.z = az;
    this.baseY = baseY;
  }

  update(dt) {
    const G = this.G;
    const t = G.time;
    const quest = this.ents.quest;
    const p = G.player;

    this.mesh.position.y = this.baseY + Math.sin(t * 1.6) * 0.06;
    this.orb.rotation.y = t * 2;
    this.orb.scale.setScalar(1 + Math.sin(t * 3.2) * 0.18);
    // las branquias ondulan como algas
    for (const gl of this.gills) {
      gl.mesh.rotation.z = gl.base + Math.sin(t * 2.1 + gl.i * 0.8) * 0.16 * gl.side;
    }
    // parpadeo
    this.blinkT -= dt;
    if (this.blinkT <= 0) this.blinkT = 2 + Math.random() * 2.5;
    const blinkOn = this.blinkT < 0.13;
    for (const e of this.eyes) e.scale.y = blinkOn ? 0.15 : 1;

    this.exc.visible = quest.axolHasNews();
    this.exc.position.y = this.baseY + 2.5 + Math.sin(t * 3) * 0.12;
    this.exc.rotation.y = t * 1.5;

    const near = Math.hypot(p.pos.x - this.x, p.pos.z - this.z) < 3.2;
    if (near && !G.ui.dialogActive && G.state === 'play') {
      G.ui.showHint(quest.talkHint);
      this._hintShown = true;
      if (G.input.pressed.has('interact')) quest.talkToAxol();
    } else if (this._hintShown) {
      this._hintShown = false;
      G.ui.hideHint();
    }
    // mirar al jugador cuando está cerca
    if (near) {
      const ta = Math.atan2(p.pos.x - this.x, p.pos.z - this.z);
      this.mesh.rotation.y += (ta - this.mesh.rotation.y) * Math.min(1, 5 * dt);
    }
  }
}
