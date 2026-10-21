/** Page shell shared by every page: <head> with SEO tags, header, footer. */
import { SITE_URL, SITE_NAME, APP_NAME, playUrl, PLAY_DEV_URL, TAGLINE, DISCLAIMER } from '../assets/js/lib/site.js';
import { GAMES } from '../assets/js/engine/models.js';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const icon = (name, cls = '') =>
  `<svg class="icon${cls ? ` ${cls}` : ''}" aria-hidden="true" focusable="false"><use href="/assets/img/icons.svg#${name}"></use></svg>`;

/** Official "Get it on Google Play" badge (Google brand guidelines: use as supplied). */
export const playBadge = (placement) =>
  `<a class="play-badge" href="${esc(playUrl(placement))}" rel="noopener" target="_blank" data-play="${placement}">` +
  `<img src="/assets/img/google-play-badge.webp" width="646" height="250" alt="Get it on Google Play" loading="lazy" decoding="async"></a>`;

export const playButton = (placement, label = 'Get BrainBuzz on Google Play', cls = 'btn btn-secondary btn-lg') =>
  `<a class="${cls}" href="${esc(playUrl(placement))}" rel="noopener" target="_blank" data-play="${placement}">${icon('android')}<span>${label}</span></a>`;

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/play/', label: 'Play Games' },
  { href: '/play/daily-challenge/', label: 'Daily Challenge' },
  { href: '/about/', label: 'About' },
];

/** Applied before first paint so a saved dark/light choice never flashes. */
export const THEME_SCRIPT =
  "(function(){var d=document.documentElement;d.classList.remove('no-js');try{var t=localStorage.getItem('bb-theme');if(t==='dark'||t==='light')d.setAttribute('data-theme',t)}catch(e){}})();";

function isCurrent(href, path) {
  if (href === '/') return path === '/';
  if (href === '/play/') return path === '/play/' || (path.startsWith('/play/') && path !== '/play/daily-challenge/');
  return path === href;
}

function header(path) {
  const links = (cls) =>
    NAV.map((n) => `<a href="${n.href}"${isCurrent(n.href, path) ? ' aria-current="page"' : ''}${cls}>${n.label}</a>`).join('');
  return `
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" id="top">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="BrainBuzz home">
      <img src="/assets/img/logo-96.webp" width="40" height="40" alt="">
      <span class="brand-name">BrainBuzz<small>Daily Challenge</small></span>
    </a>
    <nav class="nav" aria-label="Main">${links('')}</nav>
    <div class="header-actions">
      <button class="icon-btn theme-toggle" type="button" aria-label="Switch to dark theme" data-theme-toggle>
        ${icon('dark_mode', 'i-light')}${icon('light_mode', 'i-dark')}
      </button>
      <a class="btn btn-primary btn-sm header-cta" href="${esc(playUrl('header'))}" rel="noopener" target="_blank" data-play="header">${icon('android')}<span>Get the app</span></a>
      <button class="icon-btn nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle>${icon('menu')}</button>
    </div>
  </div>
  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile">
    ${links('')}
    <a href="/contact/"${path === '/contact/' ? ' aria-current="page"' : ''}>Contact</a>
    <a class="btn btn-primary btn-block" href="${esc(playUrl('mobile_menu'))}" rel="noopener" target="_blank" data-play="mobile_menu">${icon('android')}<span>Get BrainBuzz on Google Play</span></a>
  </nav>
</header>`;
}

function footer() {
  const year = new Date().getFullYear();
  return `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/">
          <img src="/assets/img/logo-96.webp" width="40" height="40" alt="" loading="lazy">
          <span class="brand-name">BrainBuzz<small>Daily Challenge</small></span>
        </a>
        <p>${TAGLINE} Quick brain games for memory, logic, words and maths, in your browser and on Android.</p>
        <div>${playBadge('footer')}</div>
      </div>
      <div>
        <h2>Games</h2>
        <ul>${GAMES.map((g) => `<li><a href="/play/${g.slug}/">${g.title}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h2>BrainBuzz</h2>
        <ul>
          <li><a href="/play/">All games</a></li>
          <li><a href="/about/">About</a></li>
          <li><a href="/contact/">Contact</a></li>
          <li><a href="/privacy/">Privacy Policy</a></li>
        </ul>
      </div>
      <div>
        <h2>Android app</h2>
        <ul>
          <li><a href="${esc(playUrl('footer_links'))}" rel="noopener" target="_blank" data-play="footer_links">BrainBuzz on Google Play</a></li>
          <li><a href="${PLAY_DEV_URL}" rel="noopener" target="_blank">More apps from us</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>${DISCLAIMER}</p>
      <p>© ${year} ${SITE_NAME}. Google Play and the Google Play logo are trademarks of Google LLC.</p>
    </div>
  </div>
</footer>`;
}

/**
 * @param page {{ path, title, description, body, jsonLd?, ogImage?, noindex?, scripts?, bodyClass?, fullTitle? }}
 * @param build {{ cssVersion, jsVersion, scriptHash }}
 */
export function renderPage(page, build) {
  const url = SITE_URL + page.path;
  const title = page.fullTitle ? page.title : `${page.title} | ${SITE_NAME}`;
  const og = SITE_URL + (page.ogImage || '/assets/img/og-image.jpg');
  const ld = (page.jsonLd || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  const scripts = ['/assets/js/main.js', ...(page.scripts || [])]
    .map((s) => `<script type="module" src="${s}?v=${build.jsVersion}"></script>`).join('\n');
  const csp = [
    "default-src 'self'",
    `script-src 'self' '${build.scriptHash}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#f7f5fc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#110e1c" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta name="application-name" content="${SITE_NAME}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(page.ogTitle || title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(APP_NAME)}: free brain games">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.ogTitle || title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/img/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="/assets/fonts/fredoka-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/styles.css?v=${build.cssVersion}">
<script>${THEME_SCRIPT}</script>
${ld}
</head>
<body${page.bodyClass ? ` class="${page.bodyClass}"` : ''}>
${header(page.path)}
<main id="main">
${page.body}
</main>
${footer()}
${scripts}
</body>
</html>
`;
}
