import { versions } from "node:process";
import assert from "node:assert/strict";

assert.equal(
  versions.node,
  "26.5.1",
  `Expected Node.js 26.5.1, received ${versions.node}`
);
