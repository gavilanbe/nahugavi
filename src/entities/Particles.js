import * as THREE from 'three';
import { WATER_Y } from '../config.js';

// Sistema de partículas con POOL: todas las mallas y materiales se crean
// una sola vez al arrancar. Emitir/matar una partícula es solo toggle de
// visibilidad — cero allocs, cero add/remove de escena, cero GC por frame.

const BOX_POOL = 150;
const SPHERE_POOL = 12;

export class Particles {
  constructor(G) {
    this.G = G;
    this.active = [];
    this.boxFree = [];
    this.sphereFree = [];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const sphereGeo = new THREE.SphereGeometry(1, 8, 6);
    const fill = (geo, list, n) => {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true }));
        m.visible = false;
        G.scene.add(m);
        list.push(m);
      }
    };
    fill(boxGeo, this.boxFree, BOX_POOL);
    fill(sphereGeo, this.sphereFree, SPHERE_POOL);
  }

  _spawn(o) {
    const free = o.sphere ? this.sphereFree : this.boxFree;
    const mesh = free.pop();
    if (!mesh) return; // pool agotado: la partícula menos importante no nace
    mesh.visible = true;
    mesh.position.set(o.x, o.y, o.z);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.setScalar(o.size);
    const mat = mesh.material;
    mat.color.set(o.color);
    mat.opacity = o.opacity ?? 1;
    mat.blending = o.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    mat.depthWrite = !o.additive;
    this.active.push({
      mesh, sphere: !!o.sphere, size: o.size,
      vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0,
      life: o.life, grav: o.grav || 0,
      grow: o.grow || 0, fade: !!o.fade,
    });
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        (p.sphere ? this.sphereFree : this.boxFree).push(p.mesh);
        this.active.splice(i, 1);
        continue;
      }
      p.vy -= p.grav * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 7;
      p.mesh.rotation.y += dt * 5;
      if (p.grow) {
        p.mesh.scale.addScalar(p.grow * dt);
        if (p.fade) p.mesh.material.opacity = Math.max(0, p.life * 5);
      } else {
        p.mesh.scale.setScalar(p.size * Math.min(1, p.life * 3));
      }
    }
  }

  // ---------- emisores ----------
  burst(x, y, z, color, n = 10, speed = 4) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI - Math.PI / 2;
      this._spawn({
        x, y, z, color, size: 0.14,
        vx: Math.cos(a) * Math.cos(e) * speed * (0.4 + Math.random() * 0.6),
        vy: Math.abs(Math.sin(e)) * speed * 0.9 + 1.5,
        vz: Math.sin(a) * Math.cos(e) * speed * (0.4 + Math.random() * 0.6),
        life: 0.6 + Math.random() * 0.5,
        grav: 9,
      });
    }
  }

  dustRing(x, y, z, scale = 1) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      this._spawn({
        x: x + Math.cos(a) * 0.5, y: y + 0.15, z: z + Math.sin(a) * 0.5,
        color: '#c8b088', size: 0.18, opacity: 0.8,
        vx: Math.cos(a) * 6 * scale, vy: 1.2, vz: Math.sin(a) * 6 * scale,
        life: 0.4, grav: 4,
      });
    }
  }

  stepPuff(x, y, z) {
    this._spawn({
      x: x + (Math.random() - 0.5) * 0.4, y: y + 0.1, z: z + (Math.random() - 0.5) * 0.4,
      color: '#cbb592', size: 0.14, opacity: 0.55,
      vx: (Math.random() - 0.5) * 1.2, vy: 1.1, vz: (Math.random() - 0.5) * 1.2,
      life: 0.32, grav: 1.5,
    });
  }

  // destello de impacto que se expande
  pop(x, y, z, color = '#fff2c8', size = 1) {
    this._spawn({
      x, y, z, color, sphere: true, additive: true,
      size: 0.3 * size, opacity: 0.85,
      life: 0.18, grow: 2.7 * size * size, fade: true,
    });
  }

  // estela en superficie durante el crol
  wake(x, z) {
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      this._spawn({
        x: x + (Math.random() - 0.5) * 0.9, y: WATER_Y + 0.06, z: z + (Math.random() - 0.5) * 0.9,
        color: '#aef0e8', size: 0.11, opacity: 0.7,
        vx: Math.cos(a) * 1.6, vy: 0.6, vz: Math.sin(a) * 1.6,
        life: 0.4, grav: 3,
      });
    }
  }

  // burbujas ascendentes buceando
  bubbles(x, y, z, n = 3) {
    for (let i = 0; i < n; i++) {
      this._spawn({
        x: x + (Math.random() - 0.5) * 0.5, y: y + (Math.random() - 0.5) * 0.3, z: z + (Math.random() - 0.5) * 0.5,
        color: '#bfe8ff', size: 0.11, opacity: 0.75,
        vx: (Math.random() - 0.5) * 0.8, vy: 1.6 + Math.random() * 1.2, vz: (Math.random() - 0.5) * 0.8,
        life: 0.8 + Math.random() * 0.4, grav: -2.5,
      });
    }
  }

  splash(x, z) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      this._spawn({
        x, y: WATER_Y + 0.1, z,
        color: '#7ee0d8', size: 0.16, opacity: 0.9,
        vx: Math.cos(a) * 3, vy: 4 + Math.random() * 3, vz: Math.sin(a) * 3,
        life: 0.5, grav: 14,
      });
    }
  }
}
