/**
 * Game catalogue, mirroring the Android app: GameModels.kt (names, taglines, categories),
 * Theme.kt (game colours), Visuals.kt (icons) and GameGuide.kt (how to play).
 * On the website the games have levels 1–100 (engine/levels.js); `rules(level)` describes one level.
 */
import {
  levelOf, matrixLevel, memoryLevel, logicLevel, oddLevel, wordLevel, sequenceTimeMs, mathLevel, sudokuLevel, passRule,
} from './levels.js';

/**
 * One line of a level's rules, shown as an icon card on the level picker: a bold [title], a smaller [sub],
 * and [text], the same rule as one sentence for plain lists (game pages).
 */
const rule = (icon, title, sub, text = `${title} ${sub}`) => ({ icon, title, sub, text });
/** A rule as a sentence: level rules are objects, the other games' rules plain strings. */
export const ruleText = (r) => (typeof r === 'string' ? r : r.text);

export const Difficulty = {
  EASY: { name: 'EASY', label: 'Easy', multiplier: 1.0, ordinal: 0 },
  MEDIUM: { name: 'MEDIUM', label: 'Medium', multiplier: 1.5, ordinal: 1 },
  HARD: { name: 'HARD', label: 'Hard', multiplier: 2.0, ordinal: 2 },
};
export const DIFFICULTIES = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];
export const difficultyOf = (name) => Difficulty[name] || null;

export const Category = {
  MEMORY: 'Memory',
  LOGIC: 'Logic',
  NUMBERS: 'Numbers',
  VISUAL: 'Visual',
  WORDS: 'Words',
};

const oddFlavour = {
  EASY: ['Clear differences', 'in shape and size'],
  MEDIUM: ['Turns and mirrors', 'plus number rules'],
  HARD: ['Subtle turns', 'and multiples to spot'],
};
const wordLengths = (lv) => (wordLevel(lv.level).maxLength ? '4' : { EASY: '4–5', MEDIUM: '6', HARD: '7–8' }[lv.name]);
const sequenceFlavour = {
  EASY: ['Steady steps', 'and doubling'],
  MEDIUM: ['Growing gaps', 'squares and multiplying'],
  HARD: ['Fibonacci and primes', 'cubes and triangular numbers'],
};
const MATH_OPS = { add: 'adding', subtract: 'subtracting', multiply: 'times tables', divide: 'division', twoStep: 'two-step sums', square: 'squares' };
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const listJoin = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

const minutes = (s) => `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}`;

/**
 * `hints` is the web allowance: the same number of hints the app offers per game
 * (its free hints plus its optional video hints), all free here because the site has no rewarded videos.
 */
