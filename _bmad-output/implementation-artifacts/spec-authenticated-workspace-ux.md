---
title: 'Make authenticated workspaces clear, responsive, and ready for authoring'
type: 'bugfix'
created: '2026-08-11'
status: 'done'
review_loop_iteration: 0
baseline_commit: '60186e5a5d58498020ef67cd63f5adcc8ac4ace4'
context:
  - '_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Moviqo-2026-08-01/EXPERIENCE.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-Moviqo-2026-08-01/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A newly created active user sees a generic authorization-load failure or an indefinite-looking text state where valid empty work should be explained clearly. The authenticated shell also constrains operational and future authoring surfaces, while completed processes are difficult to scan as cards on desktop.

**Approach:** Restore the existing `200`-with-empty-collections contract for active members, give each My Work region its own localized loading, empty, and failure guidance, add an accessible visual loading primitive, widen the authenticated workspace, and present processes as a responsive desktop table/mobile card view. Keep the approved local Vite API proxy as development-only configuration.

## Boundaries & Constraints

**Always:** Preserve server-side tenant and membership authority; use Spanish and reviewed English catalog copy; use shared UI primitives and approved Tailwind tokens; expose a polite named loading status with a visible spinner and reduced-motion behavior; keep all actions keyboard accessible and at least 44 CSS pixels; return a successful empty dashboard for one active membership with no work; keep genuine permission, session, not-found, network, and server failures distinguishable; retain usable one-column layouts without horizontal loss on narrow screens.

**Ask First:** Any authentication-policy change, API response-shape change, new dependency, production proxy/base-URL change, or change that requires Workflow/Form document or canvas redesign.

**Never:** Treat every `404` as empty data in the client; weaken fail-closed handling for invalid memberships; show implementation terms such as “authorized work” to users; render duplicate desktop/mobile process content to assistive technology; redesign the Workflow Editor or Form Designer canvases assigned to Stories 1.36 and 1.37.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| New active owner | One active organization/membership; no workflows, tasks, or processes | Dashboard API returns `200`; each region shows its contextual empty message, including “No tienes flujos creados o asignados para iniciar un proceso.” | No retry/error panel |
| Loading | Dashboard request pending | Visible spinner plus region-specific localized copy in a polite live status | Animation becomes effectively static under reduced motion |
| Recoverable failure | Network/5xx or resource failure | The active region explains what could not be loaded and offers Retry | Safe normalized code only; provider text remains hidden |
| Invalid authority | Anonymous, revoked, pending, inactive, or ambiguous membership | Existing redirect/fail-closed behavior remains authoritative | Never presented as a normal empty state |
| Process history | Completed process items on desktop or narrow viewport | Semantic, scannable table on desktop; equivalent compact cards on narrow screens | Search, paging, deep links, focus order, and labels remain usable |
| Workspace sizing | Authenticated operational or authoring route | Shell uses substantially more available desktop width; readable prose retains a sensible line length | Narrow layouts reflow without horizontal page overflow |
| Local development | Vite dev server calls `/api/*` with Django on `127.0.0.1:8000` | Requests proxy successfully with same-origin cookies/CSRF | Production build and deployed routing are unchanged |

</frozen-after-approval>

## Code Map

- `Moviqo.Back/src/moviqo/modules/workflow_runtime/application/views.py` and `my_work.py` -- membership gate and empty dashboard contract; adjust only if reproduction identifies a backend defect.
- `Moviqo.Back/tests/contract/test_my_work_contract.py` -- regression coverage for an active new owner and fail-closed authority states.
- `Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx` -- region states, process history presentation, search, paging, and actions.
- `Moviqo.Front/src/shared/ui/feedback.tsx` and `index.ts` -- reusable domain-free accessible loading primitive.
- `Moviqo.Front/src/shared/ui/layout.tsx` and `src/app/router/RoutePages.tsx` -- authenticated workspace container width without widening compact public/auth forms.
- `Moviqo.Front/src/shared/localization/messages.ts` -- contextual Spanish and English loading, empty, table, and failure copy.
- `Moviqo.Front/src/app/styles.css` -- approved responsive presentation and reduced-motion support.
- `Moviqo.Front/vite.config.ts` -- local-only `/api` development proxy already approved for this branch.
- `Moviqo.Front/tests/unit/my-work-shell.test.cts` and `tests/e2e/my-work.spec.ts` -- semantic state, responsive journey, retry, and navigation regressions.

