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

  it("stores Fibonacci words as a zero-based JSON string sequence", async () => {
    const object = JSON.parse(
      await readFile(resolve("objects", "fibonacci-words", "object.json"), "utf8"),
    ) as { id: string; type: string };
    const content = JSON.parse(
      await readFile(resolve("objects", "fibonacci-words", "data", "content.json"), "utf8"),
    ) as { objectId: string; format: string; value: { definition: { indexOrigin: number }; terms: string[] } };
    expect(object.type).toBe("data-object");
    expect(content).toMatchObject({
      objectId: object.id,
      format: "json",
      value: { definition: { indexOrigin: 0 } },
    });
    expect(content.value.terms.slice(0, 2)).toEqual(["0", "01"]);
    for (let index = 2; index < content.value.terms.length; index += 1) {
      expect(content.value.terms[index]).toBe(
        content.value.terms[index - 1] + content.value.terms[index - 2],
      );
    }
  });

  it("stores the Wythoff array as a row-major matrix excerpt with one-based indices", async () => {
    const object = JSON.parse(
      await readFile(resolve("objects", "wythoff-array", "object.json"), "utf8"),
    ) as { id: string; type: string };
    const dataset = JSON.parse(
      await readFile(resolve("objects", "wythoff-array", "data", "content.json"), "utf8"),
    ) as {
      objectId: string;
      format: string;
      rowIndexOrigin: number;
      columnIndexOrigin: number;
      values: number[][];
    };
    expect(object.type).toBe("data-object");
    expect(dataset).toMatchObject({
      objectId: object.id,
      format: "matrix",
      rowIndexOrigin: 1,
      columnIndexOrigin: 1,
    });
    expect(dataset.values).toHaveLength(10);
    expect(dataset.values.every((row) => row.length === 10)).toBe(true);
    expect(dataset.values.slice(0, 5).map((row) => row.slice(0, 2))).toEqual([
      [1, 2],
      [4, 7],
      [6, 10],
      [9, 15],
      [12, 20],
    ]);
    for (const row of dataset.values) {
      for (let column = 2; column < row.length; column += 1) {
        expect(row[column]).toBe(row[column - 2] + row[column - 1]);
      }
    }
    expect(new Set(dataset.values.flat()).size).toBe(100);
  });
});
