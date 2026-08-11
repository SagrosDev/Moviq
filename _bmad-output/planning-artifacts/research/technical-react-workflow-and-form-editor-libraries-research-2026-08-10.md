---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
workflowType: 'research'
lastStep: 4
research_type: 'technical'
research_topic: 'React Workflow Designer and Form Designer libraries for Moviqo'
research_goals: 'Determine the best implementation architecture and React libraries for accessible visual Workflow and Form authoring while preserving Moviqo backend-authoritative revisioned contracts.'
user_name: 'Jortiz'
date: '2026-08-10'
web_research_enabled: true
source_verification: true
---

# Research Report: technical

**Date:** 2026-08-10
**Author:** Jortiz
**Research Type:** technical

---

## Research Overview

[Research overview and methodology will be appended here]

## Technical Research Scope Confirmation

**Research Topic:** React Workflow Designer and Form Designer libraries for Moviqo
**Research Goals:** Determine the best implementation architecture and React libraries for accessible visual Workflow and Form authoring while preserving Moviqo backend-authoritative revisioned contracts.

**Technical Research Scope:**

- Architecture Analysis - design patterns, frameworks, system architecture
- Implementation Approaches - development methodologies, coding patterns
- Technology Stack - languages, frameworks, tools, platforms
- Integration Patterns - APIs, protocols, interoperability
- Performance Considerations - scalability, optimization, patterns

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-08-10

### Approved Persistence-Policy Correction — 2026-08-10

Workflow and Form Designer autosave is removed. The adopted design uses explicit **Save draft**/`Ctrl/Cmd+S`, never persists from edit/drag/blur/timer/navigation effects, and never retries a failed save automatically. Save Draft accepts incomplete but structurally coherent authoring documents; malformed, dangling, unknown, unauthorized, and stale content still fails. **Validate** evaluates publication readiness for a saved revision, and **Publish** accepts only that same unchanged validated revision. Dirty navigation offers **Save**, **Discard**, or **Stay**.

This decision supersedes earlier autosave recommendations while preserving optimistic revisions, immutable request envelopes, idempotency, conflict recovery, atomicity, and server authority. The research workflow remains at Step 4; the correction does not mark the pending research confirmation step complete.

---

<!-- Content will be appended sequentially through research workflow steps -->

## Technology Stack Analysis

### Executive Technology Direction

The strongest technical direction is a layered, adapter-based implementation:

```text
React Router route/module
        |
TanStack Query server snapshot and mutations
        |
Feature-scoped pure reducer (authoritative unsaved Moviqo document)
        |
        +-- Workflow adapter --> React Flow canvas and gestures
        |
        +-- Form adapter -----> dnd-kit palette/grid gestures
        |
Explicit-save command --> revision-aware generated API client --> Django authority
```

Neither editor library should become the source of truth. Moviqo's revisioned Workflow and Form documents, stable element/control/Process Field IDs, Task bindings, validation rules, and publication state remain authoritative. Canvas position previews, selection, hover, viewport, and in-progress gestures are transient presentation state.

**Preliminary stack decision:** retain the already-installed `@xyflow/react` for Workflow Designer; evaluate and exact-pin the current `@dnd-kit/react` line for Form Designer after a small React 19/TypeScript 6 compatibility spike. Do not adopt a complete third-party form-builder schema or a workflow execution/modeling engine.

**Confidence:** High. This conclusion is supported by the libraries' official architecture, API, compatibility, accessibility, and licensing documentation and by the existing Moviqo contracts.

### Programming Languages and Domain Contracts

