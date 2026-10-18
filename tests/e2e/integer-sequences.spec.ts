import { expect, test, type Locator, type Page } from "@playwright/test";

const fibonacciPath = "/numbers/fibonacci/";
const primePath = "/numbers/prime/";
const squarePath = "/numbers/square/";

function operation(page: Page, name: string) {
  return page.getByTestId(`operation-${name}`);
}

function operationResult(panel: Locator) {
  return panel
    .getByTestId("operation-result")
    .or(panel.getByRole("status"))
    .first();
}

async function runOperation(panel: Locator) {
  await panel.getByRole("button", { name: "実行する", exact: true }).click();
}

async function chooseNumericType(panel: Locator, numericType: "Number" | "BigInt") {
  await panel.getByRole("radio", { name: numericType, exact: true }).check();
}

async function chooseOutputFormat(panel: Locator, format: "JSON") {
  const radio = panel.getByRole("radio", { name: format, exact: true });
  if ((await radio.count()) > 0) {
    await radio.check();
    return;
  }

  const select = panel.getByLabel("出力形式", { exact: true });
  await expect(select).toBeVisible();
  await select.selectOption({ label: format });
}

test("トップページからフィボナッチ数ページへ移動できる", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Libra/);
  await expect(
    page.getByRole("heading", { level: 1, name: /知識を/ }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /フィボナッチ数/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/numbers\/fibonacci\/?$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /フィボナッチ数/ }),
  ).toBeVisible();
});

test("数列の詳細ページでデータ・ドキュメント・関数を確認できる", async ({
  page,
}) => {
  await page.goto(fibonacciPath);

  await expect(
    page.getByRole("heading", { level: 2, name: /データ.*ダイジェスト16項/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /ドキュメント.*定義と性質/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /関数.*利用可能な操作/ }),
  ).toBeVisible();
  await expect(
    page.locator('[aria-labelledby="first-terms-heading"] [data-testid="static-sequence-list"] li'),
  ).toHaveCount(16);
  await expect(page.getByRole("link", { name: /標準JSON（256項）/ })).toHaveAttribute(
    "href",
    "/objects/fibonacci/data/standard.json",
  );
});

test("保存済み標準JSONは正確な256項を配信する", async ({ request }) => {
  const response = await request.get("/objects/fibonacci/data/standard.json");
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toMatchObject({
    objectId: "fibonacci",
    format: "standard",
    indexOrigin: 0,
    valueEncoding: "base10-integer-string",
  });
  expect(data.terms).toHaveLength(256);
  expect(data.terms.slice(0, 16)).toEqual([
    "0", "1", "1", "2", "3", "5", "8", "13",
    "21", "34", "55", "89", "144", "233", "377", "610",
  ]);
});

test("対象関数をAPI互換のJavaScriptモジュールとして取得できる", async ({
  request,
}) => {
  const response = await request.get("/objects/fibonacci/functions.mjs");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("text/javascript");
  const moduleSource = await response.text();
  expect(moduleSource).toContain('import "./functions.js"');
  expect(moduleSource).toContain("export const number");
  expect(moduleSource).toContain("export const bigint");
});

test("コピーした実装をコンソール相当の通常スクリプトとして繰り返し実行できる", async ({ context, page }) => {
  const baseURL = test.info().project.use.baseURL as string;
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(baseURL).origin,
  });
  const sources: string[] = [];
  for (const id of ["fibonacci", "prime", "square"]) {
    await page.goto(`/numbers/${id}/`);
    const implementation = page.getByTestId("standalone-module");
    await implementation.locator("summary").click();
    await implementation.getByRole("button", { name: "コードをコピー", exact: true }).click();
    const response = await page.request.get(`/objects/${id}/functions.js`);
    expect(response.ok()).toBeTruthy();
    const source = await response.text();
    expect(source).not.toMatch(/\bimport\b|\bexport\b|\brequire\b/);
    sources.push(source);
    await expect.poll(
      () => page.evaluate(() => navigator.clipboard.readText()),
    ).toBe(source);
    const values = await page.evaluate(async (objectId) =>
      (0, eval)(`${await navigator.clipboard.readText()}\nlibra.number.${objectId}.take(16).map(String);`),
    id);
    const digest = await page.request.get(`/objects/${id}/data/digest.json`);
    expect(values).toEqual((await digest.json()).terms);
  }
  const results = await page.evaluate((scripts) => {
    for (let round = 0; round < 2; round += 1) {
      for (const source of scripts) (0, eval)(source);
    }
    return (0, eval)("[libra.number.fibonacci.term(10), libra.number.prime.has(97), libra.bigint.square.term(10).toString()]");
  }, sources);
  expect(results).toEqual([55, true, "100"]);
});

test("配信されたES moduleアダプターからも同じ関数を呼び出せる", async ({ page }) => {
  await page.goto(fibonacciPath);
  const results = await page.evaluate(async () => {
    const load = (id: string) => import(/* @vite-ignore */ `/objects/${id}/functions.mjs`);
    const fibonacci = await load("fibonacci");
    const prime = await load("prime");
    const square = await load("square");
    return [
      fibonacci.number.fibonacci.term(10),
      prime.number.prime.has(97),
      square.bigint.square.term(10).toString(),
    ];
  });
  expect(results).toEqual([55, true, "100"]);
});

