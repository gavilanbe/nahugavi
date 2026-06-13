// Entrada unificada: teclas físicas → acciones lógicas.
// Para añadir mando/gamepad o rebindear, solo hay que tocar BINDINGS.

const BINDINGS = {
  Space: 'jump',
  KeyJ: 'attack',
  KeyK: 'pound',
  KeyE: 'interact',
  Enter: 'enter',
};

const MOVE_KEYS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
};

export class Input {
  constructor(G) {
    this.G = G;
    this.keys = new Set();      // teclas mantenidas (KeyCode)
    this.pressed = new Set();   // acciones disparadas este frame
    this.mouseDown = false;
    this._listeners = [];       // hooks onAction(action) — para UI/diálogos

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      const action = BINDINGS[e.code];
      if (action) {
        this.pressed.add(action);
        if (action === 'jump') e.preventDefault();
        for (const fn of this._listeners) fn(action);
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        if (G.state === 'play' && G.ui && !G.ui.dialogActive) this.pressed.add('attack');
      }
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // hook por evento (no por frame): diálogos, pantalla de título...
  onAction(fn) { this._listeners.push(fn); }

  // eje de movimiento sin normalizar (-1..1 por componente)
  moveAxis() {
    let x = 0, z = 0;
    if (MOVE_KEYS.up.some((k) => this.keys.has(k))) z -= 1;
    if (MOVE_KEYS.down.some((k) => this.keys.has(k))) z += 1;
    if (MOVE_KEYS.left.some((k) => this.keys.has(k))) x -= 1;
    if (MOVE_KEYS.right.some((k) => this.keys.has(k))) x += 1;
    return { x, z };
  }

  isDown(code) { return this.keys.has(code); }

  endFrame() { this.pressed.clear(); }
}
