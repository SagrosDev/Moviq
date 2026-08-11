import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { test } from "node:test";

const srcRoot = join(process.cwd(), "src");
const layers = ["shared", "entities", "features", "pages", "app"];
const prohibitedImports = {
  shared: ["entities", "features", "pages", "app"],
  entities: ["features", "pages", "app"],
  features: ["pages", "app"],
  pages: ["app"],
  app: []
};

const sourceFiles = async (root) => {
  const entries = await readdir(root, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await sourceFiles(path)));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      result.push(path);
    }
  }

  return result;
};

const layerFor = (file) => {
  return relative(srcRoot, file).split(sep)[0];
};

const importedSpecifiers = (content) => {
  const specs = [];
  const importPattern = /import\s+(?:type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;
  const exportPattern = /export\s+(?:type\s+)?[^"';]*?\s+from\s+["']([^"']+)["']/g;
  const dynamicImportPattern = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const pattern of [importPattern, exportPattern, dynamicImportPattern]) {
    let match;
    while ((match = pattern.exec(content))) {
      specs.push(match[1]);
    }
  }

  return specs;
};

const resolveLayer = (importer, specifier) => {
  const resolved = resolveSrcSegments(importer, specifier);
  return resolved && layers.includes(resolved[0]) ? resolved[0] : null;
};

const resolveSrcSegments = (importer, specifier) => {
  if (specifier.startsWith("@/")) {
    return specifier.slice(2).split("/");
  }

  if (!specifier.startsWith(".")) {
    return null;
  }

  return relative(srcRoot, join(dirname(importer), specifier)).split(sep);
};

const featureNameFor = (file) => {
  const segments = relative(srcRoot, file).split(sep);
  return segments[0] === "features" ? segments[1] : null;
};

const isFeaturePublicEntryImport = (importer, specifier) => {
  const resolved = resolveSrcSegments(importer, specifier);
  if (!resolved || resolved[0] !== "features") {
    return true;
  }

  const featureName = resolved[1];
  if (layerFor(importer) === "features" && featureNameFor(importer) === featureName) {
    return true;
  }

  return (
    resolved.length === 2 ||
    (resolved.length === 3 && ["index", "index.ts", "index.tsx"].includes(resolved[2]))
  );
};

test("import scanner covers static, side-effect, re-export, and dynamic imports", () => {
  assert.deepEqual(
    importedSpecifiers(`
      import { App } from "../../app";
      import "../../app/setup";
      export { HomePage } from "../../pages/home";
      await import("../../features/workflow/internal/state");
    `),
    ["../../app", "../../app/setup", "../../pages/home", "../../features/workflow/internal/state"]
  );
});

test("feature-sliced layers only import downward", async () => {
  const violations = [];

  for (const file of await sourceFiles(srcRoot)) {
    const importerLayer = layerFor(file);
    if (!layers.includes(importerLayer)) {
      continue;
    }

    const content = await readFile(file, "utf8");
    for (const specifier of importedSpecifiers(content)) {
      const targetLayer = resolveLayer(file, specifier);
      if (targetLayer && prohibitedImports[importerLayer].includes(targetLayer)) {
        violations.push(
          `${relative(process.cwd(), file)} imports ${targetLayer} through '${specifier}'; ` +
            `${importerLayer} may only depend on lower layers.`
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("feature consumers use public feature entry points", async () => {
  const violations = [];

  for (const file of await sourceFiles(srcRoot)) {
    const importerLayer = layerFor(file);
    if (!["app", "pages", "features"].includes(importerLayer)) {
      continue;
    }

    const content = await readFile(file, "utf8");
    for (const specifier of importedSpecifiers(content)) {
      const resolved = resolveSrcSegments(file, specifier);
      if (!resolved || resolved[0] !== "features") {
        continue;
      }

      const featureName = resolved[1];
      if (!isFeaturePublicEntryImport(file, specifier)) {
        violations.push(
          `${relative(process.cwd(), file)} deep-imports ${specifier}; use ` +
            `src/features/${featureName}/index.ts instead.`
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("cross-feature consumers must use public feature entry points", () => {
  assert.equal(
    isFeaturePublicEntryImport(
      join(srcRoot, "features", "workflow", "ui", "WorkflowPanel.tsx"),
      "../../authority-preview/model/nonAuthoritativeUi"
    ),
    false
  );
  assert.equal(
    isFeaturePublicEntryImport(
      join(srcRoot, "features", "workflow", "ui", "WorkflowPanel.tsx"),
      "../model/workflowState"
    ),
    true
  );
});

test("application routing stays declarative and does not regrow pathname comparisons", async () => {
  const appEntry = await readFile(join(srcRoot, "app", "ui", "App.tsx"), "utf8");
  const routeConfig = await readFile(join(srcRoot, "app", "router", "routes.tsx"), "utf8");

  assert.doesNotMatch(appEntry, /window\.location\.pathname|normalizeAppPath|match[A-Z]\w*Path/);
  assert.match(appEntry, /RouterProvider/);
  assert.match(routeConfig, /AuthenticatedLayout/);
  assert.match(routeConfig, /:workflowId\/tasks\/:taskElementId\/form/);
});

test("pages do not deep-import sibling pages", async () => {
  const violations = [];

  for (const file of await sourceFiles(join(srcRoot, "pages"))) {
    const content = await readFile(file, "utf8");
    const importerPage = relative(srcRoot, file).split(sep)[1];
    for (const specifier of importedSpecifiers(content)) {
      const resolved = resolveSrcSegments(file, specifier);
      if (resolved?.[0] === "pages" && resolved[1] !== importerPage) {
        violations.push(`${relative(process.cwd(), file)} imports sibling page '${specifier}'.`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("editor features keep mutable documents out of global Context", async () => {
  const violations = [];
  const editorFeatures = ["workflow-design", "form-design", "task-form"];

  for (const feature of editorFeatures) {
    const featureRoot = join(srcRoot, "features", feature);
    try {
      for (const file of await sourceFiles(featureRoot)) {
        const content = await readFile(file, "utf8");
        if (/createContext\s*\(/.test(content)) {
          violations.push(relative(process.cwd(), file));
        }
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  assert.deepEqual(violations, []);
});

test("TanStack Query is the only server-state cache", async () => {
  const violations = [];

  for (const file of await sourceFiles(srcRoot)) {
    const content = await readFile(file, "utf8");
    if (/queryRegistry|createQueryRegistry/.test(content)) {
      violations.push(relative(process.cwd(), file));
    }
  }

  assert.deepEqual(violations, []);
});
