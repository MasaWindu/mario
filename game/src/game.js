import { VIEW_W, VIEW_H, STOMP_BOUNCE_VELOCITY, TILE } from './engine/constants.js';
import { Camera } from './engine/camera.js';
import { ParticleSystem } from './engine/particles.js';
import { aabbOverlap } from './engine/collision.js';
import { LEVELS } from './world/levels.js';
import { T, isSolid } from './world/tilemap.js';
import { Player } from './entities/player.js';
import { makeEnemy, updateEnemy } from './entities/enemies.js';
import { makeItem, updateItem } from './entities/items.js';
import { makeWisp, updateWisp } from './entities/wisp.js';
import { drawBackground } from './render/background.js';
import { drawTileMap } from './render/tiles.js';
import { drawKip, drawPuffshroom, drawGlimmoth, drawShellbug, drawShard, drawPowerItem, drawDecor, drawWisp, drawShadow } from './render/sprites.js';
import { drawHUD } from './ui/hud.js';
import { drawTitleScreen, drawPauseOverlay, drawLevelClear, drawGameOver, drawWinScreen } from './ui/screens.js';
import { PALETTES } from './render/palette.js';

const LEVEL_TIME = 300;

export class Game {
  constructor(ctx, input, audio) {
    this.ctx = ctx;
    this.input = input;
    this.audio = audio;
    this.state = 'TITLE';
    this.t = 0;
    this.levelIndex = 0;
    this.totalShards = 0;
    this.transitionTimer = 0;
    this.timeBonus = 0;
    window.__EMBERLEAP__ = this; // debug/test hook
  }

  loadLevel(index) {
    const def = LEVELS[index];
    this.map = def.build();
    this.levelName = def.name;
    this.player = new Player(this.map.start.x, this.map.start.y);
    this.player.shards = this.totalShards;
    this.enemies = this.map.enemies.map((e) => {
      const en = makeEnemy(e.type, e.x, e.y);
      en.homeMinX = e.x - 60; en.homeMaxX = e.x + 60;
      return en;
    });
    this.items = (this.map.pickups || []).map((pk) => {
      const it = makeItem(pk.kind, pk.x, pk.y);
      it.emerging = false;
      it.y = pk.y;
      return it;
    });
    this.wisp = null;
    this.wispCooldown = 0;
    this.particles = new ParticleSystem();
    this.dustTimer = 0;
    this.ambientTimer = 0;
    this.camera = new Camera(this.map.pixelWidth(), this.map.pixelHeight());
    this.camera.x = Math.max(0, this.player.x - VIEW_W / 2);
    this.timeLeft = LEVEL_TIME;
    this.audio.startMusic(this.map.biome);
  }

  startGame() {
    this.totalShards = 0;
    this.levelIndex = 0;
    this.loadLevel(0);
    this.state = 'PLAYING';
    this.audio.resume();
  }

  update(dt) {
    this.t += dt;
    const input = this.input;

    if (this.state === 'TITLE') {
      if (input.wasPressed('start')) { this.audio.select(); this.startGame(); }
      input.endFrame();
      return;
    }
    if (this.state === 'GAMEOVER') {
      if (input.wasPressed('start')) { this.audio.select(); this.state = 'TITLE'; }
      input.endFrame();
      return;
    }
    if (this.state === 'WIN') {
      if (input.wasPressed('start')) { this.audio.select(); this.state = 'TITLE'; }
      input.endFrame();
      return;
    }
    if (this.state === 'PAUSED') {
      if (input.wasPressed('pause')) { this.state = 'PLAYING'; }
      input.endFrame();
      return;
    }
    if (this.state === 'LEVEL_CLEAR') {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        if (this.levelIndex + 1 >= LEVELS.length) {
          this.state = 'WIN';
          this.audio.stopMusic();
        } else {
          this.levelIndex += 1;
          this.loadLevel(this.levelIndex);
          this.state = 'PLAYING';
        }
      }
      input.endFrame();
      return;
    }

    // PLAYING
    if (input.wasPressed('pause')) { this.state = 'PAUSED'; input.endFrame(); return; }

    this.timeLeft -= dt;

    this.wispCooldown = Math.max(0, this.wispCooldown - dt);
    if (input.wasPressed('action') && this.player.form !== 'ember' && !this.wisp && this.wispCooldown <= 0 && this.player.alive) {
      this.wisp = makeWisp(this.player.x + this.player.w / 2, this.player.y + this.player.h * 0.4, this.player.facing);
      this.audio.throwWisp();
      this.player.throwTimer = 0.25;
    }

