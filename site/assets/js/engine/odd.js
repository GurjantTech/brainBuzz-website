/**
 * Odd One Out (OddOneOut.kt). Visual puzzles are copies of one item plus a single changed one;
 * number puzzles follow a rule that every item but one obeys.
 */
import { rangeOf } from '../lib/random.js';

export const ODD_PUZZLES = 12;
export const timePerPuzzleMs = (difficulty) => ({ EASY: 15000, MEDIUM: 13000, HARD: 12000 })[difficulty.name];

const SHAPE_LABEL = {
  CIRCLE: 'circle', SQUARE: 'square', TRIANGLE: 'triangle', DIAMOND: 'diamond',
  PENTAGON: 'pentagon', HEXAGON: 'hexagon', STAR: 'star', ARROW: 'arrow',
};
export const shapeLabel = (shape) => SHAPE_LABEL[shape];

const glyph = (shape, rotation = 0, scale = 0.7) => ({ type: 'glyph', shape, rotation, scale });
const number = (value) => ({ type: 'number', value });
const letter = (char, mirrored) => ({ type: 'letter', char, mirrored });

/** Puzzle [index] of a round (0-based); later puzzles lean towards the harder kinds. */
export function generateOdd(difficulty, index, random) {
  const late = index >= ODD_PUZZLES / 2;
  let kinds;
  if (difficulty.name === 'EASY') kinds = late ? ['SHAPE', 'ROTATION', 'DIGITS', 'PARITY'] : ['SHAPE', 'SIZE', 'DIGITS'];
  else if (difficulty.name === 'MEDIUM') kinds = late ? ['ROTATION', 'MIRROR', 'PARITY', 'MULTIPLE'] : ['SHAPE', 'ROTATION', 'PARITY', 'DIGITS'];
  else kinds = ['ROTATION', 'MIRROR', 'MULTIPLE', 'SHAPE'];
  const [count, columns] = { EASY: [9, 3], MEDIUM: [12, 3], HARD: [16, 4] }[difficulty.name];
  switch (random.pick(kinds)) {
    case 'SHAPE': return shapePuzzle(difficulty, count, columns, random);
    case 'SIZE': return sizePuzzle(count, columns, random);
    case 'ROTATION': return rotationPuzzle(difficulty, count, columns, random);
    case 'MIRROR': return mirrorPuzzle(count, columns, random);
    // Number grids stay smaller so they can be read, not just scanned.
    case 'PARITY': return parityPuzzle(difficulty, Math.min(count, 9), 3, random);
    case 'MULTIPLE': return multiplePuzzle(Math.min(count, 9), 3, random);
    default: return digitsPuzzle(Math.min(count, 9), 3, random);
  }
}

function withOdd(count, random, same, odd) {
  const oddIndex = random.nextIntUntil(count);
  return [Array.from({ length: count }, (_, i) => (i === oddIndex ? odd : same)), oddIndex];
}

function shapePuzzle(difficulty, count, columns, random) {
  // Easy pairs look clearly different; harder pairs are close cousins.
  const pairs = difficulty.name === 'EASY'
    ? [['CIRCLE', 'TRIANGLE'], ['SQUARE', 'STAR'], ['TRIANGLE', 'CIRCLE'], ['STAR', 'SQUARE'], ['DIAMOND', 'CIRCLE']]
    : [['HEXAGON', 'PENTAGON'], ['PENTAGON', 'HEXAGON'], ['CIRCLE', 'HEXAGON'], ['SQUARE', 'PENTAGON']];
  const [base, other] = random.pick(pairs);
  const [items, odd] = withOdd(count, random, glyph(base), glyph(other));
  return { items, oddIndex: odd, columns, explanation: `The others are all ${SHAPE_LABEL[base]}s; this one is a ${SHAPE_LABEL[other]}.` };
}

function sizePuzzle(count, columns, random) {
  const shape = random.pick(['CIRCLE', 'SQUARE', 'STAR', 'TRIANGLE']);
  const bigger = random.nextBoolean();
  const [items, odd] = withOdd(count, random, glyph(shape, 0, 0.62), glyph(shape, 0, bigger ? 0.9 : 0.36));
  return { items, oddIndex: odd, columns, explanation: `Same shape, but this one is ${bigger ? 'bigger' : 'smaller'}.` };
}

