import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { APIRoute } from "astro";
import { objectIdentities } from "@/lib/objectIdentity";
import { compileObjectModule } from "@/lib/objectModules";
import { getCollection } from "astro:content";

interface Props {
  content: string;
}

export async function getStaticPaths() {
  const objects = await getCollection("objects");
  const paths = await Promise.all(objectIdentities.map(async ({ id }) => {
    const object = objects.find((entry) => entry.data.id === id);
    if (!object) throw new Error(`Missing source directory for object "${id}".`);
    const source = await readFile(
      resolve(process.cwd(), "objects", object.id, "functions.source.js"),
      "utf8",
    );
    return Promise.all(
      ["functions.js", "functions.mjs"].map(async (script) => ({
        params: { id, script },
        props: {
          content: await compileObjectModule(
            source,
            script === "functions.mjs" ? "module" : "global",
          ),
        },
      })),
    );
  }));
  return paths.flat();
}

export const GET: APIRoute<Props> = ({ props }) =>
  new Response(props.content, {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  });
