import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

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
    return {
      params: { id: dataset.data.objectId, dataset: format },
      props: { data: dataset.data },
    };
  });
  const valuePaths = values.map((value) => {
    const [, category, filename, ...extraParts] = value.id.split("/");
    if (category !== "data" || filename !== "value" || extraParts.length > 0) {
      throw new Error(`Invalid object value ID "${value.id}".`);
    }
    return {
      params: { id: value.data.objectId, dataset: filename },
      props: { data: value.data },
    };
  });
  return [...datasetPaths, ...valuePaths];
}

export const GET: APIRoute = ({ props }) =>
  new Response(`${JSON.stringify(props.data, null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
