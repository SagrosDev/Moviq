import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PasswordRecoveryPage } from "../../src/pages/password-recovery";
import { PasswordResetPage } from "../../src/pages/password-reset";
import { RegistrationPage } from "../../src/pages/registration";
import { SignInPage } from "../../src/pages/sign-in";
import { VerificationPage } from "../../src/pages/verification";
import {
  LanguageProvider,
  memoryLanguagePreferenceAdapter
} from "../../src/shared/localization";

const publicPages = [
  ["registration", RegistrationPage],
  ["verification", VerificationPage],
  ["sign-in", SignInPage],
  ["password-recovery", PasswordRecoveryPage],
  ["password-reset", PasswordResetPage]
] as const;

const assertFullWidthControl = (markup: string, id: string) => {
  const control = markup.match(new RegExp(`<input[^>]*id="${id}"[^>]*>|<input(?=[^>]*id="${id}")[^>]*>`))?.[0];

  assert.ok(control, `expected input #${id}`);
  assert.match(control, /class="[^"]*\bw-full\b/);
};

test("public onboarding pages use the shared compact shell without authenticated navigation", () => {
  for (const [name, Page] of publicPages) {
    const markup = renderToStaticMarkup(createElement(Page));

    assert.match(markup, new RegExp(`data-public-page="${name}"`));
    assert.match(markup, /data-brand-mark="moviqo"/);
    assert.doesNotMatch(markup, /href="\/(?:my-work|design-system|admin)/);
    assert.doesNotMatch(
      markup,
      /class="(?:app-shell|app-header|app-main|page-heading|form-card|status-panel|registration-form|registration-grid|form-field|registration-checkbox|button)"/
    );
  }
});

test("onboarding forms render shared full-width controls and grouped registration sections", () => {
  const registration = renderToStaticMarkup(createElement(RegistrationPage));
  const signIn = renderToStaticMarkup(createElement(SignInPage));
  const recovery = renderToStaticMarkup(createElement(PasswordRecoveryPage));
  const reset = renderToStaticMarkup(createElement(PasswordResetPage));

  assert.match(registration, /id="registration-owner-name"/);
  assert.match(registration, /id="registration-organization-name"/);
  assert.match(registration, /id="registration-regional-title"/);
  assert.match(registration, /id="registration-consent-title"/);
  assert.match(registration, /border-moviqo-control-border/);
  assertFullWidthControl(signIn, "sign-in-email");
  assertFullWidthControl(recovery, "recovery-email");
  assertFullWidthControl(reset, "reset-password");
  assert.match(
    recovery,
    /<p(?=[^>]*data-page-context="true")(?=[^>]*class="[^"]*text-moviqo-body)[^>]*>/
  );
});

test("public onboarding renders reviewed copy instead of keys or placeholders in both languages", () => {
  for (const language of ["es", "en"] as const) {
    for (const [, Page] of publicPages) {
      const markup = renderToStaticMarkup(
        createElement(LanguageProvider, {
          adapter: memoryLanguagePreferenceAdapter(language),
          browserLanguages: [language],
          children: createElement(Page)
        })
      );

      assert.doesNotMatch(
        markup,
        /(?:registration|verification|signIn|passwordRecovery)\.[a-zA-Z]+|\{\{[^}]+\}\}|\$\{[^}]+\}/
      );
    }
  }
});
