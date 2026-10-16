import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(70, 'Keep titles under ~60 characters so they fit in Google results'),
    description: z.string().min(50).max(170),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    /** Slug of a calculator to embed under the article, e.g. "credit-card-payoff". */
    calculator: z.string().optional(),
    /** Shows the affiliate disclosure at the top of the article. */
    affiliate: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
