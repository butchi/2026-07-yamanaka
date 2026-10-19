# Wythoff array

The Wythoff array is an infinite matrix of positive integers. Every positive integer occurs exactly once, and every row follows the Fibonacci recurrence.

## Definition

Let `φ = (1 + √5) / 2`. For a one-based row index `m`, let `k = floor(mφ)`. The first two entries in row `m` are `floor(kφ)` and `floor(kφ²)`. For a one-based column index `n >= 3`, define `A(m,n) = A(m,n-2) + A(m,n-1)`.

The JSON dataset stores the top-left 10 × 10 finite submatrix of this infinite array. Its `rowIndexOrigin` and `columnIndexOrigin` are both 1; each inner array is one row, in left-to-right column order. It is a rectangular excerpt of the matrix, not a skew-diagonal reading.

## Properties

The first two entries in each row form a Wythoff pair. Together, these pairs partition the positive integers. The recurrence then makes every row a Fibonacci-type sequence.

## References

- [OEIS A035513: Wythoff array](https://oeis.org/A035513)
- [Wythoff array, Wikipedia](https://en.wikipedia.org/wiki/Wythoff_array)
- [Wythoff Array, Wolfram MathWorld](https://mathworld.wolfram.com/WythoffArray.html)
