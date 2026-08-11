import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DesignSystemPage } from "../../src/pages/design-system/ui/DesignSystemPage";
import {
  catalogComponents,
  catalogPreviewCompositions,
  catalogPreviewStates,
  colorTokens,
  contrastRatio,
  radiusTokens,
  targetSizeTokens,
  tokenContrastPairs
} from "../../src/shared/design-system";
import { translate } from "../../src/shared/localization";

const readFrontendFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("the pinned Tailwind Vite foundation exposes the approved Moviqo theme", () => {
  const packageJson = JSON.parse(readFrontendFile("package.json")) as {
    devDependencies: Record<string, string>;
  };
  const viteConfig = readFrontendFile("vite.config.ts");
  const styles = readFrontendFile("src/app/styles.css");

  assert.equal(packageJson.devDependencies.tailwindcss, "4.3.3");
  assert.equal(packageJson.devDependencies["@tailwindcss/vite"], "4.3.3");
  assert.match(viteConfig, /import tailwindcss from "@tailwindcss\/vite"/);
  assert.match(viteConfig, /plugins:\s*\[tailwindcss\(\), react\(\)\]/);
  assert.match(styles, /@import "tailwindcss"/);
  assert.match(styles, /@theme\s*{/);
  assert.match(styles, /--color-moviqo-primary:\s*#0F766E/);
  assert.match(styles, /--breakpoint-desktop:\s*80rem/);
});

test("candidate color tokens match the visual-direction contract", () => {
  assert.deepEqual(colorTokens, {
    surfaceBase: "#F8FAFC",
    surfaceRaised: "#FFFFFF",
    surfaceSoft: "#F1F5F9",
    inkPrimary: "#0F172A",
    inkSecondary: "#475569",
    inkDisabled: "#94A3B8",
    primary: "#0F766E",
    primaryHover: "#115E59",
    primaryForeground: "#FFFFFF",
    accent: "#2563EB",
    border: "#CBD5E1",
    controlBorder: "#64748B",
    focus: "#2563EB",
    warning: "#B45309",
    error: "#B91C1C",
    success: "#15803D"
  });
});

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

test("visual checkpoint inventory covers representative compositions and states", () => {
  const markup = renderToStaticMarkup(createElement(DesignSystemPage));

  for (const composition of catalogPreviewCompositions) {
    assert.match(markup, new RegExp(`data-catalog-composition="${composition}"`));
  }

  for (const state of catalogPreviewStates) {
    assert.match(markup, new RegExp(`data-catalog-state="[^"]*\\b${state}\\b[^"]*"`));
  }
});
