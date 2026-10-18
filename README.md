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

### GitHubでの編集・プルリクエスト

現在の暫定的な投稿先は [`develop` ブランチ](https://github.com/butchi/2026-07-yamanaka/tree/develop) です。Forkの `develop` から作業ブランチを作成し、変更をコミット・pushしてください。[PR作成画面](https://github.com/butchi/2026-07-yamanaka/compare/develop...develop?expand=1) では、必要に応じて「compare across forks」で自分のForkと作業ブランチを選び、base repositoryが `butchi/2026-07-yamanaka`、baseが `develop` であることを確認して、変更理由・出典・確認した内容を記載します。GitHubアカウントが必要で、直接の書き込み権限がなくてもForkから提案できます。

サイト共通の「編集・PRを送る」から投稿手順へ進めます。各項目の「この項目を編集・提案する」には、その項目の説明・実装のGitHub編集画面、データディレクトリ、ソース、PR作成画面へのリンクがあります。リンク先のリポジトリと投稿先ブランチは [`src/lib/github.ts`](./src/lib/github.ts) に集約しています。

ドキュメントと構造化データは、TypeScriptのオブジェクトリテラルではなく標準的なファイルとして管理します。

- [`objects/`](./objects/) — 対象別のディレクトリ。各対象の `object.json` に項目ID、SEO情報、関連項目、任意のブログ参照を、`README.md` に定義、注記、表、コード例などのGFM本文を記述します。記事中の数式にはLaTeX記法を使います。図などには必要に応じてHTML・SVGを利用できます。
- 各対象の `data/digest.json` は最初の16項、`data/standard.json` は最初の256項を正確な整数データとして保存します。各値はJSONの安全整数制限を避ける10進整数文字列で、添字の原点も明記します。サイトはこれらのスナップショットをそのまま表示・配信し、ビルド時の `take()` で生成しません。
- 各対象の `functions.js` は、外部パッケージに依存せず、デベロッパーツールのコンソールにそのまま貼り付けられるJavaScript実装です。`import` / `export` は含みません。関数は `globalThis.libra.number.<object>` / `globalThis.libra.bigint.<object>` に登録し、補助関数は即時実行関数内に閉じ込めます。同じ実装の再貼り付けや、複数対象の併用も可能です。関数名・引数・戻り値は公開ライブラリと共通ですが、ライブラリ固有の操作メタデータや例外クラスは含まず、不正入力やNumberの安全整数範囲外の結果は標準の `TypeError` / `RangeError` で通知します。`functions.mjs` はこの実装を読み込むES module用の薄いアダプターです。
- [`src/content.config.ts`](./src/content.config.ts) — Astro Content Layerの読み込み先と検証スキーマ。
- [`src/layouts/ObjectLayout.astro`](./src/layouts/ObjectLayout.astro) — MarkdownとJSONを計算・表示機能に接続する共通レイアウト。

各項目の `README.md` は、そのディレクトリにある対象の概要・定義・注意点・利用例を説明するREADMEです。GitHubでもディレクトリを開くと本文を読めます。独立した文書として登録するのではなく、`object.json` やデータ・実装と組になる項目の構成要素として扱い、サイトでも同じ本文を表示します。読み込み先も汎用の文書コレクションではなく `objectReadmes` として区別します。

例えば、フィボナッチ数の説明は [`objects/fibonacci/README.md`](./objects/fibonacci/README.md)、構造化データは [`objects/fibonacci/object.json`](./objects/fibonacci/object.json) を編集し、対象のディレクトリを中心に差分をレビュー・コミットします。本文変更だけならTypeScriptやAstroの編集は不要です。Markdownの空のフロントマターは追加メタデータを持たせないためのもので、SEOなどはJSONに集約しています。

同じディレクトリ内の `object.json` と `README.md` を必ず組にし、ディレクトリ名を項目IDとします。データセットは正確に16項・256項であること、十進整数文字列の形式、オブジェクトID、添字原点、およびダイジェストが標準データの先頭と一致することを検証します。読み込み対象は `object.json`、`README.md`、`data/digest.json`、`data/standard.json` に限定するため、対象固有の補助データや補足文書を追加しても別項目として誤認しません。HTML等の埋め込みは信頼できるリポジトリ内コンテンツとして扱うため、投稿時にはマークアップもレビューしてください。GFMと標準マークアップを使い、MDXの実行可能なコンポーネントは用いません。

### 記事中の数式

数式はMathMLを直接書かず、インライン数式は `$n^2$`、独立した数式は次のように `$$` で囲んだLaTeXで記述します。

```text
$$
F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}\quad (n \ge 2)
$$
```

[`scripts/latex-math.mjs`](./scripts/latex-math.mjs) がビルド時にKaTeXで描画するため、ブラウザーのJavaScriptや外部CDNは不要です。表示用HTMLとアクセシビリティ用MathMLは自動生成されます。不正なLaTeXや非対応のコマンドはビルドエラーとして通知します。コードブロックやインラインコード内の数式記法は変換しません。

### 配置の原則：一緒に編集するものを近くに置く

- 対象固有の概要・データ・実装は `objects/<id>/` に集めます。必要に応じて `data/` や `implementations/` を追加します。
- 複数の対象で共有する関数はルートの `functions/<function-id>/`、横断的な解説は `documents/<document-id>.md` に独立して配置する方針です。項目固有のREADMEとは区別し、共有資源の導入時にこれらのディレクトリを作成します。
- 関係は包含関係から推測せず、メタデータのID参照で表します。現在の関連項目は `relatedConceptIds` で参照しており、保存場所とは独立しています。
- 共有関数を導入する際は、関数IDと適用パラメータ、共有文書は文書IDを項目のメタデータに記録し、参照先の検証と表示先の選択を実装します。共有資源を更新した場合に、参照する対象をCIで検証できる構成を目指します。

現段階では共有関数・共有文書の登録／参照スキーマや依存先に応じたCI実行は未実装です。実在しない関数や実装例は登録せず、計算には引き続き公開ライブラリを使います。

新しい種類の計算を追加する場合は、別途ライブラリの実装と `src/lib/conceptRegistry.ts` の接続が必要です。データスナップショットはAPIの実行結果からビルドごとに生成せず、対象ディレクトリに保存したレビュー可能なJSONを正とします。Expression JSONやMathJSONの専用評価器は現時点では実装していません。

保存データは `/objects/fibonacci/data/digest.json`、`/objects/fibonacci/data/standard.json` として、JavaScript実装とES moduleアダプターは `/objects/fibonacci/functions.js`、`/objects/fibonacci/functions.mjs` としてサイトからも取得できます。

### コピーした実装の使い方

詳細ページの「依存なしの実装を表示・コピー」から実装全体をコピーし、ブラウザーのデベロッパーツールのコンソールに貼り付けて実行します。続けて次のコードを実行できます。ファイル保存やモジュール設定は不要です。

```js
libra.number.fibonacci.take(16);
libra.bigint.fibonacci.term(100); // 354224848179261915075n
```

ES moduleとして利用する場合は、`functions.js` と `functions.mjs` を同じディレクトリに保存します。アダプターも `globalThis.libra` に関数を登録します。

```js
import { number, bigint } from "./functions.mjs";
number.fibonacci.take(16);
bigint.fibonacci.term(100);
```

既存ライブラリを使う場合はimport元を `@butchi/integer-sequences` に変更できます。独立実装ではフィボナッチ数の高速倍加法、平方数の整数演算、素数の試し割りを使用します。特に大きな素数の判定・探索は時間がかかるため、大規模な計算に最適化された実装ではありません。BigInt版の素数はライブラリ同様に `has` と `next` のみを提供します。単体テストでライブラリとの計算結果の一致と入力境界を検証します。

## データ・関数と整数列ライブラリ

ブラウザーの計算UIと操作メタデータには引き続き [`@butchi/integer-sequences`](https://www.npmjs.com/package/@butchi/integer-sequences) を使います。コピーして再利用するための独立実装は各対象の `functions.js` で管理し、ライブラリの実装情報とは区別します。

```text
@butchi/integer-sequences  →  Libra
       計算・操作仕様          データ表示・ドキュメント・UI
```

NumberとBigIntの明示的な選択、入力境界の検証、JSON・CSV・JavaScript形式の出力など、現行ビューアの再利用機能を引き継いでいます。具体的な表示上限は `src/lib/uiLimits.ts` に定義されています。

```text
objects/fibonacci/
├─ object.json
├─ README.md
├─ functions.js
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

Markdownは `pnpm lint:md` で検証します。[`.markdownlint.jsonc`](./.markdownlint.jsonc) では日本語文章を意味のまとまりで記述するため行長制限（MD013）を除外しています。すべてのMarkdownは先頭にH1を必須とし、項目のREADMEも `# 項目名` から始め、節はH2、小節はH3で記述します。サイト生成時には [`scripts/object-readme-headings.mjs`](./scripts/object-readme-headings.mjs) が項目のREADMEのH1を取り除き、残りの見出しを1段下げるため、レイアウト側のページタイトルや「ドキュメント — 定義と性質」と重複しません。H1必須はlintで検証し、項目のREADMEの見出しがH1以外から始まる場合やH1が複数ある場合はビルド時にもエラーにします。HTML・SVGの直接記述が必要な場合だけ、理由を添えて該当ブロックのMD033を除外し、それ以外のルールは有効に保ちます。LaTeX数式にMD033の除外は不要です。

```sh
# Markdownの検証
pnpm lint:md

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
│  ├─ README.md           項目の概要・定義・利用例（GFM・LaTeX数式）
│  ├─ functions.js        コンソールへ貼り付けられる独立実装
│  ├─ functions.mjs       API互換のES moduleアダプター
│  └─ data/
│     ├─ digest.json      最初の16項（正確な整数文字列）
│     └─ standard.json    最初の256項（正確な整数文字列）
├─ prime/
│  ├─ object.json
│  ├─ README.md
│  ├─ functions.js
│  ├─ functions.mjs
│  └─ data/
└─ square/
   ├─ object.json
   ├─ README.md
   ├─ functions.js
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
