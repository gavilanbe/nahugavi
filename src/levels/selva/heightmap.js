import { smooth01, dist2 } from '../../core/utils.js';

// Heightmap analítico de la Selva Susurrante: única fuente de verdad para
// el terreno Y la colisión con el suelo. Cada nivel define el suyo.

export function heightAt(x, z) {
  let h = 2.0 * Math.sin(x * 0.055) * Math.cos(z * 0.05)
        + 1.1 * Math.sin(x * 0.13 + 1.7) * Math.sin(z * 0.11 + 2.3);
  // meseta del Mirador
  h += 8.0 * smooth01(1 - dist2(x, z, 38, -26) / 21);
  // hondonada de la Laguna Espejo
  h -= 5.0 * smooth01(1 - dist2(x, z, -30, 22) / 17);
  // claro llano del spawn / altar
  const s = smooth01(1 - dist2(x, z, 0, -6) / 15);
  h = h * (1 - s) + 0.6 * s;
  // caída de la isla hacia el mar
  const d = Math.hypot(x, z);
  const edge = smooth01((d - 56) / 18);
  h = h * (1 - edge) + (-7) * edge;
  return h;
}
