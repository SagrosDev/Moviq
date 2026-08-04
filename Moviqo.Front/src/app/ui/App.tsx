import { HomePage } from "../../pages/home";
import { DesignSystemPage } from "../../pages/design-system";
import { RegistrationPage } from "../../pages/registration";
import { VerificationPage } from "../../pages/verification";
import { SignInPage } from "../../pages/sign-in";
import { PasswordRecoveryPage } from "../../pages/password-recovery";
import { PasswordResetPage } from "../../pages/password-reset";
import { MyWorkPage } from "../../pages/my-work";
import { protectedEntryPath, useSession } from "../../features/authentication";
import { AppProviders } from "../providers/AppProviders";
import { EnvironmentBanner } from "./EnvironmentBanner";

const AppRouter = () => {
  const { state } = useSession();
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  const isPublicLanding = path === "/" || path === "/es/" || path === "/en/";
  const shouldRouteAuthenticatedRoot =
    path === "/" && state.status === "authenticated";

  return (
    <>
      {!isPublicLanding && <EnvironmentBanner />}
      {path === "/design-system" ? (
        <DesignSystemPage />
      ) : path === "/register" ? (
        <RegistrationPage />
      ) : path === "/verify-email" ? (
        <VerificationPage />
      ) : path === "/sign-in" ? (
        <SignInPage />
      ) : path === "/password-recovery" ? (
        <PasswordRecoveryPage />
      ) : path === "/password-reset" ? (
        <PasswordResetPage />
      ) : path === protectedEntryPath || shouldRouteAuthenticatedRoot ? (
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
