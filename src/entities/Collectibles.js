import * as THREE from 'three';
import { makeBeam } from './common.js';

// Coleccionables: luciérnagas, orquídeas (misión), plumas y mangos (cura).
// Flotan/rotan en idle y se recogen por proximidad al jugador.

export class Collectibles {
  constructor(G, ents, data) {
    this.G = G;
    this.ents = ents;
    this.fireflies = [];
    this.orchids = [];
    this.feathers = [];
    this.mangos = [];

    for (const [x, y, z] of data.fireflies) this.addFirefly(x, y, z);
    for (const [x, y, z, id] of data.orchids) this.addOrchid(x, y, z, id);
    for (const [x, y, z] of data.feathers) this.addFeather(x, y, z);
    for (const [x, y, z] of data.mangos) this.addMango(x, y, z);

    this.feathersTotal = this.feathers.length;
    this.totalFireflies = 0; // lo fija Entities cuando conoce las cajas
  }

  addFirefly(x, y, z) {
    const mat = this.ents.mat;
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), mat.glow);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), mat.glowHalo);
    g.add(core, halo);
    g.position.set(x, y, z);
    this.G.scene.add(g);
    this.fireflies.push({ mesh: g, x, y, z, taken: false, phase: Math.random() * 7 });
  }

  makeOrchidMesh() {
    const mat = this.ents.mat;
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 4), mat.petal);
      petal.position.set(Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26);
      petal.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2);
      g.add(petal);
    }
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), mat.petalCore);
    g.add(core);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#b66ae8', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(halo);
    return g;
  }

  addOrchid(x, y, z, id) {
    const g = this.makeOrchidMesh();
    g.position.set(x, y, z);
    this.G.scene.add(g);
    const beam = makeBeam(this.G.scene, x, y, z);
    this.orchids.push({ mesh: g, beam, x, y, z, id, taken: false, phase: Math.random() * 7 });
  }

  addFeather(x, y, z) {
    const mat = this.ents.mat;
    const g = new THREE.Group();
    const quill = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.04), mat.featherR);
    quill.rotation.z = 0.4;
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.04), mat.featherG);
    tip.position.set(-0.18, 0.42, 0);
    tip.rotation.z = 0.4;
    g.add(quill, tip);
    g.position.set(x, y, z);
    this.G.scene.add(g);
    this.feathers.push({ mesh: g, x, y, z, taken: false, phase: Math.random() * 7 });
  }

  addMango(x, y, z) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), this.ents.mat.mango);
    m.scale.set(1, 0.75, 0.6);
    m.position.set(x, y, z);
    this.G.scene.add(m);
    this.mangos.push({ mesh: m, x, y, z, taken: false, phase: Math.random() * 7 });
  }

  update() {
    const G = this.G;
    const t = G.time;
    const counts = this.ents.counts;
    const p = G.player;
    const px = p.pos.x, py = p.pos.y, pz = p.pos.z;

    for (const f of this.fireflies) {
      if (f.taken) continue;
      f.mesh.position.y = f.y + Math.sin(t * 2.4 + f.phase) * 0.22;
      f.mesh.rotation.y = t * 2 + f.phase;
      const s = 0.85 + Math.sin(t * 6 + f.phase) * 0.2;
      f.mesh.children[1].scale.setScalar(s);
      if (Math.hypot(px - f.x, pz - f.z) < 1.3 && Math.abs(py + 0.8 - f.mesh.position.y) < 1.6) {
        f.taken = true;
        G.scene.remove(f.mesh);
        counts.fireflies++;
        G.ui.setFireflies(counts.fireflies, this.totalFireflies);
        G.audio.collectFirefly(t);
        G.fx.burst(f.x, f.mesh.position.y, f.z, '#ffe07a', 6, 2.5);
      }
    }

    for (const o of this.orchids) {
      if (o.taken) continue;
      o.mesh.position.y = o.y + Math.sin(t * 1.8 + o.phase) * 0.18;
      o.mesh.rotation.y = t * 1.2;
      o.beam.material.opacity = 0.2 + Math.sin(t * 2.2 + o.phase) * 0.07;
      if (Math.hypot(px - o.x, pz - o.z) < 2.0 && Math.abs(py + 0.8 - o.mesh.position.y) < 2.4) {
        o.taken = true;
        G.scene.remove(o.mesh);
        G.scene.remove(o.beam);
        counts.orchids++;
        G.ui.setOrchids(counts.orchids);
        G.audio.collectOrchid();
        G.fx.pop(o.x, o.mesh.position.y, o.z, '#d8a8ff', 1.4);
        G.fx.burst(o.x, o.mesh.position.y, o.z, '#d8a8ff', 16, 4);
        this.ents.quest.onOrchid(counts.orchids);
      }
    }

    for (const f of this.feathers) {
      if (f.taken) continue;
      f.mesh.position.y = f.y + Math.sin(t * 2 + f.phase) * 0.2;
      f.mesh.rotation.y = t * 2.6;
      if (Math.hypot(px - f.x, pz - f.z) < 1.3 && Math.abs(py + 0.8 - f.mesh.position.y) < 1.6) {
        f.taken = true;
        G.scene.remove(f.mesh);
        counts.feathers++;
        G.ui.setFeathers(counts.feathers, this.feathersTotal);
        G.audio.collectFeather();
        G.fx.pop(f.x, f.mesh.position.y, f.z, '#ff9a8a', 1);
        G.fx.burst(f.x, f.mesh.position.y, f.z, '#e84a5a', 10, 3);
      }
    }

    for (const m of this.mangos) {
      if (m.taken) continue;
      m.mesh.position.y = m.y + Math.sin(t * 2 + m.phase) * 0.15;
      m.mesh.rotation.y = t * 1.5;
      if (Math.hypot(px - m.x, pz - m.z) < 1.2 && Math.abs(py + 0.8 - m.mesh.position.y) < 1.5) {
        if (p.hp >= p.maxHp) continue; // se queda si tienes la vida llena
        m.taken = true;
        G.scene.remove(m.mesh);
        p.heal(1);
        G.audio.heal();
        G.fx.burst(m.x, m.mesh.position.y, m.z, '#ff9a3a', 8, 2.5);
      }
    }
  }
}
