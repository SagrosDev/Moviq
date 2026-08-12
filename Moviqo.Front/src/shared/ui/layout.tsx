import type { MouseEvent, ReactNode } from "react";

export type HeaderNavigationItem = {
  href: string;
  label: string;
  current?: boolean;
};

export type BreadcrumbItem = {
  href?: string;
  label: string;
  current?: boolean;
};

type AppShellProps = {
  children: ReactNode;
};

type AppHeaderBaseProps = {
  brandHref: string;
  brandLabel: ReactNode;
  brandHomeLabel: string;
  brandMark?: ReactNode;
  actions?: ReactNode;
  size?: PageContainerProps["size"];
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
};

type AppHeaderNavigationProps =
  | {
      navigation?: undefined;
      navigationLabel?: undefined;
    }
  | {
      navigation: readonly HeaderNavigationItem[];
      navigationLabel: string;
    };

type AppHeaderProps = AppHeaderBaseProps & AppHeaderNavigationProps;

type PageContainerProps = {
  children: ReactNode;
  size?: "compact" | "default" | "wide" | "workspace";
};

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  titleId?: string;
};

type CardProps = {
  children: ReactNode;
  tone?: "default" | "soft" | "accent";
  labelledBy?: string;
};

type BreadcrumbsProps = {
  items: readonly BreadcrumbItem[];
  label: string;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
};

const containerClasses: Record<NonNullable<PageContainerProps["size"]>, string> = {
  compact: "max-w-2xl",
  default: "max-w-6xl",
  wide: "max-w-screen-desktop",
  workspace: "max-w-none"
};

const cardClasses: Record<NonNullable<CardProps["tone"]>, string> = {
  default: "border-moviqo-border bg-moviqo-surface-raised",
  soft: "border-moviqo-border bg-moviqo-surface-soft",
  accent: "border-moviqo-accent bg-moviqo-surface-raised"
};

const headerNavigationLinkClasses: Record<"current" | "default", string> = {
  current: "bg-moviqo-surface-soft text-moviqo-primary",
  default:
    "text-moviqo-ink-secondary hover:bg-moviqo-surface-soft hover:text-moviqo-primary"
};

export const isUnmodifiedPrimaryClick = (event: MouseEvent<HTMLAnchorElement>) => (
  event.button === 0
  && !event.metaKey
  && !event.ctrlKey
  && !event.shiftKey
  && !event.altKey
);

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-moviqo-surface-base font-moviqo-sans text-moviqo-ink-primary">
      {children}
    </div>
  );
};

export const AppHeader = ({
  brandHref,
  brandLabel,
  brandHomeLabel,
  brandMark,
  navigationLabel,
  navigation,
  actions,
  onNavigate,
  size = "default"
}: AppHeaderProps) => {
  return (
    <header className="border-b border-moviqo-border bg-moviqo-surface-raised">
      <div className={`mx-auto flex min-h-16 w-full flex-wrap items-center justify-between gap-moviqo-3 px-moviqo-gutter-mobile py-moviqo-2 tablet:px-moviqo-gutter-desktop ${containerClasses[size]}`}>
        <a
          className="inline-flex min-h-11 items-center gap-moviqo-2 rounded-moviqo-control text-lg font-bold text-moviqo-ink-primary no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus"
          href={brandHref}
          aria-label={brandHomeLabel}
          onClick={(event) => onNavigate?.(brandHref, event)}
        >
          {brandMark}
          {brandLabel}
        </a>
        {navigation && navigation.length > 0 ? (
          <nav
            className="order-3 w-full max-w-full tablet:order-none tablet:w-auto"
            aria-label={navigationLabel}
          >
            <ul className="m-0 flex list-none flex-wrap items-center gap-moviqo-1 p-0">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    className={`inline-flex min-h-11 items-center rounded-moviqo-control px-moviqo-3 text-sm font-semibold no-underline transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus ${headerNavigationLinkClasses[item.current ? "current" : "default"]}`}
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    onClick={(event) => onNavigate?.(item.href, event)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {actions ? <div className="flex flex-wrap items-center gap-moviqo-2">{actions}</div> : null}
      </div>
    </header>
  );
};

export const PageContainer = ({ children, size = "default" }: PageContainerProps) => {
  return (
    <div
      className={`mx-auto w-full px-moviqo-gutter-mobile py-moviqo-6 tablet:px-moviqo-gutter-desktop ${containerClasses[size]}`}
    >
      {children}
    </div>
  );
};

export const PageHeader = ({
  title,
  eyebrow,
  description,
  actions,
  titleId
}: PageHeaderProps) => {
  return (
    <header className="grid gap-moviqo-3">
      {eyebrow ? (
        <p
          className="m-0 text-moviqo-body font-semibold text-moviqo-primary"
          data-page-context="true"
        >
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-moviqo-4">
        <div className="grid max-w-3xl gap-moviqo-2">
          <h1 className="m-0 text-moviqo-display font-semibold text-moviqo-ink-primary" id={titleId}>
            {title}
          </h1>
          {description ? <p className="m-0 text-lg leading-relaxed text-moviqo-ink-secondary">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-moviqo-2">{actions}</div> : null}
      </div>
    </header>
  );
};

export const Card = ({ children, tone = "default", labelledBy }: CardProps) => {
  return (
    <section
      className={`grid min-w-0 gap-moviqo-4 rounded-moviqo-guidance border p-moviqo-5 ${cardClasses[tone]}`}
      aria-labelledby={labelledBy}
    >
      {children}
    </section>
  );
};

export const Breadcrumbs = ({ items, label, onNavigate }: BreadcrumbsProps) => (
  <nav aria-label={label}>
    <ol className="m-0 flex list-none flex-wrap items-center gap-moviqo-2 p-0 text-sm">
      {items.map((item, index) => (
        <li className="flex items-center gap-moviqo-2" key={`${item.label}-${index}`}>
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.href && !item.current ? (
            <a
              className="min-h-11 content-center rounded-moviqo-control text-moviqo-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus"
              href={item.href}
              onClick={(event) => onNavigate?.(item.href ?? "", event)}
            >
              {item.label}
            </a>
          ) : (
            <span aria-current={item.current ? "page" : undefined}>{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
