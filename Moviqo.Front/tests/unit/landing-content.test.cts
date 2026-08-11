import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createLandingMeasurementPayload,
  landingContent,
  landingDestinations,
  landingMeasurementEnabled,
  resolveLandingMetadata,
  validateLandingContent
} from "../../src/pages/home/model/landingContent";
import { configuredDestination } from "../../src/pages/home/ui/HomePage";
import { HomePage } from "../../src/pages/home";
import { EnvironmentBanner } from "../../src/app/ui/EnvironmentBanner";

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
    assert.match(`${content.hero.body} ${content.hero.capabilities}`, /Forms|formularios/i);
    assert.ok(content.hero.capabilities.trim().length > 0);
    assert.doesNotMatch(content.hero.capabilities, /interfaz bilingüe|bilingual interface/i);
    assert.match(content.timeToValue, /30|30|treinta/i);
    assert.match(content.footer.rights, /© 2026 Moviqo/);
    assert.match(content.beta.body, /beta/i);
    assert.match(content.beta.body, /permanent|permanente/i);

    for (const scenario of content.scenarios) {
      assert.match(scenario.label, /sample|demo|fictional|muestra|demostraci[oó]n|ficticio/i);
      assert.ok(scenario.name.length > 0);
      assert.ok(scenario.alt.length > 0);
    }

    const serialized = JSON.stringify(content).toLowerCase();
    assert.doesNotMatch(serialized, /interfaz bilingüe|interfaz (?:está|esta) disponible en español e inglés|bilingual interface|interface is available in Spanish and English/i);
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
  assert.equal(landingDestinations.betaTerms, "/legal/beta-terms.html");
  assert.equal(landingDestinations.privacy, "/legal/privacy-notice.html");
  assert.equal(landingDestinations.prohibitedData, "/legal/prohibited-data.html");
  assert.equal(landingDestinations.support, "mailto:beta-support@mymoviqo.com");
});

test("landing hero and time-to-value use the reviewed bilingual copy", () => {
  assert.equal(
    landingContent.es.hero.body,
    "Moviqo ayuda a equipos pequeños a diseñar formularios y recorridos de trabajo que los equipos pueden seguir."
  );
  assert.equal(
    landingContent.en.hero.body,
    "Moviqo helps small teams design forms and work journeys that teams can follow."
  );
  assert.equal(
    landingContent.es.timeToValue,
    "Primer recorrido simple: 30–60 minutos, según la preparación."
  );
  assert.equal(
    landingContent.en.timeToValue,
    "First simple journey: 30–60 minutes, depending on preparation."
  );
});

test("landing renders the approved public-only composition with complete destinations", () => {
  const markup = renderToStaticMarkup(createElement(HomePage));

  assert.match(markup, /data-brand-mark="moviqo"/);
  assert.match(markup, /data-brand-concept="workflow"/);
  assert.match(markup, /data-product-visual="fictional-workflow"/);
  assert.match(markup, /data-workflow-illustration="connected-steps"/);
  assert.equal((markup.match(/data-fictional-case-badge="true"/g) ?? []).length, 4);
  assert.equal((markup.match(/data-scenario-detail-list="numbered"/g) ?? []).length, 4);
  assert.equal((markup.match(/data-scenario-detail-row="true"/g) ?? []).length, 14);
  assert.equal((markup.match(/data-scenario-detail-list="numbered" role="list"/g) ?? []).length, 4);
  assert.match(markup, /justify-self-start/);
  assert.match(markup, /gap-moviqo-5/);
  assert.match(markup, /text-lg font-semibold[^>]*>Primer recorrido simple:/);
  assert.match(markup, /data-footer-rights="true"[^>]*>© 2026 Moviqo\. Todos los derechos reservados\./);
  assert.match(markup, /href="\/register"/);
  assert.match(markup, /href="\/sign-in"/);
  assert.match(markup, /href="\/legal\/beta-terms\.html"/);
  assert.match(markup, /href="\/legal\/privacy-notice\.html"/);
  assert.match(markup, /href="\/legal\/prohibited-data\.html"/);
  assert.match(markup, /href="mailto:beta-support@mymoviqo\.com"/);
  assert.doesNotMatch(markup, /href="\/(?:my-work|design-system|admin)/);
  assert.doesNotMatch(markup, /landing-shell|mock-window|landing-card/);
  const footerMarkup = markup.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "";
  assert.doesNotMatch(footerMarkup, /href="\/(?:register|sign-in)"/);
  assert.doesNotMatch(markup, /aria-hidden="true">i<\/span>0[1-3]/);
  assert.match(
    markup,
    /<p(?=[^>]*data-section-label="true")(?=[^>]*class="[^"]*text-moviqo-body)[^>]*>/
  );
});

test("synthetic-only notice is compact and presents the beta boundary", () => {
  const markup = renderToStaticMarkup(createElement(EnvironmentBanner));

  assert.match(markup, /data-environment="synthetic-only"/);
  assert.match(markup, />BETA</);
  assert.match(markup, /datos reales|real data/i);
  assert.match(markup, /text-moviqo-body/);
  assert.match(markup, /border-b-2/);
  assert.doesNotMatch(markup, /<ul/);
});

test("public legal documents use the shared static Moviqo presentation", () => {
  const legalFiles = ["beta-terms", "privacy-notice", "prohibited-data"];
  const stylesheet = readFileSync("public/legal/legal.css", "utf8");

  assert.match(stylesheet, /--moviqo-primary:/);
  assert.match(stylesheet, /\.legal-shell/);
  assert.match(stylesheet, /:focus-visible/);
  assert.match(stylesheet, /@media/);

  for (const legalFile of legalFiles) {
    const document = readFileSync(`public/legal/${legalFile}.html`, "utf8");

    assert.match(document, /href="\/legal\/legal\.css"/);
    assert.match(document, /class="legal-shell"/);
    assert.match(document, /class="environment-notice"/);
    assert.match(document, />! BETA</);
    assert.doesNotMatch(document, />! UAT</);
    assert.match(document, /src="\/moviqo-mark\.svg"/);
    assert.match(document, /class="brand-wordmark"/);
    assert.match(document, /href="\/"/);
    assert.match(document, /Moviqo/);
    assert.match(document, /beta-support@mymoviqo\.com/);
    assert.doesNotMatch(document, /beta-support@moviqo\.internal/);
  }
});

test("landing entry documents inline the critical light shell before JavaScript", () => {
  for (const entryPath of ["index.html", "es/index.html", "en/index.html"]) {
    const document = readFileSync(entryPath, "utf8");
    const styleIndex = document.indexOf("data-moviqo-critical-shell");
    const scriptIndex = document.indexOf("<script type=\"module\"");
    assert.ok(styleIndex > 0 && styleIndex < scriptIndex, `${entryPath} critical shell order`);
    assert.match(document, /html, body, #root[^}]+background: #f8fafc/);
    assert.match(document, /body \{ min-height: 100vh; margin: 0; color: #0f172a; \}/);
    assert.doesNotMatch(document, /(?:button|a|input|select).*outline:\s*0/i);
  }
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
  assert.equal(configuredDestination("mailto:beta-support@mymoviqo.com", "", { kind: "support", origin }), "mailto:beta-support@mymoviqo.com");
});
