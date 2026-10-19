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

サイトは英語をデフォルトとし、日本語版は `/ja/` 配下（例：`/ja/numbers/fibonacci/`）に提供します。ヘッダーの言語リンクで同じページの言語を切り替えられます。従来の日本語URLは英語表示になりましたが、UUID・保存データ・関数のURLは変更していません。

## コンテンツの編集

### 言語方針・翻訳の投稿

サイトのデフォルト言語は英語（`en`）とし、初期の対応言語は英語・日本語（`ja`）の2言語とします。他言語を後から追加できる構造を目指しますが、投稿ごとに任意の言語を追加する運用にはしません。対応言語の追加は、画面文言・本文・SEO・レビュー体制を含めて別途決定します。

**現在の実装：** 英語の本文を `README.md`、任意の日本語訳を同じ項目ディレクトリの `README.ja.md` に保存します。英語SEOは `object.json` の `seo`、日本語SEOは `translations.ja.seo` で管理します。サイトの主要ページ、計算UI・結果・エラー、SEO、言語切り替えは英語・日本語に対応しています。`object:create` は英語の見出し雛形を生成します。本マニュアル自体は日本語で運用します。

#### 英語を基本とする公開ルール

- 新規公開では、英語の本文・項目名・説明・SEOを必須とし、日本語は任意の翻訳とします。日本語だけでの提案も受け付けますが、英語を整えるまではDraftとして扱います。
- 日本語版を公開する場合は、そのページの見出し・本文・項目名・説明・SEOを日本語でそろえます。英語本文の途中に日本語訳を挿入したり、未翻訳の段落を黙って英語に置き換えたりしません。
- 固有名詞、API名、コード、数式、出典の原題などは原表記を維持して構いません。画面上の説明や操作ラベルを翻訳することとは区別します。
- 翻訳の有無で定義、添字、対応操作、数値精度、制約を変えません。英語の内容を更新した場合は日本語訳への影響をPRで明示し、古い仕様の訳を現行仕様として公開しないよう確認します。

#### 言語間で共有するもの・分けるもの

| 言語間で共有するもの | 言語別に管理するもの |
| --- | --- |
| UUID、slugと履歴、`conceptId`、関連項目のUUID参照 | 項目名、概要、本文、見出し、例題の説明 |
| 保存データ、添字、関数実装、API名、計算結果の値 | SEOタイトル・説明、画面文言、計算結果やエラーの説明文 |

翻訳は同じ項目の別言語表現であり、別項目として登録しません。翻訳のために `object:create` を再実行してUUIDを発行したり、レジストリ・データ・関数を言語ごとに複製したりしないでください。

英語だけの項目は `README.md` と通常の `seo` のみで登録できます。日本語版を公開する場合は、同じディレクトリの `README.ja.md` と次の日本語SEOをセットで追加します。片方だけ、または空の本文ではビルドをエラーにします。項目名・概要はライブラリの `meta.name.en` / `meta.name.ja` と `meta.description.en` / `meta.description.ja` から表示するため、計算対象追加時に両言語を整えてください。

```json
{
  "translations": {
    "ja": {
      "seo": {
        "title": "三角数 — データ・関数・解説｜Libra",
        "description": "三角数の定義、性質、例題を紹介します。"
      }
    }
  }
}
```

これは `object.json` に追加する翻訳フィールドの例であり、ファイル全体の置き換えではありません。UUIDや既存フィールドを残してください。日本語本文もフロントマターなし・H1から開始します。投稿PRには言語と対応原稿を明示してください。

#### 未翻訳ページとURL・表示

