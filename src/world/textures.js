import { makeCanvasTex } from '../core/utils.js';

// Texturas pixel-art dibujadas en canvas. Cada una se crea UNA vez y se
// comparte (los materiales que las usan también deberían compartirse).

// pelaje de jaguar (naranja + rosetas)
export function makePeltTex() {
  return makeCanvasTex(16, (ctx) => {
    ctx.fillStyle = '#e8923a'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#f2a94e';
    for (let i = 0; i < 14; i++) ctx.fillRect((i * 7) % 16, (i * 11) % 16, 2, 2);
    ctx.fillStyle = '#7a3d14';
    const spots = [[2, 2], [9, 1], [13, 5], [4, 8], [11, 10], [1, 12], [7, 13], [14, 12], [6, 5]];
    for (const [x, y] of spots) { ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + 1, y - 1, 1, 1); }
  });
}

export function makeWoodTex() {
  return makeCanvasTex(16, (ctx) => {
    ctx.fillStyle = '#9a6230'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#7a4a20';
    for (let y = 0; y < 16; y += 4) ctx.fillRect(0, y, 16, 1);
    ctx.fillStyle = '#b87a3e';
    for (let y = 2; y < 16; y += 4) ctx.fillRect(0, y, 16, 1);
    ctx.fillStyle = '#5a3314';
    ctx.fillRect(0, 0, 1, 16); ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(3, 6, 2, 2); ctx.fillRect(11, 11, 2, 2);
  });
}

export function makeWaterTex() {
  return makeCanvasTex(32, (ctx) => {
    ctx.fillStyle = '#2e8f9e'; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#3eafb8';
    for (let i = 0; i < 8; i++) {
      const y = i * 4 + (i % 2) * 2;
      ctx.fillRect((i * 9) % 28, y, 7, 1);
    }
    ctx.fillStyle = '#7ee0d8';
    for (let i = 0; i < 6; i++) ctx.fillRect((i * 13 + 4) % 30, (i * 7 + 2) % 30, 3, 1);
  }, 40);
}

export function makeGrassBladeTex() {
  return makeCanvasTex(16, (ctx) => {
    ctx.clearRect(0, 0, 16, 16);
    const cols = ['#3e8a3a', '#52a844', '#2e6e30'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = cols[i % 3];
      const x = 2 + i * 3;
      ctx.fillRect(x, 6 + (i % 3), 2, 10);
      ctx.fillRect(x + (i % 2 ? 1 : -1), 3 + (i % 3), 1, 5);
    }
  });
}
