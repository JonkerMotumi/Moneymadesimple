import { SITE } from '../../config';

const nf = new Intl.NumberFormat(SITE.locale, { maximumFractionDigits: 0 });

export const money = (n: number): string =>
  `${n < 0 ? '-' : ''}${SITE.currency}${nf.format(Math.round(Math.abs(n)))}`;

export const pct = (n: number): string => `${Number.isInteger(n) ? n : n.toFixed(2).replace(/0$/, '')}%`;

export function duration(months: number): string {
  const m = Math.round(months);
  const y = Math.floor(m / 12);
  const rem = m % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} ${y === 1 ? 'year' : 'years'}`);
  if (rem || !y) parts.push(`${rem} ${rem === 1 ? 'month' : 'months'}`);
  return parts.join(' ');
}
