import katex from "katex";

export default function latexMath() {
  const render = (node, displayMode) => ({
    rawHtml: katex.renderToString(node.value, {
      displayMode,
      throwOnError: true,
      strict: "error",
      trust: false,
    }),
  });
  return {
    name: "latex-math",
    math: (node) => render(node, true),
    inlineMath: (node) => render(node, false),
  };
}
