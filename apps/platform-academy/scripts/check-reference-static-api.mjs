import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const generatedFiles = [
  "public/static-api/platform-academy-resources.json",
  "public/api/platform-academy/resources",
  "public/static-api/platform-academy-interview-prep.json",
  "public/api/platform-academy/interview-prep"
];

async function digest(relativePath) {
  try {
    const body = await readFile(join(ROOT, relativePath));
    return createHash("sha256").update(body).digest("hex");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

const before = new Map();
for (const file of generatedFiles) before.set(file, await digest(file));

await import("./sync-reference-static-api.mjs");

const changed = [];
for (const file of generatedFiles) {
  if (before.get(file) !== await digest(file)) changed.push(file);
}

if (changed.length) {
  console.error("Generated static API snapshots were out of date:");
  for (const file of changed) console.error(`- ${file}`);
  console.error("Run npm run sync:reference-static-api and commit the updated snapshots.");
  process.exitCode = 1;
} else {
  console.log("Reference static API snapshots are up to date.");
}
