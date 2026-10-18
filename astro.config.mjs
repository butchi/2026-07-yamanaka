import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import objectReadmeHeadings from "./scripts/object-readme-headings.mjs";
import latexMath from "./scripts/latex-math.mjs";
import { objectRedirects } from "./src/lib/objectIdentity";
import { writeFile } from "node:fs/promises";

export default defineConfig({
  site: "https://integer-sequence-viewer.butchi-y.chatgpt.site",
  output: "static",
  redirects: Object.fromEntries(
    Object.entries(objectRedirects).filter(([source]) => !Object.hasOwn(objectRedirects, `${source}/`)).map(([source, destination]) => [
      source, { status: 301, destination },
    ]),
  ),
  integrations: [
    sitemap({ filter: (page) => !Object.hasOwn(objectRedirects, new URL(page).pathname) }),
    {
      name: "object-permanent-redirects",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          await writeFile(
            new URL("_redirects", dir),
            Object.entries(objectRedirects).map(([source, destination]) => `${source} ${destination} 301`).join("\n") + "\n",
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
