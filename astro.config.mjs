import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import objectReadmeHeadings from "./scripts/object-readme-headings.mjs";
import latexMath from "./scripts/latex-math.mjs";

export default defineConfig({
  site: "https://integer-sequence-viewer.butchi-y.chatgpt.site",
  output: "static",
  integrations: [sitemap()],
  markdown: {
    processor: satteri({
      features: { math: true },
      mdastPlugins: [objectReadmeHeadings(), latexMath()],
    }),
  },
});
