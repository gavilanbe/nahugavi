import * as THREE from 'three';

// Sombritas: los esbirros de Zonza. Deambulan cerca de casa y persiguen al
// jugador si se acerca; mueren de un zarpazo o picotazo-bomba.

export class Sombras {
  constructor(G, ents, list) {
    this.G = G;
    this.ents = ents;
    this.sombras = [];
    for (const [x, z] of list) this.addSombra(x, z);
  }

  addSombra(x, z) {
    const G = this.G;
    const mat = this.ents.mat;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 8, 6), mat.sombra);
    body.scale.y = 0.82;
    const eyeGeo = new THREE.BoxGeometry(0.14, 0.2, 0.06);
    const e1 = new THREE.Mesh(eyeGeo, mat.white); e1.position.set(-0.2, 0.12, 0.52);
    const e2 = new THREE.Mesh(eyeGeo, mat.white); e2.position.set(0.2, 0.12, 0.52);
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.04), mat.dark); p1.position.set(-0.2, 0.1, 0.56);
    const p2 = p1.clone(); p2.position.x = 0.2;
    // cuernecitos
    const h1 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), mat.sombra); h1.position.set(-0.25, 0.6, 0);
    const h2 = h1.clone(); h2.position.x = 0.25;
    // cejas enfadadas (solo visibles al perseguir)
    const browGeo = new THREE.BoxGeometry(0.22, 0.05, 0.05);
    const b1 = new THREE.Mesh(browGeo, mat.dark); b1.position.set(-0.2, 0.28, 0.54); b1.rotation.z = -0.5;
    const b2 = new THREE.Mesh(browGeo, mat.dark); b2.position.set(0.2, 0.28, 0.54); b2.rotation.z = 0.5;
    b1.visible = b2.visible = false;
    g.add(body, e1, e2, p1, p2, h1, h2, b1, b2);
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.55, 10),
      new THREE.MeshBasicMaterial({ color: '#10202a', transparent: true, opacity: 0.35, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    G.scene.add(blob);
    g.position.set(x, G.world.heightAt(x, z) + 0.7, z);
    G.scene.add(g);
    this.sombras.push({ mesh: g, blob, brows: [b1, b2], home: { x, z }, x, z, dead: false, phase: Math.random() * 7, wanderT: 0, wx: x, wz: z });
  }

  update(dt) {
    const G = this.G;
    const t = G.time;
    const heightAt = G.world.heightAt;
    const p = G.player;
    const px = p.pos.x, py = p.pos.y, pz = p.pos.z;
    const hit = p.attackHit;
    const pound = p.poundLanded;

    for (const s of this.sombras) {
      if (s.dead) continue;
      const sx = s.x, sz = s.z;
      const sy = s.mesh.position.y;
      // ¿golpeada?
      let killed = false;
      if (hit && Math.hypot(hit.x - sx, hit.z - sz) < hit.r + 0.6 && Math.abs(hit.y - sy) < 1.6) killed = true;
      if (pound && Math.hypot(pound.x - sx, pound.z - sz) < pound.r + 0.5) killed = true;
      if (killed) {
        s.dead = true;
        G.scene.remove(s.mesh);
        G.scene.remove(s.blob);
        G.audio.thump();
        G.audio.poof();
        G.hitStop(0.07);
        G.shake(0.18);
        G.fx.pop(sx, sy, sz, '#cfb8ff', 1.3);
        G.fx.burst(sx, sy, sz, '#6a4a9a', 16, 5);
        G.fx.burst(sx, sy, sz, '#2a1a4a', 10, 3.5);
        continue;
      }
      // IA: perseguir si está cerca, deambular si no
      const dp = Math.hypot(px - sx, pz - sz);
      const vertNear = Math.abs(py - (sy - 0.7)) < 2.5;
      let tx, tz, sp;
      const chasing = dp < 8 && vertNear && !p.frozen && p.action !== 'celebrate' && p.action !== 'jiggy';
      s.brows[0].visible = s.brows[1].visible = chasing;
      if (chasing) {
        tx = px; tz = pz; sp = 3.1;
      } else {
        s.wanderT -= dt;
        if (s.wanderT <= 0) {
          s.wanderT = 2 + Math.random() * 2;
          const a = Math.random() * Math.PI * 2;
          s.wx = s.home.x + Math.cos(a) * 3.5;
          s.wz = s.home.z + Math.sin(a) * 3.5;
        }
        tx = s.wx; tz = s.wz; sp = 1.1;
      }
      const dx = tx - sx, dz = tz - sz;
      const d = Math.hypot(dx, dz);
      if (d > 0.3) {
        s.x += (dx / d) * sp * dt;
        s.z += (dz / d) * sp * dt;
      }
      const gy = heightAt(s.x, s.z);
      s.mesh.position.set(s.x, gy + 0.7 + Math.sin(t * 3 + s.phase) * 0.12, s.z);
      s.mesh.rotation.y = Math.atan2(dx, dz);
      s.mesh.scale.y = 1 + Math.sin(t * 5 + s.phase) * 0.06;
      s.blob.position.set(s.x, gy + 0.04, s.z);
      // daño por contacto
      if (dp < 1.25 && vertNear) p.damage(1, s.x, s.z);
    }
  }
}
