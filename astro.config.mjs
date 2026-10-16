import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set SITE_URL in your host's environment settings once the domain is final.
const site = process.env.SITE_URL || 'https://moneymadesimple.example';
// "/" on your own domain; "/RepoName" when previewing on GitHub Pages.
const base = process.env.BASE_PATH || '/';

// Local-only: lets `npm run dev` answer /api/subscribe by
// running the exact same code that Cloudflare Pages runs in production.
// ALLOW_MOCK=1 skips the email-service call so no API key is needed.
const localSubscribeApi = () => {
  const handler = async (req, res) => {
    const { onRequestPost } = await import('./functions/api/subscribe.js');
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
    });
    const response = await onRequestPost({ request, env: { ALLOW_MOCK: '1', ...process.env } });
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(await response.text());
  };
  return {
    name: 'local-subscribe-api',
    configureServer(s) { s.middlewares.use('/api/subscribe', handler); },
  };
};

export default defineConfig({
  site,
  base,
  integrations: [sitemap({ filter: (p) => !p.includes('/thanks') })],
  vite: { plugins: [localSubscribeApi()] },
  build: { inlineStylesheets: 'auto' },
});
