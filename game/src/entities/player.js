import {
  MOVE_ACCEL, AIR_ACCEL, MAX_RUN_SPEED, MAX_SPRINT_SPEED, GROUND_FRICTION, AIR_FRICTION,
  GRAVITY, FAST_FALL_GRAVITY, MAX_FALL_SPEED, JUMP_VELOCITY, SPRINT_JUMP_VELOCITY,
  JUMP_CUT_MULTIPLIER, COYOTE_TIME, JUMP_BUFFER, WALL_SLIDE_MAX_SPEED, WALL_JUMP_VX,
  WALL_JUMP_VY, WALL_JUMP_LOCK, DAMAGE_INVULN_TIME, DAMAGE_KNOCKBACK_VX, DAMAGE_KNOCKBACK_VY,
  PLAYER_W, PLAYER_SMALL_H, PLAYER_BIG_H, GLOW_DASH_SPEED, GLOW_DASH_TIME, GLOW_DASH_COOLDOWN,
} from '../engine/constants.js';
import { moveAndCollide } from '../engine/collision.js';
import { isClimbable, T } from '../world/tilemap.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class Player {
  constructor(x, y) {
    this.spawn = { x, y };
    this.reset();
  }

  reset() {
    this.x = this.spawn.x; this.y = this.spawn.y;
    this.w = PLAYER_W; this.h = PLAYER_SMALL_H;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.form = 'small'; // small | big | ember
    this.grounded = false;
    this.coyoteTimer = 0;
    this.wallDir = 0;
    this.wallJumpLock = 0;
    this.isClimbing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.wingTimer = 0;
    this.invulnTimer = 0.5;
    this.flickerTimer = 0;
    this.landSquashTimer = 0;
    this.lives = 3;
    this.shards = 0;
    this.alive = true;
    this.walkPhase = 0;
    this.idleT = 0;
    this.throwTimer = 0;
    this.hasWisp = false;
    this.wispOut = false;
    this.events = [];
    this.finished = false;
    this.deathTimer = 0;
  }

  get hazardImmune() { return this.invulnTimer > 0; }

  takeDamage(fromX) {
    if (this.invulnTimer > 0 || this.finished) return;
    this.events.push({ type: 'damage' });
    if (this.form !== 'small') {
      this.form = this.form === 'ember' ? 'big' : 'small';
      this.resizeForm();
      this.invulnTimer = DAMAGE_INVULN_TIME;
      this.flickerTimer = DAMAGE_INVULN_TIME;
      this.vx = (this.x + this.w / 2 < fromX ? -1 : 1) * DAMAGE_KNOCKBACK_VX;
      this.vy = DAMAGE_KNOCKBACK_VY;
    } else {
      this.die();
    }
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.events.push({ type: 'die' });
  }

  respawn() {
    this.lives -= 1;
    if (this.lives < 0) { this.events.push({ type: 'gameover' }); return; }
    const savedShards = this.shards;
    const savedLives = this.lives;
    this.reset();
    this.shards = savedShards;
    this.lives = savedLives;
    this.events.push({ type: 'respawn' });
  }

  resizeForm() {
    const prevH = this.h;
    this.h = this.form === 'small' ? PLAYER_SMALL_H : PLAYER_BIG_H;
    this.y += (prevH - this.h);
  }

  grow(kind) {
    if (kind === 'power') {
      if (this.form === 'small') { this.form = 'big'; this.resizeForm(); this.events.push({ type: 'grow' }); }
      else if (this.form === 'big') { this.form = 'ember'; this.events.push({ type: 'grow' }); }
      else { this.shards += 20; this.events.push({ type: 'shard' }); }
    } else if (kind === 'wing') {
      this.wingTimer = 9;
      this.events.push({ type: 'wing' });
    } else if (kind === 'shard5') {
      this.shards += 5;
      this.events.push({ type: 'shard' });
    } else if (kind === '1up') {
      this.lives += 1;
      this.events.push({ type: '1up' });
    }
  }

  update(dt, input, map) {
    this.events = [];
    if (!this.alive) { this.deathTimer += dt; this.vy += GRAVITY * dt; this.y += this.vy * dt; return; }
    if (this.finished) { this.vx *= 0.9; return; }

    this.idleT += dt;
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.flickerTimer = Math.max(0, this.flickerTimer - dt);
    this.landSquashTimer = Math.max(0, this.landSquashTimer - dt);
    this.wingTimer = Math.max(0, this.wingTimer - dt);
    this.throwTimer = Math.max(0, this.throwTimer - dt);
    input.tickBuffer('jump', dt);
    if (input.wasPressed('jump')) input.bufferPress('jump', JUMP_BUFFER);

    // --- vine climb toggle ---
    const midCx = Math.floor((this.x + this.w / 2) / 16);
    const midCy = Math.floor((this.y + this.h / 2) / 16);
    const onVine = isClimbable(map.get(midCx, midCy));
    if (onVine && (input.isDown('up') || input.isDown('down') || this.isClimbing)) {
      this.isClimbing = true;
    } else if (!onVine) {
      this.isClimbing = false;
    }

    let moveDir = 0;
    if (input.isDown('left')) moveDir -= 1;
    if (input.isDown('right')) moveDir += 1;
    const sprinting = input.isDown('run');

    if (this.wallJumpLock > 0) {
      this.wallJumpLock -= dt;
    } else if (this.isClimbing) {
      this.vy = input.isDown('up') ? -70 : input.isDown('down') ? 70 : 0;
      this.vx = moveDir * 55;
      if (moveDir) this.facing = moveDir;
    } else {
      const maxSpeed = sprinting ? MAX_SPRINT_SPEED : MAX_RUN_SPEED;
      const accel = this.grounded ? MOVE_ACCEL : AIR_ACCEL;
      const friction = this.grounded ? GROUND_FRICTION : AIR_FRICTION;
      if (moveDir !== 0) {
        this.vx += moveDir * accel * dt;
        this.vx = clamp(this.vx, -maxSpeed, maxSpeed);
        this.facing = moveDir;
      } else if (this.grounded || friction) {
        if (this.vx > 0) this.vx = Math.max(0, this.vx - friction * dt);
        else if (this.vx < 0) this.vx = Math.min(0, this.vx + friction * dt);
      }
    }

    // --- dash (Glow Dash) ---
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.vx = this.facing * GLOW_DASH_SPEED;
      this.vy = 0;
    } else if (input.wasPressed('action') && this.dashCooldown <= 0 && !this.isClimbing && this.form === 'ember') {
      this.dashTimer = GLOW_DASH_TIME;
      this.dashCooldown = GLOW_DASH_COOLDOWN;
      this.events.push({ type: 'dash' });
    }

    // --- gravity ---
    if (!this.isClimbing && this.dashTimer <= 0) {
      const glide = this.wingTimer > 0 && input.isDown('jump') && this.vy > 0;
      const g = input.isDown('down') && this.vy > 0 && !glide ? FAST_FALL_GRAVITY : GRAVITY;
      this.vy += (glide ? g * 0.18 : g) * dt;
      if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
    }

    // --- wall slide ---
    const touchingWall = this.wallDir !== 0;
    if (!this.grounded && touchingWall && this.vy > 0 && !this.isClimbing &&
        ((this.wallDir < 0 && input.isDown('left')) || (this.wallDir > 0 && input.isDown('right')))) {
      this.vy = Math.min(this.vy, WALL_SLIDE_MAX_SPEED);
    }

    // --- jump / wall jump ---
    if (this.grounded) this.coyoteTimer = COYOTE_TIME;
    else this.coyoteTimer -= dt;

    if (input.wasReleased('jump') && this.vy < 0) this.vy *= JUMP_CUT_MULTIPLIER;

    const bufferedJump = input._bufferTimers.jump > 0;
    if (bufferedJump && !this.isClimbing) {
      if (this.coyoteTimer > 0) {
        this.vy = sprinting ? SPRINT_JUMP_VELOCITY : JUMP_VELOCITY;
        this.grounded = false; this.coyoteTimer = 0;
        input.consumeBuffered('jump');
        this.events.push({ type: 'jump' });
      } else if (touchingWall) {
        this.vy = WALL_JUMP_VY;
        this.vx = -this.wallDir * WALL_JUMP_VX;
        this.facing = -this.wallDir;
        this.wallJumpLock = WALL_JUMP_LOCK;
        input.consumeBuffered('jump');
        this.events.push({ type: 'jump' });
      } else if (this.wingTimer > 0) {
        this.vy = JUMP_VELOCITY * 0.75;
        input.consumeBuffered('jump');
        this.events.push({ type: 'doublejump' });
      }
    }

    // --- collide ---
    const wasGrounded = this.grounded;
    const flags = moveAndCollide(this, dt, map, { ignoreOneWay: this.isClimbing });
    this.grounded = flags.onGround;
    this.wallDir = flags.onWallLeft ? -1 : (flags.onWallRight ? 1 : 0);
    if (this.grounded && !wasGrounded) {
      this.events.push({ type: 'land' });
      this.landSquashTimer = 0.16;
    }
    if (this.grounded) this.wingTimer = Math.min(this.wingTimer, this.wingTimer > 0 ? this.wingTimer : 0);

    if (flags.hazard && !this.hazardImmune) this.takeDamage(this.x);
    if (flags.goal && !this.finished) { this.finished = true; this.events.push({ type: 'goal' }); }
    for (const b of flags.bumpedBlocks) this.events.push({ type: 'bump', cx: b[0], cy: b[1], mode: b[2] });

    if (this.y > map.pixelHeight() + 40) this.die();

    // walk animation phase
    if (this.grounded && Math.abs(this.vx) > 4) {
      this.walkPhase += (Math.abs(this.vx) / 26) * dt;
    } else if (this.grounded) {
      this.walkPhase = 0;
    }
  }
}
