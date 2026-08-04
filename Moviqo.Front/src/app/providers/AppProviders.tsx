import type { ReactNode } from "react";
import { SessionProvider } from "../../features/authentication";
import { LanguageProvider } from "../../shared/localization";

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return <LanguageProvider><SessionProvider>{children}</SessionProvider></LanguageProvider>;
};
