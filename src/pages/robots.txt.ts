import type { APIRoute } from "astro";
import { sitePath } from "@/lib/sitePath";

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("A site URL is required to generate robots.txt.");
  return new Response(`User-agent: *\nAllow: ${sitePath("/")}\n\nSitemap: ${new URL(sitePath("/sitemap-index.xml"), site).href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