    this.player.update(dt, input, this.map);
    this.handlePlayerEvents();

    if (this.wisp) {
      updateWisp(this.wisp, dt, this.map, this.player);
      this.particles.spawn({
        x: this.wisp.x, y: this.wisp.y, vx: (Math.random() * 20 - 10), vy: (Math.random() * 20 - 10),
        life: 0.22, size: 2.2, color: 'rgba(255,230,150,0.8)', gravity: 0, drag: 0.9,
      });
      if (this.wisp.hitSwitch && !this.map.gatesOpen) {
        this.map.toggleGates();
        this.audio.powerup();
        this.camera.shake(1.5, 0.2);
        this.particles.burst(this.wisp.x, this.wisp.y, 16, { colors: ['#c88fff', '#fff', '#8affb0'], speedMin: 40, speedMax: 140, lifeMin: 0.3, lifeMax: 0.6 });
      }
      if (this.wisp.done) {
        this.audio.wispReturn();
        this.wisp = null;
        this.wispCooldown = 0.25;
      }
    }

    for (const e of this.enemies) if (e.alive || e.dead) updateEnemy(e, dt, this.map, this.player.x);
    this.enemies = this.enemies.filter((e) => !(e.dead && e.deadTimer > 0.6));

    this.resolveEnemyCollisions();

    for (const it of this.items) updateItem(it, dt, this.map);
    this.resolveItemPickups();

    this.updateAmbientEffects(dt);
    this.particles.update(dt);
    this.camera.follow(this.player, dt);

    if (!this.player.alive && this.player.deathTimer > 1.1) {
      this.player.respawn();
      if (this.player.lives < 0) {
        this.state = 'GAMEOVER';
        this.audio.stopMusic();
        this.audio.gameOver();
      } else {
        this.camera.x = Math.max(0, this.player.x - VIEW_W / 2);
      }
    }

    if (this.player.finished && this.state === 'PLAYING') {
      this.totalShards = this.player.shards;
      this.timeBonus = Math.max(0, Math.floor(this.timeLeft)) * 1;
      this.totalShards += Math.floor(this.timeBonus / 10);
      this.state = 'LEVEL_CLEAR';
      this.transitionTimer = 2.6;
      this.audio.stopMusic();
      this.audio.levelClear();
    }

    if (this.timeLeft <= 0 && this.player.alive) this.player.die();

