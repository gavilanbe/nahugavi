import * as THREE from 'three';
import { DUSK, DAY } from '../config.js';
import { mulberry32 } from '../core/utils.js';

// Cúpula de cielo con gradiente pixelado por bandas, disco solar y estrellas.
// apply(mood) interpola entre las paletas DUSK y DAY.

const _a = new THREE.Color(), _b = new THREE.Color(), _c = new THREE.Color();
const _band = new THREE.Color();

export function makeSky(scene) {
  const c = document.createElement('canvas');
  c.width = 1; c.height = 64;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.SphereGeometry(420, 16, 12);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -10;
  scene.add(mesh);

  // disco solar
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(26, 10, 8),
    new THREE.MeshBasicMaterial({ color: DUSK.sun, fog: false })
  );
  scene.add(sun);

  // estrellas (solo al atardecer)
  const starGeo = new THREE.BufferGeometry();
  const sp = [];
  const rng = mulberry32(99);
  for (let i = 0; i < 220; i++) {
    const a = rng() * Math.PI * 2, e = rng() * Math.PI * 0.45 + 0.12, r = 400;
    sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: '#ffe8f0', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 });
  scene.add(new THREE.Points(starGeo, starMat));

  let lastMood = -1;

  function apply(mood) {
    if (Math.abs(mood - lastMood) < 0.004 && lastMood >= 0) return;
    lastMood = mood;
    _a.lerpColors(DUSK.top, DAY.top, mood);
    _b.lerpColors(DUSK.mid, DAY.mid, mood);
    _c.lerpColors(DUSK.hor, DAY.hor, mood);
    // bandas duras para un gradiente pixelado
    const bands = 12;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1); // 0 = cénit, 1 = horizonte
      if (t < 0.55) _band.lerpColors(_a, _b, t / 0.55);
      else _band.lerpColors(_b, _c, (t - 0.55) / 0.45);
      ctx.fillStyle = '#' + _band.getHexString();
      const y0 = Math.floor((i / bands) * 44);
      const y1 = Math.floor(((i + 1) / bands) * 44);
      ctx.fillRect(0, y0, 1, y1 - y0 + 1);
    }
    // bajo el horizonte
    ctx.fillStyle = '#' + _c.getHexString();
    ctx.fillRect(0, 43, 1, 21);
    tex.needsUpdate = true;

    sun.material.color.lerpColors(DUSK.sun, DAY.sun, mood);
    const ang = -0.06 + mood * 0.5; // el sol sube con el día
    sun.position.set(Math.cos(ang) * 380 * 0.7, Math.sin(ang) * 380, -380 * 0.55);
    starMat.opacity = (1 - mood) * 0.8;
  }
  apply(0);
  return { apply };
}
