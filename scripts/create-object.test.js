import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createObject, createUuidV7 } from "./create-object.mjs";
import { uuidV7Pattern } from "../src/lib/objectIdentityValidation.mjs";

const roots = [];
const originalId = "01a15005-fe79-7ac4-bfaf-8b8e82577063";
const script = fileURLToPath(new URL("./create-object.mjs", import.meta.url));

function fixture(registry = []) {
  const root = mkdtempSync(join(tmpdir(), "libra-create-object-"));
  roots.push(root);
  mkdirSync(join(root, "objects"));
  writeFileSync(join(root, "objects/registry.json"), JSON.stringify(registry));
  return root;
}

function options(root) {
  return { root, slug: "triangular", name: "Triangular numbers", description: "Definitions and examples of triangular numbers." };
}

function read(root, path) {
  return readFileSync(join(root, "objects", path), "utf8");
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true });
});

describe("object:create", () => {
  it("issues RFC 9562 UUIDv7 values with the current millisecond timestamp", () => {
    const before = Date.now();
    const ids = Array.from({ length: 100 }, () => createUuidV7());
    const after = Date.now();
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(uuidV7Pattern);
      const timestamp = Number.parseInt(id.replaceAll("-", "").slice(0, 12), 16);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    }
  });

  it("creates linked metadata, registry and recommended README sections without fake data or implementation", () => {
    const root = fixture();
    const result = createObject({ ...options(root), conceptId: "triangularNumbers" });
    expect(result).toMatchObject({ slug: "triangular", created: true });
    expect(result.id).toMatch(uuidV7Pattern);
    expect(JSON.parse(read(root, "triangular/object.json"))).toEqual({
      type: "integer-sequence",
      id: result.id,
      conceptId: "triangularNumbers",
      seo: { title: "Triangular numbers — Data, functions and documentation | Libra", description: "Definitions and examples of triangular numbers." },
      relatedObjectIds: [],
    });
    expect(JSON.parse(read(root, "registry.json"))).toEqual([
      { id: result.id, slug: "triangular", type: "integer-sequence", previousSlugs: [] },
    ]);
    const readme = read(root, "triangular/README.md");
    for (const section of ["Details", "Examples", "Scope", "Generalizations and extensions", "Applications", "Properties and relations", "Possible issues", "Interesting examples", "References"]) {
      expect(readme).toContain(`## ${section}\n`);
    }
    expect(readme).toMatch(/^# Triangular numbers\n/);
    expect(readdirSync(join(root, "objects/triangular")).sort()).toEqual(["README.md", "object.json"]);
    expect(readdirSync(join(root, "objects")).sort()).toEqual(["registry.json", "triangular"]);
  });

  it("preserves hand-authored README and other files byte for byte", () => {
    const root = fixture();
    mkdirSync(join(root, "objects/triangular"));
    const authored = "# 三角数\r\n\r\n手作業の本文。\r\n";
    writeFileSync(join(root, "objects/triangular/README.md"), authored);
    writeFileSync(join(root, "objects/triangular/notes.txt"), "notes");
    createObject(options(root));
    expect(read(root, "triangular/README.md")).toBe(authored);
    expect(read(root, "triangular/notes.txt")).toBe("notes");
  });

  it("keeps existing identities and slug history while appending a registration", () => {
    const identity = { id: originalId, slug: "fibonacci", previousSlugs: ["fibonacci-numbers"] };
    const root = fixture([identity]);
    mkdirSync(join(root, "objects/fibonacci"));
    const metadata = JSON.stringify({ id: originalId, conceptId: "fibonacci" });
    writeFileSync(join(root, "objects/fibonacci/object.json"), metadata);
    const result = createObject(options(root));
    expect(JSON.parse(read(root, "registry.json"))).toEqual([
      identity, { id: result.id, slug: "triangular", type: "integer-sequence", previousSlugs: [] },
    ]);
    expect(read(root, "fibonacci/object.json")).toBe(metadata);
  });

  it("does not regenerate UUIDs or overwrite metadata on repeated invocation", () => {
    const root = fixture();
    const first = createObject(options(root));
    const registry = read(root, "registry.json");
    const metadata = read(root, "triangular/object.json");
    const readme = read(root, "triangular/README.md");
    expect(createObject({ ...options(root), name: "Different", description: "Different" })).toEqual({
      ...first, created: false,
    });
    expect(read(root, "registry.json")).toBe(registry);
    expect(read(root, "triangular/object.json")).toBe(metadata);
    expect(read(root, "triangular/README.md")).toBe(readme);
  });

  it.each(["../escape", "/tmp/outside", "Upper", "a/b", "trailing\n", "", undefined, originalId])("rejects invalid slug %s without writing", (slug) => {
    const root = fixture();
    expect(() => createObject({ ...options(root), slug })).toThrow(/slug/);
    expect(readdirSync(join(root, "objects"))).toEqual(["registry.json"]);
  });

  it.each(["name", "description", "conceptId"])("requires a nonempty single-line %s", (key) => {
    const root = fixture();
    for (const value of ["", "  ", "a\nb", "a\0b"]) {
      expect(() => createObject({ ...options(root), [key]: value })).toThrow(key);
    }
    expect(read(root, "registry.json")).toBe("[]");
  });

  it.each([
    { id: originalId, slug: "triangular", previousSlugs: [] },
    { id: originalId, slug: "renamed", previousSlugs: ["triangular"] },
  ])("rejects registered or retired slugs without reassigning them", (entry) => {
    const root = fixture([entry]);
    expect(() => createObject(options(root))).toThrow(/registered or retired/);
    expect(JSON.parse(read(root, "registry.json"))).toEqual([entry]);
    expect(readdirSync(join(root, "objects"))).toEqual(["registry.json"]);
  });

  it("rejects unregistered hand-written metadata rather than replacing its UUID", () => {
    const root = fixture();
    mkdirSync(join(root, "objects/triangular"));
    const metadata = JSON.stringify({ id: originalId });
    writeFileSync(join(root, "objects/triangular/object.json"), metadata);
    expect(() => createObject(options(root))).toThrow(/Inconsistent registration/);
    expect(read(root, "triangular/object.json")).toBe(metadata);
    expect(read(root, "registry.json")).toBe("[]");
  });

  it("rejects malformed existing metadata without creating a replacement", () => {
    const root = fixture();
    mkdirSync(join(root, "objects/triangular"));
    writeFileSync(join(root, "objects/triangular/object.json"), "{}");
    expect(() => createObject(options(root))).toThrow(/Invalid or duplicate object UUIDv7/);
    expect(read(root, "triangular/object.json")).toBe("{}");
    expect(read(root, "registry.json")).toBe("[]");
  });

  it("rejects mismatched and duplicate UUIDs", () => {
    const root = fixture([{ id: originalId, slug: "other", previousSlugs: [] }]);
    mkdirSync(join(root, "objects/triangular"));
    writeFileSync(join(root, "objects/triangular/object.json"), JSON.stringify({ id: originalId }));
    expect(() => createObject(options(root))).toThrow(/Inconsistent registration/);
    mkdirSync(join(root, "objects/other"));
    writeFileSync(join(root, "objects/other/object.json"), JSON.stringify({ id: originalId }));
    expect(() => createObject(options(root))).toThrow(/duplicate object UUIDv7/);
  });

  it("reports malformed registry data and removes its lock without touching content", () => {
    const root = fixture();
    writeFileSync(join(root, "objects/registry.json"), "{}");
    expect(() => createObject(options(root))).toThrow(/must be an array/);
    expect(read(root, "registry.json")).toBe("{}");
    expect(readdirSync(join(root, "objects"))).toEqual(["registry.json"]);
  });

  it("refuses a concurrent writer or stale lock", () => {
    const root = fixture();
    writeFileSync(join(root, "objects/.create-object.lock"), "another writer");
    expect(() => createObject(options(root))).toThrow(/EEXIST/);
    expect(read(root, ".create-object.lock")).toBe("another writer");
  });

  it.each(["directory", "README.md", "object.json", "registry.json"])("rejects a symlink at %s without touching its target", (location) => {
    const root = fixture();
    const outside = join(root, "outside");
    writeFileSync(outside, "do not change");
    if (location === "directory") {
      symlinkSync(root, join(root, "objects/triangular"), "dir");
    } else if (location === "registry.json") {
      rmSync(join(root, "objects/registry.json"));
      symlinkSync(outside, join(root, "objects/registry.json"));
    } else {
      mkdirSync(join(root, "objects/triangular"));
      symlinkSync(outside, join(root, "objects/triangular", location));
    }
    expect(() => createObject(options(root))).toThrow(/Symlinks|regular file/);
    expect(readFileSync(outside, "utf8")).toBe("do not change");
  });

  it("runs as a CLI, supports --root, and reports errors with a failing exit status", () => {
    const root = fixture();
    const args = ["--root", root, "--slug", "triangular", "--name", "三角数", "--description", "定義と例題"];
    const created = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
    expect(created.status, created.stderr).toBe(0);
    expect(created.stdout).toContain("Created: triangular");
    const repeated = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
    expect(repeated.status, repeated.stderr).toBe(0);
    expect(repeated.stdout).toContain("Already registered:");
    const invalid = spawnSync(process.execPath, [script, "--root", root], { encoding: "utf8" });
    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain("slug");
    const help = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("pnpm object:create");
  });

  it("shows usage and an example without arguments, without creating files", () => {
    const root = fixture();
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: pnpm object:create");
    expect(result.stdout).toContain("Example:");
    expect(result.stdout).not.toContain("undefined");
    expect(readdirSync(join(root, "objects"))).toEqual(["registry.json"]);
  });

  it.each([
    { args: [], missing: "--slug, --name, --description" },
    { args: ["--slug", "triangular"], missing: "--name, --description" },
    { args: ["--slug", "triangular", "--name", "三角数"], missing: "--description" },
    { args: ["--slug", "triangular", "--name", " ", "--description", "説明"], missing: "--name" },
  ])("reports missing required options for $args without creating files", ({ args, missing }) => {
    const root = fixture();
    const result = spawnSync(process.execPath, [script, "--root", root, ...args], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`Missing required options: ${missing}.`);
    expect(result.stderr).toContain("Usage: pnpm object:create");
    expect(result.stderr).not.toContain('Invalid object slug "undefined"');
    expect(readdirSync(join(root, "objects"))).toEqual(["registry.json"]);
  });
});
