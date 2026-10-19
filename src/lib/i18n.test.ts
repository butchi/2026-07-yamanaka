import { describe, expect, it } from "vitest";
import { localeFromPath, localizedPath, operationLabels } from "./i18n";
import { executeOperation } from "./executeOperation";
import { toOperationUiError } from "./operationErrors";
import { formatOutput } from "./formatOutput";
import { InvalidIndexError } from "@butchi/integer-sequences";

describe("English-default localization", () => {
  it("selects locales only by a full path segment and preserves paths and hashes", () => {
    expect(localeFromPath("/")).toBe("en");
    expect(localeFromPath("/january/")).toBe("en");
    expect(localeFromPath("/ja/numbers/prime/")).toBe("ja");
    expect(localizedPath("/", "ja")).toBe("/ja/");
    expect(localizedPath("/ja/", "en")).toBe("/");
    expect(localizedPath("/ja/numbers/prime/", "en")).toBe("/numbers/prime/");
    expect(localizedPath("/about/#contribution-heading", "ja")).toBe("/ja/about/#contribution-heading");
    expect(operationLabels("en").term).toBe("nth term");
    expect(operationLabels("ja").term).toBe("第n項");
  });

  it.each(["term", "take", "upTo", "has", "next"] as const)("localizes %s without changing calculations or exports", (operation) => {
    const request = { conceptId: "fibonacci", numericType: "bigint", operation, input: "10" } as const;
    const english = executeOperation(request);
    const japanese = executeOperation({ ...request, locale: "ja" });
    for (const key of ["raw", "json", "csv", "javascript", "code"] as const) {
      expect(japanese[key]).toEqual(english[key]);
    }
    expect(english.humanMessage).toContain("Fibonacci numbers");
    expect(japanese.humanMessage).toContain("フィボナッチ数");
    expect(english.metadata?.conceptName).toBe("Fibonacci numbers");
    expect(japanese.metadata?.conceptName).toBe("フィボナッチ数");
    if (english.jsonNote) {
      expect(english.jsonNote).toContain("decimal strings");
      expect(japanese.jsonNote).toContain("10進文字列");
    }
  });

  it("localizes errors and warnings in both languages", () => {
    expect(toOperationUiError(new InvalidIndexError(-1)).message).toBe("Enter a nonnegative safe integer for the index.");
    expect(toOperationUiError(new InvalidIndexError(-1), "ja").message).toContain("添字");
    const request = { conceptId: "fibonacci", numericType: "number", operation: "term", input: "79" } as const;
    expect(() => executeOperation(request)).toThrow("Run again with BigInt");
    expect(() => executeOperation({ ...request, locale: "ja" })).toThrow("BigInt版");
    const values = [0n, 1n, 2n];
    expect(formatOutput(values, { maxDisplayedItems: 1 }).display).toBe("[0n, …] (2 more)");
    expect(formatOutput(values, { maxDisplayedItems: 1, locale: "ja" }).display).toBe("[0n, …]（残り2件）");
  });
});
