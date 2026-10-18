(() => {
  function validateIndex(value) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError("Index and count must be non-negative safe integers.");
    }
  }

  function validateValue(value, numericType) {
    if (typeof value !== numericType) {
      throw new TypeError(`Expected a ${numericType} value.`);
    }
    if (numericType === "number" && !Number.isSafeInteger(value)) {
      throw new RangeError("Expected a safe integer. Use the BigInt API instead.");
    }
    return BigInt(value);
  }

  function toNumber(value) {
    const result = Number(value);
    if (!Number.isSafeInteger(result)) {
      throw new RangeError("Result exceeds safe integer range. Use the BigInt API.");
    }
    return result;
  }

  function squareRoot(value) {
    if (value < 2n) return value;
    let upper = value;
    let lower = (upper + 1n) / 2n;
    while (lower < upper) {
      upper = lower;
      lower = (upper + value / upper) / 2n;
    }
    return upper;
  }

  function* squareTerms() {
    for (let root = 0n; ; root += 1n) yield root * root;
  }

  function createSquare(numericType) {
    const convert = numericType === "number" ? toNumber : (value) => value;
    return Object.freeze({
      term(index) {
        validateIndex(index);
        return convert(BigInt(index) ** 2n);
      },
      *iterate() {
        for (const value of squareTerms()) yield convert(value);
      },
      take(count) {
        validateIndex(count);
        const values = [];
        if (count === 0) return values;
        for (const value of squareTerms()) {
          values.push(convert(value));
          if (values.length === count) break;
        }
        return values;
      },
      upTo(limit) {
        const bound = validateValue(limit, numericType);
        const values = [];
        for (const value of squareTerms()) {
          if (value > bound) break;
          values.push(convert(value));
        }
        return values;
      },
      has(value) {
        const target = validateValue(value, numericType);
        return target >= 0n && squareRoot(target) ** 2n === target;
      },
      next(value) {
        const target = validateValue(value, numericType);
        return convert(target < 0n ? 0n : (squareRoot(target) + 1n) ** 2n);
      },
    });
  }

  const number = Object.freeze({
    square: createSquare("number"),
  });

  const bigint = Object.freeze({
    square: createSquare("bigint"),
  });

  globalThis.libra = {
    number: { ...globalThis.libra?.number, ...number },
    bigint: { ...globalThis.libra?.bigint, ...bigint },
  };
})();
