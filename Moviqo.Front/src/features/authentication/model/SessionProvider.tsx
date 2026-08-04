import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { bootstrapSession, signOut, type SessionContext } from "./session";
import { resolveProtectedRedirectPath } from "./sessionRouting";
import { clearProtectedQueryState } from "../../../shared/api";

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
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    const redirectAnonymousIfRequired = () => {
      const nextPath = resolveProtectedRedirectPath(window.location.pathname);
      if (nextPath && window.location.pathname !== nextPath) {
        window.location.assign(nextPath);
      }
    };

    const loadSession = async () => {
      try {
        const context = await bootstrapSession();
        if (context) {
          setState({ status: "authenticated", context });
          return;
        }

        clearProtectedQueryState("anonymous-session");
        setState({ status: "anonymous" });
        redirectAnonymousIfRequired();
      } catch {
        clearProtectedQueryState("session-bootstrap-failed");
        setState({ status: "anonymous" });
        redirectAnonymousIfRequired();
      }
    };

    const handleSessionExpired = () => {
      clearProtectedQueryState("session-expired");
      setState({ status: "anonymous" });
      redirectAnonymousIfRequired();
    };

    void loadSession();
    window.addEventListener("moviqo:session-expired", handleSessionExpired);
    return () => window.removeEventListener("moviqo:session-expired", handleSessionExpired);
  }, []);

  const signOutCurrentSession = async () => {
    await signOut();
    clearProtectedQueryState("sign-out");
    setState({ status: "anonymous" });
    window.location.assign("/sign-in");
  };

  return <sessionContext.Provider value={{ state, signOutCurrentSession }}>{children}</sessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const value = useContext(sessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
};
