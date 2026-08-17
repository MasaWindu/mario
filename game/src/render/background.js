import { VIEW_W, VIEW_H } from '../engine/constants.js';
import { litVertical, lighten } from './color.js';

function hillPath(ctx, camX, speed, baseY, amp, wave, offsetSeed) {
  ctx.beginPath();
  ctx.moveTo(-10, VIEW_H + 10);
  const scroll = camX * speed;
  for (let sx = -10; sx <= VIEW_W + 10; sx += 8) {
    const worldX = sx + scroll;
    const yy = baseY - Math.sin(worldX / wave + offsetSeed) * amp - Math.sin(worldX / (wave * 0.37) + offsetSeed * 2) * amp * 0.3;
    ctx.lineTo(sx, yy);
  }
  ctx.lineTo(VIEW_W + 10, VIEW_H + 10);
  ctx.closePath();
}

export function drawBackground(ctx, pal, camX, camY, levelHeightPx, t) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  skyGrad.addColorStop(0, pal.skyTop);
  skyGrad.addColorStop(1, pal.skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Sun/moon glow
  const glowX = VIEW_W * 0.78 - camX * 0.02;
  const glowY = VIEW_H * 0.22;
  const glow = ctx.createRadialGradient(glowX, glowY, 2, glowX, glowY, 46);
  glow.addColorStop(0, pal.sunGlow);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Clouds (2 parallax layers)
  for (let i = 0; i < 5; i++) {
    const bx = ((i * 137 - camX * 0.12) % (VIEW_W + 120)) - 60;
    const by = 20 + (i * 53) % 70 + Math.sin(t * 0.3 + i) * 2;
    drawCloud(ctx, bx + 3, by + 3, 14 + (i % 3) * 5, pal.cloudShade);
  }
  for (let i = 0; i < 5; i++) {
    const bx = ((i * 191 + 40 - camX * 0.2) % (VIEW_W + 140)) - 70;
    const by = 14 + (i * 41) % 60 + Math.sin(t * 0.3 + i * 1.7) * 2;
    drawCloud(ctx, bx, by, 12 + (i % 3) * 4, pal.cloud);
  }

  // Hills — vertical light-to-shadow gradient plus a bright rim on the
  // sun-facing crest so each band reads as a lit landform, not a flat cutout.
  drawHillBand(ctx, camX, 0.18, VIEW_H * 0.72, 10, 60, 1.2, pal.hillFar, VIEW_H * 0.15);
  drawHillBand(ctx, camX, 0.32, VIEW_H * 0.8, 8, 44, 3.4, pal.hillMid, VIEW_H * 0.13);
  drawHillBand(ctx, camX, 0.5, VIEW_H * 0.88, 6, 30, 6.1, pal.hillNear, VIEW_H * 0.11);
}

function drawHillBand(ctx, camX, speed, baseY, amp, wave, seed, color, bandH) {
  hillPath(ctx, camX, speed, baseY, amp, wave, seed);
  ctx.fillStyle = litVertical(ctx, baseY - bandH, baseY + amp, color, 22);
  ctx.fill();
  ctx.save();
  hillPath(ctx, camX, speed, baseY, amp, wave, seed);
  ctx.clip();
  ctx.strokeStyle = lighten(color, 55);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const scroll = camX * speed;
  for (let sx = -10; sx <= VIEW_W + 10; sx += 8) {
    const worldX = sx + scroll;
    const yy = baseY - Math.sin(worldX / wave + seed) * amp - Math.sin(worldX / (wave * 0.37) + seed * 2) * amp * 0.3;
    if (sx === -10) ctx.moveTo(sx, yy); else ctx.lineTo(sx, yy);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCloud(ctx, x, y, s, baseColor) {
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.55, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s * 0.7, y + s * 0.15, s * 0.65, s * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(x - s * 0.7, y + s * 0.2, s * 0.55, s * 0.35, 0, 0, Math.PI * 2);
  if (baseColor) {
    ctx.fillStyle = litVertical(ctx, y - s * 0.6, y + s * 0.5, baseColor, 16);
  }
  ctx.fill();
  // soft cool-grey underside shadow for volume
  ctx.fillStyle = 'rgba(120,140,170,0.14)';
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.32, s * 0.85, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
}
