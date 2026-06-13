import * as THREE from 'three';

// =====================================================================
// Configuración global del juego: todos los números "mágicos" viven aquí
// para poder ajustar el feel del juego sin tocar la lógica.
// =====================================================================

// ---------- render ----------
export const RENDER = {
  PIXEL_H: 224,          // altura interna en píxeles (look retro); el ancho sigue el aspect
  FOV: 58,
  NEAR: 0.1,
  FAR: 900,
  SHADOW_MAP: 2048,
};

// ---------- cámara ----------
export const CAMERA = {
  YAW0: Math.PI,
  PITCH0: 0.42,
  PITCH_MIN: 0.08,
  PITCH_MAX: 1.15,
  DIST0: 8.5,
  DIST_MIN: 5,
  DIST_MAX: 13,
  DRAG_X: 0.0065,
  DRAG_Y: 0.005,
  WHEEL_STEP: 0.8,
};

// ---------- física del jugador ----------
export const PHYSICS = {
  GRAVITY: 32,
  RUN_SPEED: 8.2,
  JUMP_V: 11.5,
  FLAP_V: 7.2,
  MAX_FLAPS: 4,
  MAX_FALL: 34,
  COYOTE: 0.12,
  JUMP_BUFFER: 0.12,
  SWIM_SPEED: 6.0,
  DIVE_SPEED: 5.4,
  AIR_SECONDS: 15,       // segundos de aire buceando
  AIR_REFILL: 1.2,       // segundos para rellenar el aire en superficie
  WORLD_RADIUS: 78,      // límite circular del mapa
  KILL_Y: -20,           // caer por debajo = desmayo
};

// ---------- bombazo (ground pound) ----------
// Las tres fases del golpe al suelo, medidas en segundos desde que se activa.
export const POUND = {
  POP_V: 5.6,        // impulso del saltito de anticipación (se recoge en bola)
  HANG_FROM: 0.16,   // empieza la flotación en el ápice (el "suspense")
  HANG_TO: 0.30,     // termina la flotación y comienza el desplome a plomo
  SLAM_V: 34,        // velocidad del desplome (= MAX_FALL: lo más duro posible)
  LAND_T: 0.32,      // duración de la pose de impacto/recuperación
};

// ---------- mundo ----------
export const WATER_Y = -1.4;

// ---------- paletas de ambiente (atardecer eterno → día despierto) ----------
export const DUSK = {
  top: new THREE.Color('#241040'), mid: new THREE.Color('#83307a'),
  hor: new THREE.Color('#ff9a52'), fog: new THREE.Color('#b3527c'),
  sun: new THREE.Color('#ffb36b'), amb: new THREE.Color('#6a4a7a'),
  dir: new THREE.Color('#ffac60'), water: new THREE.Color('#2e6f8e'),
};
export const DAY = {
  top: new THREE.Color('#3f9fe8'), mid: new THREE.Color('#74c6ef'),
  hor: new THREE.Color('#fff0c4'), fog: new THREE.Color('#b8e4e0'),
  sun: new THREE.Color('#fff6d8'), amb: new THREE.Color('#9ab8c0'),
  dir: new THREE.Color('#fff2cc'), water: new THREE.Color('#2e9f9e'),
};

export const FOG = { NEAR: 40, FAR: 160, UW_NEAR: 3, UW_FAR: 55, UW_COLOR: '#1f7290' };
