/** Every page on the site. The build renders each one through layout.js. */
import { esc, icon, playBadge, playButton, adSlot, AD_SLOTS } from './layout.js';
import { GAME_COPY } from './content.js';
import { brainMascot, trophy, gameIcon, goldStar, sparkleSvg, featureIcon, lightBulb, numberBlock } from '../assets/js/lib/art.js';
import { ALL_GAMES, LIBRARY, Category, SAMPLE_LEVELS, ruleText } from '../assets/js/engine/models.js';
import {
  SITE_URL, SITE_NAME, APP_NAME, PLAY_URL, PLAY_DEV_URL, APP_PRIVACY_URL, CONTACT_EMAIL, playUrl, DISCLAIMER, MORE_APPS, appUrl,
  PLAY_LOGO,
} from '../assets/js/lib/site.js';

const CATEGORY_ICON = { MEMORY: 'psychology', LOGIC: 'extension', NUMBERS: 'calculate', VISUAL: 'visibility', WORDS: 'abc' };

const gameArt = (g, cls = '') => `<span class="game-art${cls ? ` ${cls}` : ''}" style="--c:${g.color}">${icon(g.icon)}</span>`;

export function gameCard(g, headingTag = 'h3') {
  return `<a class="game-card reveal" href="/play/${g.slug}/" style="--c:${g.color}" data-category="${g.category}" data-game-card="${g.type}">
  <span class="top">${gameArt(g)}<${headingTag}>${g.title}</${headingTag}>${icon('chevron_right', 'chev')}</span>
  <p>${esc(g.tagline)}</p>
  <span class="foot"><span class="cat-chip">${icon(CATEGORY_ICON[g.category])}${Category[g.category]}</span><span class="best-chip" data-best="${g.type}">New</span></span>
</a>`;
}

function ctaBand(placement, title = 'Want more brain challenges?', text = 'Get BrainBuzz on Android to earn XP, keep your streak going and unlock achievements.') {
  return `<section class="section-tight"><div class="wrap"><div class="cta-band reveal">
  <img class="logo" src="/assets/img/logo-192.webp" width="72" height="72" alt="" loading="lazy">
  <div><h2>${title}</h2><p>${text}</p></div>
  <div>${playBadge(placement)}</div>
</div></div></section>`;
}

const breadcrumbs = (items) => `<nav aria-label="Breadcrumb"><ol class="breadcrumbs">${items
  .map(([label, href]) => (href ? `<li><a href="${href}">${label}</a></li>` : `<li aria-current="page">${label}</li>`)).join('')}</ol></nav>`;

const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + path })),
});

const appLd = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: APP_NAME,
  operatingSystem: 'Android',
  applicationCategory: 'GameApplication',
  applicationSubCategory: 'Puzzle',
  description: 'Daily brain puzzles, quick maths, memory games and fun logic challenges.',
  installUrl: PLAY_URL,
  url: PLAY_URL,
  image: `${SITE_URL}/assets/img/icon-512.png`,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const FAQ = [
  ['Is BrainBuzz free?', 'Yes. The browser games on this site are free to play, with no sign-up. The website shows some ads to help keep it free. The BrainBuzz Android app is also free to download from Google Play.'],
  ['Do my browser scores sync with the Android app?', 'No. Best scores you set here are saved only in this browser on this device. The Android app keeps its own progress on your phone, including XP, levels, streaks and achievements. The website and the app don’t share any data.'],
  ['Are these the same games as in the app?', 'The seven timed games and the Daily Challenge are the same as in the app, with the same rules and scoring. The app has Easy, Medium and Hard; on the website each of these games (and Sudoku) has 100 levels instead, with the same kinds of puzzles getting harder step by step. On any given date the Daily Challenge has the same 12 puzzles as the app. 2048 Merge Challenge, Word Detective and Sudoku Daily are extra games you’ll only find on this website.'],
  ['What extra do I get in the Android app?', 'The app tracks your progress over time: XP and levels, daily streaks with a training calendar, three daily missions, 20 achievements, detailed stats and an optional daily reminder. In the app, Easy is always free and Medium and Hard unlock by watching a short optional video. On this website all 100 levels are free; you unlock each one by passing the level before it.'],
  ['Can I play on iPhone, iPad or a computer?', 'Yes, in your browser. Every game on this site works on phones, tablets and computers, with touch, mouse or keyboard. The BrainBuzz app itself is available for Android on Google Play.'],
  ['Do I need an account?', 'No. There are no accounts on the website or in the app. The website saves your best scores in your browser’s local storage, and you can clear them at any time by clearing this site’s data.'],
  ['Will brain games make me smarter?', DISCLAIMER],
];

