import { describe, expect, it } from "vitest";
import { satteri } from "@astrojs/markdown-satteri";
import objectReadmeHeadings from "./object-readme-headings.mjs";

const renderer = await satteri({
  mdastPlugins: [objectReadmeHeadings()],
}).createRenderer({ syntaxHighlight: false });
const file = { fileURL: new URL("file:///project/objects/fibonacci/README.md") };

describe("object README headings", () => {
  it("applies the same heading rules to Japanese translations", async () => {
    const result = await renderer.render("# 日本語\n\n## 詳細\n\n本文\n", {
      fileURL: new URL("file:///project/objects/fibonacci/README.ja.md"),
    });
    expect(result.code).not.toContain("<h1");
    expect(result.metadata.headings.map(({ depth }) => depth)).toEqual([3]);
  });
  it("omits the title and nests sections under the layout heading", async () => {
    const result = await renderer.render("# Title\n\nText\n\n## Notes\n\n### Example\n", file);
    expect(result.code).not.toContain("<h1");
    expect(result.code).toContain("<p>Text</p>");
    expect(result.metadata.headings.map(({ depth }) => depth)).toEqual([3, 4]);
  });

  it.each([
    "## Missing title\n",
    "# First title\n\n# Second title\n",
    "## Section\n\n# Late title\n",
  ])("rejects invalid title structure: %s", async (source) => {
    await expect(renderer.render(source, file)).rejects.toThrow(/exactly one H1/);
  });

  it("does not interpret code examples as document headings", async () => {
    const result = await renderer.render("# Title\n\n```text\n# Example\n```\n", file);
    expect(result.code).not.toContain("<h1");
    expect(result.code).toContain("# Example");
  });

  it("caps heading depth at six", async () => {
    const result = await renderer.render("# Title\n\n###### Detail\n", file);
    expect(result.metadata.headings.map(({ depth }) => depth)).toEqual([6]);
  });

  it("leaves other Markdown unchanged", async () => {
    const result = await renderer.render("# Title\n\n## Notes\n", {
      fileURL: new URL("file:///project/README.md"),
    });
    expect(result.metadata.headings.map(({ depth }) => depth)).toEqual([1, 2]);
  });
});
