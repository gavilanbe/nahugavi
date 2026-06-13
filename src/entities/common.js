import * as THREE from 'three';

// Materiales compartidos por todas las entidades: UNA instancia de cada,
// creada al arrancar y reutilizada por cada coleccionable/enemigo.

export function entityMats(woodTex) {
  return {
    glow: new THREE.MeshBasicMaterial({ color: '#ffe07a' }),
    glowHalo: new THREE.MeshBasicMaterial({ color: '#ffe07a', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }),
    petal: new THREE.MeshLambertMaterial({ color: '#b66ae8', emissive: '#5a2a8a', emissiveIntensity: 0.55 }),
    petalCore: new THREE.MeshBasicMaterial({ color: '#ffe8a8' }),
    stem: new THREE.MeshLambertMaterial({ color: '#3e8a3a' }),
    featherR: new THREE.MeshLambertMaterial({ color: '#e84a5a', emissive: '#8a1a2a', emissiveIntensity: 0.4 }),
    featherG: new THREE.MeshLambertMaterial({ color: '#3eaa5e', emissive: '#1a6a3a', emissiveIntensity: 0.4 }),
    mango: new THREE.MeshLambertMaterial({ color: '#ff9a3a', emissive: '#7a3a0a', emissiveIntensity: 0.3 }),
    crate: new THREE.MeshLambertMaterial({ map: woodTex }),
    crateGold: new THREE.MeshLambertMaterial({ map: woodTex, color: '#ffd870' }),
    sombra: new THREE.MeshLambertMaterial({ color: '#3a2a5a', emissive: '#1a0e3a', emissiveIntensity: 0.7 }),
    white: new THREE.MeshBasicMaterial({ color: '#fff' }),
    dark: new THREE.MeshBasicMaterial({ color: '#1a0e2e' }),
    gold: new THREE.MeshLambertMaterial({ color: '#ffce4a', emissive: '#a86a10', emissiveIntensity: 0.5 }),
    goldD: new THREE.MeshLambertMaterial({ color: '#c98a1b', emissive: '#7a4a10', emissiveIntensity: 0.4 }),
  };
}

// Columna de luz vertical, estilo "la estrella está AQUÍ" de Mario 64.
export function makeBeam(scene, x, y, z, color = '#d8a8ff', r = 0.42, h = 13) {
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r * 1.6, h, 8, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  beam.position.set(x, y + h / 2 - 1, z);
  scene.add(beam);
  return beam;
}
