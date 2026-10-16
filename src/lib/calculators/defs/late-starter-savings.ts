import type { CalculatorDef } from '../types';
import { paymentForFV, savingsGrowth } from '../finance';
import { money } from '../format';

const def: CalculatorDef = {
  slug: 'late-starter-savings',
  title: 'Late-starter savings: the cost of waiting',
  blurb: 'What does putting off saving for a few years really cost by the time you retire?',
  inputs: [
    { id: 'monthly', label: 'Monthly amount you save', kind: 'money', default: 300, min: 0, max: 1e6 },
    { id: 'rate', label: 'Expected yearly return', kind: 'percent', default: 7, min: 0, max: 20 },
    { id: 'age', label: 'Your age today', kind: 'years', default: 30, min: 16, max: 80 },
    { id: 'retire', label: 'Age you want to stop working', kind: 'years', default: 65, min: 20, max: 90 },
    { id: 'delay', label: 'Years you might wait to start', kind: 'years', default: 5, min: 0, max: 40 },
  ],
  assumptions: [
    'You save the same amount at the end of every month, and the return is a fixed yearly rate compounded monthly.',
    'The return is an assumption, not a promise. Real investments rise and fall, and fees reduce what you keep.',
    'Amounts are in today’s money only if the return you enter is after inflation. A 7% input is closer to a before-inflation figure.',
    'No starting balance, tax, or increases to your saving over time are included.',
  ],
  compute(v) {
    const totalMonths = Math.max(0, Math.round((v.retire - v.age) * 12));
    const delayMonths = Math.min(totalMonths, Math.round(v.delay * 12));
    const now = savingsGrowth(v.monthly, v.rate, 0, totalMonths);
    const late = savingsGrowth(v.monthly, v.rate, delayMonths, totalMonths);
    const endNow = now[now.length - 1];
    const endLate = late[late.length - 1];
    const cost = endNow - endLate;

    const monthsToSave = totalMonths - delayMonths;
    const catchUp = monthsToSave > 0 ? paymentForFV(endNow, v.rate, monthsToSave) : Infinity;

    const notes: string[] = [];
    if (v.retire <= v.age) notes.push('Your retirement age needs to be later than your age today.');
    if (v.delay >= v.retire - v.age) notes.push('Waiting that long means you never start. Reduce the delay.');

    const contributedNow = v.monthly * totalMonths;
    const contributedLate = v.monthly * monthsToSave;

    return {
      headline: {
        label: `Waiting ${v.delay} ${v.delay === 1 ? 'year' : 'years'} costs you`,
        value: money(cost),
        sub: 'by the time you reach your retirement age',
      },
      rows: [
        { label: 'Pot if you start today', value: money(endNow) },
        { label: `Pot if you start in ${v.delay} ${v.delay === 1 ? 'year' : 'years'}`, value: money(endLate) },
        { label: 'You put in — start today', value: money(contributedNow) },
        { label: 'You put in — start later', value: money(contributedLate) },
        { label: 'Cost of waiting', value: money(cost), strong: true },
        {
          label: 'Monthly saving needed to catch up if you wait',
          value: Number.isFinite(catchUp) ? money(catchUp) : 'n/a',
          strong: true,
        },
      ],
      chart: {
        title: 'Savings pot over time',
        xUnit: 'years',
        yLabel: 'Pot',
        series: [
          { label: 'Wait', points: late, tone: 'muted' },
          { label: 'Start today', points: now, tone: 'accent' },
        ],
      },
      notes,
    };
  },
};
export default def;
