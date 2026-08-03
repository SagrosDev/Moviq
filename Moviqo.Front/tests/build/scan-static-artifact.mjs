import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const distRoot = fileURLToPath(new URL("../../dist/", import.meta.url));
const forbiddenPatterns = [
  /MOVIQO_SECRET_KEY/i,
  /MOVIQO_DB_PASSWORD/i,
  /DATABASE_URL/i,
  /PRIVATE_KEY/i,
  /BEGIN RSA PRIVATE KEY/i,
  /VITE_SERVER_/i,
  /SECRET/i
];

async function files(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await files(path)));
    } else {
      result.push(path);
    }
  }

  return result;
}

const artifactFiles = await files(distRoot);
assert.ok(artifactFiles.length > 0, "Expected Vite to produce a static dist artifact.");

for (const file of artifactFiles) {
  const content = await readFile(file, "utf8").catch(() => "");
  for (const pattern of forbiddenPatterns) {
    assert.ok(!pattern.test(content), `${file} contains forbidden private configuration text.`);
  }
}
