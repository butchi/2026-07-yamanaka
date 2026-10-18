import {
  bigint as bigintSequences,
  number as numberSequences,
} from "@butchi/integer-sequences";

export const number = Object.freeze({
  prime: numberSequences.prime,
});

export const bigint = Object.freeze({
  prime: bigintSequences.prime,
});
