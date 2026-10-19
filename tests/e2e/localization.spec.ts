import { expect, test } from "@playwright/test";
import { integerSequenceIdentities as objectIdentities } from "../../src/lib/objectIdentity";

for (const locale of ["en", "ja"] as const) {
  const prefix = locale === "ja" ? "/ja" : "";
  const japanese = locale === "ja";

  test(`${locale}: navigation, language switch and SEO stay consistent`, async ({ page }) => {
    for (const path of ["/", "/about/", "/license/", "/numbers/", "/numbers/fibonacci/", "/numbers/prime/", "/numbers/square/"]) {
      await page.goto(`${prefix}${path}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", japanese ? "ja_JP" : "en_US");
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(japanese ? "/og-libra.png$" : "/og-libra-en.png$"));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${prefix}${path}$`));
      for (const other of ["en", "ja"]) {
        const target = `${other === "ja" ? "/ja" : ""}${path}`;
        await expect(page.locator(`link[hreflang="${other}"]`)).toHaveAttribute("href", new RegExp(`${target}$`));
      }
      const language = page.getByRole("navigation", { name: japanese ? "言語" : "Language", exact: true });
      const switcher = language.getByRole("link", { name: japanese ? "English" : "日本語", exact: true });
      await expect(switcher).toHaveAttribute("href", `${japanese ? "" : "/ja"}${path}`);
      const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
      expect(schema["@graph"][0].inLanguage).toBe(locale);
      await expect(page.locator("h1")).toHaveCount(1);
    }
    await page.goto(`${prefix}/numbers/fibonacci/`);
    await page.getByRole("navigation", { name: japanese ? "言語" : "Language", exact: true })
      .getByRole("link", { name: japanese ? "English" : "日本語", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", japanese ? "en" : "ja");
    await expect(page.locator(".object-document")).toContainText(japanese ? "preceding two terms" : "直前の2項");
  });

  test(`${locale}: calculator messages, errors and exports use the page language`, async ({ page }) => {
    await page.goto(`${prefix}/numbers/fibonacci/`);
    const term = page.getByTestId("operation-term");
    await term.getByRole("textbox").fill("10");
    await term.getByRole("button", { name: japanese ? "実行する" : "Run", exact: true }).click();
    await expect(term.getByTestId("operation-result")).toContainText(japanese ? "添字10の値は55" : "at index 10: 55");
    await expect(term.locator("[data-result-algorithm]")).toHaveText(japanese ? "高速倍加法" : "Fast doubling method");
    await term.getByRole("textbox").fill("-1");
    await term.getByRole("button", { name: japanese ? "実行する" : "Run", exact: true }).click();
    await expect(term.getByTestId("operation-result")).toContainText(japanese ? "0以上の安全整数" : "nonnegative safe integer");
    await term.getByRole("radio", { name: "BigInt", exact: true }).check();
    await term.getByRole("textbox").fill("100");
    await term.getByRole("button", { name: japanese ? "実行する" : "Run", exact: true }).click();
    await expect(term.getByTestId("operation-result")).toContainText("354224848179261915075n");
    await expect(term.locator("[data-json-note]")).toContainText(japanese ? "10進文字列" : "decimal strings");
  });

  test(`${locale}: documentation and shared asset URLs work without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const { id, slug } of objectIdentities) {
      await page.goto(`${prefix}/numbers/${slug}/`);
      const document = page.locator(".object-document");
      await expect(document.locator("pre").first()).toBeVisible();
      await expect(document).toContainText(japanese ? "注記" : "Notes");
      await expect(page.locator(`a[href="/objects/${id}/data/standard.json"]`)).toBeVisible();
      await expect(page.locator(`a[href="/objects/${id}/functions.mjs"]`).first()).toBeVisible();
      await expect(page.getByText(japanese
        ? "操作パネルを実行するにはJavaScriptを有効にしてください。定義・静的一覧・コード例はJavaScriptなしでも読めます。"
        : "Enable JavaScript to use the calculator. Definitions, static data and examples remain readable without it.", { exact: true })).toBeVisible();
    }
    await context.close();
  });
}

test("sitemap pairs translations while UUID assets remain language-neutral", async ({ request }) => {
  const index = await request.get("/sitemap-0.xml");
  const sitemap = await index.text();
  expect(sitemap).toContain('hreflang="en"');
  expect(sitemap).toContain('hreflang="ja"');
  expect(sitemap).toContain("/ja/numbers/fibonacci/");
  expect(sitemap).toContain("/ja/constants/golden-ratio/");
  expect(sitemap).not.toContain("/ja/objects/");
  const english = await request.get(`/objects/${objectIdentities[0].id}/data/standard.json`);
  expect(english.ok()).toBe(true);
  expect((await english.json()).terms).toHaveLength(256);
  const image = await request.get("/og-libra-en.png");
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/png");
});
