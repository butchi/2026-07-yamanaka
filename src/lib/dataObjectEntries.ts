import { objectIdentities, type ObjectIdentity, validateObjectIdentities } from "./objectIdentity";
import type { JsonObjectDataset, ObjectDatasetEntry } from "./objectDatasetTypes";

export function resolveDataObjectEntries<
  ObjectEntry extends {
    id: string;
    data: {
      type: string;
      id: string;
      name?: { en: string; ja: string };
      seo?: { title: string; description: string };
      relatedObjectIds?: readonly string[];
      translations?: { ja?: { seo: { title: string; description: string } } };
    };
  },
  ReadmeEntry extends { id: string; body?: string },
>(
  objects: readonly ObjectEntry[],
  readmes: readonly ReadmeEntry[],
  datasets: readonly ObjectDatasetEntry[],
  identities: readonly ObjectIdentity[] = objectIdentities,
) {
  validateObjectIdentities(identities);
  const registeredDataObjects = identities.filter(({ type }) => type === "data-object");
  const dataObjects = objects.filter(
    (entry): entry is ObjectEntry & { data: { type: "data-object" } } =>
      entry.data.type === "data-object",
  );
  const objectsByDirectory = new Map(dataObjects.map((entry) => [entry.id, entry]));
  const dataById = new Map(dataObjects.map((entry) => [entry.data.id, entry]));
  const allObjectsById = new Map(objects.map((entry) => [entry.data.id, entry]));
  const identitiesById = new Map(identities.map((identity) => [identity.id, identity]));
  const dataObjectDirectories = new Set(dataObjects.map((entry) => entry.id));
  const dataObjectReadmes = readmes.filter(({ id }) => dataObjectDirectories.has(id.replace(/\/ja$/, "")));
  const readmesById = new Map(dataObjectReadmes.map((entry) => [entry.id, entry]));
  const contentDatasets = datasets.filter(
    (dataset): dataset is JsonObjectDataset =>
      dataset.data.format === "json" || dataset.data.format === "matrix",
  );
  const datasetsById = new Map(contentDatasets.map((entry) => [entry.id, entry]));

  if (
    objectsByDirectory.size !== dataObjects.length ||
    dataById.size !== dataObjects.length ||
    readmesById.size !== dataObjectReadmes.length ||
    datasetsById.size !== contentDatasets.length
  ) {
    throw new Error("Duplicate data object directory, UUID, README or dataset.");
  }

  for (const identity of registeredDataObjects) {
    if (!dataById.has(identity.id)) {
      throw new Error(`Data object "${identity.id}" requires an objects/<directory>/object.json.`);
    }
  }
  for (const object of dataObjects) {
    if (identitiesById.get(object.data.id)?.type !== "data-object") {
      throw new Error(`Data object "${object.id}" requires a matching data-object identity.`);
    }
  }
  for (const readme of dataObjectReadmes) {
    const directory = readme.id.replace(/\/ja$/, "");
    if (
      !objectsByDirectory.has(directory) ||
      (readme.id !== directory && readme.id !== `${directory}/ja`)
    ) {
      throw new Error(`Unknown or duplicate data object README "${readme.id}".`);
    }
  }
  for (const dataset of contentDatasets) {
    const [directory, category, filename, ...extraParts] = dataset.id.split("/");
    if (
      !directory ||
      category !== "data" ||
      filename !== "content" ||
      extraParts.length > 0 ||
      allObjectsById.get(dataset.data.objectId)?.id !== directory
    ) {
      throw new Error(`Invalid JSON dataset ID or object reference "${dataset.id}".`);
    }
  }

  return registeredDataObjects.map((identity) => {
    const object = dataById.get(identity.id);
    if (!object) {
      throw new Error(`Data object "${identity.id}" requires an objects/<directory>/object.json.`);
    }
    const directory = object.id;
    const readme = readmesById.get(directory);
    const japaneseReadme = readmesById.get(`${directory}/ja`);
    const content = datasetsById.get(`${directory}/data/content`);
    if (Boolean(japaneseReadme) !== Boolean(object.data.translations?.ja)) {
      throw new Error(`Japanese README and SEO must be provided together for data object "${directory}".`);
    }
    if (!readme?.body?.trim()) {
      throw new Error(`Data object "${directory}" requires a non-empty README.md.`);
    }
    if (japaneseReadme && !japaneseReadme.body?.trim()) {
      throw new Error(`Japanese README must not be empty for data object "${directory}".`);
    }
    if (!content || content.data.objectId !== identity.id) {
      throw new Error(`Data object "${directory}" requires data/content.json with a valid JSON dataset.`);
    }
    const seenRelated = new Set<string>();
    const relatedObjects = (object.data.relatedObjectIds ?? []).map((relatedId) => {
      const related = identitiesById.get(relatedId);
      if (!related || relatedId === identity.id || seenRelated.has(relatedId)) {
        throw new Error(`Invalid or duplicate related object "${relatedId}" in objects/${directory}/object.json.`);
      }
      seenRelated.add(relatedId);
      return related;
    });
    return { object, identity, readme, japaneseReadme, content, relatedObjects };
  });
}
