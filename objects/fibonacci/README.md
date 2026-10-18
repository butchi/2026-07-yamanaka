# フィボナッチ数

0と1から始まり、3項目以降を直前の2項の和として作る数列です。

$$
F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}\quad (n \ge 2)
$$

## 注記

- 数列としては1が2回現れますが、集合として所属を考えるときは同じ値を重複して数えません。
- `take(n)` は先頭からn項を返し、`upTo(limit)` は値がlimit以下の項を返します。
- `range(100).map(number.fibonacci.term)` は、$`F_{79}`$ が安全整数範囲を超えるため途中で `IntegerOverflowError` になります。Number版では `range(79)` までにするか、必要な範囲を検討したうえでBigInt版を選んでください。

## 数値型と精度

| 数値型 | 整数の精度 | 添字の型 |
| --- | --- | --- |
| Number | 安全整数範囲内で正確 | 非負の安全なNumber |
| BigInt | 任意精度整数 | 非負の安全なNumber |

## 他の数との組み合わせ

### フィボナッチ素数を抽出する

Number版で正確に扱える最初の79項から、素数でもあるフィボナッチ数を抽出します。`range(100)` は $`F_{79}`$ で範囲外になるため、実行可能な範囲を使います。

```javascript
import { number, range } from "@butchi/integer-sequences";

const fibonacci = number.fibonacci.term;
const isPrime = number.prime.has;

const fibonacciPrimes = range(79)
  .map(fibonacci)
  .filter(isPrime);
```

### 平方数でもあるフィボナッチ数を探す

BigInt版で最初の100項を生成し、平方数の所属判定と組み合わせます。

```javascript
import { bigint, range } from "@butchi/integer-sequences";

const fibonacciSquares = range(100)
  .map(bigint.fibonacci.term)
  .filter(bigint.square.has);
```
