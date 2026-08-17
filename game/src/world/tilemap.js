import { TILE } from '../engine/constants.js';

// Tile IDs
export const T = {
  EMPTY: 0,
  SOLID: 1,       // full solid block
  ONEWAY: 2,      // platform, collide only when falling from above
  HAZARD: 3,      // spikes - damages on touch
  WATER: 4,       // decorative, slows movement, non-solid
  BLOCK: 5,       // bumpable item block (contents from level.blockContents)
  BLOCK_USED: 6,  // spent block (visual only, solid)
  BREAKABLE: 7,   // solid, breaks when hit from below while Big/Ember
  VINE: 8,        // climbable, non-solid horizontally
  GOAL: 9,        // level-end marker (non-solid, triggers win)
  DECOR_SOLID: 10, // solid but visually distinct (cave wall etc, handled by biome palette)
  SWITCH: 11,     // Wisp-activated switch, non-solid, toggles linked gates
  GATE: 12,       // Wisp-puzzle gate; solid while closed, opens permanently once triggered
};

export function isSolid(id) {
  return id === T.SOLID || id === T.BLOCK || id === T.BLOCK_USED || id === T.BREAKABLE || id === T.DECOR_SOLID || id === T.GATE;
}
export function isOneWay(id) { return id === T.ONEWAY; }
export function isHazard(id) { return id === T.HAZARD; }
export function isClimbable(id) { return id === T.VINE; }
export function isBumpable(id) { return id === T.BLOCK; }
export function isBreakable(id) { return id === T.BREAKABLE; }
export function isGoal(id) { return id === T.GOAL; }
export function isSwitch(id) { return id === T.SWITCH; }

export class TileMap {
  constructor({ width, height, grid, biome, blockContents = {}, decor = [] }) {
    this.width = width;
    this.height = height;
    this.grid = grid; // Uint8Array-like flat array, row-major, length width*height
    this.biome = biome;
    this.blockContents = blockContents; // key "cx,cy" -> item type string
    this.decor = decor; // array of {x,y,type} purely visual sprites (grass tufts, mushrooms, crystals)
  }

  get(cx, cy) {
    if (cx < 0 || cx >= this.width) return T.SOLID; // invisible walls at level edges
    if (cy < 0) return T.EMPTY; // open sky above
    if (cy >= this.height) return T.EMPTY; // pits are lethal - let entities fall through
    return this.grid[cy * this.width + cx];
  }

  set(cx, cy, id) {
    if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) return;
    this.grid[cy * this.width + cx] = id;
  }

  pixelWidth() { return this.width * TILE; }
  pixelHeight() { return this.height * TILE; }

  worldToTile(px, py) { return [Math.floor(px / TILE), Math.floor(py / TILE)]; }

  toggleGates() {
    if (this.gatesOpen) return;
    this.gatesOpen = true;
    for (const [gx, gy] of this.gateCells || []) this.set(gx, gy, T.BLOCK);
  }
}

// Build a TileMap from an array of strings (ASCII level authoring).
// Legend:
// '.' empty  '#' solid  '=' oneway  '^' hazard  '~' water
// '?' block(coin)  '!' block(power)  'B' breakable  'V' vine  'G' goal  'D' decor solid
export function parseAsciiLevel(rows, biome) {
  const height = rows.length;
  const width = rows[0].length;
  const grid = new Uint8Array(width * height);
  const blockContents = {};
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      let id = T.EMPTY;
      switch (ch) {
        case '#': id = T.SOLID; break;
        case '=': id = T.ONEWAY; break;
        case '^': id = T.HAZARD; break;
        case '~': id = T.WATER; break;
        case '?': id = T.BLOCK; blockContents[`${x},${y}`] = 'shard5'; break;
        case '!': id = T.BLOCK; blockContents[`${x},${y}`] = 'power'; break;
        case 'B': id = T.BREAKABLE; break;
        case 'V': id = T.VINE; break;
        case 'G': id = T.GOAL; break;
        case 'D': id = T.DECOR_SOLID; break;
        default: id = T.EMPTY;
      }
      grid[y * width + x] = id;
    }
  }
  return new TileMap({ width, height, grid, biome, blockContents });
}
