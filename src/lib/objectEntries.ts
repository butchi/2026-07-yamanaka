import { conceptRegistry, publishedConcepts } from "./conceptRegistry";

export function resolveObjectEntries<
  DataEntry extends {
    id: string;
    data: { conceptId: string; relatedConceptIds: readonly string[] };
  },
  DocumentEntry extends { id: string; body?: string },
>(dataEntries: readonly DataEntry[], documents: readonly DocumentEntry[]) {
  const dataById = new Map(dataEntries.map((entry) => [entry.id, entry]));
  const documentsById = new Map(documents.map((entry) => [entry.id, entry]));
  const publishedIds = new Set<string>(publishedConcepts);

  for (const entries of [dataEntries, documents]) {
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

  return publishedConcepts.map((id) => {
    const object = dataById.get(id);
    const document = documentsById.get(id);
    if (!object || !document?.body?.trim()) {
      throw new Error(`Object "${id}" requires objects/${id}/object.json and non-empty objects/${id}/overview.md.`);
    }
    if (object.data.conceptId !== id) {
      throw new Error(`Object ID in objects/${id}/object.json must match its directory name.`);
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

    return { concept: conceptRegistry[id], object, document, relatedConcepts };
  });
}
