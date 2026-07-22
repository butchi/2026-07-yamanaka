/**
 * Browser-facing limits. These are product safeguards, not mathematical limits
 * of @butchi/integer-sequences.
 */
export const uiLimits = Object.freeze({
  maxDisplayedItems: 1_000,
  maxExportedItems: 10_000,
  maxDisplayedDigits: 100_000,
  maxPrimeUpTo: 100_000,
  maxPrimeBigIntDigits: 12,
  largeItemWarningThreshold: 500,
  largeDigitWarningThreshold: 10_000,
});

export type UiLimits = typeof uiLimits;
