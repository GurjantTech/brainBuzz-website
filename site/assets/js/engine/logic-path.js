/**
 * Logic Path (LogicPath.kt). Water enters the left side of startRow and must leave the right
 * side of endRow. Boards are built from a known path and then scrambled, so they're solvable.
 */
import { logicLevel } from './levels.js';

export const Dir = { N: 1, E: 2, S: 4, W: 8 };
const ALL_DIRS = [Dir.N, Dir.E, Dir.S, Dir.W];

/** Rotating clockwise moves N→E→S→W. */
export function rotateMask(mask, quarterTurns) {
  let m = mask;
  const n = ((quarterTurns % 4) + 4) % 4;
  for (let i = 0; i < n; i++) m = ((m << 1) | (m >> 3)) & 0xf;
  return m;
}
const opposite = (d) => rotateMask(d, 2);

export const PipeKind = {
  STRAIGHT: { name: 'STRAIGHT', baseMask: Dir.N | Dir.S, label: 'straight' },
  CORNER: { name: 'CORNER', baseMask: Dir.N | Dir.E, label: 'corner' },
  TEE: { name: 'TEE', baseMask: Dir.N | Dir.E | Dir.S, label: 'T-junction' },
};

export const tileMask = (tile) => rotateMask(tile.kind.baseMask, tile.rotation);
export const rotated = (tile) => (tile.locked ? tile : { ...tile, rotation: (tile.rotation + 1) % 4 });

/** `extraLength` lets the longest path grow beyond the usual limit (the app's Hard adds 3). */
export function logicRules(difficulty) {
  if (difficulty.level) return logicLevel(difficulty.level);
  switch (difficulty.name) {
    case 'EASY': return { size: 4, puzzles: 3, roundTimeMs: 150000, teeChance: 0, extraLength: 0 };
    case 'MEDIUM': return { size: 5, puzzles: 3, roundTimeMs: 180000, teeChance: Math.fround(0.25), extraLength: 0 };
    default: return { size: 6, puzzles: 3, roundTimeMs: 180000, teeChance: Math.fround(0.4), extraLength: 3 };
  }
}

function neighbor(size, cell, d) {
  const r = Math.trunc(cell / size);
  const c = cell % size;
  if (d === Dir.N) return r > 0 ? cell - size : null;
  if (d === Dir.S) return r < size - 1 ? cell + size : null;
  if (d === Dir.E) return c < size - 1 ? cell + 1 : null;
  return c > 0 ? cell - 1 : null;
}

function direction(size, from, to) {
  const diff = to - from;
  if (diff === 1) return Dir.E;
  if (diff === -1) return Dir.W;
  if (diff === size) return Dir.S;
  return Dir.N;
}

/** Puzzles get longer, twistier paths as the round goes on ([index] is 0-based). */
export function generatePath(difficulty, index, random) {
  const rules = logicRules(difficulty);
  const n = rules.size;
  const minLen = n + index;
  const maxLen = n + 2 + index * 2 + rules.extraLength;
  for (let attempt = 0; attempt < 50; attempt++) {
    const startRow = random.nextIntUntil(n);
    const endRow = random.nextIntUntil(n);
    const path = findPath(n, startRow, endRow, minLen, maxLen, random);
    if (path) return build(n, startRow, endRow, path, rules.teeChance, random);
  }
  // Practically unreachable; a straight run across the middle row is always valid.
  const row = Math.trunc(n / 2);
  return build(n, row, row, Array.from({ length: n }, (_, i) => row * n + i), rules.teeChance, random);
}

