// Keyboard input with edge detection and short-lived buffering.

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
  ShiftLeft: 'run', ShiftRight: 'run', KeyJ: 'run',
  KeyX: 'action', KeyL: 'action',
  Enter: 'start',
  Escape: 'pause', KeyP: 'pause',
};

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.pressedThisFrame = new Set();
    this.releasedThisFrame = new Set();
    this._bufferTimers = {};
    target.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.down.has(action)) this.pressedThisFrame.add(action);
      this.down.add(action);
    });
    target.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      this.down.delete(action);
      this.releasedThisFrame.add(action);
    });
    window.addEventListener('blur', () => { this.down.clear(); });
  }

  isDown(action) { return this.down.has(action); }
  wasPressed(action) { return this.pressedThisFrame.has(action); }
  wasReleased(action) { return this.releasedThisFrame.has(action); }

  // Buffer a press for `seconds`; consuming it clears the buffer.
  bufferPress(action, seconds) {
    if (this.pressedThisFrame.has(action)) this._bufferTimers[action] = seconds;
  }
  tickBuffer(action, dt) {
    if (this._bufferTimers[action] > 0) this._bufferTimers[action] -= dt;
  }
  consumeBuffered(action) {
    if (this._bufferTimers[action] > 0) {
      this._bufferTimers[action] = 0;
      return true;
    }
    return false;
  }

  endFrame() {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }
}
