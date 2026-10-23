/**
 * Website level ladder: every timed game (and Sudoku) has levels 1–100 instead of the app's Easy/Medium/Hard.
 *
 * A level is a difficulty object the engines already understand: `name` is the app tier whose content it uses
 * (word banks, puzzle kinds, number patterns), `multiplier` scales the score, and `level` switches each engine
 * to the per-level numbers below, which ramp smoothly from level 1 (gentle) to level 100 (hardest).
 * The app's own Difficulty objects have no `level`, so they still produce exactly the app's games.
 */
export const MAX_LEVEL = 100;

const lerp = (a, b, t) => a + (b - a) * t;
/** Progress through the levels, 0 at level 1 and 1 at level 100. */
const progress = (level) => (level - 1) / (MAX_LEVEL - 1);

export const clampLevel = (n) => Math.min(MAX_LEVEL, Math.max(1, Math.trunc(Number(n)) || 1));

/** Content tier for a level: 1–33 use the app's Easy content, 34–66 Medium, 67–100 Hard. */
export const tierOf = (level) => (level <= 33 ? 'EASY' : level <= 66 ? 'MEDIUM' : 'HARD');

const cache = new Map();
export function levelOf(n) {
  const level = clampLevel(n);
  if (!cache.has(level)) {
    // Points scale from ×1 at level 1 to ×2 at level 100 (the app's Easy and Hard multipliers).
    const multiplier = Math.round(100 + progress(level) * 100) / 100;
    cache.set(level, Object.freeze({ name: tierOf(level), label: `Level ${level}`, level, multiplier, ordinal: level - 1 }));
  }
  return cache.get(level);
}

/** "L12" ⇄ 12, the key used for per-level bests in the store. */
export const levelKey = (level) => `L${level}`;
export function parseLevelKey(key) {
  const m = /^L(\d{1,3})$/.exec(String(key));
  return m && Number(m[1]) >= 1 && Number(m[1]) <= MAX_LEVEL ? Number(m[1]) : null;
}

// ---------- Per-game curves ----------

/** Memory Matrix: longer patterns, bigger grids and faster flashes; from level 41 the order matters too. */
export function matrixLevel(level) {
  const ordered = level >= 41;
  const startLength = ordered ? 4 + Math.trunc((level - 41) / 15) : 2 + Math.trunc((level - 1) / 10);
  const startGrid = level <= 15 ? 3 : level <= 70 ? 4 : 5;
  return {
    startGrid, maxGrid: Math.min(startGrid + 2, 6), startLength, ordered,
    flashMs: Math.round(lerp(850, 420, progress(level))),
  };
}

/** Memory Match: 3 pairs at level 1 up to 12 at level 100, with a shorter preview. */
export function memoryLevel(level) {
  const pairs = Math.min(12, 3 + Math.trunc((level - 1) / 11));
  return {
    pairs,
    columns: pairs === 3 ? 3 : pairs === 5 ? 5 : 4,
    previewMs: Math.round(lerp(2600, 800, progress(level)) / 100) * 100,
  };
}

/** Logic Path: 4×4 up to 7×7 boards, longer paths, more decoy T-pieces and less time within each board size. */
export function logicLevel(level) {
  const bands = [[25, 4, 160], [60, 5, 190], [90, 6, 220], [MAX_LEVEL, 7, 240]];
  let from = 1;
  for (const [to, size, seconds] of bands) {
    if (level <= to) {
      const inBand = to === from ? 1 : (level - from) / (to - from);
      return {
        size, puzzles: 3,
        roundTimeMs: Math.round((seconds - 40 * inBand) / 5) * 5000,
        teeChance: level <= 15 ? 0 : Math.fround(Math.min(0.5, (level - 15) / 170)),
        extraLength: Math.trunc((level - 1) / 20),
      };
    }
    from = to + 1;
  }
  return null;
}

/** Odd One Out: bigger grids and less time per grid; the hardest levels only turn arrows by 45°. */
export function oddLevel(level) {
  const [count, columns] = level <= 20 ? [9, 3] : level <= 50 ? [12, 3] : level <= 80 ? [16, 4] : [20, 4];
  return {
    count, columns,
    timeMs: Math.round(lerp(16, 8, progress(level)) * 2) * 500,
    subtleTurnsOnly: level >= 85,
  };
}

