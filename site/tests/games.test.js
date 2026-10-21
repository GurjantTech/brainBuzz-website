/**
 * Rules of the three website-only games: 2048 Merge Challenge, Word Detective and Sudoku Daily.
 * They have no Android counterpart, so instead of Kotlin parity this checks the rules directly.
 *   node tests/games.test.js
 */
import { KRandom } from '../assets/js/lib/random.js';
import * as M from '../assets/js/engine/merge.js';
import * as D from '../assets/js/engine/detective.js';
import { ANSWERS, GUESSES } from '../assets/js/engine/detective-words.js';
import * as S from '../assets/js/engine/sudoku.js';

let passed = 0;
const failures = [];
function check(name, cond, detail = '') {
  if (cond) passed++;
  else failures.push(`${name} ${detail}`);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const seq = (...values) => { let i = 0; return () => values[i++ % values.length]; };

// ---------- 2048 ----------
const board = (rows) => ({
  tiles: rows.flatMap((row, r) => row.map((v, c) => ({ v, r, c }))).filter((t) => t.v)
    .map((t, i) => ({ id: i + 1, value: t.v, r: t.r, c: t.c })),
  score: 0,
  nextId: 100,
});
const rows = (game) => { const g = M.toGrid(game.tiles); return [0, 1, 2, 3].map((r) => g.slice(r * 4, r * 4 + 4)); };
const after = (start, dir) => { const g = board(start); const res = M.slide(g, dir); return { ...res, rows: rows({ tiles: res.tiles }) }; };

let r = after([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'left');
check('2048: four 2s merge into two 4s', same(r.rows[0], [4, 4, 0, 0]) && r.gained === 8, JSON.stringify(r.rows[0]));
r = after([[2, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'left');
check('2048: a merged tile does not merge again in the same move', same(r.rows[0], [4, 4, 0, 0]), JSON.stringify(r.rows[0]));
r = after([[4, 4, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'right');
check('2048: merges happen from the edge tiles slide towards', same(r.rows[0], [0, 0, 4, 8]), JSON.stringify(r.rows[0]));
r = after([[2, 0, 0, 0], [2, 0, 0, 0], [4, 0, 0, 0], [4, 0, 0, 0]], 'up');
check('2048: columns merge upwards', same(r.rows.map((x) => x[0]), [4, 8, 0, 0]) && r.gained === 12);
r = after([[2, 0, 0, 0], [2, 0, 0, 0], [4, 0, 0, 0], [4, 0, 0, 0]], 'down');
check('2048: columns merge downwards', same(r.rows.map((x) => x[0]), [0, 0, 4, 8]));
r = after([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]], 'left');
check('2048: a blocked move does not count as a move', r.moved === false && r.gained === 0);
check('2048: full board with no pairs is game over', !M.canMove(board([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]).tiles));
check('2048: full board with a pair can still move', M.canMove(board([[2, 2, 4, 8], [4, 8, 16, 32], [8, 16, 32, 64], [16, 32, 64, 128]]).tiles));
{
  const g = board([[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  const before = g.tiles.length;
  const res = M.play(g, 'left', seq(0.5, 0.5));
  check('2048: invalid move spawns no tile', !res.moved && res.spawned === null && g.tiles.length === before);
  const res2 = M.play(g, 'down', seq(0, 0.95));
  check('2048: valid move spawns exactly one tile', res2.moved && res2.spawned && g.tiles.length === before + 1);
  check('2048: spawned tile is a 4 when the roll is ≥ 0.9', res2.spawned.value === 4);
}
{
  const g = M.newGame(seq(0.1, 0.2, 0.7, 0.95));
  check('2048: new game starts with two tiles of 2 or 4', g.tiles.length === 2 && g.tiles.every((t) => t.value === 2 || t.value === 4));
  check('2048: the two start tiles are on different cells', g.tiles[0].r * 4 + g.tiles[0].c !== g.tiles[1].r * 4 + g.tiles[1].c);
}
{
  const g = board([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  M.play(g, 'left', seq(0.3));
  check('2048: reaching 2048 is detected', M.maxTile(g.tiles) === M.WIN_VALUE && g.score === 2048);
}
{
  // Random play never breaks the invariants: unique cells, powers of two, score = sum of merges.
  const rnd = KRandom.ofSeed(2048);
  const random = () => rnd.nextFloat();
  let ok = true;
  for (let game = 0; game < 30 && ok; game++) {
    const g = M.newGame(random);
    let score = 0;
    for (let move = 0; move < 2000 && M.canMove(g.tiles); move++) {
      const res = M.play(g, M.DIRECTIONS[rnd.nextIntUntil(4)], random);
      score += res.gained;
      const cells = new Set(g.tiles.map((t) => t.r * 4 + t.c));
      if (cells.size !== g.tiles.length || g.tiles.some((t) => t.value & (t.value - 1)) || g.score !== score) ok = false;
    }
  }
  check('2048: 30 random games keep the board consistent', ok);
}
check('2048: saved grid round-trips', same(M.toGrid(M.fromGrid([2, 0, 0, 4, 0, 8, 0, 0, 0, 0, 16, 0, 0, 0, 0, 2048], 100).tiles), [2, 0, 0, 4, 0, 8, 0, 0, 0, 0, 16, 0, 0, 0, 0, 2048]));
check('2048: corrupt saves are rejected', M.fromGrid([3, 0], 0) === null && M.fromGrid('x', 0) === null
  && M.fromGrid(new Array(16).fill(0), 0) === null && M.fromGrid([5, ...new Array(15).fill(0)], 0) === null && M.fromGrid([2, ...new Array(15).fill(0)], -1) === null);

// ---------- Word Detective ----------
const sc = (a, g) => D.score(a, g).map((m) => m[0]).join('');
check('Detective: exact word is all correct', sc('CRANE', 'CRANE') === 'ccccc');
check('Detective: right letters, wrong places', sc('CRANE', 'NACRE') === 'ppppc', sc('CRANE', 'NACRE'));
check('Detective: duplicate in guess, one in answer, exact match wins', sc('ROBOT', 'FLOOR') === 'aapcp', sc('ROBOT', 'FLOOR'));
check('Detective: an exact match uses up the only copy', sc('APPLE', 'EERIE') === 'aaaac', sc('APPLE', 'EERIE'));
check('Detective: one copy in the answer marks only the first guessed copy', sc('STEAK', 'EERIE') === 'paaaa', sc('STEAK', 'EERIE'));
check('Detective: exact match plus extra copies elsewhere', sc('BEACH', 'EERIE') === 'acaaa', sc('BEACH', 'EERIE'));
check('Detective: both duplicates count when the answer has two', sc('PAPER', 'APPLE') === 'ppcap', sc('PAPER', 'APPLE'));
check('Detective: extra copies beyond the answer are absent', sc('SHEEP', 'EERIE') === 'ppaaa', sc('SHEEP', 'EERIE'));
check('Detective: keyboard keeps the best state per letter', same(D.letterStates('ROBOT', ['FLOOR', 'ROBIN']), { F: 'absent', L: 'absent', O: 'correct', R: 'correct', B: 'correct', I: 'absent', N: 'absent' }));
check('Detective: answers are unique five-letter words', ANSWERS.length > 600 && new Set(ANSWERS).size === ANSWERS.length && ANSWERS.every((w) => /^[a-z]{5}$/.test(w)));
check('Detective: guess list is five-letter words', GUESSES.length > 3000 && GUESSES.every((w) => /^[a-z]{5}$/.test(w)));
check('Detective: every answer is an accepted guess', ANSWERS.every((w) => D.isValidGuess(w.toUpperCase())));
check('Detective: nonsense is rejected', !D.isValidGuess('QXZVJ') && !D.isValidGuess('ABC') && !D.isValidGuess(''));
check('Detective: puzzle #1 is 1 Oct 2026', D.puzzleNumber(D.START_DAY) === 1);
{
  const day = Date.UTC(2026, 9, 21) / 86400000;
  check('Detective: the daily word is fixed for a date', D.dailyAnswer(day) === D.dailyAnswer(day) && D.dailyAnswer(day) === ANSWERS[20].toUpperCase());
  check('Detective: consecutive days have different words', D.dailyAnswer(day) !== D.dailyAnswer(day + 1));
  check('Detective: the list cycles without errors before the start date and far ahead', /^[A-Z]{5}$/.test(D.dailyAnswer(D.START_DAY - 5)) && /^[A-Z]{5}$/.test(D.dailyAnswer(D.START_DAY + 5000)));
  // Fixed regression values: if these change, everyone's daily word changed.
  check('Detective: known daily words', D.dailyAnswer(D.START_DAY) === 'SALAD' && D.dailyAnswer(D.START_DAY + 1) === 'HEART', D.dailyAnswer(D.START_DAY));
  let s = D.emptyStats();
  s = D.recordDaily(s, day, true, 3);
  s = D.recordDaily(s, day, true, 1); // same day again
  check('Detective: replaying a day does not add to stats', s.played === 1 && s.won === 1 && s.streak === 1 && same(s.dist, [0, 0, 1, 0, 0, 0]));
  s = D.recordDaily(s, day + 1, true, 4);
  check('Detective: next-day win extends the streak', s.streak === 2 && s.maxStreak === 2);
  s = D.recordDaily(s, day - 3, true, 2);
  check('Detective: an older day is ignored', s.played === 2);
  s = D.recordDaily(s, day + 3, true, 2);
  check('Detective: a gap restarts the streak', s.streak === 1 && s.maxStreak === 2);
  s = D.recordDaily(s, day + 4, false, 6);
  check('Detective: a loss resets the streak', s.streak === 0 && s.played === 4 && s.won === 3);
  check('Detective: a streak lapses after a missed day', D.currentStreak({ ...s, streak: 5, lastWonDay: day }, day + 2) === 0 && D.currentStreak({ ...s, streak: 5, lastWonDay: day }, day + 1) === 5);
  check('Detective: corrupt stats are cleaned', same(D.normalizeStats('junk'), D.emptyStats()) && D.normalizeStats({ played: 2, won: 9, dist: [1] }).won === 2);
  const text = D.shareText(day, 'ROBOT', ['FLOOR', 'ROBOT'], true, 'https://brainbuzzgame.com/play/word-detective/');
  check('Detective: share text has the grid but not the answer or guesses', text.includes('#21 2/6') && text.includes('⬜⬜🟨🟩🟨') && !/ROBOT|FLOOR/i.test(text), text);
  check('Detective: share text marks a loss with X', D.shareText(day, 'ROBOT', ['FLOOR'], false, '').includes('X/6'));
}

// ---------- Sudoku ----------
for (const [level, list] of Object.entries(S.FALLBACK)) {
  list.forEach(([p, s], i) => {
    check(`Sudoku: fallback ${level} #${i + 1} is valid and unique`, S.verifyPuzzle(S.fromText(p), S.fromText(s)));
  });
}
for (const level of ['EASY', 'MEDIUM', 'HARD']) {
  const want = S.SUDOKU_LEVELS[level];
  let ok = true;
  let detail = '';
  for (let k = 0; k < 40; k++) {
    const g = S.generate(level, S.dailySeed(21000 + k, level));
    const bad = !S.isValidSolution(g.solution) ? 'solution invalid'
      : !S.verifyPuzzle(g.puzzle, g.solution) ? 'not unique or disagrees'
        : g.fallback ? 'used fallback'
          : want.singles && !S.solvableBySingles(g.puzzle) ? 'needs guessing'
            : g.clues > want.clues + 8 ? `too many clues (${g.clues})` : '';
    if (bad) { ok = false; detail = `seed ${k}: ${bad}`; break; }
  }
  check(`Sudoku: 40 ${level} puzzles are valid, unique and match the level`, ok, detail);
}
{
  const day = 20750;
  const a = S.generate('MEDIUM', S.dailySeed(day, 'MEDIUM'));
  const b = S.generate('MEDIUM', S.dailySeed(day, 'MEDIUM'));
  const c = S.generate('MEDIUM', S.dailySeed(day + 1, 'MEDIUM'));
  check('Sudoku: the daily puzzle is the same for the same date', same(a.puzzle, b.puzzle));
  check('Sudoku: the next day has a different puzzle', !same(a.puzzle, c.puzzle));
  check('Sudoku: levels differ on the same day', !same(a.puzzle, S.generate('EASY', S.dailySeed(day, 'EASY')).puzzle));
  const hard = Array.from({ length: 12 }, (_, k) => S.generate('HARD', S.dailySeed(day + k, 'HARD')));
  check('Sudoku: most Hard puzzles need more than singles', hard.filter((g) => !S.solvableBySingles(g.puzzle)).length >= 9);
}
check('Sudoku: solver finds the solution', same(S.solve(S.fromText(S.FALLBACK.EASY[0][0])), S.fromText(S.FALLBACK.EASY[0][1])));
check('Sudoku: clashing clues have no solution', S.countSolutions([5, 5, ...new Array(79).fill(0)]) === 0);
check('Sudoku: an empty grid has many solutions', S.countSolutions(new Array(81).fill(0), 2) === 2);
check('Sudoku: verify rejects a wrong solution', !S.verifyPuzzle(S.fromText(S.FALLBACK.EASY[0][0]), S.fromText(S.FALLBACK.EASY[1][1])));
check('Sudoku: verify rejects a non-unique puzzle', !S.verifyPuzzle(new Array(81).fill(0), S.fromText(S.FALLBACK.EASY[0][1])));
check('Sudoku: fromText rejects bad saves', S.fromText('12') === null && S.fromText(null) === null && S.fromText('x'.repeat(81)) === null);
check('Sudoku: every cell has 20 peers', S.PEERS.every((p) => p.length === 20));

if (failures.length) {
  console.error(`✗ ${failures.length} failed, ${passed} passed`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`✓ ${passed} game rule checks passed (2048, Word Detective, Sudoku)`);
