import { VIEW_W, VIEW_H } from './engine/constants.js';
import { Input } from './engine/input.js';
import { AudioEngine } from './engine/audio.js';
import { startLoop } from './engine/loop.js';
import { Game } from './game.js';

const RENDER_SCALE = 3;

const canvas = document.getElementById('game');
canvas.width = VIEW_W * RENDER_SCALE;
canvas.height = VIEW_H * RENDER_SCALE;
const ctx = canvas.getContext('2d');
ctx.scale(RENDER_SCALE, RENDER_SCALE);

const input = new Input(window);
const audio = new AudioEngine();
const game = new Game(ctx, input, audio);

// Resume audio context on first user gesture (browser autoplay policy).
window.addEventListener('keydown', () => audio.resume(), { once: true });
window.addEventListener('pointerdown', () => audio.resume(), { once: true });

const fpsEl = document.getElementById('fps');

startLoop({
  update: (dt) => game.update(dt),
  render: (alpha, fps) => {
    game.render(alpha, fps);
    if (fpsEl) fpsEl.textContent = `${fps} fps`;
  },
});
