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

describe("object content pairing", () => {
  it("joins JSON, Markdown, and calculation adapters by ID, not file order", () => {
    const entries = resolveObjectEntries([...dataEntries].reverse(), [...documents].reverse());
    expect(entries.map(({ concept }) => concept.id)).toEqual(publishedConcepts);
    expect(entries[0].document.body).toBe("Definition of fibonacci");
    expect(entries[0].relatedConcepts.map(({ id }) => id)).toEqual(["prime", "square"]);
  });

  it("rejects missing JSON data", () => {
    expect(() => resolveObjectEntries(dataEntries.slice(1), documents)).toThrow(
      /requires objects\/fibonacci\/object.json/,
    );
  });

  it("rejects missing or empty Markdown", () => {
    expect(() => resolveObjectEntries(dataEntries, documents.slice(1))).toThrow(
      /non-empty objects\/fibonacci\/overview.md/,
    );
    expect(() => resolveObjectEntries(dataEntries, [
      { id: "fibonacci", body: " \n" }, ...documents.slice(1),
    ])).toThrow(/non-empty objects\/fibonacci\/overview.md/);
  });

  it("rejects a JSON concept ID that differs from its directory name", () => {
    expect(() => resolveObjectEntries([
      { id: "fibonacci", data: { conceptId: "square", relatedConceptIds: [] } },
      ...dataEntries.slice(1),
    ], documents)).toThrow(/must match its directory name/);
  });

  it("rejects unregistered objects and duplicate IDs", () => {
    expect(() => resolveObjectEntries([
      ...dataEntries,
      { id: "unknown", data: { conceptId: "unknown", relatedConceptIds: [] } },
    ], documents)).toThrow(/No calculation adapter/);
    expect(() => resolveObjectEntries(dataEntries, [
      ...documents, documents[0],
    ])).toThrow(/Duplicate object ID/);
  });

  it.each([
    ["unknown"],
    ["fibonacci"],
    ["prime", "prime"],
  ])("rejects invalid related object references: %j", (...relatedConceptIds) => {
    expect(() => resolveObjectEntries([
      { id: "fibonacci", data: { conceptId: "fibonacci", relatedConceptIds } },
      ...dataEntries.slice(1),
    ], documents)).toThrow(/Invalid or duplicate related object/);
  });
});
