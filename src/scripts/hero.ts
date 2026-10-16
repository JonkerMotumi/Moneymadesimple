import { FINAL_GAP, areaD, counterAnchor, flatPts, gapAt, gapLabel, greenPts, lineD, upTo } from '../lib/hero-curves';

const root = document.querySelector<HTMLElement>('[data-hero]');
if (root) run(root);

function run(root: HTMLElement) {
  const $ = <T extends Element>(s: string) => root.querySelector<T>(s)!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    // Still, finished chart (already rendered at build time).
    root.classList.add('is-static', 'is-settled');
    return;
  }

  const flat = $<SVGPathElement>('[data-flat]');
  const green = $<SVGPathElement>('[data-green]');
  const glow = $<SVGPathElement>('[data-glow]');
  const area = $<SVGPathElement>('[data-area]');
  const area2 = $<SVGPathElement>('[data-area2]');
  const dotsG = $<SVGGElement>('[data-dots]');
  const num = $<HTMLElement>('[data-counter-num]');
  const svg = $<SVGElement>('[data-svg]');
  const counter = $<HTMLElement>('[data-counter]');

  // Start empty: the intro draws everything.
  for (const p of [flat, green, glow, area, area2]) p.setAttribute('d', '');
  num.textContent = gapLabel(0);

  // Timeline (ms from load). The whole intro lands at ~6s.
  const T = { chart: 650, drawStart: 900, drawMs: 3000, dots: 3700, dotMs: 1400, tag: 5100, form: 5500, settle: 6300 };
  const easeFlat = (t: number) => 1 - Math.pow(1 - t, 2); // leads, then eases out
  const easeGreen = (t: number) => 0.3 * t + 0.7 * t * t * t; // starts slow, accelerates
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

  const dots = Array.from({ length: 5 }, () => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', '4');
    c.setAttribute('class', 'dot');
    c.setAttribute('opacity', '0');
    dotsG.appendChild(c);
    return c;
  });

  const done = new Set<string>();
  const at = (key: string, ms: number, e: number, cls: string) => {
    if (e >= ms && !done.has(key)) {
      done.add(key);
      root.classList.add(cls);
    }
  };

  let startTs = 0;
  let settled = false;
  const frame = (ts: number) => {
    if (!startTs) startTs = ts;
    const e = ts - startTs;
    at('head', 0, e, 's-head');
    at('chart', T.chart, e, 's-chart');

    const tn = clamp01((e - T.drawStart) / T.drawMs);
    if (tn > 0) {
      const pf = easeFlat(tn);
      const pg = easeGreen(tn);
      flat.setAttribute('d', lineD(upTo(flatPts, pf)));
      const g = lineD(upTo(greenPts, pg));
      green.setAttribute('d', g);
      const ad = areaD(pg);
      area.setAttribute('d', ad);
      area2.setAttribute('d', ad);
      // The counter reads the real gap at the point the green line has reached.
      // The counter rides inside the widening gap, a little behind the line, until it parks.
      const a = counterAnchor(Math.min(0.8, Math.max(0.08, pg * 0.85)));
      counter.style.left = a.left + '%';
      counter.style.top = a.top + '%';
      if (pg > 0.14) root.classList.add('s-counter');
      num.textContent = gapLabel(gapAt(pg));
      if (tn >= 1) {
        num.textContent = gapLabel(FINAL_GAP);
        glow.setAttribute('d', g);
      }
    }

    // A few dots drift along the green line, then fade.
    if (e >= T.dots) {
      let live = false;
      dots.forEach((c, i) => {
        const k = (e - T.dots - i * 170) / T.dotMs;
        if (k <= 0 || k >= 1) { c.setAttribute('opacity', '0'); return; }
        live = true;
        const f = 0.12 + 0.86 * (k * k * (3 - 2 * k));
        const idx = f * (greenPts.length - 1);
        const j = Math.min(greenPts.length - 2, Math.floor(idx));
        const r = idx - j;
        c.setAttribute('cx', String(greenPts[j][0] + (greenPts[j + 1][0] - greenPts[j][0]) * r));
        c.setAttribute('cy', String(greenPts[j][1] + (greenPts[j + 1][1] - greenPts[j][1]) * r));
        c.setAttribute('opacity', String(Math.sin(Math.PI * k) * 0.9));
      });
      if (!live && e > T.dots + T.dotMs) dotsG.replaceChildren();
    }

    at('tag', T.tag, e, 's-tag');
    at('form', T.form, e, 's-form');
    if (e >= T.settle && !settled) {
      settled = true;
      root.classList.add('is-settled');
      enableParallax();
    }
    if (e < T.dots + T.dotMs + 5 * 170 + 100) requestAnimationFrame(frame);
    else if (!settled) {
      settled = true;
      root.classList.add('is-settled');
      enableParallax();
    }
  };

  requestAnimationFrame(frame);

  // Pause the idle animations when the hero is off-screen.
  new IntersectionObserver(([en]) => root.classList.toggle('is-offscreen', !en.isIntersecting)).observe(root);

  // Depth: pointer (desktop) or tilt (phones) nudges the lines a few pixels.
  function enableParallax() {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      svg.style.setProperty('--px', cx.toFixed(3));
      svg.style.setProperty('--py', cy.toFixed(3));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', (ev) => {
      tx = (ev.clientX / innerWidth - 0.5) * 2;
      ty = (ev.clientY / innerHeight - 0.5) * 2;
      kick();
    }, { passive: true });
    addEventListener('deviceorientation', (ev) => {
      if (ev.gamma == null || ev.beta == null) return;
      tx = clamp(ev.gamma / 25);
      ty = clamp((ev.beta - 45) / 25);
      kick();
    }, { passive: true });
  }
  const clamp = (n: number) => Math.max(-1, Math.min(1, n));
}
