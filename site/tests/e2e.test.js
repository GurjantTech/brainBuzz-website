/**
 * End-to-end test: plays every game at every difficulty to its results screen in real Chrome,
 * using solvers that read only what's on screen. Also checks hints, pause/resume, restart,
 * deliberate mistakes, keyboard play, saved bests, the once-a-day Daily Challenge, navigation,
 * theme toggle, mobile menu and Play Store links. The `web` suite plays the website-only games
 * (2048, Word Detective, Sudoku Daily) and checks every move against their engines.
 *
 *   npm run build && npm run serve      (in another terminal)
 *   npm run test:e2e                    (CHROME=/path/to/chrome BASE=http://localhost:8080)
 *
 * Game clocks run 4× faster (performance.now and requestAnimationFrame are scaled) so the
 * whole suite takes a few minutes; game logic sees a consistent clock either way.
 */
import { createRequire } from 'module';
import { EASY, MEDIUM, HARD } from '../assets/js/engine/word-bank.js';
import * as M from '../assets/js/engine/merge.js';
import * as D from '../assets/js/engine/detective.js';
import { ANSWERS } from '../assets/js/engine/detective-words.js';
import * as S from '../assets/js/engine/sudoku.js';
import { todayEpochDay } from '../assets/js/engine/quiz.js';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE || 'http://localhost:8080';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const AD_CLIENT = 'ca-pub-2294761279203706';
const SPEED = 4;
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.app.dailybrainchallenge';
const WORDS = [...EASY, ...MEDIUM, ...HARD].map(([w]) => w);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
const failures = [];
const thirdParty = [];
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); } else { failures.push(`${name} ${detail}`); console.log(`  ✗ ${name} ${detail}`); }
}

// Third-party ad scripts would also see the sped-up clock below, so accelerated game runs load only this site.
// The SITE suite runs at real speed with AdSense loading, and once with it blocked.
async function newPage(browser, { width = 390, mobile = true, speed = SPEED, blockAds = speed !== 1 } = {}) {
  const page = await browser.newPage();
  page.errors = [];
  // Uncaught errors thrown entirely inside third-party code (e.g. Google's ad scripts) aren't this site's
  // bugs; they're reported as warnings instead of failing the run.
  page.on('pageerror', (e) => {
    const frames = (e.stack || '').split('\n').filter((l) => /https?:\/\//.test(l));
    if (frames.length && frames.every((l) => !l.includes(BASE))) thirdParty.push(`${e.message} (${frames[0].trim().replace(/\?[^:)]*/, '').slice(0, 110)})`);
    else page.errors.push(e.message);
  });
  const expected = blockAds ? /404|ERR_BLOCKED_BY_CLIENT/ : /404/;
  page.on('console', (m) => { if (m.type() === 'error' && !expected.test(m.text())) page.errors.push(m.text()); });
  if (blockAds) {
    await page.setRequestInterception(true);
    page.on('request', (r) => (r.url().startsWith(BASE) || r.url().startsWith('data:') ? r.continue() : r.abort('blockedbyclient')));
  }
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
    '/play/logic-path/', '/play/odd-one-out/', '/play/word-scramble/', '/play/number-sequence/', '/play/quick-math/',
    '/play/2048/', '/play/word-detective/', '/play/sudoku/'];
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
          adScripts: document.querySelectorAll('script[src*="pagead/js/adsbygoogle.js"]').length,
          adSlots: Array.from(document.querySelectorAll('ins.adsbygoogle[data-ad-slot]')).map((i) => `${i.dataset.adClient}/${i.dataset.adSlot}`),
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
        const slot = p === '/' ? [`${AD_CLIENT}/1993165487`] : /^\/play\/.+\//.test(p) ? [`${AD_CLIENT}/1076678798`] : [];
        check(`${tag} AdSense loads once with the right ad unit`, info.adScripts === 1 && info.adSlots.join() === slot.join(), `(${info.adScripts} ${info.adSlots})`);
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
  // This page also had AdSense blocked (as with an ad blocker): the empty ad slot must not be left behind.
  const adGone = await blocked.$eval('.ad-wrap', (w) => document.documentElement.classList.contains('ads-off') && getComputedStyle(w).display === 'none');
  check('games work and ad slots hide when AdSense is blocked', r.score > 0 && adGone);
  await blocked.close();
  await page.close();
}

