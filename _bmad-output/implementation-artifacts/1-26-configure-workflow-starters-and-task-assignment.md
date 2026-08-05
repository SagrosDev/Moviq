---
baseline_commit: ece5e40b919b693f9ab0301db77d42a826792899
---

# Story 1.26: Configure Workflow Starters and Task Assignment

Status: done

## Story

As a Designer,
I want to authorize starters and assign the first Task,
so that the published Workflow can be started and completed by intended Organization members.

## Acceptance Criteria

1. **Store Organization-scoped starter and first-task assignment configuration:** Given active Organization Members and Teams, when the Designer configures all active Members, selected active Teams, selected active Members, a specific active Member Task assignee, or Workflow Initiator assignment, then the draft stores stable Organization-scoped references and explains who receives the Task and when. And no cross-Organization, inactive, empty Team, or unsupported assignment is accepted. Traceability: FR17, FR39, FR41, UX-DR9.
2. **Block publication when no valid Authorized Starter remains:** Given no valid Authorized Starter remains, when publication validation runs, then publication is blocked with a starter-specific issue and the draft remains editable. And configuring at least one valid starter clears that issue. Traceability: FR18.
3. **Preserve operational start authority separately from starter configuration:** Given an Owner or Administrator is not listed as a starter, when start authorization is evaluated after publication, then operational authority permits the start and marks it as such for audit, while Members and Designers require direct, Team, or all-active-member authorization. And Task assignment does not itself grant start authority. Traceability: FR20, AD-7.

## Tasks / Subtasks

- [ ] Replace the current publication booleans with real starter and first-task assignment draft structures under `workflow_design` (AC: 1-3)
  - [ ] Evolve `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` from the current `publication.starter.isConfigured` and `publication.assignment.isConfigured` placeholder booleans into explicit, versioned configuration objects.
  - [ ] Upcast existing Story 1.25 draft fixtures and saved documents safely so current drafts continue to load; do not strand schema-version `3` documents or force manual repair.
  - [ ] Keep design-time configuration in the draft JSONB document with stable Organization-scoped IDs only. Persist safe display names through read models, not as the source of truth inside the draft.
  - [ ] Model starter configuration for exactly this Epic 1 slice: `allActiveMembers`, selected active Team IDs, and selected active Membership IDs.
  - [ ] Model first-task assignment for exactly this Epic 1 slice: one specific active Membership or `workflowInitiator`. Do not absorb Team assignment, User Reference assignment, reassignment, or claim behavior from later stories.

- [ ] Introduce the minimum Organization and Team seams needed to validate starter selections honestly without jumping ahead to full Team administration (AC: 1-2)
  - [ ] Add the smallest backend persistence needed to represent active Teams and Team membership safely inside `Moviqo.Back/src/moviqo/modules/organizations/`, because the repository currently has Memberships but no Team model yet.
  - [ ] Keep Team lifecycle minimal in this story: enough to create/query active Team references in tests and starter configuration, not the full CRUD administration flow owned by Story 2.6 and Story 2.7.
  - [ ] Enforce same-Organization, active-only, and non-empty-Team validation at the backend command boundary. A Team with no active Members is not a valid Authorized Starter.
  - [ ] Expose Organization-scoped read data that workflow design can use to show eligible active Members and Teams without importing `organizations` persistence directly into frontend code or duplicating authorization logic in the browser.

- [ ] Add backend-owned starter and assignment validation plus reusable authorization helpers for later runtime stories (AC: 1-3)
  - [ ] Extend `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` and `publication_validation.py` so publication readiness is derived from the real config structure, not from UI toggles.
  - [ ] Add one reusable backend helper or contract for starter authorization semantics that later Story 1.29 can call: Owners and Administrators always retain operational start authority even when not listed; Members and Designers require direct, Team, or all-active-members authorization.
  - [ ] Keep first-task assignment and start authority separate concepts. Saving a Task assignee choice must not imply starter permission.
  - [ ] Return deterministic publication issues for missing or invalid starter configuration with stable targets and localized or localization-ready messaging.
  - [ ] Reject unsupported assignment strategies explicitly in this story rather than silently accepting draft shapes needed for later epics.

