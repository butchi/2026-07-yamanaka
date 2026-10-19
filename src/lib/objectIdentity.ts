import registry from "../../objects/registry.json" with { type: "json" };
import { validateObjectIdentities } from "./objectIdentityValidation.mjs";

export { uuidV7Pattern, validateObjectIdentities } from "./objectIdentityValidation.mjs";

export interface ObjectIdentity {
  id: string;
  slug: string;
  type?: "integer-sequence" | "mathematical-constant" | "data-object";
  previousSlugs: readonly string[];
}

export const objectIdentities = validateObjectIdentities(registry as ObjectIdentity[]);
export const integerSequenceIdentities = objectIdentities.filter(
  ({ type }) => type === undefined || type === "integer-sequence",
);
export const mathematicalConstantIdentities = objectIdentities.filter(
  ({ type }) => type === "mathematical-constant",
);
export const dataObjectIdentities = objectIdentities.filter(
  ({ type }) => type === "data-object",
);

export function objectPagePath(identity: ObjectIdentity) {
  const category = identity.type === "mathematical-constant"
    ? "constants"
    : identity.type === "data-object" ? "objects" : "numbers";
  return `/${category}/${identity.slug}/`;
}

export function createObjectRedirects(entries: readonly ObjectIdentity[]) {
  validateObjectIdentities(entries);
  const redirects: Record<string, string> = {};
  const sequenceAssets = [
    "functions.js",
    "functions.mjs",
    "data/digest.json",
    "data/standard.json",
  ];
  for (const entry of entries) {
    const destination = objectPagePath(entry);
    redirects[`/id/${entry.id}`] = destination;
    redirects[`/id/${entry.id}/`] = destination;
    for (const slug of entry.previousSlugs) {
      const category = entry.type === "mathematical-constant"
        ? "constants"
        : entry.type === "data-object" ? "objects" : "numbers";
      redirects[`/${category}/${slug}`] = destination;
      redirects[`/${category}/${slug}/`] = destination;
    }
    if (entry.type === "data-object") {
      for (const slug of [entry.slug, ...entry.previousSlugs]) {
        redirects[`/objects/${slug}/data/content.json`] = `/objects/${entry.id}/data/content.json`;
      }
    } else if (entry.type !== "mathematical-constant") {
      for (const slug of [entry.slug, ...entry.previousSlugs]) {
        for (const asset of sequenceAssets) {
          redirects[`/objects/${slug}/${asset}`] = `/objects/${entry.id}/${asset}`;
        }
      }
    }
  }
  return redirects;
}

export const objectRedirects = createObjectRedirects(objectIdentities);
