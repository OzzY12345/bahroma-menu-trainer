import test from "node:test";
import assert from "node:assert/strict";

import { getServerConfig } from "../src/serverConfig.js";

test("server listens on all local interfaces by default for phone access", () => {
  assert.deepEqual(getServerConfig({}), { host: "0.0.0.0", port: 4173 });
});

test("server host and port can be overridden with env", () => {
  assert.deepEqual(getServerConfig({ HOST: "127.0.0.1", PORT: "5000" }), {
    host: "127.0.0.1",
    port: 5000
  });
});
