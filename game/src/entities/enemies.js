import { moveAndCollide } from '../engine/collision.js';
import { isSolid } from '../world/tilemap.js';
import { GRAVITY, MAX_FALL_SPEED } from '../engine/constants.js';

const TILE = 16;

export function makeEnemy(type, x, y) {
  const base = { type, x, y, vx: 0, vy: 0, alive: true, facing: -1, walkPhase: 0, t: 0, dead: false, deadTimer: 0 };
  if (type === 'puffshroom') return { ...base, w: 13, h: 12, vx: -26, speed: 26 };
  if (type === 'glimmoth') return { ...base, w: 13, h: 11, vx: -34, speed: 34, baseY: y, phase: Math.random() * 10 };
  if (type === 'shellbug') return { ...base, w: 13, h: 12, vx: -22, speed: 22, state: 'walk' };
  return base;
}

function ledgeAhead(e, map) {
  const dir = e.vx < 0 ? -1 : 1;
  const footY = Math.floor((e.y + e.h + 1) / TILE);
  const edgeX = Math.floor((dir < 0 ? e.x - 1 : e.x + e.w + 1) / TILE);
  const tile = map.get(edgeX, footY);
  return !isSolid(tile);
}

export function updateEnemy(e, dt, map, playerX) {
  if (e.dead) { e.deadTimer += dt; return; }
  e.t += dt;

  if (e.type === 'glimmoth') {
    e.x += e.vx * dt;
    e.y = e.baseY + Math.sin(e.t * 2 + e.phase) * 14;
    if (e.x < e.homeMinX) e.vx = e.speed;
    if (e.x > e.homeMaxX) e.vx = -e.speed;
    e.walkPhase += dt * 2.4;
    return;
  }

  if (e.type === 'shellbug' && e.state === 'shell') {
    e.walkPhase = 0;
    e.vy += GRAVITY * dt; if (e.vy > MAX_FALL_SPEED) e.vy = MAX_FALL_SPEED;
    moveAndCollide(e, dt, map);
    return;
  }
  if (e.type === 'shellbug' && e.state === 'kicked') {
    e.vy += GRAVITY * dt; if (e.vy > MAX_FALL_SPEED) e.vy = MAX_FALL_SPEED;
    const flags = moveAndCollide(e, dt, map);
    if (flags.onWallLeft) e.vx = Math.abs(e.vx);
    if (flags.onWallRight) e.vx = -Math.abs(e.vx);
    e.walkPhase += dt * 8;
    return;
  }

  // walking enemies (puffshroom, shellbug-walk)
  e.vy += GRAVITY * dt; if (e.vy > MAX_FALL_SPEED) e.vy = MAX_FALL_SPEED;
  if (Math.abs(e.x - playerX) < 200 && ledgeAhead(e, map)) {
    e.vx = -e.vx;
  }
  const flags = moveAndCollide(e, dt, map);
  if (flags.onWallLeft) e.vx = Math.abs(e.vx);
  if (flags.onWallRight) e.vx = -Math.abs(e.vx);
  e.facing = e.vx < 0 ? -1 : 1;
  e.walkPhase += dt * 2.2;
}
