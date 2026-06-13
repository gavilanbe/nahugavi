import * as THREE from 'three';
import { RENDER } from '../config.js';

// Renderizado retro: resolución interna fija (PIXEL_H de alto) estirada al
// viewport con image-rendering:pixelated. El ancho sigue el aspect ratio.

export class Renderer {
  constructor(G, canvas) {
    this.G = G;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.BasicShadowMap;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.gl.setSize(Math.round(RENDER.PIXEL_H * aspect), RENDER.PIXEL_H, false);
    this.G.camera.aspect = aspect;
    this.G.camera.updateProjectionMatrix();
  }

  render() {
    this.gl.render(this.G.scene, this.G.camera);
  }
}