- [ ] Replace the placeholder starter and assignment toggles in the workflow editor with concrete guided controls that reuse existing UX patterns (AC: 1-2)
  - [ ] Update `Moviqo.Front/src/features/workflow-design/model/types.ts`, `draft.ts`, `editor.ts`, and `ui/WorkflowDraftEditor.tsx` so local draft state can represent starter modes, selected Memberships, selected Teams, and first-task assignment mode without ad hoc booleans.
  - [ ] Reuse the existing `AssignmentControl`, `PublishChecklist`, and `StatusBadge` patterns in `Moviqo.Front/src/shared/ui/catalog.tsx` and `Moviqo.Front/src/app/styles.css` instead of inventing a separate starter/assignment visual language.
  - [ ] Keep the UI Spanish-first with English fallback in `Moviqo.Front/src/shared/localization/messages.ts`, and explain in plain language who can start the Workflow and who receives the first Task.
  - [ ] Make selection state explicit and accessible: keyboard-operable lists or grouped controls, visible current summary, and checklist links that focus the exact starter or assignment section.
  - [ ] Do not introduce browser-authoritative authorization. The editor may preview the selection, but the backend validates eligibility and final publish readiness.

- [ ] Add executable coverage for schema evolution, Organization-scoped validation, and the starter/assignment editor flow (AC: 1-3)
  - [ ] Add backend unit tests for publication-shape upcasting, invalid cross-Organization references, inactive Membership rejection, empty-Team rejection, `allActiveMembers` starter success, selected-Team starter success, selected-Member starter success, direct-Member assignment success, and `workflowInitiator` assignment success.
  - [ ] Add backend contract tests for the workflow-design API shape, deterministic publication issues, design-role authorization, tenant-safe denials, and rejection of unsupported assignment payloads.
  - [ ] Add real-PostgreSQL integration tests proving draft saves remain atomic, starter validation does not mutate the revision on publication-check runs, and the later authorization helper distinguishes normal starter permission from Owner/Administrator operational authority.
  - [ ] Add frontend unit coverage for draft normalization/upcasting, starter selection summaries, assignment mode switching, stale checklist clearing, focus targets, and preservation of unsaved local edits across validation retries.

### Review Findings

- [x] [Review][Patch] Team directory serialization crashes as soon as an active team exists [Moviqo.Back/src/moviqo/modules/organizations/application/workflow_directory.py:65]
- [x] [Review][Patch] Starter configuration cannot represent combined selected teams plus selected members, contrary to AC1/FR17 [Moviqo.Front/src/features/workflow-design/model/editor.ts:233]
- [x] [Review][Patch] New team tables were added outside the tenant-isolation gate registrations [Moviqo.Back/src/moviqo/building_blocks/tenancy/checks.py:31]
- [x] [Review][Patch] Checklist actions do not focus the starter or assignment section reliably [Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx:312]
- [x] [Review][Patch] Workflow editor keeps a stale configuration directory after accepted saves [Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx:62]

## Dev Notes

### Story intent and scope

- Story 1.26 is the first real starter and assignment configuration story. It must replace the Story 1.25 placeholder booleans with data that later stories can trust.
- This story must establish configuration only. It does not publish immutable versions, start Processes, create Task occurrences, support Team claiming, or perform reassignment.
- The follow-on dependency chain matters:
  - Story 1.25 already introduced publication validation and currently fakes readiness through booleans.
  - Story 1.27 adds autosave/conflict handling on top of the same shared draft.
  - Story 1.28 publishes immutable versions and must carry this configuration forward into snapshots.
  - Story 1.29 evaluates starter authorization and creates the first Task once.
- Keep scope tight: implement only the starter and first-task assignment semantics needed by Epic 1. Do not absorb the broader Epic 2 Team management UI or Epic 5 assignment lifecycle.

### Current implementation to preserve and replace

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` currently normalizes `publication` as:
  - `starter.isConfigured: boolean`
  - `assignment.isConfigured: boolean`
  This is insufficient for Story 1.26 and must be replaced with structured configuration plus safe upcasting.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py` currently decides starter and assignment readiness solely from those booleans and emits `starter_missing` / `assignment_missing`.