function faqSection() {
  return `<section class="section" id="faq"><div class="wrap">
  <div class="section-head reveal"><p class="kicker">FAQ</p><h2>Questions, answered</h2></div>
  <div class="faq">${FAQ.map(([q, a]) => `<details class="card reveal"><summary>${q}</summary><div class="answer"><p>${a}</p></div></details>`).join('')}</div>
</div></section>`;
}

/** A compact game card for the home page grid. */
function homeCard(g) {
  return `<a class="home-card reveal" href="/play/${g.slug}/" style="--c:${g.color};--cat:${CATEGORY_COLOR[g.category]}" data-game-card="${g.type}">
  <span class="home-card-top">${gameIcon(g.type, 'home-card-icon')}${icon('chevron_right', 'chev')}</span>
  <span class="home-card-text"><h3>${g.title}</h3><p>${esc(g.tagline)}</p></span>
  <span class="foot"><span class="cat-chip">${icon(CATEGORY_ICON[g.category])}${Category[g.category]}</span><span class="best-chip" data-best="${g.type}">New</span></span>
</a>`;
}

/** The wide Daily Challenge banner on the home page; main.js fills in today's date, result and countdown. */
function homeDaily() {
  return `<div class="home-daily reveal" data-daily-card>
  <span class="home-daily-watermark" aria-hidden="true">${icon('calendar_month')}</span>
  <span class="home-daily-icon">${icon('calendar_month')}</span>
  <div class="home-daily-text">
    <p class="home-daily-kicker">Daily Challenge</p>
    <h2>12 puzzles. One daily challenge.</h2>
    <p>12 hard puzzles from all seven games: maths, patterns, odd one out, words, memory and pipes. It’s the same set as the BrainBuzz app today, and a new set arrives at midnight.</p>
  </div>
  <ul class="home-daily-facts">
    <li data-daily-done hidden>${icon('check_circle')}<span></span></li>
    <li data-daily-today>${icon('calendar_month')}<span data-daily-date>Today</span></li>
    <li>${icon('timer')}<span>20–60 seconds per puzzle</span></li>
    <li data-daily-next hidden>${icon('refresh')}<span>Next set in <span class="countdown" data-countdown>--:--:--</span></span></li>
  </ul>
  <a class="hub-daily-cta" href="/play/daily-challenge/" data-daily-cta>${icon('play_arrow')}<span>Play today’s challenge</span>${icon('arrow_forward', 'arrow')}</a>
</div>`;
}