// ---------- Website-only games (2048, Word Detective, Sudoku Daily) ----------

const progress = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('bb-progress-v1') || '{}'));
const setWeb = (page, game, value) => page.evaluate((g, v) => {
  const d = JSON.parse(localStorage.getItem('bb-progress-v1') || '{}');
  d.web = d.web || {};
  d.web[g] = v;
  localStorage.setItem('bb-progress-v1', JSON.stringify(d));
}, game, value);

async function freshPage(browser, opts) {
  const ctx = await browser.createIncognitoBrowserContext();
  const page = await newPage(ctx, { speed: 1, blockAds: true, ...opts });
  page.ctx = ctx;
  return page;
}

async function suiteMerge(browser, width) {
  const mobile = width < 600;
  const tag = mobile ? 'mobile' : 'desktop';
  const page = await freshPage(browser, { width, mobile });
  await page.goto(`${BASE}/play/2048/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.m2-board');
  const grid = async () => ((await progress(page)).web.merge.current || {});
  let g = await grid();
  check(`2048 ${tag}: starts with two tiles of 2 or 4`, g.grid.filter(Boolean).length === 2 && g.grid.filter(Boolean).every((v) => v === 2 || v === 4));
  check(`2048 ${tag}: board fits the screen`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  // Keyboard: every press is checked against the engine. Valid moves spawn exactly one tile; blocked ones change nothing.
  const dirs = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  let ok = true;
  let detail = '';
  let validMoves = 0;
  let blocked = 0;
  let lastScore = 0;
  const order = ['ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp']; // corner play, all four directions
  for (let i = 0; i < 40 && ok; i++) {
    const key = order[i % order.length];
    const before = await grid();
    if (!before.grid) break; // the random board ended early
    const expected = M.slide(M.fromGrid(before.grid, before.score), dirs[key]);
    await page.keyboard.press(key);
    await sleep(40);
    const after = await grid();
    if (!after.grid) break; // game over; the results screen is checked separately below
    lastScore = after.score;
    if (!expected.moved) {
      blocked++;
      if (JSON.stringify(after.grid) !== JSON.stringify(before.grid) || after.score !== before.score) { ok = false; detail = 'blocked move changed the board'; }
      continue;
    }
    validMoves++;
    const want = M.toGrid(expected.tiles);
    const diff = after.grid.map((v, k) => (v !== want[k] ? k : -1)).filter((k) => k >= 0);
    if (diff.length !== 1 || want[diff[0]] !== 0 || ![2, 4].includes(after.grid[diff[0]]) || after.score !== before.score + expected.gained) {
      ok = false;
      detail = `move ${i} ${key}: diff ${diff} score ${before.score}+${expected.gained}→${after.score}`;
    }
  }
  check(`2048 ${tag}: keyboard moves match the rules and spawn one tile`, ok && validMoves > 10, `${detail} (${validMoves} valid, ${blocked} blocked)`);
  if (await page.$('.results')) { // rare: the random board filled up; start again for the checks below
    await page.click('.results .btn-primary');
    await page.waitForSelector('.m2-board');
  } else {
    check(`2048 ${tag}: score shown matches the saved score`, (await page.$eval('.hud-score strong', (e) => e.textContent.replace(/,/g, ''))) === String((await grid()).score));
  }
  const best = (await progress(page)).bests.MERGE.CLASSIC;
  check(`2048 ${tag}: best score is saved`, best >= lastScore && best > 0, `(${best} vs ${lastScore})`);

  // Swipe: mouse drag on desktop, real touch events on mobile.
  const box = await (await page.$('.m2-board')).boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const before = await grid();
  const dir = ['left', 'right', 'up', 'down'].find((d) => M.slide(M.fromGrid(before.grid, before.score), d).moved);
  const [dx, dy] = { left: [-90, 0], right: [90, 0], up: [0, -90], down: [0, 90] }[dir];
  if (mobile) {
    const cdp = await page.target().createCDPSession();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
    for (let k = 1; k <= 5; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + (dx * k) / 5, y: cy + (dy * k) / 5 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 5 });
    await page.mouse.up();
  }
  await sleep(80);
  const swiped = await grid();
  const want = M.toGrid(M.slide(M.fromGrid(before.grid, before.score), dir).tiles);
  check(`2048 ${tag}: ${mobile ? 'touch swipe' : 'mouse drag'} ${dir} moves the tiles`, swiped.grid.filter((v, k) => v !== want[k]).length === 1, JSON.stringify(swiped.grid));
  const scrollY = await page.evaluate(() => scrollY);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.m2-tile');
  const restored = await page.$$eval('.m2-tile', (els) => els.length);
  check(`2048 ${tag}: board survives a reload`, restored === swiped.grid.filter(Boolean).length && (await grid()).score === swiped.score, `(${restored}) y=${scrollY}`);

  // Blocked move from a known board: nothing changes and the player is told.
  await setWeb(page, 'merge', { current: { grid: [2, 4, 8, 16, ...new Array(12).fill(0)], score: 10, won: false, keepPlaying: false, moves: 3 } });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.keyboard.press('ArrowLeft');
  await sleep(60);
  check(`2048 ${tag}: impossible move spawns nothing`, JSON.stringify((await grid()).grid) === JSON.stringify([2, 4, 8, 16, ...new Array(12).fill(0)])
    && (await page.$eval('.m2-status', (e) => e.textContent)).includes('Nothing can move left'));

  // Reaching 2048, then keep going.
  await setWeb(page, 'merge', { current: { grid: [1024, 1024, ...new Array(14).fill(0)], score: 5000, won: false, keepPlaying: false, moves: 400 } });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.keyboard.press('ArrowLeft');
  await page.waitForSelector('.overlay', { timeout: 3000 });
  check(`2048 ${tag}: making 2048 shows the win message`, (await page.$eval('.overlay', (e) => e.textContent)).includes('You made 2048'));
  await page.click('.overlay .btn-primary');
  await sleep(50);
  const cont = await grid();
  check(`2048 ${tag}: Keep going continues the same board`, !(await page.$('.overlay')) && cont.won === true && cont.keepPlaying === true && cont.grid.includes(2048));
  await page.keyboard.press('ArrowDown');
  await sleep(60);
  check(`2048 ${tag}: no second win message after continuing`, !(await page.$('.overlay')));

  // One move from game over: the move fills the last gap and nothing can merge.
  await setWeb(page, 'merge', { current: { grid: [2, 2, 8, 16, 8, 16, 32, 64, 16, 32, 64, 128, 32, 64, 128, 256], score: 900, won: false, keepPlaying: false, moves: 99 } });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.keyboard.press('ArrowLeft');
  await page.waitForSelector('.results', { timeout: 3000 });
  const over = await page.$eval('.results', (e) => e.textContent);
  check(`2048 ${tag}: game over is detected and shows the score`, over.includes('No moves left') && over.includes('904'), over.slice(0, 80));
  check(`2048 ${tag}: finished game isn't restored`, (await progress(page)).web.merge.current === null);
  await page.click('.results .btn-primary');
  await page.waitForSelector('.m2-board');
  check(`2048 ${tag}: Play again starts a fresh board`, (await grid()).grid.filter(Boolean).length === 2 && (await grid()).score === 0);

  // New game asks first when there's progress.
  for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) await page.keyboard.press(k);
  await sleep(50);
  const moved = (await grid()).moves > 0;
  await page.click('.hud-actions .btn');
  const asked = await page.$('.overlay');
  if (asked) await page.click('.overlay .btn-primary');
  await sleep(50);
  check(`2048 ${tag}: New game confirms, then resets`, (!moved || asked) && (await grid()).score === 0 && (await grid()).moves === 0);
  check(`2048 ${tag}: no page errors`, page.errors.length === 0, page.errors.join(' | '));
  await page.ctx.close();
}

