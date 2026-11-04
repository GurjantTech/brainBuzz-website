/**
 * "Level journey" pieces shared by the timed-game shell and Sudoku, like the app's LevelSelectScreen: a
 * header in the game's colours with its art, level, tier and progress; the 100 levels in pages of 20 as a
 * winding path (the current level pulses and starts the game straight away); the selected level's card
 * (medallion, tier, tagline, stars, rules, reward and best); the Start button and star rows.
 */
import { h, icon, clear, gridKeys } from '../lib/dom.js';
import { MAX_LEVEL, tierOf } from '../engine/levels.js';
import { gameIcon } from '../lib/art.js';

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

/** The game's art from art.js (markup we write ourselves) as an element. */
function gameArt(type) {
  const holder = document.createElement('span');
  holder.innerHTML = gameIcon(type, 'lv-hero-icon');
  return holder.firstChild;
}

/**
 * The page's header, in the game's colours (`--c` on the stage): "Level journey", the game's name and art,
 * pills for the current level and its tier, the stars earned and a progress bar across all levels.
 * @param opts {{ unlocked: number, stars: Object<number, number>, type: string, title: string }}
 */
export function levelHeader({ unlocked, stars, type, title }) {
  const earned = totalStars(stars);
  const pct = Math.round(((unlocked - 1) / (MAX_LEVEL - 1)) * 100);
  return h('div.lv-hero', {},
    h('div.lv-hero-top', {},
      h('span.lv-hero-pill.stars-pill', { role: 'img', 'aria-label': `${earned} of ${MAX_LEVEL * 3} stars` }, icon('star'), `${earned}/${MAX_LEVEL * 3}`)),
    h('div.lv-hero-main', {},
      h('div.lv-hero-text', {},
        h('p.lv-kicker', {}, 'Level journey'),
        h('h2', {}, title),
        h('div.lv-hero-pills', {},
          h('span.lv-hero-pill', {}, icon('play_arrow'), `Level ${unlocked}`),
          h('span.lv-hero-pill', {}, icon('bolt', 'gold'), TIER[tierOf(unlocked)].label))),
      h('span.lv-hero-art', { 'aria-hidden': 'true' }, gameArt(type))),
    h('div.lv-hero-progress', {},
      h('span.lv-hero-bar', { role: 'progressbar', 'aria-label': 'Levels unlocked', 'aria-valuemin': 1, 'aria-valuemax': MAX_LEVEL, 'aria-valuenow': unlocked },
        h('span', { style: { width: `${Math.max(pct, 3)}%` } })),
      h('div.lv-hero-progress-text', {}, h('span', {}, `Level ${unlocked} of ${MAX_LEVEL}`), h('span', {}, `${pct}% complete`))));
}

const COLUMNS = 4;

/**
 * The levels as a winding path, like a game map: rows of four that snake left to right, then right to left,
 * joined by a line that is solid as far as the player has reached and dotted beyond. Every tenth level is a
 * "boss" with a crown. Tapping the current level calls `onPlay` (it starts straight away, no details first);
 * tapping another unlocked level selects it and calls `onChange`. Levels above `unlocked` are locked.
 * @param opts {{ unlocked: number, stars: Object<number, number>, selected: number, onChange: (level: number) => void, onPlay?: (level: number) => void }}
 */
export function levelPicker({ unlocked, stars, selected, onChange, onPlay }) {
  let page = Math.floor((selected - 1) / PER_PAGE);
  const tabs = h('div.lv-pages', { role: 'group', 'aria-label': 'Level pages' });
  const grid = h('div.lv-path', { role: 'group', 'aria-label': 'Levels' });
  gridKeys(grid, () => COLUMNS);

  function render(focusSelected = false) {
    clear(tabs).append(...Array.from({ length: PAGES }, (_, p) => {
      const from = p * PER_PAGE + 1;
      const to = Math.min(from + PER_PAGE - 1, MAX_LEVEL);
      const locked = from > unlocked;
      let complete = true;
      for (let lv = from; lv <= to; lv++) if (!stars[lv]) { complete = false; break; }
      return h('button.lv-page', {
        type: 'button', 'aria-pressed': String(p === page), disabled: locked,
        'aria-label': `Levels ${from} to ${to}${locked ? ', locked' : complete ? ', all passed' : ''}`,
        onclick: () => { page = p; render(); },
      }, locked ? icon('lock') : complete ? icon('check') : null, `${from}–${to}`);
    }));
    const from = page * PER_PAGE + 1;
    const count = Math.min(PER_PAGE, MAX_LEVEL - from + 1);
    const nodes = Array.from({ length: count }, (_, i) => {
      const level = from + i;
      const locked = level > unlocked;
      const current = level === unlocked;
      const s = stars[level] || 0;
      const row = Math.floor(i / COLUMNS);
      const inRow = i % COLUMNS;
      const col = row % 2 === 0 ? inRow : COLUMNS - 1 - inRow;
      const boss = level % 10 === 0;
      const btn = h('button.lv-node', {
        type: 'button', 'data-cell': i, 'data-level': level, disabled: locked, 'aria-pressed': String(level === selected),
        'aria-label': `Level ${level}${boss ? ', boss level' : ''}${locked ? ', locked' : current ? ', next to play' : s ? `, ${s} of 3 stars` : ''}`,
        style: { gridRow: String(row + 1), gridColumn: String(col + 1) },
        onclick: () => {
          if (current && onPlay) { onPlay(level); return; }
          selected = level;
          render(true);
          onChange(level);
        },
      },
      h('span.lv-dot', {}, locked ? icon('lock') : h('strong', {}, String(level)),
        boss ? h('span.lv-crown', { 'aria-hidden': 'true' }, icon('workspace_premium')) : null),
      current ? h('span.lv-play', {}, 'PLAY') : locked ? h('span.lv-num', {}, String(level)) : starRow(s, 'mini'));
      btn.classList.toggle('done', !locked && !current);
      btn.classList.toggle('current', current);
      btn.classList.toggle('locked', locked);
      return btn;
    });
    clear(grid).append(pathLine(count, from, unlocked), ...nodes);
    if (focusSelected) {
      const btn = grid.querySelector(`[data-level="${selected}"]`);
      if (btn) btn.focus({ preventScroll: true });
    }
  }
  render();
  return h('div.lv-picker', {}, tabs, grid);
}