export const GAMES = [
  {
    type: 'DAILY',
    slug: 'daily-challenge',
    title: 'Daily Challenge',
    tagline: '12 hard puzzles from every game, new every day',
    category: 'NUMBERS',
    color: '#0FB5A6',
    icon: 'calendar_month',
    hints: 2,
    howToPlay: [
      '12 Hard puzzles from all seven games: maths, number patterns, odd one out, word scramble, memory tiles, card pairs and pipes.',
      'Everyone gets the same puzzles today; a new set arrives at midnight.',
    ],
    rules: () => ['12 Hard puzzles from all seven games', 'Each puzzle has its own clock (20 to 60 seconds)', 'Faster answers and streaks score more'],
  },
  {
    type: 'MATRIX',
    slug: 'memory-matrix',
    title: 'Memory Matrix',
    tagline: 'Watch the tiles light up, then repeat them',
    category: 'MEMORY',
    color: '#4F5FE0',
    icon: 'apps',
    hints: 3,
    howToPlay: [
      'Watch the tiles light up one by one.',
      'When they go dark, tap the same tiles.',
      'Clear a round and the next one is a tile longer. A miss costs a life and makes the next round easier.',
    ],
    rules: (lv) => {
      const r = matrixLevel(lv.level);
      return [
        rule('apps', `${r.startLength} tiles to start`, `on a ${r.startGrid}×${r.startGrid} grid`, `Starts with ${r.startLength} tiles on a ${r.startGrid}×${r.startGrid} grid`),
        r.ordered
          ? rule('timeline', 'In order', 'repeat the exact order', 'Repeat the tiles in the exact order shown')
          : rule('grid_on', 'Any order', 'tap the lit tiles', 'Tap the tiles in any order'),
        rule('favorite', '3 lives', 'up to 10 rounds', '3 lives, up to 10 rounds'),
        passRule('MATRIX'),
      ];
    },
  },
  {
    type: 'MEMORY',
    slug: 'memory-match',
    title: 'Memory Match',
    tagline: 'Flip cards and find every pair',
    category: 'MEMORY',
    color: '#4EA8FF',
    icon: 'style',
    hints: 2,
    howToPlay: ['Memorize the cards while they are face up.', 'Flip two cards at a time to find matching pairs.'],
    rules: (lv) => {
      const r = memoryLevel(lv.level);
      return [
        rule('style', `${r.pairs} pairs`, 'to find'),
        rule('visibility', `${r.previewMs / 1000} seconds`, 'to memorize the cards'),
        rule('timer', 'Be quick', 'fewer moves score more', 'Fewer moves and less time means a higher score'),
        passRule('MEMORY'),
      ];
    },
  },
  {
    type: 'LOGIC_PATH',
    slug: 'logic-path',
    title: 'Logic Path',
    tagline: 'Rotate pipes to link start and finish',
    category: 'LOGIC',
    color: '#16825A',
    icon: 'route',
    hints: 3,
    howToPlay: [
      'Tap a tile to turn it a quarter turn.',
      'Link the start arrow on the left to the goal on the right.',
      'Connected pipes light up and show a dot, so you can see how far the path reaches.',
    ],
    rules: (lv) => {
      const r = logicLevel(lv.level);
      return [
        rule('route', '3 boards', `of ${r.size}×${r.size} tiles`),
        rule('timer', minutes(r.roundTimeMs / 1000), 'for all three boards'),
        r.teeChance > 0
          ? rule('extension', 'Decoy T-pieces', 'join in to mislead you')
          : rule('extension', 'Simple pipes', 'straights and corners only', 'Only straight and corner pieces'),
        passRule('LOGIC_PATH'),
      ];
    },
  },
  {
    type: 'ODD_ONE_OUT',
    slug: 'odd-one-out',
    title: 'Odd One Out',
    tagline: "Spot the one that doesn't belong",
    category: 'VISUAL',
    color: '#C73565',
    icon: 'center_focus_strong',
    hints: 3,
    howToPlay: [
      'Every item in the grid matches except one.',
      'It may differ in shape, size, direction, mirroring or a number rule.',
      'Tap it before the timer runs out.',
    ],
    rules: (lv) => {
      const r = oddLevel(lv.level);
      const [title, sub] = r.subtleTurnsOnly ? ['Arrows turned 45°', 'mirrors and multiples'] : oddFlavour[lv.name];
      return [
        rule('grid_view', '12 grids', `of up to ${r.count} items`),
        rule('timer', `${r.timeMs / 1000} seconds`, 'per grid'),
        rule('visibility', title, sub, `${title}, ${sub}`),
        passRule('ODD_ONE_OUT'),
      ];
    },
  },
  {
    type: 'WORD_SCRAMBLE',
    slug: 'word-scramble',
    title: 'Word Scramble',
    tagline: 'Unscramble the letters into a word',
    category: 'WORDS',
    color: '#A86200',
    icon: 'abc',
    hints: 6,
    howToPlay: [
      'Tap letters to spell a word using all of them.',
      'Tap a placed letter to send it back.',
      'Stuck? A hint shows the clue or places a letter for you, or skip the word.',
    ],
    rules: (lv) => {
      const r = wordLevel(lv.level);
      return [
        rule('abc', `${r.words} words`, `${wordLengths(lv)} letters long`, `${r.words} words, ${wordLengths(lv)} letters long`),
        rule('timer', `${r.roundTimeMs / 1000} seconds`, 'for the round'),
        r.clueVisible
          ? rule('lightbulb', 'Clue for', 'every word', 'A clue is shown for every word')
          : rule('lightbulb', 'Hidden clues', 'until you use a hint', 'Clues are hidden until you use a hint'),
        passRule('WORD_SCRAMBLE'),
      ];
    },
  },
  {
    type: 'SEQUENCE',
    slug: 'number-sequence',
    title: 'Number Sequence Master',
    tagline: 'Spot the pattern, find the next number',
    category: 'NUMBERS',
    color: '#6C4BF4',
    icon: 'timeline',
    hints: 3,
    howToPlay: ['Work out the rule behind the numbers.', 'Pick the number that comes next.'],
    rules: (lv) => {
      const [title, sub] = sequenceFlavour[lv.name];
      return [
        rule('timeline', '10 patterns', 'find the next number'),
        rule('timer', `${sequenceTimeMs(lv.level) / 1000} seconds`, 'per pattern'),
        rule('psychology', title, sub, `${title}, ${sub}`),
        passRule('SEQUENCE'),
      ];
    },
  },
  {
    type: 'MATH',
    slug: 'quick-math',
    title: 'Quick Math Rush',
    tagline: '60-second mental arithmetic sprint',
    category: 'NUMBERS',
    color: '#FF8A3D',
    icon: 'calculate',
    hints: 3,
    howToPlay: [
      'Solve as many sums as you can in 60 seconds.',
      "Get a few right in a row and the sums get harder; miss a couple and they ease off.",
    ],
    rules: (lv) => {
      const r = mathLevel(lv.level);
      const ops = capitalize(listJoin(r.ops.map((o) => MATH_OPS[o])));
      return [
        rule('timer', '60 seconds', 'on the clock'),
        rule('calculate', `Numbers up to ${r.top}`, ops.toLowerCase(), `${ops}, numbers up to ${r.top}`),
        rule('trending_up', 'Adapts to you', 'within 10 levels', "Sums adapt to how you're doing, within 10 levels"),
        passRule('MATH'),
      ];
    },
  },
];

