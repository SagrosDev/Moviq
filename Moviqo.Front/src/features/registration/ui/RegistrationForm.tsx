import { useEffect, useRef, useState, type FormEvent } from "react";
import { normalizeApiProblem } from "../../../shared/api";
import { useLanguage, type MessageKey, type MoviqoTranslator } from "../../../shared/localization";
import {
  ActionBar,
  Alert,
  Button,
  ButtonLink,
  CheckboxField,
  ErrorSummary,
  FormGrid,
  FormGridItem,
  FormSection,
  PasswordField,
  SelectField,
  TextInput,
  type ErrorSummaryItem
} from "../../../shared/ui";
import {
  applyRegistrationFailure,
  buildInitialRegistrationDraft,
  clearRegistrationFieldError,
  fieldErrorMapFromProblem,
  registrationRequiredFieldErrors,
  type RegistrationDraft
} from "../model/registrationForm";
import { submitRegistration } from "../model/submitRegistration";

type VisibleRegistrationField = Exclude<
  keyof RegistrationDraft,
  "termsVersion" | "privacyVersion"
>;

type RegistrationFieldMetadata = {
  field: VisibleRegistrationField;
  id: string;
  labelKey: MessageKey;
};

const registrationFieldMetadata: readonly RegistrationFieldMetadata[] = [
  { field: "ownerName", id: "registration-owner-name", labelKey: "registration.ownerName.label" },
  {
    field: "organizationName",
    id: "registration-organization-name",
    labelKey: "registration.organizationName.label"
  },
  { field: "email", id: "registration-email", labelKey: "registration.email.label" },
  { field: "password", id: "registration-password", labelKey: "registration.password.label" },
  { field: "language", id: "registration-language", labelKey: "registration.language.label" },
  { field: "region", id: "registration-region", labelKey: "registration.region.label" },
  { field: "timezone", id: "registration-timezone", labelKey: "registration.timezone.label" },
  { field: "currency", id: "registration-currency", labelKey: "registration.currency.label" },
  { field: "termsAccepted", id: "registration-terms", labelKey: "registration.terms.label" },
  { field: "privacyAccepted", id: "registration-privacy", labelKey: "registration.privacy.label" },
  {
    field: "prohibitedDataAcknowledged",
    id: "registration-prohibited-data",
    labelKey: "registration.prohibited.label"
  }
];

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

const fieldError = (fieldErrors: Record<string, string[]>, fieldName: string) => {
  return fieldErrors[fieldName]?.[0];
};

export const buildRegistrationErrorSummaryItems = (
  fieldErrors: Record<string, string[]>,
  translate: MoviqoTranslator
): ErrorSummaryItem[] => {
  const items: ErrorSummaryItem[] = registrationFieldMetadata.flatMap(({ field, id, labelKey }) =>
    (fieldErrors[field] ?? []).map((message, index) => ({
      id: `${field}-${index}`,
      fieldId: id,
      fieldLabel: translate(labelKey),
      message
    }))
  );

  return items.concat(
    (fieldErrors.nonFieldErrors ?? []).map((message, index) => ({
      id: `registration-form-${index}`,
      message
    }))
  );
};

