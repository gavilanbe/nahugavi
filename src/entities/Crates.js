import * as THREE from 'three';
import { makeBeam } from './common.js';

// Cajas rompibles (zarpazo o picotazo-bomba). La dorada esconde un objeto
// de misión y lo delata una columna de luz.

export class Crates {
  constructor(G, ents, list) {
    this.G = G;
    this.ents = ents;
    this.crates = [];
    for (const [x, z, contents, golden] of list) this.addCrate(x, z, contents, golden);
  }

  addCrate(x, z, contents, golden = false) {
    const G = this.G;
    const y = G.world.heightAt(x, z);
    const s = 1.3;
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), golden ? this.ents.mat.crateGold : this.ents.mat.crate);
    m.position.set(x, y + s / 2, z);
    m.rotation.y = Math.random() * 0.6;
    m.castShadow = true;
    G.scene.add(m);
    const box = G.world.colliders.addBox({
      minX: x - s / 2 - 0.1, maxX: x + s / 2 + 0.1,
      minZ: z - s / 2 - 0.1, maxZ: z + s / 2 + 0.1,
      minY: y, maxY: y + s,
    });
    const beam = golden ? makeBeam(G.scene, x, y + 1, z, '#ffe07a', 0.26, 7) : null;
    this.crates.push({ mesh: m, x, y: y + s / 2, z, contents, box, broken: false, golden, beam });
  }

  update(hit, pound) {
    if (!hit && !pound) return;
    for (const c of this.crates) {
      if (c.broken) continue;
      let smash = false;
      if (hit && Math.hypot(hit.x - c.x, hit.z - c.z) < hit.r + 0.8 && Math.abs(hit.y - c.y) < 1.6) smash = true;
      if (pound && Math.hypot(pound.x - c.x, pound.z - c.z) < pound.r + 0.6) smash = true;
      if (smash) this.breakCrate(c);
    }
  }

  breakCrate(c) {
    const G = this.G;
    c.broken = true;
    G.scene.remove(c.mesh);
    if (c.beam) G.scene.remove(c.beam);
    G.world.colliders.removeBox(c.box);
    G.audio.crateBreak();
    G.audio.thump();
    G.hitStop(0.05);
    G.shake(0.12);
    G.fx.pop(c.x, c.y, c.z, '#ffe0b0', 1.1);
    G.fx.burst(c.x, c.y, c.z, '#9a6230', 12, 5);
    G.fx.burst(c.x, c.y, c.z, '#6e4222', 8, 6);
    G.fx.burst(c.x, c.y, c.z, '#c8965a', 6, 3.5);
    const cl = this.ents.collectibles;
    if (c.contents === 'orchid') {
      cl.addOrchid(c.x, c.y + 0.8, c.z, 'crate');
    } else if (c.contents === 'mango') {
      cl.addMango(c.x, c.y + 0.5, c.z);
    } else if (c.contents === 'fireflies') {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        cl.addFirefly(c.x + Math.cos(a) * 1.2, c.y + 0.8, c.z + Math.sin(a) * 1.2);
      }
    }
  }
}
