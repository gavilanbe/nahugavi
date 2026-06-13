import * as THREE from 'three';
import { CAMERA, RENDER } from '../config.js';

// Cámara de tercera persona estilo N64: órbita con ratón, zoom con rueda,
// shake de impactos, modo cinemático (G.cinema) y órbita de título.

export class CameraRig {
  constructor(G) {
    this.G = G;
    this.camera = new THREE.PerspectiveCamera(RENDER.FOV, 1, RENDER.NEAR, RENDER.FAR);
    this.yaw = CAMERA.YAW0;
    this.pitch = CAMERA.PITCH0;
    this.dist = CAMERA.DIST0;
    this.target = new THREE.Vector3();
    this._v1 = new THREE.Vector3();
    this._v2 = new THREE.Vector3();

    window.addEventListener('mousemove', (e) => {
      if (G.input.mouseDown && G.state !== 'title') {
        this.yaw -= e.movementX * CAMERA.DRAG_X;
        this.pitch = THREE.MathUtils.clamp(this.pitch + e.movementY * CAMERA.DRAG_Y, CAMERA.PITCH_MIN, CAMERA.PITCH_MAX);
      }
    });
    window.addEventListener('wheel', (e) => {
      this.dist = THREE.MathUtils.clamp(this.dist + Math.sign(e.deltaY) * CAMERA.WHEEL_STEP, CAMERA.DIST_MIN, CAMERA.DIST_MAX);
    });
  }

  snapBehindPlayer() { this.yaw = CAMERA.YAW0; }

  applyShake(dt) {
    const G = this.G;
    if (G.shakeT > 0) {
      G.shakeT -= dt;
      const s = G.shakeT * 0.8;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
    }
  }

  update(dt) {
    const G = this.G;
    const cam = this.camera;
    const p = G.player;
    const heightAt = G.world.heightAt;

    if (G.cinema && G.state !== 'title') {
      // travelling frontal para el baile del ídolo
      G.cinema.t += dt;
      const d = 5.6 - Math.min(1.4, G.cinema.t * 0.45);
      const cx = p.pos.x + Math.sin(G.cinema.ang) * d;
      const cz = p.pos.z + Math.cos(G.cinema.ang) * d;
      let cy = p.pos.y + 2.0 - Math.min(0.5, G.cinema.t * 0.2);
      cy = Math.max(cy, heightAt(cx, cz) + 0.7);
      cam.position.lerp(this._v1.set(cx, cy, cz), Math.min(1, 4.5 * dt));
      this.target.lerp(this._v2.set(p.pos.x, p.pos.y + 1.5, p.pos.z), Math.min(1, 8 * dt));
      this.applyShake(dt);
      cam.lookAt(this.target);
      return;
    }

    if (G.state === 'title') {
      // órbita cinemática lenta alrededor del altar
      const a = G.time * 0.12;
      const r = 26;
      cam.position.set(Math.cos(a) * r, 9 + Math.sin(G.time * 0.3) * 2, -10 + Math.sin(a) * r);
      this.target.set(0, 2, -10);
      cam.lookAt(this.target);
      return;
    }

    const targetUp = p.diving ? 0.5 : 1.8; // baja la cámara al bucear
    this.target.lerp(this._v1.set(p.pos.x, p.pos.y + targetUp, p.pos.z), Math.min(1, 10 * dt));
    const cd = this.dist;
    const cx = this.target.x + Math.sin(this.yaw) * Math.cos(this.pitch) * cd;
    const cy = this.target.y + Math.sin(this.pitch) * cd;
    const cz = this.target.z + Math.cos(this.yaw) * Math.cos(this.pitch) * cd;
    // mantener la cámara sobre el terreno
    const minY = heightAt(cx, cz) + 0.6;
    cam.position.set(cx, Math.max(cy, minY), cz);
    this.applyShake(dt);
    cam.lookAt(this.target);
  }
}