function homePage() {
  const strip = [
    ['trophy', 'Build Your Streak', 'Play daily and keep it going'],
    ['chart', 'Earn Stars and Levels', 'Get better with every game'],
    ['target', 'Beat Your Best', 'Improve your scores over time'],
    ['crown', 'Have Fun Daily', 'Quick, engaging brain breaks'],
  ];
  const body = `
<section class="home-hero">
  <div class="wrap-wide home-hero-grid">
    <div class="home-hero-copy">
      <span class="eyebrow"><span class="dot">${icon('bolt')}</span>11 free brain games · No sign-up</span>
      <h1><span class="home-h1-a">Train Your Brain.<svg class="home-burst" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><g stroke="#ffb000" stroke-width="4.5" stroke-linecap="round"><line x1="8" y1="6" x2="14" y2="16"/><line x1="18" y1="18" x2="30" y2="12"/><line x1="18" y1="28" x2="32" y2="28"/></g></svg></span>
        <span class="home-h1-b">Play Every Day.</span></h1>
      <p class="home-lead">Quick brain games, memory challenges, logic puzzles and maths games, free to play, right in your browser. Pick a game, choose your level and try to beat your best.</p>
      <div class="home-actions">
        <a class="home-btn primary" href="/play/">${icon('play_arrow')}<span>Play Games Now</span>${icon('arrow_forward', 'arrow')}</a>
        ${playButton('hero', 'Get BrainBuzz on Google Play', 'home-btn light')}
      </div>
      <ul class="home-checks">
        <li><span class="ok green">${icon('check')}</span>Free to play</li>
        <li><span class="ok purple">${icon('shield')}</span>No sign-up</li>
        <li><span class="ok amber">${icon('workspace_premium')}</span>A new daily challenge every day</li>
      </ul>
    </div>
    <div class="home-art" aria-hidden="true">
      <span class="home-blob"></span>
      ${sparkleSvg('home-spark s1', '#ffc531')}${sparkleSvg('home-spark s2', '#ffc531')}${sparkleSvg('home-spark s3', '#ffc531')}${sparkleSvg('home-spark s4', '#ffc531')}${sparkleSvg('home-spark s5', '#ffc531')}${sparkleSvg('home-spark s6', '#c4b5fd')}
      ${lightBulb('home-bulb')}
      <div class="home-phone"><img src="/assets/img/screens/app-home.webp" width="540" height="1085" alt="" fetchpriority="high" decoding="async"></div>
      ${numberBlock('1', '#9b6bff', '#5b3fe0', 'home-block b1')}${numberBlock('+', '#4fb3ff', '#2563eb', 'home-block b2')}${numberBlock('3', '#ffc04d', '#f08a00', 'home-block b3')}
      ${brainMascot({ id: 'homeM', cls: 'home-mascot', star: false, cap: true, openEyes: true, arms: false })}
      <span class="hand home-think">Think<br>Solve<br>Improve</span>
      <svg class="home-think-arrow" viewBox="0 0 40 50" focusable="false"><path d="M30 4c6 14 2 30-16 40m0 0 2-11m-2 11 11-2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
  </div>
  <div class="wrap-wide home-daily-wrap" id="daily">${homeDaily()}</div>
</section>

<section class="home-games" id="games"><div class="wrap-wide">
  <div class="section-head reveal"><p class="kicker">Play in your browser</p><h2>Pick your brain game</h2>
    <p>Ten games across memory, logic, numbers, visual skills and words: quick timed rounds with 100 levels each, plus 2048, Sudoku and a daily word puzzle.</p></div>
  <div class="home-grid-wrap"><div class="home-grid">${LIBRARY.map(homeCard).join('')}</div></div>
  <ul class="home-strip reveal">
    ${strip.map(([ic, title, sub]) => `<li>${featureIcon(ic)}<span><strong>${title}</strong><span>${sub}</span></span></li>`).join('')}
  </ul>
</div></section>

<section class="section-tight"><div class="wrap">
  <div class="section-head reveal"><p class="kicker">How it works</p><h2>Three steps to a sharper mind</h2></div>
  <div class="steps">
    <div class="card step reveal"><h3>Pick a game</h3><p>Memory, logic, numbers, visual or words. Each game takes just a few minutes.</p></div>
    <div class="card step reveal"><h3>Climb the levels</h3><p>Start at level 1 and unlock the next level each time you pass. Higher levels change the rules too, with longer patterns, hidden clues and trickier differences.</p></div>
    <div class="card step reveal"><h3>Beat your best</h3><p>Faster answers and combos score more. Your stars and best score for each level are saved in this browser.</p></div>
  </div>
</div></section>

<section class="home-apps" id="apps"><div class="wrap-wide">
  <div class="section-head reveal"><p class="kicker">More from our team</p><h2>Explore Our Apps</h2>
    <p>Simple, helpful apps for your phone, all free on Google Play.</p></div>
  <div class="apps-grid">${MORE_APPS.map((a) => `<a class="app-card reveal" href="${esc(appUrl(a.id, 'home_more_apps'))}" rel="noopener" target="_blank" style="--c:${a.color}">
    <img class="app-card-icon" src="/assets/img/apps/${a.icon}.webp" width="192" height="192" alt="" loading="lazy" decoding="async">
    <span class="app-card-text"><span class="app-card-tag">${a.tag}</span><h3>${esc(a.name)}</h3><p>${esc(a.text)}</p></span>
    <span class="app-card-cta">${PLAY_LOGO}Get it on Google Play${icon('arrow_forward', 'arrow')}</span>
  </a>`).join('')}</div>
  <div class="apps-more reveal"><a class="home-btn light" href="${PLAY_DEV_URL}" rel="noopener" target="_blank">${icon('apps')}<span>See all our apps on Google Play</span>${icon('arrow_forward', 'arrow')}</a></div>
</div></section>

${adSlot(AD_SLOTS.home)}
${faqSection()}
${ctaBand('home_cta')}`;
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  const siteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: APP_NAME,
    url: `${SITE_URL}/`,
  };
  return {
    path: '/',
    file: 'index.html',
    fullTitle: true,
    bodyClass: 'home',
    title: 'BrainBuzz: Free Daily Brain Games, Memory & Logic Puzzles',
    ogTitle: 'BrainBuzz: Train Your Brain. Play Every Day.',
    description: 'Play free brain games in your browser: memory, logic, maths, word and visual puzzles, plus a new Daily Challenge every day. Get BrainBuzz on Android.',
    body,
    jsonLd: [siteLd, appLd, faqLd],
    priority: '1.0',
  };
}

/** Category colours for the chips on the /play/ cards. */
const CATEGORY_COLOR = { MEMORY: '#6c4bf4', LOGIC: '#15803d', NUMBERS: '#7c3aed', VISUAL: '#c73565', WORDS: '#a15c00' };

function hubCard(g) {
  return `<a class="hub-card reveal" href="/play/${g.slug}/" style="--c:${g.color};--cat:${CATEGORY_COLOR[g.category]}" data-category="${g.category}" data-game-card="${g.type}">
  <span class="hub-card-main">${gameIcon(g.type, 'hub-icon')}
    <span class="hub-card-text"><span class="hub-card-title"><h3>${g.title}</h3>${icon('chevron_right', 'chev')}</span><p>${esc(g.tagline)}.</p></span></span>
  <span class="foot"><span class="cat-chip">${icon(CATEGORY_ICON[g.category])}${Category[g.category]}</span><span class="best-chip" data-best="${g.type}">New</span></span>
</a>`;
}

