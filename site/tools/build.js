/**
 * Builds the static site into dist/. No dependencies; runs on Node 12.20+.
 *   node tools/build.js
 *   node tools/build.js --ad-preview   local only: dashed "not an advertisement" boxes instead of AdSense
 * Renders every page in src/pages.js, copies assets and ads.txt, builds the icon sprite, sitemap,
 * robots, manifest and CNAME, then checks that every internal link and asset reference resolves.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { renderPage, THEME_SCRIPT, LOADER_SCRIPT } from '../src/layout.js';
import { allPages } from '../src/pages.js';
import { SITE_URL } from '../assets/js/lib/site.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const AD_PREVIEW = process.argv.includes('--ad-preview');
if (AD_PREVIEW && (process.env.CI || process.env.GITHUB_ACTIONS)) {
  console.error('--ad-preview is for local layout checks only and must never be deployed.');
  process.exit(1);
}

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  if (fs.rmSync) fs.rmSync(dir, { recursive: true, force: true });
  else fs.rmdirSync(dir, { recursive: true });
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

function listFiles(dir, ext) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p, ext));
    else if (!ext || p.endsWith(ext)) out.push(p);
  }
  return out;
}

const hash = (data) => crypto.createHash('sha256').update(data).digest('hex').slice(0, 10);

function write(rel, content) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function iconSprite() {
  const symbols = fs.readdirSync(path.join(ROOT, 'src/icons')).filter((f) => f.endsWith('.svg')).sort().map((f) => {
    const svg = fs.readFileSync(path.join(ROOT, 'src/icons', f), 'utf8');
    const viewBox = /viewBox="([^"]+)"/.exec(svg)[1];
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    return `<symbol id="${f.replace(/\.svg$/, '')}" viewBox="${viewBox}">${inner}</symbol>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`;
}

function checkLinks(pages) {
  const problems = [];
  const sprite = fs.readFileSync(path.join(DIST, 'assets/img/icons.svg'), 'utf8');
  const iconIds = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
  const exists = (urlPath) => {
    const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]);
    const p = path.join(DIST, clean);
    return fs.existsSync(clean.endsWith('/') ? path.join(p, 'index.html') : p);
  };
  for (const file of listFiles(DIST, '.html')) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(DIST, file);
    for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      if (!exists(m[1])) problems.push(`${rel}: broken link ${m[1]}`);
      const iconRef = /^\/assets\/img\/icons\.svg#(.+)$/.exec(m[1]);
      if (iconRef && !iconIds.has(iconRef[1])) problems.push(`${rel}: missing icon ${iconRef[1]}`);
    }
  }
  // Icons referenced from scripts as icon('name').
  for (const file of listFiles(path.join(DIST, 'assets/js'), '.js')) {
    const js = fs.readFileSync(file, 'utf8');
    for (const m of js.matchAll(/icon\('([a-z_]+)'/g)) {
      if (!iconIds.has(m[1])) problems.push(`${path.relative(DIST, file)}: missing icon ${m[1]}`);
    }
    for (const m of js.matchAll(/from '(\.[^']+)'|import\('(\.[^']+)'\)/g)) {
      const target = path.resolve(path.dirname(file), m[1] || m[2]);
      if (!fs.existsSync(target)) problems.push(`${path.relative(DIST, file)}: missing module ${m[1] || m[2]}`);
    }
  }
  if (pages.length !== new Set(pages.map((p) => p.path)).size) problems.push('Duplicate page paths');
  return problems;
}

function main() {
  const started = Date.now();
  rmrf(DIST);
  copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
  fs.copyFileSync(path.join(ROOT, 'favicon.ico'), path.join(DIST, 'favicon.ico'));
  fs.copyFileSync(path.join(ROOT, 'ads.txt'), path.join(DIST, 'ads.txt'));
  write('assets/img/icons.svg', iconSprite());

  const css = fs.readFileSync(path.join(ROOT, 'assets/css/styles.css'));
  const js = listFiles(path.join(ROOT, 'assets/js'), '.js').sort().map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const build = {
    cssVersion: hash(css),
    jsVersion: hash(js),
    scriptHashes: [THEME_SCRIPT, LOADER_SCRIPT].map((s) => `sha256-${crypto.createHash('sha256').update(s).digest('base64')}`),
    adPreview: AD_PREVIEW,
  };

  const pages = allPages();
  for (const page of pages) write(page.file, renderPage(page, build));

  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.filter((p) => p.sitemap !== false && !p.noindex);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((p) => `  <url><loc>${SITE_URL}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority || '0.5'}</priority></url>`).join('\n')}
</urlset>
`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  write('CNAME', 'brainbuzzgame.com\n');
  write('.nojekyll', '');
  write('manifest.webmanifest', `${JSON.stringify({
    name: 'BrainBuzz: Daily Challenge',
    short_name: 'BrainBuzz',
    description: 'Free brain games: memory, logic, maths and word puzzles, plus a new Daily Challenge every day.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f5fc',
    theme_color: '#6c4bf4',
    icons: [
      { src: '/assets/img/logo-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/assets/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    related_applications: [{ platform: 'play', url: 'https://play.google.com/store/apps/details?id=com.app.dailybrainchallenge', id: 'com.app.dailybrainchallenge' }],
  }, null, 2)}\n`);

  const problems = checkLinks(pages);
  if (problems.length) {
    console.error(`Build finished with ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  const files = listFiles(DIST);
  const bytes = files.reduce((n, f) => n + fs.statSync(f).size, 0);
  if (AD_PREVIEW) console.log('AD PREVIEW BUILD: placeholder ad boxes, no AdSense. Local use only; rebuild without --ad-preview before testing real ads.');
  console.log(`Built ${pages.length} pages, ${files.length} files (${(bytes / 1024).toFixed(0)} KB) into dist/ in ${Date.now() - started} ms. All internal links OK.`);
}

main();
