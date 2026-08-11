import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PasswordField } from "../../src/shared/ui/PasswordField";

const findElementByType = (
  node: unknown,
  matcher: (element: { type: unknown; props: { children?: unknown; onClick?: unknown } }) => boolean
): { type: unknown; props: { children?: unknown; onClick?: unknown } } | null => {
  if (
    node == null ||
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "boolean" ||
    typeof node === "bigint"
  ) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementByType(child, matcher);
      if (match) {
        return match;
      }
    }
    return null;
  }

  if (typeof node === "object" && "type" in node && "props" in node) {
    const element = node as {
      type: unknown;
      props: { children?: unknown; onClick?: unknown };
    };

    if (matcher(element)) {
      return element;
    }

    return findElementByType(element.props.children, matcher);
  }

  return null;
};

test("password field exposes an accessible pressed state and paste-friendly defaults", () => {
  const onRevealToggle = () => undefined;
  const hiddenElement = PasswordField({
    id: "password",
    name: "password",
    label: "Password",
    helperText: "Use 15 to 128 characters. Avoid common or compromised passwords.",
    revealLabel: "Show password",
    hideLabel: "Hide password",
    isRevealed: false,
    onRevealToggle
  });
  const hiddenMarkup = renderToStaticMarkup(
    hiddenElement
  );
  const revealedMarkup = renderToStaticMarkup(
    PasswordField({
      id: "password",
      name: "password",
      label: "Password",
      helperText: "Use 15 to 128 characters. Avoid common or compromised passwords.",
      revealLabel: "Show password",
      hideLabel: "Hide password",
      isRevealed: true,
      onRevealToggle
    })
  );

  assert.match(hiddenMarkup, /type="password"/);
  assert.match(hiddenMarkup, /autoComplete="new-password"/);
  assert.match(hiddenMarkup, /aria-pressed="false"/);
  assert.match(hiddenMarkup, /aria-label="Show password"/);
  assert.match(hiddenMarkup, /<svg/);
  assert.doesNotMatch(hiddenMarkup, />Show password<\/button>/);
  assert.doesNotMatch(hiddenMarkup, /pattern=/);
  assert.doesNotMatch(hiddenMarkup, /minlength=/);
  assert.doesNotMatch(hiddenMarkup, /maxlength=/);
  assert.match(revealedMarkup, /type="text"/);
  assert.match(revealedMarkup, /aria-pressed="true"/);
  assert.match(revealedMarkup, /aria-label="Hide password"/);

  const buttonElement = findElementByType(
    hiddenElement,
    (element) => element.type === "button"
  );
  assert.ok(buttonElement);
  assert.equal(buttonElement.props.onClick, onRevealToggle);
});
