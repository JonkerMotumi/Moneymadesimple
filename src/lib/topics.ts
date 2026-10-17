// The everyday money topics the site is organised around. Each topic gets a page at
// /topics/<slug>, and calculators (`topics: [...]`) and blog posts (`topic: ...`)
// point at these slugs. Add a topic here and its page appears automatically.

export interface Topic {
  slug: string;
  name: string;
  /** One line for cards. */
  blurb: string;
  /** Short plain-English rules of thumb shown on the topic page. */
  basics: string[];
  /** Inline SVG path data (24×24, stroke icons). */
  icon: string;
}

export const topics = [
  {
    slug: 'budgeting',
    name: 'Budgeting',
    blurb: 'Know where your pay goes each month, and keep some of it.',
    basics: [
      'Pay yourself first: move savings out on payday, before you spend.',
      'A simple split helps: about half for needs, a third for wants, a fifth for saving and debt.',
      'Track for one month before you change anything. The numbers usually surprise people.',
    ],
    icon: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  },
  {
    slug: 'debt',
    name: 'Debt & credit',
    blurb: 'See what borrowing really costs, and the fastest way out.',
    basics: [
      'Pay more than the minimum. The minimum is designed to keep you paying for years.',
      'Clear the highest interest rate first: every extra dollar there saves the most.',
      'A lower monthly payment is not the same as a cheaper loan. Check the total cost.',
    ],
    icon: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  },
  {
    slug: 'saving',
    name: 'Saving & investing',
    blurb: 'Make time and compound growth work for you, not against you.',
    basics: [
      'Build an emergency fund of three to six months of essential costs first.',
      'Start early, even small. Time does more of the work than the amount.',
      'Returns are never guaranteed, and fees quietly take a share every year.',
    ],
    icon: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  },
  {
    slug: 'home',
    name: 'Home & mortgages',
    blurb: 'Pay off your home sooner and avoid the costly refinance traps.',
    basics: [
      'Small extra payments early in a mortgage save the most interest.',
      'Before refinancing, compare the total cost over the whole loan, not just the payment.',
      'Check for prepayment penalties and keep an emergency fund before overpaying.',
    ],
    icon: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  },
] as const satisfies readonly Topic[];

export type TopicSlug = (typeof topics)[number]['slug'];
export const topicSlugs = topics.map((t) => t.slug) as [TopicSlug, ...TopicSlug[]];
export const getTopic = (slug: string): Topic | undefined => topics.find((t) => t.slug === slug);
