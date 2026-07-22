import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://integer-sequences.butchi.jp",
  output: "static",
  integrations: [sitemap()],
});
