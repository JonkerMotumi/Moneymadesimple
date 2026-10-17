import type { CalculatorDef } from '../types';
import { amortize, cardMinimum } from '../finance';
import { duration, money } from '../format';

const def: CalculatorDef = {
  slug: 'credit-card-payoff',
  title: 'Credit card payoff: minimums vs extra payments',
  topics: ['debt'],
  blurb: 'See how much interest and time a little extra each month saves on a credit card.',
  inputs: [
    { id: 'balance', label: 'Card balance', kind: 'money', default: 8000, min: 1, max: 1e7 },
    { id: 'apr', label: 'Interest rate (APR)', kind: 'percent', default: 22, min: 0, max: 60 },
    { id: 'extra', label: 'Extra you could pay each month', kind: 'money', default: 100, min: 0, max: 1e6 },
  ],
  assumptions: [
    'Minimum-payment path: each month you pay the interest plus 1% of the balance, with a floor of 25 (the usual card rule).',
    'Extra-payment path: you pay the same minimum as above, plus your extra amount, every month until the card is clear.',
    'The interest rate stays fixed, interest is charged monthly (APR ÷ 12), and you make no new purchases.',
    'Fees, promotional rates and grace periods are not modelled.',
  ],
  compute(v) {
    const min = cardMinimum(25);
    const monthlyRate = v.apr / 100 / 12;
    const firstMin = min(v.balance, v.balance * monthlyRate);
    const minOnly = amortize(v.balance, v.apr, min);
    const withExtra = amortize(v.balance, v.apr, (b, i) => min(b, i) + v.extra);

    const saved = minOnly.totalInterest - withExtra.totalInterest;
    const monthsSaved = minOnly.months - withExtra.months;
    const notes: string[] = [];
    if (!minOnly.paidOff) notes.push('At minimum payments this balance would take more than 100 years to clear.');
    if (!withExtra.paidOff) notes.push('Even with the extra, the payment does not cover the interest. Increase it.');

    const years = (b: number[]) => {
      const out: number[] = [];
      for (let m = 0; m < b.length; m += 12) out.push(b[m]);
      return out;
    };
    const len = Math.max(minOnly.balances.length, withExtra.balances.length);
    const pad = (b: number[]) => years([...b, ...Array(len - b.length).fill(0)]);

    return {
      headline: {
        label: 'Interest you avoid with the extra payment',
        value: money(saved),
        sub: monthsSaved > 0 ? `and you're debt-free ${duration(monthsSaved)} sooner` : undefined,
      },
      rows: [
        { label: 'First month’s minimum payment', value: money(firstMin) },
        { label: 'Minimums only — time to pay off', value: minOnly.paidOff ? duration(minOnly.months) : '100+ years' },
        { label: 'Minimums only — total interest', value: money(minOnly.totalInterest) },
        { label: `With +${money(v.extra)}/month — time to pay off`, value: withExtra.paidOff ? duration(withExtra.months) : 'Never' },
        { label: `With +${money(v.extra)}/month — total interest`, value: money(withExtra.totalInterest) },
        { label: 'Interest saved', value: money(saved), strong: true },
        { label: 'Time saved', value: monthsSaved > 0 ? duration(monthsSaved) : '—', strong: true },
      ],
      chart: {
        title: 'Card balance over time',
        xUnit: 'years',
        yLabel: 'Balance',
        series: [
          { label: 'Minimums only', points: pad(minOnly.balances), tone: 'muted' },
          { label: `With +${money(v.extra)}/month`, points: pad(withExtra.balances), tone: 'accent' },
        ],
      },
      notes,
    };
  },
};
export default def;
