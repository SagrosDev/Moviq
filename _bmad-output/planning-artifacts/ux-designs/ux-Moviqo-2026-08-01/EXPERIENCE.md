---
name: Moviqo
description: Responsive web experience for designing, running, and improving SME workflows.
status: final
created: 2026-08-01
updated: 2026-08-01
sources:
  - "../../prds/prd-Moviqo-2026-07-30/prd.md"
  - "../../briefs/brief-moviqo-2026-07-30/brief.md"
  - "../../prds/prd-Moviqo-2026-07-30/padr-supersession.md"
---

## Foundation

Responsive web. Operational flows work on mobile, tablet, laptop, and desktop. Workflow and Form authoring is optimized for laptop and desktop; narrow mobile authoring and native mobile applications are outside the MVP. The visual identity is defined by `DESIGN.md`, with behavioral references such as `{colors.primary}` and `{components.guidance-card}` used only where visual state matters.

Moviqo is Spanish-first with English selectable by the user. Designer-authored workflow content remains in the language entered by the Designer.

The stakeholder preview adds a presentation-readiness boundary before the walkthrough: the public landing, onboarding/authentication, My Work, Workflow creation/Designer, Task Form, and Process detail/timeline must use the approved shared component system, aligned layouts, reviewed bilingual copy, and the visually approved token set. Functional automation alone does not establish presentation readiness.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Public landing | Public URL | Explain the value with fictional examples and route to beta registration or sign-in |
| Registration and activation | Landing | Create the first Organization and Owner account |
| Guided first workflow | First dashboard / Start a Workflow | Teach an Owner/recruiter to create and publish a simple process |
| Dashboard | Sign-in | Separate Start a Process, My Tasks, My Processes, and administrative attention |
| My Tasks | Dashboard | Show only authorized tasks requiring the Member's attention |
| My Processes | Dashboard | Show authorized process progress and the Member's own contributions |
| Start Process catalog | Dashboard | Show authorized published Workflows as clear startable products rather than mixing them with Tasks or Processes |
| Workflow catalog | Authoring navigation | Find draft, published, and archived Workflow definitions and create a new Workflow |
| Workflow creation | Workflow catalog | Capture the Workflow name and navigate to its dedicated Designer after server acceptance |
| Workflow Designer | Workflow catalog / creation | Configure the graph, assignment, starter, validation, and publication in a dedicated workspace |
| Form Designer launcher | Authoring navigation | Select an existing Workflow and Task, then open the canonical Form Designer |
| Form Designer | Selected Task / launcher | Configure the selected Task Form in a dedicated palette/canvas/properties workspace |
| Task Form | My Tasks / process position | Complete an assigned or claimed Task and submit authorized data |
| Process detail and timeline | My Processes / assigned Task | Show limited progress, authorized history, and own contributions |
| Needs Attention | Administrator / Owner area | Resolve invalid assignments, open operational issues, and reassignment |
| Organization administration | Administrator / Owner area | Manage users, Teams, settings, quotas, and lifecycle |

Members do not browse the Organization's work by default. Access is granted through direct assignment, eligible Team assignment, participation, or explicit administrative authority.

## Voice and Tone

Moviqo speaks like a patient colleague. Use plain verbs, short explanations, and concrete examples.

| Do | Don't |
|---|---|
| “What should happen first?” | “Configure the initial node.” |
| “Add the person who will complete this task.” | “Set the task assignee resolver.” |
| “Your workflow is ready to publish.” | “Validation passed successfully.” |
| “Only people assigned to this task can open it.” | “Insufficient permissions.” |
| “We need one more detail before publishing.” | “Invalid graph configuration.” |

## Component Patterns

