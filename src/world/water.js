import * as THREE from 'three';
import { WATER_Y } from '../config.js';
import { makeWaterTex } from './textures.js';

// Lámina de agua "infinita" con textura pixel desplazándose en diagonal.
// Devuelve el material para que Atmosphere pueda teñirlo con el mood.

export function buildWater(G, world) {
  const waterTex = makeWaterTex();
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 800),
    new THREE.MeshBasicMaterial({ map: waterTex, transparent: true, opacity: 0.82, side: THREE.DoubleSide })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_Y;
  G.scene.add(water);
  world.animated.push((dt) => {
    waterTex.offset.x += dt * 0.018;
    waterTex.offset.y += dt * 0.011;
  });
  return water.material;
}
