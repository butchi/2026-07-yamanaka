import { randomBytes } from "node:crypto";
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  renameSync, rmdirSync, unlinkSync, writeFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { uuidV7Pattern, validateObjectIdentities, validateObjectSlug } from "../src/lib/objectIdentityValidation.mjs";

export function createUuidV7() {
  const bytes = randomBytes(16);
  bytes.writeUIntBE(Date.now(), 0, 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function requireRegularFile(path) {
  if (!lstatSync(path).isFile()) throw new Error(`Expected a regular file: ${path}`);
}

function readJson(path) {
  requireRegularFile(path);
  return JSON.parse(readFileSync(path, "utf8"));
}

function requireDirectory(path) {
  if (!lstatSync(path).isDirectory()) throw new Error(`Expected a directory, not a symlink: ${path}`);
}

function readmeTemplate(name) {
  return `# ${name}

<!-- 「詳細」を記入し、他の見出しは内容があるものだけ残してください。 -->

## 詳細

<!-- 定義、概要、出典を記入してください。 -->

## 例題

## スコープ

## 一般化と拡張

## アプリケーション

## 特性と関係

## 考えられる問題

## おもしろい例題

## 出典
`;
}

export function createObject({ root, slug, name, description, conceptId = slug }) {
  validateObjectSlug(slug);
  for (const [key, value] of Object.entries({ name, description, conceptId })) {
    if (typeof value !== "string" || !value.trim() || /[\r\n\0]/.test(value)) {
      throw new Error(`${key} must be a non-empty single-line string.`);
    }
  }
  const objects = join(resolve(root), "objects");
  requireDirectory(objects);
  const registryPath = join(objects, "registry.json");
  const directory = join(objects, slug);
  const metadataPath = join(directory, "object.json");
  const readmePath = join(directory, "README.md");
  const lockPath = join(objects, ".create-object.lock");
  // Serialize local writers; a leftover lock requires inspection rather than a new UUID.
  writeFileSync(lockPath, "", { flag: "wx" });
  const createdFiles = [];
  let createdDirectory = false;
  let registryTemporary;
  try {
    const registry = validateObjectIdentities(readJson(registryPath));
    const metadata = [];
    for (const entry of readdirSync(objects, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error(`Symlinks are not supported in objects/: ${entry.name}`);
      if (!entry.isDirectory()) continue;
      const path = join(objects, entry.name, "object.json");
      if (readdirSync(join(objects, entry.name)).includes("object.json")) {
        metadata.push({ directory: entry.name, data: readJson(path) });
      }
    }
    const seenIds = new Set();
    for (const entry of metadata) {
      if (!entry.data || typeof entry.data.id !== "string" || !uuidV7Pattern.test(entry.data.id) || seenIds.has(entry.data.id)) {
        throw new Error(`Invalid or duplicate object UUIDv7 in objects/${entry.directory}/object.json.`);
      }
      seenIds.add(entry.data.id);
    }
    const existing = metadata.find((entry) => entry.directory === slug);
    const identity = registry.find((entry) => entry.slug === slug || entry.previousSlugs.includes(slug));
    if (existing) {
      if (!identity || identity.slug !== slug || identity.id !== existing.data.id) {
        throw new Error(`Inconsistent registration for "${slug}"; no files were changed.`);
      }
      if (existsSync(readmePath)) requireRegularFile(readmePath);
      else throw new Error(`Registered object "${slug}" is missing README.md.`);
      return { id: identity.id, slug, created: false };
    }
    if (identity) throw new Error(`Slug "${slug}" is already registered or retired.`);
    if (existsSync(directory)) requireDirectory(directory);
    else {
      mkdirSync(directory);
      createdDirectory = true;
    }
    if (readdirSync(directory).includes("README.md")) requireRegularFile(readmePath);
    const id = createUuidV7();
    if (seenIds.has(id) || registry.some((entry) => entry.id === id)) {
      throw new Error("Generated UUID already exists; retry creation.");
    }
    const data = {
      id,
      conceptId: conceptId.trim(),
      seo: { title: `${name.trim()} — データ・関数・解説｜Libra`, description: description.trim() },
      relatedObjectIds: [],
    };
    writeFileSync(metadataPath, `${JSON.stringify(data, null, 2)}\n`, { flag: "wx" });
    createdFiles.push(metadataPath);
    if (!existsSync(readmePath)) {
      writeFileSync(readmePath, readmeTemplate(name.trim()), { flag: "wx" });
      createdFiles.push(readmePath);
    }
    registryTemporary = join(objects, `.registry-${randomBytes(8).toString("hex")}.tmp`);
    writeFileSync(registryTemporary, `${JSON.stringify([...registry, { id, slug, previousSlugs: [] }], null, 2)}\n`, { flag: "wx" });
    renameSync(registryTemporary, registryPath);
    registryTemporary = undefined;
    return { id, slug, created: true };
  } catch (error) {
    for (const path of createdFiles.reverse()) unlinkSync(path);
    if (registryTemporary && existsSync(registryTemporary)) unlinkSync(registryTemporary);
    if (createdDirectory) rmdirSync(directory);
    throw error;
  } finally {
    unlinkSync(lockPath);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const usage = `Usage: pnpm object:create --slug <slug> --name <name> --description <description> [--concept-id <id>] [--root <repository>]

Required:
  --slug         Object slug / directory (e.g. triangular)
  --name         Display name
  --description  SEO description

Example:
  pnpm object:create --slug triangular --name "三角数" --description "三角数の定義、性質、例題を紹介します。"`;
  try {
    const { values } = parseArgs({
      options: {
        slug: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        "concept-id": { type: "string" },
        root: { type: "string", default: fileURLToPath(new URL("../", import.meta.url)) },
        help: { type: "boolean" },
      },
    });
    if (values.help || process.argv.length === 2) {
      console.log(usage);
    } else {
      const missing = ["slug", "name", "description"].filter((key) => !values[key]?.trim());
      if (missing.length > 0) {
        throw new Error(`Missing required options: ${missing.map((key) => `--${key}`).join(", ")}.\n\n${usage}`);
      }
      const result = createObject({
        root: values.root, slug: values.slug, name: values.name,
        description: values.description, conceptId: values["concept-id"] ?? values.slug,
      });
      console.log(`${result.created ? "Created" : "Already registered"}: ${result.slug} (${result.id})`);
      console.log("Draft only: complete the README, datasets, implementation and calculation adapter before publishing.");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
