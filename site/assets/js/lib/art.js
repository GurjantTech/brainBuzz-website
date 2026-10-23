/**
 * Decorative SVG artwork as markup strings, so the build can render it into pages and scripts can reuse it:
 * the brain mascot (the same character as the app's home header), a trophy, and one icon per game.
 * Every drawing is aria-hidden; gradient ids take a prefix so several copies can share a page.
 */

const starPoints = (cx, cy, r, inner = 0.45) => Array.from({ length: 10 }, (_, i) => {
  const rad = i % 2 === 0 ? r : r * inner;
  const a = ((-90 + 36 * i) * Math.PI) / 180;
  return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
}).join(' ');

const sparkle = (x, y, r, fill) => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${fill}"/>`;

const svg = (viewBox, cls, body) => `<svg class="${cls}" viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;

/**
 * The cheering brain mascot. [bulb] adds the light bulb it holds up; [star] the big gold star beside it;
 * [cap] the graduation cap it wears in the app; [openEyes] big round eyes instead of happy closed ones; [arms] false to leave them off.
 * Drawn in a 136 × 92 box (x from −36).
 */
export function brainMascot({ id = 'bm', cls = 'mascot', bulb = false, star = true, cap = false, openEyes = false, arms = true } = {}) {
  const folds = ['M34 45Q38 39 44 43', 'M48 37Q54 33 59 40', 'M62 43Q68 45 69 52', 'M28 57Q26 51 32 49', 'M50 35Q48 43 52 47', 'M71 58Q75 60 74 65'];
  const lobes = [[30, 46, 12], [40, 37, 13], [53, 34, 13], [65, 39, 12], [74, 51, 10], [26, 59, 10]];
  const body = `
    <defs>
      <linearGradient id="${id}B" x1="0" y1="28" x2="0" y2="80" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb3d1"/><stop offset=".55" stop-color="#e58bff"/><stop offset="1" stop-color="#8f7bff"/></linearGradient>
      <linearGradient id="${id}S" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe372"/><stop offset="1" stop-color="#ffb000"/></linearGradient>
      <radialGradient id="${id}G"><stop offset="0" stop-color="#ffe372" stop-opacity=".75"/><stop offset="1" stop-color="#ffe372" stop-opacity="0"/></radialGradient>
    </defs>
    ${star ? `<polygon points="${starPoints(-6, 40, 26, 0.48)}" fill="url(#${id}S)" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/>
    <polygon points="${starPoints(-14, 32, 6, 0.48)}" fill="#fff6c8" opacity=".8"/>` : ''}
    <polygon points="${starPoints(16, 12, 5, 0.42)}" fill="#ffd54a"/>
    ${star ? `<polygon points="${starPoints(-30, 78, 4, 0.42)}" fill="#ffd54a"/>` : ''}
    ${sparkle(94, 20, 4, '#fff')}${sparkle(82, 8, 3, '#c4b5fd')}
    ${bulb ? `<circle cx="84" cy="22" r="18" fill="url(#${id}G)"/>
    <g stroke="#ffc531" stroke-width="1.8" stroke-linecap="round">${[0, 1, 2, 3, 4].map((i) => {
    const a = ((-170 + i * 40) * Math.PI) / 180;
    return `<line x1="${(84 + Math.cos(a) * 13).toFixed(1)}" y1="${(22 + Math.sin(a) * 13).toFixed(1)}" x2="${(84 + Math.cos(a) * 17).toFixed(1)}" y2="${(22 + Math.sin(a) * 17).toFixed(1)}"/>`;
  }).join('')}</g>` : ''}
    ${arms ? `<g stroke="#c96ff0" stroke-width="5" stroke-linecap="round"><line x1="25" y1="62" x2="13" y2="47"/><line x1="75" y1="62" x2="${bulb ? 82 : 87}" y2="${bulb ? 40 : 47}"/></g>
    <circle cx="13" cy="46" r="3.6" fill="#c96ff0"/>` : ''}
    ${bulb ? `<circle cx="84" cy="22" r="9" fill="#ffe372" stroke="#f5b400" stroke-width="1.2"/><circle cx="81" cy="19" r="2.4" fill="#fff" opacity=".8"/>
    <rect x="80" y="30" width="8" height="7" rx="1.5" fill="#9aa0bf"/><line x1="80.5" y1="32.5" x2="87.5" y2="32.5" stroke="#7d82a3" stroke-width=".9"/>` : ''}
    ${arms ? `<circle cx="${bulb ? 82 : 87}" cy="${bulb ? 39 : 46}" r="3.6" fill="#c96ff0"/>` : ''}
    ${lobes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}B)"/>`).join('')}
    <ellipse cx="50" cy="56" rx="30" ry="24" fill="url(#${id}B)"/>
    <g fill="none" stroke="#a5359a" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round">${folds.map((d) => `<path d="${d}"/>`).join('')}</g>
    <circle cx="36" cy="38" r="4" fill="#fff" opacity=".45"/>
    ${openEyes ? `<ellipse cx="43" cy="57" rx="6" ry="7" fill="#fff"/><ellipse cx="58" cy="57" rx="6" ry="7" fill="#fff"/>
    <circle cx="44" cy="58.5" r="4" fill="#1e1b3a"/><circle cx="59" cy="58.5" r="4" fill="#1e1b3a"/>
    <circle cx="42.6" cy="56.6" r="1.5" fill="#fff"/><circle cx="57.6" cy="56.6" r="1.5" fill="#fff"/>`
    : '<path d="M38 58q5-6 10 0M53 58q5-6 10 0" fill="none" stroke="#1e1b3a" stroke-width="2.6" stroke-linecap="round"/>'}
    <ellipse cx="35" cy="65" rx="4" ry="2.2" fill="#ff4f86" opacity=".45"/><ellipse cx="66" cy="65" rx="4" ry="2.2" fill="#ff4f86" opacity=".45"/>
    <path d="M44 64Q50.5 75 57 64Z" fill="#8a1538"/><ellipse cx="50.5" cy="70" rx="3" ry="1.8" fill="#ff7a9c"/>
    ${cap ? `<path d="M37 22l15-7 17 7-17 7z" fill="#2b2760"/><path d="M44 25h17l-1 7q-8 3-15 0z" fill="#221f4e"/>
    <path d="M52 22l14 2v8" fill="none" stroke="#ffc531" stroke-width="1.1" stroke-linecap="round"/><rect x="64.6" y="31" width="3" height="6" rx="1.4" fill="#ffc531"/>` : ''}`;
  return svg('-36 0 136 92', cls, body);
}

/** A gold trophy on a purple base. */
export function trophy({ id = 'tr', cls = 'trophy' } = {}) {
  return svg('0 0 100 100', cls, `
    <defs>
      <linearGradient id="${id}G" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe372"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
      <linearGradient id="${id}P" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c4dff"/><stop offset="1" stop-color="#4b23b8"/></linearGradient>
    </defs>
    <path d="M30 18h40v20c0 13-9 23-20 23S30 51 30 38z" fill="url(#${id}G)" stroke="#d97706" stroke-width="2"/>
    <path d="M30 24H18c0 13 7 20 15 20M70 24h12c0 13-7 20-15 20" fill="none" stroke="#f5a300" stroke-width="5" stroke-linecap="round"/>
    <rect x="45" y="60" width="10" height="12" fill="#f5a300"/>
    <rect x="30" y="70" width="40" height="10" rx="3" fill="url(#${id}P)"/>
    <rect x="24" y="78" width="52" height="12" rx="4" fill="url(#${id}P)"/>
    <polygon points="${starPoints(50, 37, 9)}" fill="#fff3c4"/>
    <ellipse cx="39" cy="28" rx="3" ry="7" fill="#fff" opacity=".45"/>
    ${sparkle(86, 30, 6, '#ffc531')}${sparkle(14, 58, 4, '#ffc531')}`);
}

/** A big gold star, for decoration. */
export const goldStar = ({ id = 'gs', cls = 'deco-star', size = 40 } = {}) => svg('0 0 100 100', cls, `
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe372"/><stop offset="1" stop-color="#ffb000"/></linearGradient></defs>
  <polygon points="${starPoints(50, 52, size, 0.48)}" fill="url(#${id})" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round"/>`);

