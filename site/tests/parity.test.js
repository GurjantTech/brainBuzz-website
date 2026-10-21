/**
 * Checks the browser game engine against output from the Android app's own Kotlin code.
 *
 * tests/fixtures/kotlin-reference.jsonl was produced by compiling the app's domain/game sources
 * together with tests/fixtures/RefMain.kt (see README). Every line is regenerated here from the
 * same seeds and must match exactly: RNG, Daily Challenge sets, every generator and scoring.
 */
import { readFileSync } from 'fs';
import { KRandom, until } from '../assets/js/lib/random.js';
import { DIFFICULTIES } from '../assets/js/engine/models.js';
import { MathGenerator, SequenceGenerator, AdaptiveMath, dailyQuestions, todayEpochDay } from '../assets/js/engine/quiz.js';
import { generateOdd, ODD_PUZZLES } from '../assets/js/engine/odd.js';
import { generatePath, isSolved, connectedCells, misalignedPathCell, turnsToMatch, rotateMask } from '../assets/js/engine/logic-path.js';
import { wordRound, isCorrect } from '../assets/js/engine/words.js';
import { deal, matrixRules, levelFor, matrixPattern, nextLength, checkTap, Tap } from '../assets/js/engine/memory.js';
import * as Scoring from '../assets/js/engine/scoring.js';

const ref = new Map(
  readFileSync(new URL('./fixtures/kotlin-reference.jsonl', import.meta.url), 'utf8')
    .trim().split('\n').map((l) => JSON.parse(l)).map((o) => [o.k, o.v]),
);

let passed = 0;
const failures = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function check(key, actual) {
  if (!ref.has(key)) { failures.push(`${key}: missing from reference`); return; }
  if (same(actual, ref.get(key))) passed++;
  else failures.push(`${key}:\n  kotlin ${JSON.stringify(ref.get(key)).slice(0, 400)}\n  js     ${JSON.stringify(actual).slice(0, 400)}`);
}
function assert(name, cond) {
  if (cond) passed++;
  else failures.push(name);
}

const ql = (q) => ({ p: q.prompt, o: q.options, a: q.answer, e: q.explanation, l: q.level ? q.level.name : '' });
const item = (i) => (i.type === 'glyph' ? `G:${i.shape}:${i.rotation}:${i.scale}` : i.type === 'number' ? `N:${i.value}` : `L:${i.char}:${i.mirrored}`);

for (const seed of [0, 1, 12345, -7, 9876543210, 104729 + 20000 * 7919]) {
  const r = KRandom.ofSeed(seed);
  const rep = (n, fn) => Array.from({ length: n }, fn);
  check(`rng:${seed}`, {
    ints: rep(8, () => r.nextInt()),
    bounded: rep(8, () => r.nextIntUntil(7)),
    ranged: rep(8, () => r.nextIntRange(1, 20)),
    pow2: rep(8, () => r.nextIntUntil(16)),
    bools: rep(8, () => r.nextBoolean()),
    floats: rep(4, () => r.nextFloat()),
    shuffled: r.shuffled(until(10)),
    range: rep(5, () => r.intIn(3, 12)),
  });
}

for (const day of [0, 19000, 20000, 20381, 20382, 20383, 20400, 20747, 20748, 21000]) check(`daily:${day}`, dailyQuestions(day).map(ql));

