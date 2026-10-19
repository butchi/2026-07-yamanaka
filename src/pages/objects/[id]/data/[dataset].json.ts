import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const rawDataFiles = import.meta.glob<string>("../../../../../objects/*/data/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
});

export async function getStaticPaths() {
  const [datasets, values] = await Promise.all([
    getCollection("datasets"),
    getCollection("objectValues"),
  ]);
  const datasetPaths = datasets.map((dataset) => {
    const [directory, category, format, ...extraParts] = dataset.id.split("/");
    if (category !== "data" || !directory || !format || extraParts.length > 0) {
      throw new Error(`Invalid object dataset ID "${dataset.id}".`);
    }
    const rawContent = rawDataFiles[`../../../../../objects/${directory}/data/${format}.json`];
    if (!rawContent) throw new Error(`Missing source JSON for object dataset "${dataset.id}".`);
    return {
      params: { id: dataset.data.objectId, dataset: format },
      props: { rawContent },
    };
  });
  const valuePaths = values.map((value) => {
    const [, category, filename, ...extraParts] = value.id.split("/");
    if (category !== "data" || filename !== "value" || extraParts.length > 0) {
      throw new Error(`Invalid object value ID "${value.id}".`);
    }
    const directory = value.id.split("/")[0];
    const rawContent = rawDataFiles[`../../../../../objects/${directory}/data/${filename}.json`];
    if (!rawContent) throw new Error(`Missing source JSON for object value "${value.id}".`);
    return {
      params: { id: value.data.objectId, dataset: filename },
      props: { rawContent },
    };
  });
  return [...datasetPaths, ...valuePaths];
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.rawContent, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
