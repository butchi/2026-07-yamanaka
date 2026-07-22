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

  await page
    .getByRole("link", { name: /フィボナッチ数/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/numbers\/fibonacci\/?$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /フィボナッチ数/ }),
  ).toBeVisible();
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
    await expect(page.getByTestId("static-sequence-list")).toContainText(
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
