import assert from "node:assert/strict";
import { test } from "node:test";
import { landingContent, landingDestinations } from "../../src/pages/home/model/landingContent";

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

test("landing destinations use safe same-origin fallbacks", () => {
  assert.equal(landingDestinations.register, "/register");
  assert.equal(landingDestinations.signIn, "/sign-in");
  assert.equal(landingDestinations.betaTerms, "");
  assert.equal(landingDestinations.privacy, "");
  assert.equal(landingDestinations.prohibitedData, "");
  assert.equal(landingDestinations.support, "");
});
