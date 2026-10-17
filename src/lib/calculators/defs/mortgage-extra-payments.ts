import type { CalculatorDef } from '../types';
import { amortize, fixedPayment, pmt } from '../finance';
import { duration, money } from '../format';

const def: CalculatorDef = {
  slug: 'mortgage-extra-payments',
  title: 'Mortgage extra payments: interest and time saved',
  topics: ['home'],
  blurb: 'Add a little to your bond each month and see the interest and years it takes off.',
  inputs: [
    { id: 'balance', label: 'Mortgage balance today', kind: 'money', default: 250000, min: 1, max: 1e8 },
    { id: 'rate', label: 'Interest rate', kind: 'percent', default: 6.5, min: 0, max: 30 },
    { id: 'years', label: 'Years left on the mortgage', kind: 'years', default: 25, min: 1, max: 40 },
    { id: 'extra', label: 'Extra payment each month', kind: 'money', default: 150, min: 0, max: 1e6 },
  ],
  assumptions: [
    'Your normal payment is the level payment that clears the mortgage exactly over the years left, at a fixed rate.',
    'The extra amount is paid every month on top, and goes straight to the balance (no prepayment penalty).',
    'Interest is charged monthly on the outstanding balance (rate ÷ 12).',
    'Insurance, rates changes, fees and taxes are not included.',
  ],
  compute(v) {
    const n = v.years * 12;
    const base = pmt(v.balance, v.rate, n);
    const normal = amortize(v.balance, v.rate, fixedPayment(base));
    const faster = amortize(v.balance, v.rate, fixedPayment(base + v.extra));
    const saved = normal.totalInterest - faster.totalInterest;
    const monthsSaved = normal.months - faster.months;

    const yearly = (b: number[], len: number) => {
      const out: number[] = [];
      for (let m = 0; m < len; m += 12) out.push(b[m] ?? 0);
      return out;
    };
    const len = normal.balances.length;
    return {
      headline: {
        label: 'Interest you save',
        value: money(saved),
        sub: monthsSaved > 0 ? `and you own your home ${duration(monthsSaved)} sooner` : undefined,
      },
      rows: [
        { label: 'Normal monthly payment', value: money(base) },
        { label: 'Payment with the extra', value: money(base + v.extra) },
        { label: 'Total interest — normal', value: money(normal.totalInterest) },
        { label: 'Total interest — with extra', value: money(faster.totalInterest) },
        { label: 'Paid off in — normal', value: duration(normal.months) },
        { label: 'Paid off in — with extra', value: duration(faster.months) },
        { label: 'Interest saved', value: money(saved), strong: true },
        { label: 'Time saved', value: monthsSaved > 0 ? duration(monthsSaved) : '—', strong: true },
      ],
      chart: {
        title: 'Mortgage balance over time',
        xUnit: 'years',
        yLabel: 'Balance',
        series: [
          { label: 'Normal payments', points: yearly(normal.balances, len), tone: 'muted' },
          { label: `With +${money(v.extra)}/month`, points: yearly(faster.balances, len), tone: 'accent' },
        ],
      },
    };
  },
};
export default def;
