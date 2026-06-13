// Tablas de spawn de la Selva Susurrante. Posiciones de coleccionables,
// cajas, enemigos y NPC. Los POI del mundo (registrados por landmarks.js)
// permiten colocar cosas "encima del pilar" sin duplicar coordenadas.

export function spawns(world, heightAt) {
  const w = world;

  // ---- luciérnagas (guían el camino) ----
  const fireflies = [];
  // anillo alrededor del altar
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    fireflies.push([Math.cos(a) * 6.5, Math.sin(a) * 6.5 - 12]);
  }
  // camino altar → cajas
  for (let i = 0; i < 5; i++) fireflies.push([3 + i * 2.8, -13 - i * 1.2]);
  // camino → ladera de la meseta
  for (let i = 0; i < 6; i++) fireflies.push([20 + i * 3.2, -18 - i * 1.6]);
  // anillo en la meseta
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    fireflies.push([38 + Math.cos(a) * 4, -26 + Math.sin(a) * 4]);
  }
  // línea hacia el tronco
  for (let i = 0; i < 4; i++) fireflies.push([-8 - i * 3, -16 - i * 3.5]);
  // playa
  for (let i = 0; i < 3; i++) fireflies.push([2 + i * 6, 46 + (i % 2) * 3]);

  const fireflies3d = fireflies.map(([x, z]) => [x, heightAt(x, z) + 1.3, z]);
  // sobre las ramas del Árbol Abuelo (usa las alturas exactas)
  for (let i = 0; i < 6; i++) {
    const b = w.branches[i];
    fireflies3d.push([b.x, b.y + 1.1, b.z]);
  }
  // sobre los nenúfares
  for (const p of w.lilyPads) fireflies3d.push([p.x, p.baseY + 1.2, p.z]);

  // ---- orquídeas (objetos de misión; la 5ª sale de la caja dorada) ----
  const orchids = [
    [w.poi.arbolAbuelo.x, w.poi.arbolAbuelo.topY + 1.0, w.poi.arbolAbuelo.z, 'arbol'],
    [w.poi.pillar.x, w.poi.pillar.topY + 0.9, w.poi.pillar.z, 'pillar'],
    [w.poi.log.x, w.poi.log.y + 1.0, w.poi.log.z, 'log'],
    [38, heightAt(38, -26) + 1.0, -26, 'plateau'],
  ];

  // ---- plumas ----
  const feathers = [
    [w.poi.arbolAbuelo.x + 2.2, w.poi.arbolAbuelo.topY + 1.2, w.poi.arbolAbuelo.z + 1.5],
    [w.poi.pillar.x + 1.2, w.poi.pillar.topY + 1.0, w.poi.pillar.z - 1.0],
    [w.poi.log.x, w.poi.log.topY + 1.0, w.poi.log.z],
    [w.poi.ledge.x, w.poi.ledge.y + 1.0, w.poi.ledge.z],
    [10, heightAt(10, 52) + 1.0, 52],
  ];

  // ---- gajos de mango (curación) ----
  const mangos = [
    [28, heightAt(28, -14) + 0.8, -14],
    [-18, heightAt(-18, 14) + 0.8, 14],
  ];

  // ---- cajas: [x, z, contenido, dorada] ----
  const crates = [
    [15, -17, 'orchid', true],   // caja dorada → orquídea 5
    [17.5, -16, 'mango', false],
    [16, -19.5, 'fireflies', false],
    [13.5, -19, 'fireflies', false],
  ];

  // ---- sombras ----
  const sombras = [
    [36, -24], [40, -28], [-13, -26], [14, 8],
  ];

  return { fireflies: fireflies3d, orchids, feathers, mangos, crates, sombras, axol: { x: 3.5, z: -9 } };
}
