import { VIEW_W } from '../engine/constants.js';
import { drawText } from './text.js';
import { drawShard } from '../render/sprites.js';

export function drawHUD(ctx, player, levelName, timeLeft, t, levelIndex, totalLevels) {
  ctx.save();
  const barGrad = ctx.createLinearGradient(0, 0, 0, 20);
  barGrad.addColorStop(0, 'rgba(8,10,18,0.55)');
  barGrad.addColorStop(1, 'rgba(8,10,18,0.22)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, VIEW_W, 20);

  // Health plate (primary — biggest, brightest, top-left)
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  roundedPlate(ctx, 4, 3, 18 + Math.max(3, player.lives) * 13, 13, 4);
  const maxHeartSlots = Math.max(3, player.lives);
  for (let i = 0; i < maxHeartSlots; i++) {
    drawHeart(ctx, 13 + i * 13, 9.5, i < player.lives);
  }

  // Currency (secondary — smaller, right of health)
  const shardX = 18 + maxHeartSlots * 13 + 8;
  drawShard(ctx, shardX, 9, t * 0.8);
  drawText(ctx, `${player.shards}`, shardX + 7, 12, { size: 8, color: '#ffe9a8' });

  // Level name (tertiary — smallest, muted, center)
  drawText(ctx, `${levelName.toUpperCase()}`, VIEW_W / 2, 10, { size: 7, color: 'rgba(255,255,255,0.75)', align: 'center' });
  drawText(ctx, `${levelIndex + 1} / ${totalLevels}`, VIEW_W / 2, 18, { size: 6, color: 'rgba(255,255,255,0.5)', align: 'center' });

  // Timer (secondary — right side, warns when low)
  const timeStr = Math.max(0, Math.ceil(timeLeft)).toString().padStart(3, '0');
  const urgent = timeLeft < 30;
  drawText(ctx, timeStr, VIEW_W - 8, 14, { size: urgent ? 12 : 10, color: urgent ? '#ff7a5c' : '#fff', align: 'right' });

  ctx.restore();
}

function roundedPlate(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  if (filled) {
    ctx.shadowColor = 'rgba(255,92,122,0.6)';
    ctx.shadowBlur = 3;
  }
  ctx.fillStyle = filled ? '#ff5c7a' : 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(0, 3.4);
  ctx.bezierCurveTo(-5.6, -3.2, -5.6, 3.4, 0, 6.8);
  ctx.bezierCurveTo(5.6, 3.4, 5.6, -3.2, 0, 3.4);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (filled) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ellipse(ctx, -1.6, 0, 0.8, 1.1);
  }
  ctx.restore();
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
