import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { APIRoute } from "astro";
import { objectIdentities } from "@/lib/objectIdentity";
import { getCollection } from "astro:content";

interface Props {
  source: string;
}

export async function getStaticPaths() {
  const objects = await getCollection("objects");
  return Promise.all(
    objectIdentities.flatMap(({ id }) => {
      const object = objects.find((entry) => entry.data.id === id);
      if (!object) throw new Error(`Missing source directory for object "${id}".`);
      return ["functions.js", "functions.mjs"].map(async (script) => ({
        params: { id, script },
        props: {
          source: await readFile(
            resolve(process.cwd(), "objects", object.id, script),
            "utf8",
          ),
        },
      }));
    },
    ),
  );
}

export const GET: APIRoute<Props> = ({ props }) =>
  new Response(props.source, {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  });
