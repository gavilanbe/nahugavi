import * as THREE from 'three';
import { WATER_Y } from '../config.js';
import { smooth01 } from '../core/utils.js';

// Malla de terreno low-poly: muestrea level.heightAt sobre un plano
// subdividido y pinta cada cara según altura/pendiente con la paleta
// del nivel (flat shading + vertex colors = look N64 gratis).

export function buildTerrain(G, world, level, rng) {
  const { size, seg, palette } = level.terrain;
  const heightAt = world.heightAt;

  let geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  geo = geo.toNonIndexed();
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  }

  // color por cara
  const colors = new Float32Array(pos.count * 3);
  const cGrass = palette.grass.map((c) => new THREE.Color(c));
  const cDry = new THREE.Color(palette.dry);
  const cSand = new THREE.Color(palette.sand);
  const cDirt = new THREE.Color(palette.dirt);
  const cDeep = new THREE.Color(palette.deep);
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const tmp = new THREE.Color();
  for (let f = 0; f < pos.count; f += 3) {
    va.fromBufferAttribute(pos, f); vb.fromBufferAttribute(pos, f + 1); vc.fromBufferAttribute(pos, f + 2);
    const hAvg = (va.y + vb.y + vc.y) / 3;
    const slope = Math.max(va.y, vb.y, vc.y) - Math.min(va.y, vb.y, vc.y);
    if (hAvg < WATER_Y + 0.25) tmp.copy(cDeep).lerp(cSand, smooth01((hAvg - (WATER_Y - 3)) / 3));
    else if (hAvg < WATER_Y + 1.1) tmp.copy(cSand);
    else if (slope > 1.5) tmp.copy(cDirt);
    else if (hAvg > 6.5) tmp.copy(cDry);
    else tmp.copy(cGrass[f % 3 === 0 ? 0 : (f % 7 < 3 ? 1 : 2)]);
    const v = 0.92 + rng() * 0.14;
    tmp.r *= v; tmp.g *= v; tmp.b *= v;
    for (let k = 0; k < 3; k++) {
      colors[(f + k) * 3] = tmp.r; colors[(f + k) * 3 + 1] = tmp.g; colors[(f + k) * 3 + 2] = tmp.b;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  terrain.receiveShadow = true;
  G.scene.add(terrain);
  return terrain;
}