async function typeWord(page, word, { screen = false } = {}) {
  for (const ch of word) {
    if (screen) await page.click(`.wd-key[aria-label^="${ch}"]`);
    else await page.keyboard.press(ch.toLowerCase());
  }
  if (screen) await page.click('.wd-key.wide:first-child');
  else await page.keyboard.press('Enter');
  await sleep(950);
}

async function suiteDetective(browser) {
  const today = todayEpochDay();
  const answer = D.dailyAnswer(today);
  const wrongs = ANSWERS.map((w) => w.toUpperCase()).filter((w) => w !== answer).slice(0, 6);
  const page = await freshPage(browser, { width: 390, mobile: true });
  // puppeteer-core 13's overridePermissions uses an old clipboard permission name that current Chrome ignores.
  await browser._connection.send('Browser.grantPermissions', {
    origin: BASE, browserContextId: page.ctx._id, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  });
  await page.goto(`${BASE}/play/word-detective/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.wd-grid');
  check('Detective: shows today’s puzzle number', (await page.$eval('.wd-tab[aria-pressed="true"]', (e) => e.textContent)).includes(`#${D.puzzleNumber(today)}`));
  const saved = async () => ((await progress(page)).web || {}).detective || {};
  await typeWord(page, 'QXZVJ');
  check('Detective: unknown words are rejected without using a guess', (await page.$eval('.wd-msg', (e) => e.textContent)).includes('isn’t in the word list') && !((await saved()).days || {})[today]);
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');
  await typeWord(page, 'CRA');
  check('Detective: short guesses are rejected', (await page.$eval('.wd-msg', (e) => e.textContent)).includes('Not enough letters'));
  for (let i = 0; i < 3; i++) await page.keyboard.press('Backspace');

  // A wrong guess with the on-screen keyboard; tiles and keys must match the scoring rules.
  await typeWord(page, wrongs[0], { screen: true });
  const marks = await page.$$eval('.wd-row:first-child .wd-tile', (els) => els.map((e) => ['correct', 'present', 'absent'].find((c) => e.classList.contains(c))));
  check('Detective: on-screen keyboard enters a guess', ((await saved()).days[today].guesses || []).join() === wrongs[0]);
  check('Detective: tile colours follow the rules', JSON.stringify(marks) === JSON.stringify(D.score(answer, wrongs[0])), `${wrongs[0]} vs ${answer}: ${marks}`);
  const states = D.letterStates(answer, [wrongs[0]]);
  const keyOk = await page.evaluate((st) => Object.entries(st).every(([k, v]) => document.querySelector(`.wd-key[aria-label^="${k}"]`).classList.contains(v)), states);
  check('Detective: keyboard shows letter states', keyOk);

  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.wd-grid');
  check('Detective: guesses survive a reload (no fresh attempts)', (await page.$$eval('.wd-row:first-child .wd-tile', (els) => els.map((e) => e.textContent).join(''))) === wrongs[0]);

  // Yesterday's win carries a streak into today.
  const s0 = (await saved()).stats || D.emptyStats();
  await setWeb(page, 'detective', { ...(await saved()), stats: { ...s0, played: 3, won: 3, streak: 3, maxStreak: 3, lastDay: today - 1, lastWonDay: today - 1, dist: [0, 1, 2, 0, 0, 0] } });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.wd-grid');
  await typeWord(page, answer);
  await page.waitForSelector('.wd-panel .results', { timeout: 4000 });
  let st = (await saved()).stats;
  check('Detective: solving shows the result', (await page.$eval('.wd-panel', (e) => e.textContent)).includes('You found'));
  check('Detective: win updates stats once and extends the streak', st.played === 4 && st.won === 4 && st.streak === 4 && st.dist[1] === 2, JSON.stringify(st));

  // Share (headless Chrome has no navigator.share → clipboard). The clipboard needs a real click, so let the panel
  // finish scrolling into view first.
  await sleep(900);
  await page.click('.wd-panel .btn-primary');
  await page.waitForFunction(() => document.querySelector('.wd-share-note').textContent.length > 0, { timeout: 3000 });
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  const note = await page.$eval('.wd-share-note', (e) => e.textContent);
  check('Detective: share copies a spoiler-free result', note.includes('Copied') && clip.includes(`#${D.puzzleNumber(today)} 2/6`) && !clip.includes(answer) && /🟩/.test(clip), `note="${note}" clip="${clip}"`);

  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.wd-panel .results');
  await page.keyboard.type('hello');
  await page.keyboard.press('Enter');
  await sleep(300);
  st = (await saved()).stats;
  check('Detective: a finished daily can’t be replayed for stats', st.played === 4 && st.streak === 4 && (await saved()).days[today].guesses.length === 2);
  await page.goto(`${BASE}/play/`, { waitUntil: 'networkidle0' });
  check('Detective: game card shows the streak', (await page.$eval('[data-best="DETECTIVE"]', (e) => e.textContent)) === '4');

  // Practice never touches the daily stats.
  await page.goto(`${BASE}/play/word-detective/`, { waitUntil: 'networkidle0' });
  await page.click('.wd-tab:nth-child(2)');
  for (const w of wrongs) { if (await page.$('.wd-panel .results')) break; await typeWord(page, w); }
  await page.waitForSelector('.wd-panel .results', { timeout: 4000 });
  const pt = await page.$eval('.wd-panel', (e) => e.textContent);
  check('Detective: practice game ends with the answer and leaves stats alone', pt.includes('Practice word') && /You found|The word was/.test(pt) && (await saved()).stats.played === 4);
  check('Detective: no page errors', page.errors.length === 0, page.errors.join(' | '));
  await page.ctx.close();

  // A daily loss reveals the word and resets the streak; sharing falls back to a text box without share or clipboard.
  const lose = await freshPage(browser, { width: 1280, mobile: false });
  await lose.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });
  await lose.goto(`${BASE}/play/word-detective/`, { waitUntil: 'networkidle0' });
  for (const w of wrongs) await typeWord(lose, w);
  await lose.waitForSelector('.wd-panel .results', { timeout: 4000 });
  const lost = await lose.$eval('.wd-panel', (e) => e.textContent);
  const ls = (await progress(lose)).web.detective.stats;
  check('Detective: a loss reveals the answer', lost.includes('The word was') && lost.includes(answer));
  check('Detective: a loss counts once and resets the streak', ls.played === 1 && ls.won === 0 && ls.streak === 0);
  await lose.$eval('.wd-panel .btn-primary', (btn) => btn.click());
  await lose.waitForSelector('.wd-share-text', { timeout: 3000 });
  check('Detective: without share or clipboard, the result is shown to copy', (await lose.$eval('.wd-share-note', (e) => e.textContent)).includes('Sharing isn’t available')
    && (await lose.$eval('.wd-share-text', (e) => e.value)).includes('X/6'));
  check('Detective: no page errors (fallbacks)', lose.errors.length === 0, lose.errors.join(' | '));
  await lose.ctx.close();
}

