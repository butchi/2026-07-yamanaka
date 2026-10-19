import { describe, expect, it } from "vitest";
import { resolveConstantEntries } from "./constantEntries";
import { mathematicalConstantIdentities } from "./objectIdentity";

const identity = mathematicalConstantIdentities[0];
const objects = [{
  id: identity.slug,
  data: {
    type: "mathematical-constant",
    id: identity.id,
    name: { en: "Golden ratio", ja: "黄金比" },
    seo: { title: "Golden ratio", description: "The golden ratio." },
    relatedObjectIds: [],
    translations: { ja: { seo: { title: "黄金比", description: "黄金比です。" } } },
  },
}];
const readmes = [
  { id: identity.slug, body: "Definition" },
  { id: `${identity.slug}/ja`, body: "定義" },
];
const values = [{
  id: `${identity.slug}/data/value`,
  data: {
    objectId: identity.id,
    format: "decimal-constant",
    valueType: "irrational",
    symbol: "φ",
    exactValue: "(1 + √5) / 2",
    decimalApproximation: "1.61803398874989484820458683436563811772030917980576",
    approximationMethod: "truncated",
    decimalPlaces: 50,
  },
}];

describe("constant object content pairing", () => {
  it("joins object metadata, typed value data and bilingual documentation", () => {
    const [entry] = resolveConstantEntries(objects, readmes, values);

    expect(entry.object.data.type).toBe("mathematical-constant");
    expect(entry.value.data.exactValue).toBe("(1 + √5) / 2");
    expect(entry.value.data.decimalApproximation).toHaveLength(52);
    expect(entry.readme.body).toBe("Definition");
    expect(entry.japaneseReadme?.body).toBe("定義");
  });

  it("requires a non-empty English README", () => {
    expect(() => resolveConstantEntries(objects, [
      { id: identity.slug, body: " " },
      readmes[1],
    ], values)).toThrow(/non-empty objects\/golden-ratio\/README.md/);
  });

  it("requires Japanese SEO and README together", () => {
    expect(() => resolveConstantEntries(objects, readmes.slice(0, 1), values))
      .toThrow(/Japanese README and SEO/);
    const englishOnly = [{
      ...objects[0],
      data: { ...objects[0].data, translations: undefined },
    }];
    expect(() => resolveConstantEntries(englishOnly, readmes, values))
      .toThrow(/Japanese README and SEO/);
  });
});
