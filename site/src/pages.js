/** Every page on the site. The build renders each one through layout.js. */
import { esc, icon, playBadge, playButton, adSlot, AD_SLOTS } from './layout.js';
import { GAME_COPY } from './content.js';
import { GAMES, LIBRARY, Category, DIFFICULTIES } from '../assets/js/engine/models.js';
import {
  SITE_URL, SITE_NAME, APP_NAME, PLAY_URL, PLAY_DEV_URL, APP_PRIVACY_URL, CONTACT_EMAIL, playUrl, DISCLAIMER,
} from '../assets/js/lib/site.js';

const CATEGORY_ICON = { MEMORY: 'psychology', LOGIC: 'extension', NUMBERS: 'calculate', VISUAL: 'visibility', WORDS: 'abc' };

const SCREENS = [
  { n: 1, alt: 'BrainBuzz app home screen with a streak card, the Daily Challenge and brain games' },
  { n: 2, alt: 'Build your streak: the weekly streak tracker and streak milestones in the BrainBuzz app' },
  { n: 3, alt: 'Track your progress: level, total XP, games played, accuracy and personal bests' },
  { n: 4, alt: 'Challenge yourself daily: a Daily Challenge result with score, accuracy and XP earned' },
  { n: 5, alt: 'Train your brain anywhere: a Number Sequence question in the BrainBuzz app' },
  { n: 6, alt: 'BrainBuzz games: number puzzles, quick maths, memory games and logic challenges' },
];

const screen = (n, cls = '', eager = false) => {
  const s = SCREENS[n - 1];
  return `<img src="/assets/img/screens/store-${n}.webp" width="540" height="${n === 4 ? 810 : 959}" alt="${esc(s.alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${cls ? ` class="${cls}"` : ''}>`;
};

const gameArt = (g, cls = '') => `<span class="game-art${cls ? ` ${cls}` : ''}" style="--c:${g.color}">${icon(g.icon)}</span>`;

export function gameCard(g, headingTag = 'h3') {
  return `<a class="game-card reveal" href="/play/${g.slug}/" style="--c:${g.color}" data-category="${g.category}" data-game-card="${g.type}">
  <span class="top">${gameArt(g)}<${headingTag}>${g.title}</${headingTag}>${icon('chevron_right', 'chev')}</span>
  <p>${esc(g.tagline)}</p>
  <span class="foot"><span class="cat-chip">${icon(CATEGORY_ICON[g.category])}${Category[g.category]}</span><span class="best-chip" data-best="${g.type}">New</span></span>
</a>`;
}

