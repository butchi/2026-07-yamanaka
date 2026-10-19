import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { uuidV7Pattern } from "./lib/objectIdentity";
import { isSafeContentMathML } from "./lib/contentMathML";

const objectId = z.string().regex(uuidV7Pattern);
const seo = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
}).strict();
const translations = z.object({
  ja: z.object({ seo }).strict().optional(),
}).strict().optional();

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
  schema: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("integer-sequence"),
      id: objectId,
      conceptId: z.string().min(1),
      seo,
      relatedObjectIds: z.array(objectId),
      translations,
      blog: z.object({
        title: z.string().trim().min(1),
        url: z.url({ protocol: /^https?$/ }),
      }).strict().optional(),
    }).strict(),
    z.object({
      type: z.literal("mathematical-constant"),
      id: objectId,
      name: z.object({
        en: z.string().trim().min(1),
        ja: z.string().trim().min(1),
      }).strict(),
      seo,
      relatedObjectIds: z.array(objectId),
      translations,
    }).strict(),
    z.object({
      type: z.literal("data-object"),
      id: objectId,
      name: z.object({
        en: z.string().trim().min(1),
        ja: z.string().trim().min(1),
      }).strict(),
      seo,
      relatedObjectIds: z.array(objectId),
      translations,
    }).strict(),
  ]),
});

const datasets = defineCollection({
  loader: glob({
    pattern: "*/data/{digest,standard,content}.json",
    base: "./objects",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: z.union([
    z.object({
      objectId,
      format: z.literal("digest"),
      indexOrigin: z.number().int(),
      terms: z.array(z.number().int().gte(Number.MIN_SAFE_INTEGER).lte(Number.MAX_SAFE_INTEGER)),
    }).strict().superRefine((dataset, context) => {
      if (dataset.terms.length !== 16) {
        context.addIssue({
          code: "custom",
          message: "digest data must contain exactly 16 terms.",
          path: ["terms"],
        });
      }
    }),
    z.object({
      objectId,
      format: z.literal("digest"),
      valueType: z.literal("irrational"),
      value: z.number().gte(Number.MIN_SAFE_INTEGER).lte(Number.MAX_SAFE_INTEGER),
      approximationMethod: z.literal("truncated"),
      decimalPlaces: z.literal(16),
    }).strict().superRefine((dataset, context) => {
      if (!Number.isFinite(dataset.value)) {
        context.addIssue({ code: "custom", message: "digest value must be finite.", path: ["value"] });
      }
    }),
    z.object({
      objectId,
      format: z.literal("standard"),
      indexOrigin: z.number().int(),
      valueEncoding: z.literal("base10-integer-string"),
      terms: z.array(z.string().regex(/^-?(0|[1-9]\d*)$/)),
    }).strict().superRefine((dataset, context) => {
      if (dataset.terms.length !== 256) {
        context.addIssue({
          code: "custom",
          message: "standard data must contain exactly 256 terms.",
          path: ["terms"],
        });
      }
    }),
    z.object({
      objectId,
      format: z.literal("standard"),
      valueType: z.literal("irrational"),
      valueEncoding: z.literal("decimal-string"),
      value: z.string().regex(/^-?(0|[1-9]\d*)\.\d+$/),
      approximationMethod: z.literal("truncated"),
      decimalPlaces: z.literal(256),
    }).strict().superRefine((dataset, context) => {
      if (dataset.value.split(".")[1]?.length !== dataset.decimalPlaces) {
        context.addIssue({
          code: "custom",
          message: "standard value must contain exactly 256 decimal places.",
          path: ["value"],
        });
      }
    }),
    z.object({
      objectId,
      format: z.literal("json"),
      value: z.json(),
    }).strict(),
  ]),
});

const objectValues = defineCollection({
  loader: glob({
    pattern: "*/data/value.json",
    base: "./objects",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: z.object({
    objectId,
    format: z.literal("exact-constant"),
    valueType: z.literal("irrational"),
    symbol: z.string().trim().min(1),
    exactValue: z.string().trim().min(1),
    exactValueContentMathML: z.string().refine(isSafeContentMathML, "Must be safe, well-formed Content MathML."),
    exactValuePresentationMathML: z.string().refine(isSafeContentMathML, "Must be safe, well-formed Presentation MathML."),
  }).strict(),
});

export const collections = { objectReadmes, objects, datasets, objectValues };
