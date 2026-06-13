import { entityMats } from './common.js';
import { Collectibles } from './Collectibles.js';
import { Crates } from './Crates.js';
import { Sombras } from './Sombras.js';
import { Axol } from './Axol.js';
import { Idol } from './Idol.js';

// Gestor de entidades: compone los subsistemas (coleccionables, cajas,
// enemigos, NPC, ídolo) y mantiene los contadores globales del nivel.
// Las posiciones y la quest llegan desde la definición del nivel.

export class Entities {
  constructor(G, level) {
    this.G = G;
    this.counts = { fireflies: 0, orchids: 0, feathers: 0, idol: 0 };
    this.mat = entityMats(G.world.woodTex);
    this.quest = level.makeQuest(G, this);

    const data = level.spawns(G.world, level.heightAt);
    this.collectibles = new Collectibles(G, this, data);
    this.crates = new Crates(G, this, data.crates);
    this.sombras = new Sombras(G, this, data.sombras);
    this.axol = new Axol(G, this, data.axol);
    this.idol = new Idol(G, this);

    // total de luciérnagas = sueltas + las escondidas en cajas (3 por caja)
    this.collectibles.totalFireflies =
      this.collectibles.fireflies.length +
      data.crates.filter(([, , contents]) => contents === 'fireflies').length * 3;
  }

  update(dt) {
    const p = this.G.player;
    this.collectibles.update();
    this.crates.update(p.attackHit, p.poundLanded);
    this.sombras.update(dt);
    this.axol.update(dt);
    this.idol.update(dt);
    this.quest.update(dt);
  }
}
