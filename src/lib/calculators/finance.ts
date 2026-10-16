// Pure maths. No formatting, no DOM. Everything here is unit-tested.

/** Level monthly payment on a fully-amortising loan. */
export function pmt(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return principal;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export interface Amortization {
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** false when the payment can't beat the interest (or hits the safety cap). */
  paidOff: boolean;
  /** Balance at the end of each month, starting with month 0 = opening balance. */
  balances: number[];
}

const MAX_MONTHS = 1200; // 100 years: beyond this we call it "never"

/**
 * Month-by-month payoff. `paymentFor(balance, interest)` returns what the
 * borrower pays that month (capped at what's owed), so both fixed payments and
 * "minimum payment" rules can use the same engine.
 */
export function amortize(
  principal: number,
  annualRatePct: number,
  paymentFor: (balance: number, interest: number) => number,
): Amortization {
  const r = annualRatePct / 100 / 12;
  let bal = principal;
  let totalInterest = 0;
  let totalPaid = 0;
  const balances = [principal];
  let months = 0;
  while (bal > 0.005 && months < MAX_MONTHS) {
    const interest = bal * r;
    const pay = Math.min(bal + interest, Math.max(0, paymentFor(bal, interest)));
    if (pay <= interest + 1e-9 && pay < bal + interest) {
      // Payment doesn't even cover interest: balance never falls.
      return { months: MAX_MONTHS, totalInterest, totalPaid, paidOff: false, balances };
    }
    bal = bal + interest - pay;
    totalInterest += interest;
    totalPaid += pay;
    months++;
    balances.push(Math.max(0, bal));
  }
  return { months, totalInterest, totalPaid, paidOff: bal <= 0.005, balances };
}

/** Fixed monthly payment. */
export const fixedPayment = (p: number) => () => p;

/** Typical card minimum: interest plus 1% of the balance, never below `floor`. */
export const cardMinimum = (floor = 25) => (bal: number, interest: number) =>
  Math.max(floor, interest + bal * 0.01);

/**
 * Future value of a monthly saving habit.
 * Contributions are made at the END of each month; interest compounds monthly.
 * Returns the balance after each year (index 0 = today).
 */
export function savingsGrowth(
  monthly: number,
  annualRatePct: number,
  startMonth: number,
  totalMonths: number,
  startingBalance = 0,
): number[] {
  const r = annualRatePct / 100 / 12;
  let bal = startingBalance;
  const yearly = [bal];
  for (let m = 1; m <= totalMonths; m++) {
    bal = bal * (1 + r) + (m > startMonth ? monthly : 0);
    if (m % 12 === 0) yearly.push(bal);
  }
  return yearly;
}

/** Closed-form future value of an end-of-month annuity (used to cross-check). */
export function annuityFV(monthly: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return monthly * months;
  return (monthly * (Math.pow(1 + r, months) - 1)) / r;
}

/** Monthly saving needed to reach `target` in `months` (end-of-month deposits). */
export function paymentForFV(target: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (months <= 0) return Infinity;
  if (r === 0) return target / months;
  return (target * r) / (Math.pow(1 + r, months) - 1);
}
