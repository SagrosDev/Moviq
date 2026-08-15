import assert from "node:assert/strict";
import { test } from "node:test";
import { matchRoutes } from "react-router";

import {
  appRoutes,
  authenticatedNavigationForRole,
  authenticatedPageTitleKey
} from "../../src/app/router";
import {
  isProtectedPath,
  protectedEntryPath,
  resolveProtectedReturnDestination,
  resolveProtectedRedirectPath
} from "../../src/features/authentication";

const leafRouteId = (pathname: string) =>
  matchRoutes(appRoutes, pathname)?.at(-1)?.route.id ?? null;

test("canonical public and authenticated deep links match dedicated route modules", () => {
  const expectedRoutes = new Map([
    ["/", "home"],
    ["/es", "home-es"],
    ["/en", "home-en"],
    ["/register", "register"],
    ["/verify-email", "verify-email"],
    ["/sign-in", "sign-in"],
    ["/password-recovery", "password-recovery"],
    ["/password-reset", "password-reset"],
    ["/design-system", "design-system"],
    ["/my-work", "my-work"],
    ["/my-work/tasks", "tasks"],
    ["/my-work/tasks/task-1", "task-form"],
    ["/my-work/processes", "processes"],
    ["/my-work/processes/process-1", "process-detail"],
    ["/processes/start", "start-process"],
    ["/workflows", "workflow-catalog"],
    ["/workflows/new", "workflow-create"],
    ["/workflows/workflow-1/design", "workflow-design"],
    ["/forms", "form-launcher"],
    ["/workflows/workflow-1/tasks/task-1/form", "form-design"]
  ]);

  for (const [pathname, routeId] of expectedRoutes) {
    assert.equal(leafRouteId(pathname), routeId, pathname);
  }
});

test("protected redirects cover every authenticated module without hiding public routes", () => {
  for (const pathname of [
    "/my-work",
    "/my-work/tasks/task-1",
    "/processes/start",
    "/workflows",
    "/workflows/workflow-1/design",
    "/forms"
  ]) {
    assert.equal(isProtectedPath(pathname), true, pathname);
    assert.equal(resolveProtectedRedirectPath(pathname), "/sign-in", pathname);
  }

  assert.equal(isProtectedPath("/sign-in"), false);
});

test("protected return destinations preserve safe deep-link state and reject unsafe values", () => {
  assert.equal(
    resolveProtectedReturnDestination({
      from: "/workflows/workflow-1/design?tab=tasks#task-1"
    }),
    "/workflows/workflow-1/design?tab=tasks#task-1"
  );
  assert.equal(resolveProtectedReturnDestination({ from: "https://evil.test/forms" }), protectedEntryPath);
  assert.equal(resolveProtectedReturnDestination({ from: "//evil.test/forms" }), protectedEntryPath);
  assert.equal(resolveProtectedReturnDestination({ from: "/sign-in" }), protectedEntryPath);
});

test("unknown URLs resolve inside the matching public or authenticated shell", () => {
  assert.equal(leafRouteId("/missing-public-page"), "public-not-found");
  assert.equal(leafRouteId("/my-work/missing-task-module"), "my-work-not-found");
  assert.equal(leafRouteId("/workflows/missing-authoring-module"), "workflows-not-found");
});

test("authoring navigation is role-aware and exposes current location", () => {
  const ownerItems = authenticatedNavigationForRole("owner", "/workflows/workflow-1/design");
  const memberItems = authenticatedNavigationForRole("member", "/my-work/tasks");

  assert.deepEqual(ownerItems.map((item) => item.id), [
    "dashboard",
    "start-process",
    "workflows",
    "forms"
  ]);
  assert.equal(ownerItems.find((item) => item.id === "workflows")?.current, true);
  assert.deepEqual(memberItems.map((item) => item.id), [
    "dashboard",
    "start-process"
  ]);
  assert.equal(memberItems.find((item) => item.id === "dashboard")?.current, true);
  assert.equal(authenticatedPageTitleKey("/my-work/tasks"), "app.nav.dashboard");
  assert.equal(authenticatedPageTitleKey("/my-work/processes"), "app.nav.dashboard");

  const formItems = authenticatedNavigationForRole(
    "designer",
    "/workflows/workflow-1/tasks/task-1/form"
  );
  assert.equal(formItems.find((item) => item.id === "forms")?.current, true);
  assert.equal(formItems.find((item) => item.id === "workflows")?.current, false);
  assert.equal(
    authenticatedPageTitleKey("/workflows/workflow-1/tasks/task-1/form"),
    "app.nav.forms"
  );

  const trailingSlashItems = authenticatedNavigationForRole(
    "designer",
    "/workflows/workflow-1/tasks/task-1/form/"
  );
  assert.equal(trailingSlashItems.find((item) => item.id === "forms")?.current, true);
  assert.equal(trailingSlashItems.find((item) => item.id === "workflows")?.current, false);
  assert.equal(
    authenticatedPageTitleKey("/workflows/workflow-1/tasks/task-1/form/"),
    "app.nav.forms"
  );
});
