import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import objectDocumentHeadings from "./scripts/object-document-headings.mjs";

export default defineConfig({
  site: "https://integer-sequence-viewer.butchi-y.chatgpt.site",
  output: "static",
  integrations: [sitemap()],
  markdown: {
    processor: satteri({ mdastPlugins: [objectDocumentHeadings()] }),
  },
});