test("Markdownの本文・GFM表・MathML・コード例を表示できる", async ({ page }) => {
  await page.goto(fibonacciPath);
  const document = page.locator(".object-document");
  await expect(document).toContainText("0と1から始まり");
  await expect(document.getByRole("table")).toContainText("数値型");
  await expect(document.locator("math")).toBeVisible();
  await expect(document.locator("pre").first()).toContainText("range(79)");
  await expect(document.getByRole("heading", { name: "平方数でもあるフィボナッチ数を探す" })).toBeVisible();
});

test("Markdownのコード例をコピーできる", async ({ context, page }) => {
  const baseURL = test.info().project.use.baseURL as string;
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(baseURL).origin,
  });
  await page.goto(fibonacciPath);
  const example = page.locator(".object-document copy-code").first();
  const expectedCode = await example.locator("code").textContent();
  await example.getByRole("button", { name: "コードをコピー", exact: true }).click();
  await expect.poll(
    () => page.evaluate(() => navigator.clipboard.readText()),
  ).toBe(expectedCode);
});

test("フィボナッチ数の第10項は55になる", async ({ page }) => {
  await page.goto(fibonacciPath);
  const panel = operation(page, "term");

  await chooseNumericType(panel, "Number");
  await panel.getByLabel(/添字\s*n/i).fill("10");
  await runOperation(panel);

  await expect(operationResult(panel)).toContainText(/\b55\b/);
});

test("フィボナッチ数の第100項をBigIntで計算できる", async ({ page }) => {
  await page.goto(fibonacciPath);
  const panel = operation(page, "term");

  await chooseNumericType(panel, "BigInt");
  await panel.getByLabel(/添字\s*n/i).fill("100");
  await runOperation(panel);

  await expect(operationResult(panel)).toContainText(
    "354224848179261915075n",
  );
});

test("Number版で安全整数範囲外になる場合はBigInt版を案内する", async ({
  page,
}) => {
  await page.goto(fibonacciPath);
  const panel = operation(page, "term");

  await chooseNumericType(panel, "Number");
  await panel.getByLabel(/添字\s*n/i).fill("79");
  await runOperation(panel);

  const result = operationResult(panel);
  await expect(result).toContainText(/Number/);
  await expect(result).toContainText(/正確/);
  await expect(result).toContainText(/BigInt/);
  await expect(result).toContainText(/選択|再実行/);
});

test("97は素数と判定される", async ({ page }) => {
  await page.goto(primePath);
  const panel = operation(page, "has");

  await chooseNumericType(panel, "Number");
  await panel.getByLabel(/判定する値|入力値|値/).fill("97");
  await runOperation(panel);

  await expect(operationResult(panel)).toContainText(/97\s*は素数です/);
});

test("100より大きい次の素数は101になる", async ({ page }) => {
  await page.goto(primePath);
  const panel = operation(page, "next");

  await chooseNumericType(panel, "Number");
  await panel.getByLabel(/基準値|入力値|値/).fill("100");
  await runOperation(panel);

  await expect(operationResult(panel)).toContainText(/101/);
});

test("100以下の平方数がすべて表示される", async ({ page }) => {
  await page.goto(squarePath);
  const panel = operation(page, "upTo");

  await chooseNumericType(panel, "Number");
  await panel.getByLabel(/上限/).fill("100");
  await runOperation(panel);

  await expect(operationResult(panel)).toContainText(
    /0[\s,、]+1[\s,、]+4[\s,、]+9[\s,、]+16[\s,、]+25[\s,、]+36[\s,、]+49[\s,、]+64[\s,、]+81[\s,、]+100/,
  );
});

test("BigIntのJSON結果をクリップボードへコピーできる", async ({
  context,
  page,
}) => {
  const baseURL = test.info().project.use.baseURL as string;
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(baseURL).origin,
  });
  await page.goto(fibonacciPath);
  const panel = operation(page, "take");

  await chooseNumericType(panel, "BigInt");
  await panel.getByLabel(/項数/).fill("5");
  await chooseOutputFormat(panel, "JSON");
  await runOperation(panel);
  await panel.getByRole("button", { name: "JSONをコピー", exact: true }).click();

  await expect
    .poll(async () => {
      const copiedText = await page.evaluate(() => navigator.clipboard.readText());
      try {
        return JSON.parse(copiedText);
      } catch {
        return null;
      }
    })
    .toEqual(["0", "1", "1", "2", "3"]);
});

test("JavaScript無効時にも静的一覧と説明を読める", async ({ browser }) => {
  const baseURL = test.info().project.use.baseURL as string;
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();

  try {
    await page.goto(fibonacciPath);

    await expect(
      page.getByRole("heading", { level: 1, name: /フィボナッチ数/ }),
    ).toBeVisible();
    await expect(
      page.locator("main p").filter({ hasText: /フィボナッチ数/ }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("static-sequence-list").first()).toContainText(
      /0[\s,、]+1[\s,、]+1[\s,、]+2[\s,、]+3[\s,、]+5/,
    );
  } finally {
    await context.close();
  }
});

test("存在しない数列ページは404になる", async ({ page }) => {
  const response = await page.goto("/numbers/not-published/");

  expect(response?.status()).toBe(404);
});
