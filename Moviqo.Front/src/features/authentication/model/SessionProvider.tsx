import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { bootstrapSession, signOut, type SessionContext } from "./session";
import { clearServerState } from "../../../shared/api";

type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; context: SessionContext };

type SessionContextValue = {
  state: SessionState;
  signOutCurrentSession: () => Promise<void>;
};

const sessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const previousOrganizationId = useRef<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const context = await bootstrapSession();
        if (context) {
          setState({ status: "authenticated", context });
          return;
        }

        clearServerState(queryClient);
        setState({ status: "anonymous" });
      } catch {
        clearServerState(queryClient);
        setState({ status: "anonymous" });
      }
    };

    const handleSessionExpired = () => {
      clearServerState(queryClient);
      setState({ status: "anonymous" });
    };

    void loadSession();
    window.addEventListener("moviqo:session-expired", handleSessionExpired);
    return () => window.removeEventListener("moviqo:session-expired", handleSessionExpired);
  }, [queryClient]);

  useEffect(() => {
    if (state.status !== "authenticated") {
      previousOrganizationId.current = null;
      return;
    }

    const organizationId = state.context.membership.organizationId;
    if (
      previousOrganizationId.current
      && previousOrganizationId.current !== organizationId
    ) {
      clearServerState(queryClient);
    }
    previousOrganizationId.current = organizationId;
  }, [queryClient, state]);

  const signOutCurrentSession = async () => {
    await signOut();
    clearServerState(queryClient);
    setState({ status: "anonymous" });
  };

  return <sessionContext.Provider value={{ state, signOutCurrentSession }}>{children}</sessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const value = useContext(sessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
};
