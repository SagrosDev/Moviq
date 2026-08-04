import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createLandingMeasurementPayload,
  landingContent,
  landingDestinations,
  landingMeasurementEnabled,
  resolveLandingMetadata,
  validateLandingContent
} from "../../src/pages/home/model/landingContent";
import { configuredDestination } from "../../src/pages/home/ui/HomePage";

const bannedClaims = [
  "WhatsApp",
  "MFA",
  "SSO",
  "anonymous",
  "public start",
  "round-robin",
  "automatic assignment",
  "guaranteed",
  "always"
];

test("landing content is complete and bounded in both locales", () => {
  for (const locale of ["es", "en"] as const) {
    const content = landingContent[locale];
    assert.ok(content.hero.title.length > 0);
    assert.match(content.hero.body, /Moviqo/i);
    assert.match(content.hero.capabilities, /Forms|formularios/i);
    assert.match(content.timeToValue, /30|30|treinta/i);
    assert.match(content.beta.body, /beta/i);
    assert.match(content.beta.body, /permanent|permanente/i);

    for (const scenario of content.scenarios) {
      assert.match(scenario.label, /sample|demo|fictional|muestra|demostraci[oó]n|ficticio/i);
      assert.ok(scenario.name.length > 0);
      assert.ok(scenario.alt.length > 0);
    }

    const serialized = JSON.stringify(content).toLowerCase();
    for (const claim of bannedClaims) {
      assert.equal(serialized.includes(claim.toLowerCase()), false, `banned claim: ${claim}`);
    }
  }
});

test("public destinations fail closed by kind and allowlist", () => {
  const origin = "https://uat.moviqo.example";
  assert.equal(configuredDestination("https://uat.moviqo.example/register?campaign=beta", "/register", { expectedPath: "/register", origin }), "/register?campaign=beta");
  assert.equal(configuredDestination("https://app.uat.moviqo.example/register?campaign=beta", "/register", { expectedPath: "/register", origin, allowedOrigins: [origin, "https://app.uat.moviqo.example"] }), "https://app.uat.moviqo.example/register?campaign=beta");
  assert.equal(configuredDestination("https://app.uat.moviqo.example/register", "/register", { expectedPath: "/register", origin }), "/register");
  assert.equal(configuredDestination("https://prod.moviqo.example/register", "/register", { expectedPath: "/register", origin }), "/register");
  assert.equal(configuredDestination("//evil.example/register", "/register", { expectedPath: "/register", origin }), "/register");
  assert.equal(configuredDestination("https://docs.moviqo.example/beta", "", { kind: "document", origin, allowedOrigins: [origin, "https://docs.moviqo.example"] }), "https://docs.moviqo.example/beta");
  assert.equal(configuredDestination("https://evil.example/beta", "", { kind: "document", origin, allowedOrigins: [origin] }), "");
  assert.equal(configuredDestination("https://support.moviqo.example", "", { kind: "support", origin }), "");
  assert.equal(configuredDestination("mailto:beta@moviqo.example", "", { kind: "support", origin }), "mailto:beta@moviqo.example");
});

test("landing destinations use safe same-origin fallbacks", () => {
  assert.equal(landingDestinations.register, "/register");
  assert.equal(landingDestinations.signIn, "/sign-in");
  assert.equal(landingDestinations.betaTerms, "");
  assert.equal(landingDestinations.privacy, "");
  assert.equal(landingDestinations.prohibitedData, "");
  assert.equal(landingDestinations.support, "");
});

test("localized landing metadata is complete and environment-safe", () => {
  const es = resolveLandingMetadata("es", "https://uat.moviqo.example");
  const en = resolveLandingMetadata("en", "https://uat.moviqo.example");

  assert.equal(es.locale, "es_CO");
  assert.equal(en.locale, "en_US");
  assert.equal(es.canonical, "https://uat.moviqo.example/es/");
  assert.equal(en.canonical, "https://uat.moviqo.example/en/");
  assert.ok(es.title.length > 0);
  assert.ok(en.description.length > 0);
  assert.equal(es.alternate.href, "https://uat.moviqo.example/en/");
  assert.equal(en.alternate.href, es.canonical);
  assert.equal(es.canonical.includes("?"), false);
  assert.equal(es.description.match(/guarantee|garant[ií]a|customer|cliente/i), null);
});

test("landing content validator accepts both locales and reports unsafe content", () => {
  assert.deepEqual(validateLandingContent(landingContent), []);
  const invalid = structuredClone(landingContent);
  invalid.en.hero.title = "Guaranteed customer savings";
  assert.match(validateLandingContent(invalid).join(" "), /unsafe claim/i);
});

test("measurement payload is a closed, privacy-safe allowlist", () => {
  assert.equal(landingMeasurementEnabled, false);
  const payload = createLandingMeasurementPayload({
    event: "registration_start",
    locale: "en",
    referrer: "https://evil.example/private?email=jortiz@example.com",
    campaign: "spring-secret-customer-list",
    device: "mobile",
    performance: "fast",
    email: "jortiz@example.com",
    processData: "sensitive"
  });

  assert.deepEqual(payload, {
    event: "registration_start",
    locale: "en",
    referrerClass: "external",
    campaignClass: "campaign-present",
    deviceClass: "mobile",
    performanceClass: "fast"
  });
});

test("landing legal destinations accept the public document contract", () => {
  const origin = "https://uat.moviqo.internal";
  assert.equal(configuredDestination("/legal/beta-terms.html", "", { kind: "document", origin }), "/legal/beta-terms.html");
  assert.equal(configuredDestination("/legal/privacy-notice.html", "", { kind: "document", origin }), "/legal/privacy-notice.html");
  assert.equal(configuredDestination("/legal/prohibited-data.html", "", { kind: "document", origin }), "/legal/prohibited-data.html");
  assert.equal(configuredDestination("mailto:beta-support@moviqo.internal", "", { kind: "support", origin }), "mailto:beta-support@moviqo.internal");
});
