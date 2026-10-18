---
---

# 平方数

非負整数 $n$ を自分自身に掛けた $n^2$ の形で表せる整数です。$0^2$ を含むため0も平方数です。

## 注記

- 平方数は0、1、4、9のように小さい順へ厳密に増加します。
- `has(value)` は整数の平方として表せるかを判定し、平方根の近似値だけを結果として返す操作ではありません。
- `next(value)` はvalueより厳密に大きい最小の平方数を返します。value自身が平方数でも同じ値は返しません。

## 他の数との組み合わせ

### 平方数でもあるフィボナッチ数を探す

BigInt版のフィボナッチ数を生成し、平方数の所属判定で絞り込みます。

```javascript
import { bigint, range } from "@butchi/integer-sequences";

const fibonacciSquares = range(100)
  .map(bigint.fibonacci.term)
  .filter(bigint.square.has);
```

### 1を足すと素数になる平方数を探す

最初の100個の平方数から、1を足した値が素数になるものを抽出します。

```javascript
import { number } from "@butchi/integer-sequences";

const squaresBeforePrimes = number.square
  .take(100)
  .filter((square) => number.prime.has(square + 1));
```

### ピタゴラス数の組を探す

2辺 $a$、$b$ の二乗和 $a^2 + b^2$ が平方数になる組を探し、整数の斜辺 $c$ を求めます。

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
