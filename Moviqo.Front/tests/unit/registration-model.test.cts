import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyRegistrationFailure,
  buildInitialRegistrationDraft
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

test("registration suggestions remain editable and password values are cleared after failure", () => {
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
  assert.equal(failed.password, "");
});