export const sparkleSvg = (cls = 'deco-sparkle', fill = '#ffc531') => svg('0 0 20 20', cls, sparkle(10, 10, 9, fill));

// ---------- Game icons (80 × 80 "app icons") ----------

const tile = (x, y, w, h, fill, rx = 6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h * 0.38}" rx="${rx - 2}" fill="#fff" opacity=".28"/>`;
const letter = (x, y, ch, fill, size = 15) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="${size}" fill="${fill}">${ch}</text>`;

const GAME_ART = {
  MATRIX: ['#ece6ff', '#b8a6ff', () => `${tile(14, 14, 24, 24, '#c25bff')}${tile(42, 14, 24, 24, '#4fc3f7')}${tile(14, 42, 24, 24, '#ff8fb1')}${tile(42, 42, 24, 24, '#7c6cff')}
    <polygon points="${starPoints(26, 26, 6)}" fill="#fff"/><circle cx="54" cy="54" r="5" fill="#fff"/>`],
  MEMORY: ['#dcefff', '#6cb6ff', () => `<g transform="rotate(-12 34 42)">${tile(16, 20, 28, 38, '#3d8bff')}</g><g transform="rotate(10 50 42)">${tile(36, 18, 28, 38, '#2f6fed')}</g>
    <polygon points="${starPoints(50, 38, 10)}" fill="#ffd54a" stroke="#f59e0b" stroke-width="1"/>`],
  LOGIC_PATH: ['#d8f5e6', '#53c48d', () => `<path d="M14 30h18v24h22V24h12" fill="none" stroke="#2b8c62" stroke-width="12" stroke-linejoin="round"/>
    <path d="M14 30h18v24h22V24h12" fill="none" stroke="#7d6cff" stroke-width="6" stroke-linejoin="round"/><circle cx="62" cy="58" r="8" fill="#ffc531" stroke="#f59e0b" stroke-width="1.5"/>`],
  ODD_ONE_OUT: ['#ffe4ee', '#ff8db0', () => `${tile(12, 12, 26, 26, '#fff')}${tile(42, 12, 26, 26, '#fff')}${tile(12, 42, 26, 26, '#fff')}${tile(42, 42, 26, 26, '#fff')}
    <circle cx="25" cy="25" r="8" fill="#ef4444"/><polygon points="55,17 63,32 47,32" fill="#ef4444"/><path d="M25 61l-8-8a5 5 0 0 1 8-6 5 5 0 0 1 8 6z" fill="#8b5cf6"/><rect x="48" y="48" width="14" height="14" rx="3" fill="#ffc531"/>`],
  WORD_SCRAMBLE: ['#fff0d4', '#ffb547', () => `${tile(12, 12, 26, 26, '#ffd27a')}${tile(42, 12, 26, 26, '#ffe7b3')}${tile(12, 42, 26, 26, '#ffe7b3')}${tile(42, 42, 26, 26, '#ffd27a')}
    ${letter(25, 31, 'W', '#8a3b00')}${letter(55, 31, 'O', '#8a3b00')}${letter(25, 61, 'R', '#8a3b00')}${letter(55, 61, 'D', '#8a3b00')}`],
  SEQUENCE: ['#ece6ff', '#a18bff', () => `${tile(10, 38, 24, 26, '#4f7bff')}${tile(30, 16, 24, 26, '#7c4dff')}${tile(46, 40, 24, 26, '#ff9f43')}
    ${letter(22, 57, '2', '#fff', 17)}${letter(42, 35, '2', '#fff', 17)}${letter(58, 59, '3', '#fff', 17)}`],
  MATH: ['#ffe9d6', '#ffad6b', () => `${tile(12, 12, 26, 26, '#ff5a5f')}${tile(42, 12, 26, 26, '#2fbf71')}${tile(12, 42, 26, 26, '#3d8bff')}${tile(42, 42, 26, 26, '#ffb000')}
    ${letter(25, 31, '+', '#fff', 20)}${letter(55, 31, '−', '#fff', 20)}${letter(25, 61, '×', '#fff', 20)}${letter(55, 61, '÷', '#fff', 20)}`],
  MERGE: ['#ffe2c7', '#ff9a3d', () => `${tile(12, 16, 56, 48, '#f59e0b', 10)}<rect x="16" y="20" width="48" height="40" rx="8" fill="none" stroke="#fff3c4" stroke-width="2"/>${letter(40, 47, '2048', '#fff', 17)}`],
  DETECTIVE: ['#d6f3f7', '#45bcd0', () => `<circle cx="36" cy="34" r="20" fill="#e8fbff" stroke="#1d6fe0" stroke-width="7"/><line x1="50" y1="48" x2="64" y2="62" stroke="#ff9f1a" stroke-width="9" stroke-linecap="round"/>
    ${letter(36, 41, 'A', '#1d6fe0', 20)}`],
  SUDOKU: ['#dbe9ff', '#6fa0ff', () => `<rect x="12" y="12" width="48" height="48" rx="6" fill="#fff" stroke="#1d4fa0" stroke-width="2"/>
    <path d="M28 12v48M44 12v48M12 28h48M12 44h48" stroke="#1d4fa0" stroke-width="1.5"/>
    ${letter(20, 25, '1', '#1d2a55', 12)}${letter(36, 25, '3', '#1d2a55', 12)}${letter(52, 25, '7', '#1d2a55', 12)}${letter(20, 41, '6', '#1d2a55', 12)}${letter(20, 57, '7', '#1d2a55', 12)}
    <g transform="rotate(40 58 52)"><rect x="54" y="34" width="9" height="30" rx="2" fill="#ffb000"/><polygon points="54,64 63,64 58.5,72" fill="#ffd9a0"/><rect x="54" y="30" width="9" height="6" rx="2" fill="#ff7a9c"/></g>`],
  DAILY: ['#d6f6f2', '#2fbfb0', () => `${tile(14, 18, 52, 46, '#fff', 8)}<rect x="14" y="18" width="52" height="14" rx="8" fill="#14b8a6"/>
    <circle cx="28" cy="44" r="4" fill="#14b8a6"/><circle cx="40" cy="44" r="4" fill="#14b8a6"/><circle cx="52" cy="44" r="4" fill="#14b8a6"/><circle cx="28" cy="55" r="4" fill="#14b8a6"/><circle cx="40" cy="55" r="4" fill="#2f6fed"/>`],
};

/** A game's icon: a glossy rounded square in the game's colours with a small illustration. */
export function gameIcon(type, cls = 'game-icon') {
  const [light, deep, draw] = GAME_ART[type] || GAME_ART.DAILY;
  const id = `gi${type}`;
  return svg('0 0 80 80', cls, `
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>
    <rect x="2" y="2" width="76" height="76" rx="20" fill="url(#${id})"/>
    <path d="M10 22C10 14 14 10 22 10h36c6 0 10 2 12 6-14-3-40-2-60 6z" fill="#fff" opacity=".35"/>
    ${draw()}`);
}

/** Small colourful icons for feature lists: trophy, chart, target or crown. */
export function featureIcon(kind, cls = 'feature-icon') {
  const id = `fi${kind}`;
  const body = {
    trophy: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe372"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
      <path d="M14 8h20v10c0 7-4 12-10 12s-10-5-10-12z" fill="url(#${id})"/><path d="M14 11H7c0 7 4 10 8 10M34 11h7c0 7-4 10-8 10" fill="none" stroke="#f5a300" stroke-width="3"/>
      <rect x="21" y="29" width="6" height="7" fill="#f5a300"/><rect x="14" y="36" width="20" height="5" rx="2" fill="#d97706"/>`,
    chart: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9b7bff"/><stop offset="1" stop-color="#4b2fd1"/></linearGradient></defs>
      <rect x="8" y="24" width="8" height="16" rx="3" fill="url(#${id})"/><rect x="20" y="14" width="8" height="26" rx="3" fill="url(#${id})"/><rect x="32" y="6" width="8" height="34" rx="3" fill="#3d8bff"/>`,
    target: `<circle cx="24" cy="24" r="17" fill="#ef4444"/><circle cx="24" cy="24" r="12" fill="#fff"/><circle cx="24" cy="24" r="7" fill="#ef4444"/><circle cx="24" cy="24" r="3" fill="#fff"/>`,
    crown: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe372"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
      <path d="M8 36L5 14l11 9 8-14 8 14 11-9-3 22z" fill="url(#${id})" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><circle cx="5" cy="14" r="3" fill="#ff5c7a"/><circle cx="24" cy="9" r="3" fill="#ff5c7a"/><circle cx="43" cy="14" r="3" fill="#ff5c7a"/>`,
  }[kind];
  return svg('0 0 48 48', cls, body);
}

