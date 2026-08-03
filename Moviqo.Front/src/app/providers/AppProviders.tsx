import type { ReactNode } from "react";
import { LanguageProvider } from "../../shared/localization";

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return <LanguageProvider>{children}</LanguageProvider>;
};
