/**
 * Sudoku Daily (website only). Levels 1–100 (Level N is the same puzzle for everyone; solving one unlocks
 * the next) plus today's puzzle (same for everyone on a date). Older saves may hold a random puzzle.
 * Wrong numbers are marked straight away; hints fill a correct cell. Progress is saved as you play.
 */
import { h, icon, clear, formatDuration, prefersReducedMotion } from '../lib/dom.js';
import * as S from '../engine/sudoku.js';
import { DIFFICULTIES, difficultyOf } from '../engine/models.js';
import { MAX_LEVEL, levelOf, levelKey, sudokuStars } from '../engine/levels.js';
import { todayEpochDay } from '../engine/quiz.js';
import * as store from '../lib/store.js';
import { statGrid, appCta, confetti, liveRegion, ownsKeys, WEB_LEVEL_LIMIT, appOnlyLevelDialog } from './kit.js';
import { levelHeader, levelPicker, levelDetail, startButton, levelNote, starRow } from './levels-ui.js';

const KEY = 'sudoku';
const TYPE = 'SUDOKU';
const DAYS_KEPT = 14;
/** Today's puzzle keeps the Medium daily puzzle everyone already gets on this date. */
const DAILY_TIER = 'MEDIUM';
const TIERS = DIFFICULTIES.map((d) => d.name);
const isTier = (v) => TIERS.includes(v);
const isLevel = (v) => Number.isInteger(v) && v >= 1 && v <= MAX_LEVEL;
const posInt = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
const bestKey = (g) => (g.mode === 'level' ? levelKey(g.level) : g.mode === 'daily' ? 'DAILY' : g.level);
const progress = () => store.levelProgress(TYPE, MAX_LEVEL);

function load() {
  const d = store.webData(KEY);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const best = {};
  for (const [k, v] of Object.entries(obj(d.best))) if (/^(L\d{1,3}|DAILY|EASY|MEDIUM|HARD)$/.test(k) && Number.isFinite(v) && v > 0) best[k] = v;
  return { current: restore(d.current), best, solved: posInt(d.solved), daily: obj(d.daily), last: isLevel(d.last) ? d.last : null };
}

function save(patch) {
  const d = store.webData(KEY);
  store.saveWebData(KEY, { ...d, ...patch });
}

/** A saved game is only used if it's internally consistent; otherwise it's ignored. */
function restore(c) {
  if (!c || typeof c !== 'object') return null;
  if (!(c.mode === 'level' ? isLevel(c.level) : ['daily', 'random'].includes(c.mode) && isTier(c.level))) return null;
  const puzzle = S.fromText(c.puzzle);
  const solution = S.fromText(c.solution);
  const values = S.fromText(c.values);
  if (!puzzle || !solution || !values || !S.isValidSolution(solution)) return null;
  if (!puzzle.every((v, i) => v === 0 || (v === solution[i] && values[i] === v))) return null;
  const notes = Array.isArray(c.notes) && c.notes.length === 81 && c.notes.every((n) => Number.isInteger(n) && n >= 0 && n <= 0x3fe) ? c.notes : new Array(81).fill(0);
  const hinted = typeof c.hinted === 'string' && /^[01]{81}$/.test(c.hinted) ? c.hinted.split('').map((x) => x === '1') : new Array(81).fill(false);
  return {
    mode: c.mode, level: c.level, day: Number.isInteger(c.day) ? c.day : null,
    puzzle, solution, values, notes, hinted,
    mistakes: posInt(c.mistakes), hints: posInt(c.hints), elapsed: posInt(c.elapsed),
  };
}

function serialize(g) {
  return {
    mode: g.mode, level: g.level, day: g.day,
    puzzle: S.toText(g.puzzle), solution: S.toText(g.solution), values: S.toText(g.values),
    notes: g.notes, hinted: g.hinted.map((x) => (x ? '1' : '0')).join(''),
    mistakes: g.mistakes, hints: g.hints, elapsed: Math.round(g.elapsed),
  };
}

