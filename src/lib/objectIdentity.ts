import registry from "../../objects/registry.json" with { type: "json" };
import { validateObjectIdentities } from "./objectIdentityValidation.mjs";

export { uuidV7Pattern, validateObjectIdentities } from "./objectIdentityValidation.mjs";

export interface ObjectIdentity {
  id: string;
  slug: string;
  type?: "integer-sequence" | "mathematical-constant";
  previousSlugs: readonly string[];
}

export const objectIdentities = validateObjectIdentities(registry as ObjectIdentity[]);
export const integerSequenceIdentities = objectIdentities.filter(
  ({ type }) => type === undefined || type === "integer-sequence",
);
export const mathematicalConstantIdentities = objectIdentities.filter(
  ({ type }) => type === "mathematical-constant",
);

export function objectPagePath(identity: ObjectIdentity) {
  const category = identity.type === "mathematical-constant" ? "constants" : "numbers";
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
      const category = entry.type === "mathematical-constant" ? "constants" : "numbers";
      redirects[`/${category}/${slug}`] = destination;
      redirects[`/${category}/${slug}/`] = destination;
    }
    if (entry.type !== "mathematical-constant") {
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
