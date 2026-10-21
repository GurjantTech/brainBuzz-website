/**
 * Multiple-choice question generators: Question.kt, MathGenerator.kt (incl. AdaptiveMath),
 * SequenceGenerator.kt and QuizConfig.kt. Kept call-for-call identical to the Kotlin so the
 * same seed yields the same questions.
 */
import { KRandom } from '../lib/random.js';
import { Difficulty, DIFFICULTIES } from './models.js';

export const QuestionKind = { MATH: 'MATH', SEQUENCE: 'SEQUENCE' };
export const KIND_LABEL = { MATH: 'Quick Math', SEQUENCE: 'Pattern' };

function makeQuestion(kind, prompt, options, answer, explanation, level = null) {
  if (!options.includes(answer)) throw new Error('Answer must be one of the options');
  if (new Set(options).size !== options.length) throw new Error('Options must be distinct');
  return { kind, prompt, options, answer, explanation, level };
}

export function buildOptions(answer, candidates, random, count = 4) {
  const distractors = new Set();
  for (const c of random.shuffled(candidates)) {
    if (c !== answer && (c >= 0) === (answer >= 0)) distractors.add(c);
    if (distractors.size === count - 1) break;
  }
  // Fall back to nearby values if the plausible candidates were not enough.
  let offset = 1;
  while (distractors.size < count - 1) {
    const below = answer - offset;
    if (random.nextBoolean() || (answer >= 0 && below < 0)) distractors.add(answer + offset);
    else distractors.add(below);
    offset++;
  }
  return random.shuffled([...distractors, answer]);
}

export class MathGenerator {
  constructor(random = KRandom.fresh()) {
    this.random = random;
  }

  next(difficulty) {
    return { ...this.generate(difficulty), level: difficulty };
  }

  generate(difficulty) {
    const r = this.random;
    switch (difficulty.name) {
      case 'EASY':
        switch (r.nextIntUntil(3)) {
          case 0: return this.add([1, 20], [1, 20]);
          case 1: return this.subtract([5, 30]);
          default: return this.multiply([2, 5], [1, 10]);
        }
      case 'MEDIUM':
        switch (r.nextIntUntil(4)) {
          case 0: return this.add([15, 99], [10, 99]);
          case 1: return this.subtract([30, 150]);
          case 2: return this.multiply([3, 12], [3, 12]);
          default: return this.divide([2, 12], [2, 12]);
        }
      default:
        switch (r.nextIntUntil(5)) {
          case 0: return this.multiply([6, 19], [6, 25]);
          case 1: return this.divide([4, 19], [3, 15]);
          case 2: return this.twoStep();
          case 3: return this.square();
          default: return this.subtract([100, 500]);
        }
    }
  }

  rnd([a, b]) {
    return this.random.intIn(a, b);
  }

  add(a, b) {
    const x = this.rnd(a);
    const y = this.rnd(b);
    return this.question(`${x} + ${y}`, x + y, `${x} + ${y} = ${x + y}`);
  }

  subtract(range) {
    const x = this.rnd(range);
    const y = this.random.intIn(1, x);
    return this.question(`${x} − ${y}`, x - y, `${x} − ${y} = ${x - y}`);
  }

  multiply(a, b) {
    const x = this.rnd(a);
    const y = this.rnd(b);
    return this.question(`${x} × ${y}`, x * y, `${x} × ${y} = ${x * y}`, [x * (y + 1), x * (y - 1), (x + 1) * y]);
  }

  divide(divisor, quotient) {
    const d = this.rnd(divisor);
    const q = this.rnd(quotient);
    return this.question(`${d * q} ÷ ${d}`, q, `${d * q} ÷ ${d} = ${q}`);
  }

  twoStep() {
    const r = this.random;
    const x = r.intIn(3, 12);
    const y = r.intIn(3, 12);
    const z = r.intIn(2, Math.min(30, x * y - 1));
    if (r.nextBoolean()) {
      const ans = x * y + z;
      return this.question(`${x} × ${y} + ${z}`, ans, `${x} × ${y} = ${x * y}, then + ${z} = ${ans}`);
    }
    const ans = x * y - z;
    return this.question(`${x} × ${y} − ${z}`, ans, `${x} × ${y} = ${x * y}, then − ${z} = ${ans}`);
  }

  square() {
    const x = this.random.intIn(11, 25);
    return this.question(`${x}²`, x * x, `${x} × ${x} = ${x * x}`, [(x - 1) * (x - 1), (x + 1) * (x + 1)]);
  }

