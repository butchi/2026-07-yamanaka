import { readFileSync, readdirSync, existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

const base = "/2026-07-yamanaka";
const site = `https://butchi.github.io${base}`;
const fibonacciId = "01a15005-fe79-7ac4-bfaf-8b8e82577063";

test("all generated HTML URLs preserve the project base and resolve to static files", () => {
  const htmlFiles = readdirSync("dist", { recursive: true, encoding: "utf8" }).filter((path) => path.endsWith(".html"));
  expect(htmlFiles.length).toBeGreaterThan(20);
  for (const file of htmlFiles) {
    const html = readFileSync(`dist/${file}`, "utf8");
    for (const match of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
      const url = new URL(match[1], site);
      expect(url.pathname, `${file}: ${match[1]}`).toMatch(/^\/2026-07-yamanaka\//);
      const relative = decodeURIComponent(url.pathname.slice(base.length));
      expect(
        existsSync(`dist${relative}`) || existsSync(`dist${relative.replace(/\/$/, "")}/index.html`),
        `${file}: missing ${relative}`,
      ).toBe(true);
    }
  }
});

test("navigation, language switching, canonical URLs and the calculator work below the base", async ({ page }) => {
  await page.goto(`${base}/`);
  await page.getByRole("link", { name: "日本語", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.getByRole("link", { name: /フィボナッチ数/ }).first().click();
  await expect(page).toHaveURL(`${base}/ja/numbers/fibonacci/`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${site}/ja/numbers/fibonacci/`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${site}/og-libra.png`);
  const panel = page.getByTestId("operation-term");
  await panel.getByRole("button", { name: "実行する", exact: true }).click();
  await expect(panel.getByTestId("operation-result").or(panel.getByRole("status")).first()).toBeVisible();
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(`${base}/numbers/fibonacci/`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("JSON, modules, redirects, sitemap and robots remain usable without a worker", async ({ page, request }) => {
  const dataset = await request.get(`${base}/objects/${fibonacciId}/data/standard.json`);
  expect(dataset.ok()).toBe(true);
  expect((await dataset.json()).terms).toHaveLength(256);
  const module = await request.get(`${base}/objects/${fibonacciId}/functions.mjs`);
  expect(module.ok()).toBe(true);
  expect(await module.text()).toContain("export");
  const redirect = readFileSync(`dist/id/${fibonacciId}/index.html`, "utf8");
  expect(redirect).toContain(`content="0;url=${base}/numbers/fibonacci/"`);
  expect(redirect).toContain(`href="${site}/numbers/fibonacci/"`);
  await page.goto(`${base}/id/${fibonacciId}/`);
  await expect(page).toHaveURL(`${base}/numbers/fibonacci/`);
  const sitemap = await request.get(`${base}/sitemap-0.xml`);
  const xml = await sitemap.text();
  expect(xml).toContain(`${site}/ja/numbers/fibonacci/`);
  expect(xml).not.toContain(`${site}/id/`);
  const robots = await request.get(`${base}/robots.txt`);
  expect(await robots.text()).toContain(`Sitemap: ${site}/sitemap-index.xml`);
});
