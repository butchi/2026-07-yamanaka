import { describe, expect, it } from "vitest";
import { publishedConcepts } from "./conceptRegistry";
import { resolveObjectEntries } from "./objectEntries";
import { objectIdentities, createObjectRedirects } from "./objectIdentity";

const [fibonacci, prime, square] = objectIdentities;

const dataEntries = objectIdentities.map(({ id, slug }, index) => ({
  id: slug,
  data: {
    id,
    conceptId: publishedConcepts[index],
    relatedObjectIds: objectIdentities.filter((related) => related.id !== id).map(({ id }) => id),
  },
}));
const readmes = objectIdentities.map(({ slug }, index) => ({ id: slug, body: `Definition of ${publishedConcepts[index]}` }));
const datasets = objectIdentities.flatMap(({ id: objectId, slug }) => {
  const terms = Array.from({ length: 256 }, (_, index) => String(index));
  return [
    {
      id: `${slug}/data/digest`,
      data: {
        objectId,
        format: "digest" as const,
        indexOrigin: 0,
        valueEncoding: "base10-integer-string" as const,
        terms: terms.slice(0, 16),
      },
    },
    {
      id: `${slug}/data/standard`,
      data: {
        objectId,
        format: "standard" as const,
        indexOrigin: 0,
        valueEncoding: "base10-integer-string" as const,
        terms,
      },
    },
  ];
});

