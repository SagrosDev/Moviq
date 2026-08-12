import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";

type ActionBarProps = {
  children: ReactNode;
  align?: "start" | "between" | "end";
};

export type FeedbackTone = "info" | "success" | "warning" | "error";

type AlertProps = {
  children: ReactNode;
  title?: string;
  tone?: FeedbackTone;
  announcement?: "polite" | "assertive";
};

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | FeedbackTone;
};

type LoadingStateProps = {
  children: ReactNode;
};

export type ErrorSummaryItem = {
  id: string;
  fieldId?: string;
  fieldLabel?: string;
  message: string;
};

type ErrorSummaryProps = {
  title: string;
  errors: readonly ErrorSummaryItem[];
  formMessage?: string;
  supportDetail?: string;
  ref?: ComponentPropsWithRef<"div">["ref"];
  onErrorActivate?: (error: ErrorSummaryItem) => void;
};

const actionBarClasses: Record<NonNullable<ActionBarProps["align"]>, string> = {
  start: "justify-start",
  between: "justify-between",
  end: "justify-end"
};

const alertClasses: Record<FeedbackTone, string> = {
  info: "border-moviqo-accent bg-moviqo-surface-raised text-moviqo-ink-primary",
  success: "border-moviqo-success bg-moviqo-surface-raised text-moviqo-success",
  warning: "border-moviqo-warning bg-moviqo-surface-raised text-moviqo-warning",
  error: "border-moviqo-error bg-moviqo-surface-raised text-moviqo-error"
};

const badgeClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-moviqo-border bg-moviqo-surface-soft text-moviqo-ink-secondary",
  info: "border-moviqo-accent bg-moviqo-surface-raised text-moviqo-accent",
  success: "border-moviqo-success bg-moviqo-surface-raised text-moviqo-success",
  warning: "border-moviqo-warning bg-moviqo-surface-raised text-moviqo-warning",
  error: "border-moviqo-error bg-moviqo-surface-raised text-moviqo-error"
};

const toneMarks: Record<FeedbackTone, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  error: "!"
};

const badgeMarks: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "•",
  info: "i",
  success: "✓",
  warning: "!",
  error: "!"
};

const errorActionClasses =
  "text-left text-moviqo-primary underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus";

export const ActionBar = ({ children, align = "end" }: ActionBarProps) => {
  return (
    <div className={`flex flex-wrap items-center gap-moviqo-2 ${actionBarClasses[align]}`}>
      {children}
    </div>
  );
};

export const Alert = ({ children, title, tone = "info", announcement }: AlertProps) => {
  return (
    <div
      className={`grid grid-cols-[auto_minmax(0,1fr)] gap-moviqo-3 rounded-moviqo-control border p-moviqo-4 ${alertClasses[tone]}`}
      role={announcement === "assertive" ? "alert" : announcement === "polite" ? "status" : undefined}
    >
      <span aria-hidden="true" className="font-bold">{toneMarks[tone]}</span>
      <div className="grid gap-moviqo-1">
        {title ? <strong>{title}</strong> : null}
        {children}
      </div>
    </div>
  );
};

export const Badge = ({ children, tone = "neutral" }: BadgeProps) => {
  return (
    <span className={`inline-flex min-h-7 items-center gap-moviqo-1 rounded-moviqo-pill border px-moviqo-2 text-sm font-semibold ${badgeClasses[tone]}`}>
      <span aria-hidden="true">{badgeMarks[tone]}</span>
      {children}
    </span>
  );
};

export const LoadingState = ({ children }: LoadingStateProps) => {
  return (
    <div
      className="flex min-h-20 items-center gap-moviqo-3 rounded-moviqo-guidance border border-moviqo-border bg-moviqo-surface-raised p-moviqo-4 text-moviqo-ink-primary"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        aria-hidden="true"
        className="size-6 shrink-0 animate-spin rounded-moviqo-pill border-2 border-moviqo-border border-t-moviqo-primary motion-reduce:animate-none"
      />
      <span>{children}</span>
    </div>
  );
};

export const ErrorSummary = ({
  title,
  errors,
  formMessage,
  supportDetail,
  ref,
  onErrorActivate
}: ErrorSummaryProps) => {
  const activateError = (error: ErrorSummaryItem) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const summary = event.currentTarget.closest('[role="alert"]');
    onErrorActivate?.(error);

    const focusTarget = () => {
      const target = error.fieldId ? document.getElementById(error.fieldId) : null;
      if (target instanceof HTMLElement) {
        target.focus();
      } else if (summary instanceof HTMLElement) {
        summary.focus();
      }
    };

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(focusTarget);
    } else {
      focusTarget();
    }
  };

  const errorLabel = (error: ErrorSummaryItem) => (
    <>
      {error.fieldLabel ? `${error.fieldLabel}: ` : null}
      {error.message}
    </>
  );

  return (
    <div
      className="grid gap-moviqo-3 rounded-moviqo-control border border-moviqo-error bg-moviqo-surface-raised p-moviqo-4 text-moviqo-ink-primary focus:outline-3 focus:outline-offset-3 focus:outline-moviqo-focus"
      ref={ref}
      role="alert"
      tabIndex={-1}
    >
      <strong className="text-moviqo-error">{title}</strong>
      {formMessage ? <p className="m-0">{formMessage}</p> : null}
      {errors.length > 0 ? (
        <ul className="m-0 grid gap-moviqo-2 pl-moviqo-5">
          {errors.map((error) => (
            <li key={error.id}>
              {error.fieldId ? (
                <a
                  className={errorActionClasses}
                  href={`#${error.fieldId}`}
                  onClick={activateError(error)}
                >
                  {errorLabel(error)}
                </a>
              ) : onErrorActivate ? (
                <button
                  className={`${errorActionClasses} border-0 bg-transparent p-0`}
                  type="button"
                  onClick={() => onErrorActivate(error)}
                >
                  {errorLabel(error)}
                </button>
              ) : (
                <span>{errorLabel(error)}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {supportDetail ? <small className="text-moviqo-ink-secondary">{supportDetail}</small> : null}
    </div>
  );
};
