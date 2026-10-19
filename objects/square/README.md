# Square numbers

Integers of the form $`n^2`$, obtained by multiplying a nonnegative integer $`n`$ by itself. This includes $`0^2`$, so 0 is a square.

## Notes

- The sequence 0, 1, 4, 9, … is strictly increasing.
- `has(value)` tests whether the value is an integer square; it does not merely return an approximate square root.
- `next(value)` returns the smallest square strictly greater than value, even when value itself is a square.

## Relationships with other numbers

### Find Fibonacci numbers that are also squares

Generate Fibonacci numbers with BigInt and filter them by square membership.

```javascript
import { bigint, range } from "@butchi/integer-sequences";

const fibonacciSquares = range(100)
  .map(bigint.fibonacci.term)
  .filter(bigint.square.has);
```

### Find squares whose successor is prime

From the first 100 squares, select those for which adding 1 gives a prime.

```javascript
import { number } from "@butchi/integer-sequences";

const squaresBeforePrimes = number.square
  .take(100)
  .filter((square) => number.prime.has(square + 1));
```

### Find Pythagorean triples

Find pairs whose sum of squares $`a^2 + b^2`$ is itself a square, then obtain the integer hypotenuse $`c`$.

```javascript
import { number, range } from "@butchi/integer-sequences";

const pythagoreanTriples = range(1, 50).flatMap((a) =>
  range(a, 50)
    .map((b) => ({ a, b, cSquared: a * a + b * b }))
    .filter(({ cSquared }) => number.square.has(cSquared))
    .map(({ a, b, cSquared }) => ({
      a,
      b,
      c: Math.sqrt(cSquared),
    })),
);
```
