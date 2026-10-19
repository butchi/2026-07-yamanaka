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
  const math = page.locator(".exact-value-math math");
  await expect(math).toHaveAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
  await expect(math.locator("mfrac")).toHaveCount(1);
  await expect(math.locator("msqrt mn")).toHaveText("5");
  await expect(math.locator("mrow > mi")).toHaveText("Φ");
  await expect(page.getByText(/ダイジェスト近似値（小数点以下16桁）/)).toBeVisible();
  await expect(page.getByText(/標準近似値（小数点以下256桁）/)).toBeVisible();
  await expect(page.getByRole("link", { name: "厳密値JSON" })).toHaveAttribute(
    "href",
    `/objects/${goldenRatioId}/data/value.json`,
  );
});

test("golden ratio JSON exposes exact symbolic data and labeled approximation", async ({ request }) => {
  const response = await request.get(`/objects/${goldenRatioId}/data/value.json`);

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({
    objectId: goldenRatioId,
    format: "exact-constant",
    valueType: "irrational",
    symbol: "Φ",
    exactValue: "(1 + √5) / 2",
    exactValueContentMathML: '<math xmlns="http://www.w3.org/1998/Math/MathML"><apply><eq/><ci>Φ</ci><apply><divide/><apply><plus/><cn>1</cn><apply><root/><cn>5</cn></apply></apply><cn>2</cn></apply></apply></math>',
    exactValuePresentationMathML: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>Φ</mi><mo>=</mo><mfrac><mrow><mn>1</mn><mo>+</mo><msqrt><mn>5</mn></msqrt></mrow><mn>2</mn></mfrac></mrow></math>',
  });
});

test("golden ratio digest is a 16-place JSON number and standard preserves 256-place decimal text", async ({ request }) => {
  const digestResponse = await request.get(`/objects/${goldenRatioId}/data/digest.json`);
  const standardResponse = await request.get(`/objects/${goldenRatioId}/data/standard.json`);

  expect(digestResponse.ok()).toBeTruthy();
  expect(standardResponse.ok()).toBeTruthy();
  const digestText = await digestResponse.text();
  expect(digestText).toContain('"value": 1.6180339887498948');
  const digest = JSON.parse(digestText);
  const standard = await standardResponse.json();
  expect(digest).toMatchObject({
    objectId: goldenRatioId,
    format: "digest",
    valueType: "irrational",
    value: 1.6180339887498948,
    approximationMethod: "truncated",
    decimalPlaces: 16,
  });
  expect(typeof digest.value).toBe("number");
  expect(standard).toMatchObject({
    objectId: goldenRatioId,
    format: "standard",
    valueType: "irrational",
    valueEncoding: "decimal-string",
    approximationMethod: "truncated",
    decimalPlaces: 256,
  });
  expect(typeof standard.value).toBe("string");
  expect(standard.value).toMatch(/^1\.\d{256}$/);
  expect(standard.value.startsWith("1.61803398874989484820458683436563811772030917980576")).toBe(true);
});
