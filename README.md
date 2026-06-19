# 🐆 Nahu & Gavi — El Ídolo del Sol

Un plataformas 3D en el navegador, tributo a los clásicos tipo *Banjo-Kazooie*, donde Nahu y Gavi recorren la **Selva Susurrante** para recuperar el primero de los nueve Ídolos del Sol que robó la hechicera Zonza. ✨

## ✨ Características

- 🌴 **Mundo 3D explorable** con look retro pixelado (resolución interna fija de 224px y scanlines tipo CRT).
- 🎨 **100% procedural, cero assets**: geometría, texturas, audio y música se generan en código. No hay imágenes ni sonidos en disco.
- 🦘 **Movimiento de plataformas completo**: correr, saltar, aletear, nadar y bucear (con medidor de aire).
- ⚔️ **Combate y enemigos**: zarpazos contra las Sombras que deambulan y persiguen.
- 💎 **Coleccionables y misiones**: luciérnagas, orquídeas, plumas y mangos, cajas rompibles, un NPC chamán (Axol) y la coreografía del Ídolo del Sol.
- 🎵 **Audio generado en vivo**: motor de sonido con buses y efectos, más un secuenciador de marimba pentatónica a 84 BPM.
- 🌅 **Atmósfera dinámica**: ciclo de mood (atardecer → día), niebla, cielo con gradiente y tinte subacuático.
- 🏗️ **Arquitectura motor/contenido separados**: añadir un nivel nuevo es copiar una carpeta y cambiar heightmap, landmarks y misión.

## 🚀 Cómo jugar / ejecutar

No hace falta instalar nada: Three.js se carga vía CDN y no hay paso de build. Solo necesitas servir la carpeta como estático.

```bash
# Opción 1: con el Makefile (sirve y abre el navegador en http://localhost:4321)
make run

# Opción 2: directamente con Python
python3 -m http.server 4321
# y abre http://localhost:4321/ en el navegador
```

## 🎮 Controles

- **WASD** o **flechas** → moverse
- **Espacio** → saltar / aletear
- **J** o **clic izquierdo** → atacar (zarpazo)
- **K** → golpe al suelo (pound)
- **E** → interactuar (hablar con NPC, etc.)
- **Enter** → empezar / confirmar

## 🛠️ Tecnología

- **JavaScript (ES modules)** puro, sin framework ni bundler.
- **Three.js 0.165** vía CDN (import map de jsdelivr).
- **Web Audio API** para todo el sonido y la música procedural.
- **HTML5 Canvas** para las texturas pixel-art y los retratos del HUD.
- Sin dependencias instalables ni build step: se sirve estático.

## 📦 Parte de mi colección de juegos

Este es uno de mis juegos hobby. Échale un ojo al resto de mi colección en mi perfil de GitHub. 🎮