for (let seed = 1; seed <= 6; seed++) {
  for (const d of DIFFICULTIES) {
    const r = KRandom.ofSeed(seed * 101);
    const m = new MathGenerator(r);
    check(`math:${seed}:${d.name}`, Array.from({ length: 6 }, () => ql(m.next(d))));
    const s = new SequenceGenerator(r);
    check(`seq:${seed}:${d.name}`, Array.from({ length: 6 }, () => ql(s.next(d))));

    const ro = KRandom.ofSeed(seed * 13);
    check(`odd:${seed}:${d.name}`, Array.from({ length: ODD_PUZZLES }, (_, i) => {
      const p = generateOdd(d, i, ro);
      return { items: p.items.map(item), odd: p.oddIndex, c: p.columns, e: p.explanation };
    }));

    const rl = KRandom.ofSeed(seed * 17);
    const boards = Array.from({ length: 3 }, (_, i) => generatePath(d, i, rl));
    check(`logic:${seed}:${d.name}`, boards.map((p) => ({
      size: p.size, sr: p.startRow, er: p.endRow, tiles: p.tiles.map((t) => `${t.kind.name}:${t.rotation}`), path: p.solutionPath, par: p.par,
    })));
    // Solving every board along its solution path must register as solved.
    for (const p of boards) {
      const tiles = p.tiles.map((t) => ({ ...t }));
      let guard = 0;
      for (let cell = misalignedPathCell(p, tiles); cell !== null && guard < 100; cell = misalignedPathCell(p, tiles), guard++) {
        const t = tiles[cell];
        const turns = turnsToMatch(t.kind, t.rotation, rotateMask(t.kind.baseMask, p.solution.get(cell)));
        tiles[cell] = { ...t, rotation: (t.rotation + turns) % 4 };
      }
      assert(`logic solvable ${seed}:${d.name}`, isSolved(p, tiles) && !isSolved(p, p.tiles) && connectedCells(p, tiles).has(p.endCell));
    }

    const rw = KRandom.ofSeed(seed * 19);
    const words = wordRound(d, rw);
    check(`word:${seed}:${d.name}`, words.map((w) => ({ w: w.answer, l: w.letters.join('') })));
    for (const w of words) assert(`word check ${w.answer}`, isCorrect(w.answer, w.answer.toLowerCase()) && !isCorrect(w.answer, w.letters.join('')));

    check(`deck:${seed}:${d.name}`, deal(d, KRandom.ofSeed(seed * 23)).map((c) => c.symbol));

    const rules = matrixRules(d);
    const rm = KRandom.ofSeed(seed * 29);
    let len = rules.startLength;
    check(`matrix:${seed}:${d.name}`, Array.from({ length: 10 }, (_, i) => {
      const level = levelFor(rules, len);
      const res = { g: level.gridSize, len: level.length, p: matrixPattern(level, rm) };
      len = nextLength(rules, len, i % 3 !== 2);
      return res;
    }));

    const am = new AdaptiveMath(d, new MathGenerator(KRandom.ofSeed(seed * 31)));
    check(`adaptive:${seed}:${d.name}`, '1111011110011111001'.split('').map((c) => {
      const q = am.next();
      am.record(c === '1');
      return { q: ql(q), after: am.current.name };
    }));
  }
}

const sc = [];
const f = Math.fround;
for (const d of DIFFICULTIES) for (const sp of [0, 0.3, 0.77, 1, 1.4]) for (const c of [0, 1, 2, 5, 11, 15]) sc.push(Scoring.pointsFor(d, f(sp), c));
for (const d of DIFFICULTIES) for (let len = 3; len <= 10; len++) for (const h of [true, false]) sc.push(Scoring.matrixRound(d, len, h));
for (const d of DIFFICULTIES) for (const taps of [2, 9, 40]) for (const ms of [0, 15500, 200000]) for (let h = 0; h <= 2; h++) sc.push(Scoring.logicPath(d, 5, 6, taps, ms, h));
for (const d of DIFFICULTIES) for (const len of [4, 6, 8]) for (let h = 0; h <= 3; h++) for (const w of [0, 2, 9]) for (const sp of [-0.5, 0.2, 0.9]) sc.push(Scoring.word(d, len, h, w, f(sp)));
for (const d of DIFFICULTIES) for (const moves of [6, 10, 30]) for (const ms of [5000, 42300, 300000]) for (let h = 0; h <= 2; h++) sc.push(Scoring.memoryScore(d, 8, moves, ms, h));
check('scoring', sc);

// Memory Matrix tap rules (MemoryMatrixTest.kt).
assert('matrix ordered wrong', checkTap([3, 1, 4], true, [], 1) === Tap.WRONG);
assert('matrix ordered right', checkTap([3, 1, 4], true, [3], 1) === Tap.CORRECT);
assert('matrix complete', checkTap([3, 1, 4], false, [4, 3], 1) === Tap.COMPLETE);
assert('matrix ignore repeat', checkTap([3, 1, 4], false, [4], 4) === Tap.IGNORED);

// Local calendar day, as LocalDate.toEpochDay() on the phone.
assert('epoch day 1970-01-01', todayEpochDay(new Date(1970, 0, 1, 12)) === 0);
assert('epoch day 2026-10-21', todayEpochDay(new Date(2026, 9, 21, 23, 59)) === 20747);
assert('epoch day just after midnight', todayEpochDay(new Date(2026, 9, 22, 0, 1)) === 20748);

const keysCovered = [...ref.keys()].filter((k) => !failures.some((f2) => f2.startsWith(`${k}:`)));
if (failures.length) {
  console.error(`✗ ${failures.length} failure(s), ${passed} passed\n`);
  for (const x of failures.slice(0, 20)) console.error(`- ${x}`);
  process.exit(1);
}
console.log(`✓ ${passed} checks passed (${keysCovered.length} Kotlin reference cases matched exactly)`);
