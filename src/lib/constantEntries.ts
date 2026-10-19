import { objectIdentities, type ObjectIdentity, validateObjectIdentities } from "./objectIdentity";

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
      decimalApproximation: string;
      approximationMethod: string;
      decimalPlaces: number;
    };
  },
>(
  objects: readonly ObjectEntry[],
  readmes: readonly ReadmeEntry[],
  values: readonly ValueEntry[],
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
  const identitiesById = new Map(identities.map((identity) => [identity.id, identity]));
  if (readmesById.size !== readmes.length || valuesById.size !== values.length) {
    throw new Error("Duplicate object README or value dataset.");
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
    if (
      object?.data.type !== "mathematical-constant" ||
      value.id !== `${object.id}/data/value`
    ) {
      throw new Error(`Value data "${value.id}" must belong to a mathematical-constant object.`);
    }
  }

  return constants.map((object) => {
    const { id } = object.data;
    const directory = object.id;
    const identity = identitiesById.get(id);
    const readme = readmesById.get(directory);
    const japaneseReadme = readmesById.get(`${directory}/ja`);
    const value = valuesById.get(id);
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
      value.data.format !== "decimal-constant" ||
      value.data.valueType !== "irrational" ||
      value.data.approximationMethod !== "truncated" ||
      value.data.decimalPlaces !== value.data.decimalApproximation.split(".")[1]?.length
    ) {
      throw new Error(`Invalid value data for constant "${directory}".`);
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
    return { identity, object, readme, japaneseReadme, value, relatedObjects };
  });
}
