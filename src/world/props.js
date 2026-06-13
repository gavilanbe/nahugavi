import * as THREE from 'three';
import { WATER_Y } from '../config.js';
import { mulberry32, jitterGeo, dist2 } from '../core/utils.js';
import { makeGrassBladeTex } from './textures.js';

// Kit de props procedurales reutilizables entre niveles: árboles, palmeras,
// rocas y dispersión de vegetación (hierba instanciada, flores, luciérnagas
// ambientales). Todo determinista a través del rng del nivel.

export function createPropsKit(G, world, rng) {
  const heightAt = world.heightAt;
  const scene = G.scene;

  const leafMats = [
    new THREE.MeshLambertMaterial({ color: '#3e8a3a', flatShading: true }),
    new THREE.MeshLambertMaterial({ color: '#52a844', flatShading: true }),
    new THREE.MeshLambertMaterial({ color: '#2e7a4e', flatShading: true }),
  ];
  const trunkMat = new THREE.MeshLambertMaterial({ color: '#7a4a26', flatShading: true });
  const trunkMatD = new THREE.MeshLambertMaterial({ color: '#5e3618', flatShading: true });
  const stoneMat = new THREE.MeshLambertMaterial({ color: '#9a93a8', flatShading: true });
  const stoneMatD = new THREE.MeshLambertMaterial({ color: '#7a7390', flatShading: true });

  function addTree(x, z, scale = 1, seed = 1) {
    const y = heightAt(x, z);
    if (y < WATER_Y + 0.6) return false;
    const g = new THREE.Group();
    const h = (3.2 + (seed % 3) * 0.8) * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * scale, 0.45 * scale, h, 6), seed % 2 ? trunkMat : trunkMatD);
    trunk.position.y = h / 2;
    trunk.castShadow = true;
    g.add(trunk);
    const r0 = mulberry32(seed);
    const blobs = 2 + (seed % 2);
    for (let i = 0; i < blobs; i++) {
      const br = (1.5 + r0() * 0.9) * scale;
      const blob = new THREE.Mesh(
        jitterGeo(new THREE.IcosahedronGeometry(br, 0), 0.4 * scale, seed * 7 + i),
        leafMats[(seed + i) % 3]
      );
      blob.position.set((r0() - 0.5) * 1.6 * scale, h - 0.3 + i * br * 0.7, (r0() - 0.5) * 1.6 * scale);
      blob.castShadow = true;
      g.add(blob);
    }
    g.position.set(x, y - 0.2, z);
    scene.add(g);
    if (scale > 0.8) world.colliders.addCyl({ x, z, r: 0.55 * scale, topY: y + h });
    return true;
  }

  function addPalm(x, z, seed = 1) {
    const y = heightAt(x, z);
    const g = new THREE.Group();
    const h = 4.5;
    const lean = (seed % 2 ? 1 : -1) * 0.18;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, h, 5), trunkMat);
    trunk.position.y = h / 2; trunk.rotation.z = lean;
    trunk.castShadow = true;
    g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.8, 4), leafMats[i % 3]);
      const a = (i / 6) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 1.1 - lean * h, h - 0.1, Math.sin(a) * 1.1);
      leaf.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
      leaf.castShadow = true;
      g.add(leaf);
    }
    const coco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), trunkMatD);
    coco.position.set(-lean * h * 0.5, h - 0.45, 0.3);
    g.add(coco);
    g.position.set(x, y - 0.15, z);
    scene.add(g);
    world.colliders.addCyl({ x, z, r: 0.4 });
  }

  function addRock(x, z, s, seed) {
    const y = heightAt(x, z);
    const rock = new THREE.Mesh(jitterGeo(new THREE.DodecahedronGeometry(s, 0), s * 0.35, seed), seed % 2 ? stoneMat : stoneMatD);
    rock.position.set(x, y + s * 0.25, z);
    rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    rock.castShadow = true;
    scene.add(rock);
    if (s > 0.8) world.colliders.addCyl({ x, z, r: s * 0.8 });
  }

  return { leafMats, trunkMat, trunkMatD, stoneMat, stoneMatD, addTree, addPalm, addRock };
}

