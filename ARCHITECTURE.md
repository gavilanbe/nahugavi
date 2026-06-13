# Arquitectura — Nahu & Gavi

Juego de plataformas 3D tributo a Banjo-Kazooie. 100% procedural (cero assets:
geometría, texturas, audio y música generados en código), Three.js vía CDN,
sin build step — se sirve estático (`python3 -m http.server`).

## Principio rector

**Motor y contenido separados.** `core/`, `world/`, `entities/`, `player/`,
`ui/` y `audio/` no saben nada de selvas ni de ídolos. Todo el contenido del
nivel 1 vive en `levels/selva/`. Para el nivel 2: copia la carpeta, cambia
heightmap/landmarks/spawns/quest y pásalo a `new Game(canvas, NIVEL2)`.

```
src/
├─ main.js                  punto de entrada: Game + nivel (8 líneas)
├─ config.js                tunables: física, cámara, render, paletas DUSK/DAY
│
├─ core/                    ─── motor ───
│  ├─ Game.js               orquestador: crea sistemas, los conecta vía G, bucle principal
│  ├─ Renderer.js           render retro a resolución interna fija (224px de alto)
│  ├─ Input.js              teclas → acciones lógicas (BINDINGS); hooks onAction
│  ├─ CameraRig.js          cámara 3ª persona: órbita, zoom, shake, modo cinemático
│  ├─ Atmosphere.js         luces, niebla, cielo, mood (atardecer→día), subacuático
│  └─ utils.js              mulberry32 (RNG determinista), smooth01, makeCanvasTex, jitterGeo
│
├─ world/                   ─── sistemas de mundo genéricos ───
│  ├─ index.js              buildWorld(G, level): compone terreno+agua+props+landmarks
│  ├─ terrain.js            malla low-poly desde level.heightAt + paleta del nivel
│  ├─ water.js              lámina de agua animada
│  ├─ collision.js          Colliders: cilindros / pads / AABBs, groundAt, pushOut
│  ├─ props.js              kit de árboles/palmeras/rocas + hierba instanciada + flores
│  ├─ sky.js                cúpula con gradiente por bandas, sol, estrellas
│  └─ textures.js           texturas canvas pixel-art compartidas
│
├─ levels/selva/            ─── TODO el contenido del nivel 1 ───
│  ├─ index.js              definición del nivel: seed, paleta, scatter, hooks
│  ├─ heightmap.js          heightAt(x,z) — fuente de verdad de terreno y colisión
│  ├─ landmarks.js          Árbol Abuelo, Laguna, Tronco Hueco, Altar, Mirador
│  ├─ spawns.js             posiciones de coleccionables/cajas/enemigos/NPC
│  ├─ dialogs.js            todos los textos (diálogos, pistas, banners)
│  └─ quest.js              máquina de estados de la misión + pistas contextuales
│
├─ entities/
│  ├─ index.js              gestor: compone subsistemas, contadores globales
│  ├─ Particles.js          ⚡ partículas con POOL (cero allocs por frame)
│  ├─ Collectibles.js       luciérnagas, orquídeas, plumas, mangos
│  ├─ Crates.js             cajas rompibles con contenido
│  ├─ Sombras.js            enemigos: deambular/perseguir/morir
│  ├─ Axol.js               NPC chamán: idle animado + interacción E
│  ├─ Idol.js               el Sol de Oro: spawn + coreografía de recogida
│  └─ common.js             entityMats (materiales compartidos), makeBeam
│
├─ player/
│  ├─ index.js              gameplay: física, salto/aleteo/nado/buceo, combate, vida/aire
│  ├─ mesh.js               modelo de Nahu+Gavi (construcción de la malla)
│  ├─ animate.js            pose procedural por frame (carrera, nado, baile...)
│  └─ fx.js                 zarpazo/estelas/onda/Zzz (geometrías compartidas)
│
├─ ui/
│  ├─ index.js              HUD, pistas, banners, fundidos, victoria
│  ├─ Dialog.js             caja de diálogo: tecleo letra a letra + retrato animado
│  └─ assets.js             iconos/retratos pixel-art + parser de texto rico
│
└─ audio/
   ├─ index.js              AudioEngine: buses + generadores tone()/noise()
   ├─ sfx.js                todos los efectos (mixin sobre el engine)
   └─ music.js              secuenciador: marimba pentatónica a 84 BPM
```

## El contexto G

Todos los sistemas se comunican por el objeto `G` que crea `Game`:
estado (`state`, `time`, `mood`), sistemas (`scene`, `camera`, `input`,
`world`, `player`, `ents`, `ui`, `audio`, `fx`) y servicios (`shake()`,
`hitStop()`, `fade()`, `victory()`, `cinema`). `window.G` queda expuesto
para depurar desde consola.

## Contrato del nivel

```js
export const NIVEL = {
  id, name, seed,
  heightAt(x, z),                  // terreno + colisión de suelo
  build(G, world, kit, rng),       // landmarks → registran world.poi/colliders
  spawns(world, heightAt),         // → { fireflies, orchids, feathers, mangos, crates, sombras, axol }
  makeQuest(G, ents),              // máquina de estados de la misión
  terrain: { size, seg, palette },
  scatter: { avoid, trees, rocks, grass, flowers, ambientFireflies },
};
```

## Decisiones de rendimiento

- **Partículas con pool** (`entities/Particles.js`): 150 cajas + 12 esferas
  creadas al inicio; emitir = toggle de visibilidad. Cero allocs/GC/churn de
  escena por frame.
- **Materiales y geometrías compartidos**: `entityMats()` una vez; los FX del
  jugador reutilizan geometrías (el código antiguo filtraba una geometría por
  ataque); texturas canvas creadas una única vez.
- **Hierba instanciada** (1 draw call para 260 matas) y cielo/sol baratos
  (`MeshBasicMaterial`, sin niebla).
- **Resolución interna fija** (224px de alto): el coste de fragment shader es
  constante e independiente del monitor.
- **Cero allocs en el bucle**: vectores/colores temporales a nivel de módulo.
- Medido: ~138 draw calls, ~27k triángulos, 120 FPS (cap del monitor).

## Lore (para los siguientes niveles)

La hechicera **Zonza** robó los **nueve Ídolos del Sol**. Nivel 1 (Selva
Susurrante) recupera el primero. Quedan **ocho niveles** por construir.