function rotationPuzzle(difficulty, count, columns, random) {
  const base = random.nextIntUntil(4) * 90;
  // Easy turns the odd arrow right round; Hard only by 45 degrees.
  let turn;
  if (difficulty.name === 'EASY') turn = 180;
  else if (difficulty.name === 'MEDIUM') turn = random.pick([90, 270]);
  else turn = random.pick([45, 315, 90]);
  const [items, odd] = withOdd(count, random, glyph('ARROW', base), glyph('ARROW', (base + turn) % 360));
  return { items, oddIndex: odd, columns, explanation: 'This arrow points a different way from the others.' };
}

function mirrorPuzzle(count, columns, random) {
  // Letters that look different in a mirror (unlike A, H, O, ...).
  const char = random.pick(['F', 'R', 'G', 'J', 'L', 'P', 'K', 'S', 'Z', 'N']);
  const [items, odd] = withOdd(count, random, letter(char, false), letter(char, true));
  return { items, oddIndex: odd, columns, explanation: `This ${char} is mirrored.` };
}

const distinctFrom = (pool, count, random) => random.shuffled(pool).slice(0, count);

export const NumberRule = {
  even: () => ({ name: 'even', holds: (n) => n % 2 === 0 }),
  odd: () => ({ name: 'odd', holds: (n) => n % 2 !== 0 }),
  multipleOf: (k) => ({ name: `multiple of ${k}`, k, holds: (n) => n % k === 0 }),
};

function parityPuzzle(difficulty, count, columns, random) {
  // Always two digits, so no number stands out just for being shorter.
  const range = difficulty.name === 'EASY' ? rangeOf(10, 48) : rangeOf(12, 98);
  const majorityEven = random.nextBoolean();
  const rule = majorityEven ? NumberRule.even() : NumberRule.odd();
  const others = distinctFrom(range.filter(rule.holds), count - 1, random);
  const oddValue = random.pick(range.filter((n) => !rule.holds(n)));
  return numberPuzzle(others, oddValue, columns, rule, random,
    majorityEven ? `All the others are even; ${oddValue} is odd.` : `All the others are odd; ${oddValue} is even.`);
}

function multiplePuzzle(count, columns, random) {
  const k = random.pick([3, 4, 5, 6, 7, 9]);
  const rule = NumberRule.multipleOf(k);
  const range = rangeOf(10, 99);
  const others = distinctFrom(range.filter(rule.holds), count - 1, random);
  // Pick an outsider with the same parity mix so evenness alone doesn't give it away.
  const oddValue = random.pick(range.filter((n) => !rule.holds(n) && (k % 2 !== 0 || n % 2 === 0)));
  return numberPuzzle(others, oddValue, columns, rule, random, `All the others are multiples of ${k}; ${oddValue} isn't.`);
}

/** A repeated number with one mirror-image impostor, e.g. 47 among 74s. */
function digitsPuzzle(count, columns, random) {
  let a;
  let b;
  do {
    a = random.nextIntRange(1, 10);
    b = random.nextIntRange(1, 10);
  } while (a === b);
  const base = a * 10 + b;
  const swapped = b * 10 + a;
  const [items, odd] = withOdd(count, random, number(base), number(swapped));
  return { items, oddIndex: odd, columns, explanation: `Every other number is ${base}; this one is ${swapped}.` };
}

function numberPuzzle(others, oddValue, columns, rule, random, explanation) {
  const oddIndex = random.nextIntUntil(others.length + 1);
  const values = others.slice();
  values.splice(oddIndex, 0, oddValue);
  return { items: values.map(number), oddIndex, columns, explanation, rule };
}

/** Screen-reader description of an item (OddOneOutScreen.kt describe()). */
export function describeItem(item) {
  if (item.type === 'number') return String(item.value);
  if (item.type === 'letter') return `letter ${item.char}${item.mirrored ? ', mirrored' : ''}`;
  const size = item.scale > 0.8 ? 'large ' : item.scale < 0.5 ? 'small ' : '';
  if (item.shape === 'ARROW') return `arrow pointing ${arrowDirection(item.rotation)}`;
  return `${size}${SHAPE_LABEL[item.shape]}`;
}

function arrowDirection(rotation) {
  return { 0: 'up', 45: 'up-right', 90: 'right', 135: 'down-right', 180: 'down', 225: 'down-left', 270: 'left' }[rotation] || 'up-left';
}
