/** Site chrome: theme toggle, mobile menu, header shadow, reveal-on-scroll, game cards, the Daily card and ad units. */
import { topScore, dailyResult, webData } from './lib/store.js';
import { formatNumber, untilMidnight, icon, ICONS } from './lib/dom.js';
import { todayEpochDay } from './engine/quiz.js';

const root = document.documentElement;

// Theme: follows the system until the visitor picks one.
const themeBtn = document.querySelector('[data-theme-toggle]');
const isDark = () =>
  root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
function syncThemeButton() {
  if (themeBtn) themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
}
if (themeBtn) {
  syncThemeButton();
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('bb-theme', next); } catch (e) { /* not saved; still applied */ }
    syncThemeButton();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeButton);
}

// Mobile menu.
const toggle = document.querySelector('[data-nav-toggle]');
const menu = document.getElementById('mobile-nav');
if (toggle && menu) {
  const set = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use')?.setAttribute('href', `${ICONS}#${open ? 'close' : 'menu'}`);
  };
  toggle.addEventListener('click', () => set(!menu.classList.contains('open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      set(false);
      toggle.focus();
    }
  });
  matchMedia('(min-width: 960px)').addEventListener?.('change', (e) => { if (e.matches) set(false); });
}

// Header gets a hairline once the page scrolls.
const header = document.querySelector('.site-header');
const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

// Reveal on scroll.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// Game cards: show this browser's best score, like the app's "New" / best badge.
// Word Detective shows its daily streak and Sudoku Daily the puzzles solved instead.
function cardBadge(type) {
  if (type === 'DETECTIVE') {
    const s = webData('detective').stats || {};
    const live = Number.isInteger(s.lastWonDay) && s.lastWonDay >= todayEpochDay() - 1 && Number.isInteger(s.streak) && s.streak > 0;
    return live ? ['local_fire_department', String(s.streak), `${s.streak}-day streak`] : null;
  }
  if (type === 'SUDOKU') {
    const n = webData('sudoku').solved;
    return Number.isInteger(n) && n > 0 ? ['task_alt', String(n), `${n} ${n === 1 ? 'puzzle' : 'puzzles'} solved`] : null;
  }
  const best = topScore(type);
  return best === null ? null : ['emoji_events', formatNumber(best), `Your best: ${formatNumber(best)}`];
}
document.querySelectorAll('[data-best]').forEach((chip) => {
  const badge = cardBadge(chip.dataset.best);
  if (badge) {
    chip.textContent = '';
    chip.append(icon(badge[0]), badge[1]);
    chip.setAttribute('aria-label', badge[2]);
  }
});

// Category filter on /play/.
const filters = document.querySelector('[data-filters]');
const grid = document.querySelector('[data-game-grid]');
if (filters && grid) {
  filters.hidden = false;
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    filters.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const cat = btn.dataset.filter;
    grid.querySelectorAll('[data-category]').forEach((card) => { card.hidden = !!cat && card.dataset.category !== cat; });
    // The "Keep playing" decoration only fills the gap left by the full list.
    const deco = grid.querySelector('[data-grid-deco]');
    if (deco) deco.hidden = !!cat;
  });
}

// Daily card: today's date, and once played, the result plus a countdown to the next set.
const dailyCards = document.querySelectorAll('[data-daily-card]');
if (dailyCards.length) {
  const today = todayEpochDay();
  const done = dailyResult(today);
  const dateText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  dailyCards.forEach((card) => {
    const part = (sel) => card.querySelector(sel);
    part('[data-daily-date]').textContent = dateText;
    if (done) {
      const status = part('[data-daily-status]');
      if (status) status.textContent = `Done today: ${done.correct}/${done.total} correct · ${formatNumber(done.score)} pts`;
      // The /play/ banner shows the result as a pill and swaps the date for the countdown.
      const donePill = part('[data-daily-done]');
      if (donePill) {
        donePill.lastChild.textContent = `Done today: ${done.correct}/${done.total} correct`;
        donePill.hidden = false;
        part('[data-daily-today]').hidden = true;
      }
      part('[data-daily-next]').hidden = false;
      const cta = part('[data-daily-cta] span');
      if (cta) cta.textContent = 'View today’s result';
    }
  });
  if (done) {
    const tick = () => {
      document.querySelectorAll('[data-countdown]').forEach((el) => { el.textContent = untilMidnight(); });
      if (todayEpochDay() !== today) location.reload();
    };
    tick();
    setInterval(tick, 1000);
  }
}

// AdSense: request each manual unit once per page load, never again. Ads are optional; nothing waits on them,
// and if adsbygoogle.js is blocked the loader adds html.ads-off, which hides the empty slots.
document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])').forEach(() => {
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* ads unavailable */ }
});
