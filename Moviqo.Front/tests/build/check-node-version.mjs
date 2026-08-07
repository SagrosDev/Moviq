import { versions } from "node:process";
import assert from "node:assert/strict";

assert.equal(
  versions.node,
  "26.7.0",
  `Expected Node.js 26.7.0, received ${versions.node}`
);
