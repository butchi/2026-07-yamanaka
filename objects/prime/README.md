# Prime numbers

Integers at least 2 whose only positive divisors are 1 and themselves. The number 1 is not prime.

## Notes

- The sequence begins at 2 and is strictly increasing, without duplicates.
- `next(value)` returns the smallest prime strictly greater than value, not the next index in the sequence.
- Exact primality testing of large integers may be expensive. Consider the input size before running it.

## Relationships with other numbers

### Find Fibonacci primes

Filter Fibonacci numbers that can be generated safely with Number for primality.

```javascript
import { number, range } from "@butchi/integer-sequences";

const fibonacciPrimes = range(79)
  .map(number.fibonacci.term)
  .filter(number.prime.has);
```

### Find primes one greater than a square

Add 1 to each of the first 100 squares and test the results for primality.

```javascript
import { number } from "@butchi/integer-sequences";

const primesAfterSquares = number.square
  .take(100)
  .map((square) => square + 1)
  .filter(number.prime.has);
```

### Find Sophie Germain primes

From the first 100 primes, select primes $`p`$ for which $`2p + 1`$ is also prime.

```javascript
import { number } from "@butchi/integer-sequences";

const sophieGermainPrimes = number.prime
  .take(100)
  .filter((prime) => number.prime.has(2 * prime + 1));
```
