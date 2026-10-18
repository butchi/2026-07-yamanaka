import { build } from "esbuild";

export async function compileObjectModule(source: string, format: "global" | "module") {
  const result = await build({
    stdin: {
      contents: source,
      loader: "js",
      resolveDir: process.cwd(),
      sourcefile: "functions.source.js",
    },
    bundle: true,
    write: false,
    format: format === "global" ? "iife" : "esm",
    globalName: format === "global" ? "__libraObjectApi" : undefined,
    target: "es2022",
  });
  const output = result.outputFiles[0]?.text;
  if (output === undefined) {
    throw new Error(`Failed to compile object module as ${format}.`);
  }
  if (format === "module") return output;

  return `${output}
globalThis.libra = {
  number: { ...globalThis.libra?.number, ...__libraObjectApi.number },
  bigint: { ...globalThis.libra?.bigint, ...__libraObjectApi.bigint },
};
`;
}
