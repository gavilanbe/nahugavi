// Activos pixel-art del HUD y los diálogos, todos dibujados en código:
// iconos 14x14, retratos con frame de boca abierta y parser de texto rico.

export const PALETTES = {
  firefly: { y: '#ffe07a', Y: '#fff8c8', o: '#e8a83a', k: '#3a2a1a' },
  orchid:  { p: '#b66ae8', P: '#d8a8ff', g: '#3e8a3a', y: '#ffe07a' },
  feather: { r: '#e84a5a', R: '#ff8a7a', g: '#3eaa5e', G: '#7adf8e', k: '#7a3d14' },
  mango:   { o: '#ff9a3a', O: '#ffc86a', g: '#52a844', k: '#7a3d14' },
  idol:    { G: '#ffd95e', g: '#e8a020', k: '#5a3a10', d: '#7a4a10' },
};

export function drawIcon(canvas, rows, pal, px = 14) {
  canvas.width = px; canvas.height = px;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, px, px);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || !pal[ch]) return;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(x, y, 1, 1);
    });
  });
}

export const ICONS = {
  firefly: [
    '..............',
    '.....k..k.....',
    '....k....k....',
    '.....YYYY.....',
    '....YYYYYY....',
    '...YYYyyYYY...',
    '...YyyyyyyY...',
    '...Yyyyyyyy...',
    '....yyyyyy....',
    '....oooooo....',
    '.....oooo.....',
    '.....oooo.....',
    '......oo......',
    '..............',
  ],
  orchid: [
    '..............',
    '.....P..P.....',
    '....PPPPPP....',
    '...PPpPPpPP...',
    '..PPppPPppPP..',
    '..PpppyyppP...',
    '...ppyYYypp...',
    '...ppyYYypp...',
    '..PpppyyppPP..',
    '...PppppppP...',
    '....PPppPP....',
    '......gg......',
    '......gg......',
    '.....gg.......',
  ],
  feather: [
    '..............',
    '.........GG...',
    '........GGGG..',
    '.......GGGG...',
    '......GGGG....',
    '.....RGGG.....',
    '....RRRG......',
    '...RRRR.......',
    '...rRRR.......',
    '..rrRR........',
    '..rrr.........',
    '.krr..........',
    '.k............',
    'k.............',
  ],
  mango: [
    '..............',
    '.......g......',
    '......gg......',
    '....OOOO......',
    '...OOOOOOO....',
    '..OOOOOOOOo...',
    '..OOOOOOOoo...',
    '..OOOOOOooo...',
    '..oOOOOoooo...',
    '...oooooooo...',
    '....oooooo....',
    '......ooo.....',
    '..............',
    '..............',
  ],
  idol: [
    '......gg......',
    '......gg......',
    '.g..GGGGGG..g.',
    '..gGGGGGGGGg..',
    '..GGGGGGGGGG..',
    'ggGGkGGGGkGGgg',
    'ggGGkGGGGkGGgg',
    '..GGGGGGGGGG..',
    '..GGdGGGGdGG..',
    '...GGddddGG...',
    '..gGGGGGGGGg..',
    '.g..GGGGGG..g.',
    '......gg......',
    '......gg......',
  ],
};

// retratos 14x14, con filas alternativas de boca abierta para hablar
export const FACES = {
  nahu: {
    pal: { o: '#e8923a', c: '#ffe8c8', k: '#2a1208', s: '#7a3d14', b: '#241338', n: '#3a2210', w: '#fff8ee', p: '#2a1208' },
    rows: [
      'bbbbbbbbbbbbbb',
      'bb.oo....oo.bb',
      'bb.ooc..coo.bb',
      'bboooooooooobb',
      'bbosoooooosobb',
      'bb.owwoowwo.bb',
      'bb.owpoowpo.bb',
      'bboooooooooobb',
      'bbooccccccoobb',
      'bbocccnncccobb',
      'bb.occcccco.bb',
      'bb..cccccc..bb',
      'bb....cc....bb',
      'bbbbbbbbbbbbbb',
    ],
    open: {
      10: 'bb.ockkkkco.bb',
      11: 'bb..ckkkkc..bb',
    },
  },
  gavi: {
    pal: { g: '#7a5638', G: '#c8a878', y: '#ffb13a', k: '#2a1208', w: '#fff8e8', m: '#46301e', b: '#241338' },
    rows: [
      'bbbbbbbbbbbbbb',
      'bb....gg....bb',
      'bb...gggg...bb',
      'bb..gggggg..bb',
      'bb.GGGGGGGG.bb',
      'bb.mmGGGGmm.bb',
      'bb.GwkGGkwG.bb',
      'bb.GGGGGGGG.bb',
      'bb..GGyyGG..bb',
      'bb...yyyy...bb',
      'bb....yy....bb',
      'bb..gGGGGg..bb',
      'bb..gggggg..bb',
      'bbbbbbbbbbbbbb',
    ],
    open: {
      9: 'bb..yy..yy..bb',
      10: 'bb...yyyy...bb',
    },
  },
  axol: {
    pal: { p: '#f2a0c8', P: '#ff7eb8', m: '#e84a9a', k: '#2a1a2e', w: '#fff0f8', b: '#241338' },
    rows: [
      'bbbbbbbbbbbbbb',
      'bm..........mb',
      'bmm.pppppp.mmb',
      'b.mpppppppm.bb',
      'bmmpppppppmmbb',
      'b.pppppppppp.b',
      'bmppkppppkppmb',
      'b.ppkppppkpp.b',
      'bmpppppppppmbb',
      'b.ppPPPPPPpp.b',
      'bb.ppPwwPpp.bb',
      'bb..pppppp..bb',
      'bb...pppp...bb',
      'bbbbbbbbbbbbbb',
    ],
    open: {
      10: 'bb.ppPkkPpp.bb',
      11: 'bb..pkkkkp..bb',
    },
  },
};

export function faceRows(face, open) {
  if (!open || !face.open) return face.rows;
  return face.rows.map((r, i) => face.open[i] || r);
}

// convierte los marcadores **dorado** y __magenta__ en [{ch, cls}]
export function parseRich(text) {
  const out = [];
  let cls = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '*' && text[i + 1] === '*') { cls = cls === 'kw-g' ? '' : 'kw-g'; i++; continue; }
    if (text[i] === '_' && text[i + 1] === '_') { cls = cls === 'kw-m' ? '' : 'kw-m'; i++; continue; }
    out.push({ ch: text[i], cls });
  }
  return out;
}

export const VOICE_COLORS = { nahu: '#ffb36b', gavi: '#a8d8ff', axol: '#ff9ad0' };
export const NAMES = { nahu: 'NAHU', gavi: 'GAVI', axol: 'TATA AXOL' };
