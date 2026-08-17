import { TILE, MAX_FALL_SPEED } from './constants.js';
import { isSolid, isOneWay, isHazard, isGoal, T } from '../world/tilemap.js';

// Sweeps an AABB entity through the tilemap axis-by-axis. Entity needs
// x, y (top-left), w, h, vx, vy. Returns a flags object describing contact.
export function moveAndCollide(entity, dt, map, { ignoreOneWay = false } = {}) {
  const flags = {
    onGround: false, onCeiling: false, onWallLeft: false, onWallRight: false,
    hazard: false, goal: false, bumpedBlocks: [],
  };

  // --- Horizontal ---
  entity.x += entity.vx * dt;
  if (entity.vx !== 0) {
    const dir = entity.vx > 0 ? 1 : -1;
    const edgeX = dir > 0 ? entity.x + entity.w : entity.x;
    const topRow = Math.floor(entity.y / TILE);
    const botRow = Math.floor((entity.y + entity.h - 0.01) / TILE);
    const col = Math.floor(edgeX / TILE);
    for (let row = topRow; row <= botRow; row++) {
      const id = map.get(col, row);
      if (isSolid(id)) {
        if (dir > 0) entity.x = col * TILE - entity.w;
        else entity.x = (col + 1) * TILE;
        entity.vx = 0;
        if (dir > 0) flags.onWallRight = true; else flags.onWallLeft = true;
        break;
      }
    }
  }

  // --- Vertical ---
  entity.y += entity.vy * dt;
  if (entity.vy !== 0) {
    const dir = entity.vy > 0 ? 1 : -1;
    const edgeY = dir > 0 ? entity.y + entity.h : entity.y;
    const leftCol = Math.floor((entity.x + 1) / TILE);
    const rightCol = Math.floor((entity.x + entity.w - 1.01) / TILE);
    const row = Math.floor(edgeY / TILE);
    for (let col = leftCol; col <= rightCol; col++) {
      const id = map.get(col, row);
      const solid = isSolid(id);
      const oneway = !ignoreOneWay && isOneWay(id);
      if (solid || (oneway && dir > 0 && entity.vy > 0 && (entity.y + entity.h - entity.vy * dt) <= row * TILE + 1)) {
        if (dir > 0) {
          entity.y = row * TILE - entity.h;
          flags.onGround = true;
        } else {
          entity.y = (row + 1) * TILE;
          flags.onCeiling = true;
          if (id === T.BLOCK) flags.bumpedBlocks.push([col, row]);
          if (id === T.BREAKABLE) flags.bumpedBlocks.push([col, row, 'break']);
        }
        entity.vy = 0;
        break;
      }
    }
  }

  // --- Overlap checks for non-solid hazards/goal ---
  const tl = [Math.floor(entity.x / TILE), Math.floor(entity.y / TILE)];
  const br = [Math.floor((entity.x + entity.w - 1) / TILE), Math.floor((entity.y + entity.h - 1) / TILE)];
  for (let cy = tl[1]; cy <= br[1]; cy++) {
    for (let cx = tl[0]; cx <= br[0]; cx++) {
      const id = map.get(cx, cy);
      if (isHazard(id)) flags.hazard = true;
      if (isGoal(id)) flags.goal = true;
    }
  }

  if (entity.vy > MAX_FALL_SPEED) entity.vy = MAX_FALL_SPEED;
  return flags;
}

export function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
