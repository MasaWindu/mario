export function drawText(ctx, text, x, y, { size = 10, color = '#fff', stroke = '#1a1420', align = 'left', strokeWidth = 2, shadow = true } = {}) {
  ctx.save();
  ctx.font = `900 ${size}px 'Courier New', monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillText(text, x + 1.5, y + 1.5);
  }
  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
