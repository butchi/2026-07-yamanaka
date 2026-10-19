import { expect, test } from "@playwright/test";
import { objectIdentities } from "../../src/lib/objectIdentity";

for (const identity of objectIdentities) {
  test(`${identity.slug}: UUID resources and stable reference use the public slug`, async ({ page, request }) => {
    await page.goto(`/id/${identity.id}/`);
    await page.waitForURL(`**/numbers/${identity.slug}/`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/numbers/${identity.slug}/$`));
    await expect(page.getByRole("link", { name: "Permanent link", exact: true }))
      .toHaveAttribute("href", `/id/${identity.id}/`);
    const response = await request.get(`/objects/${identity.id}/data/digest.json`);
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toMatchObject({ objectId: identity.id });
  });
}

test("unknown permanent references return 404", async ({ request }) => {
  const response = await request.get("/id/00000000-0000-7000-8000-000000000000/");
  expect(response.status()).toBe(404);
});
