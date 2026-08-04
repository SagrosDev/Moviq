import { readApiProblem } from "../../../shared/api";
import type { RegistrationDraft } from "./registrationForm";

type RegistrationResult = {
  status: string;
  email: string;
  language: string;
};

export const submitRegistration = async (
  draft: RegistrationDraft
): Promise<RegistrationResult> => {
  const response = await fetch("/api/v1/organizations/registrations/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `registration-${crypto.randomUUID()}`
    },
    body: JSON.stringify(draft)
  });

  if (!response.ok) {
    throw await readApiProblem(response);
  }

  return (await response.json()) as RegistrationResult;
};
