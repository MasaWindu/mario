// Small hex color utilities for cheap directional-light shading —
// avoids needing a lit/painted asset pipeline while still giving every
// filled shape a highlight + shadow instead of one flat tone.

function clamp255(v) { return Math.max(0, Math.min(255, v)); }

function parseHex(color) {
  if (color.startsWith('rgb')) {
    const [r, g, b] = color.match(/[\d.]+/g).map(Number);
    return { r, g, b };
  }
  const h = color.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function lighten(hex, amt) {
  const { r, g, b } = parseHex(hex);
  return `rgb(${clamp255(r + amt)},${clamp255(g + amt)},${clamp255(b + amt)})`;
}

export function darken(hex, amt) {
  return lighten(hex, -amt);
}

// A radial "light source" gradient: bright highlight offset toward the
// light direction (default upper-left), fading to the base color, with
// a darker rim. Caller fills a path with this as fillStyle.
export function litRadial(ctx, cx, cy, r, baseHex, { lightX = -0.35, lightY = -0.5, strength = 46 } = {}) {
  const g = ctx.createRadialGradient(cx + lightX * r, cy + lightY * r, 0, cx, cy, r * 1.3);
  g.addColorStop(0, lighten(baseHex, strength));
  g.addColorStop(0.4, baseHex);
  g.addColorStop(1, darken(baseHex, strength * 0.85));
  return g;
}

export function litVertical(ctx, top, bottom, baseHex, strength = 34) {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, lighten(baseHex, strength));
  g.addColorStop(0.5, baseHex);
  g.addColorStop(1, darken(baseHex, strength));
  return g;
}
