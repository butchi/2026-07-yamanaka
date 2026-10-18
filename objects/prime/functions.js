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
    return value;
  }

  function toNumber(value) {
    const result = Number(value);
    if (!Number.isSafeInteger(result)) {
      throw new RangeError("Result exceeds safe integer range. Use the BigInt API.");
    }
    return result;
  }

  function isPrime(value) {
    if (value < 2n) return false;
    if (value % 2n === 0n) return value === 2n;
    for (let divisor = 3n; divisor <= value / divisor; divisor += 2n) {
      if (value % divisor === 0n) return false;
    }
    return true;
  }

  function nextPrime(value, maximum) {
    if (value < 2n) return 2n;
    let candidate = value + (value % 2n === 0n ? 1n : 2n);
    while (true) {
      if (maximum !== undefined && candidate > maximum) {
        throw new RangeError("Result exceeds safe integer range. Use the BigInt API.");
      }
      if (isPrime(candidate)) return candidate;
      candidate += 2n;
    }
  }

  function* primeTerms() {
    let value = 2n;
    while (true) {
      yield value;
      value = nextPrime(value);
    }
  }

  const number = Object.freeze({
    prime: Object.freeze({
      term(index) {
        validateIndex(index);
        let position = 0;
        for (const value of primeTerms()) {
          if (position === index) return toNumber(value);
          position += 1;
        }
      },
      *iterate() {
        for (const value of primeTerms()) yield toNumber(value);
      },
      take(count) {
        validateIndex(count);
        const values = [];
        if (count === 0) return values;
        for (const value of primeTerms()) {
          values.push(toNumber(value));
          if (values.length === count) break;
        }
        return values;
      },
      upTo(limit) {
        const bound = BigInt(validateValue(limit, "number"));
        const values = [];
        for (const value of primeTerms()) {
          if (value > bound) break;
          values.push(toNumber(value));
        }
        return values;
      },
      has(value) {
        return isPrime(BigInt(validateValue(value, "number")));
      },
      next(value) {
        return toNumber(nextPrime(
          BigInt(validateValue(value, "number")),
          BigInt(Number.MAX_SAFE_INTEGER),
        ));
      },
    }),
  });

  const bigint = Object.freeze({
    prime: Object.freeze({
      has(value) {
        return isPrime(validateValue(value, "bigint"));
      },
      next(value) {
        return nextPrime(validateValue(value, "bigint"));
      },
    }),
  });

  globalThis.libra = {
    number: { ...globalThis.libra?.number, ...number },
    bigint: { ...globalThis.libra?.bigint, ...bigint },
  };
})();
