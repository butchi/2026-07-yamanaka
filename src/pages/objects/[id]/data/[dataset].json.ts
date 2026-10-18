import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const datasets = await getCollection("datasets");
  return datasets.map((dataset) => {
    const [directory, category, format, ...extraParts] = dataset.id.split("/");
    if (category !== "data" || !directory || !format || extraParts.length > 0) {
      throw new Error(`Invalid object dataset ID "${dataset.id}".`);
    }
    return {
      params: { id: dataset.data.objectId, dataset: format },
      props: { data: dataset.data },
    };
  });
}

export const GET: APIRoute = ({ props }) =>
  new Response(`${JSON.stringify(props.data, null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
