import { describe, expect, it } from "vitest";
import { satteri } from "@astrojs/markdown-satteri";
import latexMath from "./latex-math.mjs";

const renderer = await satteri({
  features: { math: true },
  mdastPlugins: [latexMath()],
}).createRenderer({ syntaxHighlight: false });

describe("LaTeX math rendering", () => {
  it("renders GitHub backtick-delimited inline math alongside code", async () => {
    const result = await renderer.render("`range(79)` は $`F_{79}`$ まで。");
    expect(result.code).toContain("<code>range(79)</code>");
    expect(result.code).toContain('encoding="application/x-tex">F_{79}</annotation>');
    expect(result.code).not.toContain("`F");
    expect(result.code.match(/<p>/g)).toHaveLength(1);
  });

  it("renders inline and display math at build time", async () => {
    const result = await renderer.render("Inline $n^2$.\n\n$$\nF_n = F_{n-1} + F_{n-2}\n$$\n");
    expect(result.code).toContain('class="katex"');
    expect(result.code).toContain('class="katex-display"');
    expect(result.code).toContain("<math");
    expect(result.code).toContain('encoding="application/x-tex"');
    expect(result.code).not.toContain("$$");
  });

  it("leaves code examples unchanged", async () => {
    const result = await renderer.render("`$n^2$`\n\n```text\n$$x$$\n```\n");
    expect(result.code).not.toContain('class="katex"');
    expect(result.code).toContain("$n^2$");
    expect(result.code).toContain("$$x$$");
  });

  it("fails explicitly on invalid LaTeX", async () => {
    await expect(renderer.render("$\\invalidcommand$")).rejects.toThrow();
    await expect(renderer.render("$`\\invalidcommand`$")).rejects.toThrow();
  });
});
