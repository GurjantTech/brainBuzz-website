/** Pieces shared by the timed-game shell and the website-only games: results stats, app CTA, confetti, live region. */
import { h, icon, prefersReducedMotion } from '../lib/dom.js';
import { playUrl } from '../lib/site.js';

export function statGrid(items) {
  return h('div.stat-grid', {}, items.map(([ic, value, label]) => h('div.stat', {}, icon(ic), h('strong', {}, value), h('span', {}, label))));
}

export function appCta(placement) {
  return h('div.app-cta', {},
    h('img.logo', { src: '/assets/img/logo-192.webp', width: 60, height: 60, alt: '' }),
    h('div', {},
      h('h3', {}, 'Want more brain challenges?'),
      h('p', {}, 'Get BrainBuzz on Android to earn XP, keep a daily streak and unlock 20 achievements.')),
    h('a.btn.btn-light', { href: playUrl(placement), rel: 'noopener', target: '_blank', 'data-play': placement },
      icon('android'), h('span', {}, 'Get it on Google Play')));
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