    input.endFrame();
  }

  handlePlayerEvents() {
    for (const ev of this.player.events) {
      switch (ev.type) {
        case 'jump': this.audio.jump(); this.particles.burst(this.player.x + this.player.w / 2, this.player.y + this.player.h, 5, { colors: ['#fff', '#ffe9a8'], speedMin: 20, speedMax: 60, lifeMin: 0.2, lifeMax: 0.35, gravity: 300 }); break;
        case 'doublejump': this.audio.doubleJump(); break;
        case 'land': this.particles.burst(this.player.x + this.player.w / 2, this.player.y + this.player.h, 4, { colors: ['#fff'], speedMin: 10, speedMax: 40, angleMin: Math.PI, angleMax: Math.PI * 2, lifeMin: 0.15, lifeMax: 0.25 }); break;
        case 'dash': this.audio.throwWisp(); this.camera.shake(1.2, 0.12); this.particles.burst(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 8, { colors: ['#ff6b3d', '#ffce54'], speedMin: 40, speedMax: 100, lifeMin: 0.2, lifeMax: 0.4 }); break;
        case 'shard': this.audio.shard(); break;
        case 'grow': this.audio.powerup(); this.camera.shake(0.6, 0.15); break;
        case 'wing': this.audio.powerup(); break;
        case '1up': this.audio.powerup(); break;
        case 'damage': this.audio.damage(); this.camera.shake(2.5, 0.25); break;
        case 'die': this.audio.gameOver(); this.camera.shake(3, 0.4); break;
        case 'goal': this.audio.levelClear(); break;
        case 'bump': this.handleBump(ev.cx, ev.cy, ev.mode); break;
      }
    }
  }

  handleBump(cx, cy, mode) {
    const id = this.map.get(cx, cy);
    if (mode === 'break') {
      if (id !== T.BREAKABLE) return;
      if (this.player.form !== 'small') {
        this.map.set(cx, cy, T.EMPTY);
        this.audio.breakBlock();
        this.camera.shake(1.4, 0.14);
        this.particles.burst(cx * TILE + 8, cy * TILE + 8, 10, { colors: ['#c17a3e', '#9a5c2a'], speedMin: 40, speedMax: 140, lifeMin: 0.3, lifeMax: 0.55 });
      } else {
        this.audio.bump();
      }
      return;
    }
    if (id !== T.BLOCK) return;
    const kind = this.map.blockContents[`${cx},${cy}`] || 'shard5';
    this.map.set(cx, cy, T.BLOCK_USED);
    this.audio.bump();
    this.particles.burst(cx * TILE + 8, cy * TILE, 6, { colors: ['#ffe9a8'], speedMin: 20, speedMax: 60, lifeMin: 0.2, lifeMax: 0.35 });
    if (kind === 'shard5') {
      // Coin-style blocks grant instantly, like a classic ? block.
      this.player.grow('shard5');
    } else {
      this.items.push(makeItem(kind, cx * TILE + 3, cy * TILE));
    }
  }

  resolveEnemyCollisions() {
    const p = this.player;
    if (!p.alive || p.finished) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (!aabbOverlap(p, e)) continue;
      const stomping = p.vy > 20 && (p.y + p.h - p.vy * (1 / 120)) <= e.y + 6;

      if (e.type === 'shellbug' && e.state === 'kicked') {
        if (!stomping) { p.takeDamage(e.x); continue; }
      }
      if (e.type === 'shellbug' && e.state === 'shell' && !stomping) {
        e.state = 'kicked';
        e.vx = (p.x < e.x ? 1 : -1) * 130;
        this.audio.stomp();
        continue;
      }

      if (stomping) {
        p.vy = STOMP_BOUNCE_VELOCITY;
        this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 8, { colors: ['#fff', '#ffce54'], speedMin: 40, speedMax: 100, lifeMin: 0.2, lifeMax: 0.4 });
        if (e.type === 'shellbug' && e.state === 'walk') {
          e.state = 'shell'; e.vx = 0; this.audio.stomp();
        } else {
          e.alive = false; e.dead = true; e.deadTimer = 0;
          this.audio.stomp();
        }
      } else {
        p.takeDamage(e.x);
      }
    }
  }

  resolveItemPickups() {
    const p = this.player;
    for (const it of this.items) {
      if (it.collected || it.emerging) continue;
      if (aabbOverlap(p, it)) {
        it.collected = true;
        p.grow(it.kind);
        this.particles.burst(it.x + it.w / 2, it.y + it.h / 2, 6, { colors: ['#ffe9a8', '#fff'], speedMin: 20, speedMax: 70, lifeMin: 0.2, lifeMax: 0.4 });
      }
    }
    this.items = this.items.filter((it) => !it.collected);
  }

  updateAmbientEffects(dt) {
    const p = this.player;

    // Running dust trail — kicked up behind the feet, warm dust tone so it
    // reads against grass/rock rather than blending into a white sky.
    this.dustTimer -= dt;
    if (p.alive && p.grounded && Math.abs(p.vx) > 50 && this.dustTimer <= 0) {
      this.dustTimer = 0.045;
      const behindX = p.x + p.w / 2 - Math.sign(p.vx) * p.w * 0.45;
      for (let i = 0; i < 2; i++) {
        this.particles.spawn({
          x: behindX + (Math.random() * 4 - 2), y: p.y + p.h - 1, vx: -p.vx * 0.22 + (Math.random() * 20 - 10), vy: -26 - Math.random() * 18,
          life: 0.3 + Math.random() * 0.15, size: 2.6 + Math.random() * 2,
          color: 'rgba(238,220,180,0.85)', gravity: 220, drag: 0.88,
        });
      }
    }
    // Dash motion streaks
    if (p.alive && p.dashTimer > 0) {
      this.particles.spawn({
        x: p.x + p.w / 2 - p.facing * p.w * 0.5, y: p.y + p.h * 0.5 + (Math.random() * 6 - 3),
        vx: -p.facing * 40, vy: 0, life: 0.18, size: 1.5,
        color: Math.random() > 0.5 ? '#ffce54' : '#ff8f5c', gravity: 0, drag: 0.85,
      });
    }

    // Ambient biome atmosphere (fireflies / pollen / motes) — dense enough
    // to register as deliberate weather rather than stray pixels.
    this.ambientTimer -= dt;
    if (this.ambientTimer <= 0) {
      this.ambientTimer = 0.12;
      const cam = this.camera;
      const biome = this.map.biome;
      for (let i = 0; i < 2; i++) {
        const ax = cam.x + Math.random() * VIEW_W;
        const ay = cam.y + Math.random() * VIEW_H * 0.8;
        if (biome === 'meadow') {
          this.particles.spawn({ x: ax, y: ay, vx: 8 + Math.random() * 10, vy: -6 + Math.random() * 10, life: 3 + Math.random() * 2, size: 2.4, color: 'rgba(255,250,225,0.85)', gravity: -3, drag: 0.995, shape: 'circle' });
        } else if (biome === 'cavern') {
          this.particles.spawn({ x: ax, y: ay, vx: Math.sin(this.t + ax) * 6, vy: -8, life: 2.5 + Math.random() * 2, size: 2.6, color: 'rgba(150,255,190,0.9)', gravity: -2, drag: 0.99, shape: 'circle' });
        } else if (biome === 'sky') {
          this.particles.spawn({ x: ax, y: ay, vx: 4, vy: 3, life: 3.5, size: 2, color: 'rgba(255,255,255,0.85)', gravity: 0, drag: 1, shape: 'circle' });
        }
      }
    }
  }

  render(alpha, fps) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    if (this.state === 'TITLE') { drawTitleScreen(ctx, this.t); return; }
    if (this.state === 'GAMEOVER') {
      this.renderWorld();
      drawGameOver(ctx, this.t);
      return;
    }
    if (this.state === 'WIN') { drawWinScreen(ctx, this.t, this.totalShards); return; }

    this.renderWorld();

    if (this.state === 'PAUSED') drawPauseOverlay(ctx);
    if (this.state === 'LEVEL_CLEAR') drawLevelClear(ctx, this.t, this.totalShards, this.timeBonus);
  }

  renderWorld() {
    const ctx = this.ctx;
    const pal = PALETTES[this.map.biome];
    const cam = this.camera.offset();

    drawBackground(ctx, pal, cam.x, cam.y, this.map.pixelHeight(), this.t);
    drawTileMap(ctx, this.map, pal, cam.x, cam.y, VIEW_W, VIEW_H, this.t);

    for (const d of this.map.decor) {
      const sx = d.x - cam.x, sy = d.y - cam.y;
      if (sx < -20 || sx > VIEW_W + 20) continue;
      drawDecor(ctx, d.type, sx, sy, this.t);
    }

    for (const it of this.items) {
      const sx = it.x - cam.x + it.w / 2, sy = it.y - cam.y + it.h / 2;
      if (it.kind === 'shard5') drawShard(ctx, sx, sy, it.t);
      else drawPowerItem(ctx, sx, sy, it.kind, it.t);
    }

    for (const e of this.enemies) {
      const sx = e.x - cam.x, sy = e.y - cam.y;
      if (sx < -30 || sx > VIEW_W + 30) continue;
      if (e.type !== 'glimmoth') drawShadow(ctx, sx + e.w / 2, sy + e.h, e.w * 0.55);
      if (e.type === 'puffshroom') drawPuffshroom(ctx, sx, sy, e.w, e.h, e.facing, e.walkPhase, e.dead);
      else if (e.type === 'glimmoth') drawGlimmoth(ctx, sx, sy, e.w, e.h, e.vx < 0 ? -1 : 1, e.walkPhase, this.t);
      else if (e.type === 'shellbug') drawShellbug(ctx, sx, sy, e.w, e.h, e.facing, e.walkPhase, e.state === 'shell' || e.state === 'kicked');
    }

    if (this.wisp) {
      const wx = this.wisp.x - cam.x, wy = this.wisp.y - cam.y;
      drawWisp(ctx, wx, wy, this.t);
    }

    const p = this.player;
    if (p.alive) {
      const flicker = p.flickerTimer > 0 && Math.floor(this.t * 20) % 2 === 0;
      if (!p.isClimbing) {
        const shadowShrink = p.grounded ? 1 : Math.max(0.3, 1 - Math.abs(p.vy) / 400);
        drawShadow(ctx, p.x - cam.x + p.w / 2, p.y - cam.y + p.h, p.w * 0.6 * shadowShrink, p.grounded ? 0.28 : 0.14);
      }
      drawKip(ctx, p.x - cam.x, p.y - cam.y, p.w, p.h, {
        facing: p.facing, form: p.form, walkPhase: p.walkPhase,
        airborne: !p.grounded && !p.isClimbing, vy: p.vy, vx: p.vx, crouching: false,
        wallSliding: p.wallDir !== 0 && !p.grounded, dashing: p.dashTimer > 0,
        hurtFlicker: flicker, idleT: p.idleT,
        landSquash: p.landSquashTimer / 0.16, throwing: p.throwTimer > 0,
      });
    }

    this.particles.render(ctx, cam.x, cam.y);
    drawHUD(ctx, p, this.levelName, this.timeLeft, this.t, this.levelIndex, LEVELS.length);
  }
}
