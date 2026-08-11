import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formDesignPath,
  readWorkflowCatalog,
  readWorkflowDraftSnapshot,
  resolveTaskElement,
  workflowDesignPath,
  workflowTaskElements,
  type WorkflowDraftDocument
} from "../../src/features/workflow-design";
import { shouldAcceptWorkflowSnapshot } from "../../src/pages/workflow-design/ui/WorkflowDesignPage";

const draft: WorkflowDraftDocument = {
  schemaVersion: 1,
  draftId: "draft-1",
  workflowId: "workflow-1",
  name: "Approvals",
  status: "draft",
  connections: [],
  elements: [
    { id: "start-1", type: "start", label: "Start" },
    { id: "task-1", type: "task", label: "Review" },
    { id: "end-1", type: "end", label: "End" }
  ],
  processFields: [],
  formBindings: []
};

test("workflow creation and task selection resolve canonical authoring destinations", () => {
  assert.equal(workflowDesignPath("workflow-1"), "/workflows/workflow-1/design");
  assert.equal(
    formDesignPath("workflow-1", "task-1"),
    "/workflows/workflow-1/tasks/task-1/form"
  );
});

test("form launcher exposes tasks only from the selected authorized workflow draft", () => {
  assert.deepEqual(workflowTaskElements(draft), [
    { id: "task-1", type: "task", label: "Review" }
  ]);
  assert.deepEqual(resolveTaskElement(draft, "task-1"), {
    id: "task-1",
    type: "task",
    label: "Review"
  });
  assert.equal(resolveTaskElement(draft, "start-1"), null);
  assert.equal(resolveTaskElement(draft, "stale-task"), null);
});

test("workflow query revisions are accepted only while the editor is clean", () => {
  assert.equal(shouldAcceptWorkflowSnapshot(null, null, "workflow-1", "1", false), true);
  assert.equal(shouldAcceptWorkflowSnapshot("workflow-1", "1", "workflow-1", "2", false), true);
  assert.equal(shouldAcceptWorkflowSnapshot("workflow-1", "1", "workflow-1", "2", true), false);
  assert.equal(shouldAcceptWorkflowSnapshot("workflow-1", "2", "workflow-1", "2", false), false);
  assert.equal(shouldAcceptWorkflowSnapshot("workflow-1", "2", "workflow-2", "2", true), true);
});

test("workflow catalog and draft reads use the existing authorized endpoints", async () => {
  const requestedPaths: string[] = [];
  const fetchImplementation = async (request: Request) => {
    const pathname = new URL(request.url).pathname;
    requestedPaths.push(pathname);
    if (pathname.endsWith("/draft/")) {
      return new Response(JSON.stringify({
        workflowId: "workflow-1",
        organizationId: "organization-1",
        createdByMembershipId: "membership-1",
        configurationDirectory: { memberships: [], teams: [] },
        name: "Approvals",
        revision: "1",
        draft
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  assert.deepEqual(await readWorkflowCatalog(fetchImplementation), { ok: true, data: { items: [] } });
  const detail = await readWorkflowDraftSnapshot("workflow-1", fetchImplementation);
  assert.equal(detail.ok, true);

  assert.deepEqual(requestedPaths, [
    "/api/v1/workflow-design/workflows/",
    "/api/v1/workflow-design/workflows/workflow-1/draft/"
  ]);
});

test("workflow draft reads default omitted publication children", async () => {
  const fetchImplementation = async () => new Response(JSON.stringify({
    workflowId: "workflow-1",
    organizationId: "organization-1",
    createdByMembershipId: "membership-1",
    configurationDirectory: { memberships: [], teams: [] },
    name: "Approvals",
    revision: "1",
    draft: { ...draft, publication: {} }
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  const result = await readWorkflowDraftSnapshot("workflow-1", fetchImplementation);
  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("expected workflow draft read to succeed");
  assert.equal(result.data.draft.publication?.starter.mode, "unconfigured");
  assert.equal(result.data.draft.publication?.assignment.mode, "unconfigured");
});
