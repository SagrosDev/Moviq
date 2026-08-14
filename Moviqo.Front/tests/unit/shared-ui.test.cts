import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MoviqoMark, MoviqoWordmark } from "../../src/shared/branding";
import {
  ActionBar,
  Alert,
  AppHeader,
  AppShell,
  Badge,
  Breadcrumbs,
  Button,
  ButtonLink,
  Card,
  CheckboxField,
  ErrorSummary,
  FormGrid,
  FormGridItem,
  FormSection,
  isUnmodifiedPrimaryClick,
  LoadingState,
  PageContainer,
  PageHeader,
  PasswordField,
  SelectField,
  TextInput
} from "../../src/shared/ui";

test("shared UI exports the complete domain-free primitive foundation", () => {
  const primitives = [
    ActionBar,
    Alert,
    AppHeader,
    AppShell,
    Badge,
    Button,
    ButtonLink,
    Card,
    CheckboxField,
    ErrorSummary,
    FormGrid,
    FormGridItem,
    FormSection,
    LoadingState,
    PageContainer,
    PageHeader,
    PasswordField,
    SelectField,
    TextInput
  ];

  for (const primitive of primitives) {
    assert.equal(typeof primitive, "function");
  }
});

test("AppHeader composes an accessible Moviqo brand mark without coupling the generic header to the brand", () => {
  const markup = renderToStaticMarkup(
    createElement(AppHeader, {
      brandHref: "/",
      brandLabel: createElement(MoviqoWordmark),
      brandHomeLabel: "Moviqo home",
      brandMark: createElement(MoviqoMark)
    })
  );

  assert.match(markup, /aria-label="Moviqo home"/);
  assert.match(markup, /data-brand-mark="moviqo"/);
  assert.match(markup, /src="\/moviqo-mark\.svg"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /data-brand-wordmark="moviqo"/);
  assert.match(markup, /font-serif/);
  assert.match(markup, /text-moviqo-primary/);
});

