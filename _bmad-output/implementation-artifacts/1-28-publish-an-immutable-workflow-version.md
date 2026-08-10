---
baseline_commit: 397d75e
---

# Story 1.28: Publish an Immutable Workflow Version

Status: done

> **Persistence-policy amendment (2026-08-10):** Autosave references below are retained as historical implementation context. Current authoring uses explicit **Save draft**/`Ctrl/Cmd+S`; publication accepts only the same saved revision that passed explicit publication-readiness validation, with no intervening local changes and no background save or retry. Story 1.36 implements this corrected frontend/backend gate while preserving this story's immutable publication, revision, idempotency, and atomicity safeguards.

## Story

As a Designer,
I want to publish a valid draft as an immutable version,
so that new Processes execute a stable reviewed definition.

## Acceptance Criteria

1. **Publish one sequential immutable snapshot from the current shared draft:** Given a valid shared draft at revision `R` and no published version for that command, when an authorized Designer publishes with the matching revision and idempotency key, then the handler locks the Workflow head, appends the next sequential immutable snapshot, records publication audit/idempotency/outbox atomically, and leaves the mutable draft available for later edits. And the snapshot contains current schema versions and stable element/field IDs. Traceability: FR228, AD-3, AD-4, AD-5.
2. **Reject invalid, stale, concurrent, and mismatched retries without duplicate versions:** Given a validation issue, stale revision, concurrent publication, or repeated request, when publication is attempted, then invalid or stale attempts create no version, concurrent attempts serialize to unique sequence numbers, and an identical retry returns its stored result without a duplicate version. And a different payload under the same key receives a stable conflict. Traceability: NFR25, NFR26, NFR30, AD-5.
3. **Keep published snapshots immutable after publication:** Given a published snapshot, when any application path attempts to mutate it, then persistence rejects the change and the original snapshot remains byte- and semantic-equivalent to its golden fixture. And future draft edits cannot alter running or historical version content. Traceability: AD-4, AD-5.

## Tasks / Subtasks

- [x] Add relational published-version persistence and immutable snapshot metadata under `workflow_design` (AC: 1-3)
  - [x] Extend `Moviqo.Back/src/moviqo/modules/workflow_design/models.py` with an append-only `WorkflowVersion` model tied to `WorkflowDefinition`, Organization-scoped, sequential by workflow, and storing the immutable draft snapshot JSONB plus publication metadata.
  - [x] Persist enough relational metadata to support later stories and PRD requirements without overreaching into full version history UI yet: version number, publisher Membership/User, publication timestamp, source draft revision, and snapshot schema version.
  - [x] Keep the mutable shared draft as a separate row. Publishing must not replace it with the immutable snapshot or convert the draft into the production record.
  - [x] Add Django migration(s) that preserve current Epic 1 data and introduce uniqueness constraints that prevent duplicate `(workflow, version_number)` histories.

- [x] Introduce one backend publication command and API surface that sits beside save and validation, not in the browser (AC: 1-2)
  - [x] Add a new publish command in `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` using the existing `execute_atomic_command()` seam and one required `Idempotency-Key`.
  - [x] Lock the same workflow head/draft row used by save and validation so publication serializes correctly with concurrent draft writes and later runtime writes per AD-5.
  - [x] Add one publish endpoint in `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py` and wire it in `Moviqo.Back/src/moviqo/urls.py`; do not overload publication-validation for the irreversible action.
  - [x] Keep the publish contract backend-authoritative and revision-based, following the repository's current `expectedRevision` equivalent contract rather than inventing a second partial concurrency mechanism.
  - [x] Return a response that gives the frontend the authoritative publication result: workflow ID, published version number, publication timestamp, immutable snapshot metadata, and the still-current shared draft revision/state needed for continued editing.

