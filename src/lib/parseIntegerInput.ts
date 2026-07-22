export type NumericType = "number" | "bigint";
export type IntegerInputField = "index" | "count" | "value" | "limit";

export type IntegerInputErrorReason =
  "invalid-integer" | "unsafe-number" | "negative" | "too-many-digits";

export class IntegerInputError extends RangeError {
  override readonly name = "IntegerInputError";

  constructor(
    readonly reason: IntegerInputErrorReason,
    readonly field: IntegerInputField,
    message: string,
  ) {
    super(message);
  }
}

export type ParseIntegerOptions = {
  field?: IntegerInputField;
  nonNegative?: boolean;
  maxDigits?: number;
};

const INTEGER_PATTERN = /^-?\d+$/;

function normalizedIntegerText(
  input: unknown,
  field: IntegerInputField,
  maxDigits?: number,
): string {
  let text: string;

  if (typeof input === "string") {
    text = input.trim();
  } else if (typeof input === "number" || typeof input === "bigint") {
    text = String(input);
  } else {
    throw new IntegerInputError(
      "invalid-integer",
      field,
      "The input must be an integer.",
    );
  }

  if (!INTEGER_PATTERN.test(text)) {
    throw new IntegerInputError(
      "invalid-integer",
      field,
      "The input must use plain integer notation.",
    );
  }

  const digits = text.startsWith("-") ? text.length - 1 : text.length;
  if (maxDigits !== undefined && digits > maxDigits) {
    throw new IntegerInputError(
      "too-many-digits",
      field,
      `The input exceeds the ${maxDigits}-digit UI limit.`,
    );
  }

  return text;
}

export function parseNumberInteger(
  input: unknown,
  options: ParseIntegerOptions = {},
): number {
  const field = options.field ?? "value";
  const text = normalizedIntegerText(input, field, options.maxDigits);
  const value = Number(text);

  if (!Number.isSafeInteger(value)) {
    throw new IntegerInputError(
      "unsafe-number",
      field,
      "The Number input must be a safe integer.",
    );
  }

  if (options.nonNegative && value < 0) {
    throw new IntegerInputError(
      "negative",
      field,
      "The input must be non-negative.",
    );
  }

  return value;
}

export function parseBigIntInteger(
  input: unknown,
  options: ParseIntegerOptions = {},
): bigint {
  const field = options.field ?? "value";

  if (typeof input === "number" && !Number.isSafeInteger(input)) {
    throw new IntegerInputError(
      "unsafe-number",
      field,
      "A Number converted to BigInt must first be a safe integer.",
    );
  }

  const text = normalizedIntegerText(input, field, options.maxDigits);
  const value = BigInt(text);

  if (options.nonNegative && value < 0n) {
    throw new IntegerInputError(
      "negative",
      field,
      "The input must be non-negative.",
    );
  }

  return value;
}

export function parseIntegerInput(
  input: unknown,
  numericType: "number",
  options?: ParseIntegerOptions,
): number;
export function parseIntegerInput(
  input: unknown,
  numericType: "bigint",
  options?: ParseIntegerOptions,
): bigint;
export function parseIntegerInput(
  input: unknown,
  numericType: NumericType,
  options?: ParseIntegerOptions,
): number | bigint;
export function parseIntegerInput(
  input: unknown,
  numericType: NumericType,
  options: ParseIntegerOptions = {},
): number | bigint {
  return numericType === "number"
    ? parseNumberInteger(input, options)
    : parseBigIntInteger(input, options);
}

/** Indices and item counts remain safe Numbers for both numeric namespaces. */
export function parseNonNegativeSafeInteger(
  input: unknown,
  field: "index" | "count",
): number {
  return parseNumberInteger(input, { field, nonNegative: true });
}
