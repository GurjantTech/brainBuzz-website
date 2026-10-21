/**
 * Sudoku Daily (website only). A grid is 81 numbers, row by row; 0 is an empty cell.
 *
 * generate() fills a complete grid with a seeded random backtracking search, then removes clues one
 * at a time, keeping a removal only if the puzzle still has exactly one solution. Easy and Medium
 * must also stay solvable with singles alone (no guessing). Every puzzle is verified before use;
 * if generation ever fails, a bundled, verified puzzle is used instead.
 */
import { KRandom } from '../lib/random.js';

export const SIZE = 81;
const ALL = 0x3fe; // bits 1..9

/** Clue targets per level. Removal stops at the target or when no more cells can go. */
export const SUDOKU_LEVELS = {
  EASY: { clues: 40, singles: true },
  MEDIUM: { clues: 32, singles: true },
  HARD: { clues: 24, singles: false },
};

export const rowOf = (i) => Math.floor(i / 9);
export const colOf = (i) => i % 9;
export const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

/** The 20 cells sharing a row, column or box with each cell. */
export const PEERS = Array.from({ length: SIZE }, (_, i) => {
  const out = [];
  for (let j = 0; j < SIZE; j++) {
    if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) out.push(j);
  }
  return out;
});

const UNITS = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (_, k) => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3))),
];

const bitCount = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };

function candidates(grid, i) {
  let used = 0;
  for (const p of PEERS[i]) used |= 1 << grid[p];
  return ALL & ~used;
}

/** Counts solutions up to `limit` (2 is enough to prove uniqueness). Fills `out` with the first one found. */
export function countSolutions(puzzle, limit = 2, out = null) {
  const grid = puzzle.slice();
  for (let i = 0; i < SIZE; i++) {
    if (grid[i] && (candidates(grid, i) & (1 << grid[i])) === 0) return 0; // clashing clues
  }
  let count = 0;
  const search = () => {
    // Most constrained empty cell first keeps the search tiny.
    let best = -1;
    let bestMask = 0;
    let bestN = 10;
    for (let i = 0; i < SIZE; i++) {
      if (grid[i]) continue;
      const m = candidates(grid, i);
      const n = bitCount(m);
      if (n < bestN) { best = i; bestMask = m; bestN = n; if (n <= 1) break; }
    }
    if (best < 0) {
      count++;
      if (out && count === 1) for (let i = 0; i < SIZE; i++) out[i] = grid[i];
      return count >= limit;
    }
    for (let d = 1; d <= 9; d++) {
      if (!(bestMask & (1 << d))) continue;
      grid[best] = d;
      if (search()) return true;
    }
    grid[best] = 0;
    return false;
  };
  search();
  return count;
}

export function solve(puzzle) {
  const out = new Array(SIZE).fill(0);
  return countSolutions(puzzle, 1, out) === 1 ? out : null;
}

/** True if repeated naked and hidden singles fill the grid, i.e. it needs no guessing. */
export function solvableBySingles(puzzle) {
  const grid = puzzle.slice();
  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < SIZE; i++) {
      if (grid[i]) continue;
      const m = candidates(grid, i);
      if (m === 0) return false;
      if (bitCount(m) === 1) { grid[i] = 31 - Math.clz32(m); progress = true; }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        let spot = -1;
        let places = 0;
        let placed = false;
        for (const i of unit) {
          if (grid[i] === d) { placed = true; break; }
          if (!grid[i] && (candidates(grid, i) & (1 << d))) { spot = i; places++; }
        }
        if (!placed && places === 1) { grid[spot] = d; progress = true; }
      }
    }
  }
  return grid.every((v) => v !== 0);
}

/** A complete grid where every row, column and box holds 1–9 once. */
export function isValidSolution(grid) {
  if (!Array.isArray(grid) || grid.length !== SIZE) return false;
  return UNITS.every((unit) => {
    let seen = 0;
    for (const i of unit) {
      const v = grid[i];
      if (!Number.isInteger(v) || v < 1 || v > 9 || seen & (1 << v)) return false;
      seen |= 1 << v;
    }
    return true;
  });
}

/** Puzzle is well formed, agrees with the solution and has exactly one solution. */
export function verifyPuzzle(puzzle, solution) {
  if (!Array.isArray(puzzle) || puzzle.length !== SIZE || !isValidSolution(solution)) return false;
  if (!puzzle.every((v, i) => v === 0 || v === solution[i])) return false;
  return countSolutions(puzzle, 2) === 1;
}