function mount(stage, meta) {
  const { el: live, announce } = liveRegion();
  const view = h('div.stage-inner');
  clear(stage).append(view, live);
  let level = Math.min(load().last || progress().unlocked, progress().unlocked);
  let game = null; // the puzzle being played
  let stopTimer = () => {};

  const show = (...nodes) => { stopTimer(); clear(view).append(...nodes.filter(Boolean)); };
  const levelLabel = (g) => (g.mode === 'level' ? `Level ${g.level}` : g.mode === 'daily' ? 'Daily puzzle' : difficultyOf(g.level).label);
  const modeLabel = (g, today) => (g.mode === 'level' ? 'level puzzle' : g.mode === 'daily' ? (g.day === today ? 'today’s puzzle' : 'an earlier daily puzzle') : 'random puzzle');
  /** Levels above the website limit are app-only: back to the level list with the app dialog on top. */
  const appOnly = (lv) => {
    if (lv <= WEB_LEVEL_LIMIT) return false;
    setupView();
    appOnlyLevelDialog(stage, lv, 'sudoku_level_limit');
    return true;
  };
  const dateLabel = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // ---------- Setup ----------

  function setupView() {
    game = null;
    const data = load();
    const today = todayEpochDay();
    const doneToday = (data.daily[today] || {})[DAILY_TIER];
    const { unlocked, stars } = progress();
    if (level > unlocked) level = unlocked;
    const detail = h('div');
    const start = startButton('', () => newGame('level'));
    const renderDetail = () => {
      const best = data.best[levelKey(level)];
      const earned = stars[level] || 0;
      const next = level < MAX_LEVEL ? `unlock Level ${level + 1}` : 'finish all 100 levels';
      const banner = best
        ? { tone: 'done', icon: 'emoji_events', title: `Best time: ${formatDuration(best)}`, text: earned >= 3 ? 'Three stars! Replay to beat your time.' : 'Replay with no mistakes and no hints for three stars.' }
        : { tone: 'todo', icon: 'lock', title: `No time on Level ${level} yet. Set one!`, text: `Solve this puzzle to ${next}.` };
      clear(detail).append(levelDetail({ level, stars: earned, rules: meta.rules(levelOf(level)), banner }));
      start.querySelector('.lv-start-btn span').textContent = `${earned ? 'Replay' : 'Start'} Level ${level}`;
    };
    const picker = levelPicker({ unlocked, stars, selected: level, onChange: (lv) => { level = lv; renderDetail(); } });
    renderDetail();
    const cont = data.current;
    show(
      cont ? h('div.sd-continue', {},
        h('div', {}, h('strong', {}, 'Continue your puzzle'),
          h('span.muted', {}, ` ${levelLabel(cont)} · ${modeLabel(cont, today)} · ${formatDuration(cont.elapsed)}`)),
        h('button.btn.btn-primary', { type: 'button', onclick: () => { if (!(cont.mode === 'level' && appOnly(cont.level))) play(cont); } }, icon('play_arrow'), h('span', {}, 'Continue'))) : null,
      h('div.lv-setup', {},
        levelHeader({ unlocked, stars }),
        picker,
        detail,
        start,
        h('div.lv-extra', {},
          h('button.btn.btn-secondary.sd-daily', { type: 'button', onclick: () => newGame('daily') }, icon('calendar_month'),
            h('span', {}, doneToday ? `Replay today’s puzzle (${formatDuration(doneToday.ms)})` : `Today’s puzzle · ${dateLabel()}`))),
        levelNote('Levels start easy and get harder; solve one to unlock the next. Today’s puzzle is the same for everyone and changes at midnight. Progress and best times are saved in this browser only.')),
    );
  }

  function newGame(mode) {
    if (mode === 'level' && appOnly(level)) return;
    let made;
    try {
      made = mode === 'level' ? S.generate(level, S.levelSeed(level)) : S.generate(DAILY_TIER, S.dailySeed(todayEpochDay(), DAILY_TIER));
    } catch (e) {
      show(h('div.stage-loading', {}, icon('cancel'), h('p', {}, 'Sorry, a puzzle couldn’t be created. Please try again.'),
        h('button.btn.btn-primary', { type: 'button', onclick: () => setupView() }, icon('refresh'), h('span', {}, 'Back'))));
      return;
    }
    save({ last: level });
    play({
      mode, level: mode === 'level' ? level : DAILY_TIER, day: mode === 'daily' ? todayEpochDay() : null,
      puzzle: made.puzzle, solution: made.solution, values: made.puzzle.slice(),
      notes: new Array(81).fill(0), hinted: new Array(81).fill(false), mistakes: 0, hints: 0, elapsed: 0,
    });
  }

  // ---------- Play ----------

  function play(g) {
    game = g;
    let selected = g.values.findIndex((v) => v === 0);
    let notesMode = false;
    const given = (i) => g.puzzle[i] !== 0;
    const locked = (i) => given(i) || g.hinted[i];
    const wrong = (i) => g.values[i] !== 0 && g.values[i] !== g.solution[i];

    const timeEl = h('span', {}, formatDuration(g.elapsed));
    const mistakesEl = h('span', {}, '');
    const hintBtn = h('button.hud-btn.hint', { type: 'button', title: 'Fill in a correct number', onclick: () => hint() }, icon('lightbulb'), h('span', {}, 'Hint'));
    const backBtn = h('button.hud-btn', { type: 'button', 'aria-label': 'Back to puzzle menu (progress is saved)', title: 'Menu (progress is saved)', onclick: () => { persist(); setupView(); } }, icon('arrow_back'));
    const cells = Array.from({ length: 81 }, (_, i) => h('button.sd-cell', {
      type: 'button',
      'data-cell': '',
      onclick: () => select(i),
    }));
    const gridEl = h('div.sd-grid', { role: 'group', 'aria-label': 'Sudoku grid, 9 by 9' }, cells);
    const padDigits = Array.from({ length: 9 }, (_, k) => h('button.sd-num', {
      type: 'button',
      onclick: () => input(k + 1),
      onmousedown: (e) => e.preventDefault(),
    }, h('b', {}, String(k + 1)), h('small', {})));
    const notesBtn = h('button.btn.btn-secondary.btn-sm.sd-tool', { type: 'button', 'aria-pressed': 'false', onclick: () => toggleNotes(), onmousedown: (e) => e.preventDefault() }, icon('edit'), h('span', {}, 'Notes off'));
    const eraseBtn = h('button.btn.btn-secondary.btn-sm.sd-tool', { type: 'button', onclick: () => erase(), onmousedown: (e) => e.preventDefault() }, icon('ink_eraser'), h('span', {}, 'Erase'));
    const status = h('p.status-line.sd-status', { 'aria-live': 'polite' });

    show(
      h('div.hud', {},
        h('div.hud-score', {}, h('small', {}, { level: 'SUDOKU', daily: 'TODAY’S PUZZLE', random: 'RANDOM PUZZLE' }[g.mode]), h('strong', { style: { fontSize: '1.3rem' } }, levelLabel(g))),
        h('span.pill.hud-time', { 'aria-label': 'Time' }, icon('timer'), timeEl),
        h('span.pill', {}, icon('cancel'), mistakesEl),
        h('div.hud-actions', {}, hintBtn, backBtn)),
      gridEl,
      status,
      h('div.sd-pad', { role: 'group', 'aria-label': 'Numbers' }, padDigits),
      h('div.sd-tools', {}, notesBtn, eraseBtn),
      h('p.sd-help', {}, 'Keyboard: arrows move, 1–9 enter a number, Backspace erases, N switches notes on or off.'),
    );

    function render() {
      const v = g.values[selected];
      cells.forEach((cell, i) => {
        const related = selected >= 0 && i !== selected && (S.rowOf(i) === S.rowOf(selected) || S.colOf(i) === S.colOf(selected) || S.boxOf(i) === S.boxOf(selected));
        const cls = ['sd-cell'];
        if (given(i)) cls.push('given');
        else if (g.hinted[i]) cls.push('hinted');
        else if (g.values[i]) cls.push('user');
        if (wrong(i)) cls.push('wrong');
        if (i === selected) cls.push('selected');
        else if (related) cls.push('related');
        if (v && g.values[i] === v && i !== selected) cls.push('same');
        if (S.colOf(i) % 3 === 2 && S.colOf(i) < 8) cls.push('box-r');
        if (S.rowOf(i) % 3 === 2 && S.rowOf(i) < 8) cls.push('box-b');
        cell.className = cls.join(' ');
        cell.tabIndex = i === selected ? 0 : -1;
        clear(cell);
        let desc;
        if (g.values[i]) {
          cell.append(String(g.values[i]));
          desc = `${g.values[i]}${given(i) ? ', clue' : g.hinted[i] ? ', from a hint' : wrong(i) ? ', wrong' : ''}`;
        } else if (g.notes[i]) {
          const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => g.notes[i] & (1 << d));
          cell.append(h('span.sd-notes', {}, [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => h('i', {}, g.notes[i] & (1 << d) ? String(d) : ''))));
          desc = `empty, notes ${digits.join(' ')}`;
        } else {
          desc = 'empty';
        }
        cell.setAttribute('aria-label', `Row ${S.rowOf(i) + 1}, column ${S.colOf(i) + 1}: ${desc}`);
      });
      padDigits.forEach((b, k) => {
        const d = k + 1;
        const left = 9 - g.values.filter((x, i) => x === d && x === g.solution[i]).length;
        b.lastChild.textContent = left ? String(left) : '';
        b.disabled = left === 0;
        b.setAttribute('aria-label', left ? `${d}, ${left} left to place` : `${d}, all placed`);
      });
      mistakesEl.textContent = `${g.mistakes} ${g.mistakes === 1 ? 'mistake' : 'mistakes'}`;
      hintBtn.querySelector('span').textContent = g.hints ? `Hint · ${g.hints}` : 'Hint';
      notesBtn.setAttribute('aria-pressed', String(notesMode));
      notesBtn.lastChild.textContent = notesMode ? 'Notes on' : 'Notes off';
      notesBtn.classList.toggle('on', notesMode);
    }

    function select(i, focus = true) {
      selected = i;
      render();
      if (focus) cells[i].focus({ preventScroll: true });
    }

    function persist() {
      save({ current: serialize(g) });
    }

    function input(d) {
      if (selected < 0 || locked(selected)) { status.textContent = selected >= 0 ? 'That number is part of the puzzle.' : 'Pick a cell first.'; return; }
      const i = selected;
      if (notesMode) {
        if (g.values[i]) { status.textContent = 'Erase the number first to add notes.'; return; }
        g.notes[i] ^= 1 << d;
        status.textContent = '';
        render();
        persist();
        return;
      }
      if (g.values[i] === d) return;
      g.values[i] = d;
      g.notes[i] = 0;
      if (d !== g.solution[i]) {
        g.mistakes++;
        status.textContent = `${d} doesn’t go there.`;
        announce(`${d} is wrong here. ${g.mistakes} ${g.mistakes === 1 ? 'mistake' : 'mistakes'}.`);
      } else {
        for (const p of S.PEERS[i]) g.notes[p] &= ~(1 << d);
        status.textContent = '';
        announce(`${d} placed.`);
      }
      render();
      persist();
      checkDone();
    }

    function erase() {
      if (selected < 0 || locked(selected)) return;
      g.values[selected] = 0;
      g.notes[selected] = 0;
      status.textContent = '';
      render();
      persist();
    }

    function toggleNotes() {
      notesMode = !notesMode;
      render();
      announce(notesMode ? 'Notes on' : 'Notes off');
    }

    /** Fills the selected cell if it needs it, otherwise the most constrained open cell. */
    function hint() {
      const open = (i) => !locked(i) && g.values[i] !== g.solution[i];
      let target = selected >= 0 && open(selected) ? selected : -1;
      if (target < 0) {
        let fewest = 10;
        const correct = g.values.map((v, i) => (v === g.solution[i] ? v : 0));
        for (let i = 0; i < 81; i++) {
          if (!open(i)) continue;
          const used = new Set(S.PEERS[i].map((p) => correct[p]));
          const n = 9 - [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => used.has(d)).length;
          if (n < fewest) { fewest = n; target = i; }
        }
      }
      if (target < 0) return;
      g.values[target] = g.solution[target];
      g.notes[target] = 0;
      g.hinted[target] = true;
      g.hints++;
      for (const p of S.PEERS[target]) g.notes[p] &= ~(1 << g.solution[target]);
      status.textContent = `Hint: ${g.solution[target]} goes in row ${S.rowOf(target) + 1}, column ${S.colOf(target) + 1}.`;
      announce(status.textContent);
      select(target);
      persist();
      checkDone();
    }

    function checkDone() {
      if (!g.values.every((v, i) => v === g.solution[i])) return;
      stopTimer();
      finish(g);
    }

    gridEl.addEventListener('keydown', (e) => {
      const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 9, ArrowUp: -9 };
      if (!(e.key in moves)) return;
      e.preventDefault();
      const cur = selected < 0 ? 0 : selected;
      const r = S.rowOf(cur);
      const c = S.colOf(cur);
      const next = e.key === 'ArrowRight' ? r * 9 + ((c + 1) % 9) : e.key === 'ArrowLeft' ? r * 9 + ((c + 8) % 9)
        : e.key === 'ArrowDown' ? ((r + 1) % 9) * 9 + c : ((r + 8) % 9) * 9 + c;
      select(next);
    });

    const onKey = (e) => {
      if (!gridEl.isConnected) { document.removeEventListener('keydown', onKey); return; }
      if (!ownsKeys(stage, e)) return;
      if (/^[1-9]$/.test(e.key)) { e.preventDefault(); input(Number(e.key)); } else if (['Backspace', 'Delete', '0'].includes(e.key)) { e.preventDefault(); erase(); } else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); toggleNotes(); }
    };
    document.addEventListener('keydown', onKey);

    // Timer: counts only while this tab is visible; progress is saved every few seconds.
    let last = performance.now();
    let sinceSave = 0;
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(now - last, 2000);
      last = now;
      if (!gridEl.isConnected) return stopTimer();
      if (document.hidden) return undefined;
      g.elapsed += dt;
      sinceSave += dt;
      timeEl.textContent = formatDuration(g.elapsed);
      if (sinceSave > 5000) { sinceSave = 0; persist(); }
      return undefined;
    };
    const timer = setInterval(tick, 500);
    const onVis = () => { last = performance.now(); if (document.hidden) persist(); };
    document.addEventListener('visibilitychange', onVis);
    stopTimer = () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVis); stopTimer = () => {}; };

    render();
    persist();
    if (selected >= 0) cells[selected].focus({ preventScroll: true });
    const top = stage.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.4) stage.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    announce(`${levelLabel(g)} Sudoku. ${g.values.filter((v) => !v).length} empty cells.`);
  }

  // ---------- Results ----------

  function finish(g) {
    const data = load();
    const ms = Math.round(g.elapsed);
    const key = bestKey(g);
    const prevBest = data.best[key] || null;
    const isBest = prevBest === null || ms < prevBest;
    const best = { ...data.best };
    if (isBest) best[key] = ms;
    const daily = { ...data.daily };
    let firstToday = false;
    if (g.mode === 'daily' && g.day !== null) {
      const forDay = { ...(daily[g.day] || {}) };
      firstToday = !forDay[g.level];
      if (firstToday) forDay[g.level] = { ms, mistakes: g.mistakes, hints: g.hints };
      daily[g.day] = forDay;
      for (const d of Object.keys(daily)) if (Number(d) < g.day - DAYS_KEPT) delete daily[d];
    }
    const lv = g.mode === 'level' ? store.recordLevel(TYPE, g.level, sudokuStars(g.mistakes, g.hints), MAX_LEVEL) : null;
    // A replayed daily or level puzzle doesn't add to the solved count again.
    const solved = data.solved + (g.mode === 'random' || firstToday || (lv && !lv.previousStars) ? 1 : 0);
    save({ current: null, best, daily, solved });
    const next = lv && g.level < MAX_LEVEL ? g.level + 1 : null;

    if (!prefersReducedMotion()) confetti(stage);
    const heading = h('h2', { tabindex: '-1' }, g.mistakes === 0 && g.hints === 0 ? 'Flawless!' : 'Solved!');
    show(h('div.results', {},
      isBest ? h('span.pill.pill-amber', {}, icon('emoji_events'), prevBest === null ? `First ${levelLabel(g)} time!` : 'New best time!')
        : h('span.pill', {}, icon('emoji_events'), `Best ${levelLabel(g)} time: ${formatDuration(prevBest)}`),
      heading,
      lv ? h('div.level-result', {}, starRow(lv.stars, 'big'),
        h('p', {}, `Level ${g.level} solved${lv.unlockedNext ? `. Level ${next} unlocked!` : g.level === MAX_LEVEL ? '. You beat the last level!' : '.'}`)) : null,
      h('div.big-score', {}, formatDuration(ms), h('small', {}, `${levelLabel(g)} · ${modeLabel(g, g.day)}`)),
      statGrid([
        ['cancel', String(g.mistakes), 'Mistakes'],
        ['lightbulb', String(g.hints), 'Hints'],
        ['task_alt', String(solved), 'Puzzles solved'],
      ]),
      h('div.btn-row', {},
        next ? h('button.btn.btn-primary.next-level', { type: 'button', onclick: () => { level = next; newGame('level'); } }, icon('skip_next'), h('span', {}, `Next: Level ${next}`)) : null,
        h(`button.btn.${next ? 'btn-secondary' : 'btn-primary'}`, { type: 'button', onclick: () => setupView() }, icon('trending_up'), h('span', {}, 'All levels')),
        h('a.btn.btn-ghost', { href: '/play/' }, icon('arrow_back'), h('span', {}, 'All games'))),
      appCta(`results_${meta.slug}`),
      h('p.results-note', {}, 'Times and progress are saved in this browser only. Sudoku Daily is a website game and isn’t in the Android app.')));
    heading.focus({ preventScroll: true });
    announce(`Solved in ${formatDuration(ms)} with ${g.mistakes} mistakes and ${g.hints} hints.`);
  }

  setupView();
}

export default { mount };
