import { mulberry32 } from '../core/utils.js';
import { Colliders } from './collision.js';
import { buildTerrain } from './terrain.js';
import { buildWater } from './water.js';
import { createPropsKit, scatterVegetation, addAmbientFireflies } from './props.js';
import { makeWoodTex } from './textures.js';

// Construye el mundo a partir de la definición del nivel:
//   sistemas genéricos (terreno, agua, props, colisión) + contenido del
//   nivel (landmarks, heightmap, paleta) que llega vía `level`.
// El objeto `world` resultante es el contrato que usan player/entities:
//   { heightAt, colliders, poi, animated, waterMat, woodTex, ... }

export function buildWorld(G, level) {
  const rng = mulberry32(level.seed);
  const world = {
    heightAt: level.heightAt,
    colliders: new Colliders(level.heightAt),
    poi: {},        // puntos de interés que el nivel registra para los spawns
    animated: [],   // fn(dt, t) por frame (agua, nenúfares, glifos...)
  };

  buildTerrain(G, world, level, rng);
  world.waterMat = buildWater(G, world);

  const kit = createPropsKit(G, world, rng);
  level.build(G, world, kit, rng);

  scatterVegetation(G, world, kit, rng, level.scatter);
  addAmbientFireflies(G, world, rng, level.scatter.ambientFireflies);

  world.woodTex = makeWoodTex();
  return world;
}
