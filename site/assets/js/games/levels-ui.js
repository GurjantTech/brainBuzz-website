/**
 * "Choose a level" screen pieces shared by the timed-game shell and Sudoku: the header with stars and
 * progress, the 1–100 level grid in pages of 20, the selected level's card, the Start button and star rows.
 */
import { h, icon, clear, gridKeys } from '../lib/dom.js';
import { MAX_LEVEL, tierOf } from '../engine/levels.js';
import { brainMascot } from '../lib/art.js';

const PER_PAGE = 20;
const PAGES = Math.ceil(MAX_LEVEL / PER_PAGE);
const SVG_NS = 'http://www.w3.org/2000/svg';

/** ★★☆ for 0–3 stars. */
export function starRow(stars, cls = '') {
  return h(`span.stars${cls ? `.${cls}` : ''}`, { role: 'img', 'aria-label': `${stars} of 3 stars` },
    [1, 2, 3].map((i) => icon('star', i <= stars ? 'on' : '')));
}

export const totalStars = (stars) => Object.values(stars).reduce((a, b) => a + b, 0);

/** Decorative inline SVG from markup we write ourselves (never user content). */
function art(markup, cls, viewBox) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('class', cls);
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('focusable', 'false');
  el.innerHTML = markup;
  return el;
}

const starPoints = (cx, cy, r, inner = 0.45) => Array.from({ length: 10 }, (_, i) => {
  const rad = i % 2 === 0 ? r : r * inner;
  const a = ((-90 + 36 * i) * Math.PI) / 180;
  return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
}).join(' ');

/** The brain mascot cheering beside a big star (assets/js/lib/art.js), as an element. */
function headerArt() {
  const holder = document.createElement('span');
  holder.innerHTML = brainMascot({ id: 'lvM', cls: 'lv-art' });
  return holder.firstChild;
}

/** "Choose a level" header with stars earned and how far through the 100 levels the player is. */
export function levelHeader({ unlocked, stars }) {
  const earned = totalStars(stars);
  const pct = Math.round((unlocked / MAX_LEVEL) * 100);
  return h('div.lv-head', {},
    h('div.lv-head-text', {},
      h('h2', {}, 'Choose ', h('span.lv-a', {}, 'a'), ' level'),
      h('p', {}, 'Complete levels, earn stars and unlock new challenges!')),
    headerArt(),
    h('div.lv-stats', {},
      h('div.lv-stats-top', {}, icon('star'),
        h('div', {}, h('strong', {}, `${earned}/${MAX_LEVEL * 3} stars`), h('span', {}, `Level ${unlocked} of ${MAX_LEVEL}`))),
      h('div.lv-progress', {},
        h('span.lv-bar', { role: 'progressbar', 'aria-label': 'Levels unlocked', 'aria-valuemin': 0, 'aria-valuemax': MAX_LEVEL, 'aria-valuenow': unlocked },
          h('span', { style: { width: `${Math.max(pct, 2)}%` } })),
        h('b', {}, `${pct}%`))));
}

/**
 * The level grid. Levels above `unlocked` are locked.
 * @param opts {{ unlocked: number, stars: Object<number, number>, selected: number, onChange: (level: number) => void }}
 */
export function levelPicker({ unlocked, stars, selected, onChange }) {
  let page = Math.floor((selected - 1) / PER_PAGE);
  const tabs = h('div.lv-pages', { role: 'group', 'aria-label': 'Level pages' });
  const grid = h('div.lv-grid', { role: 'group', 'aria-label': 'Levels' });
  gridKeys(grid, () => (innerWidth < 560 ? 5 : 10));

  function render(focusSelected = false) {
    clear(tabs).append(...Array.from({ length: PAGES }, (_, p) => {
      const from = p * PER_PAGE + 1;
      const to = Math.min(from + PER_PAGE - 1, MAX_LEVEL);
      return h('button.lv-page', {
        type: 'button', 'aria-pressed': String(p === page), disabled: from > unlocked,
        'aria-label': `Levels ${from} to ${to}${from > unlocked ? ', locked' : ''}`,
        onclick: () => { page = p; render(); },
      }, `${from}–${to}`);
    }));
    const from = page * PER_PAGE + 1;
    clear(grid).append(...Array.from({ length: Math.min(PER_PAGE, MAX_LEVEL - from + 1) }, (_, i) => {
      const level = from + i;
      const locked = level > unlocked;
      const s = stars[level] || 0;
      const btn = h('button.lv-btn', {
        type: 'button', 'data-cell': i, 'data-level': level, disabled: locked, 'aria-pressed': String(level === selected),
        'aria-label': locked ? `Level ${level}, locked` : `Level ${level}${s ? `, ${s} of 3 stars` : level === unlocked ? ', next to play' : ''}`,
        onclick: () => {
          selected = level;
          render(true);
          onChange(level);
        },
      }, locked ? icon('lock') : null, h('strong', {}, String(level)), locked ? null : starRow(s, 'mini'));
      if (level === unlocked && !locked && !s) btn.classList.add('next');
      return btn;
    }));
    if (focusSelected) {
      const btn = grid.querySelector(`[data-level="${selected}"]`);
      if (btn) btn.focus({ preventScroll: true });
    }
  }
  render();
  return h('div.lv-picker', {}, tabs, grid);
}

