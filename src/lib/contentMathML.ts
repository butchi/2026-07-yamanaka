const allowedElements = new Set([
  "math", "apply", "eq", "ci", "divide", "plus", "root", "cn",
  "mrow", "mi", "mo", "mfrac", "mn", "msqrt",
]);
const mathMLNamespace = 'xmlns="http://www.w3.org/1998/Math/MathML"';

export function isSafeContentMathML(markup: string): boolean {
  const tokens = markup.match(/<[^>]*>|[^<]+|</g);
  if (!tokens || tokens.join("") !== markup) return false;

  const stack: string[] = [];
  let hasRoot = false;
  let rootClosed = false;
  for (const token of tokens) {
    if (!token.startsWith("<")) {
      if (
        !hasRoot ||
        rootClosed ||
        stack.length === 0 ||
        !/^[\p{L}\p{N}\s.+=-]*$/u.test(token)
      ) return false;
      continue;
    }

    const closing = token.match(/^<\/([a-z]+)>$/);
    if (closing) {
      if (stack.pop() !== closing[1]) return false;
      if (closing[1] === "math") rootClosed = true;
      continue;
    }

    const opening = token.match(/^<([a-z]+)(?:\s+([^<>]+?))?(\/?)>$/);
    if (!opening) return false;
    const [, element, attributes, selfClosing] = opening;
    if (!allowedElements.has(element)) return false;
    if (rootClosed || (stack.length === 0 && element !== "math")) return false;
    if (element === "math") {
      if (hasRoot || stack.length !== 0 || attributes !== mathMLNamespace || selfClosing) return false;
      hasRoot = true;
    } else if (attributes !== undefined) {
      return false;
    }
    if (selfClosing) {
      if (!["eq", "divide", "plus", "root"].includes(element)) return false;
    } else if (["eq", "divide", "plus", "root"].includes(element)) {
      return false;
    } else {
      stack.push(element);
    }
  }
  return hasRoot && rootClosed && stack.length === 0;
}
