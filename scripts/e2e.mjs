// End-to-end check of the gate, signup and layout. Needs: npm run build && npm run serve
import { chromium } from 'playwright-core';
const base = process.env.BASE || 'http://localhost:4321';
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

// 1. No horizontal scroll on any page at phone width
const pages = ['/', '/topics', '/topics/budgeting', '/topics/debt', '/topics/saving', '/topics/home', '/calculators', '/calculators/budget-split', '/blog/50-30-20-budget-in-plain-numbers', '/calculators/credit-card-payoff', '/calculators/mortgage-extra-payments', '/calculators/late-starter-savings', '/calculators/cash-out-refinance-vs-credit-card', '/blog', '/blog/cost-of-waiting-to-start-saving', '/privacy', '/terms', '/unsubscribe'];
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true });
  const p = await ctx.newPage();
  for (const u of pages) {
    await p.goto(base + u); await p.waitForTimeout(400);
    const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    ok(sw <= iw, `no horizontal overflow ${u} (${sw}/${iw})`);
  }
  await ctx.close();
}

// 1b. Mobile menu opens, is keyboard-closable, and links work
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(base + '/'); await p.waitForTimeout(300);
  ok(!(await p.locator('#site-nav').isVisible()), 'mobile: nav hidden behind menu button');
  await p.click('[data-menu-toggle]');
  ok(await p.locator('#site-nav').isVisible(), 'mobile: menu opens');
  ok((await p.getAttribute('[data-menu-toggle]', 'aria-expanded')) === 'true', 'mobile: aria-expanded reflects state');
  await p.keyboard.press('Escape');
  ok(!(await p.locator('#site-nav').isVisible()), 'mobile: Escape closes menu');
  await p.click('[data-menu-toggle]');
  await p.click('#site-nav a:has-text("Topics")');
  await p.waitForLoadState();
  ok(/\/topics\/?$/.test(p.url()), 'mobile: menu link navigates');
  await ctx.close();
}

// 2. Gate: locked → signup → unlocked → remembered
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(base + '/calculators/credit-card-payoff'); await p.waitForTimeout(500);
  ok(await p.locator('[data-calc][data-locked]').count() === 1, 'calculator starts locked');
  const lockedVals = (await p.locator('.h-value, .rows dd').allTextContents()).join(' ').replace(/[^0-9]/g, '');
  ok(lockedVals.length > 0 && /^8+$/.test(lockedVals), 'locked result values are masked placeholders, not real numbers');
  await p.fill('[data-gate] input[type=email]', 'test@example.com');
  await p.click('[data-gate] button[type=submit]');
  await p.waitForTimeout(300);
  ok(await p.locator('[data-gate] .msg').innerText().then((t) => /tick/i.test(t)), 'consent required before signup');
  await p.check('[data-gate] input[type=checkbox]');
  await p.click('[data-gate] button[type=submit]');
  await p.waitForTimeout(800);
  ok(await p.locator('[data-calc][data-locked]').count() === 0, 'unlocked live after signup');
  const txt = await p.locator('[data-output]').innerText();
  ok(/\$9,659/.test(txt), 'real result visible after unlock ($9,659 interest saved)');
  await p.reload(); await p.waitForTimeout(500);
  ok(await p.locator('[data-calc][data-locked]').count() === 0, 'remembered after reload (no gate)');
  await p.fill('#credit-card-payoff-extra', '0'); await p.waitForTimeout(200);
  ok(/\$0/.test(await p.locator('.h-value').innerText()), 'changing input updates result live');
  await p.fill('#credit-card-payoff-apr', 'abc'); await p.waitForTimeout(200);
  ok(await p.locator('.field.bad').count() === 1, 'invalid input is flagged');
  ok(errors.length === 0, 'no JS errors ' + errors.join(';'));
  await ctx.close();
}

// 3. Hero form signup, reduced motion still chart
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(base + '/'); await p.waitForTimeout(500);
  ok(await p.locator('[data-hero].is-static').count() === 1, 'reduced motion: static finished hero');
  ok(await p.locator('[data-counter-num]').innerText().then((t) => t === '+$9,258'), 'reduced motion: counter shows final value');
  ok(await p.locator('[data-hero] form').isVisible(), 'reduced motion: form visible immediately');
  await p.fill('[data-hero] input[type=email]', 'hero@example.com');
  await p.check('[data-hero] input[type=checkbox]');
  await p.click('[data-hero] button[type=submit]');
  await p.waitForTimeout(800);
  ok(/in!/.test(await p.locator('[data-hero] .msg').innerText()), 'hero signup succeeds');
  await ctx.close();
}
await browser.close();
process.exit(fail ? 1 : 0);
