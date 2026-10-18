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

function* fibonacciTerms() {
  let current = 0n;
  let following = 1n;
  while (true) {
    yield current;
    [current, following] = [following, current + following];
  }
}

function fibonacciTerm(index) {
  let current = 0n;
  let following = 1n;
  for (const bit of index.toString(2)) {
    const even = current * (2n * following - current);
    const odd = current * current + following * following;
    [current, following] = bit === "0" ? [even, odd] : [odd, even + odd];
  }
  return current;
}

function createFibonacci(numericType) {
  const convert = numericType === "number" ? toNumber : (value) => value;
  return Object.freeze({
    term(index) {
      validateIndex(index);
      if (numericType === "number" && index > 78) {
        throw new RangeError("Fibonacci index exceeds 78. Use the BigInt API.");
      }
      return convert(fibonacciTerm(index));
    },
    *iterate() {
      for (const value of fibonacciTerms()) yield convert(value);
    },
    take(count) {
      validateIndex(count);
      const values = [];
      if (count === 0) return values;
      for (const value of fibonacciTerms()) {
        values.push(convert(value));
        if (values.length === count) break;
      }
      return values;
    },
    upTo(limit) {
      const bound = validateValue(limit, numericType);
      const values = [];
      for (const value of fibonacciTerms()) {
        if (value > bound) break;
        values.push(convert(value));
      }
      return values;
    },
    has(value) {
      const target = validateValue(value, numericType);
      if (target < 0n) return false;
      for (const term of fibonacciTerms()) {
        if (term >= target) return term === target;
      }
    },
    next(value) {
      const target = validateValue(value, numericType);
      for (const term of fibonacciTerms()) {
        if (term > target) return convert(term);
      }
    },
  });
}

export const number = Object.freeze({
  fibonacci: createFibonacci("number"),
});

export const bigint = Object.freeze({
  fibonacci: createFibonacci("bigint"),
});
