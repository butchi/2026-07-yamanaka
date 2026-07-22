import { describe, expect, it } from "vitest";

import {
  bigintJsonNote,
  formatOperationCode,
  formatOutput,
  maxDecimalDigits,
  serializeCsv,
  serializeJson,
} from "./formatOutput";

describe("formatOutput", () => {
  it("keeps the BigInt suffix in display and JavaScript output", () => {
    const output = formatOutput([0n, 1n, 1n, 2n, 3n]);

    expect(output.display).toBe("[0n, 1n, 1n, 2n, 3n]");
    expect(output.javascript).toBe("[0n, 1n, 1n, 2n, 3n]");
  });

  it("serializes BigInt as JSON decimal strings with an explanation", () => {
    const output = formatOutput([0n, 1n, 2n]);

    expect(output.json).toBe('[\n  "0",\n  "1",\n  "2"\n]');
    expect(output.jsonNote).toBe(bigintJsonNote);
    expect(serializeJson(55n)).toBe('"55"');
  });

  it("writes CSV BigInts as plain decimal values", () => {
    expect(serializeCsv([0n, 1n, 2n])).toBe("0,1,2");
    expect(serializeCsv(354224848179261915075n)).toBe("354224848179261915075");
  });

  it("leaves Number JSON values numeric", () => {
    const output = formatOutput([0, 1, 2]);
    expect(output.json).toBe("[\n  0,\n  1,\n  2\n]");
    expect(output.jsonNote).toBeUndefined();
  });

  it("truncates only the human-facing display", () => {
    const output = formatOutput([0, 1, 2, 3], { maxDisplayedItems: 2 });

    expect(output.display).toBe("[0, 1, …]（残り2件）");
    expect(output.javascript).toBe("[0, 1, 2, 3]");
    expect(output.displayWasTruncated).toBe(true);
  });

  it("separates invocation code from result literals", () => {
    expect(
      formatOperationCode({
        conceptId: "fibonacci",
        numericType: "bigint",
        operation: "term",
        input: 100,
      }),
    ).toBe("bigint.fibonacci.term(100);");

    expect(
      formatOperationCode({
        conceptId: "prime",
        numericType: "bigint",
        operation: "has",
        input: 97n,
      }),
    ).toBe("bigint.prime.has(97n);");
  });

  it("counts decimal digits without sign or BigInt suffix", () => {
    expect(maxDecimalDigits([-123n, 45n])).toBe(3);
  });
});