const TIER = {
  EASY: { label: 'Easy', line: 'A gentle warm-up for your brain.' },
  MEDIUM: { label: 'Medium', line: 'Things are heating up. Stay sharp!' },
  HARD: { label: 'Hard', line: 'Expert territory. Can you master it?' },
};

function tagline(level) {
  if (level === 1) return 'Let’s start your brain training journey!';
  if (level === MAX_LEVEL) return 'The final challenge. Give it everything!';
  return TIER[tierOf(level)].line;
}

/** Gold hexagon badge with the level number on a purple ribbon showing the stars earned. */
function badge(level, stars) {
  const hex = (r, cy) => [-90, -30, 30, 90, 150, 210].map((d) => {
    const a = (d * Math.PI) / 180;
    return `${(60 + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  const size = String(level).length > 2 ? 26 : String(level).length > 1 ? 32 : 38;
  const markup = `
    <defs>
      <linearGradient id="lvGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe372"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
      <linearGradient id="lvGoldIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd54a"/><stop offset="1" stop-color="#ffb000"/></linearGradient>
      <linearGradient id="lvRibbon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d3df2"/><stop offset="1" stop-color="#9b5cff"/></linearGradient>
    </defs>
    <polygon points="${hex(42, 44)}" fill="url(#lvGold)" stroke="#d97706" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="${hex(32, 44)}" fill="url(#lvGoldIn)" stroke="#fff3c4" stroke-width="2" stroke-linejoin="round"/>
    <text x="60" y="${44 + size * 0.36}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="${size}"
      fill="#fff8e1" stroke="#9a4a00" stroke-width="3" paint-order="stroke">${level}</text>
    <path d="M4 70l12-6v28L4 98l6-14z" fill="#4b23b8"/><path d="M116 70l-12-6v28l12 6-6-14z" fill="#4b23b8"/>
    <path d="M14 66h92v24H14z" fill="url(#lvRibbon)"/>
    ${[40, 60, 80].map((x, i) => `<polygon points="${starPoints(x, 78, 8)}" fill="${i < stars ? '#ffd54a' : '#2b1873'}" stroke="${i < stars ? '#f59e0b' : 'none'}" stroke-width="1"/>`).join('')}`;
  return art(markup, 'lv-badge', '0 0 120 100');
}

/**
 * The selected level's card: badge, title, tier, tagline, earned stars, rule cards and a banner
 * (best score or what it takes to pass).
 * @param opts {{ level: number, stars: number, rules: Array<{icon,title,sub}>, banner: { tone, icon, title, text } }}
 */
export function levelDetail({ level, stars, rules, banner }) {
  const tier = tierOf(level);
  return h('section.lv-detail', { 'aria-live': 'polite', 'aria-label': `Level ${level}` },
    h('div.lv-detail-top', {},
      badge(level, stars),
      h('div.lv-detail-title', {},
        h('div.lv-title-row', {}, h('h3', {}, `Level ${level}`), h(`span.lv-tier.${tier.toLowerCase()}`, {}, TIER[tier].label)),
        h('p', {}, tagline(level))),
      starRow(stars, 'lv-earned')),
    h('div.lv-rules', {}, rules.map((r, i) => h(`div.lv-rule.tone-${['blue', 'pink', 'amber', 'green'][i % 4]}`, {},
      h('span.lv-rule-icon', {}, r.icon === 'abc' ? h('b', {}, 'ABC') : icon(r.icon)),
      h('span.lv-rule-text', {}, h('strong', {}, r.title), h('span', {}, r.sub))))),
    h(`div.lv-banner.${banner.tone}`, {},
      h('span.lv-banner-icon', {}, icon(banner.icon)),
      h('span', {}, h('strong', {}, banner.title), h('span', {}, banner.text))));
}

/** The big gradient Start button, with a little burst on each side. */
export function startButton(label, onclick, cls = '') {
  return h(`div.lv-start${cls ? `.${cls}` : ''}`, {},
    h('span.lv-burst.left', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
    h('button.lv-start-btn', { type: 'button', onclick }, icon('play_arrow'), h('span', {}, label)),
    h('span.lv-burst.right', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i')));
}

export function levelNote(text) {
  return h('p.lv-note', {}, icon('emoji_events'), h('span', {}, text));
}
