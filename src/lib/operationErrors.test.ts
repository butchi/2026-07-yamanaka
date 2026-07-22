import {
  IntegerOverflowError,
  InvalidIndexError,
  OperationUnavailableError,
} from "@butchi/integer-sequences";
import { describe, expect, it } from "vitest";

import {
  OperationUiError,
  operationErrorMessages,
  toOperationUiError,
} from "./operationErrors";

describe("toOperationUiError", () => {
  it("maps an invalid library index to a user-facing message", () => {
    const mapped = toOperationUiError(new InvalidIndexError(-1));
    expect(mapped).toBeInstanceOf(OperationUiError);
    expect(mapped.code).toBe("invalid-index");
    expect(mapped.message).toBe(operationErrorMessages.invalidIndex);
  });

  it("maps Number result overflow without silently switching types", () => {
    const mapped = toOperationUiError(new IntegerOverflowError("test"));
    expect(mapped.code).toBe("number-overflow");
    expect(mapped.message).toBe(operationErrorMessages.numberOverflow);
  });

  it("maps unavailable operations", () => {
    const mapped = toOperationUiError(
      new OperationUnavailableError("term", "prime"),
    );
    expect(mapped.code).toBe("operation-unavailable");
    expect(mapped.message).toBe(operationErrorMessages.operationUnavailable);
  });

  it("does not leak unexpected technical errors", () => {
    const original = new Error("secret stack detail");
    const mapped = toOperationUiError(original);

    expect(mapped.code).toBe("unexpected");
    expect(mapped.message).toBe(operationErrorMessages.unexpected);
    expect(mapped.cause).toBe(original);
  });
});
