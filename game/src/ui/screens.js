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

function confettiShape(ctx, kind, s) {
  ctx.beginPath();
  if (kind === 0) {
    // diamond
    ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.7, 0);
  } else if (kind === 1) {
    // four-point star (sparkle)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const r1 = s, r2 = s * 0.35;
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * r2, Math.sin(a + Math.PI / 4) * r2);
    }
  } else {
    // leaf / ribbon
    ctx.moveTo(0, -s); ctx.quadraticCurveTo(s, 0, 0, s); ctx.quadraticCurveTo(-s, 0, 0, -s);
  }
  ctx.closePath();
}

function drawConfetti(ctx, t, count) {
  const colors = ['#ffce54', '#ff8fb0', '#7ee8ff', '#a8ffb0', '#fff2a8'];
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 91.7;
    const x = ((Math.sin(seed) * 0.5 + 0.5) * (VIEW_W + 40)) - 20;
    const fallSpeed = 40 + (i % 6) * 12;
    const y = ((t * fallSpeed + seed * 5) % (VIEW_H + 30)) - 15;
    const spin = t * (2 + (i % 4)) + seed;
    const size = 1.6 + (i % 4) * 0.7;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    const color = colors[i % colors.length];
    ctx.fillStyle = color;
    confettiShape(ctx, i % 3, size);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.4;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawLogoText(ctx, text, cx, cy, t) {
  ctx.save();
  ctx.font = "900 34px 'Courier New', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Warm outer glow (pulses gently like an ember).
  const glowStrength = 14 + Math.sin(t * 2.2) * 3;
  ctx.shadowColor = 'rgba(255,140,40,0.75)';
  ctx.shadowBlur = glowStrength;
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#7a3a12';
  ctx.strokeText(text, cx, cy);
  ctx.shadowBlur = 0;

  // Thin dark inline for crispness at the letterform edges.
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#5a2a0e';
  ctx.strokeText(text, cx, cy);

  // Vertical ember gradient fill: pale gold top -> deep orange bottom.
  const grad = ctx.createLinearGradient(0, cy - 26, 0, cy + 6);
  grad.addColorStop(0, '#fff6c9');
  grad.addColorStop(0.45, '#ffce54');
  grad.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);

  // A single bright highlight streak across the top of the letters.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.rect(cx - 160, cy - 30, 320, 6);
  ctx.clip();
  ctx.fillText(text, cx, cy);
  ctx.restore();

  ctx.restore();
}

export function drawTitleScreen(ctx, t) {
  drawBackground(ctx, PALETTES.meadow, t * 8, 0, 0, t);
  drawSparkles(ctx, t, 22, ['#fff8e0', '#ffe9a8', '#fff']);
  ctx.save();
  ctx.translate(0, Math.sin(t * 1.4) * 2);
  drawLogoText(ctx, 'EMBERLEAP', VIEW_W / 2, 74, t);
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
