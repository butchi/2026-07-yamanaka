import registry from "../../objects/registry.json" with { type: "json" };
import { validateObjectIdentities } from "./objectIdentityValidation.mjs";

export { uuidV7Pattern, validateObjectIdentities } from "./objectIdentityValidation.mjs";

export interface ObjectIdentity {
  id: string;
  slug: string;
  previousSlugs: readonly string[];
}

export const objectIdentities = validateObjectIdentities(registry);

export function objectPagePath(identity: ObjectIdentity) {
  return `/numbers/${identity.slug}/`;
}

export function createObjectRedirects(entries: readonly ObjectIdentity[]) {
  validateObjectIdentities(entries);
  const redirects: Record<string, string> = {};
  const assets = [
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
      redirects[`/numbers/${slug}`] = destination;
      redirects[`/numbers/${slug}/`] = destination;
    }
    for (const slug of [entry.slug, ...entry.previousSlugs]) {
      for (const asset of assets) {
        redirects[`/objects/${slug}/${asset}`] = `/objects/${entry.id}/${asset}`;
      }
    }
  }
  return redirects;
}

export const objectRedirects = createObjectRedirects(objectIdentities);
