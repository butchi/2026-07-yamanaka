import type { ConceptPageContent } from "./types";

export const squareContent = {
  conceptId: "square",
  seo: {
    title: "平方数 — データ・関数・解説｜Libra",
    description:
      "平方数の定義と最初の項を一覧で確認し、JavaScriptで第n項の生成、所属判定、次の平方数や指定値以下の列挙を試せます。",
  },
  definition:
    "非負整数nを自分自身に掛けたn²の形で表せる整数です。0²を含むため0も平方数です。",
  notes: [
    "平方数は0、1、4、9のように小さい順へ厳密に増加します。",
    "has(value)は整数の平方として表せるかを判定し、平方根の近似値だけを結果として返す操作ではありません。",
    "next(value)はvalueより厳密に大きい最小の平方数を返します。value自身が平方数でも同じ値は返しません。",
  ],
  examples: [
    {
      title: "平方数でもあるフィボナッチ数を探す",
      description:
        "BigInt版のフィボナッチ数を生成し、平方数の所属判定で絞り込みます。",
      code: `import { bigint, range } from "@butchi/integer-sequences";

const fibonacciSquares = range(100)
  .map(bigint.fibonacci.term)
  .filter(bigint.square.has);`,
    },
    {
      title: "1を足すと素数になる平方数を探す",
      description:
        "最初の100個の平方数から、1を足した値が素数になるものを抽出します。",
      code: `import { number } from "@butchi/integer-sequences";

const squaresBeforePrimes = number.square
  .take(100)
  .filter((square) => number.prime.has(square + 1));`,
    },
    {
      title: "ピタゴラス数の組を探す",
      description:
        "2辺a、bの二乗和が平方数になる組を探し、整数の斜辺cを求めます。",
      code: `import { number, range } from "@butchi/integer-sequences";

const pythagoreanTriples = range(1, 50).flatMap((a) =>
  range(a, 50)
    .map((b) => ({ a, b, cSquared: a * a + b * b }))
    .filter(({ cSquared }) => number.square.has(cSquared))
    .map(({ a, b, cSquared }) => ({
      a,
      b,
      c: Math.sqrt(cSquared),
    })),
);`,
    },
  ],
  relatedConceptIds: ["fibonacci", "prime"],
} as const satisfies ConceptPageContent<"square">;
