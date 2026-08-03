import { mkdir, writeFile } from "node:fs/promises";

await mkdir(new URL("../../.test-build/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../../.test-build/package.json", import.meta.url),
  JSON.stringify({ type: "commonjs" }, null, 2),
  "utf8"
);