function fullGrid(rng) {
  const grid = new Array(SIZE).fill(0);
  const fill = (i) => {
    if (i === SIZE) return true;
    for (const d of rng.shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (candidates(grid, i) & (1 << d)) {
        grid[i] = d;
        if (fill(i + 1)) return true;
      }
    }
    grid[i] = 0;
    return false;
  };
  return fill(0) ? grid : null;
}

function carve(solution, level, rng) {
  const { clues, singles } = SUDOKU_LEVELS[level];
  const puzzle = solution.slice();
  let left = SIZE;
  // Remove symmetric pairs for a balanced look; the centre cell is its own pair.
  for (const i of rng.shuffled(Array.from({ length: 41 }, (_, k) => k))) {
    if (left <= clues) break;
    const pair = i === 40 ? [40] : [i, 80 - i];
    if (left - pair.length < clues - 1) continue;
    const saved = pair.map((p) => puzzle[p]);
    pair.forEach((p) => { puzzle[p] = 0; });
    if (countSolutions(puzzle, 2) === 1 && (!singles || solvableBySingles(puzzle))) left -= pair.length;
    else pair.forEach((p, k) => { puzzle[p] = saved[k]; });
  }
  return puzzle;
}

/** Text form used for the fallback set and saved games: 81 digits, 0 for blanks. */
export const toText = (grid) => grid.join('');
export const fromText = (text) => (typeof text === 'string' && /^[0-9]{81}$/.test(text) ? text.split('').map(Number) : null);

/** Verified puzzles (checked by tests/games.test.js) used only if generation fails. */
export const FALLBACK = {
  EASY: [
    ['491700002053429010002001003000200509380605024504007000700300200010542370200008945', '491763852853429617672851493167284539389615724524937168745396281918542376236178945'],
    ['602800479509000006847100005490006000078050360000700098700008641900000507186004903', '612835479539427816847169235491386752278951364365742198753298641924613587186574923'],
  ],
  MEDIUM: [
    ['050400031300010050608300000000543070047000160090671000000002604070050002430006010', '759468231324917856618325749261543978547289163893671425185732694976154382432896517'],
    ['500400790000000401400906852004600008000109000600007100246801007305000000071004005', '562418793839275461417936852194623578758149326623587149246851937385792614971364285'],
  ],
  HARD: [
    ['320908054900000836050000000003120000000703000000045700000000020489000001230501048', '326978154971254836854316297763129485548763912192845763615487329489632571237591648'],
    ['050006200000005084020100600600093028000000000790860001007008090480500000002600040', '854376219176925384329184657641793528238451976795862431567248193483519762912637845'],
  ],
};

function fallback(level, rng) {
  const list = FALLBACK[level] || FALLBACK.EASY;
  for (const [p, s] of rng.shuffled(list)) {
    const puzzle = fromText(p);
    const solution = fromText(s);
    if (puzzle && solution && verifyPuzzle(puzzle, solution)) return { puzzle, solution, fallback: true };
  }
  return null;
}

/**
 * Returns { puzzle, solution, clues, fallback } for a level. Pass a seed for a repeatable puzzle
 * (the daily one); without it the puzzle is random.
 */
export function generate(level, seed = null) {
  const lv = SUDOKU_LEVELS[level] ? level : 'EASY';
  const rng = seed === null ? KRandom.fresh() : KRandom.ofSeed(seed);
  const singles = SUDOKU_LEVELS[lv].singles;
  let spare = null;
  // Hard prefers a puzzle that singles alone can't finish; after a few tries it keeps the best valid one.
  for (let attempt = 0; attempt < (singles ? 3 : 8); attempt++) {
    try {
      const solution = fullGrid(rng);
      if (!solution) continue;
      const puzzle = carve(solution, lv, rng);
      if (!verifyPuzzle(puzzle, solution)) continue;
      const found = { puzzle, solution, clues: puzzle.filter(Boolean).length, fallback: false };
      if (singles) { if (solvableBySingles(puzzle)) return found; continue; }
      if (!solvableBySingles(puzzle)) return found;
      if (!spare || found.clues < spare.clues) spare = found;
    } catch (e) { /* try again, then fall back */ }
  }
  if (spare) return spare;
  const fb = fallback(lv, rng);
  if (fb) return { ...fb, clues: fb.puzzle.filter(Boolean).length };
  throw new Error('No valid Sudoku available');
}

/** The same puzzle for everyone on a given local date and level. */
export const dailySeed = (epochDay, level) => epochDay * 7 + { EASY: 1, MEDIUM: 2, HARD: 3 }[level];
