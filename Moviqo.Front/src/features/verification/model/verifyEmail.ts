import { readApiProblem } from "../../../shared/api";

export type VerificationResult = {
  status: string;
  email: string;
  language: string;
  nextStep: string;
};

export const readVerificationToken = (search: string) => {
  const params = new URLSearchParams(search);
  return params.get("token")?.trim() ?? "";
};

export const verifyEmailToken = async (
  token: string,
  fetchImplementation: typeof fetch = fetch
): Promise<VerificationResult> => {
  const response = await fetchImplementation(
    "/api/v1/organizations/registrations/verify-email/",
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
    }
  );

  if (!response.ok) {
    throw await readApiProblem(response);
  }

  return (await response.json()) as VerificationResult;
};
