---
title: 'Streamline Workflow publishing and canvas editing'
type: 'feature'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 1
baseline_commit: '399735d2538d38b08cfb75817afb1f83f9d85b1d'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-36-task-names-compact-nodes.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-36-persist-compact-canvas-layout.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The separate Validate Publication action adds an unnecessary step before publishing. The canvas also has connector gaps, no arrows, oversized visible ports, limited height, a redundant connection form, and no way to remove non-Start objects. Assignment is incorrectly modeled as one global first-task setting instead of a property of every Task.

**Approach:** Keep two independent commands: Save Draft saves progress only; Publish Version atomically validates and publishes the current design without requiring a prior save or validation action. Move assignment into each Task’s Properties and use it when that Task becomes active. Refine the canvas connectors and height, replace the visible sequence form with keyboard-operable handles, and add confirmed deletion for Task/End.

## Boundaries & Constraints

**Always:** Preserve revision tokens, per-command idempotency keys, immutable publication, server validation, conflict recovery, and the authoritative reducer document. Publish must validate and persist/publish the submitted document atomically against the expected revision; blockers change nothing and populate the actionable checklist. Per-Task assignment must determine the real TaskOccurrence assignee when reached. Start remains undeletable. Deleting Task/End removes its connections, position, and bindings without deleting reusable field definitions. Keep bilingual copy, focus/error behavior, and 44px targets.

**Ask First:** Removing Save Draft or Publish Version, deleting Start, introducing team/role/dynamic assignment modes, adding branches/cycles, or deleting reusable fields with a Task.

