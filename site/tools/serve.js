/**
 * Local preview of dist/ with the same behaviour as GitHub Pages: clean URLs, /dir/ → index.html,
 * unknown paths → 404.html. No dependencies.
 *   node tools/serve.js [port]
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

function resolve(urlPath) {
  let p = path.normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!p.endsWith('/')) return { redirect: `${p}/` };
    file = path.join(file, 'index.html');
  }
  return fs.existsSync(file) ? { file } : null;
}

http.createServer((req, res) => {
  const found = resolve(req.url);
  if (found && found.redirect) {
    res.writeHead(301, { Location: found.redirect });
    return res.end();
  }
  const file = found ? found.file : path.join(DIST, '404.html');
  res.writeHead(found ? 200 : 404, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}`));
