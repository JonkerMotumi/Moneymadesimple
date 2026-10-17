import type { CalculatorDef } from '../types';
import { annuityFV } from '../finance';
import { money } from '../format';

const pctOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const def: CalculatorDef = {
  slug: 'budget-split',
  title: 'Budget check: the 50/30/20 split',
  topics: ['budgeting'],
  blurb: 'See how your monthly spending compares with a simple needs, wants and savings split.',
  inputs: [
    { id: 'income', label: 'Monthly take-home pay', kind: 'money', default: 4000, min: 0, max: 1e7, hint: 'What lands in your account after tax.' },
    { id: 'needs', label: 'Needs each month', kind: 'money', default: 2200, min: 0, max: 1e7, hint: 'Rent or bond, bills, groceries, transport, minimum debt payments.' },
    { id: 'wants', label: 'Wants each month', kind: 'money', default: 1100, min: 0, max: 1e7, hint: 'Eating out, subscriptions, shopping, holidays.' },
  ],
  assumptions: [
    'The 50/30/20 split is a guide, not a rule: about 50% of take-home pay for needs, 30% for wants and 20% for saving and paying off debt.',
    'Whatever is left after needs and wants is treated as money you could save or use to clear debt.',
    'The 10-year figure assumes you save that amount at the end of every month at a fixed 5% a year, compounded monthly. Real returns vary.',
    'Tax, irregular costs (car repairs, gifts) and pay rises are not included.',
  ],
  compute(v) {
    const left = v.income - v.needs - v.wants;
    const notes: string[] = [];
    if (left < 0) notes.push('You are spending more than you take home. Start with the wants, then look at the biggest needs.');
    if (v.income > 0 && v.needs / v.income > 0.6)
      notes.push('Needs take more than 60% of your pay, so a 50/30/20 split may not be realistic yet. That is common; aim to improve it over time.');
    const save = Math.max(0, left);
    return {
      headline:
        left >= 0
          ? { label: 'Left to save or clear debt each month', value: money(left), sub: `${pctOf(left, v.income)}% of your take-home pay (the guide suggests 20%)` }
          : { label: 'You are overspending by', value: money(-left), sub: 'each month' },
      rows: [
        { label: `Needs — ${pctOf(v.needs, v.income)}% of pay (guide: 50%, ${money(v.income * 0.5)})`, value: money(v.needs) },
        { label: `Wants — ${pctOf(v.wants, v.income)}% of pay (guide: 30%, ${money(v.income * 0.3)})`, value: money(v.wants) },
        { label: `Saving and debt — ${pctOf(left, v.income)}% of pay (guide: 20%, ${money(v.income * 0.2)})`, value: money(left) },
        { label: 'Saved over a year at this rate', value: money(save * 12), strong: true },
        { label: 'After 10 years at an assumed 5% a year', value: money(annuityFV(save, 5, 120)), strong: true },
      ],
      notes,
    };
  },
};
export default def;
