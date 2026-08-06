export type SessionContext = {
  authenticated: true;
  user: { id: number; displayName: string; preferredLanguage: string };
  membership: {
    id: string;
    organizationId: string;
    organizationTimezone: string;
    role: string;
  };
};

export type SessionCredentials = { email: string; password: string };

export const readCookie = (name: string, cookie = document.cookie): string =>
  cookie.split(";").map((part) => part.trim().split("=")).find(([key]) => key === name)?.[1] ?? "";

export const csrfHeaders = (): HeadersInit => {
  const token = readCookie("csrftoken");
  return token ? { "X-CSRFToken": decodeURIComponent(token) } : {};
};

export const signIn = async (credentials: SessionCredentials, fetchImplementation: typeof fetch = fetch): Promise<SessionContext> => {
  await loadCsrfToken(fetchImplementation);
  const response = await fetchImplementation("/api/v1/auth/sign-in/", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify(credentials) });
  if (!response.ok) throw (await response.json()) as unknown;
  return (await response.json()) as SessionContext;
};

export const signOut = async (fetchImplementation: typeof fetch = fetch): Promise<void> => {
  const response = await fetchImplementation("/api/v1/auth/sign-out/", { method: "POST", credentials: "same-origin", headers: csrfHeaders() });
  if (!response.ok) throw (await response.json()) as unknown;
};

export const bootstrapSession = async (fetchImplementation: typeof fetch = fetch): Promise<SessionContext | null> => {
  const response = await fetchImplementation("/api/v1/auth/session/", { credentials: "same-origin" });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw (await response.json()) as unknown;
  return (await response.json()) as SessionContext;
};

export const loadCsrfToken = async (fetchImplementation: typeof fetch = fetch): Promise<void> => {
  const response = await fetchImplementation("/api/v1/auth/csrf/", { credentials: "same-origin" });
  if (!response.ok) throw (await response.json()) as unknown;
};
