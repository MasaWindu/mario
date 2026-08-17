import { KIP } from './palette.js';

export function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.arcTo(x + w, y, x + w, y + r.tr, r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.arcTo(x + w, y + h, x + w - r.br, y + h, r.br);
  ctx.lineTo(x + r.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - r.bl, r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.arcTo(x, y, x + r.tl, y, r.tl);
  ctx.closePath();
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
}

export function drawShadow(ctx, cx, feetY, radiusX, alpha = 0.28) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(cx, feetY + 1, radiusX, radiusX * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- KIP the player character -------------------------------------------
// state: { facing, form, walkPhase, airborne, vy, crouching, wallSliding,
//          dashing, hurtFlicker, idleT, throwing }
export function drawKip(ctx, x, y, w, h, state) {
  const { facing = 1, form = 'small', walkPhase = 0, airborne = false, vy = 0, vx = 0,
    crouching = false, wallSliding = false, dashing = false, hurtFlicker = false,
    idleT = 0, throwing = false, landSquash = 0 } = state;

  if (hurtFlicker) { ctx.globalAlpha = 0.45; }

  ctx.save();
  const cx = x + w / 2;
  const feetY = y + h;
  ctx.translate(cx, feetY);
  const lean = dashing ? 0.32 * Math.sign(vx || facing) : Math.max(-0.22, Math.min(0.22, vx / 260));
  ctx.rotate(lean);
  ctx.scale(facing, 1);

  const big = form !== 'small';
  const ember = form === 'ember';
  const bodyH = crouching ? h * 0.62 : h;
  const landSquashAmt = landSquash * 0.22;
  const squash = (airborne ? (vy < 0 ? 1.08 : 0.94) : (1 - Math.abs(Math.sin(walkPhase * Math.PI)) * 0.05)) - landSquashAmt;
  const stretch = (airborne ? (vy < 0 ? 0.92 : 1.06) : (1 + Math.abs(Math.sin(walkPhase * Math.PI)) * 0.04)) + landSquashAmt * 1.4;

  const legSwing = airborne ? 0.25 : Math.sin(walkPhase * Math.PI * 2) * 0.55;
  const legLen = big ? 6 : 4.5;
  const legW = 3.4;
  const hipY = -legLen;

  const scarfCol = ember ? KIP.scarfEmber : KIP.scarf;
  const scarfShadeCol = ember ? KIP.scarfEmberShade : KIP.scarfShade;

  // Tail
  ctx.fillStyle = KIP.furShade;
  const tailWag = Math.sin(idleT * 3 + walkPhase * 6) * 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, hipY - 1);
  ctx.quadraticCurveTo(-w * 0.42 - 5, hipY - 5 + tailWag, -w * 0.3 - 4, hipY - 10 + tailWag);
  ctx.quadraticCurveTo(-w * 0.42 - 6, hipY - 6 + tailWag, -w * 0.42 - 2, hipY - 2);
  ctx.fill();

  // Back leg
  if (!crouching) {
    ctx.fillStyle = KIP.furDark;
    roundRect(ctx, -legW / 2 - legSwing * 2, hipY, legW, legLen, 1.6);
    ctx.fill();
  }

  // Body
  const bodyCol = ember ? KIP.furEmber : KIP.fur;
  ctx.fillStyle = bodyCol;
  const bw = (big ? w * 0.95 : w * 0.86) * stretch;
  const bh = bodyH * squash;
  roundRect(ctx, -bw / 2, hipY - bh, bw, bh, bw * 0.42);
  ctx.fill();

  // Arms — cream-toned like the belly so they read as a distinct limb
  // against the body fill at any form/color (small, big, ember).
  const armLen = (big ? w * 0.56 : w * 0.46);
  const armW = big ? 3.2 : 2.7;
  const shoulderY = hipY - bh * 0.8;
  const runCycle = Math.sin(walkPhase * Math.PI * 2);
  let backArmAngle, frontArmAngle;
  if (throwing) {
    backArmAngle = -0.35; frontArmAngle = 1.65;
  } else if (dashing) {
    backArmAngle = -1.35; frontArmAngle = -1.05;
  } else if (airborne) {
    backArmAngle = vy < 0 ? 1.55 : 0.5;
    frontArmAngle = vy < 0 ? 1.9 : 0.9;
  } else if (Math.abs(runCycle) > 0.02 && !crouching) {
    backArmAngle = runCycle * 0.85;
    frontArmAngle = -runCycle * 0.85;
  } else {
    const idleSway = Math.sin(idleT * 1.6) * 0.08;
    backArmAngle = idleSway; frontArmAngle = -idleSway;
  }

  function drawArm(angle, shade) {
    ctx.save();
    ctx.translate(0, shoulderY);
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(60,35,15,0.4)';
    ctx.lineWidth = 0.7;
    roundRect(ctx, -armW / 2, 0, armW, armLen, armW * 0.5);
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shade;
    ellipse(ctx, 0, armLen, armW * 0.55, armW * 0.55);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,15,0.4)';
    ctx.beginPath(); ctx.ellipse(0, armLen, armW * 0.55, armW * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  drawArm(backArmAngle, KIP.bellyShade);

  // Belly
  ctx.fillStyle = KIP.belly;
  const belW = bw * 0.55, belH = bh * 0.62;
  roundRect(ctx, -belW / 2 + 0.5, hipY - belH - 1, belW, belH, belW * 0.4);
  ctx.fill();

  drawArm(frontArmAngle, KIP.belly);

  // Front leg
  if (!crouching) {
    ctx.fillStyle = KIP.fur;
    roundRect(ctx, -legW / 2 + legSwing * 2, hipY, legW, legLen, 1.6);
    ctx.fill();
  } else {
    ctx.fillStyle = KIP.fur;
    roundRect(ctx, -bw * 0.4, hipY + 1, bw * 0.8, 3, 1.4);
    ctx.fill();
  }

  // Scarf
  const scarfY = hipY - bh + bh * 0.22;
  ctx.fillStyle = scarfCol;
  ctx.beginPath();
  ctx.moveTo(-bw * 0.5, scarfY - 1.5);
  ctx.quadraticCurveTo(0, scarfY + 2.5, bw * 0.55, scarfY - 0.5);
  ctx.quadraticCurveTo(0, scarfY + 5, -bw * 0.5, scarfY + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = scarfShadeCol;
  const flow = (dashing ? -6 : 0) - facing * 0 + Math.sin(idleT * 4 + walkPhase * 4) * 1.4;
  ctx.beginPath();
  ctx.moveTo(bw * 0.35, scarfY - 0.5);
  ctx.quadraticCurveTo(bw * 0.7 + flow, scarfY + 1 + flow * 0.3, bw * 0.95 + flow * 1.4, scarfY - 1 + flow * 0.5);
  ctx.quadraticCurveTo(bw * 0.6 + flow, scarfY + 2.5, bw * 0.3, scarfY + 1.5);
  ctx.closePath();
  ctx.fill();

  // Head
  const headR = (big ? w * 0.5 : w * 0.46);
  const headY = hipY - bh - headR * 0.72;
  const headBob = airborne ? 0 : Math.sin(walkPhase * Math.PI * 2) * -0.6;
  ctx.fillStyle = ember ? KIP.furEmber : KIP.fur;
  ellipse(ctx, headR * 0.06, headY + headBob, headR * 0.98, headR);
  ctx.fill();

  // Ears
  const earFlop = wallSliding ? 0.6 : (airborne && vy < 0 ? -0.3 : 0.05);
  ctx.fillStyle = ember ? KIP.furEmber : KIP.fur;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.55, headY - headR * 0.55 + headBob);
  ctx.lineTo(-headR * 0.95, headY - headR * 1.7 + headBob + earFlop * headR);
  ctx.lineTo(-headR * 0.1, headY - headR * 0.75 + headBob);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = KIP.ear;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.5, headY - headR * 0.65 + headBob);
  ctx.lineTo(-headR * 0.72, headY - headR * 1.35 + headBob + earFlop * headR);
  ctx.lineTo(-headR * 0.22, headY - headR * 0.78 + headBob);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = KIP.fur;
  ctx.beginPath();
  ctx.moveTo(headR * 0.15, headY - headR * 0.6 + headBob);
  ctx.lineTo(headR * 0.55, headY - headR * 1.75 + headBob + earFlop * headR);
  ctx.lineTo(headR * 0.7, headY - headR * 0.7 + headBob);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = KIP.ear;
  ctx.beginPath();
  ctx.moveTo(headR * 0.2, headY - headR * 0.68 + headBob);
  ctx.lineTo(headR * 0.42, headY - headR * 1.45 + headBob + earFlop * headR);
  ctx.lineTo(headR * 0.5, headY - headR * 0.78 + headBob);
  ctx.closePath(); ctx.fill();

  // Muzzle + face
  ctx.fillStyle = KIP.belly;
  ellipse(ctx, headR * 0.42, headY + headR * 0.18 + headBob, headR * 0.42, headR * 0.32);
  ctx.fill();
  ctx.fillStyle = KIP.nose;
  ellipse(ctx, headR * 0.72, headY + headR * 0.1 + headBob, headR * 0.13, headR * 0.11);
  ctx.fill();

  const blink = (Math.sin(idleT * 0.7) > 0.985) ? 0.15 : 1;
  ctx.fillStyle = KIP.eye;
  ellipse(ctx, headR * 0.28, headY - headR * 0.06 + headBob, headR * 0.14, headR * 0.16 * blink);
  ctx.fill();
  if (blink > 0.5) {
    ctx.fillStyle = KIP.eyeShine;
    ellipse(ctx, headR * 0.32, headY - headR * 0.12 + headBob, headR * 0.045, headR * 0.05);
    ctx.fill();
  }

  if (ember) {
    ctx.globalCompositeOperation = 'lighter';
    const bodyGlowR = bw * (1.7 + Math.sin(idleT * 6) * 0.1);
    const bodyGrad = ctx.createRadialGradient(0, hipY - bh * 0.4, 0, 0, hipY - bh * 0.4, bodyGlowR);
    bodyGrad.addColorStop(0, 'rgba(255,140,50,0.4)');
    bodyGrad.addColorStop(1, 'rgba(255,140,50,0)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.arc(0, hipY - bh * 0.4, bodyGlowR, 0, Math.PI * 2); ctx.fill();

    const glowR = headR * (1.7 + Math.sin(idleT * 8) * 0.1);
    const grad = ctx.createRadialGradient(0, headY + headBob, 0, 0, headY + headBob, glowR);
    grad.addColorStop(0, 'rgba(255,180,80,0.55)');
    grad.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, headY + headBob, glowR, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }


  ctx.restore();
  ctx.globalAlpha = 1;
}

// --- Enemies ---------------------------------------------------------------

export function drawPuffshroom(ctx, x, y, w, h, facing, walkPhase, squished) {
  ctx.save();
  const cx = x + w / 2, baseY = y + h;
  ctx.translate(cx, baseY);
  ctx.scale(facing, 1);
  if (squished) {
    ctx.fillStyle = '#c96b6b';
    ellipse(ctx, 0, -1.5, w * 0.55, 2.5); ctx.fill();
    ctx.restore(); return;
  }
  const bob = Math.sin(walkPhase * Math.PI * 2) * 0.6;
  // feet
  ctx.fillStyle = '#7a3a3a';
  roundRect(ctx, -w * 0.32, -3 + bob, 3, 3, 1); ctx.fill();
  roundRect(ctx, w * 0.02, -3 - bob, 3, 3, 1); ctx.fill();
  // body cap
  ctx.fillStyle = '#e0554f';
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.55 + bob * 0.5, w * 0.52, h * 0.5, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#f2837c';
  ellipse(ctx, -w * 0.18, -h * 0.62 + bob * 0.5, 1.6, 1.3); ctx.fill();
  ellipse(ctx, w * 0.15, -h * 0.5 + bob * 0.5, 1.2, 1); ctx.fill();
  // stem/face band
  ctx.fillStyle = '#fbe3c4';
  roundRect(ctx, -w * 0.4, -h * 0.42 + bob * 0.5, w * 0.8, h * 0.28, 2); ctx.fill();
  // eyes
  ctx.fillStyle = '#241614';
  ellipse(ctx, -w * 0.14, -h * 0.32 + bob * 0.5, 1.1, 1.3); ctx.fill();
  ellipse(ctx, w * 0.14, -h * 0.32 + bob * 0.5, 1.1, 1.3); ctx.fill();
  ctx.restore();
}

export function drawGlimmoth(ctx, x, y, w, h, facing, flapPhase, t) {
  ctx.save();
  const cx = x + w / 2, cy = y + h / 2 + Math.sin(t * 3) * 1.5;
  ctx.translate(cx, cy);
  ctx.scale(facing, 1);
  const flap = Math.sin(flapPhase * Math.PI * 2);
  const wingLift = 0.55 + flap * 0.45;

  function wing(dir, lift) {
    ctx.save();
    ctx.scale(dir, 1);
    ctx.fillStyle = '#6a4bc4';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.1);
    ctx.quadraticCurveTo(-w * 0.55, -h * 1.05 * lift, -w * 1.05, -h * 0.25 * lift);
    ctx.quadraticCurveTo(-w * 0.85, h * 0.35, -w * 0.4, h * 0.3);
    ctx.quadraticCurveTo(-w * 0.35, h * 0.05, 0, h * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, -h * 0.05);
    ctx.lineTo(-w * 0.75, -h * 0.55 * lift);
    ctx.moveTo(-w * 0.15, h * 0.05);
    ctx.lineTo(-w * 0.6, h * 0.15);
    ctx.stroke();
    ctx.restore();
  }

  wing(-1, wingLift);
  wing(1, 1.1 - wingLift * 0.55 + 0.35);

  // Body
  ctx.fillStyle = '#5c3fa6';
  ellipse(ctx, 0, 0, w * 0.32, h * 0.38); ctx.fill();
  ctx.fillStyle = '#4a3092';
  ellipse(ctx, 0, h * 0.14, w * 0.2, h * 0.2); ctx.fill();

  // Ears / antennae
  ctx.strokeStyle = '#5c3fa6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, -h * 0.32); ctx.quadraticCurveTo(-w * 0.3, -h * 0.6, -w * 0.22, -h * 0.68);
  ctx.moveTo(w * 0.14, -h * 0.32); ctx.quadraticCurveTo(w * 0.3, -h * 0.6, w * 0.22, -h * 0.68);
  ctx.stroke();
  ctx.fillStyle = '#ffd9f0';
  ellipse(ctx, -w * 0.22, -h * 0.68, 0.9, 0.9); ctx.fill();
  ellipse(ctx, w * 0.22, -h * 0.68, 0.9, 0.9); ctx.fill();

  // Eyes
  ctx.fillStyle = '#1c1430';
  ellipse(ctx, -w * 0.11, -h * 0.06, 1.3, 1.5); ctx.fill();
  ellipse(ctx, w * 0.11, -h * 0.06, 1.3, 1.5); ctx.fill();
  ctx.fillStyle = '#ffd9f0';
  ellipse(ctx, -w * 0.08, -h * 0.12, 0.4, 0.45); ctx.fill();
  ellipse(ctx, w * 0.14, -h * 0.12, 0.4, 0.45); ctx.fill();
  ctx.restore();
}

export function drawShellbug(ctx, x, y, w, h, facing, walkPhase, inShell) {
  ctx.save();
  const cx = x + w / 2, baseY = y + h;
  ctx.translate(cx, baseY);
  ctx.scale(facing, 1);
  if (inShell) {
    ctx.fillStyle = '#3e9c6f';
    ellipse(ctx, 0, -h * 0.5, w * 0.5, h * 0.5); ctx.fill();
    ctx.fillStyle = '#2f7a56';
    for (let i = -1; i <= 1; i++) {
      ellipse(ctx, i * w * 0.28, -h * 0.5, w * 0.14, h * 0.32); ctx.fill();
    }
    ctx.restore(); return;
  }
  const bob = Math.sin(walkPhase * Math.PI * 2) * 0.5;
  ctx.fillStyle = '#2a2a3a';
  for (let i = -1; i <= 1; i += 2) {
    roundRect(ctx, i * w * 0.22 - 1, -2.6 + (i > 0 ? bob : -bob), 2.2, 2.6, 1); ctx.fill();
  }
  ctx.fillStyle = '#3e9c6f';
  ellipse(ctx, 0, -h * 0.62, w * 0.5, h * 0.42); ctx.fill();
  ctx.fillStyle = '#2f7a56';
  ellipse(ctx, -w * 0.15, -h * 0.68, w * 0.14, h * 0.24); ctx.fill();
  ellipse(ctx, w * 0.16, -h * 0.68, w * 0.14, h * 0.24); ctx.fill();
  ctx.fillStyle = '#cdeee0';
  ellipse(ctx, w * 0.3, -h * 0.4, w * 0.22, h * 0.2); ctx.fill();
  ctx.fillStyle = '#1c1c26';
  ellipse(ctx, w * 0.35, -h * 0.42, 1, 1.1); ctx.fill();
  ctx.restore();
}

// --- Pickups ---------------------------------------------------------------

export function drawShard(ctx, x, y, t) {
  ctx.save();
  const spin = Math.sin(t * 4);
  ctx.translate(x, y + Math.sin(t * 3) * 1.2);
  ctx.scale(Math.max(0.15, Math.abs(spin)), 1);
  const grad = ctx.createLinearGradient(0, -5, 0, 5);
  grad.addColorStop(0, '#fff6c9');
  grad.addColorStop(0.5, '#ffce54');
  grad.addColorStop(1, '#e08a1f');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -5); ctx.lineTo(3.2, -1); ctx.lineTo(0, 5); ctx.lineTo(-3.2, -1);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawPowerItem(ctx, x, y, type, t) {
  ctx.save();
  ctx.translate(x, y);
  if (type === 'power') {
    ctx.fillStyle = '#ff6b3d';
    roundRect(ctx, -5, -8, 10, 16, 3); ctx.fill();
    ctx.fillStyle = '#ffd9a0';
    ellipse(ctx, 0, -3, 3.6, 3.6); ctx.fill();
    ctx.fillStyle = '#3a2418';
    ellipse(ctx, -1.2, -3.5, 0.7, 0.8); ctx.fill();
    ellipse(ctx, 1.2, -3.5, 0.7, 0.8); ctx.fill();
  } else if (type === 'wing') {
    ctx.fillStyle = '#7ee8ff';
    const flap = Math.sin(t * 10) * 3;
    ctx.beginPath();
    ctx.ellipse(-3, 0, 4, 2.4 + flap * 0.2, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3, 0, 4, 2.4 - flap * 0.2, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe082';
    ellipse(ctx, 0, 0, 2.4, 2.4); ctx.fill();
  } else {
    ctx.fillStyle = '#3ec9ff';
    roundRect(ctx, -5, -8, 10, 16, 3); ctx.fill();
    ctx.fillStyle = '#eafcff';
    ellipse(ctx, 0, -3, 3.6, 3.6); ctx.fill();
  }
  ctx.restore();
}

export function drawDecor(ctx, type, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  if (type === 'flower') {
    const sway = Math.sin(t * 2 + x) * 1.2;
    ctx.strokeStyle = '#3e9c4f'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sway * 0.4, -6); ctx.stroke();
    ctx.fillStyle = '#ff8fb0';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, sway * 0.4 + Math.cos(a) * 2.2, -6 + Math.sin(a) * 2.2, 1.6, 1.6);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe082';
    ellipse(ctx, sway * 0.4, -6, 1.4, 1.4); ctx.fill();
  } else if (type === 'crystal') {
    const glow = 0.5 + Math.sin(t * 3 + x) * 0.3;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(140,110,255,${0.25 + glow * 0.2})`;
    ctx.beginPath(); ctx.arc(0, -4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#a68fff';
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(3.4, -5); ctx.lineTo(0, 0); ctx.lineTo(-3.4, -5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9ccff';
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(1.4, -6); ctx.lineTo(0, -2); ctx.closePath(); ctx.fill();
  } else if (type === 'cloudpuff') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const bob = Math.sin(t * 1.5 + x) * 1.5;
    ellipse(ctx, 0, bob, 6, 3.2); ctx.fill();
    ellipse(ctx, 4, 1 + bob, 4, 2.4); ctx.fill();
    ellipse(ctx, -4, 1 + bob, 4, 2.4); ctx.fill();
  }
  ctx.restore();
}

export function drawWisp(ctx, x, y, t, held) {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 1 + Math.sin(t * 8) * 0.15;
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 7 * pulse);
  grad.addColorStop(0, 'rgba(255,255,220,0.9)');
  grad.addColorStop(0.5, 'rgba(255,220,140,0.4)');
  grad.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, 0, 7 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fff8e0';
  ellipse(ctx, 0, 0, 2.2, 2.2); ctx.fill();
  ctx.restore();
}