**Never:** Reintroduce a standalone Validate Publication action; publish stale content; partially save a failed Publish command; background-autosave ordinary edits; keep a duplicate global assignment source; remove the keyboard connection path; weaken deletion confirmation; add Conditional Routing; or shrink usable connector targets.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Save at any time | Dirty valid draft | Save only; no validation or publication | Existing save/conflict recovery applies |
| Publish at any time | Dirty or saved local draft | Atomically validate and publish submitted design against expected revision | Blockers populate checklist; conflict/transport failure changes nothing |
| Assign each Task | Initiator or active specific member | Selected Task stores its own assignment; runtime assigns it when reached | Unconfigured/inactive assignee blocks publication and targets that Task |
| Delete Task/End | Selected non-Start node, confirmed | Remove node, incident edges, layout entry, and its bindings; mark dirty | Cancel preserves everything; Start has no delete action |
| Keyboard connection | Focus source handle, activate; focus target, activate | Same authoritative connection command as pointer drag | Invalid route uses localized rejection feedback |
| Compact edge | Connected nodes | Line reaches smaller visible ports and ends with an arrow | Hit target remains at least 44px |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` and serializers — schema v7 per-Task assignment with v6 first-task upcast.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_configuration.py` and validation — validate starter globally and assignment/form readiness per Task.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/start_process.py` and `complete_task.py` — resolve each reached Task’s assignee and advance linear Task paths.
- Workflow Design API views/services — atomically validate and publish a submitted draft without changing Save semantics.
- `Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts` — independent Save Draft and Publish Version commands.
- `Moviqo.Front/src/features/workflow-design/model/editor.ts` — per-Task assignment, authoritative removal, and action state.
- `Moviqo.Front/src/features/workflow-design/model/flow.ts` — arrow marker and edge presentation metadata.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowEditorActions.tsx` — optional Save plus single primary Publish action/progress.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx` — aligned compact ports, arrows, keyboard connection gesture, and larger workspace.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowProperties.tsx` — Task assignment, confirmed deletion, and no sequence form.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowPublicationConfiguration.tsx` — starter eligibility only, with contextual help.
- `Moviqo.Front/src/app/styles.css` and localization catalog — tokenized sizes and bilingual guidance.
- Frontend unit/E2E tests — orchestration, cascade deletion, keyboard/pointer connections, geometry, and help copy.

## Tasks & Acceptance

**Execution:**
- [x] Schema/runtime/OpenAPI — move global assignment to schema v7 Task elements, upcast safely, validate every Task, resolve assignees, and advance linear Task-to-Task execution.
- [x] API/controller/action bar — expose only independent Save Draft and Publish Version actions; Publish atomically validates and publishes the submitted current draft.
- [x] Reducer/Properties — configure assignment on the selected Task; add confirmed Task/End deletion and clean dependent references while preserving Start/reusable fields.
- [x] Canvas/flow/styles — close endpoint gaps, add terminal arrows, reduce visible ports, preserve 44px hit areas, add keyboard connection handling, and increase canvas height.
- [x] Properties/localization — remove the visible sequence form and add reviewed Spanish/English starter/per-Task assignment explanations.
- [x] Tests — prove atomic Publish never partially saves validation failures, plus v6 upcast, per-Task assignment/runtime, deletion, keyboard/pointer connection, geometry, arrows, and height.

**Acceptance Criteria:**
- Given any idle design state, when Save Draft or Publish Version is selected, then it is available without requiring another button first.
- Given blockers or a stale revision, when Publish is selected, then no draft or published version is changed and localized recovery/checklist guidance remains actionable.
- Given multiple connected Tasks with configured assignees, when a process reaches each Task, then the published Task assignment determines its real assignee and completion advances to the next Task or End.
- Given a selected Task or End, when deletion is confirmed, then the draft removes the node and dependent references, becomes dirty, and Start remains present and undeletable.
- Given pointer or keyboard-only use, when nodes are connected, then both paths create the same validated sequence connection without the visible Properties connection form.
- Given the canvas at normal zoom, when a connection renders, then it reaches each compact port, ends with an arrow, and the invisible port target remains at least 44px.
- Given publication configuration in Spanish or English, when the two choices are read, then starter eligibility is clearly distinguished from first-task ownership.

## Spec Change Log

- 2026-08-12: Adversarial review fixed command races, disabled keyboard edits, Task-specific recovery IDs, legacy runtime compatibility, process-value handoff, and Save-only semantics. Deferred the pre-existing Form Designer placeholder to `deferred-work.md`.

## Design Notes

Save and Publish remain distinct commands. Publication is one atomic backend command over the submitted draft and expected revision: it either validates, persists, and publishes together, or changes nothing while returning actionable blockers. Schema v7 moves assignment onto Task elements; the v6 upcast transfers the old global assignment to the first connected Task and defaults other Tasks to unconfigured. Old published snapshots retain legacy first-task resolution, while v7 runtime follows per-Task assignment. Keyboard connection uses focusable handles so removing the select form does not remove a non-drag path.

## Verification

**Commands:**
- `npm run typecheck`, `npm run test:unit`, and `npm run test:architecture` — orchestration, reducer, localization, and boundaries pass.
- Focused backend design/runtime tests — v6 upcast, per-Task validation/assignment, and linear Task advancement pass.
- Focused Chromium Workflow Editor E2E — two-action workflow, atomic direct publication, Task assignment, deletion, connection gestures, geometry, and help copy pass.
- `npm run build` and `git diff --check` — production artifact and formatting remain valid.

## Suggested Review Order

**Atomic publication and schema**

- Start with the transactional submitted-draft validation, persistence, and immutable version boundary.
  [`services.py:671`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py#L671)

- Follow the v6-to-v7 assignment migration that preserves legacy first-task intent.
  [`schema.py:297`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py#L297)

- Review Task-specific publication blockers and task-neutral form readiness issues.
  [`publication_validation.py:11`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py#L11)

- Confirm partial v7 submissions preserve authoritative Task assignments.
  [`services.py:1289`](../../Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py#L1289)

**Runtime handoff**

- Resolve each reached Task independently while retaining pre-v7 compatibility.
  [`task_assignment.py:11`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_assignment.py#L11)

- Advance linear Tasks atomically and reject unavailable routes before completion.
  [`complete_task.py:69`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/complete_task.py#L69)

- Carry reusable process-field values into each downstream Task occurrence.
  [`task_form.py:413`](../../Moviqo.Back/src/moviqo/modules/workflow_runtime/application/task_form.py#L413)

**Editor orchestration and interaction**

- Compare independent Save and direct Publish orchestration with shared race guards.
  [`useWorkflowDraftEditor.ts:41`](../../Moviqo.Front/src/features/workflow-design/model/useWorkflowDraftEditor.ts#L41)

- Verify Save availability excludes Publish and revision-recovery races.
  [`editor.ts:1098`](../../Moviqo.Front/src/features/workflow-design/model/editor.ts#L1098)

- Inspect pointer and guarded keyboard handles on the taller compact canvas.
  [`WorkflowCanvas.tsx:57`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowCanvas.tsx#L57)

- Review selected-Task assignment and focus-managed confirmed deletion.
  [`WorkflowProperties.tsx:26`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowProperties.tsx#L26)

- Confirm only Save Draft and Publish Version remain in the action bar.
  [`WorkflowEditorActions.tsx:145`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowEditorActions.tsx#L145)

- Check Task-neutral, bilingual publication recovery actions.
  [`WorkflowPublicationChecklist.tsx:27`](../../Moviqo.Front/src/features/workflow-design/ui/WorkflowPublicationChecklist.tsx#L27)

**Verification**

- Exercise direct dirty publication and its atomic failure contract.
  [`test_workflow_design_contract.py:1`](../../Moviqo.Back/tests/contract/test_workflow_design_contract.py#L1)

- Prove real downstream assignment and process-field continuity.
  [`test_task_form_contract.py:1`](../../Moviqo.Back/tests/contract/test_task_form_contract.py#L1)

- Walk the complete keyboard, pointer, save, reload, delete, and publish journey.
  [`workflow-editor.spec.ts:29`](../../Moviqo.Front/tests/e2e/workflow-editor.spec.ts#L29)
