import { TILE } from '../engine/constants.js';
import { T, isSolid } from '../world/tilemap.js';
import { roundRect } from './sprites.js';
import { litVertical, lighten, darken } from './color.js';

// Deterministic per-tile pseudo-random 0..1, so shading variation is
// stable across frames instead of flickering.
function hash2(a, b) {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Renders visible tile range only. camX/camY are world px of camera top-left.
export function drawTileMap(ctx, map, pal, camX, camY, viewW, viewH, t) {
  const startCol = Math.max(0, Math.floor(camX / TILE) - 1);
  const endCol = Math.min(map.width - 1, Math.floor((camX + viewW) / TILE) + 1);
  const startRow = Math.max(0, Math.floor(camY / TILE) - 1);
  const endRow = Math.min(map.height - 1, Math.floor((camY + viewH) / TILE) + 1);

  for (let cy = startRow; cy <= endRow; cy++) {
    for (let cx = startCol; cx <= endCol; cx++) {
      const id = map.get(cx, cy);
      if (id === T.EMPTY) continue;
      const px = Math.round(cx * TILE - camX);
      const py = Math.round(cy * TILE - camY);
      drawTile(ctx, id, px, py, pal, cx, cy, map, t);
    }
  }
}

function neighborSolidAbove(map, cx, cy) {
  const id = map.get(cx, cy - 1);
  return id === T.SOLID || id === T.DECOR_SOLID;
}

function drawTile(ctx, id, px, py, pal, cx, cy, map, t) {
  switch (id) {
    case T.SOLID:
    case T.DECOR_SOLID: {
      const grassy = !neighborSolidAbove(map, cx, cy);
      // A smooth, low-frequency undulation (not per-tile random) breaks up
      // the mechanical repeated-tile look without creating a checkerboard
      // of hard tile-to-tile brightness seams — adjacent tiles blend into
      // one continuous terrain mass instead of reading as separate bricks.
      const jitter = Math.sin(cx * 0.22 + cy * 0.6) * 4;
      ctx.fillStyle = litVertical(ctx, py, py + TILE, lighten(pal.ground, jitter), 26);
      ctx.fillRect(px - 0.5, py, TILE + 1, TILE);
      ctx.fillStyle = pal.groundShade;
      ctx.fillRect(px, py + TILE - 3, TILE, 3);
      // ambient-occlusion only at the true silhouette edge of the ground
      // mass (open air beside it), never between two solid neighbors.
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      if (!isSolid(map.get(cx - 1, cy))) ctx.fillRect(px, py, 2.5, TILE);
      if (!isSolid(map.get(cx + 1, cy))) ctx.fillRect(px + TILE - 2.5, py, 2.5, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      if (!isSolid(map.get(cx - 1, cy))) ctx.fillRect(px + 2.5, py, 1, TILE);
      if (grassy) {
        ctx.fillStyle = litVertical(ctx, py - 2, py + 4, pal.groundTop, 26);
        ctx.fillRect(px, py, TILE, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(px, py, TILE, 1.5);
        ctx.fillStyle = pal.groundTop2;
        for (let i = 0; i < 3; i++) {
          const tx = px + 1 + i * 5 + Math.sin(cx * 3 + i) * 1.5;
          ctx.fillRect(tx, py - 2, 2, 3);
        }
      }
      break;
    }
    case T.ONEWAY: {
      ctx.fillStyle = litVertical(ctx, py + TILE * 0.35, py + TILE * 0.75, pal.brick, 32);
      roundRect(ctx, px, py + TILE * 0.35, TILE, TILE * 0.4, 2);
      ctx.fill();
      ctx.fillStyle = pal.brickLine;
      ctx.fillRect(px, py + TILE * 0.35, TILE, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(px + 1, py + TILE * 0.37, TILE - 2, 1);
      break;
    }
    case T.HAZARD: {
      ctx.fillStyle = pal.groundShade;
      for (let i = 0; i < 3; i++) {
        const bx = px + i * (TILE / 3);
        ctx.beginPath();
        ctx.moveTo(bx, py + TILE);
        ctx.lineTo(bx + TILE / 6, py + TILE * 0.3);
        ctx.lineTo(bx + TILE / 3, py + TILE);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = 0.5 + Math.sin(t * 6 + cx) * 0.2;
      for (let i = 0; i < 3; i++) {
        const bx = px + i * (TILE / 3);
        ctx.fillRect(bx + TILE / 6 - 0.5, py + TILE * 0.35, 1, 3);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case T.WATER: {
      ctx.fillStyle = pal.water;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = pal.waterLight;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py + 2 + Math.sin(t * 3 + cx) * 1.5);
      ctx.lineTo(px + TILE, py + 2 + Math.sin(t * 3 + cx + 1) * 1.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    case T.BLOCK: {
      const bounce = Math.sin(t * 3 + cx * 2) * 0.4;
      const bgrad = ctx.createLinearGradient(px, py, px, py + TILE);
      bgrad.addColorStop(0, '#fff6cf');
      bgrad.addColorStop(0.25, pal.block);
      bgrad.addColorStop(1, pal.blockShade);
      ctx.fillStyle = bgrad;
      roundRect(ctx, px + 1, py + 1, TILE - 2, TILE - 2, 3);
      ctx.fill();
      ctx.strokeStyle = pal.blockShade;
      ctx.lineWidth = 1.5;
      roundRect(ctx, px + 1.5, py + 1.5, TILE - 3, TILE - 3, 3);
      ctx.stroke();
      // corner rivets
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(px + 3, py + 3, 1.4, 1.4);
      ctx.fillRect(px + TILE - 4.4, py + 3, 1.4, 1.4);
      ctx.fillRect(px + 3, py + TILE - 4.4, 1.4, 1.4);
      ctx.fillRect(px + TILE - 4.4, py + TILE - 4.4, 1.4, 1.4);
      // top shine streak
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(px + 2.5, py + 2, TILE - 5, 1.4);
      ctx.fillStyle = pal.blockShade;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(px + TILE / 2, py + TILE / 2 + 3.5 + bounce);
      ctx.fillText('?', 0, 0);
      ctx.restore();
      break;
    }
    case T.BLOCK_USED: {
      ctx.fillStyle = litVertical(ctx, py, py + TILE, pal.blockUsed, 18);
      roundRect(ctx, px + 1, py + 1, TILE - 2, TILE - 2, 3);
      ctx.fill();
      break;
    }
    case T.BREAKABLE: {
      ctx.fillStyle = litVertical(ctx, py, py + TILE, pal.brick, 28);
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = pal.brickLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py + TILE / 2); ctx.lineTo(px + TILE, py + TILE / 2);
      ctx.moveTo(px + TILE / 2, py); ctx.lineTo(px + TILE / 2, py + TILE / 2);
      ctx.moveTo(px + TILE / 4, py + TILE / 2); ctx.lineTo(px + TILE / 4, py + TILE);
      ctx.moveTo(px + TILE * 0.75, py + TILE / 2); ctx.lineTo(px + TILE * 0.75, py + TILE);
      ctx.stroke();
      break;
    }
    case T.VINE: {
      ctx.strokeStyle = pal.vine;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const wob = Math.sin(t * 2 + cy) * 1.2;
      ctx.moveTo(px + TILE / 2 + wob, py);
      ctx.lineTo(px + TILE / 2 - wob, py + TILE);
      ctx.stroke();
      ctx.fillStyle = pal.vine;
      ctx.beginPath();
      ctx.ellipse(px + TILE / 2 + wob * 0.5, py + TILE * 0.4, 2.4, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case T.SWITCH: {
      const active = map.gatesOpen;
      ctx.fillStyle = pal.groundShade;
      ctx.fillRect(px + TILE * 0.35, py + TILE * 0.55, TILE * 0.3, TILE * 0.45);
      const pulse = 0.6 + Math.sin(t * 5) * 0.3;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = active ? `rgba(120,255,160,${0.5})` : `rgba(255,220,140,${0.35 + pulse * 0.2})`;
      ctx.beginPath(); ctx.arc(px + TILE / 2, py + TILE * 0.4, active ? 4 : 3 + pulse, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = active ? '#8affb0' : '#ffe9a8';
      ctx.beginPath(); ctx.arc(px + TILE / 2, py + TILE * 0.4, 2.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case T.GATE: {
      const pulse = 0.5 + Math.sin(t * 3 + cx) * 0.2;
      ctx.fillStyle = '#3a2140';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = `rgba(200,140,255,${pulse})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px + 3, py + TILE); ctx.lineTo(px + TILE * 0.5, py + 4); ctx.lineTo(px + TILE - 3, py + TILE);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillStyle = '#c88fff';
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      ctx.globalAlpha = 1;
      break;
    }
    case T.GOAL: {
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + TILE / 2, py);
      ctx.lineTo(px + TILE / 2, py + TILE);
      ctx.stroke();
      break;
    }
  }
}
