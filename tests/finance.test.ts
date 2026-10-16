import { describe, expect, it } from 'vitest';
import { amortize, annuityFV, cardMinimum, fixedPayment, paymentForFV, pmt, savingsGrowth } from '../src/lib/calculators/finance';

describe('pmt', () => {
  it('matches the standard 30-year 6% figure per $100k', () => {
    expect(pmt(100000, 6, 360)).toBeCloseTo(599.55, 2);
  });
  it('handles 0% interest', () => {
    expect(pmt(12000, 0, 12)).toBe(1000);
  });
});

describe('amortize', () => {
  it('a level pmt clears the loan in exactly n months with the textbook total interest', () => {
    const p = pmt(100000, 6, 360);
    const a = amortize(100000, 6, fixedPayment(p));
    expect(a.paidOff).toBe(true);
    expect(a.months).toBe(360);
    expect(a.totalInterest).toBeCloseTo(p * 360 - 100000, 0);
  });
  it('reports never when the payment is below interest', () => {
    // 1,000 at 24% APR = 20 interest a month; paying 20 never reduces it.
    expect(amortize(1000, 24, fixedPayment(20)).paidOff).toBe(false);
  });
  it('hand-checked tiny case: 1,000 at 12% APR paying 100/month', () => {
    // r = 1%. n = -ln(1 - 1000*0.01/100)/ln(1.01) = 10.59 -> 11 payments.
    // After 10 payments the balance is 1000*1.01^10 - 100*(1.01^10-1)/0.01 = 58.40,
    // so the 11th payment is 58.40*1.01 = 58.98 and total interest is 58.98.
    const a = amortize(1000, 12, fixedPayment(100));
    expect(a.months).toBe(11);
    expect(a.totalPaid).toBeCloseTo(1000 + a.totalInterest, 6);
    expect(a.totalInterest).toBeCloseTo(58.98, 1);
  });
  it('card minimum rule is interest + 1% with a floor', () => {
    const m = cardMinimum(25);
    expect(m(10000, 183.33)).toBeCloseTo(283.33, 2);
    expect(m(100, 1.83)).toBe(25);
  });
});

describe('savings', () => {
  it('simulation agrees with the closed-form annuity formula', () => {
    const sim = savingsGrowth(500, 7, 0, 360);
    expect(sim[sim.length - 1]).toBeCloseTo(annuityFV(500, 7, 360), 4);
    expect(annuityFV(500, 7, 360)).toBeCloseTo(609985.5, 0);
  });
  it('a delayed start equals the annuity over the shorter window', () => {
    const late = savingsGrowth(500, 7, 60, 360);
    expect(late[late.length - 1]).toBeCloseTo(annuityFV(500, 7, 300), 4);
  });
  it('catch-up payment round-trips', () => {
    const target = annuityFV(300, 7, 420);
    expect(annuityFV(paymentForFV(target, 7, 360), 7, 360)).toBeCloseTo(target, 4);
  });
});