## Tasks & Acceptance

**Execution:**
- [x] Reproduce the new-owner request and confirm the existing active-empty and fail-closed backend contract coverage before changing frontend state handling.
- [x] Add the shared loading state and consume it from My Work with region-specific localized state messages.
- [x] Replace the desktop process card grid with an accessible responsive table/card presentation while retaining search, paging, and deep links.
- [x] Add a workspace container size and apply it to the authenticated layout; retain constrained reading widths inside page headers and compact forms.
- [x] Keep and verify the Vite dev proxy, then update focused unit/E2E coverage and generated contracts only if backend schema changes.

**Acceptance Criteria:**
- Given an active new owner, manual navigation across Tasks, Start Process, and Processes shows friendly empty states rather than an authorization error.
- Given a delayed request, the user sees both meaningful progress copy and a visual loading indicator that is announced once.
- Given completed processes, desktop users can scan labeled columns and narrow-screen users can operate equivalent cards without overflow or duplicated accessible content.
- Given a large desktop viewport, authenticated pages and future editors can use the workspace width while headings remain readable.
- Given a production frontend build, no localhost address or Vite proxy behavior is emitted into the static artifact.

## Spec Change Log

## Verification

**Commands:**
- `uv run pytest tests/contract/test_my_work_contract.py -q` from `Moviqo.Back` -- active-empty and authority contracts pass.
- `npm run typecheck && npm run test:unit && npm run test:architecture` from `Moviqo.Front` -- types, state semantics, localization, and boundaries pass.
- `npm run test:e2e -- tests/e2e/my-work.spec.ts --project=chromium-desktop` from `Moviqo.Front` -- loading, empty, table/card responsiveness, retry, and navigation pass.
- `npm run build` from `Moviqo.Front` -- production artifact builds and static scan remains clean.

**Manual checks (after automated verification):**
- At desktop and mobile widths, sign in as an active empty owner and inspect all three My Work routes, spinner behavior, process layout, available workspace width, focus order, and Spanish copy.

## Suggested Review Order

**My Work state and presentation**

- Start with contextual state classification, retry policy, and responsive process rendering.
  [`MyWorkShell.tsx:60`](../../Moviqo.Front/src/features/my-work/ui/MyWorkShell.tsx#L60)

- Preserve parsed API problems so permission and session guidance stays truthful.
  [`myWork.ts:48`](../../Moviqo.Front/src/features/my-work/model/myWork.ts#L48)

- Review bilingual empty, loading, failure, and table vocabulary together.
  [`messages.ts:606`](../../Moviqo.Front/src/shared/localization/messages.ts#L606)

**Shared workspace foundation**

- Provide one accessible visual loading primitive with reduced-motion behavior.
  [`feedback.tsx:113`](../../Moviqo.Front/src/shared/ui/feedback.tsx#L113)

- Add an explicit unconstrained workspace without changing existing wide pages.
  [`layout.tsx:66`](../../Moviqo.Front/src/shared/ui/layout.tsx#L66)

- Apply workspace width only inside the authenticated application shell.
  [`RoutePages.tsx:119`](../../Moviqo.Front/src/app/router/RoutePages.tsx#L119)

- Keep unauthenticated responses aligned with the canonical session-expiry boundary.
  [`client.ts:97`](../../Moviqo.Front/src/shared/api/client.ts#L97)

**Verification and local development**

- Exercise empty states, desktop/tablet/mobile layouts, accessibility, and reduced motion.
  [`my-work.spec.ts:39`](../../Moviqo.Front/tests/e2e/my-work.spec.ts#L39)

- Verify bilingual offline recovery and non-retryable permission denial.
  [`stakeholder-preview-qualification.spec.ts:326`](../../Moviqo.Front/tests/e2e/stakeholder-preview-qualification.spec.ts#L326)

- Proxy local API traffic only from the Vite development server.
  [`vite.config.ts:12`](../../Moviqo.Front/vite.config.ts#L12)

- Reject development proxy targets if they ever enter production artifacts.
  [`scan-static-artifact.mjs:8`](../../Moviqo.Front/tests/build/scan-static-artifact.mjs#L8)
