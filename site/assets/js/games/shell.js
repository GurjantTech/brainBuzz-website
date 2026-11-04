/**
 * The frame every game runs in, mirroring the app's GameViewModel / GameScaffold:
 * level journey (1–100) → 3-2-1 countdown → play (header bar, status panel, hints, pause, optional round clock,
 * a celebration on each right answer) → results with stars. `ctx.difficulty` is a level from engine/levels.js.
 * (The Daily Challenge is today's Word Detective word; it doesn't use this shell.)
 *
 * A game module exports { roundTimeMs?(difficulty), create(ctx) }. create() returns a game with
 * start(), hintAvailable(), applyHint() and optionally onTick(ms), onTimeUp(), clockRunning(), onKey(e).
 */
import { h, icon, clear, formatNumber, formatDuration, prefersReducedMotion } from '../lib/dom.js';
import { statGrid, appCta, confetti as confettiIn, WEB_LEVEL_LIMIT, appOnlyLevelDialog, gameBar, barButton, celebrate } from './kit.js';
import { levelHeader, levelPicker, levelDetail, startButton, levelNote, starRow } from './levels-ui.js';
import { KRandom } from '../lib/random.js';
import { accuracyOf, resultTitle } from '../engine/models.js';
import { MAX_LEVEL, levelOf, levelKey, parseLevelKey, starsFor, passAccuracy, MATH_PASS_CORRECT } from '../engine/levels.js';
import { todayEpochDay } from '../engine/quiz.js';
import * as store from '../lib/store.js';
import { logAnalyticsEvent } from '../lib/analytics.js';

const NOTHING_TO_HINT = 'Nothing to hint right now.';

