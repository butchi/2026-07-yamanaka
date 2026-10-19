# Fibonacci words

Fibonacci words are finite strings over a two-symbol alphabet, constructed by concatenation rather than integer addition. This object records the initial terms as strings.

## Definition

Let `W_0 = "0"` and `W_1 = "01"`. For `n >= 2`, define `W_n` as `W_(n-1)` followed by `W_(n-2)`. The dataset uses zero-based indices and stores each word as a JSON string.

## Scope

The published data contains the first seven terms. It is a finite reference dataset, not an implementation for generating words of arbitrary length.

## References

- [Fibonacci word](https://en.wikipedia.org/wiki/Fibonacci_word)
