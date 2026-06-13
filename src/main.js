import { Game } from './core/Game.js';
import { SELVA } from './levels/selva/index.js';

// Punto de entrada: motor (Game) + contenido (nivel).
// Para lanzar otro nivel, basta con pasar otra definición.

new Game(document.getElementById('game'), SELVA).start();
