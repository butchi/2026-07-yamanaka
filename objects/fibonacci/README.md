# Fibonacci numbers

A sequence starting with 0 and 1, with each subsequent term equal to the sum of the preceding two terms.

$$
F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}\quad (n \ge 2)
$$

## Notes

- The sequence contains 1 twice; membership in the set does not count duplicates.
- `take(n)` returns the first n terms. `upTo(limit)` returns all terms at most limit.
- `range(100).map(number.fibonacci.term)` throws `IntegerOverflowError` at $`F_{79}`$, which exceeds the safe integer range. Use at most `range(79)` with Number, or choose BigInt after considering the required workload.

## Numeric types and precision

| Numeric type | Integer precision | Index type |
| --- | --- | --- |
| Number | Exact within the safe integer range | Nonnegative safe Number |
| BigInt | Arbitrary precision | Nonnegative safe Number |

## Relationships with other numbers

### Find Fibonacci primes

Filter the first 79 Fibonacci terms, which are exact with Number, for primality.

```javascript
import { number, range } from "@butchi/integer-sequences";

const fibonacci = number.fibonacci.term;
const isPrime = number.prime.has;

const fibonacciPrimes = range(79)
  .map(fibonacci)
  .filter(isPrime);
```

### Find Fibonacci numbers that are also squares

Generate the first 100 Fibonacci terms with BigInt and test square membership.

```javascript
import { bigint, range } from "@butchi/integer-sequences";

const fibonacciSquares = range(100)
  .map(bigint.fibonacci.term)
  .filter(bigint.square.has);
```
