import {
  bigint as bigintSequences,
  number as numberSequences,
} from "@butchi/integer-sequences";

export const number = Object.freeze({
  square: numberSequences.square,
});

export const bigint = Object.freeze({
  square: bigintSequences.square,
});
