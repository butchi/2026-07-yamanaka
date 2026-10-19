import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { uuidV7Pattern } from "./lib/objectIdentity";

const objectId = z.string().regex(uuidV7Pattern);

const objectReadmes = defineCollection({
  loader: glob({
    pattern: "*/README{,.ja}.md",
    base: "./objects",
    generateId: ({ entry }) => `${entry.split("/")[0]}${entry.endsWith(".ja.md") ? "/ja" : ""}`,
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
    id: objectId,
    conceptId: z.string().min(1),
    seo: z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
    }).strict(),
    relatedObjectIds: z.array(objectId),
    translations: z.object({
      ja: z.object({
        seo: z.object({
          title: z.string().trim().min(1),
          description: z.string().trim().min(1),
        }).strict(),
      }).strict().optional(),
    }).strict().optional(),
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
    objectId,
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

export const collections = { objectReadmes, objects, datasets };
