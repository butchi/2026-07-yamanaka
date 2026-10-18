import { describe, expect, it } from "vitest";
import {
  bigint as bigintApi,
  number as numberApi,
} from "@butchi/integer-sequences";
import * as fibonacciModule from "../../objects/fibonacci/functions.mjs";
import * as primeModule from "../../objects/prime/functions.mjs";
import * as squareModule from "../../objects/square/functions.mjs";

describe("object function modules", () => {
  it("exposes the same Number and BigInt APIs as the package", () => {
    expect(fibonacciModule.number.fibonacci).toBe(numberApi.fibonacci);
    expect(fibonacciModule.bigint.fibonacci).toBe(bigintApi.fibonacci);
    expect(primeModule.number.prime).toBe(numberApi.prime);
    expect(primeModule.bigint.prime).toBe(bigintApi.prime);
    expect(squareModule.number.square).toBe(numberApi.square);
    expect(squareModule.bigint.square).toBe(bigintApi.square);
  });
});
