import type { ApiProblemDetails } from "../../../shared/api";
import type { MessageKey, MoviqoTranslator } from "../../../shared/localization";

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
  preferredLanguage?: RegistrationDraft["language"];
};

type RegionalSuggestion = {
  region: string;
  currency: string;
};

const registrationDocumentVersion = "2026-08-04";

const renderedRegistrationFields = new Set<keyof RegistrationDraft>([
  "ownerName",
  "organizationName",
  "email",
  "password",
  "language",
  "region",
  "timezone",
  "currency",
  "termsAccepted",
  "privacyAccepted",
  "prohibitedDataAcknowledged"
]);

const documentVersionFields = new Set(["termsVersion", "privacyVersion"]);

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
  browserTimeZone,
  preferredLanguage = "es"
}: RegistrationDefaults): RegistrationDraft => {
  const suggestion = resolveRegionalSuggestion(browserLanguages, browserTimeZone);

  return {
    ownerName: "",
    organizationName: "",
    email: "",
    password: "",
    language: preferredLanguage,
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
  return { ...draft };
};

export const clearRegistrationFieldError = (
  fieldErrors: Record<string, string[]>,
  fieldName: keyof RegistrationDraft
) => {
  if (!fieldErrors[fieldName]) {
    return fieldErrors;
  }

  const nextErrors = { ...fieldErrors };
  delete nextErrors[fieldName];
  return nextErrors;
};

export const registrationRequiredFieldErrors = (
  draft: RegistrationDraft,
  translate: MoviqoTranslator
): Record<string, string[]> => {
  const fieldErrors: Record<string, string[]> = {};
  const requiredTextFields = [
    "ownerName",
    "organizationName",
    "email",
    "password",
    "region",
    "timezone",
    "currency"
  ] as const;
  const requiredConsentFields = [
    "termsAccepted",
    "privacyAccepted",
    "prohibitedDataAcknowledged"
  ] as const;

  for (const field of requiredTextFields) {
    if (!draft[field].trim()) {
      fieldErrors[field] = [translate("validation.required")];
    }
  }

  for (const field of requiredConsentFields) {
    if (!draft[field]) {
      fieldErrors[field] = [translate("validation.required")];
    }
  }

  return fieldErrors;
};

export const fieldErrorMapFromProblem = (
  problem: ApiProblemDetails,
  translate?: MoviqoTranslator
): Record<string, string[]> => {
  const fieldErrors: Record<string, string[]> = {};

  const messageKeyForCode = (code: string | undefined): MessageKey => {
    if (code === "required") return "validation.required";
    if (code === "invalid_email") return "validation.email";
    return "validation.generic";
  };

  for (const param of problem.invalidParams || []) {
    const requestedField = String(param.name || "nonFieldErrors");
    const isRenderedField = renderedRegistrationFields.has(
      requestedField as keyof RegistrationDraft
    );
    const fieldName = isRenderedField ? requestedField : "nonFieldErrors";
    const messageKey = documentVersionFields.has(requestedField)
      ? "registration.errors.documents"
      : isRenderedField
        ? messageKeyForCode(param.code)
        : "registration.errors.form";

    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = [];
    }
    fieldErrors[fieldName].push(
      translate ? translate(messageKey) : String(param.reason || "Invalid value.")
    );
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
