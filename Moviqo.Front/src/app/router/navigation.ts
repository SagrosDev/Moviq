import type { MessageKey } from "../../shared/localization";

export type AuthenticatedNavigationItem = {
  id: "dashboard" | "tasks" | "processes" | "start-process" | "workflows" | "forms";
  href: string;
  labelKey: MessageKey;
  current: boolean;
};

const authoringRoles = new Set(["owner", "administrator", "designer"]);

const normalizePathname = (pathname: string) => pathname.length > 1
  ? pathname.replace(/\/+$/, "")
  : pathname;

const routeIsCurrent = (href: string, pathname: string) => {
  const normalizedPathname = normalizePathname(pathname);
  const isFormDesignPath = /\/workflows\/[^/]+\/tasks\/[^/]+\/form$/.test(normalizedPathname);
  if (href === "/my-work") {
    return normalizedPathname === href;
  }
  if (href === "/workflows") {
    return !isFormDesignPath && (
      normalizedPathname === href
      || normalizedPathname.startsWith("/workflows/")
    );
  }
  if (href === "/forms") return normalizedPathname === href || isFormDesignPath;
  return normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);
};

export const authenticatedNavigationForRole = (
  role: string,
  pathname: string
): AuthenticatedNavigationItem[] => {
  const baseItems: Omit<AuthenticatedNavigationItem, "current">[] = [
    { id: "dashboard", href: "/my-work", labelKey: "app.nav.dashboard" },
    { id: "tasks", href: "/my-work/tasks", labelKey: "app.nav.tasks" },
    { id: "processes", href: "/my-work/processes", labelKey: "app.nav.processes" },
    { id: "start-process", href: "/processes/start", labelKey: "app.nav.startProcess" }
  ];
  const authoringItems: Omit<AuthenticatedNavigationItem, "current">[] = [
    { id: "workflows", href: "/workflows", labelKey: "app.nav.workflows" },
    { id: "forms", href: "/forms", labelKey: "app.nav.forms" }
  ];

  return [
    ...baseItems,
    ...(authoringRoles.has(role) ? authoringItems : [])
  ].map((item) => ({
    ...item,
    current: routeIsCurrent(item.href, pathname)
  }));
};

export const authenticatedPageTitleKey = (pathname: string): MessageKey => {
  const normalizedPathname = normalizePathname(pathname);
  if (normalizedPathname === "/my-work") return "app.nav.dashboard";
  if (normalizedPathname === "/processes/start") return "app.nav.startProcess";
  if (normalizedPathname.startsWith("/my-work/tasks")) return "app.nav.tasks";
  if (normalizedPathname.startsWith("/my-work/processes")) return "app.nav.processes";
  if (
    normalizedPathname === "/forms"
    || /\/tasks\/[^/]+\/form$/.test(normalizedPathname)
  ) return "app.nav.forms";
  if (normalizedPathname.startsWith("/workflows")) return "app.nav.workflows";
  return "app.nav.work";
};
