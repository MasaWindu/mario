// Core tuning constants for EMBERLEAP.
// Units: pixels, seconds. Tile size is the fundamental grid unit.

export const TILE = 16;
export const VIEW_W = 384;
export const VIEW_H = 224;
export const VIEW_TILES_W = VIEW_W / TILE;
export const VIEW_TILES_H = VIEW_H / TILE;

// Movement tuning (px/s, px/s^2)
export const MOVE_ACCEL = 780;
export const AIR_ACCEL = 620;
export const MAX_RUN_SPEED = 118;
export const MAX_SPRINT_SPEED = 168;
export const GROUND_FRICTION = 900;
export const AIR_FRICTION = 260;

export const GRAVITY = 1820;
export const FAST_FALL_GRAVITY = 2600;
export const MAX_FALL_SPEED = 380;
export const JUMP_VELOCITY = -522;
export const SPRINT_JUMP_VELOCITY = -560;
export const JUMP_CUT_MULTIPLIER = 0.42;
export const COYOTE_TIME = 0.09;
export const JUMP_BUFFER = 0.12;

export const WALL_SLIDE_MAX_SPEED = 70;
export const WALL_JUMP_VX = 155;
export const WALL_JUMP_VY = -320;
export const WALL_JUMP_LOCK = 0.14;

export const STOMP_BOUNCE_VELOCITY = -210;
export const DAMAGE_INVULN_TIME = 1.6;
export const DAMAGE_KNOCKBACK_VX = 90;
export const DAMAGE_KNOCKBACK_VY = -180;

export const PLAYER_SMALL_H = 14;
export const PLAYER_BIG_H = 22;
export const PLAYER_W = 12;

export const GLOW_DASH_SPEED = 300;
export const GLOW_DASH_TIME = 0.16;
export const GLOW_DASH_COOLDOWN = 0.55;

export const WISP_THROW_SPEED = 260;
export const WISP_RETURN_ACCEL = 900;
export const WISP_MAX_TIME = 2.2;

export const DEBUG = false;
