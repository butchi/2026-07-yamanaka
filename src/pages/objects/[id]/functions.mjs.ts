import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { APIRoute } from "astro";
import { publishedConcepts } from "@/lib/conceptRegistry";

interface Props {
  source: string;
}

export async function getStaticPaths() {
  return Promise.all(
    publishedConcepts.map(async (id) => ({
      params: { id },
      props: {
        source: await readFile(
          resolve(process.cwd(), "objects", id, "functions.mjs"),
          "utf8",
        ),
      },
    })),
  );
}

export const GET: APIRoute<Props> = ({ props }) =>
  new Response(props.source, {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  });