/** Word Scramble: 5 words at first, 8 from level 25; less time per word; 4-letter words only on the first levels. */
export function wordLevel(level) {
  const words = 5 + Math.min(3, Math.trunc((level - 1) / 8));
  return {
    words,
    roundTimeMs: Math.round((words * lerp(26, 18, progress(level))) / 5) * 5000,
    maxLength: level <= 12 ? 4 : null,
    clueVisible: level < 80,
  };
}

/** Number Sequence Master: 30 seconds per pattern at level 1, 10 at level 100. */
export const sequenceTimeMs = (level) => Math.round(lerp(30, 10, progress(level))) * 1000;

/**
 * Quick Math Rush: which sums appear and how big the numbers get. Adding and subtracting from level 1,
 * times tables from 8, division from 20, two-step sums from 45 and squares from 60.
 */
export function mathLevel(level) {
  const ops = ['add', 'subtract'];
  if (level >= 8) ops.push('multiply');
  if (level >= 20) ops.push('divide');
  if (level >= 45) ops.push('twoStep');
  if (level >= 60) ops.push('square');
  // Numbers grow slowly at first and faster later: 10 at level 1, about 100 at level 34, 500 at level 100.
  const top = 10 + Math.trunc((level - 1) ** 1.5 / 2);
  return {
    ops,
    top,
    low: Math.max(1, Math.trunc(top / 4)),
    table: Math.min(20, 4 + Math.trunc(level / 5)),
    square: [5 + Math.trunc(level / 10), 10 + Math.trunc(level / 4)],
  };
}
/** Quick Math adapts within ±10 levels of the chosen one, 5 levels per step. */
export const MATH_ADAPT_RANGE = 10;
export const MATH_ADAPT_STEP = 5;
export const MATH_PASS_CORRECT = 8;

/** Sudoku: 46 clues at level 1 down to 24 at level 100; up to level 70 every step can be found by singles. */
export function sudokuLevel(level) {
  return { clues: Math.round(lerp(46, 24, progress(level))), singles: level <= 70 };
}

// ---------- Passing and stars ----------

/** Sudoku is always solved in the end, so its stars count mistakes and hints instead. */
export const sudokuStars = (mistakes, hints) => (mistakes === 0 && hints === 0 ? 3 : mistakes <= 3 && hints <= 1 ? 2 : 1);

/** Accuracy needed for 1, 2 and 3 stars. Memory Match accuracy is pairs ÷ moves, so it is set lower. */
const STAR_AT = { MEMORY: [0.4, 0.6, 0.85] };
const DEFAULT_STAR_AT = [0.6, 0.8, 1];

export const passAccuracy = (type) => (STAR_AT[type] || DEFAULT_STAR_AT)[0];

/**
 * Stars for a finished level: 0 means not passed. Three stars need the top accuracy without hints.
 * Quick Math Rush also needs MATH_PASS_CORRECT right answers, so one lucky answer can't pass a level.
 */
export function starsFor(type, accuracy, { correct = 0, hintsUsed = 0 } = {}) {
  if (type === 'MATH' && correct < MATH_PASS_CORRECT) return 0;
  const [one, two, three] = STAR_AT[type] || DEFAULT_STAR_AT;
  const a = accuracy + 1e-9;
  if (a >= three && hintsUsed === 0) return 3;
  if (a >= two) return 2;
  return a >= one ? 1 : 0;
}

/** What it takes to pass, as a sentence ("Pass with 60% accuracy"). */
export function passText(type) {
  const pct = `${Math.round(passAccuracy(type) * 100)}%`;
  if (type === 'MATH') return `Pass with ${MATH_PASS_CORRECT}+ right answers at ${pct} accuracy`;
  if (type === 'MEMORY') return `Pass with ${pct} accuracy (pairs ÷ moves)`;
  return `Pass with ${pct} accuracy`;
}

/** The pass rule as a rule card for the level picker (same shape as the games' other rules). */
export function passRule(type) {
  const pct = `${Math.round(passAccuracy(type) * 100)}%`;
  const text = `${passText(type)} to unlock the next level`;
  if (type === 'MATH') return { icon: 'task_alt', title: `${MATH_PASS_CORRECT}+ right answers`, sub: `at ${pct} accuracy to pass`, text };
  if (type === 'MEMORY') return { icon: 'task_alt', title: `${pct} accuracy`, sub: 'pairs ÷ moves to pass', text };
  return { icon: 'task_alt', title: `${pct} accuracy`, sub: 'to unlock next level', text };
}
