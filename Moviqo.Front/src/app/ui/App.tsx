import { HomePage } from "../../pages/home";
import { DesignSystemPage } from "../../pages/design-system";
import { RegistrationPage } from "../../pages/registration";
import { VerificationPage } from "../../pages/verification";
import { SignInPage } from "../../pages/sign-in";
import { PasswordRecoveryPage } from "../../pages/password-recovery";
import { PasswordResetPage } from "../../pages/password-reset";
import { MyWorkPage } from "../../pages/my-work";
import { AppProviders } from "../providers/AppProviders";
import { EnvironmentBanner } from "./EnvironmentBanner";

export const App = () => {
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  const isPublicLanding = path === "/" || path === "/es/" || path === "/en/";

  return (
    <AppProviders>
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
      ) : path === "/my-work" ? (
        <MyWorkPage />
      ) : (
        <HomePage />
      )}
    </AppProviders>
  );
};
