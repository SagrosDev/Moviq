import { csrfHeaders, loadCsrfToken } from "./session";

export type PasswordRecoveryRequest = { email: string };
export type PasswordResetRequest = { token: string; password: string };

export const requestPasswordRecovery = async (
  request: PasswordRecoveryRequest,
  fetchImplementation: typeof fetch = fetch
): Promise<void> => {
  await loadCsrfToken(fetchImplementation);
  const response = await fetchImplementation("/api/v1/auth/password-recovery/", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...csrfHeaders() },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw (await response.json()) as unknown;
};

export const resetPassword = async (
  request: PasswordResetRequest,
  fetchImplementation: typeof fetch = fetch
): Promise<void> => {
  await loadCsrfToken(fetchImplementation);
  const response = await fetchImplementation("/api/v1/auth/password-reset/", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...csrfHeaders() },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw (await response.json()) as unknown;
};
