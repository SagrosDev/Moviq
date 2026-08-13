import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  readVerificationToken,
  verificationLocationWithoutToken,
  VerificationStatusPanel,
  verifyEmailToken
} from "../../src/features/verification";
import { LanguageProvider, memoryLanguagePreferenceAdapter } from "../../src/shared/localization";

test("verification token is read from the public query string without extra whitespace", () => {
  assert.equal(readVerificationToken("?token= signed-token%20"), "signed-token");
  assert.equal(readVerificationToken("?other=value"), "");
});

test("verification removes only the sensitive token from the visible location", () => {
  assert.equal(
    verificationLocationWithoutToken("/verify-email", "?token=signed-token&lang=en", "#status"),
    "/verify-email?lang=en#status"
  );
});

test("verification client posts the token to the public activation endpoint", async () => {
  let requestedUrl = "";
  let requestedBody = "";

  const result = await verifyEmailToken("signed-token", async (input, init) => {
    requestedUrl = String(input);
    requestedBody = String(init?.body ?? "");

    return new Response(
      JSON.stringify({
        status: "activated",
        email: "ana@example.com",
        language: "es",
        nextStep: "sign_in"
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
  });

  assert.equal(requestedUrl, "/api/v1/organizations/registrations/verify-email/");
  assert.equal(requestedBody, JSON.stringify({ token: "signed-token" }));
  assert.equal(result.email, "ana@example.com");
});

test("verification status panel localizes recovery and success states", () => {
  const spanishMarkup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(VerificationStatusPanel, {
          state: { kind: "invalid" }
        })
      },
    )
  );
  const englishMarkup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: {
          read: () => "en" as const,
          write: () => undefined
        },
        browserLanguages: [],
        children: createElement(VerificationStatusPanel, {
          state: { kind: "success", email: "ana@example.com" }
        })
      },
    )
  );

  assert.match(spanishMarkup, /No se pudo verificar el enlace/);
  assert.match(spanishMarkup, /Registrar de nuevo/);
  assert.match(spanishMarkup, /href="\/register"/);
  assert.match(englishMarkup, /Email verified/);
  assert.match(englishMarkup, /ana@example.com/);
  assert.match(englishMarkup, /Return home/);
});

test("verification pending state uses the shared visual loading status", () => {
  const markup = renderToStaticMarkup(
    createElement(
      LanguageProvider,
      {
        adapter: memoryLanguagePreferenceAdapter(),
        browserLanguages: [],
        children: createElement(VerificationStatusPanel, {
          state: { kind: "loading" }
        })
      },
    )
  );

  assert.match(markup, /role="status"/);
  assert.match(markup, /animate-spin/);
  assert.match(markup, /motion-reduce:animate-none/);
  assert.match(markup, /Estamos validando este enlace seguro/);
});