- 翻訳はページ単位で扱います。日本語版がなければ `/ja/numbers/<slug>/` を生成しません。日本語カタログの項目リンクは「日本語版は未提供・英語版を見る」と明示して英語ページへ案内します。英語詳細の言語欄にも未提供であることを表示し、日本語URLで英語本文を黙って表示しません。未生成URLへの直接アクセスは404です。
- 一部だけ翻訳した原稿はDraftとしてレビューできますが、完成した日本語版としては公開しません。言語切り替えで未提供の翻訳へのリンクを作りません。
- サイトのナビゲーション、計算UI、結果・エラーの説明、アクセシビリティ用ラベルも表示言語に合わせます。本文だけを英訳して英語対応済みとは扱いません。
- HTMLの `lang`、OGの言語、構造化データ、canonical、言語別ページ間の `hreflang` とサイトマップを整合させます。翻訳未提供のページを代替言語として列挙しません。
- 英語は `/`・`/numbers/<slug>/`、日本語は `/ja/`・`/ja/numbers/<slug>/` です。`/id/<UUID>/` は言語共通の永続参照として現在の英語ページへ転送します。旧slugの転送も英語ページを指します。言語別データ・関数URLは作らず、両言語とも `/objects/<UUID>/...` を使います。翻訳の追加だけでslugを変えないでください。
- 言語の判定は「日本語らしい文字がない」といった機械判定だけに頼らず、項目の定義・用語・訳の対応をレビューします。未翻訳ページの案内や言語別メタデータは自動テストの対象とします。

#### 言語に関するPRの確認事項

- 原稿の言語（`en` / `ja`）、英語の新規作成か日本語への翻訳か、対象のUUIDまたは登録前の希望slugを明記する。
- 翻訳では対応する英語原稿とそのコミットを示し、定義・例題・注意点・出典に意味の差がないか確認する。
- 日本語だけの提案や部分訳は未完成の範囲と、英語の作成・翻訳・レビューを誰に依頼したいかを記載する。
- 公開前に、英語の必須内容、公開する日本語版の完成度、言語間で共有するデータ・関数との整合性を確認する。

### GitHubでの編集・プルリクエスト

