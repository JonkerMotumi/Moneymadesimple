// Geometry for the hero chart. Used at build time (static, finished chart for
// no-JS / reduced-motion) and in the browser (the animated intro).
import { SITE } from '../config';

export const W = 640;
export const H = 400;
const PAD = { l: 14, r: 14, t: 28, b: 18 };
export const START = 10000;
export const YEARS = 20;
export const FLAT_RATE = 0.02;
export const GREEN_RATE = 0.045;
const N = 80; // points per line: smooth enough, cheap enough for mid-range phones

type Pt = [number, number];

const value = (rate: number, t: number) => START * Math.pow(1 + rate, YEARS * t);
const yMax = value(GREEN_RATE, 1) * 1.03;
const X = (t: number) => PAD.l + t * (W - PAD.l - PAD.r);
const Y = (v: number) => PAD.t + (1 - (v - START) / (yMax - START)) * (H - PAD.t - PAD.b);

export const flatPts: Pt[] = Array.from({ length: N + 1 }, (_, i) => [X(i / N), Y(value(FLAT_RATE, i / N))]);
export const greenPts: Pt[] = Array.from({ length: N + 1 }, (_, i) => [X(i / N), Y(value(GREEN_RATE, i / N))]);

/** Dollar gap between the two lines at fraction t (0..1) of the way across. */
export const gapAt = (t: number) => value(GREEN_RATE, t) - value(FLAT_RATE, t);
export const FINAL_GAP = Math.round(gapAt(1));

/** Points of a line from the left edge to fraction p (0..1), last point interpolated. */
export function upTo(pts: Pt[], p: number): Pt[] {
  const f = Math.max(0, Math.min(1, p)) * N;
  const i = Math.floor(f);
  const out = pts.slice(0, i + 1);
  if (i < N && f > i) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const k = f - i;
    out.push([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]);
  }
  return out;
}

const fmt = (n: number) => n.toFixed(1);
export const lineD = (pts: Pt[]) => (pts.length ? 'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') : '');
/** Filled region between the lines, from the left edge to fraction p. */
export function areaD(p: number): string {
  const g = upTo(greenPts, p);
  const f = upTo(flatPts, p);
  if (g.length < 2) return '';
  return lineD(g) + 'L' + f.reverse().map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + 'Z';
}

/** Where the counter label sits: in the middle of the gap, 80% of the way across. */
export function counterAnchor(t = 0.8) {
  const i = Math.round(t * N);
  const [x, gy] = greenPts[i];
  const [, fy] = flatPts[i];
  return { left: (x / W) * 100, top: (((gy + fy) / 2) / H) * 100 };
}

export const gapLabel = (n: number) =>
  `+${SITE.currency}${new Intl.NumberFormat(SITE.locale, { maximumFractionDigits: 0 }).format(Math.round(n))}`;
