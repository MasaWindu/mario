import { VIEW_W, VIEW_H } from '../engine/constants.js';
import { drawText } from './text.js';
import { drawKip, drawShard } from '../render/sprites.js';
import { drawBackground } from '../render/background.js';
import { PALETTES } from '../render/palette.js';

function drawSparkles(ctx, t, count, colors) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5;
    const x = (Math.sin(seed) * 0.5 + 0.5) * VIEW_W;
    const speed = 8 + (i % 5) * 3;
    const y = ((t * speed + seed * 3) % (VIEW_H + 20)) - 10;
    const s = 1 + (i % 3) * 0.6;
    ctx.globalAlpha = 0.5 + Math.sin(t * 3 + seed) * 0.3;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawConfetti(ctx, t, count) {
  const colors = ['#ffce54', '#ff8fb0', '#7ee8ff', '#a8ffb0', '#fff'];
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 91.7;
    const x = ((Math.sin(seed) * 0.5 + 0.5) * (VIEW_W + 40)) - 20;
    const fallSpeed = 40 + (i % 6) * 12;
    const y = ((t * fallSpeed + seed * 5) % (VIEW_H + 30)) - 15;
    const spin = t * (2 + (i % 4)) + seed;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-2, -1, 4, 2);
    ctx.restore();
  }
  ctx.restore();
}

export function drawTitleScreen(ctx, t) {
  drawBackground(ctx, PALETTES.meadow, t * 8, 0, 0, t);
  drawSparkles(ctx, t, 22, ['#fff8e0', '#ffe9a8', '#fff']);
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
  drawConfetti(ctx, t, 34);
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
  drawConfetti(ctx, t, 40);
  drawText(ctx, 'YOU SAVED THE GLADE!', VIEW_W / 2, 60, { size: 16, color: '#fff2a8', align: 'center' });
  const bob = Math.sin(t * 3) * 3;
  drawKip(ctx, VIEW_W / 2 - 8, 100 + bob, 16, 22, { facing: 1, form: 'ember', walkPhase: 0, idleT: t });
  drawText(ctx, `PRISM SHARDS COLLECTED: ${totalShards}`, VIEW_W / 2, 150, { size: 10, color: '#fff', align: 'center' });
  drawText(ctx, 'THANK YOU FOR PLAYING', VIEW_W / 2, 168, { size: 9, color: '#e8e8f0', align: 'center' });
  if (Math.sin(t * 4) > -0.2) drawText(ctx, 'PRESS ENTER FOR TITLE', VIEW_W / 2, 195, { size: 9, color: '#fff', align: 'center' });
}