- `Moviqo.Front/src/features/workflow-design/model/draft.ts` seeds missing publication state with the same booleans.
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx` currently renders two toggle buttons as placeholders for starter and assignment readiness.
- `Moviqo.Back/src/moviqo/modules/organizations/models.py` currently defines `Organization`, `Membership`, and identity models, but there is no Team or TeamMembership persistence yet.
- `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py` currently stores direct assignee Membership/User IDs on `TaskOccurrence`. Story 1.26 must not mutate runtime Task state yet, but it should define assignment configuration that Story 1.29 can resolve into those runtime fields later.

### Requirements to carry forward

- FR17: a Workflow may authorize all active Members, selected active Teams, and selected active individual Members to start production instances.
- FR18: publication is blocked until at least one valid Authorized Starter remains.
- FR19 and FR20 together define the guardrail for future start checks:
  - Members and Designers need direct, Team, or all-active-members authorization.
  - Owners and Administrators retain operational authority even if they are not in the configured starter set.
- FR25: assignment visibility does not grant start authority.
- FR35 and FR38 are relevant even though Epic 2 owns full Team administration:
  - Designers may select valid active Teams in Workflow configuration.
  - A valid Team reference must be active and contain at least one active Member.
- FR39 and FR41 define the assignment modes in scope for this story:
  - specific active Member assignment;
  - Workflow Initiator assignment.
- UX-DR9 requires the assignment control to explain who receives work and when in plain language.

### Architecture guardrails

- Follow AD-1: keep starter/assignment authoring in `workflow_design`; call `organizations` only through application contracts or query helpers. Do not read `organizations` tables directly from frontend code or cross-module internals.
- Follow AD-2: every Membership and Team reference must remain Organization-scoped and fail closed on mismatched tenant context.
- Follow AD-4: the mutable draft remains JSONB with stable IDs, while Organization, Membership, and Team identities remain relational.
- Follow AD-5: this story modifies the mutable draft only. Do not introduce publication snapshots here.
- Follow AD-7: authorization remains server-owned. Starter authorization helpers and validation logic must live on the backend, and future operational-authority audit flags must be derived there too.
- Follow AD-9: keep reducer-managed local draft state in the workflow-design feature slice. Do not replace it with component-local ad hoc state or React form Actions.
- Follow AD-16: start with failing tests for schema evolution, Organization-scoped selection validation, and publication blockers before implementation.

### Concrete backend guidance

- Introduce a new draft schema version for the richer publication configuration. Keep readers able to upcast current version `3` drafts produced by Stories 1.24 and 1.25.
- Prefer a configuration shape that separates starter and assignment intent clearly. Example structure guidance:
  - `publication.starter.mode`
  - `publication.starter.membershipIds`
  - `publication.starter.teamIds`
  - `publication.assignment.mode`
  - `publication.assignment.membershipId`
  This is an implementation suggestion, not a mandated exact DTO.
- Normalize all IDs and validate them against active Organization records on save and publication-check paths.
- Add a small `organizations` query helper that returns eligible active Memberships and active non-empty Teams for workflow configuration. Keep display projections safe and minimal.
- If Team persistence is added here, keep it extension-friendly for Story 2.6:
  - stable Team identity;
  - active flag;
  - Organization-scoped uniqueness;
  - relation to Membership or User through explicit membership rows.
- Keep starter authorization evaluation pure and reusable so Story 1.29 can consume it without re-implementing the rules.
- Publication validation should distinguish:
  - no starter selected;
  - selected starter references no longer valid;
  - assignment missing or unsupported.
  Return stable issue codes/targets instead of generic errors.

### Concrete frontend guidance

- Replace the two publication setup toggles with real guided controls in `Moviqo.Front/src/features/workflow-design/`.
- Preserve arrow-function-constant style for any new frontend functions per `AGENTS.md`.
- Keep the editor flow on the current page; do not split starter or assignment into a separate route.
- Reuse the design-system assignment card/checklist styles already present in `shared/ui/catalog.tsx` and `app/styles.css`.
- Keep labels, summaries, and checklist rows plain-language and Spanish-first. Example intent:
  - who can start this workflow;
  - everyone active or selected people/teams only;
  - first task goes to a named person or to whoever started the workflow.
- Checklist links should focus the specific starter or assignment section, not just a generic publication panel.
- Preserve unsaved local work during validation retries and server sync exactly as Story 1.25 established.

### Likely files to update

- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`
- new organizations application helpers under `Moviqo.Back/src/moviqo/modules/organizations/application/`
- new Django migration(s) under `Moviqo.Back/src/moviqo/modules/organizations/migrations/`
- `Moviqo.Back/tests/unit/test_workflow_publication_validation.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/model/draft.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/src/shared/api/generated/schema.d.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `docs/api/openapi-v1.json`

### Testing requirements

- Backend unit tests should cover:
  - upcasting legacy publication booleans into the new structured configuration;
  - rejecting a Team from another Organization;
  - rejecting inactive Membership references;
  - rejecting empty or inactive Teams as starters;
  - accepting valid `allActiveMembers`, selected-Team, and selected-Member starter configurations;
  - accepting `workflowInitiator` and specific active-Member assignment modes only.
- Backend contract tests should prove:
  - only owner, administrator, and designer roles can save starter/assignment configuration;
  - publication validation returns stable starter-specific blockers when configuration is absent or invalid;
  - cross-tenant workflow guesses fail closed;
  - unsupported assignment modes are rejected with stable invalid-param targets.
- Real-PostgreSQL integration tests should prove:
  - starter/assignment saves remain atomic with the shared draft revision;
  - publication validation stays read-only for the draft revision;
  - the future-facing starter authorization helper returns `true` for operational Owner/Administrator access even when the configured starter list excludes them.
- Frontend unit tests should prove:
  - normalized draft state can read old and new publication shapes safely;
  - starter selection summaries update correctly when switching modes;
  - first-task assignment mode switching preserves local draft state until server acceptance;
  - checklist target focus lands on the starter or assignment section;
  - validation retries do not discard unsaved local edits.

### Latest technical information

- React’s current official docs still require controlled inputs to pair `value` with `onChange`, and they still require labels to stay associated with inputs for accessibility. Keep starter and assignment selectors in the current controlled-input/reducer pattern. Source crawled August 5, 2026.
- React 19 is stable, and it includes form Actions and related helpers. Inference from the official docs plus the repo’s existing AD-9 pattern: do not switch this editor flow to React form Actions just because they exist; keep the current backend-authoritative SPA pattern.
- Django 5.2 is still the repository-aligned LTS line and supports Python 3.14 in current 5.2.x releases. Keep this story on the existing Django/DRF stack rather than mixing framework upgrades into starter/assignment work.

### Anti-patterns and out-of-scope work

- Do not keep the Story 1.25 placeholder booleans as the real long-term data model.
- Do not introduce client-only authorization or publishability decisions.
- Do not implement Team claiming, reassignment, Needs Reassignment, or runtime Task creation in this story.
- Do not absorb specific Team assignment, User Reference assignment, or dynamic runtime assignment from later stories.
- Do not create a second draft, browser-only cache, or localStorage recovery path for starter/assignment edits.
- Do not let assignment configuration imply starter permission.

### Project Structure Notes

- Keep design-time configuration in `Moviqo.Front/src/features/workflow-design/` and workflow-design backend modules.
- Keep Organization, Membership, and Team persistence under `Moviqo.Back/src/moviqo/modules/organizations/`.
- If you add new frontend helper functions in `Moviqo.Front/src/**/*.{ts,tsx}`, use arrow-function constants, not `function` declarations, per `AGENTS.md`.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-validate-the-core-moviqo-journey-end-to-end.md` - Story 1.25, Story 1.26, Story 1.27, Story 1.28, Story 1.29]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR17, FR18, FR19, FR20, FR25, FR35, FR38, FR39, FR41]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md` - AD-1, AD-2, AD-4, AD-5, AD-7, AD-9, AD-16; Consistency Conventions; Stack]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md` - Voice and Tone; Component Patterns; State Patterns; Flow 1]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md` - Components; Do's and Don'ts]
- [Source: `_bmad-output/implementation-artifacts/1-25-validate-the-minimal-workflow-for-publication.md`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_design/models.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/models.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`]
- [Source: `Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/types.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/draft.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/model/editor.ts`]
- [Source: `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`]
- [Source: `Moviqo.Front/src/shared/ui/catalog.tsx`]
- [Source: `Moviqo.Front/src/shared/localization/messages.ts`]
- [Source: `Moviqo.Back/tests/contract/test_workflow_design_contract.py`]
- [Source: `Moviqo.Back/tests/integration/test_workflow_design_integration.py`]
- [Source: `Moviqo.Front/tests/unit/workflow-design-create.test.cts`]
- [Technical reference: React docs, https://react.dev/reference/react-dom/components/input]
- [Technical reference: React docs, https://react.dev/blog/2024/12/05/react-19]
- [Technical reference: Django docs, https://docs.djangoproject.com/en/5.2/releases/5.2/]

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
- `Get-Content _bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `Get-Content _bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md`
- `Get-Content _bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md`
- `Get-Content _bmad-output/implementation-artifacts/1-25-validate-the-minimal-workflow-for-publication.md`
- `Get-Content _bmad-output/implementation-artifacts/1-24-compose-and-run-the-minimal-task-form.md`
- `git log -5 --pretty=format:"%h %ad %s" --date=short`
- `rg -n "class Team|team|starter|assignment|publication" Moviqo.Back/src/moviqo/modules/organizations Moviqo.Back/src/moviqo/modules/workflow_design Moviqo.Back/tests Moviqo.Front/src Moviqo.Front/tests`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_design/models.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/organizations/models.py`
- `Get-Content Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`
- `Get-ChildItem -Recurse Moviqo.Back/src/moviqo/modules/organizations/application`
- `Get-Content Moviqo.Back/src/moviqo/modules/workflow_runtime/models.py`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/draft.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Get-Content Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Get-Content Moviqo.Front/src/shared/ui/catalog.tsx`
- `Get-Content Moviqo.Front/src/shared/localization/messages.ts`
- `Get-Content Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Get-Content Moviqo.Back/tests/integration/test_workflow_design_integration.py`
- `Get-Content Moviqo.Front/tests/unit/workflow-design-create.test.cts`
- `web.open https://react.dev/reference/react-dom/components/input`
- `web.open https://react.dev/blog/2024/12/05/react-19`
- `web.open https://docs.djangoproject.com/en/5.2/releases/5.2/`
- `uv sync`
- `uv run pytest tests/unit/test_workflow_publication_validation.py`
- `uv run pytest tests/contract/test_workflow_design_contract.py`
- `uv run python src/manage.py makemigrations organizations --settings=moviqo.settings.test`
- `uv run python src/manage.py makemigrations --settings=moviqo.settings.test --check --dry-run`
- `npm run typecheck`
- `npm run test:unit`

### Completion Notes List

- Created the Story 1.26 implementation guide with concrete schema, organizations, workflow-design, UX, and testing guardrails.
- Anchored the story to the current repository state, including the existing placeholder publication booleans and the absence of Team persistence in `organizations`.
- Updated sprint tracking so Story 1.26 is in progress.
- Replaced placeholder publication booleans with structured starter and assignment configuration, including schema version 4 upcasting and legacy `isConfigured` compatibility on save and validate paths.
- Added minimal `Team` and `TeamMembership` persistence plus an organization-scoped workflow directory read model for eligible active memberships and non-empty teams.
- Added backend-owned starter and assignment validation plus a future-facing starter authorization helper that preserves owner and administrator operational authority separately from configured starters.
- Replaced the workflow editor starter and assignment toggles with explicit reducer-driven controls for all active members, selected teams, selected members, specific member assignment, and workflow initiator assignment.
- Verified backend contract coverage and frontend unit coverage, but did not finish the broader story checklist updates or add the requested integration coverage in this turn.

### File List

- `_bmad-output/implementation-artifacts/1-26-configure-workflow-starters-and-task-assignment.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `Moviqo.Back/src/moviqo/modules/organizations/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/organizations/application/workflow_directory.py`
- `Moviqo.Back/src/moviqo/modules/organizations/migrations/0013_team_teammembership_and_more.py`
- `Moviqo.Back/src/moviqo/modules/organizations/models.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/__init__.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_configuration.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_validation.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py`
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/views.py`
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py`
- `Moviqo.Front/src/features/workflow-design/index.ts`
- `Moviqo.Front/src/features/workflow-design/model/draft.ts`
- `Moviqo.Front/src/features/workflow-design/model/editor.ts`
- `Moviqo.Front/src/features/workflow-design/model/types.ts`
- `Moviqo.Front/src/features/workflow-design/ui/WorkflowDraftEditor.tsx`
- `Moviqo.Front/src/pages/workflow-create/ui/WorkflowCreatePage.tsx`
- `Moviqo.Front/src/shared/localization/messages.ts`
- `Moviqo.Front/tests/unit/workflow-design-create.test.cts`

### Change Log

- 2026-08-05: Created Story 1.26 and marked it ready for dev.
- 2026-08-05: Started implementation, added structured publication configuration, minimal teams, backend validation, workflow directory read models, and guided frontend starter and assignment controls.
