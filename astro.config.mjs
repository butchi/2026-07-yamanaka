import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import objectReadmeHeadings from "./scripts/object-readme-headings.mjs";
import latexMath from "./scripts/latex-math.mjs";
import { objectRedirects, objectPagePath } from "./src/lib/objectIdentity";
import { writeFile } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { objectIdentities } from "./src/lib/objectIdentity";

const translatedIds = new Set(readdirSync(new URL("./objects/", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(new URL(`./objects/${entry.name}/object.json`, import.meta.url)))
  .map((entry) => JSON.parse(readFileSync(new URL(`./objects/${entry.name}/object.json`, import.meta.url), "utf8")))
  .filter((entry) => entry.translations?.ja)
  .map((entry) => entry.id));
const translatedPaths = new Set([
  "/", "/about/", "/license/", "/numbers/",
  ...objectIdentities.filter(({ id }) => translatedIds.has(id)).map(objectPagePath),
]);
const base = process.env.BASE_PATH || "/";
const basePrefix = base.replace(/\/+$/, "");
const withoutBase = (path) => basePrefix && (path === basePrefix || path.startsWith(`${basePrefix}/`))
  ? path.slice(basePrefix.length) || "/" : path;
const withBase = (path) => `${basePrefix}${path}`;

export default defineConfig({
  site: process.env.SITE_URL || "https://integer-sequence-viewer.butchi-y.chatgpt.site",
  base,
  output: "static",
  redirects: Object.fromEntries(
    Object.entries(objectRedirects).filter(([source]) => !Object.hasOwn(objectRedirects, `${source}/`)).map(([source, destination]) => [
      source, { status: 301, destination: withBase(destination) },
    ]),
  ),
  integrations: [
    sitemap({
      filter: (page) => !Object.hasOwn(objectRedirects, withoutBase(new URL(page).pathname)),
      serialize(item) {
        const url = new URL(item.url);
        const neutral = withoutBase(url.pathname).replace(/^\/ja(?=\/)/, "") || "/";
        if (translatedPaths.has(neutral)) {
          item.links = [
            { lang: "en", url: new URL(withBase(neutral), url).href },
            { lang: "ja", url: new URL(withBase(`/ja${neutral}`), url).href },
            { lang: "x-default", url: new URL(withBase(neutral), url).href },
          ];
        }
        return item;
      },
    }),
    {
      name: "object-permanent-redirects",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          await writeFile(
            new URL("_redirects", dir),
            Object.entries(objectRedirects).map(([source, destination]) => `${withBase(source)} ${withBase(destination)} 301`).join("\n") + "\n",
          );
        },
      },
    },
  ],
  markdown: {
    processor: satteri({
      features: { math: true },
      mdastPlugins: [objectReadmeHeadings(), latexMath()],
    }),
  },
});
