import {
  OperationUnavailableError,
  algorithmRegistry,
  bigint as bigintSequences,
  number as numberSequences,
  type IntegerConceptMetadata,
  type OperationComplexity,
  type OperationVerification,
} from "@butchi/integer-sequences";

import {
  formatDisplay,
  formatOperationCode,
  formatOutput,
  maxDecimalDigits,
  type RawOperationResult,
} from "./formatOutput";
import {
  createDigitLimitError,
  createUiLimitError,
  OperationUiError,
  toOperationUiError,
} from "./operationErrors";
import {
  parseIntegerInput,
  parseNonNegativeSafeInteger,
  type NumericType,
} from "./parseIntegerInput";
import { uiLimits } from "./uiLimits";

export const conceptIds = ["fibonacci", "prime", "square"] as const;
export type ConceptId = (typeof conceptIds)[number];

export const executableOperations = [
  "term",
  "take",
  "upTo",
  "has",
  "next",
] as const;
export type ExecutableOperation = (typeof executableOperations)[number];

export const outputFormats = ["display", "javascript", "json", "csv"] as const;
export type OutputFormat = (typeof outputFormats)[number];

export type ExecuteOperationRequest = {
  conceptId: ConceptId;
  numericType: NumericType;
  operation: ExecutableOperation;
  input: string | number | bigint;
  outputFormat?: OutputFormat;
};

type RuntimeOperationMetadata = {
  source: "native" | "derived";
  derivedFrom?: string;
  implementationId?: string;
  algorithmId?: string;
  complexity?: OperationComplexity;
  verification?: OperationVerification;
  benchmarkId?: string;
};

type RuntimeConcept = {
  meta: IntegerConceptMetadata;
  operations: Record<string, RuntimeOperationMetadata | undefined>;
  [operation: string]: unknown;
};

export type ExecutedOperationMetadata = {
  conceptId: ConceptId;
  conceptName: string;
  numericType: NumericType;
  operation: ExecutableOperation;
  source: "native" | "derived";
  derivedFrom?: string;
  implementationId?: string;
  algorithmId?: string;
  algorithmName?: string;
  algorithmDescription?: string;
  complexity?: OperationComplexity;
  verification?: OperationVerification;
  benchmarkId?: string;
};

export type ExecuteOperationResult = {
  raw: RawOperationResult;
  display: string;
  javascript: string;
  code: string;
  json: string;
  csv: string;
  humanMessage?: string;
  metadata?: ExecutedOperationMetadata;
  warning?: string;
  jsonNote?: string;
};

const namespaceRegistry = {
  number: numberSequences,
  bigint: bigintSequences,
} as const;

function isConceptId(value: unknown): value is ConceptId {
  return conceptIds.includes(value as ConceptId);
}

function isNumericType(value: unknown): value is NumericType {
  return value === "number" || value === "bigint";
}

function isExecutableOperation(value: unknown): value is ExecutableOperation {
  return executableOperations.includes(value as ExecutableOperation);
}

function isOutputFormat(value: unknown): value is OutputFormat {
  return outputFormats.includes(value as OutputFormat);
}

function getRuntimeConcept(
  conceptId: ConceptId,
  numericType: NumericType,
): RuntimeConcept | undefined {
  const namespace = namespaceRegistry[numericType] as unknown as Record<
    string,
    RuntimeConcept | undefined
  >;
  return namespace[conceptId];
}

function getRunnableOperation(
  conceptId: ConceptId,
  numericType: NumericType,
  operation: ExecutableOperation,
): {
  concept: RuntimeConcept;
  run: (input: number | bigint) => unknown;
  operationMetadata: RuntimeOperationMetadata;
} {
  const concept = getRuntimeConcept(conceptId, numericType);
  const candidate = concept?.[operation];
  const operationMetadata = concept?.operations[operation];

  if (
    concept === undefined ||
    typeof candidate !== "function" ||
    operationMetadata === undefined
  ) {
    throw new OperationUnavailableError(operation, conceptId);
  }

  return {
    concept,
    run: candidate as (input: number | bigint) => unknown,
    operationMetadata,
  };
}

