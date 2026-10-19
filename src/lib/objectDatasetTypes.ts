export type IntegerSequenceDigestDataset = {
  id: string;
  data: {
    objectId: string;
    format: "digest";
    indexOrigin: number;
    terms: readonly number[];
  };
};

export type IntegerSequenceStandardDataset = {
  id: string;
  data: {
    objectId: string;
    format: "standard";
    indexOrigin: number;
    valueEncoding: "base10-integer-string";
    terms: readonly string[];
  };
};

export type ConstantDigestDataset = {
  id: string;
  data: {
    objectId: string;
    format: "digest";
    valueType: "irrational";
    value: number;
    approximationMethod: "truncated";
    decimalPlaces: 16;
  };
};

export type ConstantStandardDataset = {
  id: string;
  data: {
    objectId: string;
    format: "standard";
    valueType: "irrational";
    valueEncoding: "decimal-string";
    value: string;
    approximationMethod: "truncated";
    decimalPlaces: 256;
  };
};

export type ObjectDatasetEntry = {
  id: string;
  data:
    | IntegerSequenceDigestDataset["data"]
    | IntegerSequenceStandardDataset["data"]
    | ConstantDigestDataset["data"]
    | ConstantStandardDataset["data"];
};
