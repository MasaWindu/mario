import { LevelBuilder } from './levelBuilder.js';

const H = 14;
const GROUND = 11;

// ---------------------------------------------------------------------
// LEVEL 1 — Sunmeadow Trail (meadow biome, intro-friendly)
// ---------------------------------------------------------------------
function buildLevel1() {
  const w = 120;
  const lb = new LevelBuilder(w, H, 'meadow');
  lb.ground(0, w, GROUND, 3);
  lb.setStart(3, GROUND - 4);

  lb.block(6, 7, 'shard5');
  lb.block(7, 7, 'shard5');
  lb.block(8, 7, 'power');
  lb.block(9, 7, 'shard5');
  lb.enemy('puffshroom', 14, GROUND - 1);

  // gap 1
  lb.set(18, GROUND, 0); lb.set(18, GROUND + 1, 0); lb.set(18, GROUND + 2, 0);
  lb.set(19, GROUND, 0); lb.set(19, GROUND + 1, 0); lb.set(19, GROUND + 2, 0);
  lb.set(20, GROUND, 0); lb.set(20, GROUND + 1, 0); lb.set(20, GROUND + 2, 0);
  lb.platform(22, 26, 9, true);
  lb.enemy('glimmoth', 24, 6);

  lb.enemy('puffshroom', 30, GROUND - 1);
  lb.enemy('puffshroom', 33, GROUND - 1);

  // Wisp secret: hit the switch to crack open the sealed crystal for a 1-up.
  lb.wispSwitch(27, GROUND - 1);
  lb.sealedBlock(27, GROUND - 3, '1up');

  lb.breakable(37, 41, 7);
  lb.block(39, 7, 'shard5');

  // gap 2 with mid platform
  for (const gx of [44, 45, 46, 47]) { lb.set(gx, GROUND, 0); lb.set(gx, GROUND + 1, 0); lb.set(gx, GROUND + 2, 0); }
  lb.platform(45, 47, 10, true);
  lb.enemy('glimmoth', 45, 5);

  // staircase up
  lb.platform(52, 54, 10, false);
  lb.platform(54, 56, 9, false);
  lb.platform(56, 58, 8, false);
  lb.enemy('shellbug', 57, 7);
  lb.platform(58, 61, 7, true);
  lb.platform(61, 63, 8, false);
  lb.platform(63, 65, 9, false);
  lb.platform(65, 67, 10, false);

  lb.enemy('puffshroom', 70, GROUND - 1);
  lb.block(72, 7, 'shard5');
  lb.block(73, 7, 'shard5');
  lb.block(74, 7, 'shard5');
  lb.enemy('shellbug', 78, GROUND - 1);

  // spike strip over solid floor beneath
  lb.hazardRow(83, 86, GROUND);
  lb.enemy('glimmoth', 84, 6);

  lb.platform(90, 93, 9, true);
  lb.enemy('puffshroom', 95, GROUND - 1);
  lb.enemy('puffshroom', 98, GROUND - 1);

  // final gap before goal plaza
  for (const gx of [103, 104, 105]) { lb.set(gx, GROUND, 0); lb.set(gx, GROUND + 1, 0); lb.set(gx, GROUND + 2, 0); }
  lb.ground(107, w, GROUND, 3);
  lb.goal(w - 4, GROUND);

  for (let i = 0; i < 30; i++) lb.deco('flower', 5 + i * 3.7 + (i % 3), GROUND - 1);
  return lb.build();
}

