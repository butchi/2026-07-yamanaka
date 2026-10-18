import registry from "../../objects/registry.json" with { type: "json" };

export interface ObjectIdentity {
  id: string;
  slug: string;
  previousSlugs: readonly string[];
}

export const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateObjectIdentities(entries: readonly ObjectIdentity[]) {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const entry of entries) {
    if (!uuidV7Pattern.test(entry.id) || ids.has(entry.id)) {
      throw new Error(`Invalid or duplicate object UUIDv7 "${entry.id}".`);
    }
    ids.add(entry.id);
    for (const slug of [entry.slug, ...entry.previousSlugs]) {
      if (!slugPattern.test(slug) || uuidV7Pattern.test(slug) || slugs.has(slug)) {
        throw new Error(`Invalid, duplicate, or previously used object slug "${slug}".`);
      }
      slugs.add(slug);
    }
  }
  return entries;
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
