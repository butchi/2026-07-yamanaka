import { describe, expect, it, vi, afterEach } from "vitest";
import { sitePath, stripBasePath } from "./sitePath";
import { localeFromPath, localizedPath } from "./i18n";

afterEach(() => vi.unstubAllEnvs());

describe("deployment base paths", () => {
  it("keeps root-hosted paths unchanged", () => {
    expect(sitePath("/numbers/", "/")).toBe("/numbers/");
    expect(stripBasePath("/ja/numbers/", "/")).toBe("/ja/numbers/");
  });

  it("prefixes local URLs once and preserves query strings and fragments", () => {
    const base = "/2026-07-yamanaka/";
    expect(sitePath("/", base)).toBe(base);
    expect(sitePath("/numbers/?n=1#data", base)).toBe(`${base}numbers/?n=1#data`);
    expect(sitePath(`${base}numbers/`, base)).toBe(`${base}numbers/`);
    expect(sitePath("/2026-07-yamanaka-other/", base)).toBe(`${base}2026-07-yamanaka-other/`);
    expect(sitePath("https://example.org/", base)).toBe("https://example.org/");
    expect(sitePath("//example.org/", base)).toBe("//example.org/");
    expect(sitePath("#data", base)).toBe("#data");
  });

  it("detects and switches languages below the repository base", () => {
    vi.stubEnv("BASE_URL", "/2026-07-yamanaka/");
    expect(localeFromPath("/2026-07-yamanaka/ja/numbers/")).toBe("ja");
    expect(localeFromPath("/2026-07-yamanaka/january/")).toBe("en");
    expect(localizedPath("/2026-07-yamanaka/ja/numbers/", "en")).toBe("/2026-07-yamanaka/numbers/");
    expect(localizedPath("/numbers/", "ja")).toBe("/2026-07-yamanaka/ja/numbers/");
  });
});