/** Randomized depth-first search for a simple path whose length is within [minLen, maxLen]. */
function findPath(size, startRow, endRow, minLen, maxLen, random) {
  const start = startRow * size;
  const end = endRow * size + size - 1;
  const path = [start];
  const visited = new Array(size * size).fill(false);
  visited[start] = true;
  let budget = 20000;
  const manhattan = (cell) =>
    Math.abs(Math.trunc(cell / size) - Math.trunc(end / size)) + Math.abs((cell % size) - (end % size));

  const dfs = (cell) => {
    if (--budget <= 0) return false;
    if (cell === end) return path.length >= minLen && path.length <= maxLen;
    if (path.length + manhattan(cell) > maxLen) return false;
    for (const d of random.shuffled(ALL_DIRS)) {
      const next = neighbor(size, cell, d);
      if (next === null || visited[next]) continue;
      visited[next] = true;
      path.push(next);
      if (dfs(next)) return true;
      path.pop();
      visited[next] = false;
    }
    return false;
  };
  return dfs(start) ? path.slice() : null;
}

/** Smallest clockwise turns (0..3) that make [kind] at [rotation] match [mask]. */
export function turnsToMatch(kind, rotation, mask) {
  for (let t = 0; t <= 3; t++) if (rotateMask(kind.baseMask, rotation + t) === mask) return t;
  return null;
}

function build(size, startRow, endRow, path, teeChance, random) {
  const solution = new Map();
  const kinds = new Map();
  path.forEach((cell, i) => {
    const inDir = i === 0 ? Dir.W : opposite(direction(size, path[i - 1], cell));
    const outDir = i === path.length - 1 ? Dir.E : direction(size, cell, path[i + 1]);
    const mask = inDir | outDir;
    const kind = inDir === opposite(outDir) ? PipeKind.STRAIGHT : PipeKind.CORNER;
    kinds.set(cell, kind);
    solution.set(cell, [0, 1, 2, 3].find((r) => rotateMask(kind.baseMask, r) === mask));
  });
  for (;;) {
    let par = 0;
    const tiles = Array.from({ length: size * size }, (_, cell) => {
      const pathKind = kinds.get(cell);
      if (pathKind) {
        const rotation = random.nextIntUntil(4);
        par += turnsToMatch(pathKind, rotation, rotateMask(pathKind.baseMask, solution.get(cell)));
        return { kind: pathKind, rotation, locked: false };
      }
      let kind;
      if (random.nextFloat() < teeChance) kind = PipeKind.TEE;
      else if (random.nextBoolean()) kind = PipeKind.CORNER;
      else kind = PipeKind.STRAIGHT;
      return { kind, rotation: random.nextIntUntil(4), locked: false };
    });
    const puzzle = {
      size, startRow, endRow, tiles, solutionPath: path, solution, par,
      startCell: startRow * size, endCell: endRow * size + size - 1,
    };
    // A scramble that happens to be solved already would be a free point; reroll it.
    if (!isSolved(puzzle, tiles) && par >= 2) return puzzle;
  }
}

/** Cells reachable from the inlet through matching pipe openings. */
export function connectedCells(puzzle, tiles) {
  const { size, startCell } = puzzle;
  if ((tileMask(tiles[startCell]) & Dir.W) === 0) return new Set();
  const seen = new Set([startCell]);
  const queue = [startCell];
  while (queue.length) {
    const cell = queue.shift();
    const mask = tileMask(tiles[cell]);
    for (const d of ALL_DIRS) {
      if ((mask & d) === 0) continue;
      const next = neighbor(size, cell, d);
      if (next === null || seen.has(next) || (tileMask(tiles[next]) & opposite(d)) === 0) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/** Solved when the inlet connects through to a pipe opening out of the right-hand exit. */
export const isSolved = (puzzle, tiles) =>
  connectedCells(puzzle, tiles).has(puzzle.endCell) && (tileMask(tiles[puzzle.endCell]) & Dir.E) !== 0;

/** A path cell that is not yet in its solved orientation, for hints. */
export function misalignedPathCell(puzzle, tiles) {
  const cell = puzzle.solutionPath.find((c) => {
    const t = tiles[c];
    return !t.locked && tileMask(t) !== rotateMask(t.kind.baseMask, puzzle.solution.get(c));
  });
  return cell === undefined ? null : cell;
}