function dailyCard(headingTag = 'h2') {
  return `<div class="daily-card reveal" data-daily-card>
  <div style="position:relative;z-index:1;display:grid;gap:14px">
    <div class="daily-head"><span class="bubble-lg">${icon('calendar_month')}</span>
      <div><${headingTag}>Daily Challenge</${headingTag}><p data-daily-status>12 mixed puzzles, new every day</p></div></div>
    <p>Quick maths and number patterns that ramp up from Easy to Hard. It’s the same 12 puzzles the BrainBuzz app has today, and a new set arrives at midnight.</p>
    <div class="daily-meta">
      <span class="pill pill-white">${icon('schedule')}<span data-daily-date>Today</span></span>
      <span class="pill pill-white">${icon('timer')}20 seconds per puzzle</span>
      <span class="pill pill-white" data-daily-next hidden>${icon('refresh')}<span>Next set in <span class="countdown" data-countdown>--:--:--</span></span></span>
    </div>
  </div>
  <div class="daily-actions"><a class="btn btn-light btn-lg" href="/play/daily-challenge/" data-daily-cta>${icon('play_arrow')}<span>Play today’s challenge</span></a></div>
</div>`;
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
  ['Are these the same games as in the app?', 'Yes. It’s the same seven games plus the Daily Challenge, with the same rules, difficulty levels and scoring. On any given date the Daily Challenge has the same 12 puzzles as the app.'],
  ['What extra do I get in the Android app?', 'The app tracks your progress over time: XP and levels, daily streaks with a training calendar, three daily missions, 20 achievements, detailed stats and an optional daily reminder. In the app, Easy is always free and Medium and Hard unlock by watching a short optional video. On this website every level is free.'],
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

const APP_FEATURES = [
  ['bolt', 'XP and levels', 'Earn XP for every game, with a bonus for the Daily Challenge, and watch your level climb.'],
  ['local_fire_department', 'Streaks and a training calendar', 'See every day you trained and keep your streak alive.'],
  ['task_alt', 'Three daily missions', 'Small goals each day, with bonus XP when you complete them.'],
  ['emoji_events', '20 achievements', 'Unlock badges such as Week Warrior, Math Whiz and Pathfinder.'],
  ['bar_chart', 'Stats and personal bests', 'Accuracy by game, top scores and your recent games in one place.'],
  ['notifications', 'Daily reminder', 'An optional nudge to play, at a time you choose.'],
];

function appPromo(placement) {
  return `<section class="section" id="app"><div class="wrap"><div class="promo reveal">
  <div class="promo-grid">
    <div>
      <p class="kicker">BrainBuzz for Android</p>
      <h2>Take the full BrainBuzz experience with you</h2>
      <p>The browser games are a great warm-up. The free Android app remembers how you’re doing and gives you a reason to come back every day.</p>
      <ul class="promo-list">${APP_FEATURES.map(([i, t, d]) => `<li><span class="tick">${icon(i)}</span><span><strong>${t}</strong><span>${d}</span></span></li>`).join('')}</ul>
      <div class="btn-row" style="align-items:center">${playBadge(placement)}</div>
      <p style="margin:14px 0 0;font-size:.9rem">No account needed. In the app, your progress is stored on your phone.</p>
    </div>
    <div class="shots" tabindex="0" aria-label="Screenshots of the BrainBuzz app">${[1, 2, 3, 4, 5].map((n) => `<figure>${screen(n)}</figure>`).join('')}</div>
  </div>
</div></div></section>`;
}

function homePage() {
  const body = `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow"><span class="dot">${icon('bolt')}</span>8 free brain games · No sign-up</span>
      <h1>Give Your Brain a Daily <span class="text-gradient">Buzz</span> 🧠</h1>
      <p class="lead">Quick brain games, memory challenges, logic puzzles and maths games you can play right here in your browser. Pick a game, choose your level and try to beat your best.</p>
      <div class="btn-row">
        <a class="btn btn-primary btn-lg" href="/play/">${icon('play_arrow')}<span>Play Games Now</span></a>
        ${playButton('hero')}
      </div>
      <ul class="hero-facts">
        <li>${icon('check_circle')}Free to play</li>
        <li>${icon('check_circle')}Easy, Medium and Hard</li>
        <li>${icon('check_circle')}A new Daily Challenge every day</li>
      </ul>
    </div>
    <div class="hero-art">
      <div class="phone phone-back left">${screen(2)}</div>
      <div class="phone phone-back right">${screen(3)}</div>
      <div class="phone phone-main">${screen(1, '', true)}</div>
      <span class="float f1" aria-hidden="true"><span class="bubble" style="background:#4f5fe0">${icon('psychology')}</span>Memory games</span>
      <span class="float f2" aria-hidden="true"><span class="bubble" style="background:#16825a">${icon('extension')}</span>Logic puzzles</span>
      <span class="float f3" aria-hidden="true"><span class="bubble" style="background:#e06a1b">${icon('calculate')}</span>Quick maths</span>
    </div>
  </div>
</section>

<section class="section-tight" id="daily"><div class="wrap">${dailyCard()}</div></section>

<section class="section" id="games"><div class="wrap">
  <div class="section-head reveal"><p class="kicker">Play in your browser</p><h2>Pick your brain game</h2>
    <p>Seven games across memory, logic, numbers, visual skills and words. Every one has three difficulty levels with their own rules.</p></div>
  <div class="game-grid">${LIBRARY.map((g) => gameCard(g)).join('')}</div>
  <div class="btn-row" style="justify-content:center;margin-top:28px"><a class="btn btn-secondary btn-lg" href="/play/">${icon('apps')}<span>See all games</span></a></div>
</div></section>

<section class="section-tight"><div class="wrap">
  <div class="section-head reveal"><p class="kicker">How it works</p><h2>Three steps to a sharper mind</h2></div>
  <div class="steps">
    <div class="card step reveal"><h3>Pick a game</h3><p>Memory, logic, numbers, visual or words. Each game takes just a few minutes.</p></div>
    <div class="card step reveal"><h3>Choose your level</h3><p>Easy, Medium or Hard. Harder levels change the rules too, with longer patterns, hidden clues and trickier differences.</p></div>
    <div class="card step reveal"><h3>Beat your best</h3><p>Faster answers and combos score more. Your best score for each level is saved in this browser.</p></div>
  </div>
</div></section>

${appPromo('home_promo')}

<section class="section-tight"><div class="wrap">
  <div class="section-head reveal"><p class="kicker">Why BrainBuzz</p><h2>Made for quick, happy brain breaks</h2></div>
  <div class="feature-grid">
    <div class="card feature reveal" style="--c:#ff8a3d"><span class="fi">${icon('timer')}</span><h3>Quick sessions</h3><p>Most games take one to three minutes, so they fit into any break.</p></div>
    <div class="card feature reveal" style="--c:#6c4bf4"><span class="fi">${icon('apps')}</span><h3>Real variety</h3><p>Memory, logic, numbers, visual and word puzzles, all in one place.</p></div>
    <div class="card feature reveal" style="--c:#16825a"><span class="fi">${icon('trending_up')}</span><h3>Levels that matter</h3><p>Hard brings ordered sequences, decoy pipes, hidden clues and subtler differences.</p></div>
    <div class="card feature reveal" style="--c:#0fb5a6"><span class="fi">${icon('calendar_month')}</span><h3>Fresh every day</h3><p>The Daily Challenge changes at midnight, your time, so there’s always something new.</p></div>
    <div class="card feature reveal" style="--c:#c73565"><span class="fi">${icon('shield')}</span><h3>No sign-up</h3><p>No accounts or personal details. Your best scores stay in this browser.</p></div>
    <div class="card feature reveal" style="--c:#4ea8ff"><span class="fi">${icon('devices')}</span><h3>Plays anywhere</h3><p>Phone, tablet or desktop, with touch, mouse or keyboard.</p></div>
  </div>
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
    title: 'BrainBuzz: Free Daily Brain Games, Memory & Logic Puzzles',
    ogTitle: 'BrainBuzz: Give Your Brain a Daily Buzz',
    description: 'Play free brain games in your browser: memory, logic, maths, word and visual puzzles, plus a new Daily Challenge every day. Get BrainBuzz on Android.',
    body,
    jsonLd: [siteLd, appLd, faqLd],
    priority: '1.0',
  };
}

function playHub() {
  const filters = [['', 'All games', 'apps'], ...Object.keys(Category).map((k) => [k, Category[k], CATEGORY_ICON[k]])];
  const body = `
<section class="page-hero"><div class="wrap">
  ${breadcrumbs([['Home', '/'], ['Play Games']])}
  <h1>Play free brain games</h1>
  <p class="lead">Seven games and a Daily Challenge, ready to play in your browser. Choose a game, pick Easy, Medium or Hard, and see how far you can get.</p>
</div></section>
<section class="section-tight" style="padding-top:0"><div class="wrap">${dailyCard()}</div></section>
<section class="section-tight"><div class="wrap">
  <h2 class="visually-hidden">All games</h2>
  <div class="filter-row" role="group" aria-label="Filter games by category" data-filters hidden>
    ${filters.map(([k, label, ic], i) => `<button type="button" class="filter-chip" data-filter="${k}" aria-pressed="${i === 0}">${icon(ic)}${label}</button>`).join('')}
  </div>
  <div class="game-grid" data-game-grid>${LIBRARY.map((g) => gameCard(g, 'h3')).join('')}</div>
  <p class="muted center" style="margin-top:20px;font-size:.92rem">Best scores are saved only in this browser. They don’t transfer to the Android app, and clearing this site’s data removes them.</p>
</div></section>
${ctaBand('play_hub_cta')}`;
  return {
    path: '/play/',
    file: 'play/index.html',
    title: 'Play Free Brain Games Online: Memory, Logic & Maths',
    description: 'Seven free brain games and a Daily Challenge: Memory Matrix, Memory Match, Logic Path, Odd One Out, Word Scramble, Number Sequence Master and Quick Math Rush.',
    body,
    jsonLd: [
      breadcrumbLd([['Home', '/'], ['Play Games', '/play/']]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: GAMES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.title, url: `${SITE_URL}/play/${g.slug}/` })),
      },
    ],
    priority: '0.9',
  };
}

function gamePage(g) {
  const copy = GAME_COPY[g.type];
  const others = LIBRARY.filter((o) => o.type !== g.type).slice(0, 3);
  const levels = g.type === 'DAILY'
    ? `<ul>${g.rules().map((r) => `<li>${r}</li>`).join('')}</ul>`
    : DIFFICULTIES.map((d) => `<h3 style="font-size:1rem;margin:12px 0 4px">${d.label}</h3><ul>${g.rules(d.name).map((r) => `<li>${r}</li>`).join('')}</ul>`).join('');
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
      <div class="row"><img class="logo" src="/assets/img/logo-192.webp" width="52" height="52" alt="" loading="lazy"><h2>Play ${g.title} on Android</h2></div>
      <p>Earn XP, build daily streaks and unlock achievements in the free BrainBuzz app.</p>
      <div>${playBadge(`game_side_${g.slug}`)}</div>
    </div>
  </aside>
</div></section>
<section class="section-tight"><div class="wrap">
  <div class="prose">
    <h2>About ${g.title}</h2>
    ${copy.intro.map((p) => `<p>${p}</p>`).join('')}
    <h2>${g.type === 'DAILY' ? 'The rules' : 'Difficulty levels'}</h2>
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
    ['Easy, Medium and Hard', 'All free', 'Easy free; Medium and Hard after a short optional video'],
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
  <p class="lead">BrainBuzz: Daily Challenge is a colourful collection of quick brain games for Android. This website brings the same games to your browser.</p>
</div></section>
<section class="section-tight" style="padding-top:0"><div class="wrap prose">
  <h2>Think today. Better tomorrow.</h2>
  <p>BrainBuzz is built around short, satisfying puzzles you can finish in a few minutes: a memory test on the bus, a logic puzzle with your coffee, a maths sprint before work. Every game has three difficulty levels, and each level changes the rules, not just the speed.</p>
  <p>The Daily Challenge gives everyone the same 12 puzzles each day, so you can compare scores with friends whether they play in the app or here on the web.</p>
  <h2>The games</h2>
  <ul>${GAMES.map((g) => `<li><a href="/play/${g.slug}/"><strong>${g.title}</strong></a> (${Category[g.category]}): ${esc(g.tagline)}.</li>`).join('')}</ul>
  <h2>Designed to be fair and friendly</h2>
  <ul>
    <li><strong>Every game explains itself.</strong> Each one starts with a short how-to and shows the rule or the right answer when you miss, so you learn as you go.</li>
    <li><strong>Nothing relies on colour alone.</strong> Right and wrong answers, lit tiles and connected pipes also use icons, outlines or dots.</li>
    <li><strong>Mistakes ease off, they don’t pile on.</strong> In Memory Matrix a miss makes the next round shorter; in Quick Math Rush the sums get easier after two misses.</li>
    <li><strong>No accounts.</strong> Your scores stay in your browser. The website is supported by ads from Google; the <a href="/privacy/">Privacy Policy</a> explains how they use cookies.</li>
  </ul>
  <h2>Website and Android app</h2>
  <p>The browser games use the same rules, levels and scoring as the app. The app adds everything that tracks your progress over time.</p>
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
  <p class="muted">Last updated: 21 October 2026</p>
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
    <li><code>bb-progress-v1</code>: your best score for each game and difficulty, the difficulty you last picked, and your Daily Challenge results for recent days.</li>
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
        <li>the game and difficulty</li>
        <li>whether it was the website or the Android app</li>
        <li>your device and browser (or app version)</li>
        <li>what you expected and what happened</li>
      </ul>
    </div>
    <div class="card info-card">
      <span class="game-art" style="--c:#ffb23f">${icon('star')}</span>
      <h2>Enjoying BrainBuzz?</h2>
      <p>A rating or review on Google Play helps other people find the app.</p>
      <p><a class="btn btn-secondary" href="${esc(playUrl('contact_review'))}" rel="noopener" target="_blank" data-play="contact_review">${icon('android')}<span>Open Google Play</span></a></p>
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
  return [homePage(), playHub(), ...GAMES.map(gamePage), aboutPage(), privacyPage(), contactPage(), notFoundPage()];
}
