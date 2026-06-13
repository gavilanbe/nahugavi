import { FACES, NAMES, VOICE_COLORS, drawIcon, faceRows, parseRich } from './assets.js';

// Caja de diálogo estilo BK: retrato pixel con boca animada, texto que
// aparece letra a letra con "voz" farfullada, y cola de líneas con callback.

export class Dialog {
  constructor(G, el) {
    this.G = G;
    this.el = el; // { dialog, name, text, portrait, next }
    this.active = false;
    this._queue = [];
    this._onDone = null;
    this._typing = false;
    this._typeTimer = null;
    this._mouthTimer = null;
  }

  show(lines, onDone) {
    this._queue = [...lines];
    this._onDone = onDone || null;
    this.active = true;
    this.el.dialog.classList.add('show');
    this._nextLine();
  }

  advance() {
    if (!this.active) return;
    if (this._typing) {
      for (const s of this._spans) if (s) s.classList.add('on');
      this._endTyping();
    } else {
      this._nextLine();
    }
  }

  _endTyping() {
    clearInterval(this._typeTimer);
    clearInterval(this._mouthTimer);
    this._typing = false;
    const face = FACES[this._currentLine.who];
    drawIcon(this.el.portrait, faceRows(face, false), face.pal);
    this.el.portrait.classList.remove('talking');
    this.el.next.style.visibility = 'visible';
  }

  _nextLine() {
    const line = this._queue.shift();
    if (!line) {
      this.el.dialog.classList.remove('show');
      this.active = false;
      const cb = this._onDone;
      this._onDone = null;
      if (cb) cb();
      return;
    }
    this._currentLine = line;
    const face = FACES[line.who];
    drawIcon(this.el.portrait, face.rows, face.pal);
    this.el.portrait.classList.add('talking');
    this.el.name.textContent = NAMES[line.who];
    this.el.name.style.color = VOICE_COLORS[line.who];
    this.el.next.style.visibility = 'hidden';

    // pre-coloca cada carácter como span oculto (sin reflow al teclear)
    // y luego los hace aparecer uno a uno
    const chars = parseRich(line.text);
    this.el.text.innerHTML = '';
    this._spans = [];
    let word = null;
    for (const { ch, cls } of chars) {
      if (ch === ' ') {
        word = null;
        this.el.text.appendChild(document.createTextNode(' '));
        this._spans.push(null);
      } else {
        if (!word) {
          word = document.createElement('span');
          word.className = 'word';
          this.el.text.appendChild(word);
        }
        const s = document.createElement('span');
        s.className = 'ch' + (cls ? ' ' + cls : '');
        s.textContent = ch;
        word.appendChild(s);
        this._spans.push(s);
      }
    }

    this._typing = true;
    let i = 0;
    clearInterval(this._typeTimer);
    clearInterval(this._mouthTimer);
    this._typeTimer = setInterval(() => {
      const s = this._spans[i];
      if (s) s.classList.add('on');
      if (i % 2 === 0 && s) this.G.audio.voice(line.who);
      i++;
      if (i >= this._spans.length) this._endTyping();
    }, 26);
    // la boca aletea mientras teclea
    let open = false;
    this._mouthTimer = setInterval(() => {
      open = !open;
      drawIcon(this.el.portrait, faceRows(face, open), face.pal);
    }, 120);
  }
}