  question(prompt, answer, explanation, extra = []) {
    const near = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, answer + 5, answer - 5];
    const digitSwap = answer >= 10 ? parseInt(String(answer).split('').reverse().join(''), 10) : null;
    const candidates = [...extra, ...near, ...(digitSwap === null ? [] : [digitSwap])];
    return makeQuestion(QuestionKind.MATH, `${prompt} = ?`, buildOptions(answer, candidates, this.random), answer, explanation);
  }
}

/**
 * Quick Math Rush difficulty that follows the player: 4 right in a row step up a level,
 * 2 misses in a row step down, never more than one level from the chosen difficulty.
 */
const STEP_UP_AFTER = 4;
const STEP_DOWN_AFTER = 2;

export class AdaptiveMath {
  constructor(chosen, generator = new MathGenerator()) {
    this.chosen = chosen;
    this.generator = generator;
    this.current = chosen;
    this.streak = 0;
    this.misses = 0;
    this.lo = Math.max(chosen.ordinal - 1, 0);
    this.hi = Math.min(chosen.ordinal + 1, DIFFICULTIES.length - 1);
  }

  next() {
    return this.generator.next(this.current);
  }

  record(correct) {
    if (correct) {
      this.streak++;
      this.misses = 0;
      if (this.streak >= STEP_UP_AFTER) this.shift(1);
    } else {
      this.misses++;
      this.streak = 0;
      if (this.misses >= STEP_DOWN_AFTER) this.shift(-1);
    }
  }

  shift(by) {
    const target = Math.min(Math.max(this.current.ordinal + by, this.lo), this.hi);
    this.current = DIFFICULTIES[target];
    this.streak = 0;
    this.misses = 0;
  }
}

const VISIBLE_TERMS = 5;
const terms = (fn, count = VISIBLE_TERMS + 1) => Array.from({ length: count }, (_, i) => fn(i));

export class SequenceGenerator {
  constructor(random = KRandom.fresh()) {
    this.random = random;
  }

  next(difficulty) {
    const makers = {
      EASY: ['arithmetic', 'descending', 'doubling'],
      MEDIUM: ['arithmetic', 'geometric', 'growingSteps', 'squares', 'alternating', 'doublePlusOne'],
      HARD: ['fibonacciLike', 'cubes', 'triangular', 'primes', 'doublingSteps', 'squaresPlus', 'alternatingOps'],
    }[difficulty.name];
    const pattern = this[makers[this.random.nextIntUntil(makers.length)]]();
    const shown = pattern.terms.slice(0, VISIBLE_TERMS);
    const answer = pattern.terms[VISIBLE_TERMS];
    const last = shown[shown.length - 1];
    const step = last - shown[shown.length - 2];
    const candidates = [
      last + step, answer + step, answer - Math.trunc(step / 2), answer + 1, answer - 1,
      answer + 2, answer - 2, last * 2, answer + 10, answer - 10,
    ];
    return makeQuestion(
      QuestionKind.SEQUENCE, `${shown.join(', ')}, ?`, buildOptions(answer, candidates, this.random),
      answer, pattern.rule, difficulty,
    );
  }

  arithmetic() {
    const start = this.random.nextIntRange(1, 20);
    const step = this.random.nextIntRange(2, 10);
    return { terms: terms((i) => start + i * step), rule: `Add ${step} each time` };
  }

  descending() {
    const step = this.random.nextIntRange(2, 8);
    const start = step * (VISIBLE_TERMS + 1) + this.random.nextIntRange(5, 40);
    return { terms: terms((i) => start - i * step), rule: `Subtract ${step} each time` };
  }

  doubling() {
    const start = this.random.nextIntRange(1, 6);
    return { terms: terms((i) => start << i), rule: 'Double each time' };
  }

  geometric() {
    const ratio = this.random.nextIntRange(2, 4);
    let v = this.random.nextIntRange(1, 4);
    return { terms: terms((i) => (i === 0 ? v : (v *= ratio))), rule: `Multiply by ${ratio} each time` };
  }

  growingSteps() {
    let v = this.random.nextIntRange(1, 15);
    const firstStep = this.random.nextIntRange(1, 4);
    return {
      terms: terms((i) => (i === 0 ? v : (v += firstStep + i - 1))),
      rule: `The gap grows by 1: +${firstStep}, +${firstStep + 1}, +${firstStep + 2}…`,
    };
  }

  squares() {
    const offset = this.random.nextIntRange(1, 6);
    return { terms: terms((i) => (i + offset) * (i + offset)), rule: `Square numbers: ${offset}², ${offset + 1}², ${offset + 2}²…` };
  }

