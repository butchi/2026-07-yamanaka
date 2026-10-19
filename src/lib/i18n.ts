export const locales = ["en", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function localeFromPath(path: string): Locale {
  return path === "/ja" || path.startsWith("/ja/") ? "ja" : "en";
}

export function localizedPath(path: string, locale: Locale): string {
  const neutral = path.replace(/^\/ja(?=\/|$)/, "") || "/";
  return locale === "ja" ? `/ja${neutral}` : neutral;
}

export function text(locale: Locale, en: string, ja: string): string {
  return locale === "ja" ? ja : en;
}

export function operationLabels(locale: Locale) {
  return locale === "ja"
    ? { term: "第n項", take: "最初のn項", upTo: "指定値以下", has: "所属判定", next: "次の該当数" }
    : { term: "nth term", take: "First n terms", upTo: "Up to a limit", has: "Membership", next: "Next value" };
}
