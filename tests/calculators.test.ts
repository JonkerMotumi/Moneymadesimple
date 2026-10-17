import { describe, expect, it } from 'vitest';
import { calculators, defaults } from '../src/lib/calculators';
import { topics } from '../src/lib/topics';

// Replace/extend the expected values here with your own test cases.
describe('registry', () => {
  it('registers the calculators with unique slugs', () => {
    expect(calculators.map((c) => c.slug).sort()).toEqual([
      'budget-split',
      'cash-out-refinance-vs-credit-card',
      'credit-card-payoff',
      'late-starter-savings',
      'mortgage-extra-payments',
    ]);
  });
  it('every calculator computes with its defaults and lists assumptions', () => {
    for (const c of calculators) {
      const out = c.compute(defaults(c));
      expect(out.headline.value).toMatch(/\d/);
      expect(c.assumptions.length).toBeGreaterThan(2);
      expect(JSON.stringify(out)).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});

describe('topics', () => {
  it('every calculator belongs to at least one real topic', () => {
    for (const c of calculators) {
      expect(c.topics.length).toBeGreaterThan(0);
      for (const t of c.topics) expect(topics.map((x) => x.slug)).toContain(t);
    }
  });
});

describe('budget split', () => {
  it('4,000 pay, 2,200 needs, 1,100 wants leaves 700 (18%)', () => {
    const out = get('budget-split').compute(defaults(get('budget-split')));
    expect(out.headline.value).toBe('$700');
    expect(out.headline.sub).toMatch(/^18%/);
  });
  it('overspending is reported as such', () => {
    const out = get('budget-split').compute({ income: 3000, needs: 2500, wants: 800 });
    expect(out.headline.label).toMatch(/overspending/);
    expect(out.headline.value).toBe('$300');
  });
});

const get = (slug: string) => calculators.find((c) => c.slug === slug)!;
const row = (slug: string, v: Record<string, number>, label: string) =>
  get(slug).compute({ ...defaults(get(slug)), ...v }).rows.find((r) => r.label.startsWith(label))!.value;

describe('mortgage extra payments', () => {
  it('250k, 6.5%, 25y: payment 1,688 and extra 150 saves interest and time', () => {
    expect(row('mortgage-extra-payments', {}, 'Normal monthly payment')).toBe('$1,688');
    const saved = Number(row('mortgage-extra-payments', {}, 'Interest saved').replace(/[$,]/g, ''));
    expect(saved).toBeGreaterThan(30000);
    expect(saved).toBeLessThan(60000);
  });
  it('zero extra saves nothing', () => {
    expect(row('mortgage-extra-payments', { extra: 0 }, 'Interest saved')).toBe('$0');
  });
});

describe('late starter', () => {
  it('300/month, 7%, 35 years, wait 5: cost of waiting matches annuity maths', () => {
    // FV(35y) - FV(30y) of 300/month at 7%/12, computed independently.
    const r = 0.07 / 12;
    const fv = (n: number) => (300 * (Math.pow(1 + r, n) - 1)) / r;
    const expected = Math.round(fv(420) - fv(360));
    const got = Number(row('late-starter-savings', {}, 'Cost of waiting').replace(/[$,]/g, ''));
    expect(got).toBe(expected);
  });
  it('no delay costs nothing', () => {
    expect(row('late-starter-savings', { delay: 0 }, 'Cost of waiting')).toBe('$0');
  });
});

describe('credit card payoff', () => {
  it('zero extra saves nothing (same path as minimums)', () => {
    expect(get('credit-card-payoff').compute({ ...defaults(get('credit-card-payoff')), extra: 0 }).headline.value).toBe('$0');
  });
  it('extra payment always saves interest and time', () => {
    const out = get('credit-card-payoff').compute(defaults(get('credit-card-payoff')));
    const saved = Number(out.headline.value.replace(/[$,]/g, ''));
    expect(saved).toBeGreaterThan(0);
  });
});

describe('cash-out refi vs card', () => {
  it('high-rate card rolled into a cheap mortgage can win; costly mortgage rate loses', () => {
    const cheap = get('cash-out-refinance-vs-credit-card').compute({
      ...defaults(get('cash-out-refinance-vs-credit-card')),
      cardPayment: 250, // slow card payoff at 22% is costlier than rolling it into a 4% loan
      newRate: 4,
      newYears: 25,
      fees: 0,
    });
    expect(cheap.headline.label).toMatch(/saves/);
    const dear = get('cash-out-refinance-vs-credit-card').compute(defaults(get('cash-out-refinance-vs-credit-card')));
    expect(dear.headline.label).toMatch(/costs/);
  });
});
