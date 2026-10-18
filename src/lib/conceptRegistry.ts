import {
  algorithmRegistry,
  bigint,
  number,
  type AlgorithmId,
  type IntegerConceptMetadata,
  type OperationFunction,
  type PublicOperationMetadata,
} from "@butchi/integer-sequences";

export const publishedConcepts = [
  "fibonacci",
  "prime",
  "square",
] as const;

export type PublishedConceptId = (typeof publishedConcepts)[number];
export type NumericType = "number" | "bigint";

export const uiOperations = ["term", "take", "upTo", "has", "next"] as const;

export type UiOperation = (typeof uiOperations)[number];
type LibraryOperation = UiOperation | "iterate";

export type RuntimeNumericConcept = {
  readonly meta: IntegerConceptMetadata;
  readonly operations: {
    readonly [Operation in LibraryOperation]?: PublicOperationMetadata;
  };
} & {
  readonly [Operation in LibraryOperation]?: OperationFunction;
};

export type ResolvedAlgorithm = {
  readonly id: AlgorithmId;
  readonly name: {
    readonly ja: string;
    readonly en: string;
  };
  readonly description: {
    readonly ja: string;
    readonly en: string;
  } | null;
};

export type OperationCapability = {
  readonly operation: UiOperation;
  readonly metadata: PublicOperationMetadata;
  readonly algorithm: ResolvedAlgorithm | null;
};

export type ConceptRegistryEntry<
  Id extends PublishedConceptId = PublishedConceptId,
> = {
  readonly id: Id;
  readonly meta: IntegerConceptMetadata;
  readonly library: {
    readonly number: RuntimeNumericConcept;
    readonly bigint: RuntimeNumericConcept;
  };
  readonly capabilities: {
    readonly number: readonly OperationCapability[];
    readonly bigint: readonly OperationCapability[];
  };
};

const libraryConcepts = {
  fibonacci: {
    number: number.fibonacci,
    bigint: bigint.fibonacci,
  },
  prime: {
    number: number.prime,
    bigint: bigint.prime,
  },
  square: {
    number: number.square,
    bigint: bigint.square,
  },
} as const satisfies Record<
  PublishedConceptId,
  Record<NumericType, RuntimeNumericConcept>
>;

export function resolveAlgorithm(
  algorithmId: AlgorithmId | undefined,
): ResolvedAlgorithm | null {
  if (algorithmId === undefined) {
    return null;
  }

  const details = algorithmRegistry[algorithmId];

  return {
    id: algorithmId,
    name: details.name,
    description: "description" in details ? details.description : null,
  };
}

/** Resolve native metadata, following a derived operation back to its source. */
export function resolveOperationAlgorithm(
  concept: RuntimeNumericConcept,
  operation: LibraryOperation,
  visited: ReadonlySet<LibraryOperation> = new Set(),
): ResolvedAlgorithm | null {
  if (visited.has(operation)) {
    return null;
  }

  const metadata = concept.operations[operation];

  if (metadata === undefined) {
    return null;
  }

  if (metadata.source === "native") {
    return resolveAlgorithm(metadata.algorithmId);
  }

  const nextVisited = new Set(visited);
  nextVisited.add(operation);

  return resolveOperationAlgorithm(concept, metadata.derivedFrom, nextVisited);
}

/**
 * Discover what the installed library really exposes. The site never infers
 * support from editorial content or a separately maintained capability list.
 */
export function discoverUiOperations(
  concept: RuntimeNumericConcept,
): readonly OperationCapability[] {
  return uiOperations.flatMap((operation) => {
    const metadata = concept.operations[operation];
    const implementation = concept[operation];

    if (metadata === undefined || typeof implementation !== "function") {
      return [];
    }

    return [
      {
        operation,
        metadata,
        algorithm: resolveOperationAlgorithm(concept, operation),
      },
    ];
  });
}

function createRegistryEntry<Id extends PublishedConceptId>(
  id: Id,
  concepts: {
    readonly number: RuntimeNumericConcept;
    readonly bigint: RuntimeNumericConcept;
  },
): ConceptRegistryEntry<Id> {
  if (
    concepts.number.meta.id !== id ||
    concepts.bigint.meta.id !== id
  ) {
    throw new Error(`Concept registry mismatch for "${id}".`);
  }

  return {
    id,
    meta: concepts.number.meta,
    library: concepts,
    capabilities: {
      number: discoverUiOperations(concepts.number),
      bigint: discoverUiOperations(concepts.bigint),
    },
  };
}

export const conceptRegistry = {
  fibonacci: createRegistryEntry(
    "fibonacci",
    libraryConcepts.fibonacci,
  ),
  prime: createRegistryEntry(
    "prime",
    libraryConcepts.prime,
  ),
  square: createRegistryEntry(
    "square",
    libraryConcepts.square,
  ),
} as const satisfies {
  readonly [Id in PublishedConceptId]: ConceptRegistryEntry<Id>;
};

export function getConcept<Id extends PublishedConceptId>(
  id: Id,
): (typeof conceptRegistry)[Id] {
  return conceptRegistry[id];
}

export function getNumericConcept(
  id: PublishedConceptId,
  numericType: NumericType,
): RuntimeNumericConcept {
  return conceptRegistry[id].library[numericType];
}

export function getOperationCapability(
  id: PublishedConceptId,
  numericType: NumericType,
  operation: UiOperation,
): OperationCapability | undefined {
  return conceptRegistry[id].capabilities[numericType].find(
    (capability) => capability.operation === operation,
  );
}
