import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { bigint, number } from "@butchi/integer-sequences";
import { describe, expect, it } from "vitest";

const objectMetadata = Object.entries(import.meta.glob<{ id: string; conceptId: string }>(
  "../../objects/*/object.json", { eager: true, import: "default" },
));

const sequences = [
  ["fibonacci", bigint.fibonacci],
  ["prime", number.prime],
  ["square", bigint.square],
] as const;

describe("persisted object datasets", () => {
  it.each(sequences)("%s stores a compact 16-term digest and exact 256-term standard set", async (conceptId, sequence) => {
    const object = objectMetadata.find(([, entry]) => entry.conceptId === conceptId);
    if (!object) throw new Error(`Missing object identity for ${conceptId}`);
    const objectId = object[1].id;
    const directory = object[0].split("/").at(-2)!;
    const standard = JSON.parse(
      await readFile(resolve("objects", directory, "data", "standard.json"), "utf8"),
    ) as { terms: string[]; format: string; objectId: string; indexOrigin: number };
    const digest = JSON.parse(
      await readFile(resolve("objects", directory, "data", "digest.json"), "utf8"),
    ) as { terms: number[]; format: string; objectId: string; indexOrigin: number };
    const expectedTerms = sequence.take(256).map(String);

    expect(standard).toMatchObject({
      objectId,
      format: "standard",
      indexOrigin: 0,
    });
    expect(digest).toMatchObject({
      objectId,
      format: "digest",
      indexOrigin: 0,
    });
    expect(standard.terms).toEqual(expectedTerms);
    expect(digest.terms.every(Number.isSafeInteger)).toBe(true);
    expect(digest.terms.map(String)).toEqual(expectedTerms.slice(0, 16));
  });
});