test("canonical Moviqo browser assets preserve the same workflow mark", () => {
  const svg = readFileSync("public/moviqo-mark.svg", "utf8");
  const favicon = readFileSync("public/favicon.ico");
  const index = readFileSync("index.html", "utf8");

  assert.match(svg, /viewBox="0 0 32 32"/);
  assert.match(svg, /#0F766E/i);
  assert.match(svg, /data-brand-asset="moviqo-mark"/);
  assert.match(svg, /M7\.5 16H12M20 16h1\.5l3-6\.5/);
  assert.equal((svg.match(/<circle/g) ?? []).length, 3);
  assert.deepEqual([...favicon.subarray(0, 6)], [0, 0, 1, 0, 1, 0]);
  assert.ok(favicon.length > 100);
  assert.match(index, /rel="icon"[^>]+href="\/favicon\.ico"/);
});

test("AppHeader presents optional product navigation with conventional current-page semantics", () => {
  const markup = renderToStaticMarkup(
    createElement(AppHeader, {
      brandHref: "/",
      brandLabel: "Moviqo",
      brandHomeLabel: "Moviqo home",
      navigationLabel: "Primary navigation",
      navigation: [
        { href: "/work", label: "My work", current: true },
        { href: "/processes", label: "Processes" }
      ]
    })
  );

  assert.match(markup, /aria-label="Primary navigation"/);
  assert.match(markup, /href="\/work" aria-current="page"/);
  assert.match(markup, />My work<\/a>/);
  assert.match(markup, />Processes<\/a>/);
  assert.match(markup, /font-semibold/);
  assert.doesNotMatch(markup, />01<\/span>/);
  assert.doesNotMatch(markup, />Sections<\/p>/);
});

test("AppHeader shares the wide PageContainer alignment contract", () => {
  const markup = renderToStaticMarkup(
    createElement(AppHeader, {
      brandHref: "/",
      brandLabel: "Moviqo",
      brandHomeLabel: "Moviqo home",
      size: "wide"
    })
  );

  assert.match(markup, /max-w-screen-desktop/);
});

test("PageContainer offers an unconstrained authenticated workspace without changing wide pages", () => {
  const workspaceMarkup = renderToStaticMarkup(
    createElement(PageContainer, { size: "workspace", children: "Workspace" })
  );

  assert.match(workspaceMarkup, /max-w-none/);
  assert.match(workspaceMarkup, /px-moviqo-gutter-mobile/);
});

test("PageHeader composes an optional breadcrumb, title, and action in semantic responsive order", () => {
  const currentWorkflow = "ApprovalWorkflowNameWithoutAnyBreakOpportunity";
  const markup = renderToStaticMarkup(
    createElement(PageHeader, {
      breadcrumb: createElement(Breadcrumbs, {
        items: [
          { href: "/workflows", label: "Workflows" },
          { current: true, label: currentWorkflow }
        ],
        label: "Breadcrumb"
      }),
      title: "Design your workflow",
      actions: createElement(Button, {
        variant: "secondary",
        children: "Back to workflows"
      })
    })
  );

  assert.match(markup, /data-page-header-layout="three-region"/);
  assert.match(markup, /desktop:grid-cols-\[auto_minmax\(0,1fr\)_auto\]/);
  assert.match(markup, /data-page-header-region="breadcrumb"/);
  assert.match(markup, /data-page-header-region="title"/);
  assert.match(markup, /data-page-header-region="actions"/);
  assert.match(markup, /text-moviqo-heading/);
  assert.match(markup, /<nav[^>]+aria-label="Breadcrumb"/);
  assert.match(markup, /href="\/workflows"/);
  assert.match(markup, /min-h-11[^"\n]*wrap-anywhere/);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /wrap-anywhere/);
  assert.ok(markup.indexOf("Workflows") < markup.indexOf(currentWorkflow));
  assert.ok(markup.indexOf(currentWorkflow) < markup.indexOf("Design your workflow"));
  assert.ok(markup.indexOf("Design your workflow") < markup.indexOf("Back to workflows"));
  assert.equal((markup.match(/<h1/g) ?? []).length, 1);

  const defaultMarkup = renderToStaticMarkup(
    createElement(PageHeader, {
      title: "Catalog",
      actions: createElement(Button, { children: "Create" })
    })
  );
  assert.doesNotMatch(defaultMarkup, /data-page-header-layout/);
  assert.match(defaultMarkup, /flex flex-wrap items-start justify-between/);
});

test("Form Grid spans stack narrowly and use complete static responsive classes", () => {
  const markup = renderToStaticMarkup(
    createElement(
      FormGrid,
      null,
      createElement(FormGridItem, { span: "half", children: "Half" }),
      createElement(FormGridItem, { span: "third", children: "Third" })
    )
  );

  assert.match(markup, /grid-cols-1/);
  assert.match(markup, /tablet:grid-cols-12/);
  assert.match(markup, /data-layout-span="half"/);
  assert.match(markup, /tablet:col-span-6/);
  assert.match(markup, /data-layout-span="third"/);
  assert.match(markup, /desktop:col-span-4/);
});

test("field primitives associate labels, help, and inline errors", () => {
  const markup = renderToStaticMarkup(
    createElement(TextInput, {
      id: "organization-name",
      label: "Organization name",
      helpText: "Use the name your team recognizes.",
      errorMessage: "Enter an organization name."
    })
  );

  assert.match(markup, /for="organization-name"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /aria-describedby="organization-name-help organization-name-error"/);
  assert.match(markup, /id="organization-name-error"/);
});

test("field primitives offer an opt-in strong label hierarchy", () => {
  const markup = renderToStaticMarkup(
    createElement(TextInput, {
      id: "workflow-property-name",
      label: "Task name",
      labelEmphasis: "strong",
      value: "Review",
      readOnly: true
    })
  );

  assert.match(markup, /text-moviqo-body font-bold/);
});

test("field primitives preserve caller descriptions, required labels, and refs", () => {
  const selectRef = createRef<HTMLSelectElement>();
  const checkboxRef = createRef<HTMLInputElement>();
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(TextInput, {
        id: "owner-name",
        label: "Owner name",
        helpText: "Use the responsible person's name.",
        "aria-describedby": "external-owner-guidance",
        required: true
      }),
      createElement(SelectField, {
        id: "language",
        label: "Language",
        options: [{ value: "es", label: "Spanish" }],
        ref: selectRef
      }),
      createElement(CheckboxField, {
        id: "terms",
        label: "Accept terms",
        ref: checkboxRef,
        required: true
      }),
      createElement(PasswordField, {
        id: "password",
        label: "Password",
        helperText: "Use a strong password.",
        revealLabel: "Show password",
        hideLabel: "Hide password",
        isRevealed: false,
        onRevealToggle: () => undefined,
        required: true
      })
    )
  );

  assert.match(markup, /aria-describedby="external-owner-guidance owner-name-help"/);
  assert.equal((markup.match(/aria-hidden="true"> \*<\/span>/g) ?? []).length, 3);
});

test("Button defaults to a non-submitting type", () => {
  const markup = renderToStaticMarkup(createElement(Button, null, "Continue"));
  assert.match(markup, /type="button"/);
});

test("ButtonLink provides shared CTA styling without replacing link semantics", () => {
  const markup = renderToStaticMarkup(
    createElement(ButtonLink, { href: "/register", children: "Register" })
  );

  assert.match(markup, /^<a /);
  assert.match(markup, /href="\/register"/);
  assert.match(markup, /data-variant="primary"/);
});

test("application link interception preserves modified and non-primary clicks", () => {
  const click = (overrides: Record<string, boolean | number> = {}) => ({
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides
  });

  assert.equal(isUnmodifiedPrimaryClick(click() as never), true);
  assert.equal(isUnmodifiedPrimaryClick(click({ ctrlKey: true }) as never), false);
  assert.equal(isUnmodifiedPrimaryClick(click({ metaKey: true }) as never), false);
  assert.equal(isUnmodifiedPrimaryClick(click({ button: 1 }) as never), false);
});

test("static alerts are not live regions and info badges use an informational mark", () => {
  const staticAlert = renderToStaticMarkup(
    createElement(Alert, { tone: "warning", children: "Review this" })
  );
  const liveAlert = renderToStaticMarkup(
    createElement(Alert, { tone: "info", announcement: "polite", children: "Saved" })
  );
  const infoBadge = renderToStaticMarkup(
    createElement(Badge, { tone: "info", children: "In progress" })
  );

  assert.doesNotMatch(staticAlert, /role=/);
  assert.match(liveAlert, /role="status"/);
  assert.match(infoBadge, /aria-hidden="true">i<\/span>/);
});

test("LoadingState exposes one polite named status and a decorative visual spinner", () => {
  const markup = renderToStaticMarkup(
    createElement(LoadingState, { children: "Loading assigned tasks." })
  );

  assert.match(markup, /role="status"/);
  assert.match(markup, /aria-live="polite"/);
  assert.match(markup, /aria-atomic="true"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /animate-spin/);
  assert.match(markup, /size-8/);
  assert.match(markup, /border-4/);
  assert.match(markup, /moviqo-loading-indicator/);
  assert.doesNotMatch(markup, /motion-reduce:animate-none/);
  assert.equal((markup.match(/Loading assigned tasks\./g) ?? []).length, 1);
});

test("asynchronous application branches consistently compose LoadingState", () => {
  const loadingSurfaces = [
    "src/app/router/RoutePages.tsx",
    "src/features/form-design/ui/FormDesignerWorkspace.tsx",
    "src/features/my-work/ui/MyWorkShell.tsx",
    "src/features/verification/ui/VerificationStatusPanel.tsx",
    "src/pages/forms/ui/FormPages.tsx",
    "src/pages/my-work/ui/MyWorkPage.tsx",
    "src/pages/process-detail/ui/ProcessDetailPage.tsx",
    "src/pages/task-form/ui/TaskFormPage.tsx",
    "src/pages/workflow-catalog/ui/WorkflowCatalogPage.tsx",
    "src/pages/workflow-create/ui/WorkflowCreatePage.tsx",
    "src/pages/workflow-design/ui/WorkflowDesignPage.tsx"
  ];

  for (const path of loadingSurfaces) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /LoadingState/, `${path} should use the shared spinner status`);
  }

  const formDesigner = readFileSync(
    "src/features/form-design/ui/FormDesignerWorkspace.tsx",
    "utf8"
  );
  assert.match(
    formDesigner,
    /leaseState\.status === "acquiring"[\s\S]*?<LoadingState>/
  );
  assert.match(
    formDesigner,
    /leaseState\.status !== "editable"/
  );
  assert.match(
    formDesigner,
    /leaseState\.status === "acquiring" \? null : <FormDesignerSaveStatus/
  );

  const formLauncher = readFileSync("src/pages/forms/ui/FormPages.tsx", "utf8");
  assert.match(
    formLauncher,
    /catalogQuery\.isError \? \([\s\S]*?catalogQuery\.refetch/
  );
  assert.match(
    formLauncher,
    /workflowId && draftQuery\.isPending \? \([\s\S]*?<LoadingState>/
  );
  assert.match(formLauncher, /disabled=\{!canSave\}/);
});

test("ErrorSummary is focusable and links actionable errors to their controls", () => {
  const markup = renderToStaticMarkup(
    createElement(ErrorSummary, {
      title: "Correct the following fields",
      errors: [
        {
          id: "email-error",
          fieldId: "email",
          fieldLabel: "Email",
          message: "Enter a valid email address."
        }
      ]
    })
  );

  assert.match(markup, /role="alert"/);
  assert.match(markup, /tabindex="-1"/);
  assert.match(markup, /href="#email"/);
  assert.match(markup, /Email: Enter a valid email address\./);
});

test("ErrorSummary renders non-actionable form errors as text", () => {
  const markup = renderToStaticMarkup(
    createElement(ErrorSummary, {
      title: "Registration failed",
      errors: [{ id: "form-error", message: "Review the form and try again." }]
    })
  );

  assert.match(markup, /<span>Review the form and try again\.<\/span>/);
  assert.doesNotMatch(markup, /href="#"/);
});
