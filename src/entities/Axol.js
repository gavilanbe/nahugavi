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
    const pink = new THREE.MeshLambertMaterial({ color: '#f2a0c8' });
    const pinkD = new THREE.MeshLambertMaterial({ color: '#e88ab8' });
    const magenta = new THREE.MeshLambertMaterial({ color: '#e84a9a', emissive: '#8a1a5a', emissiveIntensity: 0.3 });
    const dark = this.ents.mat.dark;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.65, 1.3), pink);
    body.position.y = 0.5;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.75), pinkD);
    head.position.set(0, 0.75, 0.75);
    g.add(head);
    // branquias (3 por lado, animadas)
    this.gills = [];
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 0; i < 3; i++) {
        const gill = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 4), magenta);
        gill.position.set(s * 0.5, 0.95 + i * 0.12 - 0.12, 0.75 - i * 0.18);
        gill.rotation.z = s * (1.1 + i * 0.25);
        g.add(gill);
        this.gills.push({ mesh: gill, base: gill.rotation.z, side: s, i });
      }
    }
    // ojos (parpadean) + sonrisa
    const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.05), dark); e1.position.set(-0.24, 0.85, 1.13);
    const e2 = e1.clone(); e2.position.x = 0.24;
    const smile = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.05), dark); smile.position.set(0, 0.62, 1.13);
    g.add(e1, e2, smile);
    this.eyes = [e1, e2];
    this.blinkT = 2;
    // aleta caudal
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.8), magenta);
    tail.position.set(0, 0.55, -0.9);
    g.add(tail);
    // patitas
    for (const [lx, lz] of [[-0.3, 0.4], [0.3, 0.4], [-0.3, -0.4], [0.3, -0.4]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.18), pinkD);
      leg.position.set(lx, 0.15, lz);
      g.add(leg);
    }
    // bastón de madera con orbe brillante
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.8, 5), new THREE.MeshLambertMaterial({ color: '#7a4a26' }));
    staff.position.set(0.7, 0.9, 0.3);
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), this.ents.mat.glow);
    orb.position.set(0.7, 1.9, 0.3);
    g.add(staff, orb);
    this.orb = orb;

    const baseY = G.world.heightAt(ax, az);
    g.position.set(ax, baseY, az);
    g.rotation.y = -0.6;
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
