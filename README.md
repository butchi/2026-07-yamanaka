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

## コンテンツの編集

ドキュメントと構造化データは、TypeScriptのオブジェクトリテラルではなく標準的なファイルとして管理します。

- [`objects/`](./objects/) — 対象別のディレクトリ。各対象の `object.json` に項目ID、SEO情報、関連項目、任意のブログ参照を、`overview.md` に定義、注記、表、コード例などのGFM本文を記述します。HTML、MathML、SVGも本文に直接記述できます。
- 各対象の `data/digest.json` は最初の16項、`data/standard.json` は最初の256項を正確な整数データとして保存します。各値はJSONの安全整数制限を避ける10進整数文字列で、添字の原点も明記します。サイトはこれらのスナップショットをそのまま表示・配信し、ビルド時の `take()` で生成しません。
- 各対象の `functions.mjs` は、公開ライブラリの `number.<object>` / `bigint.<object>` 名前空間をそのままエクスポートするES moduleです。元のAPIのimport元を対象モジュールへ差し替えて使える互換ファサードとして、ソースとダウンロード可能なモジュールを保持します。アルゴリズム本体は引き続き `@butchi/integer-sequences` が所有します。
- [`src/content.config.ts`](./src/content.config.ts) — Astro Content Layerの読み込み先と検証スキーマ。
- [`src/layouts/ObjectLayout.astro`](./src/layouts/ObjectLayout.astro) — MarkdownとJSONを計算・表示機能に接続する共通レイアウト。

例えば、フィボナッチ数の説明は [`objects/fibonacci/overview.md`](./objects/fibonacci/overview.md)、構造化データは [`objects/fibonacci/object.json`](./objects/fibonacci/object.json) を編集し、対象のディレクトリを中心に差分をレビュー・コミットします。本文変更だけならTypeScriptやAstroの編集は不要です。Markdownの空のフロントマターは追加メタデータを持たせないためのもので、SEOなどはJSONに集約しています。

同じディレクトリ内の `object.json` と `overview.md` を必ず組にし、ディレクトリ名を項目IDとします。データセットは正確に16項・256項であること、十進整数文字列の形式、オブジェクトID、添字原点、およびダイジェストが標準データの先頭と一致することを検証します。読み込み対象は `object.json`、`overview.md`、`data/digest.json`、`data/standard.json` に限定するため、対象固有の補助データや補足文書を追加しても別項目として誤認しません。HTML等の埋め込みは信頼できるリポジトリ内コンテンツとして扱うため、投稿時にはマークアップもレビューしてください。GFMと標準マークアップを使い、MDXの実行可能なコンポーネントは用いません。

### 配置の原則：一緒に編集するものを近くに置く

- 対象固有の概要・データ・実装は `objects/<id>/` に集めます。必要に応じて `data/` や `implementations/` を追加します。
- 複数の対象で共有する関数はルートの `functions/<function-id>/`、横断的な解説は `documents/<document-id>.md` に独立して配置する方針です。共有資源の導入時にこれらのディレクトリを作成します。
- 関係は包含関係から推測せず、メタデータのID参照で表します。現在の関連項目は `relatedConceptIds` で参照しており、保存場所とは独立しています。
- 共有関数を導入する際は、関数IDと適用パラメータ、共有文書は文書IDを項目のメタデータに記録し、参照先の検証と表示先の選択を実装します。共有資源を更新した場合に、参照する対象をCIで検証できる構成を目指します。

現段階では共有関数・共有文書の登録／参照スキーマや依存先に応じたCI実行は未実装です。実在しない関数や実装例は登録せず、計算には引き続き公開ライブラリを使います。

新しい種類の計算を追加する場合は、別途ライブラリの実装と `src/lib/conceptRegistry.ts` の接続が必要です。データスナップショットはAPIの実行結果からビルドごとに生成せず、対象ディレクトリに保存したレビュー可能なJSONを正とします。Expression JSONやMathJSONの専用評価器は現時点では実装していません。

保存データは `/objects/fibonacci/data/digest.json`、`/objects/fibonacci/data/standard.json` として、ES moduleは `/objects/fibonacci/functions.mjs` としてサイトからも取得できます。

## データ・関数と整数列ライブラリ

数列の計算と操作メタデータは [`@butchi/integer-sequences`](https://www.npmjs.com/package/@butchi/integer-sequences) に委ね、サイトの表示・説明・操作UIと責務を分けています。

```text
@butchi/integer-sequences  →  Libra
       計算・操作仕様          データ表示・ドキュメント・UI
```

NumberとBigIntの明示的な選択、入力境界の検証、JSON・CSV・JavaScript形式の出力など、現行ビューアの再利用機能を引き継いでいます。具体的な表示上限は `src/lib/uiLimits.ts` に定義されています。

```text
objects/fibonacci/
├─ object.json
├─ overview.md
├─ functions.mjs
└─ data/
   ├─ digest.json       # 最初の16項
   └─ standard.json     # 最初の256項
```

## 投稿と今後の構想

項目の提案・修正にはGitHubを基本的に活用し、MarkdownとJSONへの差分として根拠、レビュー、変更履歴を追える投稿フローを目指します。汎用的なオブジェクトスキーマや投稿案内は引き続き整備対象で、現在このサイトから一般投稿する機能はありません。

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
objects/
├─ fibonacci/
│  ├─ object.json         項目ID・SEO・関連項目
│  ├─ overview.md         解説本文（GFM・HTML・MathML・SVG）
│  ├─ functions.mjs       API互換のJavaScript ES module
│  └─ data/
│     ├─ digest.json      最初の16項（正確な整数文字列）
│     └─ standard.json    最初の256項（正確な整数文字列）
├─ prime/
│  ├─ object.json
│  ├─ overview.md
│  ├─ functions.mjs
│  └─ data/
└─ square/
   ├─ object.json
   ├─ overview.md
   ├─ functions.mjs
   └─ data/
src/
├─ content.config.ts     コンテンツの読み込み・スキーマ検証
├─ components/           Astroコンポーネントと操作UI
├─ layouts/              共通レイアウト、SEO、ナビゲーション
├─ lib/                  レジストリ、入力検証、操作サービス
├─ pages/                カタログ、詳細ページ、プロジェクト情報
└─ styles/               共通デザイン
tests/e2e/               Playwrightシナリオ
```

## License

[MIT License](./LICENSE)
