import { describe, expect, it } from "vitest";

import {
  executeOperation,
  getAvailableOperations,
  isOperationAvailable,
} from "./executeOperation";
import { OperationUiError } from "./operationErrors";
import { uiLimits } from "./uiLimits";

describe("operation availability", () => {
  it("is discovered from the actual library namespace", () => {
    expect(getAvailableOperations("prime", "bigint")).toEqual(["has", "next"]);
    expect(isOperationAvailable("prime", "bigint", "term")).toBe(false);
    expect(getAvailableOperations("fibonacci", "number")).toEqual([
      "term",
      "take",
      "upTo",
      "has",
      "next",
    ]);
  });
});

describe("executeOperation", () => {
  it("calculates a Number term and returns invocation and metadata", () => {
    const result = executeOperation({
      conceptId: "fibonacci",
      numericType: "number",
      operation: "term",
      input: "10",
    });

    expect(result.raw).toBe(55);
    expect(result.display).toBe("55");
    expect(result.javascript).toBe("55");
    expect(result.code).toBe("number.fibonacci.term(10);");
    expect(result.metadata).toMatchObject({
      implementationId: "fibonacci-number-term-fast-doubling-v1",
      algorithmId: "fibonacci-fast-doubling",
      algorithmName: "高速倍加法",
    });
  });

  it("calculates a BigInt term while keeping its index a Number", () => {
    const result = executeOperation({
      conceptId: "fibonacci",
      numericType: "bigint",
      operation: "term",
      input: "100",
      outputFormat: "json",
    });

    expect(result.raw).toBe(354224848179261915075n);
    expect(result.display).toBe("354224848179261915075n");
    expect(result.javascript).toBe("354224848179261915075n");
    expect(result.code).toBe("bigint.fibonacci.term(100);");
    expect(result.json).toBe('"354224848179261915075"');
    expect(result.csv).toBe("354224848179261915075");
    expect(result.jsonNote).toContain("10進文字列");
  });

  it("returns a human sentence for membership", () => {
    const result = executeOperation({
      conceptId: "prime",
      numericType: "number",
      operation: "has",
      input: "97",
    });

    expect(result.raw).toBe(true);
    expect(result.humanMessage).toBe("97は素数です。");
  });

  it("uses strict greater-than semantics for next", () => {
    expect(
      executeOperation({
        conceptId: "prime",
        numericType: "number",
        operation: "next",
        input: "7",
      }).raw,
    ).toBe(11);
    expect(
      executeOperation({
        conceptId: "square",
        numericType: "bigint",
        operation: "next",
        input: "9",
      }).raw,
    ).toBe(16n);
  });

  it("enumerates values up to an inclusive limit", () => {
    const result = executeOperation({
      conceptId: "square",
      numericType: "number",
      operation: "upTo",
      input: "100",
    });

    expect(result.raw).toEqual([0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100]);
    expect(result.humanMessage).toContain("100以下");
  });

  it("never auto-switches when a Number result would be unsafe", () => {
    expect(() =>
      executeOperation({
        conceptId: "fibonacci",
        numericType: "number",
        operation: "term",
        input: "79",
      }),
    ).toThrow(
      expect.objectContaining<Partial<OperationUiError>>({
        code: "number-overflow",
      }),
    );
  });

  it("rejects a BigInt term index outside the safe Number range", () => {
    expect(() =>
      executeOperation({
        conceptId: "fibonacci",
        numericType: "bigint",
        operation: "term",
        input: "9007199254740992",
      }),
    ).toThrow(
      expect.objectContaining<Partial<OperationUiError>>({
        code: "invalid-index",
      }),
    );
  });

  it("rejects notation that is not a plain integer", () => {
    expect(() =>
      executeOperation({
        conceptId: "prime",
        numericType: "bigint",
        operation: "has",
        input: "1e3",
      }),
    ).toThrow(
      expect.objectContaining<Partial<OperationUiError>>({
        code: "invalid-value",
      }),
    );
  });

  it("maps unavailable BigInt prime operations", () => {
    expect(() =>
      executeOperation({
        conceptId: "prime",
        numericType: "bigint",
        operation: "term",
        input: "0",
      }),
    ).toThrow(
      expect.objectContaining<Partial<OperationUiError>>({
        code: "operation-unavailable",
      }),
    );
  });

  it("enforces the display and export item limits", () => {
    expect(() =>
      executeOperation({
        conceptId: "square",
        numericType: "bigint",
        operation: "take",
        input: String(uiLimits.maxDisplayedItems + 1),
      }),
    ).toThrow(
      expect.objectContaining<Partial<OperationUiError>>({ code: "ui-limit" }),
    );

    const exportResult = executeOperation({
      conceptId: "square",
      numericType: "bigint",
      operation: "take",
      input: String(uiLimits.maxDisplayedItems + 1),
      outputFormat: "json",
    });
    expect(exportResult.raw).toHaveLength(uiLimits.maxDisplayedItems + 1);
    expect(exportResult.warning).toContain("最初の1,000件");

    expect(() =>
      executeOperation({
        conceptId: "square",
        numericType: "number",
        operation: "take",
        input: String(uiLimits.maxExportedItems + 1),
        outputFormat: "csv",
      }),
    ).toThrow(
      expect.objectContaining<Partial<OperationUiError>>({ code: "ui-limit" }),
    );
  });

  it("enforces the Number prime upTo limit before calculation", () => {
    expect(() =>
      executeOperation({
        conceptId: "prime",
        numericType: "number",
        operation: "upTo",
        input: String(uiLimits.maxPrimeUpTo + 1),
        outputFormat: "csv",
      }),
    ).toThrow(
      expect.objectContaining<Partial<OperationUiError>>({ code: "ui-limit" }),
    );
  });

  it("limits exact BigInt prime trial division to a practical input size", () => {
    expect(() =>
      executeOperation({
        conceptId: "prime",
        numericType: "bigint",
        operation: "has",
        input: "1".repeat(uiLimits.maxPrimeBigIntDigits + 1),
      }),
    ).toThrow(
      expect.objectContaining<Partial<OperationUiError>>({ code: "ui-limit" }),
    );
  });
});
