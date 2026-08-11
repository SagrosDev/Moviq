import type { ReactNode } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { SessionProvider } from "../../features/authentication";
import { createMoviqoQueryClient } from "../../shared/api";
import { LanguageProvider } from "../../shared/localization";

type AppProvidersProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

const applicationQueryClient = createMoviqoQueryClient();

export const AppProviders = ({
  children,
  queryClient = applicationQueryClient
}: AppProvidersProps) => {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>{children}</SessionProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
};
