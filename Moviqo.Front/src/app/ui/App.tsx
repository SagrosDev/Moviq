import { HomePage } from "../../pages/home";
import { DesignSystemPage } from "../../pages/design-system";
import { RegistrationPage } from "../../pages/registration";
import { VerificationPage } from "../../pages/verification";
import { AppProviders } from "../providers/AppProviders";
import { EnvironmentBanner } from "./EnvironmentBanner";

export const App = () => {
  const path = typeof window === "undefined" ? "/" : window.location.pathname;

  return (
    <AppProviders>
      <EnvironmentBanner />
      {path === "/design-system" ? (
        <DesignSystemPage />
      ) : path === "/register" ? (
        <RegistrationPage />
      ) : path === "/verify-email" ? (
        <VerificationPage />
      ) : (
        <HomePage />
      )}
    </AppProviders>
  );
};
