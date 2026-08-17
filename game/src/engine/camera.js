import { VIEW_W, VIEW_H } from './constants.js';

export class Camera {
  constructor(worldW, worldH) {
    this.x = 0; this.y = 0;
    this.worldW = worldW; this.worldH = worldH;
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.targetY = null;
  }

  setBounds(w, h) { this.worldW = w; this.worldH = h; }

  follow(target, dt) {
    const deadzoneX = 40;
    const centerX = this.x + VIEW_W / 2;
    const dx = (target.x + target.w / 2) - centerX;
    if (Math.abs(dx) > deadzoneX) {
      this.x += dx - Math.sign(dx) * deadzoneX;
    }
    const desiredY = target.y + target.h / 2 - VIEW_H / 2;
    this.y += (desiredY - this.y) * Math.min(1, dt * 4.5);

    this.x = Math.max(0, Math.min(this.x, Math.max(0, this.worldW - VIEW_W)));
    this.y = Math.max(0, Math.min(this.y, Math.max(0, this.worldH - VIEW_H)));

    if (this.shakeTime > 0) this.shakeTime -= dt;
  }

  shake(mag, time) {
    this.shakeMag = mag;
    this.shakeTime = time;
  }

  offset() {
    if (this.shakeTime > 0) {
      const f = this.shakeTime;
      return {
        x: this.x + (Math.random() * 2 - 1) * this.shakeMag * f,
        y: this.y + (Math.random() * 2 - 1) * this.shakeMag * f,
      };
    }
    return { x: this.x, y: this.y };
  }
}
