import { VIEW_W, VIEW_H } from '../engine/constants.js';
import { drawText } from './text.js';
import { drawKip, drawShard } from '../render/sprites.js';
import { drawBackground } from '../render/background.js';
import { PALETTES } from '../render/palette.js';

export function drawTitleScreen(ctx, t) {
  drawBackground(ctx, PALETTES.meadow, t * 8, 0, 0, t);
  ctx.save();
  ctx.translate(0, Math.sin(t * 1.4) * 2);
  drawText(ctx, 'EMBERLEAP', VIEW_W / 2, 74, { size: 34, color: '#ffce54', stroke: '#7a3a12', strokeWidth: 4, align: 'center' });
  drawText(ctx, 'a Kip adventure', VIEW_W / 2, 90, { size: 9, color: '#fff', align: 'center' });
  ctx.restore();

  const bob = Math.sin(t * 3) * 2;
  drawKip(ctx, VIEW_W / 2 - 6, 118 + bob, 12, 14, { facing: 1, form: 'ember', walkPhase: t * 1.5, idleT: t });

  if (Math.sin(t * 4) > -0.2) {
    drawText(ctx, 'PRESS ENTER', VIEW_W / 2, 165, { size: 12, color: '#fff', align: 'center' });
  }
  drawText(ctx, '← → move   Z jump   SHIFT run   X dash/toss', VIEW_W / 2, 190, { size: 7, color: '#e8e8f0', align: 'center' });
  drawText(ctx, '2026  ORIGINAL WORK  ·  NOT AFFILIATED WITH NINTENDO', VIEW_W / 2, 210, { size: 6, color: '#c9c9d8', align: 'center' });
}

export function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(6,8,14,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawText(ctx, 'PAUSED', VIEW_W / 2, VIEW_H / 2 - 4, { size: 20, color: '#fff', align: 'center' });
  drawText(ctx, 'press ESC / P to resume', VIEW_W / 2, VIEW_H / 2 + 14, { size: 9, color: '#cfd', align: 'center' });
}

export function drawLevelClear(ctx, t, shards, timeBonus) {
  ctx.fillStyle = 'rgba(10,14,10,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawText(ctx, 'LEVEL CLEAR!', VIEW_W / 2, 70, { size: 22, color: '#ffe082', align: 'center' });
  drawShard(ctx, VIEW_W / 2 - 40, 100, t);
  drawText(ctx, `x ${shards}`, VIEW_W / 2 - 24, 104, { size: 12, color: '#fff', align: 'left' });
  drawText(ctx, `TIME BONUS +${timeBonus}`, VIEW_W / 2, 124, { size: 10, color: '#a8ffb0', align: 'center' });
}

export function drawGameOver(ctx, t) {
  ctx.fillStyle = 'rgba(20,4,4,0.7)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawText(ctx, 'GAME OVER', VIEW_W / 2, VIEW_H / 2 - 4, { size: 22, color: '#ff6b5c', align: 'center' });
  if (Math.sin(t * 4) > -0.2) drawText(ctx, 'PRESS ENTER', VIEW_W / 2, VIEW_H / 2 + 18, { size: 10, color: '#fff', align: 'center' });
}

export function drawWinScreen(ctx, t, totalShards) {
  drawBackground(ctx, PALETTES.sky, t * 10, 0, 0, t);
  drawText(ctx, 'YOU SAVED THE GLADE!', VIEW_W / 2, 60, { size: 16, color: '#fff2a8', align: 'center' });
  const bob = Math.sin(t * 3) * 3;
  drawKip(ctx, VIEW_W / 2 - 8, 100 + bob, 16, 22, { facing: 1, form: 'ember', walkPhase: 0, idleT: t });
  drawText(ctx, `PRISM SHARDS COLLECTED: ${totalShards}`, VIEW_W / 2, 150, { size: 10, color: '#fff', align: 'center' });
  drawText(ctx, 'THANK YOU FOR PLAYING', VIEW_W / 2, 168, { size: 9, color: '#e8e8f0', align: 'center' });
  if (Math.sin(t * 4) > -0.2) drawText(ctx, 'PRESS ENTER FOR TITLE', VIEW_W / 2, 195, { size: 9, color: '#fff', align: 'center' });
}
