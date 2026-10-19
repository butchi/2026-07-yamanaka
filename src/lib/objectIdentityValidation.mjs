export const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** @param {string} slug */
export function validateObjectSlug(slug) {
  if (typeof slug !== "string" || slug.trim() !== slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || uuidV7Pattern.test(slug)) {
    throw new Error(`Invalid object slug "${slug}".`);
  }
  return slug;
}

/** @param {readonly { id: string, slug: string, type?: "integer-sequence" | "mathematical-constant" | "data-object", previousSlugs: readonly string[] }[]} entries */
export function validateObjectIdentities(entries) {
  if (!Array.isArray(entries)) throw new Error("Object registry must be an array.");
  const ids = new Set();
  const slugs = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry.id !== "string" || !uuidV7Pattern.test(entry.id) || ids.has(entry.id)) {
      throw new Error(`Invalid or duplicate object UUIDv7 "${entry?.id}".`);
    }
    if (!Array.isArray(entry.previousSlugs)) {
      throw new Error(`Object "${entry.id}" requires previousSlugs.`);
    }
    if (
      entry.type !== undefined &&
      entry.type !== "integer-sequence" &&
      entry.type !== "mathematical-constant" &&
      entry.type !== "data-object"
    ) {
      throw new Error(`Object "${entry.id}" has an invalid type.`);
    }
    ids.add(entry.id);
    for (const slug of [entry.slug, ...entry.previousSlugs]) {
      if (typeof slug !== "string") throw new Error("Object slug must be a string.");
      validateObjectSlug(slug);
      if (slugs.has(slug)) {
        throw new Error(`Invalid, duplicate, or previously used object slug "${slug}".`);
      }
      slugs.add(slug);
    }
  }
  return entries;
}
