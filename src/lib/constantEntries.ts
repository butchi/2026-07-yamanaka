import { objectIdentities, type ObjectIdentity, validateObjectIdentities } from "./objectIdentity";
import type { ConstantDigestDataset, ConstantStandardDataset, ObjectDatasetEntry } from "./objectDatasetTypes";

export function resolveConstantEntries<
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
  ValueEntry extends {
    id: string;
    data: {
      objectId: string;
      format: string;
      valueType: string;
      symbol: string;
      exactValue: string;
    };
  },
>(
  objects: readonly ObjectEntry[],
  readmes: readonly ReadmeEntry[],
  values: readonly ValueEntry[],
  datasets: readonly ObjectDatasetEntry[],
  identities: readonly ObjectIdentity[] = objectIdentities,
) {
  validateObjectIdentities(identities);
  const constants = objects.filter(
    (entry): entry is ObjectEntry & { data: { type: "mathematical-constant" } } =>
      entry.data.type === "mathematical-constant",
  );
  const objectsByDirectory = new Map(objects.map((object) => [object.id, object]));
  if (objectsByDirectory.size !== objects.length) {
    throw new Error("Duplicate object source directory.");
  }
  const readmesById = new Map(readmes.map((readme) => [readme.id, readme]));
  const valuesById = new Map(values.map((value) => [value.data.objectId, value]));
  const constantDatasets = datasets.filter(
    (dataset): dataset is ConstantDigestDataset | ConstantStandardDataset =>
      "valueType" in dataset.data,
  );
  const datasetsById = new Map(constantDatasets.map((dataset) => [dataset.id, dataset]));
  const identitiesById = new Map(identities.map((identity) => [identity.id, identity]));
  if (
    readmesById.size !== readmes.length ||
    valuesById.size !== values.length ||
    datasetsById.size !== constantDatasets.length
  ) {
    throw new Error("Duplicate object README or constant dataset.");
  }

  for (const readme of readmes) {
    const directory = readme.id.replace(/\/ja$/, "");
    if (
      !objectsByDirectory.has(directory) ||
      (readme.id !== directory && readme.id !== `${directory}/ja`)
    ) {
      throw new Error(`Unknown or duplicate object README directory "${readme.id}".`);
    }
  }
  for (const identity of identities) {
    if (
      identity.type === "mathematical-constant" &&
      !constants.some(({ data }) => data.id === identity.id)
    ) {
      throw new Error(`Object "${identity.id}" requires a mathematical-constant object.json.`);
    }
  }
  for (const value of values) {
    const object = objects.find(({ data }) => data.id === value.data.objectId);
    if (object?.data.type !== "mathematical-constant" || value.id !== `${object.id}/data/value`) {
      throw new Error(`Constant value data "${value.id}" must belong to a mathematical-constant object.`);
    }
  }
  for (const dataset of constantDatasets) {
    const object = objects.find(({ data }) => data.id === dataset.data.objectId);
    if (
      object?.data.type !== "mathematical-constant" ||
      dataset.id !== `${object.id}/data/${dataset.data.format}`
    ) {
      throw new Error(`Constant dataset "${dataset.id}" must belong to a mathematical-constant object.`);
    }
  }

  return constants.map((object) => {
    const { id } = object.data;
    const directory = object.id;
    const identity = identitiesById.get(id);
    const readme = readmesById.get(directory);
    const japaneseReadme = readmesById.get(`${directory}/ja`);
    const value = valuesById.get(id);
    const digest = constantDatasets.find(
      (dataset): dataset is ConstantDigestDataset =>
        dataset.id === `${directory}/data/digest`,
    );
    const standard = constantDatasets.find(
      (dataset): dataset is ConstantStandardDataset =>
        dataset.id === `${directory}/data/standard`,
    );
    if (!identity || identity.type !== "mathematical-constant" || identity.slug !== directory) {
      throw new Error(`Constant "${directory}" requires a matching mathematical-constant identity.`);
    }
    if (!readme?.body?.trim()) {
      throw new Error(`Constant "${directory}" requires a non-empty objects/${directory}/README.md.`);
    }
    if (Boolean(japaneseReadme) !== Boolean(object.data.translations?.ja)) {
      throw new Error(`Japanese README and SEO must be provided together for constant "${directory}".`);
    }
    if (japaneseReadme && !japaneseReadme.body?.trim()) {
      throw new Error(`Japanese README must not be empty for constant "${directory}".`);
    }
    if (!value) {
      throw new Error(`Constant "${directory}" requires objects/${directory}/data/value.json.`);
    }
    if (
      value.id !== `${directory}/data/value` ||
      value.data.format !== "exact-constant" ||
      value.data.valueType !== "irrational"
    ) {
      throw new Error(`Invalid value data for constant "${directory}".`);
    }
    if (
      !digest ||
      !standard
    ) {
      throw new Error(`Constant "${directory}" requires digest.json and standard.json.`);
    }
    if (
      digest.data.format !== "digest" ||
      digest.data.valueType !== "irrational" ||
      typeof digest.data.value !== "number" ||
      !Number.isFinite(digest.data.value) ||
      digest.data.approximationMethod !== "truncated" ||
      digest.data.decimalPlaces !== 16
    ) {
      throw new Error(`Invalid digest data for constant "${directory}".`);
    }
    const standardDigits = typeof standard.data.value === "string"
      ? standard.data.value.split(".")[1]?.length
      : undefined;
    if (
      standard.data.format !== "standard" ||
      standard.data.valueType !== "irrational" ||
      standard.data.valueEncoding !== "decimal-string" ||
      typeof standard.data.value !== "string" ||
      standard.data.approximationMethod !== "truncated" ||
      standard.data.decimalPlaces !== 256 ||
      standardDigits !== 256
    ) {
      throw new Error(`Invalid standard data for constant "${directory}".`);
    }
    const relatedObjects = (object.data.relatedObjectIds ?? []).map((relatedId) => {
      const relatedIdentity = identitiesById.get(relatedId);
      if (!relatedIdentity || relatedId === id) {
        throw new Error(`Invalid related object "${relatedId}" in objects/${directory}/object.json.`);
      }
      return relatedIdentity;
    });
    if (new Set(relatedObjects.map(({ id: relatedId }) => relatedId)).size !== relatedObjects.length) {
      throw new Error(`Duplicate related object in objects/${directory}/object.json.`);
    }
    return { identity, object, readme, japaneseReadme, value, digest, standard, relatedObjects };
  });
}
