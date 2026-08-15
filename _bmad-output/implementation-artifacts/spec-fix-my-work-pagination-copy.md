---
title: 'Fix My Work pagination and start-process copy'
type: 'bugfix'
created: '2026-08-14T19:10:00-05:00'
status: 'done'
route: 'one-shot'
---

# Fix My Work pagination and start-process copy

## Intent

**Problem:** My Tasks, My Processes, and Start Process could render an incomplete “Página de” label when older runtime responses omitted newly added pagination metadata. Start Process also displayed backend-authored operational-authority language in English within the Spanish interface.

**Approach:** Resolve every pager from authoritative totals when present and safe requested-page fallbacks otherwise, without inventing unknown totals. Remove the backend availability explanation from presentation while preserving the authorized workflow, version, description, and Start action.

## Suggested Review Order

**Pagination resilience**

- Resolve concrete pages without claiming an exact total that the response cannot prove.
  [`MyWorkShell.tsx:671`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L671)

- Give each pager distinct accessible context and block stale refresh navigation.
  [`MyWorkShell.tsx:697`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L697)

- Keep shared pagination controls bilingual across all three work modules.
  [`messages.ts:947`](../../Moviqo.Front/src/shared/localization/messages.ts#L947)

**Start-process presentation**

- Preserve useful workflow content while omitting internal authority wording.
  [`MyWorkShell.tsx:434`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L434)

**Regression evidence**

- Cover missing metadata for Tasks, Processes, and Start Process independently.
  [`my-work-shell.test.cts:153`](../../Moviqo.Front/tests/unit/my-work-shell.test.cts#L153)

- Exercise the legacy response shape and hidden authority sentinel in Chromium.
  [`my-work.spec.ts:39`](../../Moviqo.Front/tests/e2e/my-work.spec.ts#L39)
