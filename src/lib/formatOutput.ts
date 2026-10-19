import { text, type Locale } from "./i18n";

export type IntegerResultValue = number | bigint;
export type RawOperationResult =
  IntegerResultValue | boolean | IntegerResultValue[];

export type FormattedOutput = {
  display: string;
  javascript: string;
  json: string;
  csv: string;
  jsonNote?: string;
  displayWasTruncated: boolean;
};

export const bigintJsonNote =
  "BigIntはJSONで直接表現できないため、10進文字列として出力しています。";

function literal(
  value: IntegerResultValue | boolean,
  bigintSuffix: boolean,
): string {
  if (typeof value === "bigint") {
    return `${value}${bigintSuffix ? "n" : ""}`;
  }

  return String(value);
}

function formatLiteralResult(
  result: RawOperationResult,
  bigintSuffix: boolean,
): string {
  if (Array.isArray(result)) {
    return `[${result.map((value) => literal(value, bigintSuffix)).join(", ")}]`;
  }

  return literal(result, bigintSuffix);
}

export function containsBigInt(result: RawOperationResult): boolean {
  return Array.isArray(result)
    ? result.some((value) => typeof value === "bigint")
    : typeof result === "bigint";
}

export function maxDecimalDigits(result: RawOperationResult): number {
  const digitCount = (value: IntegerResultValue | boolean): number => {
    if (typeof value === "boolean") {
      return 0;
    }

    const text = String(value);
    return text.startsWith("-") ? text.length - 1 : text.length;
  };

  if (!Array.isArray(result)) {
    return digitCount(result);
  }

  return result.reduce<number>(
    (largest, value) => Math.max(largest, digitCount(value)),
    0,
  );
}

export function serializeJson(result: RawOperationResult): string {
  return JSON.stringify(
    result,
    (_key, value: unknown) =>
      typeof value === "bigint" ? value.toString(10) : value,
    2,
  );
}

export function serializeCsv(result: RawOperationResult): string {
  if (Array.isArray(result)) {
    return result.map((value) => literal(value, false)).join(",");
  }

  return literal(result, false);
}

export function formatDisplay(
  result: RawOperationResult,
  maxItems?: number,
  locale: Locale = "en",
): { value: string; truncated: boolean } {
  if (
    !Array.isArray(result) ||
    maxItems === undefined ||
    result.length <= maxItems
  ) {
    return { value: formatLiteralResult(result, true), truncated: false };
  }

  const visible = result.slice(0, maxItems);
  const omitted = result.length - visible.length;
  const values = visible.map((value) => literal(value, true)).join(", ");

  return {
    value: `[${values}, …]${text(locale, ` (${omitted.toLocaleString("en-US")} more)`, `（残り${omitted.toLocaleString("ja-JP")}件）`)}`,
    truncated: true,
  };
}

export function formatOutput(
  result: RawOperationResult,
  options: { maxDisplayedItems?: number; locale?: Locale } = {},
): FormattedOutput {
  const locale = options.locale ?? "en";
  const display = formatDisplay(result, options.maxDisplayedItems, locale);
  const hasBigInt = containsBigInt(result);

  return {
    display: display.value,
    javascript: formatLiteralResult(result, true),
    json: serializeJson(result),
    csv: serializeCsv(result),
    jsonNote: hasBigInt ? text(locale, "BigInt values are exported as decimal strings because JSON cannot represent BigInt directly.", bigintJsonNote) : undefined,
    displayWasTruncated: display.truncated,
  };
}

export type OperationCodeInput = {
  conceptId: string;
  numericType: "number" | "bigint";
  operation: string;
  input: number | bigint;
};

export function formatOperationCode(input: OperationCodeInput): string {
  const argument = literal(input.input, true);
  return `${input.numericType}.${input.conceptId}.${input.operation}(${argument});`;
}