export function isOperationAvailable(
  conceptId: ConceptId,
  numericType: NumericType,
  operation: ExecutableOperation,
): boolean {
  const concept = getRuntimeConcept(conceptId, numericType);
  return (
    typeof concept?.[operation] === "function" &&
    concept.operations[operation] !== undefined
  );
}

export function getAvailableOperations(
  conceptId: ConceptId,
  numericType: NumericType,
): ExecutableOperation[] {
  return executableOperations.filter((operation) =>
    isOperationAvailable(conceptId, numericType, operation),
  );
}

function parseRequestInput(request: ExecuteOperationRequest): number | bigint {
  if (request.operation === "term") {
    return parseNonNegativeSafeInteger(request.input, "index");
  }

  if (request.operation === "take") {
    return parseNonNegativeSafeInteger(request.input, "count");
  }

  return parseIntegerInput(request.input, request.numericType, {
    field: request.operation === "upTo" ? "limit" : "value",
    maxDigits:
      request.numericType === "bigint"
        ? request.conceptId === "prime"
          ? uiLimits.maxPrimeBigIntDigits
          : uiLimits.maxDisplayedDigits
        : undefined,
  });
}

function maxItemsFor(format: OutputFormat): number {
  return format === "display"
    ? uiLimits.maxDisplayedItems
    : uiLimits.maxExportedItems;
}

function isAtLeast(value: number | bigint, threshold: unknown): boolean {
  if (typeof value === "number" && typeof threshold === "number") {
    return value >= threshold;
  }
  if (typeof value === "bigint" && typeof threshold === "bigint") {
    return value >= threshold;
  }
  return false;
}

function enforcePrecalculationLimits(
  request: ExecuteOperationRequest,
  parsedInput: number | bigint,
  concept: RuntimeConcept,
  outputFormat: OutputFormat,
): void {
  const maxItems = maxItemsFor(outputFormat);

  if (request.operation === "take" && parsedInput > maxItems) {
    throw createUiLimitError();
  }

  if (
    request.operation === "upTo" &&
    request.conceptId === "prime" &&
    request.numericType === "number" &&
    parsedInput > uiLimits.maxPrimeUpTo
  ) {
    throw createUiLimitError();
  }

  if (request.operation !== "upTo" || parsedInput < 0) {
    return;
  }

  // If term(maxItems) is within the namespace's exact range, a limit at or
  // above it necessarily produces more than maxItems results. This prevents
  // allocating an oversized result before checking its length.
  const term = concept.term;
  const canPreflightWithTerm =
    typeof term === "function" &&
    !(request.conceptId === "fibonacci" && request.numericType === "number");

  if (canPreflightWithTerm) {
    const firstDisallowedValue = (term as (index: number) => number | bigint)(
      maxItems,
    );
    if (isAtLeast(parsedInput, firstDisallowedValue)) {
      throw createUiLimitError();
    }
  }
}

function resolveMetadata(
  request: ExecuteOperationRequest,
  concept: RuntimeConcept,
  direct: RuntimeOperationMetadata,
): ExecutedOperationMetadata {
  let resolved = direct;
  const visited = new Set<string>();

  while (
    resolved.source === "derived" &&
    resolved.derivedFrom !== undefined &&
    !visited.has(resolved.derivedFrom)
  ) {
    visited.add(resolved.derivedFrom);
    const source = concept.operations[resolved.derivedFrom];
    if (source === undefined) {
      break;
    }
    resolved = source;
  }

  const algorithm =
    resolved.algorithmId === undefined
      ? undefined
      : (
          algorithmRegistry as Record<
            string,
            | {
                name: { ja: string; en: string };
                description?: { ja: string; en: string };
              }
            | undefined
          >
        )[resolved.algorithmId];

  return {
    conceptId: request.conceptId,
    conceptName: concept.meta.name.ja,
    numericType: request.numericType,
    operation: request.operation,
    source: direct.source,
    derivedFrom: direct.derivedFrom,
    implementationId: resolved.implementationId,
    algorithmId: resolved.algorithmId,
    algorithmName: algorithm?.name.ja,
    algorithmDescription: algorithm?.description?.ja,
    complexity: resolved.complexity,
    verification: resolved.verification,
    benchmarkId: resolved.benchmarkId,
  };
}

