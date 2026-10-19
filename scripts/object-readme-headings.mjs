export default function objectReadmeHeadings() {
  return {
    name: "object-readme-headings",
    heading(heading, context) {
      if (!/(?:^|\/)objects\/[^/]+\/README(?:\.ja)?\.md$/.test(context.fileURL?.pathname ?? "")) {
        return;
      }

      const parent = context.parent(heading);
      if (parent?.type !== "root") return;
      const headings = parent.children.filter((node) => node.type === "heading");
      const title = headings[0];
      if (title?.depth !== 1 || headings.filter((node) => node.depth === 1).length !== 1) {
        throw new Error(`${context.fileURL}: Object READMEs must contain exactly one H1 as their first heading.`);
      }

      // ObjectLayout supplies the title and the enclosing documentation heading.
      if (heading.depth === 1) {
        context.removeNode(heading);
      } else {
        context.setProperty(heading, "depth", Math.min(heading.depth + 1, 6));
      }
    },
  };
}