現在の暫定的な投稿先は [`develop` ブランチ](https://github.com/butchi/2026-07-yamanaka/tree/develop) です。Forkの `develop` から作業ブランチを作成し、変更をコミット・pushしてください。[PR作成画面](https://github.com/butchi/2026-07-yamanaka/compare/develop...develop?expand=1) では、必要に応じて「compare across forks」で自分のForkと作業ブランチを選び、base repositoryが `butchi/2026-07-yamanaka`、baseが `develop` であることを確認して、変更理由・出典・確認した内容を記載します。GitHubアカウントが必要で、直接の書き込み権限がなくてもForkから提案できます。

サイト共通の「編集・PRを送る」から投稿手順へ進めます。各項目の「この項目を編集・提案する」には、その項目の説明・実装のGitHub編集画面、データディレクトリ、ソース、PR作成画面へのリンクがあります。リンク先のリポジトリと投稿先ブランチは [`src/lib/github.ts`](./src/lib/github.ts) に集約しています。

ドキュメントと構造化データは、TypeScriptのオブジェクトリテラルではなく標準的なファイルとして管理します。

- [`objects/`](./objects/) — 対象別のディレクトリ。各対象の `object.json` に項目ID、SEO情報、関連項目、任意のブログ参照を、`README.md` に定義、注記、表、コード例などのGFM本文を記述します。記事中の数式にはLaTeX記法を使います。図などには必要に応じてHTML・SVGを利用できます。
- 各対象の `data/digest.json` は最初の16項、`data/standard.json` は最初の256項を正確な整数データとして保存します。各値はJSONの安全整数制限を避ける10進整数文字列で、添字の原点も明記します。サイトはこれらのスナップショットをそのまま表示・配信し、ビルド時の `take()` で生成しません。
- 各対象の `functions.source.js` が投稿者向けの唯一の実装ソースです。ES moduleとして `number` と `bigint` をエクスポートし、公開ライブラリと共通の関数名・引数・戻り値で実装します。外部パッケージやサイト固有の登録処理は不要です。ビルド時に、デベロッパーツールへ貼り付けられ `globalThis.libra.number.<object>` / `globalThis.libra.bigint.<object>` に登録する `functions.js` と、単体でインポートできる `functions.mjs` を生成します。生成物はリポジトリにコミットしません。グローバル版は複数対象への併用と同じ実装の再貼り付けが可能で、補助関数は外部に公開されません。ライブラリ固有の操作メタデータや例外クラスは含まず、不正入力やNumberの安全整数範囲外の結果は標準の `TypeError` / `RangeError` で通知します。
- [`src/content.config.ts`](./src/content.config.ts) — Astro Content Layerの読み込み先と検証スキーマ。
- [`src/layouts/ObjectLayout.astro`](./src/layouts/ObjectLayout.astro) — MarkdownとJSONを計算・表示機能に接続する共通レイアウト。

各項目の `README.md` は、そのディレクトリにある対象の概要・定義・注意点・利用例を説明するREADMEです。GitHubでもディレクトリを開くと本文を読めます。独立した文書として登録するのではなく、`object.json` やデータ・実装と組になる項目の構成要素として扱い、サイトでも同じ本文を表示します。読み込み先も汎用の文書コレクションではなく `objectReadmes` として区別します。

例えば、フィボナッチ数の英語説明は [`objects/fibonacci/README.md`](./objects/fibonacci/README.md)、日本語説明は [`README.ja.md`](./objects/fibonacci/README.ja.md)、構造化データは [`objects/fibonacci/object.json`](./objects/fibonacci/object.json) を編集し、対象のディレクトリを中心に差分をレビュー・コミットします。本文変更だけならTypeScriptやAstroの編集は不要です。Markdownにはフロントマターを付けず、H1から本文を開始します。SEOなどのメタデータはJSONに集約しています。

公開する項目では、同じディレクトリ内の `object.json` と英語の `README.md` を必ず組にし、日本語訳は `README.ja.md` を追加します。手作業で投稿するDraft PRでは、後述の登録補完まで本文だけでも構いません。ディレクトリ名は人が対象を識別するための目印で、正式な項目IDは `object.json` のUUIDです。データセットは正確に16項・256項であること、十進整数文字列の形式、オブジェクトID、配置先のメタデータとのUUID一致、添字原点、およびダイジェストが標準データの先頭と一致することを検証します。項目本文の読み込み対象は `README.md` と `README.ja.md`、メタデータは `object.json` です。データの公開用検証は `data/digest.json`、`data/standard.json` を対象とするため、対象固有の補助データや補足文書を追加しても別項目として誤認しません。HTML等の埋め込みは信頼できるリポジトリ内コンテンツとして扱うため、投稿時にはマークアップもレビューしてください。GFMと標準マークアップを使い、MDXの実行可能なコンポーネントは用いません。

### 新規項目の作成・登録

UUIDを投稿者やメンテナーが手で生成・記入する必要はありません。どちらが作業する場合も [`object:create`](./scripts/create-object.mjs) コマンドに発行を任せます。Node.js 24と、このリポジトリ指定のpnpmを使用してください。

#### コマンドで作成する場合

`develop` を基にした作業ブランチで、次のコマンドを実行します。依存パッケージを使わない生成処理なので、生成だけなら `pnpm install` は不要です。

```sh
pnpm object:create --slug triangular --name "Triangular numbers" --description "Definitions, properties and examples of triangular numbers."
```

- UUIDv7を一度だけ発行し、`objects/triangular/object.json` と `objects/registry.json` に同じUUIDを保存します。
- `objects/triangular/README.md` がなければ本文の雛形を作ります。既にあれば、本文・改行コード・その他のファイルを変更しません。
- 計算アダプターの `conceptId` はslugと同じ値を初期値とします。異なる場合は `--concept-id triangularNumbers` のように指定します。アダプター自体を実装・登録するコマンドではありません。
- 同じslug・UUIDで登録済みなら `Already registered` と表示し、ファイルを変更しません。再実行してもUUIDやSEO情報を上書きしません。登録後の説明修正はファイルを編集してください。
- 現在・過去のslugの重複、UUIDの重複、メタデータと台帳の不一致、不正な入力はエラーにします。既存項目をコピーしてUUIDを引き継がないでください。
- 新規作成時の保存先はslugと同名です。登録後に保存フォルダを改名した項目の更新・修復には、この作成コマンドではなく通常の編集を使います。

`--name` と `--description` は英語で指定します（言語そのものの機械判定は行いません）。生成したファイルを英語の本文・出典などと一緒にコミットしてDraft PRを送ります。雛形の「Details」には定義・概要を記入し、「Examples」「Scope」「Generalizations and extensions」「Applications」「Properties and relations」「Possible issues」「Interesting examples」は内容があるものだけ残してください。日本語訳の対応する見出しは「詳細」「例題」「スコープ」「一般化と拡張」「アプリケーション」「特性と関係」「考えられる問題」「おもしろい例題」です。空の見出しは公開前に削除します。サイト側で空セクションを自動削除したり、すべてを折りたたんだりはしません。

#### 本文を手作業で作成する場合

1. 英語は `objects/<希望slug>/README.md`、日本語のみの原稿は `README.ja.md` をH1から書き始め、定義と出典を記入します。UUIDや不完全な `object.json` は作りません。日本語のみの原稿を登録補完する場合は、コマンドが作る英語の雛形も完成させ、日本語SEOを追加してから公開します。
2. 希望する項目名・slug・SEO説明文・必要なら計算アダプターIDをPR本文に記載し、Draft PRを送ります。
3. メンテナーが内容とslugを確認し、投稿内容を含む作業ブランチで上記の `pnpm object:create` を実行します。既存本文を保持したままメタデータと台帳を補完し、生成結果をコミットします。
4. ForkのPRブランチへのpush権限がなければ、投稿コミットを引き継いだリポジトリ内の作業ブランチから補完PRを作ります。元のPRをリンクし、コミットの著者情報を保持してください。

生成前にデータファイルを用意する場合も仮UUIDは記入せず、登録補完後に発行されたUUIDを `objectId` に設定してください。

#### メンテナーがGitHub Actionsから作成・補完する場合

[`Create object draft`](./.github/workflows/create-object.yml) は `workflow_dispatch` の手動実行専用です。同じ生成スクリプトを使い、`develop` へ直接書き込まずDraft PRを作ります。

1. Actionsで **Create object draft → Run workflow** を開きます。通常はワークフローの実行ブランチに `develop` を選びます。
2. `slug`、英語表示名 `name`、英語SEO説明文 `description`、必要なら `concept_id` を入力します。日本語訳は生成後に本文とSEOを追加します。
3. 新規の雛形作成なら `source_branch` は `develop` のままにします。手作業の本文を補完する場合は、レビュー済みの投稿コミットを含む、このリポジトリ内のブランチを指定します。Forkのブランチを直接指定する機能はありません。
4. ワークフローは `develop` 上の信頼できる生成コードで、指定ブランチのデータを処理します。指定ブランチのスクリプト、依存関係、ビルドは実行しません。
5. `objects/create-<slug>` ブランチへ生成結果をコミット・pushし、baseが `develop` のDraft PRを作ります。元の投稿PRがある場合は相互リンクし、補完PRに内容・著者情報が引き継がれていることを確認して整理します。

このワークフローと生成コードを先に `develop` へ反映し、手動実行を表示するためワークフローをGitHubのデフォルトブランチにも配置してください。リポジトリの **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests** の許可が必要です。組織ポリシー等で許可できない場合はローカルのコマンドを使います。

同じslugの実行は直列化され、`objects/create-<slug>` がリモートに既にある場合はエラーで停止します。新しいUUIDを発行するために再実行せず、既存ブランチで作業を続けてください。push後にPR作成だけ失敗した場合も、そのブランチから手動でDraft PRを作れます。Actionsの標準トークンによるPR作成では他のPR用ワークフローが起動しないため、自動検証が済んだとは扱わないでください。

#### 公開前の確認

生成コマンドは登録と本文雛形のみを作ります。架空のデータ・動かない実装でビルドを通すことはしません。現状の公開条件は次のとおりです。

- 定義・例題・出典を記入し、空見出しと執筆用コメントを取り除く。
- `data/digest.json`（16項）・`data/standard.json`（256項）を用意し、両方の `objectId` を発行済みUUIDにする。
- `functions.source.js`、ライブラリの計算実装、[`conceptRegistry.ts`](./src/lib/conceptRegistry.ts) のアダプター接続とテストを用意する。
- `pnpm install --frozen-lockfile` 後、`pnpm test`、`pnpm lint:md`、`pnpm build` で確認する。

登録前の本文だけ、またはデータ・計算機能が未完成の雛形は、現在の検証ではビルドに失敗します。公開条件がそろうまでDraft PRとして扱い、マージしません。並行するPRとのUUID・slugの整合性も、最新の `develop` を取り込んで確認してください。

引数なしの `pnpm object:create` または `pnpm object:create --help` で使い方と実行例を表示します（ファイルは作成しません）。対話入力ではなく、`--slug`・`--name`・`--description` の指定が必要です。一部の引数が不足している場合は、不足項目を表示してエラー終了します。別の作業コピーに信頼できるスクリプトから生成する場合は `--root <リポジトリのパス>` を指定できます。同一コピーでの同時実行は `objects/.create-object.lock` により拒否します。プロセスが強制終了してロックが残った場合は、他の生成処理が動いていないこととメタデータ・台帳の整合性を確認してから、そのロックファイルだけを削除してください。

### データ・関数実装の手動追加

当面、データの取り込みや関数実装を生成する専用コマンドは用意しません。`object:create` による登録後、投稿者が次のファイルとテストを手作業で追加します。本文だけの投稿は、メンテナーによる登録・実装補完までDraft PRとして扱います。

#### 保存データ

1. 定義、添字、値の出典を項目の `README.md` に記載します。外部のデータを利用する場合は、利用条件も確認してください。
2. 項目ディレクトリの `data/standard.json` に先頭256項、`data/digest.json` に同じ列の先頭16項を保存します。[平方数のダイジェスト](./objects/square/data/digest.json)を形式の見本にできますが、UUIDや値は流用しません。
3. 両ファイルに、項目の `object.json` の `id` と同じ `objectId`、それぞれの `format`（`standard` / `digest`）、`indexOrigin: 0`、`valueEncoding: "base10-integer-string"` を設定します。現在の公開用検証は添字原点0のみを受け付けます。他の原点が必要な場合は検証・計算APIも含めて別途対応し、無断で添字の意味を変えないでください。
4. `terms` の各値は、丸めのない十進整数文字列として記述します。数値型のJSON、指数表記、先頭の `+`、不要な先頭ゼロは使いません。例：`"0"`、`"-3"`、`"9007199254740993"`。
5. 項の順序と重複を保持し、ダイジェストが標準データの先頭16項と完全一致することを確認します。

データをローカルの計算処理で用意しても構いませんが、保存したJSONをレビュー対象としてコミットします。ビルドやテストで保存データを自動更新しません。データの修正時は、変更理由、根拠、影響する添字の範囲をPRに記載してください。

#### 関数実装とサイトへの接続

1. 同じ項目ディレクトリに `functions.source.js` を作成します。[平方数の実装](./objects/square/functions.source.js)などを参考に、`number` と `bigint` をES moduleとしてエクスポートし、その下の計算対象名・操作名・引数・戻り値を公開ライブラリと合わせます。
2. 独立実装には外部パッケージやサイト固有の登録処理を持ち込まず、実装できる操作だけを公開します。未実装の操作を空配列や固定値で代用しません。生成される `functions.js` と `functions.mjs` は編集・コミットしません。
3. 新しい計算対象は、利用する `@butchi/integer-sequences` のライブラリ実装・公開API・操作メタデータとテストにも追加します。現在は公開パッケージを依存として使っており、[`packages/integer-sequences/`](./packages/integer-sequences/) には実装がありません。ライブラリ側で対応・公開されたバージョンを依存に反映して接続します。数値型ごとの対応操作を明示し、独立実装とのAPIを一致させます。
4. [`conceptRegistry.ts`](./src/lib/conceptRegistry.ts) の `publishedConcepts` と `libraryConcepts` に接続し、項目の `conceptId` と一致させます。新しい操作形式が必要な場合は、計算UIと入力・出力処理も含めて対応してください。
5. Number版の安全整数範囲、BigInt版の引数型、無効入力、境界条件をテストします。独立実装は不正な型を `TypeError`、範囲外を `RangeError` で通知し、丸めや暗黙変換で成功扱いにしません。ライブラリ側は既存の例外規約に従います。

#### 保存データと実装の一致を確認する

「定義・出典に照らして数学的に正しいか」と「コミットされた保存データに実装が一致するか」は別の確認事項です。前者はレビューで根拠を確認し、後者は回帰テストで確認します。実装との一致だけで、保存データ自体の数学的正しさを保証したとは扱いません。

現状のテストは次の範囲を確認しています。新規項目を追加しただけでは、既存の対象リストに自動追加されないため、該当テストも必ず更新してください。

| 現在の検証 | 対象・追加先 |
| --- | --- |
| 保存データとライブラリの256項の一致、16項のダイジェストの一致 | [`objectDatasets.test.ts`](./src/lib/objectDatasets.test.ts) の `sequences`。対象ごとに列挙をサポートする数値型を選ぶ |
| 独立実装とライブラリの操作結果、例外、生成したスクリプト・ES moduleの動作 | [`objectModules.test.ts`](./src/lib/objectModules.test.ts) の対象とケース。数値型ごとの対応操作に合わせて追加する |
| UUID・参照・データの配置や整合性 | [`objectEntries.test.ts`](./src/lib/objectEntries.test.ts) とビルド時の検証 |

今後の共通検証・PR用CIでは、保存データを独立した期待値として、次の比較を行う方針です。現時点で、すべての項目・操作を自動発見して検証する仕組みや、PR時にテストを実行するActionsは未実装です。手動実行の `Create object draft` は登録用であり、投稿内容のテストやビルドは実行しません。

- ライブラリと独立実装を、それぞれ保存データと直接照合する。実装同士が一致するだけで合格にしない。
- 対応する `term(n)`、`take(n)`、`iterate()` を保存範囲内で照合する。データの配列位置と添字の対応を明示する。
- Number版は期待値が安全整数範囲内のケースを完全一致で比較する。BigInt版は整数文字列を直接BigIntに変換し、Numberへの変換を経由しない。安全整数範囲外のNumber結果は、別途例外テストにする。
- 操作が未対応の数値型に無理に列挙を要求しない。例えば現在の素数のBigInt版は `has` と `next` のみで、256項の列挙にはNumber版を使う。
- `has`、`next`、`upTo` は操作の定義と対象の性質に応じて確認する。保存列に見つからない値を、それだけで非所属と判定しない。単調性・重複・保存範囲の端を考慮し、期待値を確定できるケースだけを使う。
- 比較直前に検証対象の実装から期待データを作らない。保存データと実装を同じPRで変更する場合は、両方の変更理由をレビューする。
- 不一致には対象、実装、数値型、操作、添字または引数、期待値、実際の値を出し、修正箇所を追跡できるようにする。
- 初期のCIは全項目を検証する。ForkのPRも扱うため、書き込み権限やシークレットを与えない `pull_request` の実行環境を使い、投稿コードのテストを権限付きの登録処理と分離する。

投稿前は、依存関係を導入したうえで次のコマンドを実行し、PR本文に実行結果と未確認の範囲を記載してください。失敗を避けるために期待値を書き換えたり、対象のテストを外したりしないでください。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint:md
pnpm build
```

表示や操作UIも変更した場合は `pnpm test:e2e` で確認します。データ範囲外の計算、境界条件、オーバーフロー、不正入力は保存データとの比較だけでは検証できないため、個別のテストを併せて追加してください。

### 固定ID・公開slug・ライブラリ名

これらは別の役割として管理します。

| 用途 | 値・管理先 |
| --- | --- |
| 内部の固定ID | UUIDv7。`object.json` の `id`、データの `objectId`、関連項目の `relatedObjectIds` |
| リポジトリの保存先 | `objects/fibonacci/` などの読みやすい名前。UUIDとは独立 |
| 公開URL | `objects/registry.json` の `slug` による `/numbers/<slug>/` |
| 過去の公開URL | 同じレジストリの `previousSlugs`。別の項目へ再利用しない |
| 永続参照URL | `/id/<UUID>/`。現在の公開ページへ転送 |
| 計算APIとの接続 | `object.json` の `conceptId`。例：`fibonacci`。UUIDやslugとは独立 |

[`objects/registry.json`](./objects/registry.json) はUUIDとslug履歴の台帳です。新規項目には `pnpm object:create` で一度だけUUIDv7を発行し、その後は名前やslug、保存フォルダを変更してもUUID・UUID参照を変えません。保存フォルダは通常slugに合わせた読みやすい名前にしますが、公開slugとの一致は必須ではありません。フォルダ名は英小文字・数字・単語間のハイフンで記述します。新規の計算対象にはライブラリと独立実装ソースの追加も必要です。UUIDv7の時刻情報は端末間の厳密な登録順を保証せず、登録日時・公開日時の代わりにはしません。

ビルド時に各フォルダの `object.json` を読み込み、UUIDから保存先を引く索引を作ります。同じフォルダのREADME・データ・実装をまとめて移動すれば、設定に保存先を二重登録する必要はありません。GitHub編集リンクも実際の保存先から生成します。フォルダの改名後もUUIDによる参照・配信URLは維持されますが、GitHub上の旧ファイルURLは保証できません。外部からの引用には独自ドメイン側の `/id/<UUID>/` を使用してください。

項目名を変えてもslugの変更は必須ではありません。slugを変える場合は、変更前のslugを必ず `previousSlugs` に追記し、既存の履歴は削除しません。台帳の現在・過去すべてのslugを横断して重複を検証するため、過去のslugを他の項目へ割り当てるとビルドが失敗します。slugは英小文字・数字・単語間のハイフンで記述し、UUIDv7形式は予約します。台帳と項目ファイルの対応、UUIDの重複、関連先、計算アダプターもビルドで検証します。

ID参照と過去のslugは、転送を連鎖させず常に最新の `/numbers/<slug>/` へ転送します。以前の `/objects/fibonacci/functions.js` などもUUID付きの配信先へ転送します。データの `objectId` はUUIDに変更されていますが、数列の値や公開ライブラリのAPI名は変わりません。

転送は [`src/lib/objectIdentity.ts`](./src/lib/objectIdentity.ts) で共通生成します。開発サーバーではAstroのredirects、本番のSites/Cloudflare WorkerではHTTP 301を使用し、Workerはクエリ文字列も維持します。ビルド時に `_redirects` も生成するため、その形式に対応する静的ホストでもHTTP 301として配信できます。その他の静的ホストではAstroのHTML転送ページがフォールバックになりますが、旧JSON・JavaScript URLをプログラムから使う場合はWorkerまたは `_redirects` 対応の配信が必要です。転送元はサイトマップから除外し、canonicalには現在の公開slugを使います。

### 記事中の数式

数式はMathMLを直接書かず、インライン数式は `` $`n^2`$ ``、独立した数式は次のように `$$` で囲んだLaTeXで記述します。インライン数式は、Markdownとの解釈の衝突を避けるため、[GitHub公式のバッククォート併用記法](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions#writing-inline-expressions)に統一します。サイトでは通常の `$n^2$` も引き続き描画できます。

```text
$$
F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}\quad (n \ge 2)
$$
```

[`scripts/latex-math.mjs`](./scripts/latex-math.mjs) がビルド時にKaTeXで描画するため、ブラウザーのJavaScriptや外部CDNは不要です。表示用HTMLとアクセシビリティ用MathMLは自動生成されます。不正なLaTeXや非対応のコマンドはビルドエラーとして通知します。コードブロックやインラインコード内の数式記法は変換しません。

### 配置の原則：一緒に編集するものを近くに置く

- 対象固有の概要・データ・実装は `objects/<読みやすいフォルダ名>/` に集めます。必要に応じて `data/` や `implementations/` を追加します。
- 複数の対象で共有する関数はルートの `functions/<function-id>/`、横断的な解説は `documents/<document-id>.md` に独立して配置する方針です。項目固有のREADMEとは区別し、共有資源の導入時にこれらのディレクトリを作成します。
- 関係は包含関係から推測せず、メタデータのUUID参照で表します。現在の関連項目は `relatedObjectIds` で参照しており、公開slugとは独立しています。
- 共有関数を導入する際は、関数IDと適用パラメータ、共有文書は文書IDを項目のメタデータに記録し、参照先の検証と表示先の選択を実装します。共有資源を更新した場合に、参照する対象をCIで検証できる構成を目指します。

現段階では共有関数・共有文書の登録／参照スキーマや依存先に応じたCI実行は未実装です。実在しない関数や実装例は登録せず、計算には引き続き公開ライブラリを使います。

新しい種類の計算を追加する場合は、別途ライブラリの実装と `src/lib/conceptRegistry.ts` の接続が必要です。データスナップショットはAPIの実行結果からビルドごとに生成せず、対象ディレクトリに保存したレビュー可能なJSONを正とします。Expression JSONやMathJSONの専用評価器は現時点では実装していません。

保存データは `/objects/01a15005-fe79-7ac4-bfaf-8b8e82577063/data/digest.json`、`/objects/01a15005-fe79-7ac4-bfaf-8b8e82577063/data/standard.json` として、ビルドで生成するJavaScript実装とES moduleは `/objects/01a15005-fe79-7ac4-bfaf-8b8e82577063/functions.js`、`/objects/01a15005-fe79-7ac4-bfaf-8b8e82577063/functions.mjs` としてサイトからも取得できます。

### コピーした実装の使い方

詳細ページの「依存なしの実装を表示・コピー」から実装全体をコピーし、ブラウザーのデベロッパーツールのコンソールに貼り付けて実行します。続けて次のコードを実行できます。ファイル保存やモジュール設定は不要です。

```js
libra.number.fibonacci.take(16);
libra.bigint.fibonacci.term(100); // 354224848179261915075n
```

ES moduleとして利用する場合は、自己完結した `functions.mjs` だけを保存して利用できます。関数は名前付きエクスポートとして提供され、`globalThis.libra` は変更しません。

```js
import { number, bigint } from "./functions.mjs";
number.fibonacci.take(16);
bigint.fibonacci.term(100);
```

既存ライブラリを使う場合はimport元を `@butchi/integer-sequences` に変更できます。独立実装ではフィボナッチ数の高速倍加法、平方数の整数演算、素数の試し割りを使用します。特に大きな素数の判定・探索は時間がかかるため、大規模な計算に最適化された実装ではありません。BigInt版の素数はライブラリ同様に `has` と `next` のみを提供します。単体テストでライブラリとの計算結果の一致と入力境界を検証します。

## データ・関数と整数列ライブラリ

ブラウザーの計算UIと操作メタデータには引き続き [`@butchi/integer-sequences`](https://www.npmjs.com/package/@butchi/integer-sequences) を使います。コピーして再利用するための独立実装は各対象の `functions.source.js` で管理し、ライブラリの実装情報とは区別します。投稿者はこのES moduleソースだけを編集し、配信用ファイルへの変換はビルドが行います。

```text
@butchi/integer-sequences  →  Libra
       計算・操作仕様          データ表示・ドキュメント・UI
```

NumberとBigIntの明示的な選択、入力境界の検証、JSON・CSV・JavaScript形式の出力など、現行ビューアの再利用機能を引き継いでいます。具体的な表示上限は `src/lib/uiLimits.ts` に定義されています。

```text
objects/fibonacci/
├─ object.json
├─ README.md
├─ functions.source.js
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
├─ registry.json         UUID・公開slug・過去のslugの台帳
├─ fibonacci/            フィボナッチ数
│  ├─ object.json         項目ID・SEO・関連項目
│  ├─ README.md           英語の概要・定義・利用例（GFM・LaTeX数式）
│  ├─ README.ja.md        任意の日本語訳（日本語SEOとセット）
│  ├─ functions.source.js 投稿者が編集する実装ソース
│  └─ data/
│     ├─ digest.json      最初の16項（正確な整数文字列）
│     └─ standard.json    最初の256項（正確な整数文字列）
├─ prime/                素数
│  ├─ object.json
│  ├─ README.md
│  ├─ functions.source.js
│  └─ data/
└─ square/               平方数
   ├─ object.json
   ├─ README.md
   ├─ functions.source.js
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
