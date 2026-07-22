import type { ConceptPageContent } from "./types";

export const primeContent = {
  conceptId: "prime",
  seo: {
    title: "素数一覧｜JavaScriptで判定・生成",
    description:
      "素数の定義と最初の項を一覧で確認し、JavaScriptで第n素数の生成、所属判定、次の素数や指定値以下の素数を求められます。",
  },
  definition:
    "1と自分自身だけを正の約数に持つ、2以上の整数です。1は素数に含まれません。",
  notes: [
    "素数は2から始まり、同じ値を重複せず小さい順に並ぶ数列として扱えます。",
    "next(value)は数列上の次の添字ではなく、valueより厳密に大きい最小の素数を返します。",
    "大きな整数の素数判定は正確でも計算に時間がかかる場合があります。入力規模を確認して利用してください。",
  ],
  examples: [
    {
      title: "フィボナッチ素数を抽出する",
      description:
        "Number版で安全に生成できるフィボナッチ数を、素数の所属判定で絞り込みます。",
      code: `import { number, range } from "@butchi/integer-sequences";

const fibonacciPrimes = range(79)
  .map(number.fibonacci.term)
  .filter(number.prime.has);`,
    },
    {
      title: "平方数より1大きい素数を探す",
      description:
        "最初の100個の平方数に1を足し、その値が素数かどうかを判定します。",
      code: `import { number } from "@butchi/integer-sequences";

const primesAfterSquares = number.square
  .take(100)
  .map((square) => square + 1)
  .filter(number.prime.has);`,
    },
    {
      title: "ソフィー・ジェルマン素数を探す",
      description:
        "素数pのうち、2p + 1も素数になるものを最初の100個の素数から探します。",
      code: `import { number } from "@butchi/integer-sequences";

const sophieGermainPrimes = number.prime
  .take(100)
  .filter((prime) => number.prime.has(2 * prime + 1));`,
    },
  ],
  relatedConceptIds: ["fibonacci", "square"],
} as const satisfies ConceptPageContent<"prime">;
