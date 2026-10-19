import { expect, test } from "@playwright/test";
import { mathematicalConstantIdentities } from "../../src/lib/objectIdentity";

const goldenRatioId = mathematicalConstantIdentities[0].id;

test("catalog links to golden ratio constant data", async ({ page }) => {
  await page.goto("/ja/numbers/");

  await expect(page.getByRole("heading", { level: 1, name: "数学オブジェクトカタログ" })).toBeVisible();
  await page.getByRole("link", { name: /黄金比/ }).first().click();
  await expect(page).toHaveURL(/\/ja\/constants\/golden-ratio\/?$/);
  await expect(page.locator(".concept-header").getByRole("heading", { level: 1, name: "黄金比" })).toBeVisible();
});

test("golden ratio page distinguishes its exact value from a finite approximation", async ({ page }) => {
  await page.goto("/ja/constants/golden-ratio/");

  await expect(page.locator(".concept-header").getByRole("heading", { level: 1, name: "黄金比" })).toBeVisible();
  await expect(page.getByText("φ = (1 + √5) / 2")).toBeVisible();
  await expect(page.getByText(/小数点以下50桁で打ち切った近似値/)).toBeVisible();
  await expect(page.getByRole("link", { name: "値データ（JSON）" })).toHaveAttribute(
    "href",
    `/objects/${goldenRatioId}/data/value.json`,
  );
});

test("golden ratio JSON exposes exact symbolic data and labeled approximation", async ({ request }) => {
  const response = await request.get(`/objects/${goldenRatioId}/data/value.json`);

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({
    objectId: goldenRatioId,
    format: "decimal-constant",
    valueType: "irrational",
    symbol: "φ",
    exactValue: "(1 + √5) / 2",
    decimalApproximation: "1.61803398874989484820458683436563811772030917980576",
    approximationMethod: "truncated",
    decimalPlaces: 50,
  });
});