  alternating() {
    const a = this.random.nextIntRange(2, 9);
    const b = this.random.nextIntRange(1, 6);
    let v = this.random.nextIntRange(5, 25);
    return { terms: terms((i) => (i === 0 ? v : (v += i % 2 === 1 ? a : -b))), rule: `Alternate +${a} and −${b}` };
  }

  doublePlusOne() {
    const add = this.random.nextIntRange(1, 4);
    let v = this.random.nextIntRange(1, 5);
    return { terms: terms((i) => (i === 0 ? v : (v = v * 2 + add))), rule: `Double, then add ${add}` };
  }

  fibonacciLike() {
    const a = this.random.nextIntRange(1, 6);
    const b = this.random.nextIntRange(a, a + 6);
    const list = [a, b];
    while (list.length < VISIBLE_TERMS + 1) list.push(list[list.length - 1] + list[list.length - 2]);
    return { terms: list, rule: 'Each number is the sum of the two before it' };
  }

  cubes() {
    const offset = this.random.nextIntRange(1, 4);
    return { terms: terms((i) => (i + offset) ** 3), rule: `Cube numbers: ${offset}³, ${offset + 1}³, ${offset + 2}³…` };
  }

  triangular() {
    const offset = this.random.nextIntRange(1, 6);
    return { terms: terms((i) => ((i + offset) * (i + offset + 1)) / 2), rule: 'Triangular numbers: the gap grows by 1 each time' };
  }

  primes() {
    const all = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];
    const start = this.random.nextIntRange(0, all.length - VISIBLE_TERMS - 1);
    return { terms: all.slice(start, start + VISIBLE_TERMS + 1), rule: 'Consecutive prime numbers' };
  }

  doublingSteps() {
    let v = this.random.nextIntRange(1, 20);
    const firstStep = this.random.nextIntRange(1, 4);
    let step = firstStep;
    return {
      terms: terms((i) => {
        if (i === 0) return v;
        v += step;
        step *= 2;
        return v;
      }),
      rule: `The gap doubles: +${firstStep}, +${firstStep * 2}, +${firstStep * 4}…`,
    };
  }

  squaresPlus() {
    const c = this.random.nextIntRange(1, 10);
    const offset = this.random.nextIntRange(2, 6);
    return { terms: terms((i) => (i + offset) * (i + offset) + c), rule: `Square numbers plus ${c}` };
  }

  alternatingOps() {
    const add = this.random.nextIntRange(1, 6);
    let v = this.random.nextIntRange(1, 6);
    return { terms: terms((i) => (i === 0 ? v : (v = i % 2 === 1 ? v + add : v * 2))), rule: `Alternate +${add} and ×2` };
  }
}

export const DAILY_QUESTIONS = 12;
export const DAILY_QUESTION_TIME_MS = 20000;

/** Same questions for everyone on a given day; difficulty ramps up through the round. */
export function dailyQuestions(epochDay) {
  const random = KRandom.ofSeed(BigInt(epochDay) * 7919n + 104729n);
  const math = new MathGenerator(random);
  const seq = new SequenceGenerator(random);
  return Array.from({ length: DAILY_QUESTIONS }, (_, i) => {
    const difficulty = i < 4 ? Difficulty.EASY : i < 8 ? Difficulty.MEDIUM : Difficulty.HARD;
    return i % 2 === 0 ? math.next(difficulty) : seq.next(difficulty);
  });
}

/** LocalDate.now().toEpochDay() in the viewer's own time zone, as the app does on the phone. */
export function todayEpochDay(now = new Date()) {
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
}

/** QuizConfig factories: the shared quiz engine runs all three with different settings. */
export function quizConfig(type, difficulty, { epochDay } = {}) {
  if (type === 'MATH') {
    const adaptive = new AdaptiveMath(difficulty);
    return {
      type, difficulty, totalQuestions: null, roundTimeMs: 60000, questionTimeMs: null,
      question: () => adaptive.next(), recordAnswer: (c) => adaptive.record(c),
    };
  }
  if (type === 'SEQUENCE') {
    const gen = new SequenceGenerator();
    const perQuestion = { EASY: 25000, MEDIUM: 20000, HARD: 15000 }[difficulty.name];
    return {
      type, difficulty, totalQuestions: 10, roundTimeMs: null, questionTimeMs: perQuestion,
      question: () => gen.next(difficulty), recordAnswer: () => {},
    };
  }
  const questions = dailyQuestions(epochDay);
  return {
    type: 'DAILY', difficulty: Difficulty.MEDIUM, totalQuestions: DAILY_QUESTIONS, roundTimeMs: null,
    questionTimeMs: DAILY_QUESTION_TIME_MS, question: (i) => questions[i], recordAnswer: () => {},
  };
}

