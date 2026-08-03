import { HomePage } from "../../pages/home";
import { DesignSystemPage } from "../../pages/design-system";
import { AppProviders } from "../providers/AppProviders";

export const App = () => {
  const path = typeof window === "undefined" ? "/" : window.location.pathname;

  return (
    <AppProviders>
      {path === "/design-system" ? <DesignSystemPage /> : <HomePage />}
    </AppProviders>
  );
};