/**
 * The line joining a page's levels, behind the nodes, in a 0–100 × rows*100 coordinate box: straight
 * along each row and a loop past the row's end down to the next one. Solid up to the current level.
 */
function pathLine(count, from, unlocked) {
  const rows = Math.ceil(count / COLUMNS);
  const center = (i) => {
    const row = Math.floor(i / COLUMNS);
    const inRow = i % COLUMNS;
    const col = row % 2 === 0 ? inRow : COLUMNS - 1 - inRow;
    return [((col + 0.5) / COLUMNS) * 100, row * 100 + 34];
  };
  const segs = [];
  for (let i = 0; i < count - 1; i++) {
    const [ax, ay] = center(i);
    const [bx, by] = center(i + 1);
    let d;
    if (ay === by) d = `M${ax} ${ay}L${bx} ${by}`;
    else {
      const bulge = (ax > 50 ? 1 : -1) * 14;
      d = `M${ax} ${ay}C${ax + bulge} ${ay} ${bx + bulge} ${by} ${bx} ${by}`;
    }
    segs.push(`<path d="${d}" class="${from + i + 1 <= unlocked ? 'on' : 'off'}"/>`);
  }
  const el = art(segs.join(''), 'lv-line', `0 0 100 ${rows * 100}`);
  el.setAttribute('preserveAspectRatio', 'none');
  return el;
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

/**
 * The selected level's card, like the app's level sheet: a header in the game's colours with the level's
 * medallion (a crown on boss levels), tier, tagline and stars; "What to expect" (the level's rules); then
 * a Reward tile (what passing unlocks) beside the player's best.
 * @param opts {{ level: number, stars: number, rules: Array<{icon,title,sub}>, best: string|null, bestSub: string }}
 */
export function levelDetail({ level, stars, rules, best, bestSub }) {
  const tier = tierOf(level);
  return h('section.lv-detail', { 'aria-live': 'polite', 'aria-label': `Level ${level}` },
    h('div.lv-sheet-hero', {},
      h('span.lv-medal', {}, h('strong', {}, String(level)),
        level % 10 === 0 ? h('span.lv-crown', { title: 'Boss level' }, icon('workspace_premium')) : null),
      h('div.lv-sheet-title', {},
        h('div.lv-title-row', {}, h('h3', {}, `Level ${level}`), h(`span.lv-tier.${tier.toLowerCase()}`, {}, TIER[tier].label)),
        h('p', {}, tagline(level)),
        h('span.stars.lv-earned', { role: 'img', 'aria-label': `${stars} of 3 stars earned` },
          [1, 2, 3].map((i) => icon('star', i <= stars ? 'on' : ''))))),
    h('p.lv-section', {}, 'What to expect'),
    h('div.lv-rules', {}, rules.map((r, i) => h(`div.lv-rule.tone-${['blue', 'pink', 'amber', 'green'][i % 4]}`, {},
      h('span.lv-rule-icon', {}, r.icon === 'abc' ? h('b', {}, 'ABC') : icon(r.icon)),
      h('span.lv-rule-text', {}, h('strong', {}, r.title), h('span', {}, r.sub))))),
    h('div.lv-tiles', {},
      h('div.lv-tile.reward', {},
        h('span.lv-tile-label', {}, icon('trending_up'), 'Reward'),
        h('strong', {}, level < MAX_LEVEL ? `Unlocks Level ${level + 1}` : `Finishes all ${MAX_LEVEL} levels`),
        h('span', {}, 'Earn up to 3 stars')),
      h('div.lv-tile.best', {},
        h('span.lv-tile-label', {}, icon('emoji_events'), 'Your best'),
        h('strong', {}, best || 'Not played yet'),
        h('span', {}, best ? bestSub : 'Set your first best!'))));
}

/** The big Start button, in the game's colours. */
export function startButton(label, onclick, cls = '') {
  return h(`div.lv-start${cls ? `.${cls}` : ''}`, {},
    h('button.lv-start-btn', { type: 'button', onclick }, icon('play_arrow'), h('span', {}, label)));
}

export function levelNote(text) {
  return h('p.lv-note', {}, icon('emoji_events'), h('span', {}, text));
}