| Component | Use | Behavioral rules |
|---|---|---|
| Guided step | First workflow and complex Designer areas | One decision per step; explain why; provide Continue, Back, Save draft, and Skip when safe |
| Guidance card | Inline teaching | Dismissible, revisitable, contextual, and never the only way to understand a required action |
| Workflow element | Designer canvas/list | Add through visible controls as well as drag where practical; each element exposes a plain-language purpose |
| Workflow palette | Workflow Designer | Supports drag, click/double-click, and keyboard Add; successful addition selects and reveals the element immediately |
| Form palette | Form Designer | Separates Fields from Layout, supports dnd-kit drag plus click/double-click Add, and never makes drag the only operation |
| Task card | My Tasks and narrow layouts | Shows task, workflow, status, assignee, and primary action; expands for authorized context |
| Form field | Task Forms and Designer | Label above control, concise help, accessible validation, and responsive reflow |
| Assignment control | Designer and admin reassignment | States who receives work, why, and what happens if the assignee becomes invalid |
| Publish checklist | Workflow Designer | Lists unresolved issues, links to each location, and prevents publication until all required checks pass |
| Timeline | Process detail | Shows authorized events, actor, time, state, and task position without exposing restricted data |

## Presentation-Readiness Rules

- Public landing and onboarding use public-only navigation; authenticated work and the Design System are not exposed as public navigation choices.
- The landing hero communicates one value proposition, one dominant registration action, one secondary sign-in action, and a credible product visual without fabricated customer evidence.
- Authentication uses a compact form composition with consistently full-width controls and aligned actions. Registration groups identity, Organization, regional defaults, and consent into readable sections.
- My Work, Workflow authoring, Task Form, and timeline use shared cards, fields, statuses, and action bars with one dominant next action per region.
- Dashboard, My Tasks, My Processes, Start Process, Workflow catalog/creation/Designer, Form launcher/Designer, Task Form, and Process detail use canonical, reload-safe routes with role-appropriate navigation. Major modules are not stacked on one page.
- Workflow authoring uses React Flow for efficient canvas interaction while retaining an accessible outline and explicit add/connect/reorder operations. Canvas state never substitutes for the revisioned Moviqo workflow document. A selected Task exposes Design Form navigation; conditional nodes remain absent until supported by Epic 4.
- Form authoring and runtime rendering share one typed field registry so the preview matches the operational Task Form. The dedicated Designer uses constrained approved spans, not free-form positioning, and dnd-kit gesture state never substitutes for the revisioned Form document.
- Failed form submission presents an actionable localized error summary, focuses and reveals the first invalid field, preserves correctable input, and explains non-field failures without making a correlation ID the recovery instruction.
- Desktop Forms use the twelve-column layout and approved widths. Mobile operational Forms stack to one column; authoring below its supported size does not pretend to be fully usable.
- A palette or component refresh is accepted only after the Design System checkpoint and human desktop/mobile screenshot review. Automated accessibility and contrast checks remain complementary evidence.
- No additional deployed E2E program is required for the visual refresh. The existing Story 1.33 journey is rerun as regression evidence after the redesigned surfaces are deployed.

## State Patterns

| State | Treatment |
|---|---|
| First visit | Welcome explains the product in one sentence and offers “Create your first workflow” as the dominant action |
| Draft | Persistent “Draft” label; explicit **Save draft** action and unsaved/saving/saved/failed/conflict status; warn before leaving with unsaved work and never lose successfully saved work |
| Validation issue | Inline message at the source plus a plain-language checklist summary; never rely on color alone |
| Published | Clear version and publication time; show what will happen next |
| Assigned Task | Available in My Tasks and openable by the assigned Member or eligible Team |
| Team Task available | Member must claim before editing; after claim, other Team Members see claimed state but cannot edit |
| Needs Reassignment | Locked from completion; Owner/Administrator sees reason and can reassign |
| Empty My Tasks | Explain that assigned work will appear here; link to authorized process start only when applicable |
| Permission denied | Do not reveal restricted data; explain the access boundary and route to available work |
| Offline or slow connection | Preserve entered data where safe, show saving state, and provide retry without discarding work |
| Completed Process | Show selected/hired outcome or the Designer-authored completion state and authorized summary |

## Interaction Primitives

- Every primary flow is completable with keyboard, pointer, and touch.
- Use progressive disclosure: basic configuration first, advanced rules and calculations when requested.
- Provide non-drag controls for adding and ordering Workflow elements.
- Use one modal layer at a time; prefer inline panels for guided configuration.
- Preserve draft work across navigation and recoverable connection failures.
- Confirm destructive or irreversible actions; do not confirm routine saves or task completion.
- Announce material state changes to assistive technologies.
- On narrow screens, convert tables to compact cards prioritizing identifier, status, current step, and primary action.

