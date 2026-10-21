/**
 * Game catalogue, mirroring the Android app: GameModels.kt (names, taglines, categories),
 * Theme.kt (game colours), Visuals.kt (icons) and GameGuide.kt (how to play, per-difficulty rules).
 */

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

const secondsPerPattern = { EASY: 25, MEDIUM: 20, HARD: 15 };
const matrixRules = {
  EASY: { startGrid: 3, startLength: 3, ordered: false },
  MEDIUM: { startGrid: 4, startLength: 4, ordered: false },
  HARD: { startGrid: 4, startLength: 4, ordered: true },
};
const logicRules = { EASY: [4, 150, false], MEDIUM: [5, 180, true], HARD: [6, 180, true] };
const pairs = { EASY: 6, MEDIUM: 8, HARD: 10 };
const oddSeconds = { EASY: 15, MEDIUM: 13, HARD: 12 };
const oddFlavour = {
  EASY: 'Clear differences in shape and size',
  MEDIUM: 'Rotations, mirror images and number rules',
  HARD: 'Subtle turns and multiples to spot',
};
const wordLengths = { EASY: '4–5', MEDIUM: '6', HARD: '7–8' };
const wordSeconds = { EASY: 150, MEDIUM: 165, HARD: 180 };

const minutes = (s) => `${Math.floor(s / 60)} minutes for all of them${s % 60 ? ` ${s % 60} seconds` : ''}`;

/**
 * `hints` is the web allowance: the same number of hints the app offers per game
 * (its free hints plus its optional video hints), all free here because the site has no rewarded videos.
 */
export const GAMES = [
  {
    type: 'DAILY',
    slug: 'daily-challenge',
    title: 'Daily Challenge',
    tagline: '12 mixed puzzles, new every day',
    category: 'NUMBERS',
    color: '#0FB5A6',
    icon: 'calendar_month',
    hints: 2,
    howToPlay: [
      '12 puzzles mixing quick maths and number patterns.',
      'Everyone gets the same puzzles today; a new set arrives at midnight.',
    ],
    rules: () => ['12 puzzles that ramp from Easy to Hard', '20 seconds per puzzle', 'Faster answers and streaks score more'],
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
    rules: (d) => {
      const r = matrixRules[d];
      return [
        `Starts with ${r.startLength} tiles on a ${r.startGrid}×${r.startGrid} grid`,
        r.ordered ? 'Repeat the tiles in the exact order shown' : 'Tap the tiles in any order',
        '3 lives, up to 10 rounds',
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
    rules: (d) => [`${pairs[d]} pairs to find`, 'Memorize the cards during the preview', 'Fewer moves and less time means a higher score'],
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
    rules: (d) => {
      const [size, secs, tees] = logicRules[d];
      return [
        `3 boards of ${size}×${size} tiles`,
        minutes(secs),
        tees ? 'Decoy T-pieces join in to mislead you' : 'Only straight and corner pieces',
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
    rules: (d) => ['12 grids to search', `${oddSeconds[d]} seconds per grid`, oddFlavour[d]],
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
    rules: (d) => [
      `8 words, ${wordLengths[d]} letters long`,
      `${wordSeconds[d]} seconds for the round`,
      d === 'HARD' ? 'Clues are hidden until you use a hint' : 'A clue is shown for every word',
    ],
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
    rules: (d) => ['10 number patterns', `${secondsPerPattern[d]} seconds per pattern`, 'Faster answers and streaks score more'],
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
    rules: () => ['60 seconds on the clock', "Difficulty adapts to how you're doing", 'Chain correct answers for combo bonuses'],
  },
];

const sudokuRules = {
  EASY: ['About 40 clues', 'Every step can be found by scanning, no guessing'],
  MEDIUM: ['About 32 clues', 'Fewer clues, still no guessing needed'],
  HARD: ['24–30 clues', 'Needs more advanced solving techniques'],
};

/**
 * Games that are only on the website (not in the Android app). They run in their own frames
 * instead of the timed shell; `levels` says whether the page lists Easy/Medium/Hard rules.
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
    rules: (d) => [...sudokuRules[d], 'A new daily puzzle, plus unlimited random ones'],
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
