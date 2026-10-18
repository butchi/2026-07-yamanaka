import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createContext, runInContext, runInNewContext } from "node:vm";
import {
  bigint as bigintApi,
  number as numberApi,
} from "@butchi/integer-sequences";
import * as fibonacciModule from "../../objects/fibonacci/functions.mjs";
import * as primeModule from "../../objects/prime/functions.mjs";
import * as squareModule from "../../objects/square/functions.mjs";

describe("object function modules", () => {
  for (const [id, standalone, api] of [
    ["fibonacci", fibonacciModule.number.fibonacci, numberApi.fibonacci],
    ["prime", primeModule.number.prime, numberApi.prime],
    ["square", squareModule.number.square, numberApi.square],
  ] as const) {
    it(`${id}: runs copied source without imports or package dependencies`, async () => {
      const source = await readFile(
        new URL(`../../objects/${id}/functions.js`, import.meta.url),
        "utf8",
      );
      expect(source).not.toMatch(/\bimport\b|\bexport\b|\brequire\b/);
      const result = runInNewContext(
        `${source}\nlibra.number.${id}.take(16).join(",");`,
        Object.create(null),
        { timeout: 1000 },
      );
      expect(result).toBe(api.take(16).join(","));
    });

    it(`${id}: matches every public Number operation`, () => {
      const methods = Object.keys(api).filter((key) => typeof Reflect.get(api, key) === "function");
      expect(Object.keys(standalone).sort()).toEqual(methods.sort());
      expect(standalone.take(32)).toEqual(api.take(32));
      expect(standalone.take(0)).toEqual([]);
      for (const index of [0, 1, 2, 10, 31]) {
        expect(standalone.term(index)).toBe(api.term(index));
      }
      const iterator = standalone.iterate();
      const expectedIterator = api.iterate();
      for (let i = 0; i < 32; i += 1) {
        expect(iterator.next()).toEqual(expectedIterator.next());
      }
      for (const value of [-5, 0, 1, 2, 4, 55, 100]) {
        expect(standalone.has(value)).toBe(api.has(value));
        expect(standalone.next(value)).toBe(api.next(value));
        expect(standalone.upTo(value)).toEqual(api.upTo(value));
      }
    });

    it(`${id}: rejects invalid inputs instead of rounding or coercing`, () => {
      for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        expect(() => standalone.term(value)).toThrow(RangeError);
        expect(() => standalone.take(value)).toThrow(RangeError);
      }
      for (const method of [standalone.has, standalone.next, standalone.upTo]) {
        expect(() => method(0.5)).toThrow(RangeError);
        expect(() => Reflect.apply(method, undefined, [1n])).toThrow(TypeError);
        expect(() => Reflect.apply(method, undefined, ["1"])).toThrow(TypeError);
      }
    });
  }

  it("supports repeated pastes and all objects in the same console", async () => {
    const context = createContext(Object.create(null));
    for (let round = 0; round < 2; round += 1) {
      for (const id of ["fibonacci", "prime", "square"]) {
        const source = await readFile(
          new URL(`../../objects/${id}/functions.js`, import.meta.url),
          "utf8",
        );
        runInContext(source, context, { timeout: 1000 });
      }
    }
    expect(runInContext("libra.number.fibonacci.term(10)", context)).toBe(55);
    expect(runInContext("libra.number.prime.has(97)", context)).toBe(true);
    expect(runInContext("libra.bigint.square.term(10)", context)).toBe(100n);
    expect(runInContext("typeof validateIndex", context)).toBe("undefined");
  });

  for (const [id, standalone, api] of [
    ["fibonacci", fibonacciModule.bigint.fibonacci, bigintApi.fibonacci],
    ["square", squareModule.bigint.square, bigintApi.square],
  ] as const) {
    it(`${id}: matches every public BigInt operation`, () => {
      expect(standalone.take(256)).toEqual(api.take(256));
      expect(standalone.take(0)).toEqual([]);
      for (const index of [0, 10, 255]) {
        expect(standalone.term(index)).toBe(api.term(index));
      }
      const iterator = standalone.iterate();
      const expectedIterator = api.iterate();
      for (let i = 0; i < 32; i += 1) {
        expect(iterator.next()).toEqual(expectedIterator.next());
      }
      for (const value of [-5n, 0n, 1n, 4n, 55n, 100n]) {
        expect(standalone.has(value)).toBe(api.has(value));
        expect(standalone.next(value)).toBe(api.next(value));
        expect(standalone.upTo(value)).toEqual(api.upTo(value));
      }
      const largeTerm = api.term(255);
      expect(standalone.has(largeTerm)).toBe(true);
      expect(standalone.next(largeTerm)).toBe(api.next(largeTerm));
      for (const method of [standalone.has, standalone.next, standalone.upTo]) {
        expect(() => Reflect.apply(method, undefined, [1])).toThrow(TypeError);
      }
    });
  }

  it("prime: preserves the supported BigInt operations", () => {
    expect(Object.keys(primeModule.bigint.prime).sort()).toEqual(["has", "next"]);
    for (const value of [-1n, 0n, 2n, 97n, 100n, 104729n]) {
      expect(primeModule.bigint.prime.has(value)).toBe(bigintApi.prime.has(value));
      expect(primeModule.bigint.prime.next(value)).toBe(bigintApi.prime.next(value));
    }
    expect(() => Reflect.apply(primeModule.bigint.prime.has, undefined, [97])).toThrow(TypeError);
    expect(() => Reflect.apply(primeModule.bigint.prime.next, undefined, [97])).toThrow(TypeError);
  });

  it("never returns unsafe Number results", () => {
    expect(fibonacciModule.number.fibonacci.term(78)).toBe(numberApi.fibonacci.term(78));
    expect(() => fibonacciModule.number.fibonacci.term(79)).toThrow(RangeError);
    expect(() => fibonacciModule.number.fibonacci.take(80)).toThrow(RangeError);
    expect(() => fibonacciModule.number.fibonacci.next(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(fibonacciModule.number.fibonacci.upTo(Number.MAX_SAFE_INTEGER)).toEqual(
      numberApi.fibonacci.upTo(Number.MAX_SAFE_INTEGER),
    );
    expect(squareModule.number.square.term(94906265)).toBe(numberApi.square.term(94906265));
    expect(() => squareModule.number.square.term(94906266)).toThrow(RangeError);
    expect(() => squareModule.number.square.next(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() => primeModule.number.prime.next(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
  });
});
