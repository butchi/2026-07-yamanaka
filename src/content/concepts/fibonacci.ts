import type { ConceptPageContent } from "./types";

export const fibonacciContent = {
  conceptId: "fibonacci",
  seo: {
    title: "フィボナッチ数一覧｜JavaScript・JSONで生成",
    description:
      "フィボナッチ数の定義と最初の項を確認し、JavaScriptで第n項・最初のn項・指定値以下の列挙や所属判定を試せます。",
  },
  definition:
    "0と1から始まり、3項目以降を直前の2項の和として作る数列です。F₀ = 0、F₁ = 1、Fₙ = Fₙ₋₁ + Fₙ₋₂ と表せます。",
  notes: [
    "数列としては1が2回現れますが、集合として所属を考えるときは同じ値を重複して数えません。",
    "take(n)は先頭からn項を返し、upTo(limit)は値がlimit以下の項を返します。",
    "仕様例のrange(100).map(number.fibonacci.term)は、F(79)が安全整数範囲を超えるため途中でIntegerOverflowErrorになります。Number版ではrange(79)までにするか、必要な範囲を検討したうえでBigInt版を選んでください。",
  ],
  examples: [
    {
      title: "フィボナッチ素数を抽出する",
      description:
        "Number版で正確に扱える最初の79項から、素数でもあるフィボナッチ数を抽出します。仕様で示されたrange(100)はF(79)で範囲外になるため、実行可能な範囲へ修正しています。",
      code: `import { number, range } from "@butchi/integer-sequences";

const fibonacci = number.fibonacci.term;
const isPrime = number.prime.has;

// range(100)ではF(79)でIntegerOverflowErrorになります。
const fibonacciPrimes = range(79)
  .map(fibonacci)
  .filter(isPrime);`,
    },
    {
      title: "平方数でもあるフィボナッチ数を探す",
      description:
        "BigInt版で最初の100項を生成し、平方数の所属判定と組み合わせます。",
      code: `import { bigint, range } from "@butchi/integer-sequences";

const fibonacciSquares = range(100)
  .map(bigint.fibonacci.term)
  .filter(bigint.square.has);`,
    },
  ],
  relatedConceptIds: ["prime", "square"],
} as const satisfies ConceptPageContent<"fibonacci">;
