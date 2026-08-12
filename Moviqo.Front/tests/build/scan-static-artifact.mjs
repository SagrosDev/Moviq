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
  /127\.0\.0\.1:8000/i,
  /localhost:8000/i,
  /SECRET/i
];

const files = async (root) => {
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
};

const artifactFiles = await files(distRoot);
assert.ok(artifactFiles.length > 0, "Expected Vite to produce a static dist artifact.");
for (const publicAsset of ["favicon.ico", "moviqo-mark.svg", "legal/legal.css"]) {
  assert.ok(
    artifactFiles.includes(join(distRoot, publicAsset)),
    `Static artifact is missing the public brand asset: ${publicAsset}`
  );
}

const indexContent = await readFile(join(distRoot, "index.html"), "utf8");
assert.match(indexContent, /data-moviqo-critical-shell/);
assert.match(indexContent, /html, body, #root[^}]+background: #f8fafc/);
for (const marker of [
  'name="description"',
  'property="og:title"',
  'property="og:description"',
  'property="og:url"',
  'rel="canonical"',
  'rel="alternate"',
  'rel="icon" href="/favicon.ico"'
]) {
  assert.ok(indexContent.includes(marker), `index.html is missing required landing metadata: ${marker}`);
}
assert.ok(!/<script[^>]+src=["'][^"']*(analytics|track|marketing)/i.test(indexContent), "Non-essential tracker found in landing HTML.");

const localePages = [
  { path: "es/index.html", language: "es", alternate: "/en/", title: "Procesos claros" },
  { path: "en/index.html", language: "en", alternate: "/es/", title: "Clear processes" }
];
for (const localePage of localePages) {
  const content = await readFile(join(distRoot, localePage.path), "utf8");
  assert.match(content, /data-moviqo-critical-shell/);
  assert.match(content, /html, body, #root[^}]+background: #f8fafc/);
  assert.match(content, new RegExp(`<html[^>]+lang=["']${localePage.language}["']`, "i"));
  assert.match(content, new RegExp(`<title>Moviqo[^<]*${localePage.title}</title>`, "i"));
  assert.match(content, new RegExp(`rel=["']canonical["'][^>]+href=["'][^"']+/${localePage.language}/["']`, "i"));
  assert.match(content, new RegExp(`hreflang=["']${localePage.language === "es" ? "en" : "es"}["'][^>]+href=["'][^"']+${localePage.alternate}`, "i"));
}

for (const file of artifactFiles) {
  const content = await readFile(file, "utf8").catch(() => "");
  for (const pattern of forbiddenPatterns) {
    assert.ok(!pattern.test(content), `${file} contains forbidden private configuration text.`);
  }
}
