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

const datasets = defineCollection({
  loader: glob({
    pattern: "*/data/*.json",
    base: "./objects",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: z.object({
    objectId: z.string().min(1),
    format: z.enum(["digest", "standard"]),
    indexOrigin: z.number().int(),
    valueEncoding: z.literal("base10-integer-string"),
    terms: z.array(z.string().regex(/^-?(0|[1-9]\d*)$/)),
  }).strict().superRefine((dataset, context) => {
    const expectedCount = dataset.format === "digest" ? 16 : 256;
    if (dataset.terms.length !== expectedCount) {
      context.addIssue({
        code: "custom",
        message: `${dataset.format} data must contain exactly ${expectedCount} terms.`,
        path: ["terms"],
      });
    }
  }),
});

export const collections = { documents, objects, datasets };
