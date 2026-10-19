import {
  IntegerOverflowError,
  InvalidCountError,
  InvalidIndexError,
  InvalidLimitError,
  OperationUnavailableError,
  UnsafeIntegerError,
} from "@butchi/integer-sequences";

import { IntegerInputError } from "./parseIntegerInput";
import type { Locale } from "./i18n";

export type OperationUiErrorCode =
  | "invalid-index"
  | "invalid-count"
  | "invalid-limit"
  | "invalid-value"
  | "unsafe-number"
  | "number-overflow"
  | "operation-unavailable"
  | "ui-limit"
  | "unexpected";

export const operationErrorMessages = Object.freeze({
  invalidIndex: "添字には0以上の安全整数を入力してください。",
  invalidCount: "項数には0以上の安全整数を入力してください。",
  invalidLimit: "上限には整数を入力してください。",
  invalidValue: "整数を入力してください。",
  unsafeNumber:
    "この値はNumberでは正確に表現できません。\nBigInt版を選択してください。",
  numberOverflow:
    "この結果はNumberでは正確に表現できません。\nBigInt版で再実行してください。",
  operationUnavailable:
    "この数と数値型の組み合わせでは、この操作を提供していません。",
  uiLimit:
    "一度に表示できる件数を超えています。\n件数を減らすか、ファイル出力を利用してください。",
  digitLimit:
    "この結果は画面に表示できる桁数を超えています。\n入力値を小さくしてください。",
  unexpected: "計算中にエラーが発生しました。入力値を確認してください。",
});

export class OperationUiError extends Error {
  override readonly name = "OperationUiError";

  constructor(
    readonly code: OperationUiErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

export function createUiLimitError(cause?: unknown, locale: Locale = "en"): OperationUiError {
  return new OperationUiError("ui-limit", messagesFor(locale).uiLimit, {
    cause,
  });
}

export function createDigitLimitError(cause?: unknown, locale: Locale = "en"): OperationUiError {
  return new OperationUiError("ui-limit", messagesFor(locale).digitLimit, {
    cause,
  });
}

function mapInputError(error: IntegerInputError, locale: Locale): OperationUiError {
  const messages = messagesFor(locale);
  if (error.reason === "too-many-digits") {
    return createUiLimitError(error, locale);
  }

  if (error.field === "index") {
    return new OperationUiError(
      "invalid-index",
      messages.invalidIndex,
      { cause: error },
    );
  }

  if (error.field === "count") {
    return new OperationUiError(
      "invalid-count",
      messages.invalidCount,
      { cause: error },
    );
  }

  if (error.reason === "unsafe-number") {
    return new OperationUiError(
      "unsafe-number",
      messages.unsafeNumber,
      { cause: error },
    );
  }

  if (error.field === "limit") {
    return new OperationUiError(
      "invalid-limit",
      messages.invalidLimit,
      { cause: error },
    );
  }

  return new OperationUiError(
    "invalid-value",
    messages.invalidValue,
    { cause: error },
  );
}

/** Convert internal/library failures to messages safe to render in the UI. */
export function toOperationUiError(error: unknown, locale: Locale = "en"): OperationUiError {
  const messages = messagesFor(locale);
  if (error instanceof OperationUiError) {
    return error;
  }

  if (error instanceof IntegerInputError) {
    return mapInputError(error, locale);
  }

  if (error instanceof InvalidIndexError) {
    return new OperationUiError(
      "invalid-index",
      messages.invalidIndex,
      { cause: error },
    );
  }

  if (error instanceof InvalidCountError) {
    return new OperationUiError(
      "invalid-count",
      messages.invalidCount,
      { cause: error },
    );
  }

  if (error instanceof InvalidLimitError) {
    return new OperationUiError(
      "invalid-limit",
      messages.invalidLimit,
      { cause: error },
    );
  }

  if (error instanceof UnsafeIntegerError) {
    return new OperationUiError(
      "unsafe-number",
      messages.unsafeNumber,
      { cause: error },
    );
  }

  if (error instanceof IntegerOverflowError) {
    return new OperationUiError(
      "number-overflow",
      messages.numberOverflow,
      { cause: error },
    );
  }

  if (error instanceof OperationUnavailableError) {
    return new OperationUiError(
      "operation-unavailable",
      messages.operationUnavailable,
      { cause: error },
    );
  }

  return new OperationUiError("unexpected", messages.unexpected, {
    cause: error,
  });
}

const englishErrorMessages: Record<keyof typeof operationErrorMessages, string> = {
  invalidIndex: "Enter a nonnegative safe integer for the index.",
  invalidCount: "Enter a nonnegative safe integer for the count.",
  invalidLimit: "Enter an integer for the limit.",
  invalidValue: "Enter an integer.",
  unsafeNumber: "This value cannot be represented exactly as Number.\nSelect BigInt.",
  numberOverflow: "This result cannot be represented exactly as Number.\nRun again with BigInt.",
  operationUnavailable: "This operation is unavailable for this object and numeric type.",
  uiLimit: "The result exceeds the item limit.\nReduce the count or use file output.",
  digitLimit: "The result exceeds the display digit limit.\nUse a smaller input.",
  unexpected: "An error occurred during calculation. Check the input.",
};

function messagesFor(locale: Locale) {
  return locale === "ja" ? operationErrorMessages : englishErrorMessages;
}