- [x] Reuse publication validation and draft normalization instead of re-implementing publishability checks (AC: 1-2)
  - [x] Base publication on the same normalized draft document and validation rules already exercised by `validate_workflow_publication()`, but do the final validation again inside the publish transaction before creating a version.
  - [x] Reject stale revisions with the current stable conflict pattern rather than silently publishing an older local copy.
  - [x] Reject invalid drafts without creating any `WorkflowVersion`, audit event, or partial metadata.
  - [x] Preserve current schema upcasting/normalization in `schema.py`; the snapshot must contain the current canonical draft structure with stable element, connection, process-field, and binding IDs.
  - [x] Do not let the frontend "publish" based only on a previously successful checklist response. The final authority must be the backend publish command at commit time.

- [x] Enforce immutability and isolation for published history (AC: 1-3)
  - [x] Treat `WorkflowVersion.snapshot` as append-only historical state. No save path may update an existing published snapshot row.
  - [x] Ensure later draft saves continue to modify only `WorkflowDraft.document`; they must not rewrite any published JSONB snapshot or its metadata.
  - [x] Add one golden-fixture style proof that a published snapshot can be loaded and compared byte/semantically after later draft edits.
  - [x] Keep publication scoped to `workflow_design`; do not start a Process, create a Task occurrence, or update runtime state in this story.

- [x] Add publication audit and repository-aligned evidence for later stories to consume (AC: 1-2)
  - [x] Record one semantic audit event for successful publication with workflow ID, version number, source draft revision, publisher identity, schema version, and whether the draft was publishable at commit time.
  - [x] Record rejected publication attempts safely when validation or revision checks fail, without exposing unauthorized state or persisting partial version data.
  - [x] Follow AD-3 exactly: business state, immutable audit, idempotency result, and any required outbox/evidence rows must commit or roll back together.
  - [x] Do not broaden this story into external notification delivery; if an outbox event is required, queue it only as an internal post-commit artifact for later messaging stories.

- [x] Add the minimum frontend publish action on top of the existing workflow editor flow (AC: 1-2)
  - [x] Extend `Moviqo.Front/src/features/workflow-design/model/types.ts`, `editor.ts`, and `ui/WorkflowDraftEditor.tsx` with an explicit publish action and result state that is distinct from validation and autosave.
  - [x] Reuse the current publish checklist and autosave/conflict foundations from Stories 1.25 through 1.27. Publishing must build on the authoritative shared draft state, not bypass it.
  - [x] Disable or guard the publish action while autosave is still pending, while publication validation is in flight, or while the editor is in conflict/retrying state.
  - [x] Surface plain-language success and failure messages consistent with `EXPERIENCE.md`: publishing is irreversible for that version, success appears only after server confirmation, and blocking issues remain actionable.
  - [x] Update generated client and OpenAPI artifacts rather than hand-maintaining a parallel fetch contract.
  - [x] Keep new frontend implementation functions in `Moviqo.Front/src/**/*.{ts,tsx}` as arrow-function constants per `AGENTS.md`.

- [x] Add executable coverage for serialization, idempotent replay, and immutable history (AC: 1-3)
  - [x] Add backend contract tests for authorized publish success, missing idempotency key, stale revision rejection, invalid-draft rejection, idempotent replay returning the original version result, and conflicting payload reuse returning `idempotency_key_reused`.
  - [x] Add real-PostgreSQL integration coverage proving concurrent publish attempts from the same starting revision serialize to one published version number each logical success path and never create duplicates.
  - [x] Add integration or contract coverage proving a later draft save after publication leaves the published snapshot unchanged.
  - [x] Add frontend unit coverage for publish-button enablement, success-state application, stale publish failure, pending autosave guardrails, and no false success before the authoritative response.
  - [x] Update `docs/api/openapi-v1.json` and `Moviqo.Front/src/shared/api/generated/schema.d.ts` under test/contract evidence rather than manual drift.

## Dev Notes

### Story intent and scope

- Story 1.28 is the first irreversible publication story. It turns the validated shared draft into the first immutable production version.
- This story sits directly after:
  - Story 1.25, which introduced the publish checklist and validation blockers;
  - Story 1.26, which made starter and assignment configuration real;
  - Story 1.27, which added autosave, conflict recovery, and retry-safe idempotent draft writes.
