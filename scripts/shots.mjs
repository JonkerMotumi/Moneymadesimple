// Takes design screenshots of the key pages (desktop + mobile, light + dark) into ./shots.
// Needs the local server running: npm run build && npm run serve
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE || 'http://localhost:4321';
const exe = process.env.CHROME || '/opt/pw-browsers/chromium';
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });

const shot = async (name, path, { w, h, dark = false, wait = 7500, full = false, mobile = false } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: dark ? 'dark' : 'light', deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.goto(base + path);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `shots/${name}.png`, fullPage: full });
  await ctx.close();
};

const D = { w: 1280, h: 820 }, M = { w: 390, h: 844, mobile: true };
await shot('hero-desktop-t1', '/', { ...D, wait: 1200 });
await shot('hero-desktop-t3', '/', { ...D, wait: 3000 });
await shot('hero-desktop', '/', D);
await shot('hero-desktop-dark', '/', { ...D, dark: true });
await shot('hero-mobile', '/', M);
await shot('hero-mobile-dark', '/', { ...M, dark: true });
await shot('home-full-desktop', '/', { ...D, full: true });
await shot('home-full-mobile', '/', { ...M, full: true });
await shot('calc-desktop-locked', '/calculators/credit-card-payoff', { ...D, wait: 800, full: true });
await shot('calc-mobile-locked', '/calculators/mortgage-extra-payments', { ...M, wait: 800, full: true });
await shot('blog-index-desktop', '/blog', { ...D, wait: 500 });
await shot('post-desktop', '/blog/cost-of-waiting-to-start-saving', { ...D, wait: 800, full: true });
await shot('post-mobile', '/blog/cost-of-waiting-to-start-saving', { ...M, wait: 800, full: true });
await browser.close();
console.log('done');
