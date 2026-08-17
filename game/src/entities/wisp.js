import { WISP_THROW_SPEED, WISP_RETURN_ACCEL, WISP_MAX_TIME } from '../engine/constants.js';
import { isSolid, isSwitch } from '../world/tilemap.js';

const TILE = 16;

export function makeWisp(x, y, dir) {
  return { x, y, vx: WISP_THROW_SPEED * dir, vy: 0, t: 0, returning: false, done: false, hitSwitch: false };
}

// Wisp flies out, ignores gravity, bounces back off walls or after its
// travel time expires, then homes in on the player to be reabsorbed.
export function updateWisp(w, dt, map, player) {
  w.t += dt;
  if (!w.returning) {
    w.x += w.vx * dt;
    const col = Math.floor((w.vx > 0 ? w.x + 3 : w.x - 3) / TILE);
    const row = Math.floor(w.y / TILE);
    if (isSolid(map.get(col, row))) w.returning = true;
    if (isSwitch(map.get(col, row)) && !w.hitSwitch) {
      w.hitSwitch = true;
      w.returning = true;
    }
    if (w.t > WISP_MAX_TIME) w.returning = true;
  } else {
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;
    const dx = targetX - w.x, dy = targetY - w.y;
    const dist = Math.hypot(dx, dy) || 1;
    w.vx += (dx / dist) * WISP_RETURN_ACCEL * dt;
    w.vy += (dy / dist) * WISP_RETURN_ACCEL * dt;
    const speed = Math.hypot(w.vx, w.vy);
    const maxSpeed = WISP_THROW_SPEED * 1.6;
    if (speed > maxSpeed) { w.vx = (w.vx / speed) * maxSpeed; w.vy = (w.vy / speed) * maxSpeed; }
    w.x += w.vx * dt;
    w.y += w.vy * dt;
    if (dist < 8) w.done = true;
  }
}
