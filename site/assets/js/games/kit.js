/**
 * Pieces shared by the timed-game shell and the website-only games: the game header bar, results stats,
 * confetti, the right-answer celebration and the live region.
 */
import { h, icon, prefersReducedMotion } from '../lib/dom.js';
import { gameIcon } from '../lib/art.js';

export function statGrid(items) {
  return h('div.stat-grid', {}, items.map(([ic, value, label]) => h('div.stat', {}, icon(ic), h('strong', {}, value), h('span', {}, label))));
}

export function confetti(stage) {
  if (prefersReducedMotion()) return;
  const colors = ['#6c4bf4', '#0fb5a6', '#ffb23f', '#ff6b6b', '#4ea8ff', '#22b573'];
  const layer = h('div.confetti', { 'aria-hidden': 'true' });
  for (let i = 0; i < 70; i++) {
    const piece = h('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--dx', `${(Math.random() - 0.5) * 200}px`);
    piece.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    piece.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    layer.append(piece);
  }
  stage.append(layer);
  setTimeout(() => layer.remove(), 3800);
}

/** A polite live region; a fresh text node makes screen readers re-read repeated messages. */
export function liveRegion() {
  const el = h('p.visually-hidden', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const announce = (text) => {
    el.textContent = '';
    setTimeout(() => { el.textContent = text; }, 30);
  };
  return { el, announce };
}

/**
 * Whether a key press belongs to this game: the page focus is on the game (or nowhere in particular)
 * and the board is on screen, so arrow keys still scroll the page while reading the rules below.
 */
export function ownsKeys(stage, e) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return false;
  const a = document.activeElement;
  if (a && a !== document.body && !stage.contains(a)) return false;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return false;
  if (stage.querySelector('.overlay')) return false;
  const r = stage.getBoundingClientRect();
  return r.bottom > 80 && r.top < innerHeight - 80;
}

/** "Next word in 4:05:12"-style refresh that stops once the element leaves the page. */
export function ticker(el, fn, ms = 1000) {
  fn();
  const t = setInterval(() => {
    if (!el.isConnected) { clearInterval(t); return; }
    fn();
  }, ms);
}

/** An inline SVG from markup we write ourselves (never user content). */
function artEl(markup) {
  const holder = document.createElement('span');
  holder.innerHTML = markup;
  return holder.firstChild;
}

/**
 * A game's header, like the app's GameHeaderBar: a bold gradient card in the game's colour (`--c` on the
 * stage) with the game's art, title and an optional subtitle, a frosted button on the left (pause or
 * back) and frosted action buttons on the right. Pass `leading` and `actions` as elements.
 */
export function gameBar({ type, title, subtitle = null, leading = null, actions = [], art = true }) {
  const sub = h('span.gb-sub', { hidden: !subtitle }, subtitle || '');
  const bar = h('div.game-bar', {},
    leading,
    // Left out when there are several actions, so the title keeps its room.
    art ? h('span.gb-art', { 'aria-hidden': 'true' }, artEl(gameIcon(type, 'gb-icon'))) : null,
    h('span.gb-text', {}, h('strong.gb-title', {}, title), sub),
    h('span.gb-actions', {}, actions));
  bar.setSubtitle = (text) => { sub.hidden = !text; sub.textContent = text || ''; };
  return bar;
}

/** A round frosted button for the game header bar. */
export function barButton(iconName, label, onclick, extra = {}) {
  return h('button.gb-btn', { type: 'button', 'aria-label': label, title: label, onclick, ...extra }, icon(iconName));
}

/** Short cheers for a right answer, used in turn so they vary (the app's CHEERS). */
export const CHEERS = ['Correct!', 'Nice!', 'Great!', 'Brilliant!', 'Awesome!', 'Sharp!'];
let cheerCount = 0;
export const nextCheer = () => CHEERS[cheerCount++ % CHEERS.length];

/**
 * The app's CelebrationBurst: after a right answer, sparks and dots burst out from the middle of [host],
 * a ring of light expands and a green pill with [text] pops in and fades out, in about 0.9 s. It never
 * takes clicks, so the next answer can be played straight away. With reduced motion only the pill shows.
 * [y] is the burst's height as a fraction of the host (the board's middle, not the page's).
 */
export function celebrate(host, text, { y = 0.45 } = {}) {
  if (!host || !host.isConnected) return;
  host.querySelectorAll(':scope > .celebrate').forEach((el) => el.remove());
  const still = prefersReducedMotion();
  const layer = h('div.celebrate', { 'aria-hidden': 'true', style: { '--y': `${y * 100}%` } });
  if (!still) {
    layer.append(h('i.cb-ring'));
    const colors = ['var(--c)', '#ffc531', '#22c55e', '#ff6b9a', '#4ea8ff', '#ffffff'];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + Math.random() * 0.35;
      const dist = 70 + Math.random() * 90;
      const spark = h(`i.cb-spark${i % 3 === 0 ? '.star' : ''}`);
      spark.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      spark.style.setProperty('--s', `${6 + Math.random() * 7}px`);
      spark.style.background = colors[i % colors.length];
      layer.append(spark);
    }
  }
  layer.append(h('span.cb-pill', {}, icon('check_circle'), h('span', {}, text)));
  host.append(layer);
  setTimeout(() => layer.remove(), still ? 800 : 1000);
}
