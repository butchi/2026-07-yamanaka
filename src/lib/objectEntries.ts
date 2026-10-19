import { conceptRegistry, publishedConcepts } from "./conceptRegistry";
import { objectIdentities, type ObjectIdentity, validateObjectIdentities } from "./objectIdentity";

export function resolveObjectEntries<
  DataEntry extends {
    id: string;
    data: {
      id: string; conceptId: string; relatedObjectIds: readonly string[];
      translations?: { ja?: { seo: { title: string; description: string } } };
    };
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
  identities: readonly ObjectIdentity[] = objectIdentities,
) {
  validateObjectIdentities(identities);
  const dataById = new Map(dataEntries.map((entry) => [entry.data.id, entry]));
  const readmesById = new Map(readmes.map((entry) => [entry.id, entry]));
  const datasetsById = new Map(datasets.map((entry) => [entry.id, entry]));
  const publishedIds = new Set(identities.map(({ id }) => id));
  const identitiesById = new Map(identities.map((identity) => [identity.id, identity]));

  const seenIds = new Set<string>();
  const sourceDirectories = new Set<string>();
  for (const entry of dataEntries) {
    if (!publishedIds.has(entry.data.id)) {
      throw new Error(`No identity is registered for object "${entry.data.id}".`);
    }
    if (seenIds.has(entry.data.id) || sourceDirectories.has(entry.id)) {
      throw new Error(`Duplicate object ID or source directory "${entry.data.id}".`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
      throw new Error(`Invalid object source directory "${entry.id}".`);
    }
    seenIds.add(entry.data.id);
    sourceDirectories.add(entry.id);
  }
  const seenReadmes = new Set<string>();
  for (const entry of readmes) {
    const directory = entry.id.replace(/\/ja$/, "");
    if (!sourceDirectories.has(directory) || seenReadmes.has(entry.id)) {
      throw new Error(`Unknown or duplicate object README directory "${entry.id}".`);
    }
    seenReadmes.add(entry.id);
  }

  const datasetSeenIds = new Set<string>();
  for (const dataset of datasets) {
    const [directory, category, format, ...extraParts] = dataset.id.split("/");
    const objectId = dataset.data.objectId;
    const source = dataById.get(objectId);
    if (
      extraParts.length > 0 ||
      !publishedIds.has(objectId) ||
      category !== "data" ||
      (format !== "digest" && format !== "standard") ||
      source?.id !== directory ||
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

  const usedConcepts = new Set<string>();
  const entries = identities.map((identity) => {
    const { id } = identity;
    const object = dataById.get(id);
    if (!object) {
      throw new Error(`Object "${id}" requires an objects/<directory>/object.json with that UUID.`);
    }
    const sourceDirectory = object.id;
    const readme = readmesById.get(sourceDirectory);
    const japaneseReadme = readmesById.get(`${sourceDirectory}/ja`);
    if (Boolean(japaneseReadme) !== Boolean(object.data.translations?.ja)) {
      throw new Error(`Japanese README and SEO must be provided together for "${sourceDirectory}".`);
    }
    if (japaneseReadme && !japaneseReadme.body?.trim()) {
      throw new Error(`Japanese README must not be empty for "${sourceDirectory}".`);
    }
    const digest = datasetsById.get(`${sourceDirectory}/data/digest`);
    const standard = datasetsById.get(`${sourceDirectory}/data/standard`);
    if (!readme?.body?.trim()) {
      throw new Error(`Object "${id}" requires non-empty objects/${sourceDirectory}/README.md.`);
    }
    if (!digest || !standard) {
      throw new Error(`Object "${id}" requires objects/${sourceDirectory}/data/digest.json and standard.json.`);
    }
    const conceptId = publishedConcepts.find((candidate) => candidate === object.data.conceptId);
    if (!conceptId || usedConcepts.has(conceptId)) {
      throw new Error(`Invalid or duplicate calculation adapter "${object.data.conceptId}".`);
    }
    usedConcepts.add(conceptId);
    if (digest.data.terms.some((term, index) => term !== standard.data.terms[index])) {
      throw new Error(`Digest data for object "${id}" must exactly match the prefix of standard data.`);
    }

    const seenRelated = new Set<string>();
    const relatedObjects = object.data.relatedObjectIds.map((relatedId) => {
      const relatedIdentity = identitiesById.get(relatedId);
      const relatedObject = dataById.get(relatedId);
      const relatedConceptId = publishedConcepts.find((candidate) => candidate === relatedObject?.data.conceptId);
      if (!relatedIdentity || !relatedConceptId || relatedId === id || seenRelated.has(relatedId)) {
        throw new Error(`Invalid or duplicate related object "${relatedId}" in objects/${sourceDirectory}/object.json.`);
      }
      seenRelated.add(relatedId);
      return { identity: relatedIdentity, concept: conceptRegistry[relatedConceptId], hasJapanese: Boolean(relatedObject?.data.translations?.ja) };
    });

    return {
      identity,
      sourceDirectory,
      concept: conceptRegistry[conceptId],
      object,
      readme,
      japaneseReadme,
      digest,
      standard,
      relatedObjects,
    };
  });
  if (usedConcepts.size !== publishedConcepts.length) {
    throw new Error("Every published calculation adapter must have an object.");
  }
  return entries;
}
