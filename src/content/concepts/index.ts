import { fibonacciContent } from "./fibonacci";
import { primeContent } from "./prime";
import { squareContent } from "./square";
import type { ConceptId, ConceptPageContent } from "./types";

export { fibonacciContent } from "./fibonacci";
export { primeContent } from "./prime";
export { squareContent } from "./square";
export type {
  BlogReference,
  CompositionExample,
  ConceptId,
  ConceptPageContent,
  ConceptSeo,
} from "./types";

export const conceptPageContents = {
  fibonacci: fibonacciContent,
  prime: primeContent,
  square: squareContent,
} as const satisfies {
  readonly [Id in ConceptId]: ConceptPageContent<Id>;
};