// ---------------------------------------------------------------------
// LEVEL 2 — Deeproot Cavern (cavern biome, vertical + vines)
// ---------------------------------------------------------------------
function buildLevel2() {
  const w = 100;
  const lb = new LevelBuilder(w, H, 'cavern');
  lb.decorSolid(0, w, GROUND, 3);
  lb.setStart(3, GROUND - 4);
  // ceiling to reinforce cave feel
  lb.decorSolid(0, w, 0, 2);

  lb.block(5, 8, 'shard5');
  lb.enemy('shellbug', 10, GROUND - 1);

  for (const gx of [14, 15, 16]) { lb.set(gx, GROUND, 0); lb.set(gx, GROUND + 1, 0); lb.set(gx, GROUND + 2, 0); }
  lb.vine(17, 4, GROUND + 1);
  lb.platform(18, 21, 6, false);
  lb.enemy('glimmoth', 19, 4);

  lb.breakable(23, 27, GROUND - 1);
  lb.enemy('puffshroom', 28, GROUND - 1);

  // deep pit requiring platform hop
  for (const gx of [31, 32, 33, 34, 35]) { lb.set(gx, GROUND, 0); lb.set(gx, GROUND + 1, 0); lb.set(gx, GROUND + 2, 0); }
  lb.platform(31, 33, 9, true);
  lb.platform(34, 36, 7, true);
  lb.enemy('glimmoth', 33, 5);

  lb.decorSolid(38, 42, GROUND, 3);
  lb.block(39, 7, 'power');
  lb.enemy('shellbug', 40, GROUND - 1);

  // Wisp secret: crystal vault guarded by a switch.
  lb.wispSwitch(41, GROUND - 1);
  lb.sealedBlock(41, GROUND - 3, 'shard5');
  lb.sealedBlock(42, GROUND - 3, 'shard5');

  lb.vine(44, 3, GROUND + 1);
  lb.hazardRow(46, 49, GROUND);
  lb.decorSolid(46, 49, GROUND + 1, 2);

  lb.platform(51, 54, 9, false);
  lb.platform(54, 57, 6, false);
  lb.enemy('glimmoth', 55, 5);
  lb.platform(57, 60, 9, false);

  lb.decorSolid(62, 70, GROUND, 3);
  lb.block(64, 7, 'shard5');
  lb.block(65, 7, 'shard5');
  lb.block(66, 7, 'shard5');
  lb.enemy('shellbug', 68, GROUND - 1);
  lb.enemy('puffshroom', 69, GROUND - 1);

  for (const gx of [72, 73, 74, 75]) { lb.set(gx, GROUND, 0); lb.set(gx, GROUND + 1, 0); lb.set(gx, GROUND + 2, 0); }
  lb.vine(76, 4, GROUND + 1);

  lb.decorSolid(78, w, GROUND, 3);
  lb.enemy('shellbug', 82, GROUND - 1);
  lb.enemy('glimmoth', 86, 6);
  lb.goal(w - 4, GROUND);

  for (let i = 0; i < 20; i++) lb.deco('crystal', 4 + i * 4.8, GROUND - 1);
  return lb.build();
}

// ---------------------------------------------------------------------
// LEVEL 3 — Skybloom Heights (sky biome, floating islands)
// ---------------------------------------------------------------------
function buildLevel3() {
  const w = 100;
  const lb = new LevelBuilder(w, H, 'sky');
  lb.ground(0, 10, GROUND, 3);
  lb.setStart(3, GROUND - 4);
  lb.block(5, 7, 'wing');
  lb.block(6, 7, 'shard5');
  lb.wispSwitch(8, GROUND - 1);
  lb.sealedBlock(8, GROUND - 3, '1up');

  lb.platform(11, 15, GROUND - 1, false);
  lb.enemy('glimmoth', 13, 6);
  lb.platform(17, 20, GROUND - 3, false);
  lb.platform(22, 25, GROUND - 1, false);
  lb.enemy('shellbug', 23, GROUND - 2);

  lb.platform(27, 29, GROUND - 4, true);
  lb.platform(31, 34, GROUND - 2, false);
  lb.block(32, GROUND - 6, 'shard5');
  lb.block(33, GROUND - 6, 'shard5');

  lb.platform(37, 40, GROUND, false);
  lb.enemy('glimmoth', 38, 5);
  lb.platform(42, 44, GROUND - 3, true);
  lb.platform(46, 50, GROUND - 1, false);
  lb.enemy('puffshroom', 47, GROUND - 2);
  lb.enemy('shellbug', 49, GROUND - 2);

  lb.platform(53, 55, GROUND - 4, true);
  lb.platform(57, 59, GROUND - 2, true);
  lb.platform(61, 65, GROUND, false);
  lb.block(62, GROUND - 5, 'power');

  lb.enemy('glimmoth', 63, 5);
  lb.platform(68, 70, GROUND - 3, false);
  lb.platform(72, 74, GROUND - 1, false);
  lb.enemy('shellbug', 73, GROUND - 2);
  lb.platform(76, 78, GROUND - 3, true);
  lb.platform(80, 84, GROUND - 1, false);
  lb.enemy('glimmoth', 81, 5);
  lb.enemy('puffshroom', 83, GROUND - 2);

  lb.platform(87, 90, GROUND - 2, false);
  lb.ground(93, w, GROUND, 3);
  lb.goal(w - 4, GROUND);

  for (let i = 0; i < 16; i++) lb.deco('cloudpuff', 8 + i * 5.6, GROUND - 5 - (i % 4));
  return lb.build();
}

export const LEVELS = [
  { name: 'Sunmeadow Trail', biome: 'meadow', build: buildLevel1 },
  { name: 'Deeproot Cavern', biome: 'cavern', build: buildLevel2 },
  { name: 'Skybloom Heights', biome: 'sky', build: buildLevel3 },
];