describe("object content pairing", () => {
  it("allows English-only objects and pairs Japanese text with its SEO without duplicating identity", () => {
    const translations = { ja: { seo: { title: "日本語", description: "説明" } } };
    const localized = dataEntries.map((entry, index) => index === 0 ? { ...entry, data: { ...entry.data, translations } } : entry);
    const japanese = { id: "fibonacci/ja", body: "# フィボナッチ数\n\n定義" };
    const entries = resolveObjectEntries(localized, [...readmes, japanese], datasets);
    expect(entries[0].readme).toBe(readmes[0]);
    expect(entries[0].japaneseReadme).toBe(japanese);
    expect(entries[1].japaneseReadme).toBeUndefined();
    expect(entries[0].identity.id).toBe(fibonacci.id);
    expect(entries[1].relatedObjects.find(({ identity }) => identity.id === fibonacci.id)?.hasJapanese).toBe(true);
    expect(() => resolveObjectEntries(localized, readmes, datasets)).toThrow(/Japanese README and SEO/);
    expect(() => resolveObjectEntries(dataEntries, [...readmes, japanese], datasets)).toThrow(/Japanese README and SEO/);
    expect(() => resolveObjectEntries(localized, [...readmes, { ...japanese, body: " " }], datasets)).toThrow(/must not be empty/);
  });

  it("joins metadata, Markdown, persisted datasets, and calculation adapters by ID", () => {
    const entries = resolveObjectEntries(
      [...dataEntries].reverse(),
      [...readmes].reverse(),
      [...datasets].reverse(),
    );
    expect(entries.map(({ concept }) => concept.id)).toEqual(publishedConcepts);
    expect(entries[0].readme.body).toBe("Definition of fibonacci");
    expect(entries[0].digest.data.terms).toHaveLength(16);
    expect(entries[0].standard.data.terms).toHaveLength(256);
    expect(entries[0].relatedObjects.map(({ identity }) => identity.id)).toEqual([prime.id, square.id]);
  });

  it("rejects missing JSON data", () => {
    expect(() => resolveObjectEntries(dataEntries.slice(1), readmes.slice(1), datasets.slice(2))).toThrow(
      /requires an objects\/<directory>\/object.json/,
    );
  });

  it("rejects missing or empty Markdown", () => {
    expect(() => resolveObjectEntries(dataEntries, readmes.slice(1), datasets)).toThrow(
      "non-empty objects/fibonacci/README.md",
    );
    expect(() => resolveObjectEntries(
      dataEntries,
      [{ id: "fibonacci", body: " \n" }, ...readmes.slice(1)],
      datasets,
    )).toThrow("non-empty objects/fibonacci/README.md");
  });

  it("rejects the same UUID in different directories", () => {
    expect(() => resolveObjectEntries([
      { id: "fibonacci", data: { id: square.id, conceptId: "fibonacci", relatedObjectIds: [] } },
      ...dataEntries.slice(1),
    ], readmes, datasets)).toThrow(/Duplicate object ID/);
  });

  it("rejects unregistered objects and duplicate IDs", () => {
    expect(() => resolveObjectEntries(
      [
      ...dataEntries,
      { id: "unknown", data: { id: "unknown", conceptId: "unknown", relatedObjectIds: [] } },
      ],
      readmes,
      datasets,
    )).toThrow(/No identity/);
    expect(() => resolveObjectEntries(
      dataEntries,
      [...readmes, readmes[0]],
      datasets,
    )).toThrow(/duplicate object README/);
  });

  it.each([
    ["unknown"],
    [fibonacci.id],
    [prime.id, prime.id],
  ])("rejects invalid related object references: %j", (...relatedObjectIds) => {
    expect(() => resolveObjectEntries(
      [
        { id: "fibonacci", data: { id: fibonacci.id, conceptId: "fibonacci", relatedObjectIds } },
        ...dataEntries.slice(1),
      ],
      readmes,
      datasets,
    )).toThrow(/Invalid or duplicate related object/);
  });

  it("keeps UUID references and adapters stable when a slug changes", () => {
    const renamed = objectIdentities.map((identity) => identity.id === fibonacci.id
      ? { ...identity, slug: "fibonacci-numbers", previousSlugs: [identity.slug] }
      : identity);
    const entries = resolveObjectEntries(dataEntries, readmes, datasets, renamed);
    expect(entries[0].identity.slug).toBe("fibonacci-numbers");
    expect(entries[0].concept.id).toBe("fibonacci");
    expect(entries[1].relatedObjects[0].identity.id).toBe(fibonacci.id);
    expect(entries[1].relatedObjects[0].identity.slug).toBe("fibonacci-numbers");
    expect(createObjectRedirects(renamed)[`/id/${fibonacci.id}/`]).toBe("/numbers/fibonacci-numbers/");
    expect(createObjectRedirects(renamed)["/numbers/fibonacci/"]).toBe("/numbers/fibonacci-numbers/");
  });

  it("resolves UUID references after a source directory is renamed independently of its slug", () => {
    const renamedObjects = dataEntries.map((entry) => entry.id === "fibonacci"
      ? { ...entry, id: "fibonacci-numbers" } : entry);
    const renamedReadmes = readmes.map((entry) => entry.id === "fibonacci"
      ? { ...entry, id: "fibonacci-numbers" } : entry);
    const renamedDatasets = datasets.map((entry) => ({
      ...entry, id: entry.id.replace(/^fibonacci\//, "fibonacci-numbers/"),
    }));
    const entries = resolveObjectEntries(renamedObjects, renamedReadmes, renamedDatasets);
    expect(entries[0].sourceDirectory).toBe("fibonacci-numbers");
    expect(entries[0].identity).toEqual(fibonacci);
    expect(entries[0].digest.data.objectId).toBe(fibonacci.id);
    expect(entries[1].relatedObjects[0].identity.id).toBe(fibonacci.id);
  });

  it("rejects datasets placed under another object's directory", () => {
    expect(() => resolveObjectEntries(dataEntries, readmes, datasets.map((entry, index) =>
      index === 0 ? { ...entry, id: "prime/data/digest" } : entry,
    ))).toThrow(/Invalid dataset ID/);
  });

  it("rejects unknown and duplicate calculation adapters", () => {
    for (const conceptId of ["unknown", "prime"]) {
      expect(() => resolveObjectEntries([
        { ...dataEntries[0], data: { ...dataEntries[0].data, conceptId } },
        ...dataEntries.slice(1),
      ], readmes, datasets)).toThrow(/Invalid or duplicate calculation adapter/);
    }
  });

  it("requires exact 16- and 256-term datasets with a shared prefix", () => {
    expect(() => resolveObjectEntries(dataEntries, readmes, datasets.slice(2))).toThrow(
      /data\/digest.json/,
    );
    const shortDigest = datasets.map((dataset, index) =>
      index === 0
        ? { ...dataset, data: { ...dataset.data, terms: dataset.data.terms.slice(1) } }
        : dataset,
    );
    expect(() => resolveObjectEntries(dataEntries, readmes, shortDigest)).toThrow(
      /Invalid digest dataset/,
    );
    const mismatchedPrefix = datasets.map((dataset, index) =>
      index === 1
        ? { ...dataset, data: { ...dataset.data, terms: ["999", ...dataset.data.terms.slice(1)] } }
        : dataset,
    );
    expect(() => resolveObjectEntries(dataEntries, readmes, mismatchedPrefix)).toThrow(
      /prefix of standard data/,
    );
  });
});