function buildHumanMessage(
  request: ExecuteOperationRequest,
  conceptName: string,
  parsedInput: number | bigint,
  raw: RawOperationResult,
): string {
  const input = formatDisplay(parsedInput).value;
  const result = formatDisplay(raw).value;

  switch (request.operation) {
    case "term":
      return `${conceptName}の添字${input}の値は${result}です。`;
    case "take":
      return `${conceptName}の最初の${input}項を生成しました。`;
    case "upTo": {
      const count = Array.isArray(raw) ? raw.length : 0;
      return `${input}以下の${conceptName}を${count.toLocaleString("ja-JP")}件生成しました。`;
    }
    case "has":
      return raw === true
        ? `${input}は${conceptName}です。`
        : `${input}は${conceptName}ではありません。`;
    case "next":
      return `${input}より大きい次の${conceptName}は${result}です。`;
  }
}

function buildWarning(
  raw: RawOperationResult,
  displayWasTruncated: boolean,
): string | undefined {
  const warnings: string[] = [];

  if (displayWasTruncated) {
    warnings.push(
      `表示量が多いため、画面上では最初の${uiLimits.maxDisplayedItems.toLocaleString("ja-JP")}件のみ表示しています。`,
    );
  } else if (
    Array.isArray(raw) &&
    raw.length >= uiLimits.largeItemWarningThreshold
  ) {
    warnings.push("表示量が多い結果です。");
  }

  if (maxDecimalDigits(raw) >= uiLimits.largeDigitWarningThreshold) {
    warnings.push("桁数が非常に多く、ブラウザでの直接表示は非推奨です。");
  }

  return warnings.length === 0 ? undefined : warnings.join("\n");
}

function assertRequest(request: ExecuteOperationRequest): void {
  if (
    !isConceptId(request.conceptId) ||
    !isNumericType(request.numericType) ||
    !isExecutableOperation(request.operation)
  ) {
    throw new OperationUnavailableError(
      String(request.operation),
      String(request.conceptId),
    );
  }

  if (
    request.outputFormat !== undefined &&
    !isOutputFormat(request.outputFormat)
  ) {
    throw new OperationUiError("invalid-value", "出力形式を選択してください。");
  }
}

export function executeOperation(
  request: ExecuteOperationRequest,
): ExecuteOperationResult {
  try {
    assertRequest(request);
    const outputFormat = request.outputFormat ?? "display";
    const { concept, run, operationMetadata } = getRunnableOperation(
      request.conceptId,
      request.numericType,
      request.operation,
    );
    const parsedInput = parseRequestInput(request);

    enforcePrecalculationLimits(request, parsedInput, concept, outputFormat);

    const raw = run(parsedInput) as RawOperationResult;
    const resultCount = Array.isArray(raw) ? raw.length : 1;
    if (resultCount > maxItemsFor(outputFormat)) {
      throw createUiLimitError();
    }

    if (maxDecimalDigits(raw) > uiLimits.maxDisplayedDigits) {
      throw createDigitLimitError();
    }

    const formatted = formatOutput(raw, {
      maxDisplayedItems: uiLimits.maxDisplayedItems,
    });

    return {
      raw,
      display: formatted.display,
      javascript: formatted.javascript,
      code: formatOperationCode({
        conceptId: request.conceptId,
        numericType: request.numericType,
        operation: request.operation,
        input: parsedInput,
      }),
      json: formatted.json,
      csv: formatted.csv,
      humanMessage: buildHumanMessage(
        request,
        concept.meta.name.ja,
        parsedInput,
        raw,
      ),
      metadata: resolveMetadata(request, concept, operationMetadata),
      warning: buildWarning(raw, formatted.displayWasTruncated),
      jsonNote: formatted.jsonNote,
    };
  } catch (error) {
    throw toOperationUiError(error);
  }
}