/** The Daily Challenge banner on /play/; main.js fills in today's result and the countdown. */
function hubDaily() {
  return `<div class="hub-daily reveal" data-daily-card>
  <span class="hub-daily-icon">${icon('calendar_month')}</span>
  <div class="hub-daily-text">
    <h2>Daily Challenge</h2>
    <p>12 puzzles from all seven games. A new set arrives every day!</p>
    <div class="hub-daily-pills">
      <span class="hub-pill done" data-daily-done hidden>${icon('check_circle')}<span></span></span>
      <span class="hub-pill" data-daily-today>${icon('calendar_month')}<span data-daily-date>Today</span></span>
      <span class="hub-pill">${icon('timer')}20–60 seconds per puzzle</span>
      <span class="hub-pill" data-daily-next hidden>${icon('schedule')}<span>New set in <span class="countdown" data-countdown>--:--:--</span></span></span>
    </div>
  </div>
  ${goldStar({ id: 'hdS1', cls: 'hub-daily-star s1' })}${goldStar({ id: 'hdS2', cls: 'hub-daily-star s2' })}
  <a class="hub-daily-cta" href="/play/daily-challenge/" data-daily-cta>${icon('play_arrow')}<span>Play today’s challenge</span>${icon('arrow_forward', 'arrow')}</a>
</div>`;
}

function playHub() {
  const filters = [['', 'All games', 'apps'], ...Object.keys(Category).map((k) => [k, Category[k], CATEGORY_ICON[k]])];
  const features = [
    ['bolt', 'amber', '10 fun games', 'Boost your brain'],
    ['emoji_events', 'violet', 'Daily challenge', 'New puzzles every day'],
    ['bar_chart', 'violet', 'Track progress', 'See your improvement'],
  ];
  const body = `
<div class="hub">
<section class="hub-hero"><div class="wrap">
  <div class="hub-hero-text">
    ${breadcrumbs([['Home', '/'], ['Play Games']])}
    <h1>Play free <span class="hub-grad">brain games</span></h1>
    <p class="hub-lead">Train your memory, logic, maths and more with fun games.</p>
    <ul class="hub-features">
      ${features.map(([ic, tone, title, sub]) => `<li><span class="hub-feature-icon ${tone}">${icon(ic)}</span><span><strong>${title}</strong><span>${sub}</span></span></li>`).join('')}
    </ul>
  </div>
  <div class="hub-hero-art" aria-hidden="true">
    ${brainMascot({ id: 'hubM', cls: 'hub-mascot', bulb: true, star: false })}
    <span class="hand hub-hand-top">Small Games<br>Big Brain!</span>
    <svg class="hub-hand-arrow" viewBox="0 0 60 40" aria-hidden="true" focusable="false"><path d="M52 4C50 22 36 32 10 30m0 0 9-7m-9 7 9 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
</div></section>
<section class="hub-daily-wrap"><div class="wrap">${hubDaily()}</div></section>
<section class="hub-games"><div class="wrap">
  <h2 class="visually-hidden">All games</h2>
  <div class="hub-filters" role="group" aria-label="Filter games by category" data-filters hidden>
    ${filters.map(([k, label, ic], i) => `<button type="button" class="hub-filter" data-filter="${k}" aria-pressed="${i === 0}">${icon(ic)}${label}</button>`).join('')}
  </div>
  <div class="hub-grid-wrap"><div class="hub-grid" data-game-grid>
    ${LIBRARY.map(hubCard).join('')}
    <div class="hub-deco" aria-hidden="true" data-grid-deco>
      <span class="hand">Keep playing,<br>Keep growing!</span>
      <svg class="hub-deco-arrow" viewBox="0 0 60 30" aria-hidden="true" focusable="false"><path d="M4 8c10 18 32 20 50 8m0 0-10-1m10 1-4 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      ${trophy({ id: 'hubT', cls: 'hub-trophy' })}
    </div>
  </div></div>
  <p class="hub-note">${icon('help')}Best scores are saved only in this browser. They don’t transfer to the Android app, and clearing this site’s data removes them.</p>
</div></section>
</div>
${ctaBand('play_hub_cta')}`;
  return {
    path: '/play/',
    file: 'play/index.html',
    title: 'Play Free Brain Games Online: Memory, Logic & Maths',
    description: 'Ten free brain games and a Daily Challenge, from Memory Matrix and Logic Path to 2048 Merge Challenge, Word Detective and Sudoku Daily. No sign-up.',
    body,
    jsonLd: [
      breadcrumbLd([['Home', '/'], ['Play Games', '/play/']]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: ALL_GAMES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.title, url: `${SITE_URL}/play/${g.slug}/` })),
      },
    ],
    priority: '0.9',
  };
}

