import { HomePage } from "../../pages/home";
import { DesignSystemPage } from "../../pages/design-system";
import { RegistrationPage } from "../../pages/registration";
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
      ) : (
        <HomePage />
      )}
    </AppProviders>
  );
};
