import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function allPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', (p) => import.meta.env.DEV || !p.data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const readingMinutes = (body = '') => Math.max(1, Math.round(body.split(/\s+/).length / 220));

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
