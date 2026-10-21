/**
 * Word Detective (website only). Daily word (same for everyone on a date, saved guess by guess so a
 * reload can't reset it) or unlimited practice. Stats and streak count each daily puzzle once.
 */
import { h, icon, clear, untilMidnight, prefersReducedMotion } from '../lib/dom.js';
import * as D from '../engine/detective.js';
import { todayEpochDay } from '../engine/quiz.js';
import * as store from '../lib/store.js';
import { SITE_URL } from '../lib/site.js';
import { statGrid, appCta, confetti, liveRegion, ownsKeys, ticker } from './kit.js';

const KEY = 'detective';
const DAYS_KEPT = 14;
const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', '>ZXCVBNM<'];
const MARK = { correct: 'right place', present: 'in the word, wrong place', absent: 'not in the word' };
const WIN_WORDS = ['Genius!', 'Brilliant!', 'Superb!', 'Great job!', 'Nice work!', 'Phew!'];

function load() {
  const data = store.webData(KEY);
  const days = data.days && typeof data.days === 'object' && !Array.isArray(data.days) ? data.days : {};
  return { days, stats: D.normalizeStats(data.stats) };
}

/** A saved day is a list of valid guesses; anything else is dropped. */
function savedGuesses(days, day) {
  const g = days[day] && days[day].guesses;
  if (!Array.isArray(g)) return [];
  return g.filter((w) => typeof w === 'string' && /^[A-Z]{5}$/.test(w)).slice(0, D.MAX_GUESSES);
}