- This story must publish history only. It does not start a Process, resolve starter authorization at runtime, assign the first Task, compare versions, restore old versions, or mutate active instances. Those belong to later stories.

### Current implementation baseline to preserve

- Backend currently has only:
  - `WorkflowDefinition`
  - `WorkflowDraft`
  - save-draft and publication-validation application services
  - no published-version persistence model
  - no publish endpoint in `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` already uses `execute_atomic_command()` for create, save, and validate. Story 1.28 should extend this existing command pattern rather than inventing a custom transaction wrapper.
- `save_workflow_draft()` already locks the shared draft row with `select_for_update()` and enforces optimistic revision checks.
- `validate_workflow_publication()` already computes deterministic checklist issues and is read-only with respect to the draft revision.
- Frontend currently supports:
  - authoritative draft loading;
  - autosave/retry/conflict handling;
  - publication validation;
  - publish checklist rendering.
  There is no actual publish action yet.

### Requirements to carry forward

- FR227: an invalid draft may be saved, but it cannot be published.
- FR228: successful publication creates the next sequential immutable Workflow version.
- FR229: there is exactly one shared editable draft per Workflow.
- FR230: the draft keeps attribution and origin metadata; publication must not destroy that shared-draft lineage.
- FR240: draft activity must not alter the latest published version or active production behavior.
- FR255 and FR593 are not implemented in this story, but they are important guardrails: future restoration publishes a new sequential version rather than rewriting history.
- FR269 implies a later open-draft experience must distinguish draft editing from published viewing cleanly; this story should not make that later separation harder.
- FR590 means the version record created here must retain the metadata later version-history views will need.
- FR614 and FR617 are later runtime-facing rules, but Story 1.28 must start from the correct serialization premise now: publication is one atomic change that cannot partially commit.

### Architecture guardrails

- Follow AD-3: one publish command, one transaction, one evidence trail. Audit, idempotency result, and published version creation must commit together.
- Follow AD-4: relational metadata owns workflow/version identity and lifecycle; immutable snapshot content lives in JSONB with schema versioning and stable IDs.
- Follow AD-5: a Workflow has one mutable draft and append-only immutable published snapshots with sequential versions. Publication must serialize against the same workflow head state as draft writes.
- Follow AD-7: the backend is the authority for publish permission, validation, and concurrency; the browser may only request publication and render the result.
- Follow AD-16: start with failing tests for publish success, stale/invalid rejection, idempotent replay, concurrent serialization, and immutable snapshot preservation.
- Keep the current consistency convention for HTTP: `/api/v1`, Problem Details, and optimistic revision through the existing generated-contract equivalent to `ETag`/`If-Match`.

### Files and behaviors that must be read carefully before implementation

