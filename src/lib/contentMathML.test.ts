import { describe, expect, it } from "vitest";
import { isSafeContentMathML } from "./contentMathML";

const goldenRatioContentMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><apply><eq/><ci>Φ</ci><apply><divide/><apply><plus/><cn>1</cn><apply><root/><cn>5</cn></apply></apply><cn>2</cn></apply></apply></math>';
const goldenRatioPresentationMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>Φ</mi><mo>=</mo><mfrac><mrow><mn>1</mn><mo>+</mo><msqrt><mn>5</mn></msqrt></mrow><mn>2</mn></mfrac></mrow></math>';

describe("Content MathML validation", () => {
  it("accepts the golden ratio's well-formed Content MathML", () => {
    expect(isSafeContentMathML(goldenRatioContentMathML)).toBe(true);
    expect(isSafeContentMathML(goldenRatioPresentationMathML)).toBe(true);
  });

  it.each([
    '<math xmlns="http://www.w3.org/1998/Math/MathML"><script>alert(1)</script></math>',
    '<math xmlns="http://www.w3.org/1998/Math/MathML"><ci onclick="alert(1)">φ</ci></math>',
    '<math xmlns="http://www.w3.org/1998/Math/MathML"><apply><divide/></math>',
    '<math xmlns="http://www.w3.org/1998/Math/MathML"><cn>1</cn></math>1',
  ])("rejects unsafe or malformed MathML: %s", (markup) => {
    expect(isSafeContentMathML(markup)).toBe(false);
  });
});
