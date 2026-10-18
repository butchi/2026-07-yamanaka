# 素数

1と自分自身だけを正の約数に持つ、2以上の整数です。1は素数に含まれません。

## 注記

- 素数は2から始まり、同じ値を重複せず小さい順に並ぶ数列として扱えます。
- `next(value)` は数列上の次の添字ではなく、valueより厳密に大きい最小の素数を返します。
- 大きな整数の素数判定は正確でも計算に時間がかかる場合があります。入力規模を確認して利用してください。

## 他の数との組み合わせ

### フィボナッチ素数を抽出する

Number版で安全に生成できるフィボナッチ数を、素数の所属判定で絞り込みます。

```javascript
import { number, range } from "@butchi/integer-sequences";

const fibonacciPrimes = range(79)
  .map(number.fibonacci.term)
  .filter(number.prime.has);
```

### 平方数より1大きい素数を探す

最初の100個の平方数に1を足し、その値が素数かどうかを判定します。

```javascript
import { number } from "@butchi/integer-sequences";

const primesAfterSquares = number.square
  .take(100)
  .map((square) => square + 1)
  .filter(number.prime.has);
```

### ソフィー・ジェルマン素数を探す

素数 $p$ のうち、$2p + 1$ も素数になるものを最初の100個の素数から探します。

```javascript
import { number } from "@butchi/integer-sequences";

const sophieGermainPrimes = number.prime
  .take(100)
  .filter((prime) => number.prime.has(2 * prime + 1));
```
