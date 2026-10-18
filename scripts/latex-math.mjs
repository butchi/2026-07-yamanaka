import katex from "katex";

export default function latexMath() {
  const render = (node, displayMode) => {
    let source = node.value;
    if (!displayMode && source.startsWith("`") && source.endsWith("`")) {
      source = source.slice(1, -1);
    }
    return {
      type: "html",
      value: katex.renderToString(source, {
        displayMode,
        throwOnError: true,
        strict: "error",
        trust: false,
      }),
    };
  };
  return {
    name: "latex-math",
    math: (node) => render(node, true),
    inlineMath: (node) => render(node, false),
  };
}