- **React 19 + TypeScript remain the implementation foundation.** The editor-specific types should be discriminated Moviqo domain unions, not generic library node or component objects. Examples include Start, Task, End, future Conditional, Sequence/Conditional Transition, field controls, layout containers, and stable bindings.
- **Pure reducer commands form the editor mutation language.** Canvas events translate to commands such as `addElement`, `connectElements`, `moveElement`, `addControl`, `moveControl`, `changeSpan`, and `bindProcessField`. React documents that reducers must remain pure and may execute twice in development Strict Mode, so network calls, ID generation side effects, and persistence belong outside reducer bodies. [React `useReducer`](https://react.dev/reference/react/useReducer)
- **One renderer registry should serve design preview and runtime Task Forms.** Each field type defines its schema, default value, property editor, design preview, runtime control, normalization, and validation-message mapping. This prevents the designer preview and executed form from drifting apart.
- **Frontend declarations continue to follow the repository rule:** arrow-function constants for new TypeScript/TSX functions.

**Confidence:** High.

### Workflow Designer Library Assessment

| Candidate | Strengths | Architectural cost for Moviqo | Decision |
|---|---|---|---|
| **React Flow (`@xyflow/react`)** | React-first custom nodes/edges, typed controlled state, handles, node events, keyboard-operable graph elements, localized ARIA labels, MIT license | External palette DnD and automatic layout are intentionally separate concerns; Moviqo must provide accessible non-drag commands | **Adopt; already installed** |
| Rete.js | Extensible visual-programming engine, React 19 renderer support, dock and layout plugins | Introduces a second editor/dataflow abstraction and plugin stack overlapping Moviqo's backend workflow engine; import/export remains application work | Reject for this product model |
| bpmn-js | Mature BPMN 2.0 modeler, rules, palette, event bus, XML/meta-model | Correct only if BPMN XML and BPMN semantics become Moviqo's primary domain contract; otherwise requires permanent bidirectional model translation; watermark must remain visible under its license | Reject unless the product explicitly adopts BPMN |
| JointJS | Powerful graph model, ports, routing, custom React elements, advanced interaction potential | Own serializable graph model; several high-value editor conveniences are commercial JointJS+ features; free React layer does not supply complete accessible interaction | Reject as unnecessary model/licensing complexity |
| LogicFlow | Active TypeScript graph toolkit, custom nodes and plugins, Apache-2.0 | Framework-neutral rather than React-first; weaker public accessibility evidence and less natural integration than the dependency already present | Reject |
| BaklavaJS | Useful node-editor concepts and palette | Maintained renderer is Vue 3, not React | Reject |
| GoJS | Very mature diagramming, layouts, input tooling and React integration | Commercial per-developer licensing plus its own `GraphLinksModel` synchronization burden | Reject |

React Flow is a view-and-interaction adapter, not the workflow authority. Its controlled `nodes`, `edges`, `onNodesChange`, `onEdgesChange`, and `onConnect` APIs support that boundary. Custom React components can represent Start, Task, End, and future Conditional nodes, and `onNodeDoubleClick` can open the selected Task's dedicated Form Designer. [React Flow component API](https://reactflow.dev/api-reference/react-flow), [custom nodes](https://reactflow.dev/learn/customization/custom-nodes), [handles](https://reactflow.dev/learn/customization/handles)

React Flow provides documented focus, selection, arrow-key movement, deletion, live announcements, and localized `ariaLabelConfig`, but the application must still supply an accessible Workflow Outline and visible Add, Connect, Disconnect, Move, Delete, and Design Form actions. Canvas drag or double-click cannot be the only path. [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility), [WCAG 2.2 dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)

External-palette drag-and-drop is not built into React Flow. Its official guidance permits Pointer Events, native HTML DnD, or a third-party adapter. Moviqo should use semantic palette buttons as the baseline and treat pointer drag and double-click as accelerators. [React Flow drag-and-drop guidance](https://reactflow.dev/examples/interaction/drag-and-drop)

**License:** React Flow core is MIT. Its standard attribution should remain unless Moviqo obtains the relevant subscription permission to remove it. [React Flow license](https://raw.githubusercontent.com/xyflow/xyflow/main/LICENSE), [attribution policy](https://reactflow.dev/remove-attribution)

**Confidence:** High for adoption; medium-high for rejecting technically viable but more model-heavy alternatives.

### Form Designer Library Assessment

| Candidate | Strengths | Architectural cost for Moviqo | Decision |
|---|---|---|---|
| **Current dnd-kit React line** | Headless pointer/keyboard interaction, sortable lists/grids, multiple containers, screen-reader instructions and live regions; no imposed schema or styling; MIT | Current `@dnd-kit/react` generation is pre-1.0 and needs a focused compatibility spike and exact pins | **Adopt as gesture adapter after spike** |
| SurveyJS Creator | Highly polished visual builder, toolbox, property grid, preview, rules and broad field catalogue | Own SurveyJS JSON schema/runtime; duplicate model around stable IDs, bindings and revisions; Creator production use requires paid developer licensing | Reject for implementation; use as UX benchmark |
| Form.io | Rich builder, nested/layout controls, JSON schema and matching renderer | Own component/submission schema and runtime assumptions; styling/runtime coupling; enterprise builder features and modules add licensing/platform concerns | Reject |
| JSON Forms | Strong JSON Schema + UI Schema runtime, rules, layouts, custom renderers, React 19 support | Not a visual builder; creates another schema, validation, and rendering authority unless Moviqo deliberately changes its backend contract | Reject for current architecture |
| RJSF | Mature JSON Schema runtime, custom widgets/templates and themes | Not a visual designer; duplicate schema/validation layer and no direct gain over the planned shared Moviqo registry | Reject |
| Formily + Designable | Reactive form runtime plus visual design tools | Designable is beta, Ant Design/Formily-coupled, and its published React peer contract is outdated for React 19 | Reject |
| Craft.js | Low-level React page-editor framework with serialized editor state | Page-tree state competes with Moviqo's Form document and provides no operational-form semantics; less focused than dnd-kit | Reject |
| GrapesJS | Active HTML/CSS/template builder with blocks, layers and styles | Optimized for web-page markup rather than revisioned Task Forms and Process Field bindings; owns a separate component/canvas model | Reject |

The best Form Designer is therefore a Moviqo feature, not a re-skinned commercial builder:

```text
Field/Layout Palette
       |
dnd-kit gesture adapter ---- accessible Add/Move controls
       |
12-column Moviqo CSS grid + selection/properties panel
       |
Typed Form reducer (authoritative FormDocument)
       |
Shared field registry --> designer preview + runtime TaskFormRenderer
```

dnd-kit owns gesture recognition only. `onDragEnd` translates a gesture into a typed reducer command and does not persist an independent document. Click and double-click addition dispatch the same command. Each drag action must also expose visible Move Up, Move Down, Move To Section, and layout-span controls.

The current dnd-kit documentation distinguishes the newer `@dnd-kit/react`/helpers generation from legacy `@dnd-kit/core` and `@dnd-kit/sortable`. Because the newer API is still pre-1.0, Story 1.37 should begin with a time-boxed spike for React 19.2, TypeScript 6, Vite 8, keyboard sorting, localized announcements, reduced motion, multiple containers, and grid spans, then pin exact tested versions rather than a floating range. [dnd-kit quick start](https://dndkit.com/react/quickstart/), [migration guide](https://dndkit.com/react/guides/migration/), [accessibility guidance](https://docs.dndkit.com/guides/accessibility)

Full-builder products lose despite offering more out of the box because their schema, property system, validation, preview/runtime renderer, and persistence assumptions become a second source of truth. SurveyJS Creator is the strongest packaged-builder UX benchmark, but its own schema and commercial Creator license make it a poor architectural fit for Moviqo. [SurveyJS Creator for React](https://surveyjs.io/survey-creator/documentation/get-started-react), [SurveyJS pricing](https://surveyjs.io/pricing)

**Confidence:** High on the headless-adapter direction and rejection of full builders; medium-high on the exact new dnd-kit generation until the proposed compatibility spike passes.

### Development Frameworks and State Boundaries

- **Routing:** introduce React Router and make modules deep-linkable: Workflow Catalog, Workflow Designer, Form Designer by Task, and Process Start/Catalog. Use nested layout routes and parameters; do not keep all functionality on one page. Declarative routing is sufficient initially. [React Router declarative routing](https://reactrouter.com/start/declarative/routing)
- **Server state:** introduce TanStack Query for catalogs, server snapshots, revision-aware mutations, invalidation, loading/error/retry state, and organization-scoped query keys. TanStack Query explicitly does not replace local client/editor state. [TanStack Query state boundary](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state), [query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- **Editor state:** retain pure, route-scoped feature reducers for drafts, revision tokens, dirty/validation/conflict state, undoable domain commands, and current selection when it affects inspector behavior. Explicit save, validation, publication, and API effects live in controller hooks.
- **Context:** use a feature-scoped provider only when palette, canvas, inspector, outline, and command bar need the same reducer/commands. Split state and command contexts or use narrow selectors if profiling shows broad rerenders. Do not place editor documents in a global application Context.
- **Global store:** do not add Redux Toolkit or Zustand now. Reconsider an editor-scoped selector store only after measurements show the reducer/provider boundary cannot meet interaction performance. Never import a state package merely because it is a transitive dependency of another library.
- **Generated API client:** remain the transport boundary. UI components do not issue raw fetches or embed DTO conversion; feature hooks translate generated API DTOs to/from domain documents.

**Confidence:** High.

### Database, Persistence, and Revision Semantics

No editor library warrants changing Moviqo's Django/database authority. The server remains responsible for:

- organization and permission boundaries;
- workflow/form revisions and optimistic concurrency tokens;
- stable Workflow Element, Task, Transition, Control, and Process Field identities;
- publishability and runtime validation;
- immutable published-version behavior and audit history.

The frontend reducer holds the single authoritative unsaved draft. It must not continuously mirror that draft into the TanStack Query cache. **Save draft** serializes one immutable reducer snapshot with the expected revision; on success it accepts the returned revision, and on conflict it enters an explicit reconcile/reload flow. React Flow/dnd-kit state is never saved separately, and no edit gesture or effect initiates persistence.

**Confidence:** High.

### Layout, Performance, and Rendering

- **Epic 1 linear workflow:** use deterministic placement and preserve manual positions. Do not add an automatic-layout dependency yet.
- **Future branching:** add a swappable `WorkflowLayoutEngine` interface. Dagre is the first candidate for simple hierarchical branching and an explicit **Arrange workflow** action. ELK is better for compound graphs, ports and orthogonal routing but is significantly more complex and asynchronous; reassess it when conditionals, nested subflows, or routing constraints exist. [React Flow layout comparison](https://reactflow.dev/learn/layouting/layouting), [Dagre repository](https://github.com/dagrejs/dagre), [ELK.js repository](https://github.com/kieler/elkjs)
- **Never auto-arrange after each drag/save.** Layout is an explicit user command or a deterministic initial position for a newly inserted item; it should not silently destroy the user's spatial organization.
- **Interaction performance:** keep viewport, hover, connection preview, and in-progress pointer movement in the canvas adapter. Commit one domain `moveElement`/`moveControl` command at gesture completion. Memoize node/control components and registry lookups only after measuring actual rerender pressure.
- **Bundle boundaries:** lazy-load Workflow Designer and Form Designer routes so runtime process users do not download React Flow or dnd-kit editor code. The runtime Task Form renderer must not import designer/DnD modules.

**License note:** Dagre is MIT. ELK.js carries an EPL-2.0/GPL-3.0-or-later dual-license declaration and requires dependency/compliance review before adoption. The architecture should keep the layout engine replaceable.

**Confidence:** High.

### Testing and Tooling

The implementation can achieve strong confidence through layered technical checks and manual product acceptance:

- **Pure Node/unit tests:** reducers, validators, stable-ID behavior, DTO adapters, Workflow-document-to-canvas mapping, query-key factories, and layout adapter outputs.
- **Playwright component gallery in a real browser:** React Flow dimensions/zoom, node creation and connection, drag-end commits, Task-to-Form navigation, form sorting/grid spans, keyboard alternatives, focus movement, validation summary behavior, and designer/runtime renderer parity. Playwright's stable component-testing pattern uses the application's own Vite pipeline and a real browser, making it more suitable than jsdom for spatial editors. [Playwright component testing](https://playwright.dev/docs/test-components)
- **Page integration with mocked API:** canonical route parameters, loading/empty/error states, explicit-save revisions, dirty navigation, conflict handling, and mutation/query invalidation.
- **Manual product acceptance:** verify the complete public, authoring, and runtime path manually on the selected built revision, including pointer/keyboard alternatives, recovery, responsive presentation, and module continuity.
- **Accessibility:** semantic locator assertions, targeted axe scans, keyboard-only manual passes, reduced-motion/high-contrast checks, and manual spatial comprehension review. Automated accessibility tests remain partial. [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)

**Confidence:** High.

### Cloud and Deployment Fit

Both recommended editor libraries run entirely in the browser and require no separate editor service. Their introduction does not alter the established Django/Cloud Run deployment or migration path. Relevant delivery concerns are frontend-only:

- route-level code splitting for editor modules;
- deterministic serialization through existing APIs;
- CSP-compatible assets with no runtime CDN dependency;
- source-owned Tailwind tokens/primitives around library interaction surfaces;
- bundle-size and performance budgets tested in the production Vite build;
- deep-link rewrite support for Workflow and Form Designer routes at the static host.

**Confidence:** High.

### Adoption and Ecosystem Trends

The evaluated ecosystem separates into three categories:

1. **Headless interaction/diagram primitives** such as React Flow and dnd-kit. These integrate best when the product already owns a mature domain model and design system.
2. **Schema-driven renderers** such as JSON Forms and RJSF. These are strong when JSON Schema/UI Schema is intentionally the product contract, but they are not visual designers by themselves.
3. **Complete builder platforms** such as SurveyJS Creator and Form.io. These maximize immediate features by making their schema/runtime central and often add commercial licensing for builder capability.

Moviqo belongs in the first category because its revisioning, publication, Process Field identity, Task binding, runtime execution, and backend validation already define the product model. Choosing a library with fewer product opinions is not less capable here; it preserves one coherent source of truth while allowing Moviqo-specific UX.

**Technology-stack conclusion:**

- Workflow canvas: **React Flow**.
- Form canvas interactions: **current dnd-kit React generation, conditional on a focused spike**.
- Workflow/Form data model and validation: **Moviqo typed documents and Django contracts**.
- Client state: **feature reducers and narrowly scoped context**.
- Server state: **TanStack Query**.
- Navigation: **React Router with distinct modules/deep links**.
- UI implementation: **Moviqo Tailwind tokens/primitives, shared field registry, accessible click/keyboard alternatives**.
- Layout: **deterministic initially; Dagre later behind an interface; ELK only if complexity proves it necessary**.
- Testing: **unit/adapter, component, contract, and page-integration coverage for technical behavior plus documented manual acceptance for cross-module and stakeholder experience**.

**Overall confidence:** High, with one intentionally unresolved implementation check: the exact pre-1.0 dnd-kit React package versions must be confirmed by the Story 1.37 compatibility spike before the dependency choice is locked.

## Integration Patterns Analysis

### Integration Decision Summary

The recommended integration is deliberately small: React Router + TanStack Query + Moviqo feature reducers + the generated `openapi-fetch` REST client. React Flow and dnd-kit terminate at adapter boundaries and never communicate with the API directly.

```text
Canonical route
    |
TanStack Query GET -> accepted server snapshot
    |
initialize route-scoped reducer once
    |
React Flow/dnd-kit event -> domain command -> local document
    |
explicit immutable save envelope
    |
generated REST client -> Django revision check -> accepted revision/conflict
```

No WebSocket, SSE, GraphQL, gRPC, message broker, service mesh, microservice, CRDT, event-sourced editor, or separate Form service is required for the current single-author revisioned workflow. Those technologies would add failure modes without solving an approved Epic 1 requirement.

**Confidence:** High.

### API Design Patterns

#### REST and OpenAPI

Moviqo's current coarse-grained REST resources fit both editors:

- Workflow catalog/create;
- read/update the full revisioned Workflow draft;
- publication validation;
- publication;
- operational Task Form read/save/complete.

The Task-scoped Form Designer currently edits the Form portion of the same Workflow draft aggregate. Its route selects the Task subset; it must not invent a detached globally authoritative Form resource. If future scale or permissions require independent Form resources, that is a separate backend-aggregate decision, not a frontend-library consequence.

The generated OpenAPI client remains the transport boundary. Calls should use literal schema paths and typed `params.path`, request bodies, and inferred responses rather than interpolated URL strings and broad type assertions. `openapi-fetch` relies on literal schema paths for full compile-time checking and offers middleware for cross-cutting request/response handling. [OpenAPI Fetch documentation](https://openapi-ts.dev/openapi-fetch/), [middleware](https://openapi-ts.dev/openapi-fetch/middleware-auth)

#### GraphQL, RPC, and gRPC

Do not introduce GraphQL or gRPC. The editors save one authoritative aggregate, not an open-ended client-selected graph of data, and they run in the browser against an established Django/OpenAPI interface. GraphQL would add another schema/client/cache and gRPC would add a parallel browser transport without addressing current UX, concurrency, or validation problems.

#### Webhooks

Webhooks are not part of interactive editor save acknowledgment. Future external publication/integration notifications may use a webhook/outbox pattern, but the Designer must consider a change saved only after the synchronous authoritative API accepts its expected revision.

**Confidence:** High.

### React Flow Interoperability Contract

React Flow operates as a controlled projection:

```text
WorkflowDocument + revision
        |
projectWorkflowToFlow()
        v
controlled Node[] / Edge[]
        |
React Flow callback
        v
adaptFlowEventToCommand() -> Workflow reducer
```

React Flow's controlled APIs accept application-owned `nodes`/`edges` and expose typed change and connection callbacks. [Controlled interaction](https://reactflow.dev/learn/concepts/adding-interactivity), [component API](https://reactflow.dev/api-reference/react-flow)

| React Flow surface | Moviqo integration |
|---|---|
| `nodes`, `edges` | Pure projection using stable Moviqo element/transition IDs. Node `data` is display-oriented and does not carry a second mutable entity copy. |
| selection, dimensions, hover, connection preview | Transient canvas/view state; no dirty flag or save request. |
| position changes while dragging | Temporary position overlay for smooth rendering. |
| `onNodeDragStop` or final keyboard move | Dispatch one `moveElement` domain command if layout position is part of the Workflow contract; coalesce pixel movement. |
| `isValidConnection` | Fast pure client guard for self-links, duplicates, unsupported type pairs, cardinality, Start/End rules, and supported cycle rules. Server save/publication validation remains final. [Connection validation](https://reactflow.dev/examples/interaction/validation) |
| `onConnect` | Revalidate against the current domain document, create a stable Transition ID, and dispatch `connectElements`; do not independently call `addEdge`. [OnConnect](https://reactflow.dev/api-reference/types/on-connect) |
| delete interaction | Intercept through `onBeforeDelete`, run Moviqo rules/confirmation, dispatch the domain delete command, and prevent a competing internal mutation. [OnBeforeDelete](https://reactflow.dev/api-reference/types/on-before-delete) |
| Task double-click | Convenience callback to page-owned navigation; the visible **Design Form** link/button is primary. |
| palette click/double-click/drop | Convert position if necessary, then dispatch the same `addElement` command. External palette DnD is application-owned. |

Never persist `ReactFlowInstance.toObject()`. That format contains React Flow nodes, edges, and viewport and is appropriate for a React Flow-owned UI, not Moviqo's domain contract. [React Flow save/restore example](https://reactflow.dev/examples/interaction/save-and-restore)

If a custom Task node contains a **Design Form** button, apply React Flow's `nodrag` utility so button activation does not start a drag. Navigation uses the canonical route `/workflows/:workflowId/tasks/:taskElementId/form` and remains owned by the page/route composition rather than a sibling-feature deep import. [React Flow utility classes](https://reactflow.dev/learn/customization/utility-classes), [React Router navigation](https://reactrouter.com/api/hooks/useNavigate)

**Confidence:** High for the API boundary; medium-high for the transient position overlay because it is Moviqo's performance/concurrency design rather than a React Flow prescription.

### dnd-kit Interoperability Contract

dnd-kit owns only the current source, current target, sensors, collision calculation, drag feedback, and announcements. Moviqo owns stable IDs, semantic containers, item order, width/span, validation, revision, and persistence.

The current React adapter provides `DragDropProvider`, `useDraggable`, `useDroppable`, and `useSortable`; the new generation exposes source/target operation data and uses `@dnd-kit/helpers` only as an optional collection helper. [dnd-kit quick start](https://dndkit.com/react/quickstart/), [migration guide](https://dndkit.com/react/guides/migration/)

| dnd-kit event | Moviqo command |
|---|---|
| palette template dropped on canvas/container | `controlAdded(kind, targetContainerId, targetIndex)` with a newly allocated stable domain ID |
| existing control dropped at a new index/container | `controlMoved(controlId, sourceContainerId, sourceIndex, targetContainerId, targetIndex)` |
| canceled or missing/invalid target | no domain mutation; announce cancellation/rejection |
| width selector/button | `controlSpanChanged(controlId, span)`; span is not inferred from pointer coordinates |
| `onDragOver` | feedback and eligibility only in the initial design; no save request or authoritative array mutation |
| `onDragEnd` | the single normal local mutation point, followed by focus restoration and dirty-state indication; persistence still requires **Save draft** |

Use `type`/`accept` to distinguish field versus structural destinations and stable Moviqo control IDs as sortable IDs. Palette IDs identify templates only. The authoritative Form reducer should perform structural moves itself instead of depending on a generic array helper that cannot enforce Form invariants. dnd-kit's state guide supports application-owned sortable state and custom management. [Sortable state management](https://dndkit.com/react/guides/sortable-state-management/), [useSortable](https://dndkit.com/react/hooks/use-sortable/)

The constrained layout is semantic, not coordinate-based:

- logical document order defines DOM and keyboard order;
- Sections/layout regions are named sortable containers;
- controls carry full/half/third/quarter spans rendered through Moviqo's twelve-column CSS Grid;
- narrow operational rendering becomes full width;
- snap-to-grid modifiers are not used to define semantic column spans.

The default Pointer and Keyboard sensors must be preserved when customizing sensors. Use a dedicated focusable drag-handle button, activation distance for pointer input, Space/Enter to pick up/drop, arrows to move, and Escape to cancel. Inputs and property actions do not act as drag handles. [dnd-kit sensors](https://dndkit.com/react/guides/sensors/)

The Accessibility plugin is a foundation, not conformance. Configure bilingual instructions and live announcements using user-visible labels, one-based positions, named containers, success/cancellation, and restored focus. Always include visible Move Up/Down/To Section and span controls. [dnd-kit accessibility plugin](https://dndkit.com/extend/plugins/accessibility/), [WCAG dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)

**Confidence:** High, subject to the planned exact-version compatibility spike.

### Communication Protocols

#### HTTPS Request/Response

Continue using JSON over HTTPS through the same-origin public application/API path. Editor reads and mutations are conventional request/response operations with explicit accepted, validation, authorization, and conflict outcomes. A success indicator is shown only after the server acknowledges the change.

#### Explicit Save Ordering

Saving occurs only when the Designer chooses **Save draft**, presses `Ctrl/Cmd+S`, explicitly retries an unchanged failed command, or completes the separate validated publication action. No debounce, timer, edit, drag, blur, route transition, or failed response initiates a request. Every save uses an immutable envelope:

```text
{
  snapshot,
  expectedRevision,
  idempotencyKey,
  localSequence
}
```

Recommended sequence:

1. The reducer records local commands immediately.
2. An explicit Save Draft command snapshots the current document into an immutable envelope.
3. Only one save command for that Workflow is in flight; disable or coalesce repeated activation of the same command.
4. If the user edits during the request, retain those newer commands.
5. On acceptance, advance the acknowledged revision for the exact submitted snapshot without replacing newer local edits; newer edits remain dirty and are not enqueued automatically.
6. For an unknown or failed outcome, retain the immutable envelope and offer a user-driven retry with the same payload and idempotency key. Never retry automatically.
7. Changed content creates a new save command and idempotency key; validation, authentication, authorization, not-found, and revision-conflict failures remain terminal until user action.
8. On conflict, retain the local snapshot, fetch the latest authorized version only through explicit recovery, and offer reload/reapply guidance.
9. Validation evaluates a saved revision. Publication accepts only that same unchanged, successfully validated revision; subsequent local edits require another Save Draft and validation.

TanStack Query mutations normally run in parallel unless a shared mutation scope serializes them, which is useful as an additional guard for a Workflow resource. [TanStack Query mutations and scope](https://tanstack.com/query/v5/docs/framework/react/guides/mutations)

The existing `expectedRevision` request-body field and conflict problem code are valid and need not be replaced. HTTP `ETag`/`If-Match` with `412 Precondition Failed` is a standards-based future normalization for lost-update prevention, not a prerequisite for these stories. [RFC 9110 HTTP preconditions](https://datatracker.ietf.org/doc/html/rfc9110#section-13.1.1), [MDN ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)

#### WebSocket and SSE

Do not add WebSocket for current editor saves. A transport does not itself solve simultaneous edit reconciliation; true collaboration would first require explicit product requirements and separate OT/CRDT, presence, authorization, and recovery research. SSE might later notify a user that a server revision changed, but must not become a second document-synchronization channel.

**Confidence:** High.

### Data Formats and Standards

- **Persisted format:** generated OpenAPI JSON matching the authoritative revisioned Workflow draft contract.
- **Workflow canvas projection:** typed React Flow nodes/edges created at runtime; never an API payload of their own.
- **Form gesture state:** dnd-kit source/target/groups/indices exist only during interaction; persisted output is stable Moviqo IDs, semantic order/container, and approved span.
- **Validation errors:** retain normalized Problem Details plus structured `invalidParams` paths/codes. The UI maps paths to stable field/item/element targets, produces a localized summary, reveals/focuses the first invalid target, and presents unmapped/non-field errors visibly.
- **BPMN XML:** not adopted because BPMN is not the current Moviqo domain/interchange standard.
- **JSON Schema/UI Schema:** not adopted as a parallel Form contract. Revisit only through an explicit backend-contract decision.
- **Binary formats such as Protobuf/MessagePack:** unnecessary for the current document sizes and browser/OpenAPI boundary.
- **CSV/flat files:** irrelevant to interactive Designer persistence; future import/export needs its own validation and mapping contract.

**Confidence:** High.

### Router and Module Interoperability

Canonical, reload-safe routes establish the product boundary:

- `/workflows` — authorized catalog;
- `/workflows/new` — creation;
- `/workflows/:workflowId/design` — Workflow Designer;
- `/forms` — authorized Workflow then Task launcher;
- `/workflows/:workflowId/tasks/:taskElementId/form` — canonical Form Designer;
- `/processes/start` — published Workflow runtime catalog.

React Router supports nested/layout routes and dynamic segments directly. [React Router routing](https://reactrouter.com/start/declarative/routing)

The Workflow and Form routes edit the same revisioned Workflow aggregate today, so they share an organization-scoped query/resource identity. The Task parameter selects an authorized Task within the Workflow. Navigating to a newly created Task's Form requires that its stable ID and draft revision have been accepted or that the application can safely carry the same stable client-generated ID under the existing contract.

Dirty/conflicted editor navigation should use an in-application blocker and a browser-unload warning only while unsaved work exists. Route transitions also require title, focus, and announcement management. [React Router `useBlocker`](https://reactrouter.com/api/hooks/useBlocker), [`useBeforeUnload`](https://reactrouter.com/api/hooks/useBeforeUnload), [accessibility guidance](https://reactrouter.com/how-to/accessibility)

**Confidence:** High.

### TanStack Query and Reducer Handoff

TanStack Query owns remote snapshots/catalogs; reducers own mutable editor documents. TanStack Query explicitly distinguishes server state from local client state and notes that complex visual designers may still require dedicated local state. [TanStack Query state boundary](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state)

Recommended handoff rules:

- query keys include Organization plus complete resource identity, for example `['organization', organizationId, 'workflowDraft', workflowId]`;
- seed the reducer from an accepted query snapshot once;
- never copy each local edit into Query cache;
- prevent focus/reconnect refetch from silently replacing a dirty reducer; surface that a newer server version may exist;
- after an acknowledged save envelope, update the exact draft snapshot only if it corresponds to that envelope and invalidate affected catalog summaries;
- after publish, invalidate draft, Workflow catalog, and startable/published Workflow queries;
- clear organization-scoped caches and editor reducers on sign-out or organization switch;
- pass TanStack Query abort signals to obsolete GET operations, but do not interpret a client-aborted mutation as proof that the server did not apply it.

TanStack Query documents deterministic query-key use, targeted invalidation after mutation success, and important refetch defaults that must be configured deliberately for an editor. [Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys), [mutation invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations), [important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

**Confidence:** High.

### System Interoperability Approaches

#### Point-to-Point and API Gateway

The browser should continue calling the public versioned Django API through the established public application origin. The generated client and server OpenAPI contract are the interoperability layer. No separate frontend BFF or API gateway is justified solely for the editors.

#### Service Mesh and Enterprise Service Bus

Neither is relevant to a browser SPA and modular-monolith Django backend. Introducing them would not improve editor state ownership, accessibility, or revision conflict behavior.

#### Microservices

Keep Workflow authoring, Form bindings, validation, and publication inside the existing Django authority. Splitting Workflow and Form editing into services would create distributed transaction and authorization problems around one revisioned aggregate. A future independent Form aggregate may justify a service boundary only after domain and scaling evidence, not because a frontend library prefers it.

**Confidence:** High.

### Event-Driven Integration

- **Publish/subscribe:** not used for interactive save confirmation. Downstream audit/notification processing may remain asynchronous after the authoritative transaction.
- **Event sourcing:** not required. Revisioned drafts, immutable published versions, and audit records meet current recovery/history requirements without rebuilding the product around event replay.
- **CQRS:** no additional CQRS layer is needed. Catalog/read endpoints and revisioned commands already provide an adequate practical read/write separation.
- **Message broker:** never use broker acceptance as the user's save acknowledgment. Only the authoritative database transaction can confirm the revision.

**Confidence:** High.

### Integration Security Patterns

- Preserve same-origin Django session cookies; do not introduce browser-stored bearer tokens for the editors.
- Unsafe requests retain CSRF bootstrap/header behavior, HTTPS, secure-cookie settings, and Django Origin/Referer verification. Django recommends the `X-CSRFToken` header for AJAX requests and same-origin handling. [Django CSRF guidance](https://docs.djangoproject.com/en/5.2/howto/csrf/)
- Every route Workflow/Task ID is untrusted input. The backend must authorize Workflow membership and verify that the Task belongs to that Workflow and current organization. Cache-key organization IDs partition client state but are never authorization.
- Treat `401` as session loss. Treat `403` as authorization denial or a possible CSRF failure; do not automatically sign out for every `403`.
- Idempotency keys prevent duplicate mutation effects but are not credentials and do not replace authorization/revision validation.
- Do not log full draft payloads, session/CSRF values, Process Data, or idempotency keys in browser or server telemetry.
- Clear organization-scoped Query data and reducer state on sign-out, expiry, or organization switch to prevent cross-context display.

Cookie authentication requires CSRF defenses, and OpenAPI can describe cookie security schemes explicitly. [OpenAPI cookie authentication](https://swagger.io/docs/specification/v3_0/authentication/cookie-authentication/)

**Confidence:** High.

### Cross-Integration Quality Assessment

The library APIs and the existing Moviqo revision contract align well when events cross exactly one adapter boundary before reaching a domain reducer. The primary risks are implementation errors rather than missing infrastructure:

1. allowing React Flow/dnd-kit state to become independently persisted;
2. copying dirty documents into both reducer and Query cache;
3. permitting duplicate explicit saves or applying responses to the wrong local snapshot;
4. navigating to a Task Form before stable identity/save reconciliation;
5. treating drag/double-click as the only interaction path;
6. erasing dirty work on automatic refetch or conflict;
7. bypassing generated-client typing with interpolated strings/assertions;
8. confusing `403` authorization/CSRF outcomes with session expiry.

The research found no integration gap requiring new infrastructure. Exact package compatibility and event-shape behavior remain appropriate subjects for the planned focused component spike.

**Overall confidence:** High.

## Architectural Patterns and Design

### Architectural Decision Summary

The recommended design combines four patterns:

1. **Feature-sliced SPA:** routes compose features; dependencies flow downward through public entry points.
2. **Ports and adapters around editor libraries:** React Flow and dnd-kit sit behind typed projections/event adapters and cannot leak into domain or API contracts.
3. **Command/reducer editing model:** all interaction methods converge on semantic commands applied by a pure feature reducer.
4. **Registry-based rendering:** one typed field registry drives defaults, property metadata, Designer preview, operational rendering, and validation targeting.

```text
app
  providers, router, authenticated/public layouts
     |
pages
  route composition and navigation callbacks
     |
features
  workflow-design       form-design       task-form
  controller/reducer    controller/reducer registry/runtime renderer
     \                       |                 /
      \---- public domain/entity contracts --/
                         |
shared
  generated API, problem mapping, UI primitives, Form Grid, localization
```

This is a modular frontend over the existing Django modular monolith. Microservices, a frontend backend-for-frontend, and library-owned graph/form persistence are explicitly rejected.

**Confidence:** High.

### System Architecture Patterns

#### Feature-Sliced SPA

Retain the repository's adopted dependency direction: `app -> pages -> features -> entities -> shared`. Each feature exposes a public `index.ts`; pages may compose multiple features, but sibling features do not deep-import each other's internals.

Recommended responsibilities:

```text
app/
  providers/              Router, Query, session, language, theme
  routes/                 canonical route table and lazy boundaries

pages/
  workflow-catalog/
  workflow-create/
  workflow-design/
  form-launcher/
  form-design/
  process-start/

features/workflow-design/
  api/                    query/mutation hooks using generated client
  model/                  WorkflowDocument, commands, reducer, validators
  lib/react-flow/         projection and event adapter
  ui/                     palette, canvas, outline, inspector, action bar

features/form-design/
  api/                    Task-scoped draft save orchestration
  model/                  Form commands, reducer, selectors, validators
  lib/dnd-kit/            sensors, event adapter, accessible announcements
  ui/                     palettes, grid canvas, inspector, preview

features/task-form/
  model/registry/         typed field/structural registry
  ui/                     TaskFormRenderer and item renderers

entities/workflow/
  public cross-feature document/entity types and stable identity helpers

shared/ui/
  Button, Field, Select, Textarea, FormGrid, validation summary, status
```

Route pages are composition roots: they read parameters, enforce page-level states, load the accepted snapshot, initialize the controller, and pass navigation callbacks. A canvas component cannot navigate by importing a Form page or call an API directly.

#### Modular Monolith Backend

Workflow graph, Task-bound Forms, validation, and publication remain one transactional authoring capability in Django. The editor split is a UX/module separation, not a distributed-system split. One revisioned aggregate gives consistent save, validation, authorization, and publication behavior without sagas or cross-service transactions.

#### Anti-Corruption Layer

Third-party types terminate under `lib/react-flow` and `lib/dnd-kit`. Domain model/reducer/API modules must not import `Node`, `Edge`, `DragDropProvider`, `useSortable`, or library operation types.

Recommended ports:

```ts
type WorkflowCanvasProjection = Readonly<{
  nodes: readonly WorkflowCanvasNode[];
  edges: readonly WorkflowCanvasEdge[];
}>;

type WorkflowCanvasCommandSink = (command: WorkflowCommand) => void;
type FormGestureCommandSink = (command: FormCommand) => void;
```

The concrete adapter can use library types internally, but exported contracts speak Moviqo language. This limits dependency upgrades, prevents accidental persistence of vendor state, and makes adapters testable without rendering the whole page.

**Confidence:** High.

### Design Principles and Best Practices

#### Single Source of Truth Per State Category

React recommends one owner for each unique piece of state and avoiding redundant/duplicated state. [Sharing state](https://react.dev/learn/sharing-state-between-components), [choosing state structure](https://react.dev/learn/choosing-the-state-structure)

Apply that rule explicitly:

| State category | Sole owner |
|---|---|
| authenticated session/language/theme | stable application provider |
| server catalogs and accepted snapshots | TanStack Query |
| unsaved Workflow/Form document | route-level feature reducer |
| revision, dirty/save/conflict state | same feature controller/reducer |
| semantic selection used by inspector/outline | feature controller, stored as stable ID |
| current pointer/keyboard drag operation | React Flow/dnd-kit adapter |
| viewport pan/zoom and connection preview | React Flow presentation state |
| field renderer/configuration definitions | typed field registry |

Do not store selected objects when a stable ID plus the document can derive them. Do not store derived node/edge/control arrays as independent semantic state. React specifically recommends avoiding redundant/duplicate state and keeping selection by ID when possible. [Choosing state structure](https://react.dev/learn/choosing-the-state-structure)

#### Command/Reducer Pattern

Every user intent becomes a semantic command independent of input method:

```text
palette click
palette double-click
keyboard Add
pointer drop
     -> addElement/addControl command

handle connection
source/target selectors
     -> connectElements command

pointer reorder
keyboard drag
Move Up/Down buttons
     -> moveControl command
```

Reducers validate structural invariants and return new documents plus state transitions. Controller commands perform explicit save, reload, validation, and publication; effects may synchronize non-persistence concerns but must not initiate saving. React recommends reducers for consolidating complex screen update logic and documents combining them with scoped composition when deep descendants need commands. [React reducer/context guidance](https://react.dev/learn/scaling-up-with-reducer-and-context)

The adopted Moviqo architecture should not introduce global editor Context. Begin with a route-level controller hook returning narrow state/selectors/commands to presentation regions. If prop depth becomes harmful, any future provider must remain mounted inside one editor route, expose separate read/command interfaces, and be approved against the existing architecture decision. Context consumers rerender when their provided value changes even through memoized ancestors, so a large frequently-changing document value is a poor global Context. [React `useContext`](https://react.dev/reference/react/useContext)

#### State Machine for Save and Conflict Status

Represent mutually exclusive network/editor states with a discriminated union rather than overlapping booleans:

```text
clean
dirty
saving(snapshotRevision, localSequence)
retryableFailure(envelope, attempt)
conflict(localSnapshot, serverRevision)
validationFailure(issues)
fatalFailure(problem)
```

This prevents impossible combinations such as `saved && conflict` or `saving && retrying`. The UI derives button availability, status text, navigation blocking, and publication eligibility from this state.

#### Registry Pattern

Each registry entry is exhaustive and source-owned:

```text
kind
defaultDefinition()
propertySchema
DesignerPreview
RuntimeControl / StructuralRenderer
normalizeValue()
mapServerIssue()
capabilities (data-bound, layout, allowed containers, spans)
```

Registry lookup fails explicitly for unknown kinds. Unsupported controls must render a safe diagnostic placeholder in authoring, block publication when necessary, and never silently disappear from runtime.

#### Undo/Redo Extension Seam

Semantic commands should be designed so a bounded command-history layer can later implement Undo/Redo without understanding React Flow or dnd-kit events. Full persisted collaborative history is not needed for Epic 1. Before adding Undo/Redo, define how it interacts with saved-snapshot acknowledgment, conflicts, destructive commands, and route changes; do not use React Flow's UI history as Workflow history.

**Confidence:** High, except the timing of Undo/Redo, which is a product-priority decision.

### Component Architecture

#### Workflow Designer Composition

```text
WorkflowDesignPage
  WorkflowDesignController
    WorkflowEditorHeader
      Breadcrumbs + save/conflict status
    WorkflowEditorWorkspace
      WorkflowElementPalette
      WorkflowCanvasAdapter (React Flow)
      WorkflowOutline
      WorkflowElementInspector
    WorkflowPublicationPanel
      validation checklist
      Validate / Publish actions
```

The controller owns the reducer and effects. The Canvas and Outline are two views/interaction surfaces over the same document and selection ID. Selecting either updates one semantic selection. Validation issues carry stable target IDs so the controller can select, reveal, focus, and announce the exact node/edge/property.

#### Form Designer Composition

```text
FormDesignPage
  FormDesignController
    FormDesignerHeader
      Workflow/Task breadcrumbs + save/conflict status
    FormDesignerWorkspace
      FormPaletteTabs (Fields / Layout)
      FormCanvasAdapter (dnd-kit + FormGrid)
      FormItemInspector
      WorkflowFieldCatalog
    FormPreviewPanel
      TaskFormRenderer read-only/design mode
    FormValidationSummary
```

The Form Canvas decorates shared item renderers with design affordances; it does not reimplement field markup. The operational `TaskFormRenderer` imports the field registry and shared UI but never imports Form Designer or dnd-kit modules.

#### Primitive Versus Domain Component Boundary

The product should not expose raw unstyled browser controls at page level. Native semantics remain inside source-owned primitives:

- `TextField`, `SelectField`, `CheckboxField`, `TextareaField` own label/help/error/required/disabled/focus composition;
- `Button`, `IconButton`, `Menu`, `Dialog`, `Tabs`, `Toolbar`, `StatusBadge`, `ValidationSummary` own consistent interaction and tokens;
- Workflow nodes and Form field renderers compose those primitives with domain meaning;
- Tailwind utilities implement approved tokens and responsive layout, not ad hoc one-off colors in pages.

This preserves native accessibility while eliminating visual inconsistency.

**Confidence:** High.

### Scalability and Performance Patterns

#### Render Isolation

React Flow warns that node movement produces frequent updates and recommends memoizing custom node/edge components and callback/object props, while avoiding broad subscriptions to the entire nodes/edges arrays from unrelated panels. [React Flow performance](https://reactflow.dev/learn/advanced-use/performance)

Recommended measures:

- declare node/edge component registries at module scope;
- memoize custom nodes/edges and stable callbacks/options;
- have Inspector/Outline consume semantic document selectors, not React Flow's frequently changing node array;
- keep drag position overlays inside the canvas boundary and commit once on completion;
- derive projections with stable IDs and structural sharing where practical;
- use virtualization only for genuinely long palettes/catalogs/outlines after measurement;
- avoid animated edges, heavy shadows, filters, and gradients in large graphs or reduced-motion mode;
- profile before adding a global selector store.

#### Code Splitting

Workflow and Form Designer routes should be lazy-loaded so landing, authentication, dashboards, and operational Task Forms do not download authoring libraries. React Router route `lazy` supports route-level code splitting, while declarative route components without a lazy boundary do not split automatically. [React Router Route API](https://reactrouter.com/api/components/Route)

The runtime `TaskFormRenderer` remains in a separate dependency direction so importing it does not pull dnd-kit into Task execution.

#### Scaling Thresholds

Epic 1's linear Start-Task-End graph does not justify complex layout or canvas optimization. Establish measurements rather than guessing:

- interaction latency during drag and selection;
- render counts for canvas, nodes, outline, and inspector;
- production route chunk sizes;
- save payload size and serialization time;
- field-control count and graph-node count at representative future complexity.

Introduce Dagre only for an explicit simple hierarchical Arrange operation. Evaluate ELK when multiple ports, compound/nested graphs, or orthogonal branch routing become real requirements. Introduce a selector store only if profiling shows route-reducer prop composition cannot isolate hot updates.

#### Caching

TanStack Query caches server snapshots/catalogs; static hosting caches immutable hashed assets. Never CDN-cache authenticated/API responses. Do not add Redis or a distributed cache for editor state without measured backend contention.

**Confidence:** High.

### Integration and Communication Patterns

The architectural boundary is unidirectional:

```text
API accepted snapshot
       -> domain document
       -> library projection

library event
       -> adapter
       -> semantic command
       -> reducer
       -> explicit save envelope (only on user command)
       -> API
```

This is a practical hexagonal boundary: the domain model does not know which canvas or gesture library is installed. Replacing React Flow or dnd-kit would require a new adapter, not a data migration.

Feature communication happens through:

- stable route parameters;
- public entity/document contracts;
- page-owned navigation callbacks;
- generated API operations;
- deliberate TanStack Query invalidation.

It does not happen through sibling deep imports, browser events, hidden global stores, or copying documents into Query cache.

**Confidence:** High.

### Security Architecture Patterns

#### Server-Authoritative Object Access

Every Workflow/Task/Form identity from a route or document is attacker-controlled input. Server operations verify organization membership, role/capability, Workflow ownership, Task membership within the Workflow, allowed field binding, current draft revision, and publication state. OWASP identifies missing checks on user-supplied object IDs as Broken Object Level Authorization and requires checks in every endpoint using such IDs. [OWASP API1:2023 BOLA](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)

Random IDs reduce enumeration but do not replace authorization. Client route guards and hidden buttons improve clarity only.

#### Mass Assignment and Schema Validation

The backend accepts only discriminated, known element/control properties and verifies references and structural invariants. It must not persist arbitrary React Flow node `data`, dnd-kit operation objects, unknown property-bag keys, or client-supplied tenant/authorization fields. Generated request types help but server validation remains mandatory.

#### Browser Security

Preserve HttpOnly session cookies, CSRF headers and Origin/Referer verification, same-origin API routing, explicit CSP, and dependency/license review. Editor previews render structured components; Designer-authored instruction/heading text is treated as text, not arbitrary HTML. Any later rich-text capability requires a sanitization/threat-model decision.

#### Sensitive Data and Telemetry

Do not send full draft/form values to generic analytics, error trackers, console logs, or accessibility snapshots outside approved synthetic tests. Diagnostics use correlation IDs, stable error codes, route templates, build identity, and redacted counts—not Process Data or designer-authored contents.

**Confidence:** High.

### Data Architecture Patterns

#### Revisioned Aggregate

One mutable Workflow draft with an optimistic revision is the authoring aggregate. Workflow graph and Task-bound Form definitions change under the same expected-revision contract. Published versions are immutable snapshots. The frontend holds one mutable working copy per open route and accepts server revisions explicitly.

#### Stable Identity

- Workflow elements, transitions, Form controls/items, Process Fields, and bindings have stable opaque IDs.
- React list keys, React Flow IDs, dnd-kit sortable IDs, validation target paths, and route parameters reuse or map predictably to those domain IDs.
- Array index is never persistent identity.
- Palette-template identity is distinct from a created control's persistent ID.

#### Layout Data

Workflow positions are persisted only through an explicit domain layout contract; viewport is never part of semantic Workflow revision. Form layout persists semantic order, container, and approved span, not pixel coordinates. Runtime rendering derives responsive placement from this semantic layout.

#### Validation Data

Client validation provides immediate feedback but cannot redefine server publication/runtime semantics. Server Problem Details and structured issue paths map through registries/adapters into stable targets. Unmapped issues remain visible at Form/Workflow level and block false success.

#### Future Migration Discipline

Adding Conditional nodes, new Transition types, rich fields, nested layouts, or independent Form resources requires versioned discriminated contracts, tolerant read behavior where approved, explicit backend migration/validation, and exhaustive registry cases. Libraries do not decide document-version evolution.

**Confidence:** High.

### Deployment and Operations Architecture

- Produce one static Vite SPA and preserve the existing Django/Cloud Run backend deployment.
- Lazy editor chunks are immutable hashed assets; API/session responses are not cached by Firebase/CDN.
- No runtime CDN script or library-hosted service is required by React Flow/dnd-kit.
- Dependency versions and licenses are pinned/reviewed in the implementing story; the dnd-kit spike gates final package adoption.
- Production build checks record route chunks and fail on accidental runtime-to-designer dependency leakage or unacceptable size regression.
- Health checks continue to verify backend build/environment identity; editor-library installation creates no migration or deployment job.
- Accessibility and interaction evidence comes from real-browser component/page integration plus the existing deployed stakeholder journey.
- Observability records save timing, status class, conflict/retry counts, and redacted graph/control counts without draft contents.

**Confidence:** High.

### Architectural Trade-offs and Risks

| Decision | Benefit | Cost/Risk | Mitigation |
|---|---|---|---|
| Custom Moviqo Form Designer + dnd-kit | Exact domain/revision/design-system fit | More product UI must be built than with SurveyJS/Form.io | Constrained grid, typed registry, shared runtime renderer, phased field catalogue |
| React Flow adapter | Mature canvas interaction without replacing domain | Projection/event synchronization bugs | Pure adapters, stable IDs, convergence tests, no `toObject()` persistence |
| Route-scoped reducer | Clear authority and testable commands | Large screens can rerender broadly if poorly composed | Narrow props/selectors, isolate transient canvas state, profile before new store |
| Shared Workflow aggregate for Task Forms | Atomic publication and existing contract reuse | Separate Workflow/Form routes can conflict with each other | Shared resource key, one in-flight explicit command, dirty-navigation guard, explicit conflict recovery |
| No global editor store | Avoids hidden cross-route state and tenant leakage | More explicit controller composition | Public hooks/view models and route-owned composition |
| No full builder platform | Avoids competing schema/license/runtime | Fewer ready-made controls/properties | Registry makes new field types incremental and consistent |
| No real-time collaboration | Keeps concurrency model comprehensible | Simultaneous editors see conflicts, not live presence | Clear save/conflict state; revisit only with explicit collaboration requirements |

### Architectural Quality Assessment

The architecture is internally coherent and fits the adopted repository spine. Its strongest property is that every layer has one clear authority. The largest delivery risk is not technology capability; it is building too much editor scope before the constrained Start-Task-End and Short Text thin slice is polished.

Architecture guardrails should be executable:

- reject feature-to-page and sibling-feature deep imports;
- reject React Flow/dnd-kit imports outside their adapters/UI boundaries;
- reject raw API calls outside generated-client hooks;
- reject runtime Task Form imports of Form Designer/DnD code;
- verify all interaction methods emit identical semantic commands;
- verify dirty documents cannot be overwritten by Query refetch;
- verify no vendor serialization is sent to the backend;
- verify every route ID receives server-side object authorization;
- verify unknown document kinds fail visibly and safely.

**Overall confidence:** High.
