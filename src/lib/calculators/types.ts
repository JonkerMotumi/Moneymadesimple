export type InputKind = 'money' | 'percent' | 'years' | 'months' | 'number';

export interface InputDef {
  id: string;
  label: string;
  kind: InputKind;
  default: number;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}

export interface Row {
  label: string;
  value: string;
  /** Visually emphasise this row (the number people came for). */
  strong?: boolean;
}

export interface Series {
  label: string;
  /** y values, one per period (month or year, see ChartDef.xUnit). */
  points: number[];
  /** 'accent' = the bold green line, 'muted' = the grey comparison line. */
  tone: 'accent' | 'muted';
}

export interface ChartDef {
  title: string;
  xUnit: 'months' | 'years';
  yLabel: string;
  series: Series[];
}

export interface CalcOutput {
  /** The one big number. */
  headline: { label: string; value: string; sub?: string };
  rows: Row[];
  chart?: ChartDef;
  /** Dynamic assumptions/warnings for these particular inputs. */
  notes?: string[];
}

export interface CalculatorDef {
  slug: string;
  title: string;
  /** One sentence for cards and meta descriptions. */
  blurb: string;
  inputs: InputDef[];
  /** Always shown beside the result. Be specific. */
  assumptions: string[];
  compute(values: Record<string, number>): CalcOutput;
}
