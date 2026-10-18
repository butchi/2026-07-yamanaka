import { expect, test } from "@playwright/test";

const repositoryUrl = "https://github.com/butchi/2026-07-yamanaka";
const compareUrl = `${repositoryUrl}/compare/develop...develop?expand=1`;

test("共通ナビゲーションからdevelop向けの投稿手順に進める", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "主要ナビゲーション", exact: true })
    .getByRole("link", { name: "編集・PRを送る", exact: true }).click();

  await expect(page).toHaveURL(/\/about\/#contribution-heading$/);
  const contribution = page.locator('[aria-labelledby="contribution-heading"]');
  await expect(contribution).toContainText("develop ブランチ");
  await expect(contribution).toContainText("compare across forks");
  await expect(contribution.getByRole("link", { name: "PRを作成する（GitHub）", exact: true }))
    .toHaveAttribute("href", compareUrl);
  await expect(contribution.getByRole("link", { name: "投稿先のdevelopブランチを見る", exact: true }))
    .toHaveAttribute("href", `${repositoryUrl}/tree/develop`);
  await expect(page.getByRole("navigation", { name: "フッターナビゲーション", exact: true })
    .getByRole("link", { name: "編集・PRを送る", exact: true }))
    .toHaveAttribute("href", "/about/#contribution-heading");
});

for (const id of ["fibonacci", "prime", "square"]) {
  test(`${id}の編集リンクがdevelop上の対象ファイルを指す（JavaScriptなし）`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`/numbers/${id}/`);
    const navigation = page.getByRole("navigation", { name: "この項目をGitHubで編集", exact: true });
    const links = [
      ["項目のREADMEを編集", `${repositoryUrl}/edit/develop/objects/${id}/README.md`],
      ["実装を編集", `${repositoryUrl}/edit/develop/objects/${id}/functions.js`],
      ["データを編集", `${repositoryUrl}/tree/develop/objects/${id}/data`],
      ["項目のソース", `${repositoryUrl}/tree/develop/objects/${id}`],
      ["PRを作成する（GitHub）", compareUrl],
      ["投稿手順", "/about/#contribution-heading"],
    ];
    for (const [name, href] of links) {
      const link = navigation.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
    await context.close();
  });
}
