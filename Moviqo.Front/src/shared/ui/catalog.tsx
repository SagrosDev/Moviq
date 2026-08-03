import type { ReactNode } from "react";
import type { MoviqoTranslator } from "../localization";
import { Button } from "./Button";

type StatusTone = "ready" | "blocked" | "attention";

export const StatusBadge = ({ children, tone }: { children: ReactNode; tone: StatusTone }) => {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span aria-hidden="true" className="status-badge__mark">
        {tone === "ready" ? "OK" : "!"}
      </span>
      {children}
    </span>
  );
};

export const GuidanceCard = ({ t }: { t: MoviqoTranslator }) => {
  return (
    <section className="catalog-card guidance-card" aria-labelledby="guidance-title">
      <h2 id="guidance-title">{t("catalog.guidance.title")}</h2>
      <p>{t("catalog.guidance.body")}</p>
      <Button type="button">{t("catalog.guidance.action")}</Button>
    </section>
  );
};

export const FormFieldDemo = ({ t }: { t: MoviqoTranslator }) => {
  return (
    <section className="catalog-card" aria-labelledby="field-title">
      <h2 id="field-title">{t("catalog.field.title")}</h2>
      <label className="form-field">
        <span>{t("catalog.field.label")}</span>
        <small>{t("help.requiredField")}</small>
        <input
          aria-describedby="field-help field-error"
          aria-invalid="true"
          placeholder={t("catalog.field.placeholder")}
        />
        <span id="field-help" className="sr-only">
          {t("help.requiredField")}
        </span>
        <span id="field-error" className="validation-message" role="status">
          <span aria-hidden="true">!</span> {t("validation.required")}
        </span>
      </label>
    </section>
  );
};

export const GuidedStep = ({ t }: { t: MoviqoTranslator }) => {
  return (
    <section className="catalog-card" aria-labelledby="step-title">
      <h2 id="step-title">{t("catalog.step.title")}</h2>
      <p>{t("catalog.step.body")}</p>
      <div className="button-row">
        <Button type="button" data-variant="secondary">
          {t("catalog.step.back")}
        </Button>
        <Button type="button">{t("catalog.step.continue")}</Button>
      </div>
    </section>
  );
};

export const WorkflowElement = ({ t }: { t: MoviqoTranslator }) => {
  return (
    <section className="catalog-card workflow-element" aria-labelledby="workflow-title">
      <h2 id="workflow-title">{t("catalog.workflow.title")}</h2>
      <div className="workflow-node" role="group" aria-label={t("catalog.workflow.name")}>
        <strong>{t("catalog.workflow.name")}</strong>
        <p>{t("catalog.workflow.body")}</p>
        <StatusBadge tone="ready">{t("status.ready")}</StatusBadge>
      </div>
    </section>
  );
};

export const TaskCard = ({ t }: { t: MoviqoTranslator }) => {
  return (
    <section className="catalog-card task-card" aria-labelledby="task-card-title">
      <h2 id="task-card-title">{t("catalog.task.title")}</h2>
      <article aria-labelledby="task-name">
        <h3 id="task-name">{t("catalog.task.name")}</h3>
        <p>{t("catalog.task.workflow")}</p>
        <p>{t("catalog.task.assignee")}</p>
        <StatusBadge tone="attention">{t("status.needsAttention")}</StatusBadge>
        <Button type="button">{t("catalog.task.action")}</Button>
      </article>
    </section>
  );
};

export const AssignmentControl = ({ t }: { t: MoviqoTranslator }) => {
  return (
    <section className="catalog-card assignment-control" aria-labelledby="assignment-title">
      <h2 id="assignment-title">{t("catalog.assignment.title")}</h2>
      <div role="group" aria-label={t("catalog.assignment.title")}>
        <p>
          <strong>{t("catalog.assignment.recipient")}</strong>
        </p>
        <p>{t("catalog.assignment.available")}</p>
        <StatusBadge tone="ready">{t("catalog.assignment.status")}</StatusBadge>
        <Button type="button" data-variant="secondary">
          {t("catalog.assignment.action")}
        </Button>
      </div>
    </section>
  );
};

export const PublishChecklist = ({ t }: { t: MoviqoTranslator }) => {
  return (
    <section className="catalog-card publish-checklist" aria-labelledby="publish-title">
      <h2 id="publish-title">{t("catalog.publish.title")}</h2>
      <ul>
        <li>
          <StatusBadge tone="blocked">{t("status.blocked")}</StatusBadge>
          <span>{t("catalog.publish.issue")}</span>
          <Button type="button" data-variant="secondary">
            {t("catalog.publish.target")}
          </Button>
        </li>
      </ul>
    </section>
  );
};

export const TimelineDemo = ({ t }: { t: MoviqoTranslator }) => {
  return (
    <section className="catalog-card timeline" aria-labelledby="timeline-title">
      <h2 id="timeline-title">{t("catalog.timeline.title")}</h2>
      <ol>
        <li>
          <time dateTime="2026-08-03T09:00:00-05:00">09:00</time>
          <span>{t("catalog.timeline.event")}</span>
          <span>{t("catalog.timeline.position")}</span>
        </li>
      </ol>
    </section>
  );
};
