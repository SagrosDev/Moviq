import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { bootstrapSession, signOut, type SessionContext } from "./session";

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
    const loadSession = async () => {
      try {
        const context = await bootstrapSession();
        setState(context ? { status: "authenticated", context } : { status: "anonymous" });
      } catch {
        setState({ status: "anonymous" });
      }
    };

    const handleSessionExpired = () => {
      setState({ status: "anonymous" });
      if (window.location.pathname !== "/sign-in") window.location.assign("/sign-in");
    };

    void loadSession();
    window.addEventListener("moviqo:session-expired", handleSessionExpired);
    return () => window.removeEventListener("moviqo:session-expired", handleSessionExpired);
  }, []);

  const signOutCurrentSession = async () => {
    await signOut();
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
