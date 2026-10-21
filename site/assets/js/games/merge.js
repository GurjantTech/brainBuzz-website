/** 2048 Merge Challenge (website only). Swipe or use the arrow keys; the board is saved after every move. */
import { h, icon, clear, formatNumber } from '../lib/dom.js';
import * as M from '../engine/merge.js';
import * as store from '../lib/store.js';
import { statGrid, appCta, confetti, liveRegion, ownsKeys } from './kit.js';

const KEY = 'merge';
const BEST = ['MERGE', 'CLASSIC']; // bests[type][level], so game cards show it like other games
const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
const SWIPE_PX = 24;
const random = () => Math.random();

function mount(stage, meta) {
  const { el: live, announce } = liveRegion();
  const view = h('div.stage-inner');
  clear(stage).append(view, live);

  let game = null;
  let won = false; // reached 2048 at some point
  let keepPlaying = false; // chose to continue after 2048
  let moves = 0;
  let over = false;
  let best = store.bestScore(...BEST) || 0;
  const els = new Map(); // tile id → element

  const scoreEl = h('strong', {}, '0');
  const bestEl = h('span.pill', {}, icon('emoji_events'), h('span', {}, ''));
  const tilesEl = h('div.m2-tiles', { 'aria-hidden': 'true' });
  const boardEl = h('div.m2-board', {
    tabindex: '0',
    role: 'application',
    'aria-roledescription': '2048 board',
    'aria-label': '2048 board. Use the arrow keys to slide the tiles.',
  }, ...Array.from({ length: 16 }, () => h('div.m2-cell')), tilesEl);
  const status = h('p.m2-status', { 'aria-live': 'off' });

  view.append(
    h('div.hud', {},
      h('div.hud-score', {}, h('small', {}, 'SCORE'), scoreEl),
      bestEl,
      h('div.hud-actions', {},
        h('button.btn.btn-secondary.btn-sm', { type: 'button', onclick: () => askNewGame() }, icon('refresh'), h('span', {}, 'New game')))),
    boardEl,
    status,
    h('p.m2-help', {}, 'Swipe on the board, or use the arrow keys (or W A S D). Equal tiles merge when they slide into each other.'),
  );

  function save() {
    const data = store.webData(KEY);
    data.current = over ? null : { grid: M.toGrid(game.tiles), score: game.score, won, keepPlaying, moves };
    store.saveWebData(KEY, data);
  }

  function updateBest() {
    if (game.score > best) {
      best = game.score;
      store.recordScore(...BEST, best);
    }
    bestEl.lastChild.textContent = `Best ${formatNumber(best)}`;
    bestEl.setAttribute('aria-label', `Best score ${formatNumber(best)}`);
  }

  function renderTiles({ merged = [], spawned = null, consumed = [] } = {}) {
    const current = new Set(game.tiles.map((t) => t.id));
    // Tiles that merged slide to their partner, then disappear under the new tile.
    for (const g of consumed) {
      const el = els.get(g.id);
      if (!el) continue;
      place(el, g.r, g.c);
      el.classList.add('gone');
      els.delete(g.id);
      setTimeout(() => el.remove(), 130);
    }
    for (const [id, el] of els) if (!current.has(id)) { el.remove(); els.delete(id); }
    for (const t of game.tiles) {
      let el = els.get(t.id);
      if (!el) {
        el = h('div.m2-tile', {}, h('span', {}, String(t.value)));
        if (merged.includes(t.id)) el.classList.add('merged');
        else if (spawned && spawned.id === t.id) el.classList.add('new');
        tilesEl.append(el);
        els.set(t.id, el);
      }
      el.dataset.v = t.value > 2048 ? 'max' : String(t.value);
      el.classList.toggle('long', t.value >= 1024);
      el.classList.toggle('xlong', t.value >= 16384);
      place(el, t.r, t.c);
    }
    scoreEl.textContent = formatNumber(game.score);
    updateBest();
  }

  function place(el, r, c) {
    el.style.setProperty('--row', r);
    el.style.setProperty('--col', c);
  }

  function start(fresh) {
    clear(tilesEl);
    els.clear();
    const saved = fresh ? null : store.webData(KEY).current;
    const restored = saved && M.fromGrid(saved.grid, saved.score);
    if (restored && M.canMove(restored.tiles)) {
      game = restored;
      won = saved.won === true || M.maxTile(game.tiles) >= M.WIN_VALUE;
      keepPlaying = saved.keepPlaying === true || won;
      moves = Number.isInteger(saved.moves) && saved.moves >= 0 ? saved.moves : 0;
      status.textContent = 'Welcome back! Your last board was saved.';
    } else {
      game = M.newGame(random);
      won = false;
      keepPlaying = false;
      moves = 0;
      status.textContent = '';
    }
    over = false;
    renderTiles();
    save();
    announce(`New board. ${describe()}`);
  }

  function describe() {
    return `Score ${formatNumber(game.score)}. Biggest tile ${M.maxTile(game.tiles)}.`;
  }

  function move(dir) {
    if (over || stage.querySelector('.overlay')) return;
    const res = M.play(game, dir, random);
    if (!res.moved) {
      status.textContent = `Nothing can move ${dir}.`;
      boardEl.classList.remove('bump');
      void boardEl.offsetWidth;
      boardEl.classList.add('bump');
      return;
    }
    moves++;
    status.textContent = res.gained ? `+${formatNumber(res.gained)}` : '';
    renderTiles(res);
    announce(`Moved ${dir}. ${describe()}`);
    if (!won && M.maxTile(game.tiles) >= M.WIN_VALUE) {
      won = true;
      save();
      setTimeout(winOverlay, 180);
      return;
    }
    if (!M.canMove(game.tiles)) {
      over = true;
      save();
      setTimeout(gameOver, 350);
      return;
    }
    save();
  }

  function overlay(title, body, buttons) {
    const card = h('div.overlay-card', {}, h('h2', { id: 'm2-dialog' }, title), ...body, ...buttons);
    const o = h('div.overlay', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'm2-dialog' }, card);
    stage.append(o);
    const first = card.querySelector('button');
    if (first) first.focus();
    return o;
  }

  function closeOverlay(o) {
    o.remove();
    boardEl.focus({ preventScroll: true });
  }

  function winOverlay() {
    confetti(stage);
    announce('You made 2048!');
    const o = overlay('You made 2048!', [
      h('p.muted', { style: { margin: 0 } }, `Score ${formatNumber(game.score)} in ${moves} moves. Keep going for a bigger tile, or start again.`),
    ], [
      h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: () => { keepPlaying = true; save(); closeOverlay(o); } }, icon('play_arrow'), h('span', {}, 'Keep going')),
      h('button.btn.btn-secondary', { type: 'button', onclick: () => { closeOverlay(o); start(true); } }, icon('refresh'), h('span', {}, 'New game')),
    ]);
  }

  function askNewGame() {
    if (stage.querySelector('.overlay')) return;
    if (over || moves === 0) { start(true); boardEl.focus({ preventScroll: true }); return; }
    const o = overlay('Start a new game?', [h('p.muted', { style: { margin: 0 } }, `Your current score of ${formatNumber(game.score)} will be lost. Your best score is kept.`)], [
      h('button.btn.btn-primary', { type: 'button', onclick: () => { closeOverlay(o); start(true); } }, icon('refresh'), h('span', {}, 'New game')),
      h('button.btn.btn-ghost', { type: 'button', onclick: () => closeOverlay(o) }, h('span', {}, 'Keep playing')),
    ]);
  }

  function gameOver() {
    const isBest = game.score > 0 && game.score >= best;
    if (isBest) confetti(stage);
    announce(`No moves left. Final score ${formatNumber(game.score)}.`);
    const heading = h('h2', { tabindex: '-1' }, won ? 'What a run!' : 'No moves left');
    clear(view).append(h('div.results', {},
      isBest ? h('span.pill.pill-amber', {}, icon('emoji_events'), 'New personal best!') : h('span.pill', {}, icon('emoji_events'), `Your best: ${formatNumber(best)}`),
      heading,
      h('div.big-score', {}, formatNumber(game.score), h('small', {}, 'points')),
      statGrid([
        ['grid_view', String(M.maxTile(game.tiles)), 'Biggest tile'],
        ['refresh', String(moves), 'Moves'],
        ['emoji_events', formatNumber(best), 'Best score'],
      ]),
      h('div.btn-row', {},
        h('button.btn.btn-primary', { type: 'button', onclick: () => { mountAgain(); } }, icon('refresh'), h('span', {}, 'Play again')),
        h('a.btn.btn-ghost', { href: '/play/' }, icon('arrow_back'), h('span', {}, 'All games'))),
      appCta(`results_${meta.slug}`),
      h('p.results-note', {}, 'Your best score is saved in this browser only. 2048 Merge Challenge is a website game and isn’t in the Android app.')));
    heading.focus({ preventScroll: true });
  }

  function mountAgain() {
    store.saveWebData(KEY, { ...store.webData(KEY), current: null });
    mount(stage, meta);
    stage.querySelector('.m2-board').focus({ preventScroll: true });
  }

  // Keyboard: arrows/WASD while the board is on screen and focus isn't elsewhere on the page.
  const onKey = (e) => {
    if (!boardEl.isConnected) { document.removeEventListener('keydown', onKey); return; }
    const dir = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!dir || !ownsKeys(stage, e)) return;
    e.preventDefault();
    move(dir);
  };
  document.addEventListener('keydown', onKey);

  // Swipe (touch, pen or mouse drag) on the board. touch-action: none stops the page scrolling meanwhile.
  let downAt = null;
  boardEl.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try { boardEl.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
  });
  boardEl.addEventListener('pointerup', (e) => {
    if (!downAt || downAt.id !== e.pointerId) return;
    const dx = e.clientX - downAt.x;
    const dy = e.clientY - downAt.y;
    downAt = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  boardEl.addEventListener('pointercancel', () => { downAt = null; });

  start(false);
}

export default { mount };
