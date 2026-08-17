import { TileMap, T } from './tilemap.js';

// A small authoring DSL so level layouts are readable code instead of
// error-prone hand-typed ASCII grids of 100+ columns.
export class LevelBuilder {
  constructor(width, height, biome) {
    this.width = width;
    this.height = height;
    this.biome = biome;
    this.grid = new Uint8Array(width * height).fill(T.EMPTY);
    this.blockContents = {};
    this.enemies = [];
    this.decor = [];
    this.gateCells = [];
    this.pickups = [];
    this.start = { x: 2, y: height - 4 };
  }

  set(x, y, id) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.grid[y * this.width + x] = id;
  }

  get(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return T.SOLID;
    return this.grid[y * this.width + x];
  }

  // Fill solid ground across [x0,x1) down to floor, `depth` tiles thick, top row = groundRow
  ground(x0, x1, groundRow, depth = 4) {
    for (let x = x0; x < x1; x++) {
      for (let y = groundRow; y < Math.min(this.height, groundRow + depth); y++) {
        this.set(x, y, T.SOLID);
      }
    }
    return this;
  }

  platform(x0, x1, row, oneway = true) {
    for (let x = x0; x < x1; x++) this.set(x, row, oneway ? T.ONEWAY : T.SOLID);
    return this;
  }

  block(x, row, contents) {
    this.set(x, row, T.BLOCK);
    if (contents) this.blockContents[`${x},${row}`] = contents;
    return this;
  }

  breakable(x0, x1, row) {
    for (let x = x0; x < x1; x++) this.set(x, row, T.BREAKABLE);
    return this;
  }

  hazardRow(x0, x1, row) {
    for (let x = x0; x < x1; x++) this.set(x, row, T.HAZARD);
    return this;
  }

  vine(x, y0, y1) {
    for (let y = y0; y < y1; y++) this.set(x, y, T.VINE);
    return this;
  }

  decorSolid(x0, x1, groundRow, depth = 4) {
    for (let x = x0; x < x1; x++)
      for (let y = groundRow; y < Math.min(this.height, groundRow + depth); y++)
        this.set(x, y, T.DECOR_SOLID);
    return this;
  }

  goal(x, groundRow) {
    for (let y = groundRow - 5; y < groundRow; y++) this.set(x, y, T.GOAL);
    return this;
  }

  wispSwitch(x, y) {
    this.set(x, y, T.SWITCH);
    return this;
  }

  // A sealed crystal block: looks like solid rock until a Wisp hits a
  // linked switch, at which point it cracks open into a bumpable block.
  sealedBlock(x, y, contents) {
    this.set(x, y, T.GATE);
    this.gateCells.push([x, y]);
    if (contents) this.blockContents[`${x},${y}`] = contents;
    return this;
  }

  enemy(type, x, y) {
    this.enemies.push({ type, x: x * 16, y: y * 16 });
    return this;
  }

  deco(type, x, y) {
    this.decor.push({ type, x: x * 16, y: y * 16 });
    return this;
  }

  setStart(x, y) { this.start = { x: x * 16, y: y * 16 }; return this; }

  // A static floating pickup (no ? block needed) — used for reward
  // trails/arcs that entice the player through a jump or platform run.
  pickup(kind, x, y) {
    this.pickups.push({ kind, x: x * 16, y: y * 16 });
    return this;
  }

  // Convenience: a shard5 arc between two points, `count` shards along it.
  shardArc(x0, y0, x1, y1, count) {
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1 || 1);
      const x = x0 + (x1 - x0) * f;
      const arc = Math.sin(f * Math.PI) * -0.85;
      const y = y0 + (y1 - y0) * f + arc;
      this.pickup('shard5', x, y);
    }
    return this;
  }

  build() {
    const map = new TileMap({
      width: this.width, height: this.height, grid: this.grid,
      biome: this.biome, blockContents: this.blockContents, decor: this.decor,
    });
    map.enemies = this.enemies;
    map.start = this.start;
    map.gateCells = this.gateCells;
    map.gatesOpen = false;
    map.pickups = this.pickups;
    return map;
  }
}
