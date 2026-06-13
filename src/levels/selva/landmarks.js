import * as THREE from 'three';
import { jitterGeo } from '../../core/utils.js';
import { heightAt } from './heightmap.js';

// Landmarks de la Selva Susurrante: Árbol Abuelo (escalada por ramas),
// Laguna Espejo (pilar + nenúfares), Tronco Hueco, Altar y saliente del
// Mirador. Registran sus POI y colliders en `world` para los spawns.

export function buildLandmarks(G, world, kit, rng) {
  const scene = G.scene;
  const { leafMats, trunkMat, trunkMatD, stoneMat, stoneMatD } = kit;

  // ---------- ÁRBOL ABUELO (escalada de rama en rama) ----------
  const AB = { x: 26, z: 30 };
  AB.y = heightAt(AB.x, AB.z);
  {
    const g = new THREE.Group();
    const H = 20;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.6, H, 8), trunkMatD);
    trunk.position.y = H / 2;
    trunk.castShadow = true;
    g.add(trunk);
    // raíces
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const root = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 4), trunkMatD);
      root.position.set(Math.cos(a) * 2.4, 0.6, Math.sin(a) * 2.4);
      root.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
      g.add(root);
    }
    // copa
    for (let i = 0; i < 6; i++) {
      const br = 3.2 + rng() * 1.6;
      const blob = new THREE.Mesh(jitterGeo(new THREE.IcosahedronGeometry(br, 0), 0.9, 500 + i), leafMats[i % 3]);
      const a = (i / 6) * Math.PI * 2;
      blob.position.set(Math.cos(a) * 2.8, H + 0.5 + (i % 2) * 1.6, Math.sin(a) * 2.8);
      blob.castShadow = true;
      g.add(blob);
    }
    // plataforma invisible sobre el follaje
    world.colliders.addPad({ x: AB.x, z: AB.z, r: 3.4, y: AB.y + H + 1.2 });
    // ramas de escalada: alineadas a ejes, en espiral ascendente
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0], [0, 1], [-1, 0]];
    world.branches = [];
    for (let i = 0; i < 7; i++) {
      const by = 2.6 + i * 2.45;
      const [dx, dz] = dirs[i];
      const len = 4.6, w = 2.0, th = 0.5;
      const bx = AB.x + dx * (2.0 + len / 2), bz = AB.z + dz * (2.0 + len / 2);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(dx !== 0 ? len : w, th, dz !== 0 ? len : w), trunkMat);
      mesh.position.set(bx, AB.y + by, bz);
      mesh.castShadow = true;
      scene.add(mesh);
      // penacho de hojas en la punta
      const tuft = new THREE.Mesh(jitterGeo(new THREE.IcosahedronGeometry(1.0, 0), 0.3, 600 + i), leafMats[i % 3]);
      tuft.position.set(AB.x + dx * (2.0 + len), AB.y + by + 0.6, AB.z + dz * (2.0 + len));
      scene.add(tuft);
      world.colliders.addBox({
        minX: bx - (dx !== 0 ? len : w) / 2, maxX: bx + (dx !== 0 ? len : w) / 2,
        minZ: bz - (dz !== 0 ? len : w) / 2, maxZ: bz + (dz !== 0 ? len : w) / 2,
        minY: AB.y + by - th / 2, maxY: AB.y + by + th / 2,
      });
      world.branches.push({ x: AB.x + dx * 4.2, z: AB.z + dz * 4.2, y: AB.y + by + th / 2 });
    }
    g.position.set(AB.x, AB.y - 0.3, AB.z);
    scene.add(g);
    world.colliders.addCyl({ x: AB.x, z: AB.z, r: 2.3, topY: AB.y + H + 0.6 });
    world.poi.arbolAbuelo = { x: AB.x, z: AB.z, topY: AB.y + H + 1.2 };
  }

  // ---------- LAGUNA ESPEJO: pilar de piedra + nenúfares ----------
  const LAG = { x: -30, z: 22 };
  {
    const pillarTop = 3.6;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.4, 10, 7), stoneMat);
    pillar.position.set(LAG.x, pillarTop - 5, LAG.z);
    pillar.castShadow = true;
    scene.add(pillar);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.9, 0.5, 7), stoneMatD);
    cap.position.set(LAG.x, pillarTop - 0.25, LAG.z);
    scene.add(cap);
    world.colliders.addCyl({ x: LAG.x, z: LAG.z, r: 2.1, topY: pillarTop - 0.3 });
    world.colliders.addPad({ x: LAG.x, z: LAG.z, r: 2.2, y: pillarTop });
    world.poi.pillar = { x: LAG.x, z: LAG.z, topY: pillarTop };

    const padMat = new THREE.MeshLambertMaterial({ color: '#4fae62', flatShading: true });
    const padMatD = new THREE.MeshLambertMaterial({ color: '#3e9252', flatShading: true });
    const pads = [
      [-21.5, 16.5, 0.7], [-24.5, 19, 1.5], [-27.5, 22, 2.3], [-30.3, 25, 3.0],
    ];
    world.lilyPads = [];
    pads.forEach(([px, pz, py], i) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.7, 0.35, 7), i % 2 ? padMat : padMatD);
      pad.position.set(px, py, pz);
      pad.castShadow = true;
      scene.add(pad);
      const padCol = world.colliders.addPad({ x: px, z: pz, r: 2.1, y: py + 0.18, baseY: py + 0.18, mesh: pad, phase: i * 1.4 });
      world.lilyPads.push(padCol);
    });
    // balanceo suave
    world.animated.push((dt, t) => {
      for (const p of world.lilyPads) {
        p.y = p.baseY + Math.sin(t * 1.1 + p.phase) * 0.12;
        p.mesh.position.y = p.y - 0.18;
      }
    });
  }

  // ---------- TRONCO HUECO ----------
  const LOG = { x: -18, z: -28 };
  {
    LOG.y = heightAt(LOG.x, LOG.z);
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 8.5, 9, 1, true),
      new THREE.MeshLambertMaterial({ color: '#6e4222', flatShading: true, side: THREE.DoubleSide })
    );
    tube.rotation.z = Math.PI / 2;
    tube.position.set(LOG.x, LOG.y + 1.5, LOG.z);
    tube.castShadow = true;
    scene.add(tube);
    // musgo encima
    const moss = new THREE.Mesh(jitterGeo(new THREE.IcosahedronGeometry(1.5, 0), 0.5, 777), leafMats[1]);
    moss.position.set(LOG.x + 1.5, LOG.y + 3.6, LOG.z);
    moss.scale.y = 0.5;
    scene.add(moss);
    // lomo del tronco pisable
    world.colliders.addPad({ x: LOG.x, z: LOG.z, r: 2.4, y: LOG.y + 3.6 });
    world.poi.log = { x: LOG.x, z: LOG.z, y: LOG.y, topY: LOG.y + 3.6 };

    // setas alrededor del tronco
    for (let i = 0; i < 5; i++) {
      const x = LOG.x + Math.cos(i * 2.2) * (3.5 + i * 0.4), z = LOG.z + Math.sin(i * 2.2) * 3.2;
      const y = heightAt(x, z);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.4, 5), new THREE.MeshLambertMaterial({ color: '#e8dcc8' }));
      stem.position.set(x, y + 0.2, z);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.3, 6), new THREE.MeshLambertMaterial({ color: i % 2 ? '#d84a4a' : '#e8924a' }));
      cap.position.set(x, y + 0.5, z);
      scene.add(stem, cap);
    }
  }

  // ---------- ALTAR ----------
  const ALTAR = { x: 0, z: -12 };
  {
    ALTAR.y = heightAt(ALTAR.x, ALTAR.z);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.7, 9), stoneMat);
    disc.position.set(ALTAR.x, ALTAR.y + 0.35, ALTAR.z);
    disc.receiveShadow = true;
    scene.add(disc);
    world.colliders.addPad({ x: ALTAR.x, z: ALTAR.z, r: 3.3, y: ALTAR.y + 0.7 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const px = ALTAR.x + Math.cos(a) * 4.6, pz = ALTAR.z + Math.sin(a) * 4.6;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 2.6 + (i % 2) * 0.8, 6), stoneMatD);
      pil.position.set(px, heightAt(px, pz) + 1.3, pz);
      pil.castShadow = true;
      scene.add(pil);
      const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: '#ffce4a', emissive: '#7a5210' }));
      glyph.position.set(px, heightAt(px, pz) + 2.8 + (i % 2) * 0.8, pz);
      glyph.rotation.y = Math.PI / 4;
      scene.add(glyph);
      world.colliders.addCyl({ x: px, z: pz, r: 0.55, topY: heightAt(px, pz) + 2.6 });
      world.animated.push((dt, t) => { glyph.rotation.y = t * 0.6 + i; });
    }
    world.poi.altar = { x: ALTAR.x, z: ALTAR.z, y: ALTAR.y + 0.7 };
  }

  // ---------- saliente del MIRADOR (percha de pluma en el risco) ----------
  {
    const mx = 31, mz = -19;
    const my = heightAt(38, -26) * 0.55;
    const ledge = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, 0.5, 6), stoneMatD);
    ledge.position.set(mx, my, mz);
    scene.add(ledge);
    world.colliders.addPad({ x: mx, z: mz, r: 1.6, y: my + 0.25 });
    world.poi.ledge = { x: mx, z: mz, y: my + 0.25 };
  }

  // ---------- palmeras de la playa (sur) ----------
  kit.addPalm(4, 50, 1); kit.addPalm(11, 47, 2); kit.addPalm(-5, 48, 3); kit.addPalm(18, 44, 4);
}
