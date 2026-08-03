import { versions } from "node:process";
import assert from "node:assert/strict";

assert.equal(
  versions.node,
  "24.18.0",
  `Expected Node.js 24.18.0 LTS, received ${versions.node}`
);
