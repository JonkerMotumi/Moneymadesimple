import type { CalculatorDef } from '../types';
import { amortize, fixedPayment, pmt } from '../finance';
import { duration, money } from '../format';

const def: CalculatorDef = {
  slug: 'cash-out-refinance-vs-credit-card',
  title: 'Cash-out refinance vs paying off a credit card',
  topics: ['debt', 'home'],
  blurb:
    'Rolling a credit card into your mortgage lowers the monthly payment. See what it does to the total you pay.',
  inputs: [
    { id: 'cardBalance', label: 'Credit card balance', kind: 'money', default: 12000, min: 0, max: 1e7 },
    { id: 'cardApr', label: 'Card interest rate (APR)', kind: 'percent', default: 22, min: 0, max: 60 },
    { id: 'cardPayment', label: 'What you pay on the card each month', kind: 'money', default: 400, min: 0, max: 1e6 },
    { id: 'mortBalance', label: 'Mortgage balance today', kind: 'money', default: 200000, min: 0, max: 1e8 },
    { id: 'mortRate', label: 'Current mortgage rate', kind: 'percent', default: 4, min: 0, max: 30 },
    { id: 'mortYears', label: 'Years left on current mortgage', kind: 'years', default: 25, min: 1, max: 40 },
    { id: 'newRate', label: 'New mortgage rate', kind: 'percent', default: 6.5, min: 0, max: 30 },
    { id: 'newYears', label: 'Term of the new mortgage', kind: 'years', default: 25, min: 1, max: 40 },
    { id: 'fees', label: 'Refinance fees (added to the loan)', kind: 'money', default: 3000, min: 0, max: 1e6 },
  ],
  assumptions: [
    'Option A keeps your current mortgage as it is and pays the card with the fixed monthly amount you entered until it reaches zero.',
    'Option B takes one new mortgage covering your current mortgage balance, the card balance and the fees, at the new rate and term.',
    'Rates are fixed for the whole term, interest compounds monthly, and the card balance is not added to.',
    '“Total cost of borrowing” is everything you pay minus the amount you owe today, so it includes interest and fees.',
    'It does not account for tax effects, inflation, or what you might do with the monthly saving.',
  ],
  compute(v) {
    const owed = v.mortBalance + v.cardBalance;

    // Option A: keep both debts
    const mortPay = pmt(v.mortBalance, v.mortRate, v.mortYears * 12);
    const card = amortize(v.cardBalance, v.cardApr, fixedPayment(v.cardPayment));
    const mortPaidA = mortPay * v.mortYears * 12;
    const totalPaidA = mortPaidA + (card.paidOff ? card.totalPaid : 0);
    const costA = totalPaidA - owed;
    const monthlyA = mortPay + v.cardPayment;

    // Option B: one bigger mortgage
    const newPrincipal = owed + v.fees;
    const newPay = pmt(newPrincipal, v.newRate, v.newYears * 12);
    const totalPaidB = newPay * v.newYears * 12;
    const costB = totalPaidB - owed;

    const notes: string[] = [];
    if (!card.paidOff) {
      notes.push(
        `Your card payment of ${money(v.cardPayment)} doesn't cover the monthly interest, so the card never clears. Increase the payment to compare fairly.`,
      );
    }
    const extra = costB - costA;
    const refiWins = card.paidOff && extra < 0;
    return {
      headline: {
        label: refiWins ? 'The refinance saves you' : 'The refinance costs you an extra',
        value: money(Math.abs(extra)),
        sub: card.paidOff
          ? `over the life of the loans (${money(costB)} vs ${money(costA)} in total borrowing cost)`
          : undefined,
      },
      rows: [
        { label: 'A · Keep mortgage, pay the card — monthly payments', value: money(monthlyA) },
        { label: 'A · Time to clear the card', value: card.paidOff ? duration(card.months) : 'Never' },
        { label: 'A · Total cost of borrowing', value: card.paidOff ? money(costA) : 'n/a' },
        { label: 'B · One new mortgage — monthly payment', value: money(newPay) },
        { label: 'B · Total cost of borrowing', value: money(costB) },
        { label: 'Monthly payment difference', value: money(monthlyA - newPay), strong: true },
        { label: 'Total cost difference (B − A)', value: card.paidOff ? money(extra) : 'n/a', strong: true },
      ],
      notes,
    };
  },
};
export default def;