// Árboles y rocas dispersos evitando los puntos de interés del nivel.
export function scatterVegetation(G, world, kit, rng, cfg) {
  const heightAt = world.heightAt;
  const avoid = cfg.avoid;

  let placed = 0, tries = 0;
  while (placed < cfg.trees.count && tries < 400) {
    tries++;
    const a = rng() * Math.PI * 2, r = cfg.trees.rMin + rng() * cfg.trees.rSpan;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (avoid.some(([px, pz, pr]) => dist2(x, z, px, pz) < pr)) continue;
    const y = heightAt(x, z);
    if (y < WATER_Y + 0.7) continue;
    if (kit.addTree(x, z, 0.7 + rng() * 0.8, Math.floor(rng() * 1000))) placed++;
  }

  for (let i = 0; i < cfg.rocks.count; i++) {
    const a = rng() * Math.PI * 2, r = 10 + rng() * 45;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (avoid.some(([px, pz, pr]) => dist2(x, z, px, pz) < pr * 0.7)) continue;
    if (heightAt(x, z) < WATER_Y + 0.4) continue;
    kit.addRock(x, z, 0.5 + rng() * 1.1, i * 31 + 5);
  }

  // ---- hierba (instanciada: 1 draw call) + flores ----
  const bladeTex = makeGrassBladeTex();
  const cross = new THREE.BufferGeometry();
  const s = 0.7;
  const verts = new Float32Array([
    -s, 0, 0, s, 0, 0, s, s * 1.4, 0, -s, 0, 0, s, s * 1.4, 0, -s, s * 1.4, 0,
    0, 0, -s, 0, 0, s, 0, s * 1.4, s, 0, 0, -s, 0, s * 1.4, s, 0, s * 1.4, -s,
  ]);
  const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
  cross.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  cross.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  cross.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ map: bladeTex, alphaTest: 0.5, side: THREE.DoubleSide });
  const COUNT = cfg.grass.count;
  const inst = new THREE.InstancedMesh(cross, mat, COUNT);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  let n = 0, t2 = 0;
  while (n < COUNT && t2 < 2000) {
    t2++;
    const a = rng() * Math.PI * 2, r = 4 + rng() * 50;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const y = heightAt(x, z);
    if (y < WATER_Y + 0.8) continue;
    const sl = Math.abs(heightAt(x + 1, z) - y) + Math.abs(heightAt(x, z + 1) - y);
    if (sl > 1.4) continue;
    q.setFromAxisAngle(v3.set(0, 1, 0), rng() * Math.PI);
    const k = 0.6 + rng() * 0.9;
    m4.compose(pos.set(x, y - 0.05, z), q, sc.set(k, k, k));
    inst.setMatrixAt(n, m4);
    n++;
  }
  inst.count = n;
  inst.instanceMatrix.needsUpdate = true;
  G.scene.add(inst);

  const flowerGeo = new THREE.ConeGeometry(0.16, 0.3, 5);
  const fCols = ['#e85a9a', '#ffce4a', '#9a6ae8', '#ff8a5a'];
  const fMats = fCols.map((c) => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.15 }));
  for (let i = 0; i < cfg.flowers.count; i++) {
    const a = rng() * Math.PI * 2, r = 5 + rng() * 46;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const y = heightAt(x, z);
    if (y < WATER_Y + 0.8) continue;
    const fl = new THREE.Mesh(flowerGeo, fMats[i % 4]);
    fl.position.set(x, y + 0.22, z);
    fl.rotation.x = Math.PI;
    G.scene.add(fl);
  }
}

// Luciérnagas ambientales (puro ambiente, se desvanecen al llegar el día).
export function addAmbientFireflies(G, world, rng, cfg) {
  const heightAt = world.heightAt;
  const N = cfg.count;
  const pgeo = new THREE.BufferGeometry();
  const parr = new Float32Array(N * 3);
  const seeds = [];
  for (let i = 0; i < N; i++) {
    const a = rng() * Math.PI * 2, r = 6 + rng() * 48;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    parr[i * 3] = x; parr[i * 3 + 1] = heightAt(x, z) + 1 + rng() * 3; parr[i * 3 + 2] = z;
    seeds.push(rng() * 10);
  }
  pgeo.setAttribute('position', new THREE.BufferAttribute(parr, 3));
  const pmat = new THREE.PointsMaterial({
    color: '#ffe07a', size: 3.2, sizeAttenuation: false,
    transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  G.scene.add(new THREE.Points(pgeo, pmat));
  world.ambientFireflyMat = pmat;
  world.animated.push((dt, t) => {
    const p = pgeo.attributes.position;
    for (let i = 0; i < N; i++) {
      p.setY(i, p.getY(i) + Math.sin(t * 1.7 + seeds[i] * 7) * dt * 0.5);
      p.setX(i, p.getX(i) + Math.cos(t * 0.9 + seeds[i] * 13) * dt * 0.4);
    }
    p.needsUpdate = true;
    pmat.opacity = (Math.sin(t * 2) * 0.15 + 0.75) * (1 - (G.mood || 0));
  });
}
