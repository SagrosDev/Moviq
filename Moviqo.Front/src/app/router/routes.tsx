import type { RouteObject } from "react-router";
import { useParams } from "react-router";
import { DesignSystemPage } from "../../pages/design-system";
import { HomePage } from "../../pages/home";
import { MyWorkPage } from "../../pages/my-work";
import { PasswordRecoveryPage } from "../../pages/password-recovery";
import { PasswordResetPage } from "../../pages/password-reset";
import { ProcessDetailPage } from "../../pages/process-detail";
import { RegistrationPage } from "../../pages/registration";
import { SignInPage } from "../../pages/sign-in";
import { TaskFormPage } from "../../pages/task-form";
import { VerificationPage } from "../../pages/verification";
import {
  AuthenticatedLayout,
  NotFoundPage,
  PublicHomeRoute,
  PublicLayout,
  RouteErrorPage,
  SignOutRoute
} from "./RoutePages";

const TaskFormRoute = () => {
  const { taskId = "" } = useParams();
  return <TaskFormPage taskId={taskId} />;
};

const ProcessDetailRoute = () => {
  const { processId = "" } = useParams();
  return <ProcessDetailPage processId={processId} />;
};

const lazyWorkflowCatalog = async () => ({
  Component: (await import("../../pages/workflow-catalog")).WorkflowCatalogPage
});

const lazyWorkflowCreate = async () => ({
  Component: (await import("../../pages/workflow-create")).WorkflowCreatePage
});

const lazyWorkflowDesign = async () => ({
  Component: (await import("../../pages/workflow-design")).WorkflowDesignPage
});

const lazyFormLauncher = async () => ({
  Component: (await import("../../pages/forms")).FormLauncherPage
});

const lazyFormDesign = async () => ({
  Component: (await import("../../pages/forms")).FormDesignRoutePage
});

export const appRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { id: "home", index: true, element: <PublicHomeRoute page={<HomePage />} /> },
      { id: "home-es", path: "es", element: <PublicHomeRoute page={<HomePage />} /> },
      { id: "home-en", path: "en", element: <PublicHomeRoute page={<HomePage />} /> },
      { id: "register", path: "register", element: <RegistrationPage /> },
      { id: "verify-email", path: "verify-email", element: <VerificationPage /> },
      { id: "sign-in", path: "sign-in", element: <SignInPage /> },
      { id: "password-recovery", path: "password-recovery", element: <PasswordRecoveryPage /> },
      { id: "password-reset", path: "password-reset", element: <PasswordResetPage /> },
      { id: "design-system", path: "design-system", element: <DesignSystemPage /> },
      { id: "public-not-found", path: "*", element: <NotFoundPage /> }
    ]
  },
  {
    element: <AuthenticatedLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { id: "dashboard", path: "my-work", element: <MyWorkPage module="dashboard" /> },
      { id: "tasks", path: "my-work/tasks", element: <MyWorkPage module="tasks" /> },
      { id: "task-form", path: "my-work/tasks/:taskId", element: <TaskFormRoute /> },
      { id: "processes", path: "my-work/processes", element: <MyWorkPage module="processes" /> },
      { id: "process-detail", path: "my-work/processes/:processId", element: <ProcessDetailRoute /> },
      { id: "start-process", path: "processes/start", element: <MyWorkPage module="start-process" /> },
      { id: "sign-out", path: "sign-out", element: <SignOutRoute /> },
      { id: "workflow-catalog", path: "workflows", lazy: lazyWorkflowCatalog },
      { id: "workflow-create", path: "workflows/new", lazy: lazyWorkflowCreate },
      { id: "workflow-design", path: "workflows/:workflowId/design", lazy: lazyWorkflowDesign },
      { id: "form-launcher", path: "forms", lazy: lazyFormLauncher },
      {
        id: "form-design",
        path: "workflows/:workflowId/tasks/:taskElementId/form",
        lazy: lazyFormDesign
      },
      { id: "my-work-not-found", path: "my-work/*", element: <NotFoundPage /> },
      { id: "processes-not-found", path: "processes/*", element: <NotFoundPage /> },
      { id: "workflows-not-found", path: "workflows/*", element: <NotFoundPage /> },
      { id: "forms-not-found", path: "forms/*", element: <NotFoundPage /> }
    ]
  }
];
