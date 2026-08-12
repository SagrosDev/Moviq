---
title: 'Fix backend pytest pipeline failure'
type: 'bugfix'
created: '2026-08-12'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: 'd199459e29854e56a182f4af01362bfff6d90f88'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The backend pipeline fails in `uv run pytest` because `test_publication_configuration_accepts_combined_team_and_member_starters` still calls `validate_publication_configuration(publication=...)`, while the production helper was intentionally changed to accept the authoritative workflow `document`. This prevents CI from reaching the remaining backend release gates even though the failure is a stale unit-test fixture rather than a production runtime defect.

**Approach:** Update the focused unit test to exercise the current document-shaped helper contract while preserving its original assertion: a valid combination of an active team and active member is accepted as workflow starter configuration. Verify the focused test and the complete default pytest suite.

## Boundaries & Constraints

**Always:** Keep `validate_publication_configuration` document-authoritative; represent starter configuration under `document.publication.starter`; preserve the existing combined team/member starter behavior; keep the change limited to the stale test unless verification exposes a directly related defect.

**Ask First:** Any change to production validation behavior, workflow document schema, publication API compatibility, or CI job configuration.

**Never:** Reintroduce the removed top-level `publication` parameter; restore the obsolete publication-level first-task assignment model; weaken or skip the failing assertion; change unrelated tests merely to obtain a green suite.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Combined valid starters | Authoritative document contains one active team ID and one active membership ID in `publication.starter` | Validation returns no publication-configuration issues | N/A |
| Contract drift | Test calls the helper with an obsolete keyword or malformed document placement | Focused test fails, exposing mismatch with the production helper contract | Correct the test fixture, not production compatibility behavior |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/tests/unit/test_workflow_publication_configuration.py` -- contains the stale helper invocation and the combined-starter behavior assertion.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/publication_configuration.py` -- defines the current `document`-based validation contract and reads `document.publication.starter`.
- `Moviqo.Back/src/moviqo/modules/workflow_design/application/services.py` -- production callers already pass normalized authoritative documents.
- `.github/workflows/ci.yml` -- invokes `uv run pytest` from `Moviqo.Back` before later backend release gates.

## Tasks & Acceptance

**Execution:**
- [x] `Moviqo.Back/tests/unit/test_workflow_publication_configuration.py` -- replace the obsolete `publication=` fixture with a minimal authoritative `document=` fixture containing the combined starter configuration -- align the unit test with the production contract without altering runtime behavior.

**Acceptance Criteria:**
- Given the active organization team and teammate membership fixture, when publication configuration is validated through the document-shaped contract, then validation returns an empty issue list.
- Given the repository's default backend test settings, when `uv run pytest` runs, then all collected default-suite tests pass apart from intentional skips.
- Given the change diff, when reviewed, then no production source or CI workflow behavior has changed.

## Spec Change Log

## Verification

**Commands:**
- `uv run pytest tests/unit/test_workflow_publication_configuration.py -q` from `Moviqo.Back` -- expected: the focused module passes.
- `uv run pytest` from `Moviqo.Back` with the CI environment variables -- expected: the complete default backend suite passes with only intentional skips.
- `git diff --check` -- expected: no whitespace errors.

## Suggested Review Order

- Aligns the regression test with the authoritative document-shaped validation contract.
  [`test_workflow_publication_configuration.py:73`](../../Moviqo.Back/tests/unit/test_workflow_publication_configuration.py#L73)
