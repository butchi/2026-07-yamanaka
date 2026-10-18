import {
  bigint as bigintSequences,
  number as numberSequences,
} from "@butchi/integer-sequences";

export const number = Object.freeze({
  fibonacci: numberSequences.fibonacci,
});

export const bigint = Object.freeze({
  fibonacci: bigintSequences.fibonacci,
});