export const RegistrationForm = () => {
  const { language, t } = useLanguage();
  const [draft, setDraft] = useState<RegistrationDraft>(() =>
    buildInitialRegistrationDraft({
      browserLanguages: browserLanguages(),
      browserTimeZone: browserTimeZone(),
      preferredLanguage: language
    })
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [problemCorrelationId, setProblemCorrelationId] = useState<string | null>(null);
  const [errorFocusRequest, setErrorFocusRequest] = useState(0);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const submissionInFlightRef = useRef(false);

  const errorItems = buildRegistrationErrorSummaryItems(fieldErrors, t);

  useEffect(() => {
    if (errorFocusRequest > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [errorFocusRequest]);

  const updateField = <Field extends keyof RegistrationDraft,>(
    field: Field,
    value: RegistrationDraft[Field]
  ) => {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    setFieldErrors((currentErrors) => clearRegistrationFieldError(currentErrors, field));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionInFlightRef.current) {
      return;
    }

    const requiredFieldErrors = registrationRequiredFieldErrors(draft, t);
    if (Object.keys(requiredFieldErrors).length > 0) {
      setFieldErrors(requiredFieldErrors);
      setSubmitError(t("registration.failure"));
      setErrorFocusRequest((currentRequest) => currentRequest + 1);
      setProblemCorrelationId(null);
      setSuccessEmail(null);
      return;
    }

    submissionInFlightRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    setProblemCorrelationId(null);
    setSuccessEmail(null);

    try {
      const result = await submitRegistration(draft);
      setFieldErrors({});
      setDraft((currentDraft) => ({ ...currentDraft, password: "" }));
      setSuccessEmail(result.email);
    } catch (error) {
      const problem = normalizeApiProblem(error);
      const nextFieldErrors = fieldErrorMapFromProblem(problem, t);
      setFieldErrors(nextFieldErrors);
      setDraft((currentDraft) => applyRegistrationFailure(currentDraft, problem.invalidParams));
      setSubmitError(t("registration.failure"));
      setErrorFocusRequest((currentRequest) => currentRequest + 1);
      setProblemCorrelationId(problem.correlationId || null);
      setIsPasswordRevealed(false);
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-moviqo-6" onSubmit={handleSubmit} noValidate>
      {submitError ? (
        <ErrorSummary
          errors={errorItems}
          formMessage={submitError}
          ref={errorSummaryRef}
          supportDetail={problemCorrelationId ? `ID: ${problemCorrelationId}` : undefined}
          title={t("registration.errors.title")}
        />
      ) : null}

      {successEmail ? (
        <Alert announcement="polite" tone="success" title={t("status.ready")}>
          {t("registration.success")} {successEmail}
        </Alert>
      ) : null}

      <FormSection
        description={t("registration.identity.body")}
        title={t("registration.identity.title")}
        titleId="registration-identity-title"
      >
        <FormGrid>
          <FormGridItem span="half">
            <TextInput
              id="registration-owner-name"
              label={t("registration.ownerName.label")}
              value={draft.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              errorMessage={fieldError(fieldErrors, "ownerName")}
              autoComplete="name"
              required
            />
          </FormGridItem>
          <FormGridItem span="half">
            <TextInput
              id="registration-email"
              label={t("registration.email.label")}
              type="email"
              value={draft.email}
              onChange={(event) => updateField("email", event.target.value)}
              errorMessage={fieldError(fieldErrors, "email")}
              autoComplete="email"
              required
            />
          </FormGridItem>
          <FormGridItem span="full">
            <PasswordField
              id="registration-password"
              label={t("registration.password.label")}
              helperText={t("password.policy.helper")}
              revealLabel={t("password.policy.reveal")}
              hideLabel={t("password.policy.hide")}
              value={draft.password}
              onChange={(event) => updateField("password", event.target.value)}
              isRevealed={isPasswordRevealed}
              onRevealToggle={() => setIsPasswordRevealed((value) => !value)}
              errorMessage={fieldError(fieldErrors, "password")}
              autoComplete="new-password"
              required
            />
          </FormGridItem>
        </FormGrid>
      </FormSection>

      <FormSection
        description={t("registration.organization.body")}
        title={t("registration.organization.title")}
        titleId="registration-organization-title"
      >
        <TextInput
          id="registration-organization-name"
          label={t("registration.organizationName.label")}
          value={draft.organizationName}
          onChange={(event) => updateField("organizationName", event.target.value)}
          errorMessage={fieldError(fieldErrors, "organizationName")}
          autoComplete="organization"
          required
        />
      </FormSection>

      <FormSection
        description={t("registration.regional.body")}
        title={t("registration.regional.title")}
        titleId="registration-regional-title"
      >
        <FormGrid>
          <FormGridItem span="half">
            <SelectField
              id="registration-language"
              label={t("registration.language.label")}
              value={draft.language}
              onChange={(event) => updateField("language", event.target.value as "es" | "en")}
              errorMessage={fieldError(fieldErrors, "language")}
              options={[
                { value: "es", label: t("app.language.spanish") },
                { value: "en", label: t("app.language.english") }
              ]}
              required
            />
          </FormGridItem>
          <FormGridItem span="half">
            <TextInput
              id="registration-region"
              label={t("registration.region.label")}
              value={draft.region}
              onChange={(event) => updateField("region", event.target.value)}
              errorMessage={fieldError(fieldErrors, "region")}
              required
            />
          </FormGridItem>
          <FormGridItem span="half">
            <TextInput
              id="registration-timezone"
              label={t("registration.timezone.label")}
              value={draft.timezone}
              onChange={(event) => updateField("timezone", event.target.value)}
              errorMessage={fieldError(fieldErrors, "timezone")}
              required
            />
          </FormGridItem>
          <FormGridItem span="half">
            <TextInput
              id="registration-currency"
              label={t("registration.currency.label")}
              value={draft.currency}
              onChange={(event) => updateField("currency", event.target.value)}
              errorMessage={fieldError(fieldErrors, "currency")}
              required
            />
          </FormGridItem>
        </FormGrid>
      </FormSection>

      <FormSection
        description={t("registration.consent.body")}
        title={t("registration.consent.title")}
        titleId="registration-consent-title"
      >
        <p className="m-0 text-sm text-moviqo-ink-secondary">{t("registration.documents.current")}</p>
        <div className="grid gap-moviqo-4">
          <CheckboxField
            id="registration-terms"
            label={t("registration.terms.label")}
            checked={draft.termsAccepted}
            onChange={(event) => updateField("termsAccepted", event.target.checked)}
            errorMessage={fieldError(fieldErrors, "termsAccepted")}
            required
          />
          <CheckboxField
            id="registration-privacy"
            label={t("registration.privacy.label")}
            checked={draft.privacyAccepted}
            onChange={(event) => updateField("privacyAccepted", event.target.checked)}
            errorMessage={fieldError(fieldErrors, "privacyAccepted")}
            required
          />
          <CheckboxField
            id="registration-prohibited-data"
            label={t("registration.prohibited.label")}
            checked={draft.prohibitedDataAcknowledged}
            onChange={(event) => updateField("prohibitedDataAcknowledged", event.target.checked)}
            errorMessage={fieldError(fieldErrors, "prohibitedDataAcknowledged")}
            required
          />
        </div>
      </FormSection>

      <ActionBar align="between">
        <ButtonLink href="/sign-in" variant="quiet">{t("auth.signIn")}</ButtonLink>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("registration.submitting") : t("registration.submit")}
        </Button>
      </ActionBar>
    </form>
  );
};