export function mountShell(stage, meta, impl) {
  const progress = () => store.levelProgress(meta.type, MAX_LEVEL);
  let difficulty = levelOf(Math.min(parseLevelKey(store.lastDifficulty(meta.type)) || progress().unlocked, progress().unlocked));
  let session = null;
  let rafId = 0;

  const live = h('p.visually-hidden', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const view = h('div.stage-inner');
  clear(stage).append(view, live);

  const announce = (text) => {
    live.textContent = '';
    // A fresh text node makes screen readers re-read repeated messages.
    setTimeout(() => { live.textContent = text; }, 30);
  };

  function show(...nodes) {
    clear(view).append(...nodes);
  }

  function focusStage() {
    stage.focus({ preventScroll: true });
    const top = stage.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.4) stage.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  // ---------- Setup ----------

  function setupView() {
    endSession();
    const { unlocked, stars } = progress();
    if (difficulty.level > unlocked) difficulty = levelOf(unlocked);
    const detail = h('div');
    const start = startButton('', () => startGame());
    const renderDetail = () => {
      const level = difficulty.level;
      const best = store.bestScore(meta.type, levelKey(level));
      const earned = stars[level] || 0;
      clear(detail).append(levelDetail({
        level, stars: earned, rules: meta.rules(difficulty),
        best: best === null ? null : `${formatNumber(best)} points`,
        bestSub: earned >= 3 ? 'Three stars! Beat your best.' : 'Replay for more stars',
      }));
      start.querySelector('.lv-start-btn span').textContent = `${earned ? 'Replay' : 'Start'} Level ${level}`;
    };
    const picker = levelPicker({
      unlocked, stars, selected: difficulty.level,
      onChange: (level) => { difficulty = levelOf(level); renderDetail(); },
      // The current level (marked PLAY) starts straight away; other levels show their details first.
      onPlay: (level) => { difficulty = levelOf(level); startGame(); },
    });
    renderDetail();
    show(h('div.lv-setup', {},
      levelHeader({ unlocked, stars, type: meta.type, title: meta.title }),
      picker,
      detail,
      start,
      levelNote('Levels start easy and get harder. Pass a level to unlock the next one. Progress and best scores are saved in this browser only.')));
  }

  // ---------- Session ----------

  function endSession() {
    if (session) session.alive = false;
    session = null;
    cancelAnimationFrame(rafId);
  }

  function startGame() {
    endSession();
    // Levels above the website limit are app-only: back to the level list with the app dialog on top.
    if (difficulty.level > WEB_LEVEL_LIMIT) {
      setupView();
      appOnlyLevelDialog(stage, difficulty.level, `${meta.type.toLowerCase()}_level_limit`);
      return;
    }
    store.rememberDifficulty(meta.type, levelKey(difficulty.level));
    logAnalyticsEvent('web_game_start', { game: meta.type.toLowerCase(), level: difficulty.level });
    const s = {
      alive: true,
      phase: 'countdown',
      paused: false,
      finishing: false,
      activePlayMs: 0,
      hintsLeft: meta.hints,
      hintsUsed: 0,
      roundLimit: impl.roundTimeMs ? impl.roundTimeMs(difficulty) : null,
      roundLeft: null,
      waiters: [],
      epochDay: todayEpochDay(),
      last: performance.now(),
    };
    s.roundLeft = s.roundLimit;
    session = s;
    buildPlayView(s);
    focusStage();
    loop(s);
    runCountdown(s);
  }

  /** Pause-aware delay: time only passes while the game isn't paused. Never resolves once the session ends. */
  function wait(s, ms) {
    return new Promise((resolve) => { s.waiters.push({ left: ms, resolve }); });
  }

  function loop(s) {
    const frame = (now) => {
      if (!s.alive) return;
      const dt = Math.min(now - s.last, 100);
      s.last = now;
      if (!s.paused) {
        for (const w of s.waiters.slice()) {
          w.left -= dt;
          if (w.left <= 0) {
            s.waiters.splice(s.waiters.indexOf(w), 1);
            w.resolve();
          }
        }
        if (s.phase === 'playing' && !s.finishing && s.game && (!s.game.clockRunning || s.game.clockRunning())) {
          s.activePlayMs += dt;
          if (s.roundLeft !== null) {
            s.roundLeft = Math.max(0, s.roundLeft - dt);
            s.ui.timer(s.roundLeft / s.roundLimit, s.roundLeft);
          }
          if (s.game.onTick) s.game.onTick(dt);
          if (s.roundLeft === 0 && !s.finishing && s.alive) {
            s.roundLeft = -1; // fire once
            if (s.game.onTimeUp) s.game.onTimeUp();
          }
        }
      }
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
  }

  async function runCountdown(s) {
    const num = h('div.count-num', {}, '3');
    const box = h('div.countdown-view', {}, h('div', {}, h('p.count-label', {}, 'Get ready'), num));
    s.ui.board.hidden = true;
    s.ui.chrome.hidden = true;
    s.ui.chrome.before(box);
    for (let i = 3; i >= 1; i--) {
      num.textContent = String(i);
      num.style.animation = 'none';
      void num.offsetWidth; // restart the pop animation
      num.style.animation = '';
      announce(String(i));
      await wait(s, 700);
    }
    num.textContent = 'Go!';
    await wait(s, 400);
    if (!s.alive) return;
    box.remove();
    s.ui.board.hidden = false;
    s.ui.chrome.hidden = false;
    s.phase = 'playing';
    s.game.start();
    s.ui.refreshHint();
  }

  function buildPlayView(s) {
    const scoreEl = h('strong', {}, '0');
    const scoreLabel = h('small', {}, 'POINTS');
    const progress = h('span.pill', { hidden: true });
    const extra = h('span.pill', { hidden: true });
    const lives = h('span.hud-lives', { hidden: true });
    const timeChip = h('span.pill.hud-time', { hidden: true }, icon('timer'), h('span', {}, ''));
    const hintCount = h('span.count', {}, String(s.hintsLeft));
    // Pause and hint sit in the game's header bar, as frosted buttons (the app's GameTopBar).
    const hintBtn = h('button.gb-btn.hint', {
      type: 'button',
      title: impl.hintDescription || 'Use a hint',
      onclick: () => useHint(s),
    }, icon('lightbulb'), hintCount);
    const pauseBtn = barButton('pause', 'Pause', () => pause(s), { title: 'Pause (Esc)' });
    const bar = gameBar({ type: meta.type, title: meta.title, subtitle: difficulty.label, leading: pauseBtn, actions: meta.hints > 0 ? [hintBtn] : [] });
    const timerFill = h('span');
    const timerbar = h('div.timerbar', { hidden: true, role: 'presentation' }, timerFill);
    const status = h('p.status-line', { 'aria-live': 'polite' });
    const board = h('div.board');
    const feedback = h('div.feedback', { 'aria-live': 'polite' });
    // The status (points, progress, lives, clock) sits together in a frosted panel above the board.
    const chrome = h('div', {},
      h('div.hud', {},
        h('div.hud-score', {}, scoreLabel, scoreEl),
        progress, lives, extra, timeChip,
        timerbar),
      status);
    const root = h('div.play-view', {}, bar, chrome, board, feedback);
    show(root);

    let feedbackTimer = 0;
    s.ui = {
      root, board, chrome,
      score(n) { scoreEl.textContent = formatNumber(n); },
      scoreLabel(text) { scoreLabel.textContent = text; },
      progress(text) { progress.hidden = !text; progress.textContent = text || ''; },
      extra(text, iconName, cls = '') {
        extra.hidden = !text;
        clear(extra);
        extra.className = `pill ${cls}`;
        if (text) extra.append(...(iconName ? [icon(iconName)] : []), text);
      },
      lives(n, max) {
        lives.hidden = false;
        clear(lives).append(...Array.from({ length: max }, (_, i) => icon(i < n ? 'favorite' : 'favorite_border', i < n ? '' : 'lost')));
        lives.setAttribute('aria-label', `${n} of ${max} lives left`);
        lives.setAttribute('role', 'img');
      },
      timer(fraction, msLeft) {
        timerbar.hidden = false;
        timerFill.style.transform = `scaleX(${Math.max(0, Math.min(1, fraction))})`;
        timerbar.classList.toggle('low', fraction < 0.25);
        if (msLeft !== undefined) {
          timeChip.hidden = false;
          timeChip.lastChild.textContent = formatDuration(Math.ceil(msLeft / 1000) * 1000);
        }
      },
      elapsed(ms) {
        timeChip.hidden = false;
        timeChip.lastChild.textContent = formatDuration(ms);
      },
      status(text, tone) {
        status.textContent = text || '';
        status.style.color = tone === 'good' ? 'var(--success-ink)' : tone === 'bad' ? 'var(--error-ink)' : '';
      },
      feedback(text, tone = 'info', ms = 0) {
        clearTimeout(feedbackTimer);
        clear(feedback);
        if (!text) return;
        const ic = tone === 'good' ? 'check_circle' : tone === 'bad' ? 'cancel' : 'lightbulb';
        feedback.append(h(`div.feedback-msg.${tone}`, {}, icon(ic), h('span', {}, text)));
        if (ms) feedbackTimer = setTimeout(() => clear(feedback), ms);
      },
      /** The right-answer celebration over the board ("+120", "Match!", "Cleared!"…). */
      celebrate(text, y) { celebrate(board, text, { y }); },
      refreshHint() {
        hintCount.textContent = String(s.hintsLeft);
        hintBtn.disabled = s.hintsLeft <= 0;
        hintBtn.setAttribute('aria-label', s.hintsLeft > 0 ? `Hint, ${s.hintsLeft} left` : 'No hints left');
      },
    };
    if (s.roundLimit) s.ui.timer(1, s.roundLimit);

    const ctx = {
      difficulty,
      random: KRandom.fresh(),
      epochDay: s.epochDay,
      board,
      ui: s.ui,
      announce,
      wait: (ms) => wait(s, ms),
      get alive() { return s.alive; },
      get canPlay() { return s.alive && s.phase === 'playing' && !s.paused && !s.finishing; },
      get activePlayMs() { return s.activePlayMs; },
      get hintsUsed() { return s.hintsUsed; },
      finish: (outcome) => finish(s, outcome),
    };
    s.game = impl.create(ctx);
    s.ui.refreshHint();
  }

  function useHint(s) {
    if (!(s.alive && s.phase === 'playing' && !s.paused && !s.finishing) || s.hintsLeft <= 0) return;
    if (!s.game.hintAvailable() || !s.game.applyHint()) {
      s.ui.feedback(NOTHING_TO_HINT, 'info', 1800);
      return;
    }
    s.hintsLeft--;
    s.hintsUsed++;
    s.ui.refreshHint();
    announce(`Hint used. ${s.hintsLeft} left.`);
  }

  // ---------- Pause ----------

  function pause(s) {
    if (!s.alive || s.paused || s.finishing || !(s.phase === 'countdown' || s.phase === 'playing')) return;
    s.paused = true;
    const resumeBtn = h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: () => resume(s) }, icon('play_arrow'), h('span', {}, 'Resume'));
    const overlay = h('div.overlay', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pause-title' },
      h('div.overlay-card', {},
        h('h2', { id: 'pause-title' }, 'Paused'),
        h('p.muted', { style: { margin: 0 } }, `${meta.title} · ${difficulty.label}`),
        h('ul', {}, meta.howToPlay.map((t) => h('li', {}, t))),
        resumeBtn,
        h('button.btn.btn-secondary', { type: 'button', onclick: () => { overlay.remove(); startGame(); } }, icon('refresh'), h('span', {}, 'Restart')),
        h('a.btn.btn-ghost', { href: '/play/' }, icon('arrow_back'), h('span', {}, 'Exit to games'))));
    s.overlay = overlay;
    stage.append(overlay);
    resumeBtn.focus();
    announce('Paused');
  }

  function resume(s) {
    if (!s.paused) return;
    s.paused = false;
    s.last = performance.now();
    if (s.overlay) s.overlay.remove();
    s.overlay = null;
    stage.focus({ preventScroll: true });
    announce('Resumed');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && session) pause(session);
  });

  document.addEventListener('keydown', (e) => {
    const s = session;
    if (!s || !s.alive || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      if (s.paused) resume(s); else pause(s);
      e.preventDefault();
      return;
    }
    if (s.paused || s.phase !== 'playing' || s.finishing) return;
    if (s.game.onKey && s.game.onKey(e)) e.preventDefault();
  });

  // ---------- Results ----------

  function finish(s, outcome) {
    if (!s.alive || s.finishing) return;
    s.finishing = true;
    s.phase = 'finished';
    s.waiters.length = 0;
    const full = { hintsUsed: s.hintsUsed, moves: 0, bestCombo: 0, answerPattern: '', ...outcome };
    const record = store.recordScore(meta.type, levelKey(difficulty.level), full.score);
    const stars = starsFor(meta.type, accuracyOf(meta.type, full.correct, full.total, full.moves), full);
    record.level = store.recordLevel(meta.type, difficulty.level, stars, MAX_LEVEL);
    logAnalyticsEvent('web_game_complete', { game: meta.type.toLowerCase(), level: difficulty.level, score: full.score, stars });
    const delay = s.game.finishDelay ?? 400;
    setTimeout(() => {
      if (!s.alive) return;
      endSession();
      resultsView(full, record);
    }, delay);
  }

  function resultsView(o, record) {
    const accuracy = accuracyOf(meta.type, o.correct, o.total, o.moves);
    const pct = `${Math.round(accuracy * 100)}%`;
    const time = formatDuration(o.durationMs);
    const stats = {
      MATRIX: [['check_circle', `${o.correct}/${o.total}`, 'Rounds cleared'], ['apps', `${o.bestCombo}`, 'Longest pattern'], ['center_focus_strong', pct, 'Accuracy'], ['timer', time, 'Time']],
      MEMORY: [['style', `${o.total}`, 'Pairs found'], ['refresh', `${o.moves}`, 'Moves'], ['center_focus_strong', pct, 'Accuracy'], ['timer', time, 'Time']],
      LOGIC_PATH: [['check_circle', `${o.correct}/${o.total}`, 'Boards solved'], ['refresh', `${o.moves}`, 'Taps'], ['lightbulb', `${o.hintsUsed}`, 'Hints'], ['timer', time, 'Time']],
      WORD_SCRAMBLE: [['check_circle', `${o.correct}/${o.total}`, 'Words solved'], ['cancel', `${o.moves}`, 'Wrong tries'], ['lightbulb', `${o.hintsUsed}`, 'Hints'], ['timer', time, 'Time']],
    }[meta.type] || [
      ['check_circle', `${o.correct}/${o.total}`, 'Correct'],
      ['center_focus_strong', pct, 'Accuracy'],
      ['bolt', `×${o.bestCombo}`, 'Best combo'],
      ['timer', time, 'Time'],
    ];
    const lv = record.level;
    const passed = lv && lv.stars > 0;
    const celebrate = record.isBest || accuracy >= 1 || passed;
    const bestLine = record.isBest
      ? h('span.pill.pill-amber', {}, icon('emoji_events'), record.previous === null ? `First points on ${difficulty.label}!` : 'New personal best!')
      : h('span.pill', {}, icon('emoji_events'), `Your best on ${difficulty.label}: ${formatNumber(record.previous)} points`);

    const playLevel = (level) => { difficulty = levelOf(level); startGame(); };
    const hasNext = passed && difficulty.level < MAX_LEVEL;
    const actions = [
        hasNext ? h('button.btn.btn-primary.next-level', { type: 'button', onclick: () => playLevel(difficulty.level + 1) },
          icon('skip_next'), h('span', {}, `Next: Level ${difficulty.level + 1}`)) : null,
        h(`button.btn.${hasNext ? 'btn-secondary' : 'btn-primary'}`, { type: 'button', onclick: () => startGame() },
          icon('refresh'), h('span', {}, passed ? 'Replay level' : 'Try again')),
        h('button.btn.btn-secondary', { type: 'button', onclick: () => { setupView(); focusStage(); } }, icon('trending_up'), h('span', {}, 'All levels')),
        h('a.btn.btn-ghost', { href: '/play/' }, icon('arrow_back'), h('span', {}, 'All games')),
      ];
    const levelLine = lv && h('div.level-result', {},
      starRow(lv.stars, 'big'),
      h('p', {}, passed
        ? `${difficulty.label} passed${lv.unlockedNext ? `. Level ${difficulty.level + 1} unlocked!` : difficulty.level === MAX_LEVEL ? '. You beat the last level!' : '.'}`
        : `Not passed yet. ${meta.type === 'MATH' ? `You need ${MATH_PASS_CORRECT}+ right answers and` : 'You need'} ${Math.round(passAccuracy(meta.type) * 100)}% accuracy.`));

    const heading = h('h2', { tabindex: '-1' }, resultTitle(accuracy));
    show(h('div.results', {},
      bestLine,
      heading,
      levelLine,
      h('div.big-score', {}, formatNumber(o.score), h('small', {}, `points · ${difficulty.label}`)),
      statGrid(stats),
      o.answerPattern ? h('div', { style: { display: 'grid', gap: '8px', justifyItems: 'center' } },
        h('span', { class: 'muted', style: { fontSize: '.85rem', fontWeight: 700 } }, 'Your answers'), patternDots(o.answerPattern)) : null,
      h('div.btn-row', {}, actions),
      appCta(`results_${meta.slug}`),
      h('p.results-note', {}, 'Saved in this browser only. Website scores don’t sync with the Android app.'),
    ));
    if (celebrate) confetti();
    heading.focus({ preventScroll: true });
    announce(`${resultTitle(accuracy)} ${formatNumber(o.score)} points.`);
  }

  function patternDots(pattern) {
    const dots = pattern.split('').map((c, i) => h(`i.${c === '1' ? 'y' : 'n'}`, { title: `${i + 1}: ${c === '1' ? 'correct' : 'missed'}` }, c === '1' ? '✓' : '✕'));
    const right = pattern.split('').filter((c) => c === '1').length;
    return h('div.pattern', { role: 'img', 'aria-label': `${right} of ${pattern.length} correct` }, dots);
  }

  const confetti = () => confettiIn(stage);

  setupView();
}
