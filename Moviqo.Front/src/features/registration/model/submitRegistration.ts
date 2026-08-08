import { readApiProblem } from "../../../shared/api";
import { csrfHeaders, loadCsrfToken } from "../../authentication";
import type { RegistrationDraft } from "./registrationForm";

type RegistrationResult = {
  status: string;
  email: string;
  language: string;
};

export const submitRegistration = async (
  draft: RegistrationDraft,
  fetchImplementation: typeof fetch = fetch
): Promise<RegistrationResult> => {
  await loadCsrfToken(fetchImplementation);
  const response = await fetchImplementation("/api/v1/organizations/registrations/", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `registration-${crypto.randomUUID()}`,
      ...csrfHeaders()
    },
    body: JSON.stringify(draft)
  });

  if (!response.ok) {
    throw await readApiProblem(response);
  }

  return (await response.json()) as RegistrationResult;
};
