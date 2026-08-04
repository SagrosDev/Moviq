import type { ApiProblemDetails } from "../../../shared/api";

export type RegistrationDraft = {
  ownerName: string;
  organizationName: string;
  email: string;
  password: string;
  language: "es" | "en";
  region: string;
  timezone: string;
  currency: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  termsVersion: string;
  privacyVersion: string;
  prohibitedDataAcknowledged: boolean;
};

type RegistrationDefaults = {
  browserLanguages: readonly string[];
  browserTimeZone?: string;
};

type RegionalSuggestion = {
  region: string;
  currency: string;
};

const registrationDocumentVersion = "2026-08-04";

const regionalSuggestions: Record<string, RegionalSuggestion> = {
  AR: { region: "AR", currency: "ARS" },
  CL: { region: "CL", currency: "CLP" },
  CO: { region: "CO", currency: "COP" },
  ES: { region: "ES", currency: "EUR" },
  MX: { region: "MX", currency: "MXN" },
  PE: { region: "PE", currency: "PEN" },
  US: { region: "US", currency: "USD" }
};

export const buildInitialRegistrationDraft = ({
  browserLanguages,
  browserTimeZone
}: RegistrationDefaults): RegistrationDraft => {
  const suggestion = resolveRegionalSuggestion(browserLanguages, browserTimeZone);

  return {
    ownerName: "",
    organizationName: "",
    email: "",
    password: "",
    language: "es",
    region: suggestion.region,
    timezone: browserTimeZone || "America/Bogota",
    currency: suggestion.currency,
    termsAccepted: false,
    privacyAccepted: false,
    termsVersion: `beta-${registrationDocumentVersion}`,
    privacyVersion: `privacy-${registrationDocumentVersion}`,
    prohibitedDataAcknowledged: false
  };
};

export const applyRegistrationFailure = (
  draft: RegistrationDraft,
  _invalidParams: ApiProblemDetails["invalidParams"]
): RegistrationDraft => {
  return {
    ...draft,
    password: ""
  };
};

export const fieldErrorMapFromProblem = (
  problem: ApiProblemDetails
): Record<string, string[]> => {
  const fieldErrors: Record<string, string[]> = {};

  for (const param of problem.invalidParams || []) {
    const fieldName = String(param.name || "nonFieldErrors");
    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = [];
    }
    fieldErrors[fieldName].push(String(param.reason || "Invalid value."));
  }

  return fieldErrors;
};

const resolveRegionalSuggestion = (
  browserLanguages: readonly string[],
  browserTimeZone?: string
): RegionalSuggestion => {
  const timeZoneRegion = browserTimeZone?.split("/")[1]?.split("_")[0]?.toUpperCase();
  if (timeZoneRegion === "BOGOTA") {
    return regionalSuggestions.CO;
  }
  if (timeZoneRegion === "MADRID") {
    return regionalSuggestions.ES;
  }

  const locale = browserLanguages[0] || "es-CO";
  const region = locale.split("-")[1]?.toUpperCase() || "CO";

  return regionalSuggestions[region] || regionalSuggestions.CO;
};
