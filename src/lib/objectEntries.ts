import { conceptRegistry, publishedConcepts } from "./conceptRegistry";

export function resolveObjectEntries<
  DataEntry extends {
    id: string;
    data: { conceptId: string; relatedConceptIds: readonly string[] };
  },
  ReadmeEntry extends { id: string; body?: string },
  DatasetEntry extends {
    id: string;
    data: {
      objectId: string;
      format: "digest" | "standard";
      indexOrigin: number;
      valueEncoding: "base10-integer-string";
      terms: readonly string[];
    };
  },
>(
  dataEntries: readonly DataEntry[],
  readmes: readonly ReadmeEntry[],
  datasets: readonly DatasetEntry[],
) {
  const dataById = new Map(dataEntries.map((entry) => [entry.id, entry]));
  const readmesById = new Map(readmes.map((entry) => [entry.id, entry]));
  const datasetsById = new Map(datasets.map((entry) => [entry.id, entry]));
  const publishedIds = new Set<string>(publishedConcepts);

  for (const entries of [dataEntries, readmes]) {
    const seen = new Set<string>();
    for (const entry of entries) {
      if (!publishedIds.has(entry.id)) {
        throw new Error(`No calculation adapter is registered for object "${entry.id}".`);
      }
      if (seen.has(entry.id)) {
        throw new Error(`Duplicate object ID "${entry.id}".`);
      }
      seen.add(entry.id);
    }
  }

  const datasetSeenIds = new Set<string>();
  for (const dataset of datasets) {
    const [objectId, category, format, ...extraParts] = dataset.id.split("/");
    if (
      extraParts.length > 0 ||
      !publishedIds.has(objectId) ||
      category !== "data" ||
      (format !== "digest" && format !== "standard") ||
      dataset.data.objectId !== objectId ||
      dataset.data.format !== format
    ) {
      throw new Error(`Invalid dataset ID or object reference "${dataset.id}".`);
    }
    if (datasetSeenIds.has(dataset.id)) {
      throw new Error(`Duplicate dataset ID "${dataset.id}".`);
    }
    datasetSeenIds.add(dataset.id);
    const expectedCount = format === "digest" ? 16 : 256;
    if (
      dataset.data.indexOrigin !== 0 ||
      dataset.data.valueEncoding !== "base10-integer-string" ||
      dataset.data.terms.length !== expectedCount ||
      dataset.data.terms.some((term) => !/^-?(0|[1-9]\d*)$/.test(term))
    ) {
      throw new Error(`Invalid ${format} dataset for object "${objectId}".`);
    }
  }

  return publishedConcepts.map((id) => {
    const object = dataById.get(id);
    const readme = readmesById.get(id);
    const digest = datasetsById.get(`${id}/data/digest`);
    const standard = datasetsById.get(`${id}/data/standard`);
    if (!object) {
      throw new Error(`Object "${id}" requires objects/${id}/object.json.`);
    }
    if (!readme?.body?.trim()) {
      throw new Error(`Object "${id}" requires non-empty objects/${id}/README.md.`);
    }
    if (!digest || !standard) {
      throw new Error(`Object "${id}" requires objects/${id}/data/digest.json and standard.json.`);
    }
    if (object.data.conceptId !== id) {
      throw new Error(`Object ID in objects/${id}/object.json must match its directory name.`);
    }
    if (digest.data.terms.some((term, index) => term !== standard.data.terms[index])) {
      throw new Error(`Digest data for object "${id}" must exactly match the prefix of standard data.`);
    }

    const seenRelated = new Set<string>();
    const relatedConcepts = object.data.relatedConceptIds.map((relatedId) => {
      const publishedId = publishedConcepts.find((candidate) => candidate === relatedId);
      if (!publishedId || relatedId === id || seenRelated.has(relatedId)) {
        throw new Error(`Invalid or duplicate related object "${relatedId}" in objects/${id}/object.json.`);
      }
      seenRelated.add(relatedId);
      return conceptRegistry[publishedId];
    });

    return {
      concept: conceptRegistry[id],
      object,
      readme,
      digest,
      standard,
      relatedConcepts,
    };
  });
}
