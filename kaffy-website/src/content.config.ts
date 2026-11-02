import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Each collection is a folder of Markdown files that Kaffy edits from /admin.

const podcast = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/podcast' }),
  schema: z.object({
    title: z.string(),
    episode: z.number(),
    date: z.coerce.date(),
    youtube: z.string().optional(),
    audio: z.string().optional(),
    summary: z.string(),
    category: z.string().default('Entrepreneurship'),
    guest: z.string().optional(),
    guestBio: z.string().optional(),
    lessons: z.array(z.string()).default([]),
    resources: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const documentary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/documentary' }),
  schema: z.object({
    title: z.string(),
    day: z.number(),
    date: z.coerce.date(),
    youtube: z.string().optional(),
    summary: z.string(),
    lessons: z.array(z.string()).default([]),
    photos: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    relatedPodcast: z.string().optional(),
    relatedDocumentary: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const media = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/media' }),
  schema: z.object({
    title: z.string(),
    outlet: z.string(),
    type: z.string(),
    date: z.coerce.date(),
    url: z.string().optional(),
    youtube: z.string().optional(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { podcast, documentary, articles, media };
