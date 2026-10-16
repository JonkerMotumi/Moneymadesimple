// Production-like local server: serves ./dist and answers /api/subscribe with the
// same function Cloudflare Pages runs (mock mode, no email service needed).
// Usage: npm run build && npm run serve   → http://localhost:4321
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { onRequestPost } from '../functions/api/subscribe.js';

const root = new URL('../dist/', import.meta.url).pathname;
const port = Number(process.env.PORT || 4321);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/subscribe' && req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, { method: 'POST', headers: req.headers, body: Buffer.concat(chunks) });
    const r = await onRequestPost({ request, env: { ALLOW_MOCK: '1', ...process.env } });
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(await r.text());
  }
  let p = normalize(join(root, decodeURIComponent(url.pathname)));
  if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
  } catch {
    try { await stat(p + '.html'); p += '.html'; } catch {
      res.writeHead(404, { 'content-type': types['.html'] });
      return res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
    }
  }
  res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
}).listen(port, () => console.log(`http://localhost:${port}`));
