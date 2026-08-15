import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const readSource = (relativePath: string) => readFileSync(
  join(process.cwd(), relativePath),
  "utf8"
);

test("Mi trabajo opens the task module directly with a sibling process tab", () => {
  const routesSource = readSource("src/app/router/routes.tsx");
  const pageSource = readSource("src/pages/my-work/ui/MyWorkPage.tsx");
  const featureIndexSource = readSource("src/features/my-work/index.ts");

  assert.match(routesSource, /path:\s*"my-work"[^\n]*module="tasks"/);
  assert.match(pageSource, /href="\/my-work\/tasks"/);
  assert.match(pageSource, /href="\/my-work\/processes"/);
  assert.doesNotMatch(pageSource, /MyWorkOverview|data-dashboard-summary/);
  assert.doesNotMatch(featureIndexSource, /MyWorkOverview/);
});

test("workflow catalog distinguishes load failure from an empty catalog", () => {
  const source = readSource("src/pages/workflow-catalog/ui/WorkflowCatalogPage.tsx");

  assert.match(source, /query\.isError[\s\S]*query\.refetch/);
  assert.doesNotMatch(source, /query\.isError\s*\|\|\s*isEmpty/);
});

test("editor feedback announces each accepted add exactly once", () => {
  const workflowSource = readSource("src/features/workflow-design/ui/WorkflowDraftEditor.tsx");
  const formSource = readSource("src/features/form-design/ui/FormDesignerWorkspace.tsx");

  assert.match(workflowSource, /aria-live="polite"[\s\S]*data-workflow-add-feedback/);
  assert.match(workflowSource, /<Alert tone="success">[\s\S]*data-workflow-add-feedback/);
  assert.doesNotMatch(workflowSource, /<Alert announcement="polite" tone="success">[\s\S]*data-workflow-add-feedback/);
  assert.match(formSource, /key=\{addFeedbackSequence\} announcement="polite"/);
});