function gamePage(g) {
  const copy = GAME_COPY[g.type];
  const others = LIBRARY.filter((o) => o.type !== g.type).slice(0, 3);
  const ruleList = g.type === 'DAILY' || g.levels === false;
  const levels = ruleList
    ? `<ul>${g.rules().map((r) => `<li>${r}</li>`).join('')}</ul>`
    : `<p>There are 100 levels. Level 1 is gentle and every level after it is a little harder. Pass a level to unlock the next one; you earn up to three stars per level. Here’s how it ramps up:</p>
    ${SAMPLE_LEVELS.map((lv) => `<h3 style="font-size:1rem;margin:12px 0 4px">${lv.label}</h3><ul>${g.rules(lv).slice(0, -1).map((r) => `<li>${ruleText(r)}</li>`).join('')}</ul>`).join('')}`;
  const body = `
<section class="page-hero" style="padding-bottom:18px"><div class="wrap">
  ${breadcrumbs([['Home', '/'], ['Play Games', '/play/'], [g.title]])}
  <div class="game-hero">${gameArt(g, 'xl')}<div><h1>${g.title}</h1><p>${esc(g.tagline)}</p></div></div>
</div></section>
<section><div class="wrap game-layout">
  <section class="stage" id="game" data-game="${g.type}" style="--c:${g.color}" aria-label="${g.title} game" tabindex="-1">
    <div class="stage-loading"><div class="spinner" aria-hidden="true"></div><p>Loading ${g.title}…</p>
      <noscript><p><strong>${g.title} needs JavaScript.</strong> Turn it on in your browser to play, or get the BrainBuzz app on Google Play.</p></noscript></div>
  </section>
  <aside class="side-stack" aria-label="About this game">
    <div class="card"><h2>How to play</h2><ol>${g.howToPlay.map((s) => `<li>${s}</li>`).join('')}</ol></div>
    <div class="card"><h2>Scoring</h2><p class="muted" style="margin:0 0 8px">${copy.scoring}</p><p class="muted" style="margin:0">${copy.hint}</p></div>
    <div class="app-mini">
      <div class="row"><img class="logo" src="/assets/img/logo-192.webp" width="52" height="52" alt="" loading="lazy"><h2>${g.web ? 'More brain games on Android' : `Play ${g.title} on Android`}</h2></div>
      <p>${g.web ? `${g.title} is a website game. The free BrainBuzz app has seven more brain games, with XP, daily streaks and achievements.` : 'Earn XP, build daily streaks and unlock achievements in the free BrainBuzz app.'}</p>
      <div>${playBadge(`game_side_${g.slug}`)}</div>
    </div>
  </aside>
</div></section>
<section class="section-tight"><div class="wrap">
  <div class="prose">
    <h2>About ${g.title}</h2>
    ${copy.intro.map((p) => `<p>${p}</p>`).join('')}
    <h2>${ruleList ? 'The rules' : 'Levels 1 to 100'}</h2>
    ${levels}
    <h2>Tips</h2>
    <ul>${copy.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
  </div>
</div></section>
${adSlot(AD_SLOTS.game)}
<section class="section-tight"><div class="wrap">
  <div class="section-head reveal" style="margin-bottom:24px"><h2>More brain games</h2></div>
  <div class="game-grid">${others.map((o) => gameCard(o)).join('')}</div>
</div></section>
${ctaBand(`game_cta_${g.slug}`)}`;
  return {
    path: `/play/${g.slug}/`,
    file: `play/${g.slug}/index.html`,
    title: copy.metaTitle,
    description: copy.description,
    body,
    scripts: ['/assets/js/games/boot.js'],
    jsonLd: [
      breadcrumbLd([['Home', '/'], ['Play Games', '/play/'], [g.title, `/play/${g.slug}/`]]),
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: `${g.title} by ${SITE_NAME}`,
        url: `${SITE_URL}/play/${g.slug}/`,
        description: copy.description,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
    priority: '0.8',
  };
}

function aboutPage() {
  const rows = [
    ['7 brain games and the Daily Challenge', 'yes', 'yes'],
    ['2048 Merge Challenge, Word Detective and Sudoku Daily', 'yes', 'no'],
    ['Difficulty', '100 levels per game, unlocked as you pass', 'Easy, Medium and Hard; Medium and Hard after a short optional video'],
    ['Hints', 'Free', 'Some free; more with optional videos'],
    ['Best scores', 'In this browser', 'yes'],
    ['XP, levels and daily missions', 'no', 'yes'],
    ['Streaks and training calendar', 'no', 'yes'],
    ['20 achievements', 'no', 'yes'],
    ['Stats and accuracy by game', 'no', 'yes'],
    ['Daily reminder', 'no', 'yes'],
  ];
  const cell = (v) => (v === 'yes' ? `${icon('check_circle')}<span class="visually-hidden">Yes</span>` : v === 'no' ? `<span aria-hidden="true">—</span><span class="visually-hidden">No</span>` : v);
  const body = `
<section class="page-hero"><div class="wrap">
  ${breadcrumbs([['Home', '/'], ['About']])}
  <h1>About BrainBuzz</h1>
  <p class="lead">BrainBuzz: Daily Challenge is a colourful collection of quick brain games for Android. This website brings the same games to your browser, plus three puzzles of its own.</p>
</div></section>
<section class="section-tight" style="padding-top:0"><div class="wrap prose">
  <h2>Think today. Better tomorrow.</h2>
  <p>BrainBuzz is built around short, satisfying puzzles you can finish in a few minutes: a memory test on the bus, a logic puzzle with your coffee, a maths sprint before work. On this website the seven timed games and Sudoku each have 100 levels that start gentle and get harder, and higher levels change the rules, not just the speed.</p>
  <p>The Daily Challenge gives everyone the same 12 puzzles each day, so you can compare scores with friends whether they play in the app or here on the web.</p>
  <h2>The games</h2>
  <ul>${ALL_GAMES.map((g) => `<li><a href="/play/${g.slug}/"><strong>${g.title}</strong></a> (${Category[g.category]}): ${esc(g.tagline)}.</li>`).join('')}</ul>
  <h2>Designed to be fair and friendly</h2>
  <ul>
    <li><strong>Every game explains itself.</strong> Each one starts with a short how-to and shows the rule or the right answer when you miss, so you learn as you go.</li>
    <li><strong>Nothing relies on colour alone.</strong> Right and wrong answers, lit tiles and connected pipes also use icons, outlines or dots.</li>
    <li><strong>Mistakes ease off, they don’t pile on.</strong> In Memory Matrix a miss makes the next round shorter; in Quick Math Rush the sums get easier after two misses.</li>
    <li><strong>No accounts.</strong> Your scores stay in your browser. The website is supported by ads from Google; the <a href="/privacy/">Privacy Policy</a> explains how they use cookies.</li>
  </ul>
  <h2>Website and Android app</h2>
  <p>The seven timed games and the Daily Challenge use the same rules, levels and scoring as the app. 2048 Merge Challenge, Word Detective and Sudoku Daily are only on the website. The app adds everything that tracks your progress over time.</p>
</div>
<div class="wrap" style="margin-top:8px">
  <div class="card" style="max-width:760px;overflow-x:auto">
    <table class="compare">
      <caption class="visually-hidden">What the website and the Android app include</caption>
      <thead><tr><th scope="col">Feature</th><th scope="col">Website</th><th scope="col">Android app</th></tr></thead>
      <tbody>${rows.map(([f, w, a]) => `<tr><th scope="row">${f}</th><td>${cell(w)}</td><td>${cell(a)}</td></tr>`).join('')}</tbody>
    </table>
  </div>
</div>
<div class="wrap prose" style="margin-top:28px">
  <p>Website scores and app progress are separate: nothing you do here is sent to the app, and nothing from the app appears here.</p>
  <h2>Who makes BrainBuzz</h2>
  <p>BrainBuzz is made by an independent developer. You can find our other apps on <a href="${PLAY_DEV_URL}" rel="noopener" target="_blank">our Google Play developer page</a>, and reach us any time through the <a href="/contact/">contact page</a>.</p>
  <h2>A note on brain training</h2>
  <p>${DISCLAIMER}</p>
</div></section>
${ctaBand('about_cta', 'Ready to give your brain a buzz?', 'Play in your browser now, or get the free app for XP, streaks and achievements.')}`;
  return {
    path: '/about/',
    file: 'about/index.html',
    title: 'About BrainBuzz: Brain Games for Android & Web',
    description: 'BrainBuzz: Daily Challenge is a collection of quick memory, logic, maths and word games for Android, now playable free in your browser too.',
    body,
    jsonLd: [breadcrumbLd([['Home', '/'], ['About', '/about/']]), appLd],
    priority: '0.6',
  };
}

function privacyPage() {
  const body = `
<section class="page-hero"><div class="wrap">
  ${breadcrumbs([['Home', '/'], ['Privacy Policy']])}
  <h1>Privacy Policy</h1>
  <p class="lead">The short version: we don’t ask for your personal information, and your game scores stay in your browser. This website may show ads from Google AdSense, and Google may collect information to serve and measure those ads, as explained below.</p>
  <p class="muted">Last updated: 23 October 2026</p>
</div></section>
<section class="section-tight" style="padding-top:0"><div class="wrap prose">
  <p>This policy covers the website at <strong>brainbuzzgame.com</strong>. The BrainBuzz Android app has its own privacy policy, which you can read on <a href="${APP_PRIVACY_URL}" rel="noopener" target="_blank">the BrainBuzz app privacy policy page</a>. It is also linked from the app’s Google Play listing.</p>

  <h2>What we collect</h2>
  <ul>
    <li>No accounts, sign-ups or forms. We never ask for your name, email address or other contact details on this website.</li>
    <li>We don’t run our own analytics or tracking, and we don’t sell personal information.</li>
    <li>Apart from Google’s advertising services described below, the site’s pages, fonts, scripts and images are served from this site.</li>
  </ul>

  <h2>What’s stored in your browser</h2>
  <p>To make the games nicer to use, the website saves a few things in your browser’s <em>local storage</em>. They stay on your device, are never sent to us, and you can delete them at any time by clearing this site’s data in your browser settings.</p>
  <ul>
    <li><code>bb-theme</code>: whether you chose the light or dark theme.</li>
    <li><code>bb-progress-v1</code>: your best score for each game and level, the level you last picked, which levels you’ve unlocked and the stars you earned, and your Daily Challenge results for recent days.</li>
  </ul>
  <p>This data doesn’t sync with the BrainBuzz Android app or with other browsers and devices, and it isn’t shared with advertisers.</p>

  <h2>Advertising (Google AdSense)</h2>
  <p>To help keep the browser games free, this website may display ads provided by <strong>Google AdSense</strong>, an advertising service of Google. When a page that can show ads loads, your browser contacts Google’s servers directly to request an ad.</p>
  <ul>
    <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
    <li>Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the internet.</li>
    <li>Google and its advertising partners may also use cookies or similar technologies (such as device identifiers or local storage) to measure ads, limit how often you see the same ad, and detect fraud and abuse. Some of these cookies may be set under this website’s address.</li>
  </ul>
  <p>Depending on their services, your settings and the law where you live, Google and its partners may collect or receive information such as your IP address, browser and device information, the page you’re viewing, cookie and other identifiers, your approximate location (derived from your IP address) and how you interact with ads, for example whether you see or click one. This information goes from your browser to Google and its partners. BrainBuzz doesn’t collect or store it; we only see aggregated reports from Google AdSense, such as how many ads were shown or clicked, which don’t identify you.</p>
  <p>To learn more about how Google handles this information, see:</p>
  <ul>
    <li><a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">How Google uses information from sites or apps that use its services</a></li>
    <li><a href="https://policies.google.com/technologies/ads" rel="noopener" target="_blank">How Google uses cookies in advertising</a></li>
    <li><a href="https://policies.google.com/privacy" rel="noopener" target="_blank">Google Privacy Policy</a></li>
  </ul>

  <h2>Personalised ads and consent</h2>
  <p>Where permitted, ads may be <em>personalised</em>, meaning they’re chosen using information about your interests and your earlier activity on this and other websites. Ads that aren’t personalised are chosen using context, such as the page you’re on and your approximate location, but may still use cookies or similar technologies for purposes such as frequency capping, aggregated reporting and fraud prevention.</p>
  <p>Where the law requires your consent before cookies or personal data are used for advertising, for example in the European Economic Area, the United Kingdom and Switzerland, you’ll be shown a consent message provided through Google, and Google’s advertising technology will act on the choices you make there.</p>

  <h2>Your choices</h2>
  <ul>
    <li>Opt out of personalised advertising from Google, or change how Google personalises ads, in <a href="https://www.google.com/settings/ads" rel="noopener" target="_blank">Google Ads Settings</a>.</li>
    <li>Opt out of some other third-party vendors’ use of cookies for personalised advertising at <a href="https://www.aboutads.info/choices/" rel="noopener" target="_blank">www.aboutads.info</a> or, in Europe, <a href="https://www.youronlinechoices.eu/" rel="noopener" target="_blank">www.youronlinechoices.eu</a>.</li>
    <li>Block or delete cookies, or limit cross-site tracking, in your browser settings.</li>
  </ul>
  <p>These choices work separately, and no single setting turns off everything. Opting out of personalised ads doesn’t stop ads from appearing; you’ll still see ads that aren’t personalised. Many opt-outs are stored in a cookie, so they apply only to the browser and device where you set them, and clearing your cookies can undo them.</p>

  <h2>Hosting</h2>
  <p>Like any website, our hosting provider receives technical information when your browser requests a page, such as your IP address, browser type and the page requested. It uses this to deliver the site and keep it secure. We don’t use it to identify you.</p>

  <h2>Links to Google Play</h2>
  <p>Buttons such as “Get it on Google Play” open the BrainBuzz listing on Google Play. These links include a label naming the part of our site you came from (for example <code>utm_campaign=hero</code>), which helps us see which pages lead to app installs. They contain no personal information. Google’s own <a href="https://policies.google.com/privacy" rel="noopener" target="_blank">privacy policy</a> applies once you’re on Google Play.</p>

  <h2>Children</h2>
  <p>BrainBuzz is a general-audience website. Its games are suitable for all ages, but the site isn’t directed at children under 13, and we don’t knowingly collect personal information from children. If you believe a child has provided personal information through this website, please contact us.</p>

  <h2>Changes</h2>
  <p>If this policy changes we’ll update this page and the date at the top.</p>

  <h2>Contact</h2>
  <p>Questions about privacy? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
</div></section>`;
  return {
    path: '/privacy/',
    file: 'privacy/index.html',
    title: 'Privacy Policy',
    description: 'The brainbuzzgame.com privacy policy: no accounts, best scores kept in your browser, and how Google AdSense ads use cookies. Links to the app’s policy.',
    body,
    jsonLd: [breadcrumbLd([['Home', '/'], ['Privacy Policy', '/privacy/']])],
    priority: '0.3',
  };
}

function contactPage() {
  const subject = encodeURIComponent('BrainBuzz feedback');
  const body = `
<section class="page-hero"><div class="wrap">
  ${breadcrumbs([['Home', '/'], ['Contact']])}
  <h1>Contact us</h1>
  <p class="lead">Found a bug, have an idea for a new game or just want to say hi? We read every message.</p>
</div></section>
<section class="section-tight" style="padding-top:0"><div class="wrap">
  <div class="contact-grid">
    <div class="card info-card">
      <span class="game-art" style="--c:#6c4bf4">${icon('mail')}</span>
      <h2>Email</h2>
      <p>The best way to reach us. We usually reply within a few days.</p>
      <p><a class="btn btn-primary" href="mailto:${CONTACT_EMAIL}?subject=${subject}">${icon('mail')}<span>${CONTACT_EMAIL}</span></a></p>
    </div>
    <div class="card info-card">
      <span class="game-art" style="--c:#0fb5a6">${icon('help')}</span>
      <h2>Reporting a problem?</h2>
      <p>It helps a lot if you tell us:</p>
      <ul class="muted" style="margin:0;padding-left:1.2em">
        <li>the game and level</li>
        <li>whether it was the website or the Android app</li>
        <li>your device and browser (or app version)</li>
        <li>what you expected and what happened</li>
      </ul>
    </div>
    <div class="card info-card">
      <span class="game-art" style="--c:#ffb23f">${icon('star')}</span>
      <h2>Enjoying BrainBuzz?</h2>
      <p>A rating or review on Google Play helps other people find the app.</p>
      <p><a class="btn btn-secondary" href="${esc(playUrl('contact_review'))}" rel="noopener" target="_blank" data-play="contact_review">${PLAY_LOGO}<span>Open Google Play</span></a></p>
    </div>
  </div>
  <p class="muted" style="margin-top:20px;font-size:.92rem">This site has no contact form, so nothing is collected here. Your email app opens with our address filled in.</p>
</div></section>`;
  return {
    path: '/contact/',
    file: 'contact/index.html',
    title: 'Contact',
    description: 'Get in touch with the BrainBuzz team: report a bug, suggest a game or share feedback about the website or the Android app.',
    body,
    jsonLd: [breadcrumbLd([['Home', '/'], ['Contact', '/contact/']])],
    priority: '0.4',
  };
}

function notFoundPage() {
  const body = `
<section class="notfound"><div class="wrap">
  <p class="code text-gradient">404</p>
  <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">Lost your train of thought?</h1>
  <p class="lead muted" style="max-width:34em;margin:0 auto 24px">We couldn’t find that page. It may have moved, or the link may be mistyped. Here are some good places to start again:</p>
  <div class="btn-row" style="justify-content:center">
    <a class="btn btn-primary btn-lg" href="/play/">${icon('play_arrow')}<span>Play games</span></a>
    <a class="btn btn-secondary btn-lg" href="/play/daily-challenge/">${icon('calendar_month')}<span>Today’s Daily Challenge</span></a>
    <a class="btn btn-ghost btn-lg" href="/">${icon('arrow_back')}<span>Home</span></a>
  </div>
</div></section>`;
  return {
    path: '/404.html',
    file: '404.html',
    title: 'Page not found',
    description: 'This page doesn’t exist. Play a free brain game or head back to the BrainBuzz homepage.',
    body,
    noindex: true,
    sitemap: false,
    ads: false,
  };
}

export function allPages() {
  return [homePage(), playHub(), ...ALL_GAMES.map(gamePage), aboutPage(), privacyPage(), contactPage(), notFoundPage()];
}
