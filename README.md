# Libra (仮称)

数学的・工学的オブジェクトの「データ」「関数」「ドキュメント」を項目ごとにまとめ、知識を確かめて再利用できるサイトを目指すプロジェクトです。

OEISのように対象を探してつながりをたどれる強みを受け継ぎながら、Web標準を活用した現代的な体験と、明確なデータ・関数仕様を重視します。MathWorld、Wolfram Function Repository、Wikipedia、Rosetta Codeからも着想を得て、まずデータと関数を中心に整備し、ドキュメントとしても有用なカタログを育てます。

## 現在の実装

このリポジトリは再構築の初期段階です。現状はAstroによる静的サイトに、整数列カタログとしてフィボナッチ数・素数・平方数を掲載しています。

- `/` — Libraの目的と注目オブジェクト
- `/numbers/` — 整数列カタログ
- `/numbers/fibonacci/` — フィボナッチ数のデータ、定義、関数、実装情報
- `/numbers/prime/` — 素数のデータ、定義、関数、実装情報
- `/numbers/square/` — 平方数のデータ、定義、関数、実装情報
- `/about/` — 設計方針、貢献方針、Miyaburu構想
- `/license/` — MIT License

詳細ページのデータと説明はJavaScriptなしでも読めます。ブラウザ上の生成・判定UIは、実際の整数列ライブラリを使って動作します。現行の `/numbers/` URLは初期コンテンツの互換性のため維持しています。

## データ・関数と整数列ライブラリ

数列の計算と操作メタデータは [`@butchi/integer-sequences`](https://www.npmjs.com/package/@butchi/integer-sequences) に委ね、サイトの表示・説明・操作UIと責務を分けています。

```text
@butchi/integer-sequences  →  Libra
       計算・操作仕様          データ表示・ドキュメント・UI
```

NumberとBigIntの明示的な選択、入力境界の検証、JSON・CSV・JavaScript形式の出力など、現行ビューアの再利用機能を引き継いでいます。具体的な表示上限は `src/lib/uiLimits.ts` に定義されています。

## 投稿と今後の構想

項目の提案・修正にはGitHubを基本的に活用し、根拠、レビュー、変更履歴を追える投稿フローを目指します。投稿フローと汎用的なオブジェクトスキーマはこれから整備する計画であり、現在このサイトから一般投稿する機能はありません。

姉妹プロジェクト **Miyaburu（仮称）** は、サイト生成、データ表現、ドキュメントをマトラ言語で構築し、その有効性を示す構想です。LibraはWeb標準を用いる本プロジェクトとして進めます。Miyaburuは現時点では計画段階です。

## 開発環境

- Node.js 22.12以降
- pnpm 11

```sh
pnpm install
pnpm dev
```

開発サーバーは `http://localhost:4321` で起動します。

## ビルドとテスト

```sh
# 型検査を含む静的ビルド
pnpm build

# Vitest単体テスト
pnpm test

# Playwright E2E
pnpm exec playwright install chromium
pnpm test:e2e
```

## ディレクトリ

```text
src/
├─ components/           Astroコンポーネントと操作UI
├─ content/concepts/     整数列ごとの説明・例
├─ layouts/              共通レイアウト、SEO、ナビゲーション
├─ lib/                  レジストリ、入力検証、操作サービス
├─ pages/                カタログ、詳細ページ、プロジェクト情報
└─ styles/               共通デザイン
tests/e2e/               Playwrightシナリオ
```

## License

[MIT License](./LICENSE)
