import { HomePage } from "../../pages/home";
import { DesignSystemPage } from "../../pages/design-system";
import { RegistrationPage } from "../../pages/registration";
import { VerificationPage } from "../../pages/verification";
import { SignInPage } from "../../pages/sign-in";
import { PasswordRecoveryPage } from "../../pages/password-recovery";
import { PasswordResetPage } from "../../pages/password-reset";
import { MyWorkPage } from "../../pages/my-work";
import { WorkflowCreatePage } from "../../pages/workflow-create";
import { protectedEntryPath, useSession } from "../../features/authentication";
import { AppProviders } from "../providers/AppProviders";
import { EnvironmentBanner } from "./EnvironmentBanner";

export const normalizeAppPath = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

const AppRouter = () => {
  const { state } = useSession();
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  const normalizedPath = normalizeAppPath(path);
  const isPublicLanding =
    normalizedPath === "/" || normalizedPath === "/es" || normalizedPath === "/en";
  const shouldRouteAuthenticatedRoot =
    normalizedPath === "/" && state.status === "authenticated";

  return (
    <>
      {!isPublicLanding && <EnvironmentBanner />}
      {normalizedPath === "/design-system" ? (
        <DesignSystemPage />
      ) : normalizedPath === "/register" ? (
        <RegistrationPage />
      ) : normalizedPath === "/verify-email" ? (
        <VerificationPage />
      ) : normalizedPath === "/sign-in" ? (
        <SignInPage />
      ) : normalizedPath === "/password-recovery" ? (
        <PasswordRecoveryPage />
      ) : normalizedPath === "/password-reset" ? (
        <PasswordResetPage />
      ) : normalizedPath === "/my-work/workflows/new" ? (
        <WorkflowCreatePage />
      ) : normalizedPath === protectedEntryPath || shouldRouteAuthenticatedRoot ? (
        <MyWorkPage />
      ) : (
        <HomePage />
      )}
    </>
  );
};

export const App = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};
