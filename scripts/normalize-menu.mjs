import { readFileSync, writeFileSync } from "node:fs";
import { normalizeMenuItem } from "../src/dataRules.js";

const path = new URL("../public/data/menu.json", import.meta.url);
const menu = JSON.parse(readFileSync(path, "utf8"));
const normalized = menu.map(normalizeMenuItem);

writeFileSync(path, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
console.log(`Normalized ${normalized.length} menu items`);
