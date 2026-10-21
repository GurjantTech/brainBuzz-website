/**
 * End-to-end test: plays every game at every difficulty to its results screen in real Chrome,
 * using solvers that read only what's on screen. Also checks hints, pause/resume, restart,
 * deliberate mistakes, keyboard play, saved bests, the once-a-day Daily Challenge, navigation,
 * theme toggle, mobile menu and Play Store links.
 *
 *   npm run build && npm run serve      (in another terminal)
 *   npm run test:e2e                    (CHROME=/path/to/chrome BASE=http://localhost:8080)
 *
 * Game clocks run 4× faster (performance.now and requestAnimationFrame are scaled) so the
 * whole suite takes a few minutes; game logic sees a consistent clock either way.
 */
import { createRequire } from 'module';
import { EASY, MEDIUM, HARD } from '../assets/js/engine/word-bank.js';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE || 'http://localhost:8080';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const SPEED = 4;
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.app.dailybrainchallenge';
const WORDS = [...EASY, ...MEDIUM, ...HARD].map(([w]) => w);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
const failures = [];
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); } else { failures.push(`${name} ${detail}`); console.log(`  ✗ ${name} ${detail}`); }
}

async function newPage(browser, { width = 390, mobile = true, speed = SPEED } = {}) {
  const page = await browser.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) page.errors.push(m.text()); });
  await page.setViewport({ width, height: mobile ? 844 : 900, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((k) => {
    const now = performance.now.bind(performance);
    performance.now = () => now() * k;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((ts) => cb(ts * k));
  }, speed);
  return page;
}

async function startGame(page, slug, diff) {
  await page.goto(`${BASE}/play/${slug}/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.setup-actions .btn');
  if (diff) await page.evaluate((d) => document.querySelector(`input[value="${d}"]`).click(), diff);
  const label = await page.$eval('.setup-actions .btn', (b) => b.textContent.trim());
  await page.click('.setup-actions .btn');
  await page.waitForFunction(() => !document.querySelector('.countdown-view') && document.querySelector('.hud'), { timeout: 15000 });
  return label;
}

const inResults = (page) => page.evaluate(() => !!document.querySelector('.results .big-score'));

async function results(page, timeout = 120000) {
  await page.waitForSelector('.results .big-score', { timeout });
  return page.evaluate(() => ({
    title: document.querySelector('.results h2').textContent,
    score: Number(document.querySelector('.results .big-score').firstChild.textContent.replace(/,/g, '')),
    stats: Array.from(document.querySelectorAll('.stat')).map((s) => `${s.querySelector('span').textContent}=${s.querySelector('strong').textContent}`),
    best: document.querySelector('.results .pill').textContent,
    cta: document.querySelector('.app-cta a').href,
  }));
}

async function clickHint(page) {
  await page.click('.hud-btn.hint');
}

// ---------- Solvers (run in the page) ----------

/** Answers the current quiz question; returns false if it's not ready. */
async function answerQuiz(page, wrong = false) {
  return page.evaluate((wrongAnswer) => {
    const text = document.querySelector('.quiz-text');
    const opts = Array.from(document.querySelectorAll('.quiz-opt'));
    if (!text || !opts.length || opts.some((o) => /correct|wrong/.test(o.className))) return false;
    const values = opts.map((o) => Number(o.lastChild.nodeType === 3 ? o.lastChild.textContent : o.childNodes[1].textContent));
    const prompt = text.textContent;
    let answer = null;
    if (prompt.includes('= ?')) {
      const expr = prompt.replace('= ?', '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/(\d+)²/g, '($1*$1)');
      answer = Function(`return (${expr})`)();
    } else {
      const seq = prompt.replace(', ?', '').split(',').map((s) => Number(s.trim()));
      const diffs = (a) => a.slice(1).map((v, i) => v - a[i]);
      const allSame = (a) => a.every((v) => v === a[0]);
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67];
      const rules = [
        (a) => allSame(diffs(a)), (a) => allSame(diffs(diffs(a))), (a) => allSame(diffs(diffs(diffs(a)))),
        (a) => a.slice(1).every((v, i) => v === a[i] * (a[1] / a[0])),
        (a) => a.slice(2).every((v, i) => v === a[i] + a[i + 1]),
        (a) => { const d = diffs(a); return d.slice(2).every((v, i) => v === d[i]); },
        (a) => { const d = diffs(a); return d.slice(1).every((v, i) => v === d[i] * 2); },
        (a) => a.slice(2).every((v, i) => v - 2 * a[i + 1] === a[1] - 2 * a[0]),
        (a) => a.slice(1).every((v, i) => (i % 2 === 0 ? v - a[i] === a[1] - a[0] : v === a[i] * 2)),
        (a) => { const s = primes.indexOf(a[0]); return s >= 0 && a.every((v, i) => primes[s + i] === v); },
      ];
      const fits = values.filter((v) => rules.some((r) => r([...seq, v])));
      answer = fits.length === 1 ? fits[0] : fits[0];
    }
    let idx = values.indexOf(answer);
    if (wrongAnswer || idx < 0) idx = values.findIndex((v) => v !== answer);
    opts[idx].click();
    return true;
  }, wrong);
}

async function playQuiz(page, { wrongAt = [], hintAt = -1, keyboard = false } = {}) {
  let n = 0;
  while (!(await inResults(page))) {
    const ready = await page.evaluate(() => {
      const o = document.querySelectorAll('.quiz-opt');
      return o.length && !Array.from(o).some((x) => /correct|wrong/.test(x.className)) && !document.querySelector('.overlay');
    });
    if (!ready) { await sleep(15); continue; }
    if (n === hintAt) {
      await clickHint(page);
      await sleep(30);
      const out = await page.$$eval('.quiz-opt.out', (x) => x.length);
      check('quiz hint removes two wrong answers', out === 2, `(${out})`);
    }
    if (keyboard && n === 0) {
      // Press the number key of the first non-eliminated option: proves keyboard play works.
      await page.keyboard.press('1');
      await sleep(30);
      const answered = await page.evaluate(() => Array.from(document.querySelectorAll('.quiz-opt')).some((x) => /correct|wrong/.test(x.className)));
      check('quiz answers with number keys', answered);
    } else {
      await answerQuiz(page, wrongAt.includes(n));
    }
    n++;
    await sleep(15);
  }
  return n;
}

async function installMatrixRecorder(page) {
  await page.evaluate(() => {
    window.__lit = [];
    const mo = new MutationObserver(() => {
      const status = document.querySelector('.status-line');
      if (status && status.textContent.startsWith('Watch') && window.__state !== 'watch') { window.__lit = []; window.__state = 'watch'; }
      if (status && !status.textContent.startsWith('Watch')) window.__state = 'other';
      const lit = document.querySelector('.mx-cell.lit');
      if (lit) {
        const c = Number(lit.dataset.cell);
        if (window.__lit[window.__lit.length - 1] !== c) window.__lit.push(c);
      }
    });
    mo.observe(document.querySelector('.stage'), { subtree: true, attributes: true, childList: true, characterData: true });
  });
}

async function playMatrix(page, { missRounds = [], hintRound = -1, pauseRound = -1 } = {}) {
  await installMatrixRecorder(page);
  let round = 0;
  let usedHint = false;
  while (!(await inResults(page))) {
    const turn = await page.evaluate(() => {
      const s = document.querySelector('.status-line');
      return s && s.textContent.startsWith('Your turn') ? window.__lit.slice() : null;
    });
    if (!turn) { await sleep(15); continue; }
    round++;
    if (round === pauseRound) {
      await page.keyboard.press('Escape');
      await page.waitForSelector('.overlay');
      check('Escape pauses the game', true);
      await sleep(300);
      await page.click('.overlay .btn-primary');
      await page.waitForFunction(() => !document.querySelector('.overlay'));
      check('Resume closes the pause overlay', true);
    }
    if (round === hintRound && !usedHint) {
      usedHint = true;
      await page.click('.mx-cell[data-cell="' + turn[0] + '"]');
      await clickHint(page);
      await page.waitForFunction(() => document.querySelector('.status-line').textContent.startsWith('Watch'));
      check('Matrix hint replays the pattern', true);
      const found = await page.$$eval('.mx-cell.found', (x) => x.length);
      check('Matrix hint keeps found tiles', found === 1, `(${found})`);
      round--;
      continue;
    }
    if (missRounds.includes(round)) {
      const size = await page.$$eval('.mx-cell', (x) => x.length);
      const wrongCell = Array.from({ length: size }, (_, i) => i).find((i) => !turn.includes(i));
      await page.click(`.mx-cell[data-cell="${wrongCell}"]`);
    } else {
      for (const c of turn) {
        const found = await page.$eval(`.mx-cell[data-cell="${c}"]`, (el) => el.classList.contains('found'));
        if (!found) await page.click(`.mx-cell[data-cell="${c}"]`);
      }
    }
    await page.waitForFunction(() => !document.querySelector('.status-line') || !document.querySelector('.status-line').textContent.startsWith('Your turn'));
  }
  return round;
}

async function playMemory(page, { mismatch = false, hint = false } = {}) {
  await page.waitForFunction(() => !document.querySelector('.status-line').textContent.includes('Memorize'));
  const symbols = await page.$$eval('.mm-card', (cards) => cards.map((c) => c.querySelector('.mm-front use').getAttribute('href')));
  if (hint) {
    await clickHint(page);
    await sleep(20);
    const up = await page.$$eval('.mm-card.up', (x) => x.length);
    check('Memory hint shows every card', up === symbols.length, `(${up}/${symbols.length})`);
    await page.waitForFunction(() => !document.querySelectorAll('.mm-card.up').length, { timeout: 5000 });
  }
  const groups = {};
  symbols.forEach((s, i) => { (groups[s] = groups[s] || []).push(i); });
  const pairs = Object.values(groups);
  const clickCard = async (i) => {
    await page.waitForFunction((j) => {
      const el = document.querySelectorAll('.mm-card')[j];
      return el.getAttribute('aria-disabled') === 'false' && document.querySelectorAll('.mm-card.up:not(.matched)').length < 2;
    }, {}, i);
    await page.click(`.mm-card[data-cell="${i}"]`);
  };
  if (mismatch) {
    await clickCard(pairs[0][0]);
    await clickCard(pairs[1][0]);
    await page.waitForFunction(() => document.querySelectorAll('.mm-card.up').length === 0, { timeout: 5000 });
    check('Memory mismatch flips both cards back', true);
  }
  for (const [a, b] of pairs) {
    await clickCard(a);
    await clickCard(b);
  }
  return { pairs: pairs.length, moves: pairs.length + (mismatch ? 1 : 0) };
}

/** Finds rotations that link start to exit using only the tiles' screen-reader labels, then taps them. */
async function solveLogicBoard(page) {
  const plan = await page.evaluate(() => {
    const wrap = document.querySelector('.lp-wrap');
    const m = /board (\d+) by \d+\. Start on row (\d+).*exit on row (\d+)/.exec(wrap.getAttribute('aria-label'));
    const n = Number(m[1]);
    const start = (Number(m[2]) - 1) * n;
    const end = (Number(m[3]) - 1) * n + n - 1;
    const bits = { up: 1, right: 2, down: 4, left: 8 };
    const tiles = Array.from(document.querySelectorAll('.lp-tile')).map((b) => {
      const label = b.getAttribute('aria-label');
      const open = /open (.*?)(,|$)/.exec(label)[1].split(' and ');
      return { mask: open.reduce((acc, d) => acc | bits[d], 0), locked: label.includes('locked') };
    });
    const rot = (mask, t) => { let x = mask; for (let i = 0; i < t; i++) x = ((x << 1) | (x >> 3)) & 15; return x; };
    const opp = { 1: 4, 2: 8, 4: 1, 8: 2 };
    const step = (cell, d) => {
      const r = Math.floor(cell / n); const c = cell % n;
      if (d === 1) return r > 0 ? cell - n : null;
      if (d === 4) return r < n - 1 ? cell + n : null;
      if (d === 2) return c < n - 1 ? cell + 1 : null;
      return c > 0 ? cell - 1 : null;
    };
    const visited = new Set();
    const turns = {};
    const dfs = (cell, inDir) => {
      visited.add(cell);
      const options = tiles[cell].locked ? [0] : [0, 1, 2, 3];
      for (const t of options) {
        const mask = rot(tiles[cell].mask, t);
        if (!(mask & inDir)) continue;
        for (const out of [1, 2, 4, 8]) {
          if (out === inDir || !(mask & out)) continue;
          if (cell === end && out === 2) { turns[cell] = t; return true; }
          const next = step(cell, out);
          if (next === null || visited.has(next)) continue;
          turns[cell] = t;
          if (dfs(next, opp[out])) return true;
        }
      }
      delete turns[cell];
      visited.delete(cell);
      return false;
    };
    return dfs(start, 8) ? turns : null;
  });
  if (!plan) return false;
  for (const [cell, t] of Object.entries(plan)) {
    for (let i = 0; i < t; i++) {
      if (await page.evaluate(() => document.querySelector('.status-line').textContent.startsWith('Solved'))) return true;
      await page.click(`.lp-tile[data-cell="${cell}"]`);
    }
  }
  return true;
}

async function playLogic(page, { hint = false } = {}) {
  for (let board = 1; board <= 3; board++) {
    await page.waitForFunction((b) => {
      const p = Array.from(document.querySelectorAll('.hud .pill')).find((x) => x.textContent.startsWith('Board'));
      return (p && p.textContent.startsWith(`Board ${b}/`) && !document.querySelector('.status-line').textContent.startsWith('Solved')) || document.querySelector('.results');
    }, { timeout: 15000 }, board);
    if (await inResults(page)) break;
    if (hint && board === 1) {
      await clickHint(page);
      await sleep(30);
      const locked = await page.$$eval('.lp-tile .lock', (x) => x.length);
      check('Logic hint locks a tile into place', locked === 1, `(${locked})`);
    }
    const ok = await solveLogicBoard(page);
    check(`Logic board ${board} solvable from what's on screen`, ok);
    await page.waitForFunction(() => document.querySelector('.results') || document.querySelector('.status-line').textContent.startsWith('Solved'), { timeout: 5000 });
  }
}

async function answerOdd(page, wrong) {
  return page.evaluate((w) => {
    const cells = Array.from(document.querySelectorAll('.odd-cell'));
    if (!cells.length || cells.some((c) => /right|wrong/.test(c.className))) return false;
    const keys = cells.map((c) => c.innerHTML);
    let odd = keys.findIndex((k) => keys.filter((x) => x === k).length === 1 && new Set(keys).size === 2);
    if (odd < 0) {
      const nums = cells.map((c) => Number(c.textContent));
      const rules = [(x) => x % 2 === 0, (x) => x % 2 !== 0, ...[3, 4, 5, 6, 7, 9].map((k) => (x) => x % k === 0)];
      for (const r of rules) {
        const fails = nums.map((x, i) => (r(x) ? -1 : i)).filter((i) => i >= 0);
        if (fails.length === 1) { odd = fails[0]; break; }
      }
    }
    const pick = w ? (odd + 1) % cells.length : odd;
    cells[pick].click();
    return true;
  }, wrong);
}

async function playOdd(page, { wrongAt = [], hintAt = -1, timeoutAt = -1 } = {}) {
  let n = 0;
  while (!(await inResults(page))) {
    const ready = await page.evaluate(() => {
      const c = document.querySelectorAll('.odd-cell');
      return c.length && !Array.from(c).some((x) => /right|wrong|dim/.test(x.className) && !x.getAttribute('aria-label').includes('ruled out'));
    });
    if (!ready) { await sleep(15); continue; }
    if (n === hintAt) {
      const before = await page.$$eval('.odd-cell', (x) => x.length);
      await clickHint(page);
      await sleep(30);
      const dim = await page.$$eval('.odd-cell.dim', (x) => x.length);
      check('Odd One Out hint rules out about half the wrong items', dim === Math.floor((before - 1) / 2), `(${dim} of ${before})`);
    }
    if (n === timeoutAt) {
      await page.waitForFunction(() => document.querySelector('.feedback').textContent.startsWith("Time's up"), { timeout: 20000 });
      check('Odd One Out per-grid timer runs out', true);
    } else {
      await answerOdd(page, wrongAt.includes(n));
    }
    n++;
    await page.waitForFunction(() => document.querySelector('.results') || Array.from(document.querySelectorAll('.odd-cell')).some((x) => /right/.test(x.className)), { timeout: 20000 });
  }
  return n;
}

async function playWord(page, { skipAt = -1, hintAt = -1, wrongAt = -1, shuffleAt = -1 } = {}) {
  let n = 0;
  while (!(await inResults(page))) {
    const letters = await page.evaluate(() => {
      const ws = document.querySelector('.ws');
      if (!ws || ws.classList.contains('solved') || document.querySelector('.feedback').textContent.startsWith('The word')) return null;
      const progress = Array.from(document.querySelectorAll('.hud .pill')).find((x) => x.textContent.startsWith('Word'));
      return { tiles: Array.from(document.querySelectorAll('.ws-tile')).map((t) => t.textContent).join(''), word: progress.textContent };
    });
    if (!letters) { await sleep(15); continue; }
    const sorted = letters.tiles.split('').sort().join('');
    const answer = WORDS.find((w) => w.split('').sort().join('') === sorted);
    if (n === shuffleAt) {
      await page.click('.ws-tools button:nth-child(1)');
      const after = await page.$$eval('.ws-tile', (x) => x.map((t) => t.textContent).join(''));
      check('Shuffle keeps the same letters', after.split('').sort().join('') === sorted);
    }
    if (n === skipAt) {
      await page.click('.ws-tools button:nth-child(3)');
      await page.waitForFunction(() => document.querySelector('.feedback').textContent.startsWith('The word'));
      check('Skip reveals the word', true);
    } else {
      if (n === hintAt) {
        const hidden = await page.$eval('.ws-clue', (c) => c.classList.contains('hidden-clue'));
        await clickHint(page);
        await sleep(30);
        if (hidden) {
          check('Hard: first hint reveals the clue', !(await page.$eval('.ws-clue', (c) => c.classList.contains('hidden-clue'))));
          await clickHint(page);
          await sleep(30);
        }
        const revealed = await page.$$eval('.ws-slot.revealed', (x) => x.map((s) => s.textContent));
        check('Word hint places the first letter', revealed.length === 1 && revealed[0] === answer[0], `(${revealed})`);
      }
      if (n === wrongAt) {
        const wrongGuess = letters.tiles.split('').reverse().join('') === answer ? letters.tiles : letters.tiles.split('').reverse().join('');
        await page.keyboard.type(wrongGuess.toLowerCase());
        await sleep(40);
        const isWrong = await page.$eval('.ws', (w) => w.classList.contains('wrong'));
        check('Wrong word is rejected', isWrong);
        await page.click('.ws-tools button:nth-child(2)');
      }
      const placed = await page.$$eval('.ws-slot', (x) => x.map((s) => s.textContent).join(''));
      await page.keyboard.type(answer.slice(placed.length).toLowerCase());
      await page.waitForFunction(() => document.querySelector('.ws').classList.contains('solved') || document.querySelector('.results'), { timeout: 5000 });
    }
    n++;
    await page.waitForFunction((w) => document.querySelector('.results')
      || !Array.from(document.querySelectorAll('.hud .pill')).some((x) => x.textContent === w), { timeout: 10000 }, letters.word);
  }
  return n;
}

// ---------- Suites ----------

async function suiteGames(browser) {
  const plans = {
    MATH: { slug: 'quick-math', play: (p, d) => playQuiz(p, { wrongAt: d === 'MEDIUM' ? [2, 3] : [], hintAt: d === 'HARD' ? 1 : -1, keyboard: d === 'EASY' }) },
    SEQUENCE: { slug: 'number-sequence', play: (p, d) => playQuiz(p, { wrongAt: d === 'HARD' ? [4] : [], hintAt: d === 'MEDIUM' ? 2 : -1 }) },
    MATRIX: { slug: 'memory-matrix', play: (p, d) => playMatrix(p, d === 'EASY' ? { hintRound: 2, pauseRound: 3 } : d === 'MEDIUM' ? { missRounds: [2, 4, 5] } : { missRounds: [5, 6, 7] }) },
    MEMORY: { slug: 'memory-match', play: (p, d) => playMemory(p, { mismatch: d === 'MEDIUM', hint: d === 'HARD' }) },
    LOGIC_PATH: { slug: 'logic-path', play: (p, d) => playLogic(p, { hint: d === 'MEDIUM' }) },
    ODD_ONE_OUT: { slug: 'odd-one-out', play: (p, d) => playOdd(p, { wrongAt: d === 'EASY' ? [3] : [], hintAt: d === 'MEDIUM' ? 1 : -1, timeoutAt: d === 'HARD' ? 2 : -1 }) },
    WORD_SCRAMBLE: { slug: 'word-scramble', play: (p, d) => playWord(p, d === 'EASY' ? { skipAt: 1, shuffleAt: 0, wrongAt: 2 } : d === 'HARD' ? { hintAt: 0 } : {}) },
  };
  for (const [type, plan] of Object.entries(plans)) {
    for (const d of ['EASY', 'MEDIUM', 'HARD']) {
      console.log(`\n${type} · ${d}`);
      const page = await newPage(browser, d === 'MEDIUM' ? { width: 1280, mobile: false } : {});
      const label = await startGame(page, plan.slug, d);
      check(`start button names the level`, label.includes(d[0] + d.slice(1).toLowerCase()), `(${label})`);
      const t0 = Date.now();
      await plan.play(page, d);
      const r = await results(page);
      console.log(`    ${r.title} ${r.score} pts · ${r.stats.join(' · ')} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      check('reaches results with a score', r.score >= 0 && r.title.length > 0);
      check('first score is recorded as a best', /First score|New personal best/.test(r.best), `(${r.best})`);
      check('results CTA links to the Play listing', r.cta.startsWith(PLAY_URL) && r.cta.includes(`results_${plan.slug}`));
      const perfect = { MEMORY: d !== 'MEDIUM', LOGIC_PATH: true, WORD_SCRAMBLE: d === 'MEDIUM' || d === 'HARD' };
      if (perfect[type] || (type === 'MATRIX' && d === 'EASY') || (type === 'SEQUENCE' && d === 'EASY') || (type === 'ODD_ONE_OUT' && d === 'MEDIUM')) {
        check('perfect play is Flawless', r.title === 'Flawless!', `(${r.title})`);
      }
      if (type === 'MATRIX' && d === 'MEDIUM') check('three misses end Memory Matrix early', r.stats.some((s) => /Rounds cleared=\d+\/[5-6]$/.test(s)), `(${r.stats})`);
      if (type === 'MEMORY') check('moves counted', r.stats.includes(`Moves=${{ EASY: 6, MEDIUM: 9, HARD: 10 }[d]}`), `(${r.stats})`);

      // Play again restarts at the same level; Change difficulty shows the saved best.
      await page.click('.results .btn-row .btn-primary');
      await page.waitForSelector('.hud');
      check('Play again starts a new game', true);
      await page.keyboard.press('Escape');
      await page.waitForSelector('.overlay');
      await page.click('.overlay .btn-secondary');
      await page.waitForFunction(() => !document.querySelector('.overlay') && document.querySelector('.count-num'));
      check('Restart from pause begins a new countdown', true);
      await page.goto(`${BASE}/play/${plan.slug}/`, { waitUntil: 'networkidle0' });
      const best = await page.$eval(`input[value="${d}"] + .box .diff-best`, (e) => e.textContent);
      check('setup shows the saved best for that level', best.includes(r.score.toLocaleString('en-US')), `(${best})`);
      const remembered = await page.$eval(`input[value="${d}"]`, (e) => e.checked);
      check('last difficulty is remembered', remembered);
      check('no page errors', page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
  }
}

async function suiteDaily(browser) {
  console.log('\nDAILY');
  const page = await newPage(browser);
  await startGame(page, 'daily-challenge');
  const kinds = new Set();
  page.on('console', () => {});
  const levels = [];
  let n = 0;
  while (!(await inResults(page))) {
    const info = await page.evaluate(() => {
      const k = document.querySelector('.quiz-kind');
      const ready = document.querySelectorAll('.quiz-opt').length && !Array.from(document.querySelectorAll('.quiz-opt')).some((x) => /correct|wrong/.test(x.className));
      return ready ? k.textContent : null;
    });
    if (!info) { await sleep(15); continue; }
    kinds.add(info.split(' · ')[0]);
    levels.push(info.split(' · ')[1]);
    await answerQuiz(page);
    n++;
    await sleep(15);
  }
  const r = await results(page);
  console.log(`    ${r.title} ${r.score} pts · ${r.stats.join(' · ')}`);
  check('Daily has 12 puzzles', n === 12, `(${n})`);
  check('Daily mixes maths and patterns', kinds.has('Quick Math') && kinds.has('Pattern'));
  check('Daily ramps Easy → Medium → Hard', levels.slice(0, 4).every((l) => l === 'Easy') && levels.slice(4, 8).every((l) => l === 'Medium') && levels.slice(8).every((l) => l === 'Hard'), `(${levels})`);
  check('perfect Daily is Flawless', r.title === 'Flawless!', `(${r.title})`);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.results');
  const done = await page.evaluate(() => ({ text: document.querySelector('.results').textContent, start: !!document.querySelector('.setup-actions') }));
  check('Daily can be played once per day', done.text.includes('Completed today') && !done.start);
  check('Daily done view shows the next-set countdown', /Next challenge in \d+:\d\d:\d\d/.test(done.text));
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  const card = await page.evaluate(() => ({ status: document.querySelector('[data-daily-status]').textContent, next: document.querySelector('[data-daily-next]').hidden }));
  check('home Daily card shows today’s result', card.status.startsWith('Done today: 12/12'), `(${card.status})`);
  check('home Daily card shows the countdown', card.next === false);
  check('no page errors', page.errors.length === 0, page.errors.join(' | '));
  await page.close();
}

async function suiteSite(browser) {
  console.log('\nSITE');
  const paths = ['/', '/play/', '/about/', '/privacy/', '/contact/', '/play/daily-challenge/', '/play/memory-matrix/', '/play/memory-match/',
    '/play/logic-path/', '/play/odd-one-out/', '/play/word-scramble/', '/play/number-sequence/', '/play/quick-math/'];
  for (const width of [390, 820, 1280]) {
    const page = await newPage(browser, { width, mobile: width < 600, speed: 1 });
    for (const p of paths) {
      const res = await page.goto(BASE + p, { waitUntil: 'networkidle0' });
      const info = await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 20)); }
        await new Promise((r) => setTimeout(r, 300));
        const imgs = Array.from(document.images);
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          h1: document.querySelectorAll('h1').length,
          title: document.title,
          desc: (document.querySelector('meta[name=description]') || {}).content || '',
          canonical: (document.querySelector('link[rel=canonical]') || {}).href || '',
          brokenImgs: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
          noAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
          play: Array.from(document.querySelectorAll('[data-play]')).map((a) => a.href),
          ld: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).every((s) => { try { JSON.parse(s.textContent); return true; } catch (e) { return false; } }),
          unnamedButtons: Array.from(document.querySelectorAll('button, a[href]')).filter((b) => !(b.textContent.trim() || b.getAttribute('aria-label') || b.querySelector('img[alt]:not([alt=""])'))).length,
        };
      });
      const tag = `${p} @${width}`;
      check(`${tag} loads`, res.status() === 200);
      check(`${tag} no horizontal scroll`, info.overflow <= 0, `(${info.overflow}px)`);
      if (width === 390) {
        check(`${tag} one h1, title, description, canonical`, info.h1 === 1 && info.title.length > 10 && info.desc.length > 50 && info.canonical === `https://brainbuzzgame.com${p}`, JSON.stringify({ h1: info.h1, c: info.canonical }));
        check(`${tag} title/description lengths are search-friendly`, info.title.length <= 65 && info.desc.length <= 165, `(${info.title.length}/${info.desc.length})`);
        check(`${tag} images load and have alt`, info.brokenImgs.length === 0 && info.noAlt === 0, JSON.stringify(info.brokenImgs));
        check(`${tag} Play links are the official listing`, info.play.length >= 2 && info.play.every((u) => u.startsWith(`${PLAY_URL}&referrer=`)), `(${info.play.length})`);
        check(`${tag} structured data parses`, info.ld);
        check(`${tag} every button and link has a name`, info.unnamedButtons === 0, `(${info.unnamedButtons})`);
      }
    }
    check(`no page errors @${width}`, page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }

  const page = await newPage(browser, { speed: 1 });
  const res = await page.goto(`${BASE}/no-such-page/`, { waitUntil: 'networkidle0' });
  const nf = await page.evaluate(() => ({ h1: document.querySelector('h1').textContent, robots: (document.querySelector('meta[name=robots]') || {}).content }));
  check('404 page served for unknown URLs', res.status() === 404 && nf.h1.includes('Lost') && nf.robots === 'noindex');

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.click('[data-nav-toggle]');
  check('mobile menu opens', await page.$eval('#mobile-nav', (n) => n.classList.contains('open')));
  await page.keyboard.press('Escape');
  check('Escape closes the mobile menu', !(await page.$eval('#mobile-nav', (n) => n.classList.contains('open'))));
  await page.click('[data-theme-toggle]');
  check('theme toggle switches to dark', (await page.$eval('html', (h) => h.dataset.theme)) === 'dark');
  await page.reload({ waitUntil: 'networkidle0' });
  check('theme choice persists', (await page.$eval('html', (h) => h.dataset.theme)) === 'dark');
  await page.click('[data-theme-toggle]');

  await page.goto(`${BASE}/play/`, { waitUntil: 'networkidle0' });
  await page.click('[data-filter="MEMORY"]');
  const visible = await page.$$eval('[data-game-grid] .game-card', (c) => c.filter((x) => !x.hidden).map((x) => x.dataset.gameCard));
  check('category filter shows only Memory games', visible.join() === 'MATRIX,MEMORY', `(${visible})`);

  // Storage blocked (e.g. strict privacy mode): games must still work.
  const blocked = await newPage(browser);
  await blocked.evaluateOnNewDocument(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  await startGame(blocked, 'odd-one-out', 'EASY');
  await playOdd(blocked);
  const r = await results(blocked);
  check('games still work when storage is blocked', r.score > 0);
  check('no page errors with storage blocked', blocked.errors.length === 0, blocked.errors.join(' | '));
  await blocked.close();
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const only = process.argv[2];
  try {
    if (!only || only === 'site') await suiteSite(browser);
    if (!only || only === 'daily') await suiteDaily(browser);
    if (!only || only === 'games') await suiteGames(browser);
  } catch (e) {
    failures.push(`crashed: ${e.stack}`);
    console.error(e);
  }
  await browser.close();
  console.log(`\n${failures.length ? '✗' : '✓'} ${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
})();
