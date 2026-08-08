const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_COOKIE_NAME = "csrftoken";

let cachedCsrfToken = "";

const readCookie = (name: string): string =>
  typeof document === "undefined"
    ? ""
    : document.cookie
        .split(";")
        .map((part) => part.trim().split("="))
        .find(([key]) => key === name)?.[1] ?? "";

export const readCsrfToken = (): string => {
  const cookieToken = readCookie(CSRF_COOKIE_NAME);
  return cookieToken ? decodeURIComponent(cookieToken) : cachedCsrfToken;
};

export const csrfHeaders = (): HeadersInit => {
  const token = readCsrfToken();
  return token ? { "X-CSRFToken": token } : {};
};

export const requiresCsrfProtection = (method: string): boolean =>
  !SAFE_HTTP_METHODS.has(method.toUpperCase());

export const rememberCsrfToken = (token: string): void => {
  cachedCsrfToken = token.trim();
};

export const ensureCsrfToken = async (
  fetchImplementation: typeof fetch = fetch,
  endpoint = "/api/v1/auth/csrf/"
): Promise<void> => {
  if (readCsrfToken()) {
    return;
  }

  const response = await fetchImplementation(endpoint, {
    credentials: "same-origin"
  });
  if (!response.ok) {
    throw new Error(`Unable to bootstrap CSRF token: ${response.status}`);
  }

  const payload = (await response.json()) as Partial<{ csrfToken: string }>;
  if (typeof payload.csrfToken === "string" && payload.csrfToken.trim()) {
    rememberCsrfToken(payload.csrfToken);
  }

  if (!readCsrfToken()) {
    throw new Error("Unable to bootstrap CSRF token.");
  }
};
