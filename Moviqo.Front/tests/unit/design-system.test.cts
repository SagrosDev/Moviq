import assert from "node:assert/strict";
import { test } from "node:test";
import {
  catalogComponents,
  contrastRatio,
  radiusTokens,
  targetSizeTokens,
  tokenContrastPairs
} from "../../src/shared/design-system";
import { translate } from "../../src/shared/localization";

test("approved token contrast pairs meet the required ratios", () => {
  for (const pair of tokenContrastPairs) {
    assert.ok(
      contrastRatio(pair.foreground, pair.background) >= pair.ratio,
      `${pair.name} expected ${pair.ratio}:1 contrast`
    );
  }
});

test("practical target size and approved radii are represented deterministically", () => {
  assert.equal(targetSizeTokens.practicalMinimum, 44);
  assert.equal(radiusTokens.field, 6);
  assert.equal(radiusTokens.control, 10);
  assert.equal(radiusTokens.guidance, 16);
});

test("component catalog records responsive behavior and authorization-safe content", () => {
  assert.equal(catalogComponents.length, 9);

  for (const component of catalogComponents) {
    assert.match(translate("es", component.responsiveBehaviorKey), /\w/);
    assert.match(translate("en", component.permittedContentKey), /\w/);
    assert.doesNotMatch(translate("en", component.permittedContentKey), /private field|process data preview/i);
  }
});
