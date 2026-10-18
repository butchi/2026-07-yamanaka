import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const documents = defineCollection({
  loader: glob({
    pattern: "*/overview.md",
    base: "./objects",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z.object({}).strict(),
});

const objects = defineCollection({
  loader: glob({
    pattern: "*/object.json",
    base: "./objects",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z.object({
    conceptId: z.string().min(1),
    seo: z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
    }).strict(),
    relatedConceptIds: z.array(z.string().min(1)),
    blog: z.object({
      title: z.string().trim().min(1),
      url: z.url({ protocol: /^https?$/ }),
    }).strict().optional(),
  }).strict(),
});

export const collections = { documents, objects };
