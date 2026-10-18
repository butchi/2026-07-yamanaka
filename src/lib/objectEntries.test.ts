import { describe, expect, it } from "vitest";
import { publishedConcepts } from "./conceptRegistry";
import { resolveObjectEntries } from "./objectEntries";

const dataEntries = publishedConcepts.map((id) => ({
  id,
  data: {
    conceptId: id,
    relatedConceptIds: publishedConcepts.filter((related) => related !== id),
  },
}));
const documents = publishedConcepts.map((id) => ({ id, body: `Definition of ${id}` }));
const datasets = publishedConcepts.flatMap((objectId) => {
  const terms = Array.from({ length: 256 }, (_, index) => String(index));
  return [
    {
      id: `${objectId}/data/digest`,
      data: {
        objectId,
        format: "digest" as const,
        indexOrigin: 0,
        valueEncoding: "base10-integer-string" as const,
        terms: terms.slice(0, 16),
      },
    },
    {
      id: `${objectId}/data/standard`,
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
  it("joins metadata, Markdown, persisted datasets, and calculation adapters by ID", () => {
    const entries = resolveObjectEntries(
      [...dataEntries].reverse(),
      [...documents].reverse(),
      [...datasets].reverse(),
    );
    expect(entries.map(({ concept }) => concept.id)).toEqual(publishedConcepts);
    expect(entries[0].document.body).toBe("Definition of fibonacci");
    expect(entries[0].digest.data.terms).toHaveLength(16);
    expect(entries[0].standard.data.terms).toHaveLength(256);
    expect(entries[0].relatedConcepts.map(({ id }) => id)).toEqual(["prime", "square"]);
  });

  it("rejects missing JSON data", () => {
    expect(() => resolveObjectEntries(dataEntries.slice(1), documents, datasets)).toThrow(
      /requires objects\/fibonacci\/object.json/,
    );
  });

  it("rejects missing or empty Markdown", () => {
    expect(() => resolveObjectEntries(dataEntries, documents.slice(1), datasets)).toThrow(
      /non-empty objects\/fibonacci\/overview.md/,
    );
    expect(() => resolveObjectEntries(
      dataEntries,
      [{ id: "fibonacci", body: " \n" }, ...documents.slice(1)],
      datasets,
    )).toThrow(/non-empty objects\/fibonacci\/overview.md/);
  });

  it("rejects a JSON concept ID that differs from its directory name", () => {
    expect(() => resolveObjectEntries([
      { id: "fibonacci", data: { conceptId: "square", relatedConceptIds: [] } },
      ...dataEntries.slice(1),
    ], documents, datasets)).toThrow(/must match its directory name/);
  });

  it("rejects unregistered objects and duplicate IDs", () => {
    expect(() => resolveObjectEntries(
      [
      ...dataEntries,
      { id: "unknown", data: { conceptId: "unknown", relatedConceptIds: [] } },
      ],
      documents,
      datasets,
    )).toThrow(/No calculation adapter/);
    expect(() => resolveObjectEntries(
      dataEntries,
      [...documents, documents[0]],
      datasets,
    )).toThrow(/Duplicate object ID/);
  });

  it.each([
    ["unknown"],
    ["fibonacci"],
    ["prime", "prime"],
  ])("rejects invalid related object references: %j", (...relatedConceptIds) => {
    expect(() => resolveObjectEntries(
      [
        { id: "fibonacci", data: { conceptId: "fibonacci", relatedConceptIds } },
        ...dataEntries.slice(1),
      ],
      documents,
      datasets,
    )).toThrow(/Invalid or duplicate related object/);
  });

  it("requires exact 16- and 256-term datasets with a shared prefix", () => {
    expect(() => resolveObjectEntries(dataEntries, documents, datasets.slice(2))).toThrow(
      /data\/digest.json/,
    );
    const shortDigest = datasets.map((dataset, index) =>
      index === 0
        ? { ...dataset, data: { ...dataset.data, terms: dataset.data.terms.slice(1) } }
        : dataset,
    );
    expect(() => resolveObjectEntries(dataEntries, documents, shortDigest)).toThrow(
      /Invalid digest dataset/,
    );
    const mismatchedPrefix = datasets.map((dataset, index) =>
      index === 1
        ? { ...dataset, data: { ...dataset.data, terms: ["999", ...dataset.data.terms.slice(1)] } }
        : dataset,
    );
    expect(() => resolveObjectEntries(dataEntries, documents, mismatchedPrefix)).toThrow(
      /prefix of standard data/,
    );
  });
});
