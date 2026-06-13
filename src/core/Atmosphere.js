import * as THREE from 'three';
import { DUSK, DAY, FOG, WATER_Y, RENDER } from '../config.js';
import { makeSky } from '../world/sky.js';

// Atmósfera: luces, niebla, cielo, transición de humor (atardecer → día)
// y ambiente subacuático. Lee G.mood / G.moodTarget.

const _fogCol = new THREE.Color();
const _waterFrom = new THREE.Color('#ffffff');
const _waterTo = new THREE.Color('#cfffea');

export class Atmosphere {
  constructor(G) {
    this.G = G;
    const scene = G.scene;

    scene.fog = new THREE.Fog(DUSK.fog.getHex(), FOG.NEAR, FOG.FAR);

    this.amb = new THREE.AmbientLight(DUSK.amb, 0.9);
    this.hemi = new THREE.HemisphereLight('#8a5a9a', '#3a2a4a', 0.5);
    this.sun = new THREE.DirectionalLight(DUSK.dir, 1.25);
    this.sun.position.set(45, 22, -35);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(RENDER.SHADOW_MAP, RENDER.SHADOW_MAP);
    this.sun.shadow.camera.left = -85; this.sun.shadow.camera.right = 85;
    this.sun.shadow.camera.top = 85; this.sun.shadow.camera.bottom = -85;
    this.sun.shadow.camera.far = 300;
    this.sun.shadow.bias = -0.002;
    scene.add(this.amb, this.hemi, this.sun, this.sun.target);

    this.sky = makeSky(scene);
    this.sky.apply(0);
    scene.fog.color.copy(DUSK.fog);

    this.underwater = false;
    this.uwEl = document.getElementById('underwater');
  }

  updateMood(dt) {
    const G = this.G;
    if (Math.abs(G.mood - G.moodTarget) <= 0.001) return;
    G.mood += Math.sign(G.moodTarget - G.mood) * Math.min(dt / 7, Math.abs(G.moodTarget - G.mood));
    this.sky.apply(G.mood);
    if (!this.underwater) {
      _fogCol.lerpColors(DUSK.fog, DAY.fog, G.mood);
      G.scene.fog.color.copy(_fogCol);
    }
    this.amb.color.lerpColors(DUSK.amb, DAY.amb, G.mood);
    this.amb.intensity = 0.9 + G.mood * 0.25;
    this.sun.color.lerpColors(DUSK.dir, DAY.dir, G.mood);
    this.sun.intensity = 1.25 + G.mood * 0.35;
    this.sun.position.set(45 - G.mood * 20, 22 + G.mood * 50, -35 + G.mood * 20);
    G.world.waterMat.color.lerpColors(_waterFrom, _waterTo, G.mood * 0.5);
  }

  updateUnderwater() {
    const G = this.G;
    const camUnder = G.camera.position.y < WATER_Y + 0.05;
    if (camUnder === this.underwater) return;
    this.underwater = camUnder;
    this.uwEl.style.opacity = camUnder ? 1 : 0;
    if (camUnder) {
      G.scene.fog.near = FOG.UW_NEAR;
      G.scene.fog.far = FOG.UW_FAR;
      G.scene.fog.color.set(FOG.UW_COLOR);
      this.amb.intensity = 1.7;            // luz filtrándose por el agua
      this.hemi.intensity = 0.9;
    } else {
      G.scene.fog.near = FOG.NEAR;
      G.scene.fog.far = FOG.FAR;
      _fogCol.lerpColors(DUSK.fog, DAY.fog, G.mood);
      G.scene.fog.color.copy(_fogCol);
      this.amb.intensity = 0.9 + G.mood * 0.25;
      this.hemi.intensity = 0.5;
    }
  }

  update(dt) {
    this.updateMood(dt);
    this.updateUnderwater();
  }
}
