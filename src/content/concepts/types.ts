export type ConceptId = "fibonacci" | "prime" | "square";

export type ConceptSeo = {
  readonly title: string;
  readonly description: string;
};

export type CompositionExample = {
  readonly title: string;
  readonly description: string;
  readonly code: string;
};

export type BlogReference = {
  readonly title: string;
  readonly url: string;
};

/**
 * Search-oriented editorial content owned by this site.
 *
 * Mathematical names, library descriptions, OEIS identifiers, indexing and
 * operation availability intentionally do not belong here. They are joined
 * from @butchi/integer-sequences in the site concept registry.
 */
export type ConceptPageContent<Id extends ConceptId = ConceptId> = {
  readonly conceptId: Id;
  readonly seo: ConceptSeo;
  readonly definition: string;
  readonly notes: readonly string[];
  readonly examples: readonly CompositionExample[];
  readonly relatedConceptIds: readonly Exclude<ConceptId, Id>[];
  readonly blog?: BlogReference;
};
