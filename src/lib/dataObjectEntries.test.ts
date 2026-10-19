import { describe, expect, it } from "vitest";
import { resolveDataObjectEntries } from "./dataObjectEntries";
import type { ObjectIdentity } from "./objectIdentity";
import type { JsonValue } from "./objectDatasetTypes";

const identity: ObjectIdentity = {
  id: "01a15005-fe79-7ac4-bfaf-8b8e82577000",
  slug: "fibonacci-words",
  type: "data-object",
  previousSlugs: [],
};

const objects = [{
  id: identity.slug,
  data: {
    type: "data-object",
    id: identity.id,
    name: { en: "Fibonacci words", ja: "フィボナッチ語" },
    seo: { title: "Fibonacci words", description: "Finite words defined by Fibonacci recurrence." },
    relatedObjectIds: [],
  },
}];
const readmes = [{ id: identity.slug, body: "# Fibonacci words\n\nThe words are strings." }];
const content = (value: JsonValue) => ({
  id: `${identity.slug}/data/content`,
  data: { objectId: identity.id, format: "json" as const, value },
});
const matrix = (values: JsonValue[][]) => ({
  id: `${identity.slug}/data/content`,
  data: {
    objectId: identity.id,
    format: "matrix" as const,
    rowIndexOrigin: 1,
    columnIndexOrigin: 1,
    values,
  },
});

describe("generic JSON data objects", () => {
  it.each([
    ["number", 42],
    ["string", "010010"],
    ["string sequence", ["0", "01", "010"]],
    ["object", { words: ["0", "01", "010"], indexOrigin: 0 }],
  ])("accepts a JSON %s value", (_label, value) => {
    const [entry] = resolveDataObjectEntries(objects, readmes, [content(value)], [identity]);
    expect(entry.content.data).toMatchObject({ format: "json", value });
    expect(entry.identity).toEqual(identity);
  });

  it("pairs translations with Japanese README and links the raw content dataset", () => {
    const japaneseReadme = { id: `${identity.slug}/ja`, body: "# フィボナッチ語\n\n文字列の列です。" };
    const localized = [{
      ...objects[0],
      data: {
        ...objects[0].data,
        translations: { ja: { seo: { title: "フィボナッチ語", description: "再帰的に定義される有限文字列です。" } } },
      },
    }];
    const [entry] = resolveDataObjectEntries(localized, [...readmes, japaneseReadme], [content("010")], [identity]);
    expect(entry.japaneseReadme).toBe(japaneseReadme);
    expect(entry.content.id).toBe("fibonacci-words/data/content");
    expect(() => resolveDataObjectEntries(localized, readmes, [content("010")], [identity]))
      .toThrow(/Japanese README and SEO/);
  });

  it("preserves matrix rows, columns and their index origins", () => {
    const values = [[1, 2], [3, 5]];
    const [entry] = resolveDataObjectEntries(objects, readmes, [matrix(values)], [identity]);
    expect(entry.content.data).toEqual({
      objectId: identity.id,
      format: "matrix",
      rowIndexOrigin: 1,
      columnIndexOrigin: 1,
      values,
    });
  });

  it("rejects missing data, invalid dataset paths and unrelated identities", () => {
    expect(() => resolveDataObjectEntries(objects, readmes, [], [identity]))
      .toThrow(/requires data\/content.json/);
    expect(() => resolveDataObjectEntries(objects, readmes, [{
      ...content("010"),
      id: "another-object/data/content",
    }], [identity])).toThrow(/Invalid JSON dataset/);
    expect(() => resolveDataObjectEntries(objects, readmes, [content("010")], []))
      .toThrow(/matching data-object identity/);
  });
});
