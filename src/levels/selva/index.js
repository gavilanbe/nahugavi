import { heightAt } from './heightmap.js';
import { buildLandmarks } from './landmarks.js';
import { spawns } from './spawns.js';
import { SelvaQuest } from './quest.js';

// Nivel 1 — Selva Susurrante.
// Un nivel es un objeto-definición: el motor (core/ + world/) no sabe nada
// de selvas ni de ídolos; todo el contenido entra por aquí. Para crear el
// nivel 2, copia esta carpeta y cambia heightmap, landmarks, spawns y quest.

export const SELVA = {
  id: 'selva',
  name: 'Selva Susurrante',
  seed: 1337,

  heightAt,
  build: buildLandmarks,
  spawns,
  makeQuest: (G, ents) => new SelvaQuest(G, ents),

  terrain: {
    size: 180,
    seg: 110,
    palette: {
      grass: ['#4e9a44', '#459040', '#57a64b'],
      dry: '#8fae4e',
      sand: '#d8b870',
      dirt: '#8a6038',
      deep: '#6a8a58',
    },
  },

  scatter: {
    // zonas a evitar al dispersar vegetación: [x, z, radio] (POIs del nivel)
    avoid: [
      [0, -6, 12], [26, 30, 9], [-30, 22, 14], [-18, -28, 7], [38, -26, 10], [16, -16, 6], [31, -19, 4],
    ],
    trees: { count: 34, rMin: 14, rSpan: 42 },
    rocks: { count: 14 },
    grass: { count: 260 },
    flowers: { count: 26 },
    ambientFireflies: { count: 110 },
  },
};