async function suiteSudoku(browser, width) {
  const mobile = width < 600;
  const tag = mobile ? 'mobile' : 'desktop';
  const today = todayEpochDay();
  const ref = S.generate('EASY', S.dailySeed(today, 'EASY'));
  const page = await freshPage(browser, { width, mobile });
  await page.goto(`${BASE}/play/sudoku/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.setup-actions .btn-primary');
  await page.evaluate(() => document.querySelector('input[value="EASY"]').click());
  await page.click('.setup-actions .btn-primary');
  await page.waitForSelector('.sd-grid');
  const cells = () => page.$$eval('.sd-cell', (els) => els.map((e) => ({ v: Number(e.childNodes.length === 1 && e.firstChild.nodeType === 3 ? e.textContent : 0), given: e.classList.contains('given'), wrong: e.classList.contains('wrong'), hinted: e.classList.contains('hinted'), notes: e.querySelector('.sd-notes') ? e.textContent : '' })));
  let c = await cells();
  check(`Sudoku ${tag}: today’s Easy puzzle matches the generator (same for everyone)`, c.length === 81 && c.every((x, i) => (x.given ? x.v === ref.puzzle[i] : ref.puzzle[i] === 0)));
  await sleep(900); // the board scrolls smoothly into view first
  const fits = await page.evaluate(() => {
    const g = document.querySelector('.sd-grid').getBoundingClientRect();
    const hit = document.elementFromPoint(g.left + 10, g.top + 10);
    return document.documentElement.scrollWidth <= innerWidth && g.right <= innerWidth && !!(hit && hit.closest('.sd-grid'));
  });
  check(`Sudoku ${tag}: grid fits and isn’t hidden under the header`, fits);

  const clickCell = (i) => page.click(`.sd-cell:nth-child(${i + 1})`);
  const givenIdx = ref.puzzle.findIndex((v) => v);
  await clickCell(givenIdx);
  await page.keyboard.press(String((ref.puzzle[givenIdx] % 9) + 1));
  c = await cells();
  check(`Sudoku ${tag}: clues can’t be changed`, c[givenIdx].v === ref.puzzle[givenIdx]);
  const empties = ref.puzzle.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  const e0 = empties[0];
  const wrongDigit = (ref.solution[e0] % 9) + 1;
  await clickCell(e0);
  await page.keyboard.press(String(wrongDigit));
  c = await cells();
  check(`Sudoku ${tag}: a wrong number is marked and counted`, c[e0].wrong && (await page.$eval('.hud', (e) => e.textContent)).includes('1 mistake'));
  await page.keyboard.press('Backspace');
  c = await cells();
  check(`Sudoku ${tag}: erase clears the cell`, c[e0].v === 0 && !c[e0].wrong);
  await page.keyboard.press('n');
  await page.keyboard.press('3');
  await page.keyboard.press('7');
  await page.keyboard.press('n');
  c = await cells();
  check(`Sudoku ${tag}: notes mode pencils in candidates`, c[e0].notes.replace(/\s/g, '') === '37', `(${c[e0].notes})`);
  // Number pad entry (touch-style) on the next empty cell.
  const e1 = empties[1];
  await clickCell(e1);
  await page.click(`.sd-num:nth-child(${ref.solution[e1]})`);
  c = await cells();
  check(`Sudoku ${tag}: number pad enters a number`, c[e1].v === ref.solution[e1] && !c[e1].wrong);
  await page.click('.hud-btn.hint');
  c = await cells();
  const hinted = c.findIndex((x) => x.hinted);
  check(`Sudoku ${tag}: hint fills a correct number`, hinted >= 0 && c[hinted].v === ref.solution[hinted] && (await page.$eval('.hud-btn.hint', (e) => e.textContent)).includes('1'));

  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.sd-continue');
  await page.click('.sd-continue .btn');
  await page.waitForSelector('.sd-grid');
  c = await cells();
  check(`Sudoku ${tag}: progress survives a reload`, c[e1].v === ref.solution[e1] && c[hinted].hinted && (await page.$eval('.hud', (e) => e.textContent)).includes('1 mistake'));

  // Solve the rest with the keyboard (arrow keys between cells).
  c = await cells();
  for (const i of empties) {
    if (c[i].v === ref.solution[i]) continue;
    await clickCell(i);
    await page.keyboard.press(String(ref.solution[i]));
  }
  await page.waitForSelector('.results', { timeout: 4000 });
  const res = await page.$eval('.results', (e) => e.textContent);
  const data = (await progress(page)).web.sudoku;
  check(`Sudoku ${tag}: completing the grid shows the result`, res.includes('Solved!') && res.includes('Mistakes'), res.slice(0, 60));
  check(`Sudoku ${tag}: best time, daily completion and solved count are saved`, data.best.EASY > 0 && data.daily[today].EASY && data.solved === 1 && data.current === null, JSON.stringify(data).slice(0, 120));
  await page.click('.results .btn-secondary');
  await page.waitForSelector('.diff-option');
  check(`Sudoku ${tag}: setup shows today’s puzzle as solved`, (await page.$eval('input[value="EASY"] + .box', (e) => e.textContent)).includes('Today’s puzzle solved'));
  // Replaying today's puzzle doesn't count twice.
  await page.click('.setup-actions .btn-primary');
  await page.waitForSelector('.sd-grid');
  c = await cells();
  for (const i of empties) { await clickCell(i); await page.keyboard.press(String(ref.solution[i])); }
  await page.waitForSelector('.results', { timeout: 4000 });
  check(`Sudoku ${tag}: replaying today’s puzzle doesn’t add to the solved count`, (await progress(page)).web.sudoku.solved === 1);

  // Arrow keys move the selection; a random Hard puzzle generates quickly.
  await page.click('.results .btn-secondary');
  await page.waitForSelector('.diff-option');
  await page.evaluate(() => document.querySelector('input[value="HARD"]').click());
  const t0 = Date.now();
  await page.click('.setup-actions .btn-secondary');
  await page.waitForSelector('.sd-grid');
  const genMs = Date.now() - t0;
  const sel = () => page.$eval('.sd-cell.selected', (e) => Array.prototype.indexOf.call(e.parentNode.children, e));
  const s1 = await sel();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  const s2 = await sel();
  check(`Sudoku ${tag}: arrow keys move the selection`, s2 === Math.floor(s1 / 9 + 1) % 9 * 9 + ((s1 % 9) + 1) % 9, `${s1}→${s2}`);
  const givens = (await cells()).filter((x) => x.given).length;
  check(`Sudoku ${tag}: random Hard puzzle is ready quickly`, genMs < 2500 && givens >= 22 && givens <= 32, `${genMs}ms, ${givens} clues`);
  await page.goto(`${BASE}/play/`, { waitUntil: 'networkidle0' });
  check(`Sudoku ${tag}: game card shows puzzles solved`, (await page.$eval('[data-best="SUDOKU"]', (e) => e.textContent)) === '1');
  check(`Sudoku ${tag}: no page errors`, page.errors.length === 0, page.errors.join(' | '));
  await page.ctx.close();
}

async function suiteWeb(browser) {
  console.log('\nWEBSITE GAMES');
  await suiteMerge(browser, 390);
  await suiteMerge(browser, 1280);
  await suiteDetective(browser);
  await suiteSudoku(browser, 390);
  await suiteSudoku(browser, 1280);
  // Corrupt saved data must never break a game.
  const page = await freshPage(browser, { width: 390, mobile: true });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.setItem('bb-progress-v1', JSON.stringify({ web: { merge: { current: { grid: 'x', score: -4 } }, detective: { days: { 1: 5 }, stats: 'bad' }, sudoku: { current: { puzzle: '1', level: 'NOPE' }, best: { EASY: 'fast' } } } })));
  let stray = '';
  for (const slug of ['2048', 'word-detective', 'sudoku']) {
    await page.goto(`${BASE}/play/${slug}/`, { waitUntil: 'networkidle0' });
    await sleep(200);
    if (/\b(null|undefined|NaN)\b/.test(await page.$eval('#game', (e) => e.innerText))) stray += ` ${slug}`;
  }
  check('website games never show null/undefined/NaN', !stray, stray);
  await page.goto(`${BASE}/play/`, { waitUntil: 'networkidle0' });
  check('website games ignore corrupt saved data', page.errors.length === 0, page.errors.join(' | '));
  await page.ctx.close();
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const only = process.argv[2];
  try {
    if (!only || only === 'site') await suiteSite(browser);
    if (!only || only === 'daily') await suiteDaily(browser);
    if (!only || only === 'games') await suiteGames(browser);
    if (!only || only === 'web') await suiteWeb(browser);
  } catch (e) {
    failures.push(`crashed: ${e.stack}`);
    console.error(e);
  }
  await browser.close();
  if (thirdParty.length) {
    console.log(`\n⚠ ${thirdParty.length} uncaught error(s) from third-party scripts (not counted as failures):`);
    for (const t of new Set(thirdParty)) console.log(`  - ${t}`);
  }
  console.log(`\n${failures.length ? '✗' : '✓'} ${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
})();