- `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
  Current state:
  It defines only `WorkflowDefinition` and `WorkflowDraft`. There is no relational home for published versions yet.
  What this story changes:
  Add append-only published-version persistence and metadata.
  What must be preserved:
  One `WorkflowDraft` row per `WorkflowDefinition`, Organization-scoped uniqueness, and current draft save behavior.

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
  Current state:
  It already owns create, save, and publication-validation flows through `execute_atomic_command()` and `select_for_update()` on the draft row.
  What this story changes:
  Add a publish command and immutable version creation path.
  What must be preserved:
  Stable revision conflicts, backend-owned validation, atomic command handling, semantic audit patterns, and current draft save/validate semantics.

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
  Current state:
  Exposes collection, draft detail/save, and publication validation endpoints with required `Idempotency-Key`.
  What this story changes:
  Add a publish endpoint and response/error contract.
  What must be preserved:
  Problem Details shape, design-role authorization, tenant-safe not-found behavior, and idempotency-key conflict handling.

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
  Current state:
  Normalizes the canonical current draft document and already upcasts old versions to schema version 4.
  What this story changes:
  Likely no broad schema redesign; publication should consume this canonical form as the immutable snapshot.
  What must be preserved:
  Stable IDs, strict normalization, unknown-field rejection on writes, and safe legacy upcasting.

- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
  Current state:
  Manages autosave, retry, conflict recovery, and publication validation only.
  What this story changes:
  Add publish-request orchestration and success/error state on top of the acknowledged draft revision.
  What must be preserved:
  Autosave key reuse rules, authoritative revision tracking, and no false success before server acceptance.

- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
  Current state:
  Renders the checklist and validation button, but no real publish action.
  What this story changes:
  Add the publish button/feedback path and guard it against pending save/conflict states.
  What must be preserved:
  Plain-language checklist UX, accessibility/focus behavior, and current save/validation state rendering.

### Concrete backend guidance

- Add a publish command type such as `workflow-design.publish` next to the existing create/save/validate command identifiers.
- Use the current shared draft revision as the publication precondition. If the server revision changed after the client last acknowledged it, publish must fail as stale and create no version.
- Re-run final validation inside the publish transaction even if the client previously saw `publishable: true`.
- Prefer a response/result model that can be replayed idempotently. The same publish request under the same key should return the original publication result, including the version number created the first time.
- Store the immutable snapshot in its canonical normalized form, not as whatever partially normalized payload the browser happened to send.
- Add safe metadata that later stories can reuse without migration churn:
  - version number
  - workflow ID
  - organization ID
  - snapshot JSONB
  - draft/source revision
  - snapshot schema version
  - publisher Membership/User
  - publication timestamp
- Keep publication authorization aligned with the existing designer roles only. Starting a Workflow remains out of scope for this story.

### Concrete frontend guidance

- Publishing should use the last acknowledged authoritative revision, not a stale prop-backed revision value.
- The publish action should be unavailable or clearly blocked when:
  - autosave is still pending;
  - save is retrying;
  - the editor is in conflict;
  - publication validation is currently running.
- Keep success copy aligned with `EXPERIENCE.md`:
  - plain language;
  - no technical jargon;
  - no success shown before server confirmation;
  - explain that the workflow is now ready to start from a published version.
- Reuse the existing checklist instead of requiring the user to navigate to a second publish screen.
- Preserve the current draft editor after publication so later edits still happen through the shared draft instead of mutating published history.

### Likely files to update

- `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- new migration(s) under `Moviqo.Back/src/moviqo/modules/workflow_design/migrations/`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- possibly new focused backend unit tests around publication snapshot behavior
- `docs/api/openapi-v1.json`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`

### Previous story intelligence

- Story 1.27 established the main publication prerequisite: the editor now tracks authoritative revision, autosave retry state, and conflict recovery. Story 1.28 must build on that rather than bypassing it.
- Story 1.27 also left the publish path intentionally unimplemented. That means this story should not rework autosave architecture unless publication reveals a concrete missing seam.
- Story 1.26 made starter and assignment configuration real inside `draft.publication`. Story 1.28 must carry that configuration into the immutable snapshot exactly as normalized by the backend.
- Recent work has concentrated the workflow-design behavior inside:
  - `workflow_design` backend services/views/schema
  - `features/workflow-design` frontend reducer/editor
  Preserve that module boundary instead of scattering publish logic across unrelated pages or modules.

### Git intelligence

- Recent commits on August 5, 2026:
  - `397d75e` Merge PR for Story 1.27
  - `d9320e5` Fixed unit test
  - `acfc5d7` Implemented Story 1.27
  - `4d1f25d` Merge PR for Story 1.26
- Inference from those commits and the current code layout:
  the repository has been adding workflow-design capabilities incrementally in the same module seams, so Story 1.28 should continue that pattern and avoid a broad architectural detour.

### Testing requirements

- Backend contract tests should prove:
  - successful publish returns a deterministic published version payload;
  - stale revision publish returns the stable conflict contract;
  - invalid publish returns blocking errors and creates no version;
  - missing `Idempotency-Key` fails safely;
  - replay with identical payload under the same key returns the original version result;
  - changed payload under the same key returns `idempotency_key_reused`.
- Real-PostgreSQL integration tests should prove:
  - two concurrent publish attempts from the same draft revision cannot create duplicate version numbers;
  - later draft saves do not mutate existing published snapshots;
  - published snapshots remain readable and equivalent after later draft edits;
  - publication remains atomic with audit/idempotency persistence.
- Frontend unit tests should prove:
  - publish is disabled during pending autosave/conflict states;
  - success state appears only after the authoritative publish response;
  - stale publish failure keeps local work intact and points back to reload/review flow;
  - publish does not bypass the existing authoritative revision model.

### Latest technical information

- React 19.2 still documents `useEffect` as the hook for synchronizing a component with an external system and emphasizes correct dependency/cleanup behavior. If a publish side effect is added near the editor root, keep it one clear synchronization path rather than scattering network triggers across handlers. Source checked August 5, 2026: https://react.dev/reference/react/useEffect
- React’s current `<input>` reference still states that an input cannot switch between controlled and uncontrolled and that every controlled input needs an `onChange` handler that synchronously updates its backing value. Preserve the current controlled-input workflow editor pattern when adding publish controls or success-state UI. Source checked August 5, 2026: https://react.dev/reference/react-dom/components/input
- Django 5.2 release notes currently state that Django 5.2 supports Python 3.14 as of Django 5.2.8. Keep this story on the repository’s current Django 5.2 line rather than mixing framework upgrades into publication work. Source checked August 5, 2026: https://docs.djangoproject.com/en/5.2/releases/5.2/
- PostgreSQL 18 current locking docs state that `FOR UPDATE` locks retrieved rows against concurrent writers and lockers until transaction end. That aligns with the current `select_for_update()` draft-write path and should remain the concurrency foundation for serialized publication. Source checked August 5, 2026: https://www.postgresql.org/docs/current/explicit-locking.html

### Anti-patterns and out-of-scope work

- Do not mutate an existing published snapshot row after creation.
- Do not treat a successful validation response as permission to publish later without re-checking inside the publish transaction.
- Do not create a second editable draft on publication.
- Do not collapse draft JSONB and published-version JSONB into one mutable record.
- Do not start a Process, assign runtime Tasks, or update runtime state in this story.
- Do not invent a browser-only publish success state or client-side version numbering.
- Do not skip idempotent replay coverage for publication; duplicate version creation is one of the highest-risk failures in this story.

### Project Structure Notes

- Keep publish persistence and command handling inside `Moviqo.Back/src/moviqo/modules/workflow_design/`.
- Keep frontend publish behavior inside `Moviqo.Front/src/features/workflow-design/`.
- Keep generated API artifacts synchronized with the backend OpenAPI contract.
- Follow the repository rule that new frontend implementation functions in `Moviqo.Front/src/**/*.{ts,tsx}` use arrow-function constants.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.25, Story 1.26, Story 1.27, Story 1.28, Story 1.29]
- [Source: `_bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md` - FR227, FR228, FR229, FR230, FR240, FR255, FR269, FR590, FR593, FR614, FR617]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-3, AD-4, AD-5, AD-7, AD-16; HTTP; Mutation; Tests; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Guided first workflow; Voice and Tone; Publish checklist; State patterns; Flow 1]
- [Source: `_bmad-output/implementation-artifacts/1-26-configure-workflow-starters-and-task-assignment.md`]
- [Source: `_bmad-output/implementation-artifacts/1-27-autosave-and-resolve-shared-draft-conflicts.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`]
- [Source: `Moviqo.Back/src/moviqo/urls.py`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/editor.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`]
- [Source: `Moviqo.Back/tests/contract/test_workflow_design_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_design_integration.py`]
- [Technical reference: React docs, https://react.dev/reference/react/useEffect]
- [Technical reference: React docs, https://react.dev/reference/react-dom/components/input]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/releases/5.2/]
- [Technical reference: PostgreSQL docs, https://www.postgresql.org/docs/current/explicit-locking.html]

### Review Findings

- [x] [Review][Patch] Publish uses request-body draft content instead of the authoritative saved shared draft, so unsaved local edits can be versioned under an old shared-draft revision [_bmad-output/implementation-artifacts/1-28-publish-an-immutable-workflow-version.md:115]
- [x] [Review][Patch] Published workflow versions are still mutable at the persistence layer because `WorkflowVersion` has no update guard and the migration grants `UPDATE` and `DELETE` on the history table [Moviqo.Back/src/moviqo/modules/workflow_design/models.py:54]
- [x] [Review][Patch] Stale publish attempts return a conflict without recording the required publication-rejection audit evidence [Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py:637]
- [x] [Review][Patch] Invalid publish failures drop actionable blocker targets in the editor and fall back to a generic error instead of keeping the checklist actionable [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:249]

## Dev Agent Record

### Agent Model Used

Codex

### Debug Log References

- `Get-Content .agents/skills/bmad-create-story/SKILL.md`
- `Get-Content .agents/skills/bmad-create-story/customize.toml`
- `Get-Content .agents/skills/bmad-create-story/discover-inputs.md`
- `Get-Content .agents/skills/bmad-create-story/template.md`
- `Get-Content .agents/skills/bmad-create-story/checklist.md`
- `Get-Content _bmad/bmm/config.yaml`
- `Get-Content _bmad-output/implementation-artifacts/sprint-status.yaml`
- `Get-Content _bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md`
- `Get-Content _bmad-output/planning-artifacts/prds/prd-Moviqo-2026-07-30/prd.md`
- `Get-Content _bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Get-Content _bmad-output/implementation-artifacts/1-26-configure-workflow-starters-and-task-assignment.md`
- `Get-Content _bmad-output/implementation-artifacts/1-27-autosave-and-resolve-shared-draft-conflicts.md`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Get-Content Moviqo.Back/src/moviqo/urls.py`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Get-Content Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Get-Content Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `uv run pytest tests/contract/test_workflow_design_contract.py`
- `uv run pytest tests/integration/test_workflow_design_integration.py`
- `uv run pytest`
- `uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json --format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test`
- `npm run test:unit`
- `npm run typecheck`
- `npm run generate:api-client`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `rg -n "Story 1\\.28|FR228|AD-4|AD-5|publish|immutable version|published version|workflow version|snapshot" _bmad-output/planning-artifacts/prds _bmad-output/planning-artifacts/architecture _bmad-output/planning-artifacts/ux-designs`
- `rg -n "workflow.*publish|publish.*workflow|published version|WorkflowVersion|workflow version|draft conflict|If-Match|idempotency|snapshot" Moviqo.Back Moviqo.Front`
- `rg -n "execute_atomic_command|append_audit|append_outbox|idempotency" Moviqo.Back/src/moviqo/building_blocks Moviqo.Back/src/moviqo/modules`
- `web.open https://react.dev/reference/react/useEffect`
- `web.open https://react.dev/reference/react-dom/components/input`
- `web.open https://docs.djangoproject.com/en/5.2/releases/5.2/`
- `web.open https://www.postgresql.org/docs/current/explicit-locking.html`

### Completion Notes List

- Implemented append-only `WorkflowVersion` persistence, tenant isolation registration, and the publish migration for immutable workflow snapshots.
- Added the backend publish command, `/api/v1/workflow-design/workflows/<uuid:workflow_id>/publish/` endpoint, publication audit records, and an internal outbox event with idempotent replay support.
- Reused backend draft normalization and publication validation inside the publish transaction, preserving stale-revision conflicts and invalid-draft rejection without partial version writes.
- Added the frontend publish action, guarded button state, localized publish success and failure feedback, and authoritative publish result handling on top of the shared draft editor.
- Updated backend contract coverage, integration-gated publish coverage, frontend unit coverage, and synchronized `docs/api/openapi-v1.json` with `Moviqo.Front/src/shared/api/generated/schema.d.ts`.

### File List

- `Moviqo.Back/src/moviqo/building_blocks/api/problem_details.py`
- `Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/migrations/0002_workflowversion.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Moviqo.Back/src/moviqo/urls.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `docs/api/openapi-v1.json`
- `_bmad-output/implementation-artifacts/1-28-publish-an-immutable-workflow-version.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-08-05: Implemented Story 1.28, added immutable workflow publishing across backend and frontend, and advanced the story to review.
