/** Site chrome: theme toggle, mobile menu, header shadow, reveal-on-scroll, game cards and the Daily card. */
import { topScore, dailyResult } from './lib/store.js';
import { formatNumber, untilMidnight, icon } from './lib/dom.js';
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
    toggle.querySelector('use')?.setAttribute('href', `/assets/img/icons.svg#${open ? 'close' : 'menu'}`);
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
document.querySelectorAll('[data-best]').forEach((chip) => {
  const best = topScore(chip.dataset.best);
  if (best !== null) {
    chip.textContent = '';
    chip.append(icon('emoji_events'), formatNumber(best));
    chip.setAttribute('aria-label', `Your best: ${formatNumber(best)}`);
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
  });
}

// Daily card: today's date, and once played, the result plus a countdown to the next set.
const dailyCards = document.querySelectorAll('[data-daily-card]');
if (dailyCards.length) {
  const today = todayEpochDay();
  const done = dailyResult(today);
  const dateText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  dailyCards.forEach((card) => {
    card.querySelector('[data-daily-date]').textContent = dateText;
    if (done) {
      card.querySelector('[data-daily-status]').textContent = `Done today: ${done.correct}/${done.total} correct · ${formatNumber(done.score)} pts`;
      card.querySelector('[data-daily-next]').hidden = false;
      const cta = card.querySelector('[data-daily-cta] span');
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