/** A big glowing light bulb with rays. */
export function lightBulb(cls = 'bulb') {
  return svg('0 0 120 150', cls, `
    <defs>
      <radialGradient id="lbG"><stop offset="0" stop-color="#ffe372" stop-opacity=".8"/><stop offset="1" stop-color="#ffe372" stop-opacity="0"/></radialGradient>
      <radialGradient id="lbB" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fffbd6"/><stop offset=".45" stop-color="#ffe065"/><stop offset="1" stop-color="#ffb000"/></radialGradient>
      <linearGradient id="lbS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b7bd6"/><stop offset="1" stop-color="#4b3aa8"/></linearGradient>
    </defs>
    <circle cx="60" cy="58" r="58" fill="url(#lbG)"/>
    <g stroke="#ffc531" stroke-width="5" stroke-linecap="round">${[-150, -115, -90, -65, -30].map((d) => {
    const a = (d * Math.PI) / 180;
    return `<line x1="${(60 + Math.cos(a) * 46).toFixed(1)}" y1="${(56 + Math.sin(a) * 46).toFixed(1)}" x2="${(60 + Math.cos(a) * 58).toFixed(1)}" y2="${(56 + Math.sin(a) * 58).toFixed(1)}"/>`;
  }).join('')}</g>
    <path d="M60 22c-20 0-34 15-34 33 0 13 7 21 13 28 4 5 5 9 5 14h32c0-5 1-9 5-14 6-7 13-15 13-28 0-18-14-33-34-33z" fill="url(#lbB)" stroke="#f5a300" stroke-width="2"/>
    <path d="M50 96V80c0-6 4-9 10-9s10 3 10 9v16" fill="none" stroke="#e08a00" stroke-width="2.5"/>
    <ellipse cx="47" cy="40" rx="7" ry="11" fill="#fff" opacity=".7" transform="rotate(-25 47 40)"/>
    <rect x="42" y="97" width="36" height="10" rx="4" fill="url(#lbS)"/><rect x="44" y="108" width="32" height="9" rx="4" fill="url(#lbS)"/><rect x="47" y="118" width="26" height="9" rx="4" fill="url(#lbS)"/>
    <path d="M53 128h14l-3 7h-8z" fill="#3b2a8f"/>`);
}

/** A chunky 3D block with a number or symbol on it, like the ones around the app icon. */
export function numberBlock(label, top, side, cls = 'block') {
  const id = `nb${label.charCodeAt(0)}${top.slice(1)}`;
  return svg('0 0 100 100', cls, `
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${side}"/></linearGradient></defs>
    <rect x="8" y="14" width="84" height="80" rx="20" fill="${side}"/>
    <rect x="8" y="6" width="84" height="78" rx="20" fill="url(#${id})"/>
    <path d="M18 22c0-6 4-9 10-9h44c4 0 7 1 9 3-20-1-44 1-63 6z" fill="#fff" opacity=".4"/>
    <text x="50" y="66" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="54" fill="#fff" stroke="rgba(0,0,0,.12)" stroke-width="2" paint-order="stroke">${label}</text>`);
}
