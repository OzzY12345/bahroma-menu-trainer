import test from "node:test";
import assert from "node:assert/strict";

import { getServerConfig } from "../src/serverConfig.js";
import { getAssetUrl } from "../src/appPaths.js";

test("server listens on all local interfaces by default for phone access", () => {
  assert.deepEqual(getServerConfig({}), { host: "0.0.0.0", port: 4173 });
});

test("server host and port can be overridden with env", () => {
  assert.deepEqual(getServerConfig({ HOST: "127.0.0.1", PORT: "5000" }), {
    host: "127.0.0.1",
    port: 5000
  });
});

test("getAssetUrl resolves assets under the current app subpath", () => {
  assert.equal(
    getAssetUrl("http://127.0.0.1:4173/src/app.js", "../public/data/menu.json"),
    "http://127.0.0.1:4173/public/data/menu.json"
  );
  assert.equal(
    getAssetUrl("https://alterega.ru/other/bahroma/src/app.js", "../public/data/menu.json"),
    "https://alterega.ru/other/bahroma/public/data/menu.json"
  );
});
