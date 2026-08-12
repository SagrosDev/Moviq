---
title: 'Fix workflow integration pipeline fixtures'
type: 'bugfix'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '6ca570e19064225ce24062e354351bc15ed27f27'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The PostgreSQL integration pipeline has two failing workflow-design tests whose fixtures no longer reach the behavior they claim to verify. The Start-removal fixture retains a layout position for the deleted element, while the rejected-save fixture uses a disconnected intermediate graph that current authoring semantics intentionally accept.

**Approach:** Correct the two integration fixtures without changing production validation: remove the deleted Start's layout position so the Start-preservation guard is exercised, and use a deterministically invalid multiple-Start graph for rejected-command replay coverage. Verify the focused failures, the complete PostgreSQL integration suite, and the default backend suite.

## Boundaries & Constraints

**Always:** Preserve authoritative v7 layout referential integrity; preserve the rule that an existing Start cannot be removed; preserve acceptance of incomplete or disconnected intermediate authoring graphs; preserve idempotent storage and single-audit behavior for rejected commands; keep the correction test-only unless verification exposes a directly related production defect.

**Ask First:** Any change to workflow draft schema, save-validation ordering, publication-readiness rules, audit persistence, idempotency behavior, or CI configuration.

**Never:** Reorder production validation merely to prefer one error over a more fundamental malformed-layout error; reject disconnected drafts during authoring; weaken or skip either integration assertion; alter unrelated tests to make the suite green.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Existing Start removed coherently | Draft removes Start and removes its layout position | Save rejects with `elements/start_required`; revision and persisted Start remain unchanged | Domain validation error is stable and actionable |
| Rejected save replay | Same idempotency key and request hash submit a graph with two Start elements twice | Both attempts replay the same rejection; one command result and one rejection audit exist | No draft revision advances and no duplicate audit is created |
| Incomplete intermediate graph | Start and disconnected Task during authoring | Draft remains saveable under current semantics | Publication validation later reports readiness issues |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/tests/integration/test_workflow_design_integration.py` -- contains both stale fixtures and their PostgreSQL idempotency/audit assertions.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` -- constructs current candidates, validates schema integrity, then enforces preservation of an existing Start.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/schema.py` -- validates layout references and intentionally permits incomplete intermediate authoring graphs.
- `Moviqo.Back/tests/contract/test_workflow_design_contract.py` -- protects acceptance of disconnected intermediate drafts.
- `.github/workflows/ci.yml` -- runs the complete integration suite with PostgreSQL settings.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Back/tests/integration/test_workflow_design_integration.py` -- clear layout positions in the Start-removal fixture and replace the now-valid disconnected graph with a multiple-Start invalid graph in the rejected-replay fixture -- align both tests with current schema and authoring semantics while retaining their original behavioral coverage.

**Acceptance Criteria:**
- Given a saved workflow with an existing Start, when a coherent candidate removes that Start, then the save is rejected with the documented `start_required` invalid parameter and persistence is unchanged.
- Given the same invalid multiple-Start save is submitted twice with the same idempotency identity, when PostgreSQL executes the commands, then both calls reject and exactly one command result plus one rejection audit are stored.
- Given the repository integration settings, when `uv run pytest tests/integration --ds=moviqo.settings.integration` runs, then all integration tests pass.
- Given the default backend settings, when `uv run pytest` runs, then all default-suite tests pass apart from intentional skips.
- Given the final diff, when reviewed, then production source and CI configuration remain unchanged.

## Spec Change Log

## Design Notes

Layout is part of the authoritative document. A test that deletes an element but retains its position is malformed before graph invariants are evaluated. Clearing the position isolates the intended Start-preservation rule. The rejected-replay test must use a violation that remains invalid under permissive authoring semantics; two Start elements provide that stable graph-integrity boundary.

## Verification

**Commands:**
- `uv run pytest tests/integration/test_workflow_design_integration.py::test_existing_start_cannot_be_removed_from_saved_draft tests/integration/test_workflow_design_integration.py::test_rejected_graph_save_replays_one_audit_result --ds=moviqo.settings.integration -q` from `Moviqo.Back` -- expected: both focused tests pass.
- `uv run pytest tests/integration --ds=moviqo.settings.integration` from `Moviqo.Back` with the CI PostgreSQL environment -- expected: all 61 integration tests pass.
- `uv run pytest` from `Moviqo.Back` -- expected: the default backend suite passes with only intentional skips.
- `git diff --check` -- expected: no whitespace errors.

## Suggested Review Order

**Start-preservation fixture**

- Removes the deleted node's position so the intended domain guard is reached.
  [`test_workflow_design_integration.py:608`](../../Moviqo.Back/tests/integration/test_workflow_design_integration.py#L608)

- Confirms rejection rolls back the submitted layout change as well as graph changes.
  [`test_workflow_design_integration.py:626`](../../Moviqo.Back/tests/integration/test_workflow_design_integration.py#L626)

**Rejected-command replay fixture**

- Uses duplicate Starts as a stable invalid graph under permissive authoring semantics.
  [`test_workflow_design_integration.py:649`](../../Moviqo.Back/tests/integration/test_workflow_design_integration.py#L649)
