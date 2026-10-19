import { describe, expect, it } from "vitest";
import { resolveConstantEntries } from "./constantEntries";
import { mathematicalConstantIdentities } from "./objectIdentity";
import type { ObjectDatasetEntry } from "./objectDatasetTypes";

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
    format: "exact-constant",
    valueType: "irrational",
    symbol: "φ",
    exactValue: "(1 + √5) / 2",
  },
}];
const datasets: ObjectDatasetEntry[] = [
  {
    id: `${identity.slug}/data/digest`,
    data: {
      objectId: identity.id,
      format: "digest" as const,
      valueType: "irrational",
      value: 1.6180339887498948,
      approximationMethod: "truncated",
      decimalPlaces: 16,
    },
  },
  {
    id: `${identity.slug}/data/standard`,
    data: {
      objectId: identity.id,
      format: "standard" as const,
      valueType: "irrational",
      valueEncoding: "decimal-string",
      value: "1.6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374847540880753868917521266338622235369317931800607667263544333890865959395829056383226613199282902678806752087668925017116962070322210432162695486262963136144",
      approximationMethod: "truncated",
      decimalPlaces: 256,
    },
  },
];

describe("constant object content pairing", () => {
  it("joins object metadata, typed value data and bilingual documentation", () => {
    const [entry] = resolveConstantEntries(objects, readmes, values, datasets);

    expect(entry.object.data.type).toBe("mathematical-constant");
    expect(entry.value.data.exactValue).toBe("(1 + √5) / 2");
    expect(entry.digest.data.value).toBe(1.6180339887498948);
    expect(entry.standard.data.value).toHaveLength(258);
    expect(entry.readme.body).toBe("Definition");
    expect(entry.japaneseReadme?.body).toBe("定義");
  });

  it("requires a non-empty English README", () => {
    expect(() => resolveConstantEntries(objects, [
      { id: identity.slug, body: " " },
      readmes[1],
    ], values, datasets)).toThrow(/non-empty objects\/golden-ratio\/README.md/);
  });

  it("requires Japanese SEO and README together", () => {
    expect(() => resolveConstantEntries(objects, readmes.slice(0, 1), values, datasets))
      .toThrow(/Japanese README and SEO/);
    const englishOnly = [{
      ...objects[0],
      data: { ...objects[0].data, translations: undefined },
    }];
    expect(() => resolveConstantEntries(englishOnly, readmes, values, datasets))
      .toThrow(/Japanese README and SEO/);
  });

  it("requires both fixed-precision approximation datasets", () => {
    expect(() => resolveConstantEntries(objects, readmes, values, datasets.slice(0, 1)))
      .toThrow(/requires digest.json and standard.json/);
  });
});
