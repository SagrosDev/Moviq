import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyRegistrationFailure,
  buildInitialRegistrationDraft,
  clearRegistrationFieldError,
  fieldErrorMapFromProblem,
  registrationRequiredFieldErrors
} from "../../src/features/registration";

test("registration defaults to Spanish and derives regional suggestions from the browser", () => {
  const draft = buildInitialRegistrationDraft({
    browserLanguages: ["en-US"],
    browserTimeZone: "America/Bogota"
  });

  assert.equal(draft.language, "es");
  assert.equal(draft.region, "CO");
  assert.equal(draft.currency, "COP");
  assert.equal(draft.timezone, "America/Bogota");
  assert.equal(draft.termsAccepted, false);
  assert.equal(draft.privacyAccepted, false);
});

test("registration suggestions and password remain available for correction after failure", () => {
  const draft = buildInitialRegistrationDraft({
    browserLanguages: ["es-ES"],
    browserTimeZone: "Europe/Madrid"
  });

  const failed = applyRegistrationFailure(
    {
      ...draft,
      ownerName: "Ana Gomez",
      organizationName: "Equipo Norte",
      email: "ana@example.com",
      region: "US",
      currency: "USD",
      termsAccepted: true,
      privacyAccepted: true,
      password: "frase segura para moviqo 2026"
    },
    [
      {
        name: "email",
        code: "email_unavailable",
        reason: "Registration is unavailable for this email."
      }
    ]
  );

  assert.equal(failed.ownerName, "Ana Gomez");
  assert.equal(failed.organizationName, "Equipo Norte");
  assert.equal(failed.email, "ana@example.com");
  assert.equal(failed.region, "US");
  assert.equal(failed.currency, "USD");
  assert.equal(failed.termsAccepted, true);
  assert.equal(failed.privacyAccepted, true);
  assert.equal(failed.password, "frase segura para moviqo 2026");
});

test("registration honors the currently selected public language", () => {
  const draft = buildInitialRegistrationDraft({
    browserLanguages: ["es-CO"],
    browserTimeZone: "America/Bogota",
    preferredLanguage: "en"
  });

  assert.equal(draft.language, "en");
});

test("registration errors map rendered fields and collapse unknown paths to a form-level error", () => {
  const translated = fieldErrorMapFromProblem(
    {
      type: "validation_error",
      title: "Invalid request",
      status: 400,
      detail: "Review the form.",
      code: "validation_error",
      correlationId: "corr-123",
      invalidParams: [
        { name: "email", code: "invalid_email", reason: "unsafe" },
        { name: "termsAccepted", code: "required", reason: "unsafe" },
        { name: "termsVersion", code: "required", reason: "unsafe" },
        { name: "unexpectedPath", code: "unknown", reason: "unsafe" }
      ]
    },
    (key) => key
  );

  assert.deepEqual(translated, {
    email: ["validation.email"],
    termsAccepted: ["validation.required"],
    nonFieldErrors: [
      "registration.errors.documents",
      "registration.errors.form"
    ]
  });
});

test("correcting a field clears only that field's registration errors", () => {
  assert.deepEqual(
    clearRegistrationFieldError(
      {
        email: ["Enter a valid email."],
        organizationName: ["Required."],
        nonFieldErrors: ["Review the current terms."]
      },
      "email"
    ),
    {
      organizationName: ["Required."],
      nonFieldErrors: ["Review the current terms."]
    }
  );
});

test("registration marks every empty required control before submission", () => {
  const errors = registrationRequiredFieldErrors(
    buildInitialRegistrationDraft({
      browserLanguages: ["es-CO"],
      browserTimeZone: "America/Bogota"
    }),
    (key) => key
  );

  assert.deepEqual(errors, {
    ownerName: ["validation.required"],
    organizationName: ["validation.required"],
    email: ["validation.required"],
    password: ["validation.required"],
    termsAccepted: ["validation.required"],
    privacyAccepted: ["validation.required"],
    prohibitedDataAcknowledged: ["validation.required"]
  });
});
