import type { MessageKey } from "../localization";

export const catalogPreviewCompositions = [
  "landing-navigation",
  "authentication-form",
  "registration-form",
  "buttons",
  "cards",
  "alerts",
  "badges",
  "timeline-row",
  "uat-indicator"
] as const;

export const catalogPreviewStates = [
  "normal",
  "hover",
  "focus",
  "disabled",
  "success",
  "warning",
  "error"
] as const;

export type CatalogComponentKind =
  | "primary-button"
  | "guidance-card"
  | "form-field"
  | "guided-step"
  | "workflow-element"
  | "task-card"
  | "assignment-control"
  | "publish-checklist"
  | "timeline";

export type CatalogComponentDefinition = {
  kind: CatalogComponentKind;
  titleKey: MessageKey;
  responsiveBehaviorKey: MessageKey;
  permittedContentKey: MessageKey;
};

export const catalogComponents: readonly CatalogComponentDefinition[] = [
  {
    kind: "primary-button",
    titleKey: "catalog.button.title",
    responsiveBehaviorKey: "catalog.button.responsive",
    permittedContentKey: "catalog.button.permitted"
  },
  {
    kind: "guidance-card",
    titleKey: "catalog.guidance.title",
    responsiveBehaviorKey: "catalog.guidance.responsive",
    permittedContentKey: "catalog.guidance.permitted"
  },
  {
    kind: "form-field",
    titleKey: "catalog.field.title",
    responsiveBehaviorKey: "catalog.field.responsive",
    permittedContentKey: "catalog.field.permitted"
  },
  {
    kind: "guided-step",
    titleKey: "catalog.step.title",
    responsiveBehaviorKey: "catalog.step.responsive",
    permittedContentKey: "catalog.step.permitted"
  },
  {
    kind: "workflow-element",
    titleKey: "catalog.workflow.title",
    responsiveBehaviorKey: "catalog.workflow.responsive",
    permittedContentKey: "catalog.workflow.permitted"
  },
  {
    kind: "task-card",
    titleKey: "catalog.task.title",
    responsiveBehaviorKey: "catalog.task.responsive",
    permittedContentKey: "catalog.task.permitted"
  },
  {
    kind: "assignment-control",
    titleKey: "catalog.assignment.title",
    responsiveBehaviorKey: "catalog.assignment.responsive",
    permittedContentKey: "catalog.assignment.permitted"
  },
  {
    kind: "publish-checklist",
    titleKey: "catalog.publish.title",
    responsiveBehaviorKey: "catalog.publish.responsive",
    permittedContentKey: "catalog.publish.permitted"
  },
  {
    kind: "timeline",
    titleKey: "catalog.timeline.title",
    responsiveBehaviorKey: "catalog.timeline.responsive",
    permittedContentKey: "catalog.timeline.permitted"
  }
];
