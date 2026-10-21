/** Memory Matrix (MemoryMatrix.kt) and Memory Match deck (MemoryDeck.kt) rules. */
import { until } from '../lib/random.js';

export const MATRIX_LIVES = 3;
export const MATRIX_MAX_ROUNDS = 10;

export function matrixRules(difficulty) {
  switch (difficulty.name) {
    case 'EASY': return { startGrid: 3, maxGrid: 5, startLength: 3, ordered: false, flashMs: 750 };
    case 'MEDIUM': return { startGrid: 4, maxGrid: 6, startLength: 4, ordered: false, flashMs: 600 };
    default: return { startGrid: 4, maxGrid: 6, startLength: 4, ordered: true, flashMs: 550 };
  }
}

/** Never ask for more than ~40% of the grid, so the pattern stays readable. */
export const maxLengthFor = (gridSize) => Math.trunc((gridSize * gridSize * 2) / 5);

export function levelFor(rules, length) {
  let grid = Math.min(rules.startGrid + Math.trunc(Math.max(length - rules.startLength, 0) / 2), rules.maxGrid);
  while (grid < rules.maxGrid && length > maxLengthFor(grid)) grid++;
  return { gridSize: grid, length: Math.min(length, maxLengthFor(grid)) };
}

/** Length for the next round after a success or a miss; never below the starting length. */
export function nextLength(rules, current, cleared) {
  const ceiling = maxLengthFor(rules.maxGrid);
  return cleared ? Math.min(current + 1, ceiling) : Math.max(current - 1, rules.startLength);
}

/** Distinct cell indices in the order they light up. */
export const matrixPattern = (level, random) => random.shuffled(until(level.gridSize * level.gridSize)).slice(0, level.length);

export const Tap = { CORRECT: 'correct', COMPLETE: 'complete', WRONG: 'wrong', IGNORED: 'ignored' };

/** Validates one tap against the pattern given the cells already tapped correctly. */
export function checkTap(pattern, ordered, tapped, cell) {
  if (tapped.includes(cell)) return Tap.IGNORED;
  const ok = ordered ? pattern[tapped.length] === cell : pattern.includes(cell);
  if (!ok) return Tap.WRONG;
  return tapped.length + 1 === pattern.length ? Tap.COMPLETE : Tap.CORRECT;
}

// Memory Match

export const SYMBOL_COUNT = 10;
export const pairsFor = (difficulty) => ({ EASY: 6, MEDIUM: 8, HARD: 10 })[difficulty.name];
/** Grid columns in portrait; rows follow from the card count. */
export const columnsFor = (difficulty) => (difficulty.name === 'EASY' ? 3 : 4);
export const previewMsFor = (difficulty) => ({ EASY: 2000, MEDIUM: 1500, HARD: 1000 })[difficulty.name];

export function deal(difficulty, random) {
  const symbols = random.shuffled(until(SYMBOL_COUNT)).slice(0, pairsFor(difficulty));
  return random.shuffled([...symbols, ...symbols]).map((symbol, id) => ({ id, symbol, faceUp: false, matched: false }));
}

/** Card faces from MemoryScreen.kt: icon, name and colour per symbol. */
export const SYMBOLS = [
  { icon: 'star', name: 'Star', color: '#FFB23F' },
  { icon: 'favorite', name: 'Heart', color: '#FF5C7A' },
  { icon: 'pets', name: 'Paw', color: '#8D6E63' },
  { icon: 'music_note', name: 'Note', color: '#6C4BF4' },
  { icon: 'wb_sunny', name: 'Sun', color: '#FF8A3D' },
  { icon: 'local_florist', name: 'Flower', color: '#22B573' },
  { icon: 'rocket_launch', name: 'Rocket', color: '#4EA8FF' },
  { icon: 'anchor', name: 'Anchor', color: '#0FB5A6' },
  { icon: 'cloud', name: 'Cloud', color: '#7E8AA6' },
  { icon: 'emoji_nature', name: 'Bee', color: '#B45CE6' },
];
