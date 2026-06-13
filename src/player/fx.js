import * as THREE from 'three';

// FX visuales del jugador: arco de zarpazo, estelas de picotazo, onda de
// choque del bombazo y Zzz al dormir. Las geometrías y texturas se crean
// UNA vez y se comparten; solo el material (opacidad propia) es por-spawn.

function makeSlashTex() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 10, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.55, 'rgba(255,255,255,0)');
  g.addColorStop(0.75, 'rgba(255,240,200,0.9)');
  g.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function makeZTex() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#cfe8ff';
  // Z de píxeles
  ctx.fillRect(3, 3, 10, 2);
  ctx.fillRect(9, 5, 2, 2);
  ctx.fillRect(7, 7, 2, 2);
  ctx.fillRect(5, 9, 2, 2);
  ctx.fillRect(3, 11, 10, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

export class PlayerFx {
  constructor(G) {
    this.G = G;
    this.fx = [];
    this.slashTex = makeSlashTex();
    this.zTex = makeZTex();
    this.slashGeo = new THREE.RingGeometry(0.55, 1.35, 14, 1, 0, 2.6);
    this.streakGeo = new THREE.PlaneGeometry(2.0, 0.26);
    this.shockGeo = new THREE.RingGeometry(0.4, 0.9, 18);
  }

  slash(p) {
    const mat = new THREE.MeshBasicMaterial({
      map: this.slashTex, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(this.slashGeo, mat);
    m.position.set(
      p.pos.x + Math.sin(p.heading) * 0.9,
      p.pos.y + 1.0,
      p.pos.z + Math.cos(p.heading) * 0.9
    );
    m.rotation.set(Math.PI / 2 - 0.35, p.heading + (p.swipeSide > 0 ? 0 : Math.PI), 0, 'YXZ');
    this.G.scene.add(m);
    this.fx.push({ mesh: m, life: 0.18, t: 0, kind: 'slash', spin: p.swipeSide * -9 });
  }

  peckStreak(p, n = 1) {
    const mat = new THREE.MeshBasicMaterial({
      color: n === 2 ? '#ffffff' : '#bfe8ff', transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(this.streakGeo, mat);
    m.position.set(
      p.pos.x + Math.sin(p.heading) * 1.2,
      p.pos.y + 1.55 + (n - 2) * 0.18,
      p.pos.z + Math.cos(p.heading) * 1.2
    );
    // cada picotazo corta en un ángulo distinto: \ — /
    m.rotation.set(0, p.heading + Math.PI / 2, (n - 2) * 0.55, 'YXZ');
    this.G.scene.add(m);
    this.fx.push({ mesh: m, life: 0.16, t: 0, kind: 'streak' });
  }

  shockwave(p) {
    const mat = new THREE.MeshBasicMaterial({
      color: '#ffd890', transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(this.shockGeo, mat);
    m.position.set(p.pos.x, p.pos.y + 0.12, p.pos.z);
    m.rotation.x = -Math.PI / 2;
    this.G.scene.add(m);
    this.fx.push({ mesh: m, life: 0.34, t: 0, kind: 'shock' });
  }

  zzz(p) {
    const mat = new THREE.SpriteMaterial({ map: this.zTex, transparent: true, opacity: 0.95, depthWrite: false });
    const s = new THREE.Sprite(mat);
    s.scale.setScalar(0.4);
    s.position.set(
      p.pos.x + Math.sin(p.heading + 0.6) * 0.5,
      p.pos.y + 2.1,
      p.pos.z + Math.cos(p.heading + 0.6) * 0.5
    );
    this.G.scene.add(s);
    this.fx.push({ mesh: s, life: 1.6, t: 0, kind: 'zzz', drift: Math.random() * 2 });
  }

  update(dt) {
    const G = this.G;
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.t += dt;
      const k = f.t / f.life;
      if (k >= 1) {
        G.scene.remove(f.mesh);
        f.mesh.material.dispose();
        this.fx.splice(i, 1);
        continue;
      }
      if (f.kind === 'slash') {
        f.mesh.material.opacity = 0.95 * (1 - k);
        f.mesh.scale.setScalar(1 + k * 0.6);
        f.mesh.rotation.z += f.spin * dt;
      } else if (f.kind === 'streak') {
        f.mesh.material.opacity = 0.85 * (1 - k);
        f.mesh.scale.x = 1 + k * 1.2;
        f.mesh.scale.y = 1 - k * 0.7;
      } else if (f.kind === 'shock') {
        f.mesh.material.opacity = 0.9 * (1 - k);
        f.mesh.scale.setScalar(1 + k * 4.5);
      } else if (f.kind === 'zzz') {
        f.mesh.material.opacity = 0.95 * (1 - k * k);
        f.mesh.position.y += dt * 0.7;
        f.mesh.position.x += Math.sin(f.t * 3 + f.drift) * dt * 0.3;
        f.mesh.scale.setScalar(0.4 + k * 0.25);
      }
    }
  }
}
