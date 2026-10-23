/**
 * Daily Challenge (DailyMix.kt): 12 Hard puzzles from all seven games, the same for everyone on a date,
 * in the app and on the website. Kept call-for-call identical to the Kotlin so the same day gives the same set.
 */
import { KRandom } from '../lib/random.js';
import { Difficulty } from './models.js';
import { MathGenerator, SequenceGenerator } from './quiz.js';
import { generateOdd, ODD_PUZZLES } from './odd.js';
import { bank, scramble } from './words.js';
import { matrixPattern, deal } from './memory.js';
import { generatePath } from './logic-path.js';

export const DAILY_STAGES = ['MATH', 'MATH', 'SEQUENCE', 'SEQUENCE', 'ODD', 'ODD', 'WORD', 'WORD', 'MATRIX', 'MATRIX', 'MEMORY', 'LOGIC'];
export const DAILY_TOTAL = DAILY_STAGES.length;

/** Time for each puzzle; Memory Matrix and Memory Match only start the clock once the pattern or preview is over. */
export const STAGE_TIME_MS = { MATH: 20000, SEQUENCE: 20000, ODD: 20000, WORD: 40000, MATRIX: 20000, MEMORY: 45000, LOGIC: 60000 };

export const STAGE_LABEL = {
  MATH: 'Quick Math', SEQUENCE: 'Number Sequence', ODD: 'Odd One Out', WORD: 'Word Scramble',
  MATRIX: 'Memory Matrix', MEMORY: 'Memory Match', LOGIC: 'Logic Path',
};

/** Memory Matrix: 6 tiles on a 5×5 grid, repeated in order. Memory Match: 6 pairs. Logic Path: one 5×5 board. */
export const DAILY_MATRIX = { gridSize: 5, length: 6, flashMs: 550 };
export const DAILY_MEMORY_PREVIEW_MS = 1500;
export const DAILY_MEMORY_COLUMNS = 3;

/** A shuffled order where the same game never comes twice in a row (reshuffled until it doesn't). */
function stageOrder(random) {
  let order = random.shuffled(DAILY_STAGES);
  for (let attempt = 0; attempt < 100 && order.some((kind, i) => i > 0 && kind === order[i - 1]); attempt++) {
    order = random.shuffled(DAILY_STAGES);
  }
  return order;
}

export function dailyMix(epochDay) {
  const random = KRandom.ofSeed(BigInt(epochDay) * 7919n + 104729n);
  const hard = Difficulty.HARD;
  const math = new MathGenerator(random);
  const seq = new SequenceGenerator(random);
  const words = bank(hard);
  let lastWord = null;
  return stageOrder(random).map((kind) => {
    switch (kind) {
      case 'MATH': return { kind, question: math.next(hard) };
      case 'SEQUENCE': return { kind, question: seq.next(hard) };
      case 'ODD': return { kind, puzzle: generateOdd(hard, ODD_PUZZLES - 1, random) };
      case 'WORD': {
        let entry;
        do entry = words[random.nextIntUntil(words.length)]; while (entry.word === lastWord);
        lastWord = entry.word;
        return { kind, entry, letters: scramble(entry.word, random) };
      }
      case 'MATRIX': return { kind, pattern: matrixPattern(DAILY_MATRIX, random) };
      case 'MEMORY': return { kind, cards: deal(Difficulty.EASY, random) };
      default: return { kind, puzzle: generatePath(Difficulty.MEDIUM, 1, random) };
    }
  });
}