function mount(stage, meta) {
  const { el: live, announce } = liveRegion();
  const view = h('div.stage-inner');
  clear(stage).append(view, live);

  let mode = 'daily';
  let day = todayEpochDay();
  let answer = '';
  let guesses = [];
  let typing = '';
  let state = 'playing'; // playing | won | lost
  let busy = false; // revealing a row

  const tabs = h('div.wd-tabs', { role: 'group', 'aria-label': 'Puzzle' });
  const msg = h('div.wd-msg', { 'aria-live': 'polite' });
  const grid = h('div.wd-grid', { role: 'group', 'aria-label': 'Guesses' });
  const keys = h('div.wd-keys', { role: 'group', 'aria-label': 'Keyboard' });
  const panel = h('div.wd-panel');
  view.append(tabs, grid, msg, keys, panel);

  const rowEls = Array.from({ length: D.MAX_GUESSES }, () => {
    const cells = Array.from({ length: D.WORD_LENGTH }, () => h('div.wd-tile', {}, h('span', {})));
    const row = h('div.wd-row', { role: 'img' }, cells);
    grid.append(row);
    return { row, cells };
  });

  const keyEls = new Map();
  for (const line of ROWS) {
    keys.append(h('div.wd-keyrow', {}, line.split('').map((k) => {
      const enter = k === '>';
      const back = k === '<';
      const el = h(`button.wd-key${enter || back ? '.wide' : ''}`, {
        type: 'button',
        'aria-label': enter ? 'Enter guess' : back ? 'Delete letter' : k,
        onclick: () => press(enter ? 'Enter' : back ? 'Backspace' : k),
        // A mouse click shouldn't leave focus on the key, or the next physical Enter would type it again.
        onmousedown: (e) => e.preventDefault(),
      }, enter ? 'Enter' : back ? icon('backspace') : k);
      if (!enter && !back) keyEls.set(k, el);
      return el;
    })));
  }

  function renderTabs() {
    const n = D.puzzleNumber(todayEpochDay());
    const tab = (id, label, ic) => h('button.wd-tab', { type: 'button', 'aria-pressed': String(mode === id), onclick: () => { if (mode !== id) setMode(id); } }, icon(ic), h('span', {}, label));
    clear(tabs).append(tab('daily', `Daily #${n}`, 'calendar_month'), tab('practice', 'Practice', 'refresh'));
  }

  function setMode(next) {
    mode = next;
    typing = '';
    clear(msg);
    if (mode === 'daily') {
      day = todayEpochDay();
      answer = D.dailyAnswer(day);
      guesses = savedGuesses(load().days, day);
    } else {
      answer = D.practiceAnswer(Math.random, D.dailyAnswer(todayEpochDay()));
      guesses = [];
    }
    state = guesses.includes(answer) ? 'won' : guesses.length >= D.MAX_GUESSES ? 'lost' : 'playing';
    renderTabs();
    render();
    if (state === 'playing') {
      clear(panel).append(h('p.wd-help', {}, mode === 'daily'
        ? 'Type or tap letters, then press Enter. Today’s word is the same for everyone and changes at midnight.'
        : 'Practice words don’t affect your daily stats or streak. Play as many as you like.'));
      announce(mode === 'daily' ? `Daily word ${D.puzzleNumber(day)}. ${D.MAX_GUESSES - guesses.length} guesses left.` : 'Practice word. Six guesses.');
    } else {
      showResult(false);
    }
  }

  function render() {
    const states = D.letterStates(answer, guesses);
    rowEls.forEach(({ row, cells }, r) => {
      const word = r < guesses.length ? guesses[r] : r === guesses.length ? typing : '';
      const marks = r < guesses.length ? D.score(answer, guesses[r]) : null;
      cells.forEach((cell, i) => {
        const ch = word[i] || '';
        cell.firstChild.textContent = ch;
        cell.className = `wd-tile${ch ? ' filled' : ''}${marks ? ` ${marks[i]}` : ''}`;
      });
      row.classList.toggle('current', r === guesses.length && state === 'playing');
      row.setAttribute('aria-label', marks
        ? `Guess ${r + 1}: ${word.split('').map((c, i) => `${c} ${MARK[marks[i]]}`).join(', ')}`
        : r === guesses.length && typing ? `Guess ${r + 1}, typing: ${typing.split('').join(' ')}` : `Guess ${r + 1}, empty`);
    });
    for (const [k, el] of keyEls) {
      el.className = `wd-key${states[k] ? ` ${states[k]}` : ''}`;
      el.setAttribute('aria-label', states[k] ? `${k}, ${MARK[states[k]]}` : k);
    }
    keys.classList.toggle('done', state !== 'playing');
  }

  function say(text, tone = 'info', ms = 1800) {
    clear(msg).append(h(`div.feedback-msg.${tone}`, {}, icon(tone === 'bad' ? 'cancel' : tone === 'good' ? 'check_circle' : 'lightbulb'), h('span', {}, text)));
    announce(text);
    if (ms) setTimeout(() => { if (msg.textContent.includes(text)) clear(msg); }, ms);
  }

  function shake() {
    const row = rowEls[guesses.length].row;
    row.classList.remove('shake');
    void row.offsetWidth;
    row.classList.add('shake');
  }

  function press(k) {
    if (state !== 'playing' || busy) return;
    if (k === 'Enter') return submit();
    if (k === 'Backspace') { typing = typing.slice(0, -1); render(); return; }
    if (/^[A-Z]$/.test(k) && typing.length < D.WORD_LENGTH) { typing += k; render(); }
  }

  function submit() {
    if (typing.length < D.WORD_LENGTH) { say('Not enough letters'); shake(); return; }
    if (!D.isValidGuess(typing)) { say(`${typing} isn’t in the word list`); shake(); return; }
    const word = typing;
    guesses.push(word);
    typing = '';
    const won = word === answer;
    const lost = !won && guesses.length >= D.MAX_GUESSES;
    if (mode === 'daily') persistDay(won, lost);
    busy = true;
    render();
    const row = rowEls[guesses.length - 1];
    const marks = D.score(answer, word);
    announce(row.row.getAttribute('aria-label'));
    if (!prefersReducedMotion()) row.cells.forEach((c, i) => { c.style.animationDelay = `${i * 90}ms`; c.classList.add('flip'); });
    setTimeout(() => {
      row.cells.forEach((c) => { c.classList.remove('flip'); c.style.animationDelay = ''; });
      busy = false;
      if (won || lost) {
        state = won ? 'won' : 'lost';
        render();
        showResult(true);
      } else if (marks.every((m) => m === 'absent')) {
        say('No matching letters. Try different ones.', 'info', 2200);
      }
    }, prefersReducedMotion() ? 0 : 90 * D.WORD_LENGTH + 350);
  }

  /** Saves today's guesses and, the first time the day is finished, the stats. */
  function persistDay(won, lost) {
    const { days, stats } = load();
    const prev = days[day] || {};
    const already = prev.done === 'won' || prev.done === 'lost';
    days[day] = { guesses: guesses.slice(), done: won ? 'won' : lost ? 'lost' : null };
    for (const d of Object.keys(days)) if (Number(d) < day - DAYS_KEPT) delete days[d];
    const next = (won || lost) && !already ? D.recordDaily(stats, day, won, guesses.length) : stats;
    store.saveWebData(KEY, { days, stats: next });
  }

  function showResult(justFinished) {
    const won = state === 'won';
    const { stats } = load();
    const today = todayEpochDay();
    const heading = h('h2', { tabindex: '-1' }, won ? WIN_WORDS[guesses.length - 1] : 'So close!');
    const parts = [
      mode === 'daily' ? h('span.pill.pill-success', {}, icon('check_circle'), `Daily #${D.puzzleNumber(day)} complete`) : h('span.pill', {}, icon('refresh'), 'Practice word'),
      heading,
      h('p.wd-answer', {}, won ? `You found ${answer} in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}.` : 'The word was ', won ? null : h('strong', {}, answer)),
    ];
    if (mode === 'daily') {
      const winPct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
      parts.push(statGrid([
        ['task_alt', String(stats.played), 'Played'],
        ['center_focus_strong', `${winPct}%`, 'Win rate'],
        ['local_fire_department', String(D.currentStreak(stats, today)), 'Streak'],
        ['emoji_events', String(stats.maxStreak), 'Best streak'],
      ]), distribution(stats, won ? guesses.length : 0));
      const countdown = h('span.countdown', {}, untilMidnight());
      ticker(countdown, () => {
        if (todayEpochDay() !== day) { setMode('daily'); return; }
        countdown.textContent = untilMidnight();
      });
      parts.push(h('p.muted', { style: { margin: 0 } }, 'Next word in ', countdown));
    }
    const shareNote = h('div.wd-share-note', { 'aria-live': 'polite' });
    parts.push(
      h('div.btn-row', {},
        mode === 'daily' ? h('button.btn.btn-primary', { type: 'button', onclick: () => share(shareNote) }, icon('share'), h('span', {}, 'Share result')) : null,
        h(`button.btn.${mode === 'daily' ? 'btn-secondary' : 'btn-primary'}`, { type: 'button', onclick: () => { setMode('practice'); focusBoard(); } }, icon('refresh'), h('span', {}, mode === 'daily' ? 'Practice a word' : 'New practice word')),
        h('a.btn.btn-ghost', { href: '/play/' }, icon('arrow_back'), h('span', {}, 'All games'))),
      shareNote,
      appCta(`results_${meta.slug}`),
      h('p.results-note', {}, 'Stats and streaks are saved in this browser only and don’t sync with the Android app or other devices.'),
    );
    clear(panel).append(h('div.results', {}, parts));
    if (justFinished) {
      if (won) confetti(stage);
      heading.focus({ preventScroll: true });
      panel.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      announce(won ? `Solved in ${guesses.length}.` : `Out of guesses. The word was ${answer}.`);
    }
  }

  function distribution(stats, highlight) {
    const max = Math.max(1, ...stats.dist);
    return h('div.wd-dist', { role: 'img', 'aria-label': `Wins by number of guesses: ${stats.dist.map((n, i) => `${i + 1}: ${n}`).join(', ')}` },
      h('span.wd-dist-title', {}, 'Wins by guesses'),
      stats.dist.map((n, i) => h('div.wd-bar', {},
        h('span', {}, String(i + 1)),
        h(`i${highlight === i + 1 ? '.hl' : ''}`, { style: { width: `${Math.max(8, (n / max) * 100)}%` } }, String(n)))));
  }

  async function share(note) {
    const text = D.shareText(day, answer, guesses, state === 'won', `${SITE_URL}/play/${meta.slug}/`);
    const done = (t) => { clear(note).append(h('p', {}, t)); };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ text }))) {
        await navigator.share({ text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return; // closed the share sheet
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        done('Copied! Paste it anywhere to share. It shows your squares, not the word.');
        return;
      }
    } catch (e) { /* fall through to manual copy */ }
    clear(note).append(
      h('p', {}, 'Sharing isn’t available in this browser. Copy the text below instead:'),
      h('textarea.wd-share-text', { readonly: true, rows: String(guesses.length + 2), 'aria-label': 'Result to copy', onfocus: (e) => e.target.select() }, text));
  }

  function focusBoard() {
    grid.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  const onKey = (e) => {
    if (!grid.isConnected) { document.removeEventListener('keydown', onKey); return; }
    if (!ownsKeys(stage, e) || state !== 'playing') return;
    // Let Enter and Space activate a focused button (tabs, on-screen keys) normally.
    const onButton = document.activeElement && document.activeElement.tagName === 'BUTTON';
    if (e.key === 'Enter' && !onButton) { e.preventDefault(); press('Enter'); } else if (e.key === 'Backspace') { e.preventDefault(); press('Backspace'); } else if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); press(e.key.toUpperCase()); }
  };
  document.addEventListener('keydown', onKey);

  setMode('daily');
}

export default { mount };
