import type { CalculatorDef } from './types';

// Drop a new file into ./defs that default-exports a CalculatorDef and it is
// registered automatically: no other code to touch.
const modules = import.meta.glob<{ default: CalculatorDef }>('./defs/*.ts', { eager: true });

export const calculators: CalculatorDef[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.title.localeCompare(b.title));

export const getCalculator = (slug: string) => calculators.find((c) => c.slug === slug);

export const defaults = (c: CalculatorDef): Record<string, number> =>
  Object.fromEntries(c.inputs.map((i) => [i.id, i.default]));
