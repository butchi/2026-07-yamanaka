import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://integer-sequence-viewer.butchi-y.chatgpt.site",
  output: "static",
  integrations: [sitemap()],
});
