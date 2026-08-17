import { moveAndCollide } from '../engine/collision.js';
import { GRAVITY, MAX_FALL_SPEED } from '../engine/constants.js';

export function makeItem(kind, x, y) {
  const floaty = kind === 'shard5';
  return {
    kind, x, y: y - 16, w: 10, h: 10, vx: floaty ? 0 : 34, vy: 0,
    emerging: true, emergeFrom: y, collected: false, t: 0, floaty,
  };
}

export function updateItem(it, dt, map) {
  it.t += dt;
  if (it.emerging) {
    it.y -= 30 * dt;
    if (it.emergeFrom - it.y >= 14) { it.emerging = false; }
    return;
  }
  if (it.floaty) return;
  it.vy += GRAVITY * dt; if (it.vy > MAX_FALL_SPEED) it.vy = MAX_FALL_SPEED;
  const flags = moveAndCollide(it, dt, map);
  if (flags.onWallLeft) it.vx = Math.abs(it.vx);
  if (flags.onWallRight) it.vx = -Math.abs(it.vx);
}