## Accessibility Floor

Core MVP flows require semantic headings and labels, visible focus, keyboard navigation, meaningful alternatives for non-text content, accessible validation feedback, screen-reader announcements for material state changes, readable contrast, and text enlargement to 200% without loss of required operation. Permission, status, and validation must never depend on color alone. Touch targets must remain usable on supported mobile layouts.

Interactive targets should be at least 44 by 44 CSS pixels where practical. Motion is supplementary, never required to understand progress or complete a task; reduced-motion preferences remove non-essential transitions. Error messages identify the field and the corrective action in the user's selected interface language.

## Responsive & Platform

| Surface | Mobile and tablet | Laptop and desktop |
|---|---|---|
| Operational dashboard | Compact cards, one primary action, expandable authorized details | Tables may show representative columns and filters |
| Task Form | Controls stack or reflow full width; task completion remains supported | Twelve-column responsive layout with configured widths |
| Workflow Designer | View and lightweight navigation only; narrow authoring is deferred | Full authoring workspace, canvas/list, properties, validation, and publication |
| Administration | Prioritize search, status, and one action per row | Full tables, filters, and bulk context where authorized |

## Key Flows

### Flow 1 — First workflow: Camila, owner and recruiter at a small company

1. Camila lands on Moviqo and sees a plain explanation: automate everyday processes without building an application.
2. She registers, activates her account, and becomes the Organization Owner.
3. The dashboard welcomes her and offers “Create your first workflow,” with hiring as a clearly labeled example.
4. Workflow creation captures the name and navigates to a dedicated, reload-safe Designer.
5. She adds Start, Task, and End from the palette; each action immediately appears and becomes selected on the React Flow canvas.
6. She selects the Task and opens Design Form, where a dedicated Form workspace provides Short Text and structural layout controls through drag, click/double-click, or keyboard actions.
7. She returns to the Workflow Designer, chooses the responsible person or Team, and reviews starter configuration.
8. A publish checklist identifies missing starters, assignments, routes, or required fields and links directly to the appropriate Workflow or Form module.
9. She publishes the Workflow, opens the separate Start Process catalog, and starts the first Process.
10. **Climax:** Camila sees a clear confirmation that the hiring process is ready, starts the first candidate process, and understands exactly what happens next without needing a developer.

Failure path: a required starter, assignment, route, or field is missing. The publish checklist names the issue in plain language, links to its source, preserves Camila's draft, and lets her return to the same guided step.

### Flow 2 — Assigned work: Luis, Member completing an interview Task

1. Luis signs in and lands on My Tasks, not the full Organization workspace.
2. He sees only interview Tasks assigned directly to him or available through his Team.
3. He opens one Task and sees the authorized candidate information needed for the interview.
4. He completes the Form, receives accessible inline validation, and saves or submits.
5. The next route is determined by the published Workflow; Luis sees only the resulting authorized progress.
6. **Climax:** the Task leaves his attention list with a clear completed state, while the next responsible person receives the next Task.

Failure path: the connection fails during save or completion. The Form retains entered values, announces that saving is incomplete, and offers retry; it never reports completion until the server confirms it.

### Flow 3 — Configurable candidate participation: future extension

1. A Designer chooses whether candidate information is entered by the recruiter or collected through a candidate-facing access path.
2. If candidate access is enabled in a future scope, the Designer configures the invitation, identity, data boundary, and allowed Task Form.
3. The candidate submits only the authorized information for that Task.
4. The recruiter sees the submission as the next authorized process position.
5. **Climax:** the company’s chosen way of working is represented without forcing every hiring process into the same template.

This flow is an extension point, not an MVP commitment: the current PRD supports authenticated Organization Members and excludes public or anonymous initiation.

Failure path: the candidate-facing pattern is not enabled or the candidate cannot be authenticated. The recruiter uses the configured internal data-entry path and the process does not expose an anonymous fallback.
