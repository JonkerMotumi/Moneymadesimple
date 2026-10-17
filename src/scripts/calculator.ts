import { calculators } from '../lib/calculators';
import type { CalcOutput, ChartDef } from '../lib/calculators/types';
import { isUnlocked } from './site';

const SVG_NS = 'http://www.w3.org/2000/svg';
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const parse = (s: string) => {
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
};
/** Locked view: same layout, but the digits are replaced so no real result sits in the page. */
const mask = (s: string) => s.replace(/\d/g, '8');

document.querySelectorAll<HTMLElement>('[data-calc]').forEach((root) => {
  const def = calculators.find((c) => c.slug === root.dataset.calc);
  if (!def) return;
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('[data-inputs] input'));
  const out = root.querySelector<HTMLElement>('[data-output]')!;
  const notesEl = root.querySelector<HTMLElement>('[data-notes]')!;
  let queued = 0;

  const read = (): Record<string, number> => {
    const v: Record<string, number> = {};
    for (const input of inputs) {
      const spec = def.inputs.find((i) => i.id === input.name)!;
      const field = input.closest('.field')!;
      const hint = field.querySelector<HTMLElement>('.hint')!;
      let n = parse(input.value);
      const min = spec.min ?? -Infinity;
      const max = spec.max ?? Infinity;
      const bad = Number.isNaN(n) || n < min || n > max;
      field.classList.toggle('bad', bad);
      input.setAttribute('aria-invalid', String(bad));
      hint.textContent = bad
        ? `Enter a number between ${min.toLocaleString()} and ${max.toLocaleString()}.`
        : spec.hint ?? '';
      if (Number.isNaN(n)) n = spec.default;
      v[spec.id] = Math.min(max, Math.max(min, n));
    }
    return v;
  };

  const render = () => {
    queued = 0;
    const unlocked = isUnlocked();
    root.toggleAttribute('data-locked', !unlocked);
    let res: CalcOutput;
    try {
      res = def.compute(read());
    } catch {
      out.textContent = 'Check your numbers and try again.';
      return;
    }
    const m = unlocked ? (s: string) => s : mask;
    out.replaceChildren(...view(res, m));
    out.toggleAttribute('aria-hidden', !unlocked);
    notesEl.replaceChildren(...(res.notes ?? []).map((n) => el('li', '', n)));
  };
  const schedule = () => { if (!queued) queued = requestAnimationFrame(render); };

  inputs.forEach((i) => {
    i.addEventListener('input', schedule);
    i.addEventListener('blur', () => {
      const spec = def.inputs.find((s) => s.id === i.name)!;
      const n = parse(i.value);
      if (!Number.isNaN(n) && spec.kind === 'money') i.value = n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    });
  });
  window.addEventListener('mms:unlocked', render);
  render();
});

function view(res: CalcOutput, m: (s: string) => string): Node[] {
  const nodes: Node[] = [];
  const head = el('div', 'headline');
  head.append(el('p', 'h-label', res.headline.label), el('p', 'h-value', m(res.headline.value)));
  if (res.headline.sub) head.append(el('p', 'h-sub', m(res.headline.sub)));
  nodes.push(head);

  const dl = el('dl', 'rows');
  for (const r of res.rows) {
    const row = el('div', 'r' + (r.strong ? ' strong' : ''));
    row.append(el('dt', '', r.label), el('dd', '', m(r.value)));
    dl.append(row);
  }
  nodes.push(dl);
  if (res.chart) nodes.push(chart(res.chart, m));
  return nodes;
}

function chart(c: ChartDef, m: (s: string) => string): HTMLElement {
  const W = 600, H = 250, L = 52, R = 12, T = 12, B = 28;
  const wrap = el('div', 'chart');
  wrap.append(el('h4', '', c.title));
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', c.title + ': ' + c.series.map((s) => s.label).join(' versus '));
  const n = Math.max(...c.series.map((s) => s.points.length));
  const yMax = Math.max(...c.series.flatMap((s) => s.points), 1);
  const X = (i: number) => L + (i / Math.max(1, n - 1)) * (W - L - R);
  const Y = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const add = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>, text?: string) => {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text) e.textContent = text;
    svg.append(e);
    return e;
  };
  for (let g = 0; g <= 4; g++) {
    const v = (yMax * g) / 4;
    add('line', { class: 'grid-line', x1: String(L), x2: String(W - R), y1: String(Y(v)), y2: String(Y(v)) });
    add('text', { class: 'tick', x: String(L - 8), y: String(Y(v) + 4), 'text-anchor': 'end' }, m(short(v)));
  }
  const step = Math.max(1, Math.ceil((n - 1) / 6));
  for (let i = 0; i < n; i += step) add('text', { class: 'tick', x: String(X(i)), y: String(H - 8), 'text-anchor': 'middle' }, i === 0 ? 'Now' : `${i}y`);
  const accent = c.series.find((s) => s.tone === 'accent');
  const muted = c.series.find((s) => s.tone === 'muted');
  const d = (pts: number[]) => 'M' + pts.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('L');
  if (accent && muted) {
    const k = Math.min(accent.points.length, muted.points.length);
    const top = accent.points.slice(0, k);
    const bot = muted.points.slice(0, k);
    add('path', { class: 'a-fill', d: d(top) + 'L' + bot.map((_, i) => `${X(k - 1 - i).toFixed(1)} ${Y(bot[k - 1 - i]).toFixed(1)}`).join('L') + 'Z' });
  }
  if (muted) add('path', { class: 'l-muted', d: d(muted.points) });
  if (accent) add('path', { class: 'l-accent', d: d(accent.points) });
  wrap.append(svg);
  const lg = el('div', 'legend');
  for (const s of c.series) {
    const k = el('span');
    k.append(el('i', 'i-' + s.tone), document.createTextNode(s.label));
    lg.append(k);
  }
  wrap.append(lg);
  return wrap;
}

function short(v: number): string {
  return v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(Math.round(v));
}