/** The levels shown on game pages to describe how a game ramps up. */
export const SAMPLE_LEVELS = [1, 25, 50, 75, 100].map(levelOf);

/**
 * Games that are only on the website (not in the Android app). They run in their own frames
 * instead of the timed shell; `levels` says whether the game has levels 1–100.
 */
export const WEB_GAMES = [
  {
    type: 'MERGE',
    slug: '2048',
    title: '2048 Merge Challenge',
    tagline: 'Slide and merge tiles to reach 2048',
    category: 'NUMBERS',
    color: '#C2410C',
    icon: 'grid_view',
    web: true,
    levels: false,
    howToPlay: [
      'Swipe, or use the arrow keys, to slide every tile on the board.',
      'Two tiles with the same number merge into one when they touch.',
      'Every move adds a new tile. Reach 2048, then keep going for a higher score.',
    ],
    rules: () => ['4×4 board, starting with two tiles', 'Each merge adds the new tile’s value to your score', 'The game ends when no tile can move'],
  },
  {
    type: 'DETECTIVE',
    slug: 'word-detective',
    title: 'Word Detective',
    tagline: 'Crack the hidden five-letter word',
    category: 'WORDS',
    color: '#0B7285',
    icon: 'search',
    web: true,
    levels: false,
    howToPlay: [
      'Guess the hidden five-letter word in six tries. Every guess must be a real word.',
      'Teal with a check: right letter, right place. Amber with a dot: in the word, but elsewhere. Grey: not in the word.',
      'Everyone gets the same daily word. Practice words are unlimited.',
    ],
    rules: () => ['A new daily word at midnight, your time', '6 guesses of five-letter words', 'Daily streaks and stats, plus unlimited practice'],
  },
  {
    type: 'SUDOKU',
    slug: 'sudoku',
    title: 'Sudoku Daily',
    tagline: 'Fill the grid so every row, column and box has 1–9',
    category: 'LOGIC',
    color: '#1864AB',
    icon: 'grid_on',
    web: true,
    levels: true,
    howToPlay: [
      'Fill every empty cell so each row, column and 3×3 box contains 1 to 9 once.',
      'Pick a cell, then a number. Notes mode lets you pencil in candidates.',
      'Wrong numbers are marked straight away. A hint fills in a correct cell.',
    ],
    rules: (lv) => {
      const r = sudokuLevel(lv.level);
      return [
        rule('grid_on', `About ${r.clues} clues`, 'to start from', `About ${r.clues} clues`),
        r.singles
          ? rule('psychology', 'No guessing', 'every step can be found', 'Every step can be found by scanning, no guessing')
          : rule('psychology', 'Advanced', 'needs harder techniques', 'Needs more advanced solving techniques'),
        rule('star', '3 stars', 'no mistakes, no hints', 'Three stars for no mistakes and no hints'),
        rule('task_alt', 'Solve it', 'to unlock next level', 'Solve it to unlock the next level'),
      ];
    },
  },
];

/** Every game on the website: the app's games, then the website-only ones. */
export const ALL_GAMES = [...GAMES, ...WEB_GAMES];

export const gameByType = (type) => ALL_GAMES.find((g) => g.type === type);
export const gameBySlug = (slug) => ALL_GAMES.find((g) => g.slug === slug);

/** Games in the library order the app uses (the Daily Challenge has its own card), then the website-only games. */
export const LIBRARY = ALL_GAMES.filter((g) => g.type !== 'DAILY');

/** Shared accuracy rule (GameModels.kt accuracyOf). */
export function accuracyOf(type, correct, total, moves) {
  if (type === 'MEMORY') return moves === 0 ? 0 : Math.min(1, total / moves);
  if (total === 0) return 0;
  return correct / total;
}

/** Results headline by accuracy (ResultsScreen.kt). */
export function resultTitle(accuracy) {
  // The app compares single-precision floats; do the same so borderline scores agree.
  const a = Math.fround(accuracy);
  const f = Math.fround;
  if (a >= 1) return 'Flawless!';
  if (a >= f(0.85)) return 'Brilliant!';
  if (a >= f(0.65)) return 'Great job!';
  if (a >= f(0.4)) return 'Good effort!';
  return 'Keep practicing!';
}
