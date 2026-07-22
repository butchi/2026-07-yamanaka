# Integer Sequence Web Viewer

フィボナッチ数・素数・平方数などの定義と一覧を読み、ブラウザ上で生成・判定し、JavaScript・JSON・CSVとして持ち出せる静的Webサイトです。数学的な一覧を探す一般利用者と、数列データをJavaScriptから使いたい開発者の両方を対象にしています。

## 公開ページ

- `/` — サイト概要、主要概念、合成コード例
- `/numbers/` — 公開済み概念と実ライブラリ由来の操作一覧
- `/numbers/fibonacci/` — フィボナッチ数
- `/numbers/prime/` — 素数
- `/numbers/square/` — 平方数
- `/about/` — サイトとライブラリの責務分担
- `/license/` — MIT License

詳細ページは `src/pages/numbers/[slug].astro` の共通テンプレートから静的生成されます。説明、最初の20項、コード例はJavaScriptなしでも読めます。操作パネルだけがブラウザで動きます。

## 整数列ライブラリとの関係

サイトは公開パッケージ [`@butchi/integer-sequences`](https://www.npmjs.com/package/@butchi/integer-sequences) に一方向で依存します。

```text
@butchi/integer-sequences  ←  Webサイト
       計算・メタ情報          表示・操作・SEO
```

ライブラリは概念ID、名称、OEIS、添字、順序性、利用可能な操作、実装ID、アルゴリズムID、計算を担当します。サイトは検索者向け本文、SEO、表示順、UI上限、コピー・保存機能を担当します。操作可否やアルゴリズム名をサイト側で重複管理しません。

## 開発環境

必要なもの:

- Node.js 22.12以降
- pnpm 11

セットアップと開発サーバー:

```sh
pnpm install
pnpm dev
```

既定の開発URLは `http://localhost:4321` です。

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

`dist/` に静的HTML、サイトマップ、クライアント操作用の最小JavaScriptが生成されます。

## ディレクトリ

```text
src/
├─ components/           Astroコンポーネントと操作パネル
├─ content/concepts/     サイト固有の説明・SEO・合成例
├─ layouts/              共通SEO・ヘッダー・フッター
├─ lib/                  レジストリ、入力解析、出力整形、操作サービス
├─ pages/                静的ページと動的詳細テンプレート
└─ styles/               共通CSS
tests/e2e/               Playwrightシナリオ
```

操作は次の単純な依存方向に分離しています。

```text
ConceptCalculator.astro
        ↓
executeOperation.ts
        ↓
@butchi/integer-sequences
```

## 新しい数の概念を公開する

1. `@butchi/integer-sequences` に概念と必要なNumber／BigInt操作、メタ情報を実装し、サイトの依存バージョンを更新します。
2. `src/content/concepts/` にSEO、定義、注記、合成例、関連概念を追加します。
3. `src/content/concepts/index.ts` からコンテンツを公開します。
4. `src/lib/conceptRegistry.ts` の `publishedConcepts` とライブラリ接続へIDを追加します。
5. 静的20項、操作可否、コード例、Number／BigInt境界のテストを追加します。
6. `pnpm test`、`pnpm build`、`pnpm test:e2e` を実行します。

ライブラリに登録しただけではページは公開されません。本文が完成した概念だけを `publishedConcepts` に明示するため、未完成の薄いページが自動生成されない構造です。

## NumberとBigIntの表示方針

- NumberとBigIntは操作ごとに利用者が明示選択します。自動切替はしません。
- Numberの入力と結果は安全整数か検証し、正確に表現できない場合はBigInt版を案内します。
- BigIntは画面表示とJavaScript出力で `354224848179261915075n` のように末尾へ `n` を付けます。
- `term(index)` の添字と `take(count)` の件数は、BigInt版でも0以上の安全なNumberです。
- 小数、指数表記、空文字などは整数入力として受け付けません。

## BigIntのJSONとCSV

JSONはBigIntを直接表現できないため、10進文字列へ変換します。

```json
["0", "1", "1", "2", "3"]
```

画面には文字列化の理由も表示します。CSVは末尾の `n` を付けず、10進数をカンマ区切りで出力します。

## UI上限

ブラウザ停止を避けるための実用上限は `src/lib/uiLimits.ts` に集約しています。

- 画面表示: 1,000項
- JavaScript／JSON／CSV出力: 10,000項
- 1項の画面表示: 100,000桁
- Number素数の `upTo`: 100,000
- BigInt素数の判定入力: 12桁（現在の厳密な試し割り実装に合わせた実用制限）

これらはサイトUI上の制限であり、整数列ライブラリの数学的な上限ではありません。変更時は操作サービスと上限テストを同時に更新してください。

## ブログとの役割分担

ブログは背景知識、読み物、詳しい説明、検索流入を担います。このサイトは実行、生成、コピー、JSON、CSV、実装情報を担います。既存記事の本文を大量に複製したり、既存URLを移転したりしません。

## 初期版に含めないもの

ユーザー登録、認証、データベース、サーバーAPI、任意JavaScript実行、広告、コメント、ランキング、OEIS自動取得、複合概念ページの大量生成、Web Worker、WebAssembly、グラフ、多言語化、ブログ移転は初期版の対象外です。表示データと計算ロジックは、将来追加できるよう分離しています。

## License

[MIT License](./LICENSE)
