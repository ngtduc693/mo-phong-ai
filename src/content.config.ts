import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const levels = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/levels' }),
  schema: z.object({
    levelId: z.string(),
    title: z.string(),
    description: z.string(),
    steps: z.array(z.string()),
    faq: z.array(z.object({ q: z.string(), a: z.string() })),
    keywords: z.array(z.string()).default([]),
  }),
});

export const collections = { levels };
