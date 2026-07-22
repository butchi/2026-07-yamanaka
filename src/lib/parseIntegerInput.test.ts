import { describe, expect, it } from "vitest";

import {
  IntegerInputError,
  parseBigIntInteger,
  parseIntegerInput,
  parseNonNegativeSafeInteger,
  parseNumberInteger,
} from "./parseIntegerInput";

describe("parseIntegerInput", () => {
  it("parses plain safe Number integers", () => {
    expect(parseIntegerInput(" 42 ", "number")).toBe(42);
    expect(parseNumberInteger(String(Number.MAX_SAFE_INTEGER))).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });

  it.each(["", "1.5", "1e3", "+1", "--1", "Infinity", "1_000"])(
    "rejects non-plain integer input %j",
    (input) => {
      expect(() => parseNumberInteger(input)).toThrow(IntegerInputError);
    },
  );

  it("rejects unsafe Number values instead of rounding", () => {
    expect(() => parseNumberInteger("9007199254740992")).toThrow(
      expect.objectContaining({ reason: "unsafe-number" }),
    );
  });

  it("parses arbitrarily large decimal BigInt strings exactly", () => {
    expect(parseIntegerInput("12345678901234567890", "bigint")).toBe(
      12345678901234567890n,
    );
    expect(parseBigIntInteger(-20n)).toBe(-20n);
  });

  it("does not convert an already-unsafe Number to BigInt", () => {
    expect(() => parseBigIntInteger(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      expect.objectContaining({ reason: "unsafe-number" }),
    );
  });

  it("enforces non-negative safe Number indices and counts", () => {
    expect(parseNonNegativeSafeInteger("100", "index")).toBe(100);
    expect(() => parseNonNegativeSafeInteger("-1", "index")).toThrow(
      expect.objectContaining({ reason: "negative", field: "index" }),
    );
  });

  it("can reject an input before constructing a BigInt past the digit limit", () => {
    expect(() =>
      parseBigIntInteger("1234", { field: "value", maxDigits: 3 }),
    ).toThrow(expect.objectContaining({ reason: "too-many-digits" }));
  });
});
