// Lightweight pooled particle system.

export class ParticleSystem {
  constructor(maxParticles = 400) {
    this.max = maxParticles;
    this.list = [];
  }

  spawn(p) {
    if (this.list.length >= this.max) this.list.shift();
    this.list.push({
      x: p.x, y: p.y, vx: p.vx || 0, vy: p.vy || 0,
      life: p.life, maxLife: p.life,
      size: p.size || 2, color: p.color || '#fff',
      gravity: p.gravity ?? 600, drag: p.drag ?? 0.98,
      shape: p.shape || 'square', fadeOut: p.fadeOut !== false,
    });
  }

  burst(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = opts.angleMin != null
        ? opts.angleMin + Math.random() * (opts.angleMax - opts.angleMin)
        : Math.random() * Math.PI * 2;
      const speed = (opts.speedMin ?? 40) + Math.random() * ((opts.speedMax ?? 120) - (opts.speedMin ?? 40));
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: (opts.lifeMin ?? 0.3) + Math.random() * ((opts.lifeMax ?? 0.6) - (opts.lifeMin ?? 0.3)),
        size: opts.size ?? (1 + Math.random() * 2),
        color: Array.isArray(opts.colors) ? opts.colors[(Math.random() * opts.colors.length) | 0] : (opts.color || '#fff'),
        gravity: opts.gravity ?? 500,
        shape: opts.shape || 'square',
      });
    }
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx, camX, camY) {
    for (const p of this.list) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = p.fadeOut ? Math.max(0, t) : 1;
      ctx.fillStyle = p.color;
      const sx = Math.round(p.x - camX);
      const sy = Math.round(p.y - camY);
      const s = Math.max(1, Math.round(p.size * (0.5 + t * 0.5)));
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(sx, sy, s / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }
}
