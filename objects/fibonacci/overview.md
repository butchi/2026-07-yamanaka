---
---

<!-- The page title and enclosing section headings are supplied by ObjectLayout. -->
<!-- markdownlint-configure-file { "MD041": false } -->

0と1から始まり、3項目以降を直前の2項の和として作る数列です。

<!-- MathML is intentional semantic markup for the recurrence formula. -->
<!-- markdownlint-disable MD033 -->
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>F</mi><mn>0</mn></msub><mo>=</mo><mn>0</mn><mo>,</mo>
  <msub><mi>F</mi><mn>1</mn></msub><mo>=</mo><mn>1</mn><mo>,</mo>
  <msub><mi>F</mi><mi>n</mi></msub><mo>=</mo>
  <msub><mi>F</mi><mrow><mi>n</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>+</mo>
  <msub><mi>F</mi><mrow><mi>n</mi><mo>−</mo><mn>2</mn></mrow></msub>
  <mspace width="1em"/><mo>(</mo><mi>n</mi><mo>≥</mo><mn>2</mn><mo>)</mo>
</math>
<!-- markdownlint-enable MD033 -->

### 注記

- 数列としては1が2回現れますが、集合として所属を考えるときは同じ値を重複して数えません。
- `take(n)` は先頭からn項を返し、`upTo(limit)` は値がlimit以下の項を返します。
- `range(100).map(number.fibonacci.term)` は、F(79)が安全整数範囲を超えるため途中で `IntegerOverflowError` になります。Number版では `range(79)` までにするか、必要な範囲を検討したうえでBigInt版を選んでください。

### 数値型と精度

| 数値型 | 整数の精度 | 添字の型 |
| --- | --- | --- |
| Number | 安全整数範囲内で正確 | 非負の安全なNumber |
| BigInt | 任意精度整数 | 非負の安全なNumber |

### 他の数との組み合わせ

#### フィボナッチ素数を抽出する

Number版で正確に扱える最初の79項から、素数でもあるフィボナッチ数を抽出します。`range(100)` はF(79)で範囲外になるため、実行可能な範囲を使います。

```javascript
import { number, range } from "@butchi/integer-sequences";

const fibonacci = number.fibonacci.term;
const isPrime = number.prime.has;

const fibonacciPrimes = range(79)
  .map(fibonacci)
  .filter(isPrime);
```

#### 平方数でもあるフィボナッチ数を探す

BigInt版で最初の100項を生成し、平方数の所属判定と組み合わせます。

```javascript
import { bigint, range } from "@butchi/integer-sequences";

const fibonacciSquares = range(100)
  .map(bigint.fibonacci.term)
  .filter(bigint.square.has);
```
