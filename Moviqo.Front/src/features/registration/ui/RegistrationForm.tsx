import { useState, type FormEvent } from "react";
import { normalizeApiProblem } from "../../../shared/api";
import { useLanguage } from "../../../shared/localization";
import { Button } from "../../../shared/ui/Button";
import { PasswordField } from "../../../shared/ui/PasswordField";
import {
  applyRegistrationFailure,
  buildInitialRegistrationDraft,
  fieldErrorMapFromProblem,
  type RegistrationDraft
} from "../model/registrationForm";
import { submitRegistration } from "../model/submitRegistration";

const browserLanguages = () => {
  if (typeof navigator === "undefined") {
    return [] as const;
  }

  return navigator.languages.length > 0 ? navigator.languages : [navigator.language];
};

const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

const updateDraft = (
  draft: RegistrationDraft,
  field: keyof RegistrationDraft,
  value: RegistrationDraft[keyof RegistrationDraft]
) => {
  return {
    ...draft,
    [field]: value
  };
};

const fieldError = (fieldErrors: Record<string, string[]>, fieldName: string) => {
  return fieldErrors[fieldName]?.[0];
};

export const RegistrationForm = () => {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<RegistrationDraft>(() =>
    buildInitialRegistrationDraft({
      browserLanguages: browserLanguages(),
      browserTimeZone: browserTimeZone()
    })
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [problemCorrelationId, setProblemCorrelationId] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setProblemCorrelationId(null);
    setSuccessEmail(null);

    try {
      const result = await submitRegistration(draft);
      setFieldErrors({});
      setDraft((currentDraft) => ({
        ...currentDraft,
        password: ""
      }));
      setSuccessEmail(result.email);
    } catch (error) {
      const problem = normalizeApiProblem(error);
      setFieldErrors(fieldErrorMapFromProblem(problem, t));
      setDraft((currentDraft) =>
        applyRegistrationFailure(currentDraft, problem.invalidParams)
      );
      setSubmitError(t("registration.failure"));
      setProblemCorrelationId(problem.correlationId || null);
      setIsPasswordRevealed(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <div className="registration-grid">
        <label className="form-field">
          <span>{t("registration.ownerName.label")}</span>
          <input
            value={draft.ownerName}
            onChange={(event) => setDraft(updateDraft(draft, "ownerName", event.target.value))}
            aria-invalid={fieldError(fieldErrors, "ownerName") ? true : undefined}
            aria-describedby={
              fieldError(fieldErrors, "ownerName") ? "registration-owner-error" : undefined
            }
            autoComplete="name"
          />
          {fieldError(fieldErrors, "ownerName") ? (
            <small id="registration-owner-error" className="validation-message">
              {fieldError(fieldErrors, "ownerName")}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <span>{t("registration.organizationName.label")}</span>
          <input
            value={draft.organizationName}
            onChange={(event) =>
              setDraft(updateDraft(draft, "organizationName", event.target.value))
            }
            aria-invalid={fieldError(fieldErrors, "organizationName") ? true : undefined}
            aria-describedby={
              fieldError(fieldErrors, "organizationName")
                ? "registration-organization-error"
                : undefined
            }
            autoComplete="organization"
          />
          {fieldError(fieldErrors, "organizationName") ? (
            <small id="registration-organization-error" className="validation-message">
              {fieldError(fieldErrors, "organizationName")}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <span>{t("registration.email.label")}</span>
          <input
            type="email"
            value={draft.email}
            onChange={(event) => setDraft(updateDraft(draft, "email", event.target.value))}
            aria-invalid={fieldError(fieldErrors, "email") ? true : undefined}
            aria-describedby={
              fieldError(fieldErrors, "email") ? "registration-email-error" : undefined
            }
            autoComplete="email"
          />
          {fieldError(fieldErrors, "email") ? (
            <small id="registration-email-error" className="validation-message">
              {fieldError(fieldErrors, "email")}
            </small>
          ) : null}
        </label>

        <PasswordField
          id="registration-password"
          label={t("registration.password.label")}
          helperText={t("password.policy.helper")}
          revealLabel={t("password.policy.reveal")}
          hideLabel={t("password.policy.hide")}
          value={draft.password}
          onChange={(event) => setDraft(updateDraft(draft, "password", event.target.value))}
          isRevealed={isPasswordRevealed}
          onRevealToggle={() => setIsPasswordRevealed(!isPasswordRevealed)}
          errorMessage={fieldError(fieldErrors, "password")}
        />

        <label className="form-field">
          <span>{t("registration.language.label")}</span>
          <select
            value={draft.language}
            onChange={(event) =>
              setDraft(updateDraft(draft, "language", event.target.value as "es" | "en"))
            }
          >
            <option value="es">{t("app.language.spanish")}</option>
            <option value="en">{t("app.language.english")}</option>
          </select>
        </label>

        <label className="form-field">
          <span>{t("registration.region.label")}</span>
          <input
            value={draft.region}
            onChange={(event) => setDraft(updateDraft(draft, "region", event.target.value))}
            aria-invalid={fieldError(fieldErrors, "region") ? true : undefined}
            aria-describedby={
              fieldError(fieldErrors, "region") ? "registration-region-error" : undefined
            }
          />
          {fieldError(fieldErrors, "region") ? (
            <small id="registration-region-error" className="validation-message">
              {fieldError(fieldErrors, "region")}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <span>{t("registration.timezone.label")}</span>
          <input
            value={draft.timezone}
            onChange={(event) => setDraft(updateDraft(draft, "timezone", event.target.value))}
            aria-invalid={fieldError(fieldErrors, "timezone") ? true : undefined}
            aria-describedby={
              fieldError(fieldErrors, "timezone") ? "registration-timezone-error" : undefined
            }
          />
          {fieldError(fieldErrors, "timezone") ? (
            <small id="registration-timezone-error" className="validation-message">
              {fieldError(fieldErrors, "timezone")}
            </small>
          ) : null}
        </label>

        <label className="form-field">
          <span>{t("registration.currency.label")}</span>
          <input
            value={draft.currency}
            onChange={(event) => setDraft(updateDraft(draft, "currency", event.target.value))}
            aria-invalid={fieldError(fieldErrors, "currency") ? true : undefined}
            aria-describedby={
              fieldError(fieldErrors, "currency") ? "registration-currency-error" : undefined
            }
          />
          {fieldError(fieldErrors, "currency") ? (
            <small id="registration-currency-error" className="validation-message">
              {fieldError(fieldErrors, "currency")}
            </small>
          ) : null}
        </label>
      </div>

      <section className="registration-consent" aria-labelledby="registration-consent-title">
        <h2 id="registration-consent-title">{t("registration.consent.title")}</h2>
        <p>{t("registration.consent.body")}</p>
        <p>{t("registration.documents.current")}</p>
        <label className="registration-checkbox">
          <input
            id="registration-terms"
            type="checkbox"
            checked={draft.termsAccepted}
            aria-invalid={fieldError(fieldErrors, "termsAccepted") ? true : undefined}
            aria-describedby={fieldError(fieldErrors, "termsAccepted") ? "registration-terms-error" : undefined}
            onChange={(event) =>
              setDraft(updateDraft(draft, "termsAccepted", event.target.checked))
            }
          />
          <span>{t("registration.terms.label")}</span>
        </label>
        {fieldError(fieldErrors, "termsAccepted") ? (
          <p id="registration-terms-error" className="validation-message" role="alert">
            {fieldError(fieldErrors, "termsAccepted")}
          </p>
        ) : null}
        <label className="registration-checkbox">
          <input
            id="registration-privacy"
            type="checkbox"
            checked={draft.privacyAccepted}
            aria-invalid={fieldError(fieldErrors, "privacyAccepted") ? true : undefined}
            aria-describedby={fieldError(fieldErrors, "privacyAccepted") ? "registration-privacy-error" : undefined}
            onChange={(event) =>
              setDraft(updateDraft(draft, "privacyAccepted", event.target.checked))
            }
          />
          <span>{t("registration.privacy.label")}</span>
        </label>
        {fieldError(fieldErrors, "privacyAccepted") ? (
          <p id="registration-privacy-error" className="validation-message" role="alert">
            {fieldError(fieldErrors, "privacyAccepted")}
          </p>
        ) : null}
        <label className="registration-checkbox">
          <input
            id="registration-prohibited-data"
            type="checkbox"
            checked={draft.prohibitedDataAcknowledged}
            aria-invalid={fieldError(fieldErrors, "prohibitedDataAcknowledged") ? true : undefined}
            aria-describedby={fieldError(fieldErrors, "prohibitedDataAcknowledged") ? "registration-prohibited-data-error" : undefined}
            onChange={(event) =>
              setDraft(
                updateDraft(draft, "prohibitedDataAcknowledged", event.target.checked)
              )
            }
          />
          <span>{t("registration.prohibited.label")}</span>
        </label>
        {fieldError(fieldErrors, "prohibitedDataAcknowledged") ? (
          <p id="registration-prohibited-data-error" className="validation-message" role="alert">
            {fieldError(fieldErrors, "prohibitedDataAcknowledged")}
          </p>
        ) : null}
      </section>

      {submitError ? (
        <p className="validation-message" role="alert" aria-live="polite">
          {submitError}
          {problemCorrelationId ? ` (${problemCorrelationId})` : null}
        </p>
      ) : null}
      {successEmail ? (
        <p className="success-message">
          {t("registration.success")} {successEmail}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("registration.submitting") : t("registration.submit")}
      </Button>
    </form>
  );
};
