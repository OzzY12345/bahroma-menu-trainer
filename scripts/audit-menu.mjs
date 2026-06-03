import { readFileSync } from "node:fs";

const menu = JSON.parse(readFileSync(new URL("../public/data/menu.json", import.meta.url), "utf8"));
const markerCounts = new Map();
let duplicateHints = 0;
let missingGuestMarkers = 0;

for (const item of menu) {
  for (const marker of item.markers || []) markerCounts.set(marker, (markerCounts.get(marker) || 0) + 1);
  const description = (item.description || "").toLowerCase().replace(/\s+/g, " ").trim();
  const hint = (item.remember || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (hint && description && hint === description) duplicateHints += 1;
  if (!item.markers?.length && !/состав на сайте не указан/i.test(item.description || "")) missingGuestMarkers += 1;
}

console.log(`items: ${menu.length}`);
console.log(`duplicateHints: ${duplicateHints}`);
console.log(`itemsWithoutGuestMarkers: ${missingGuestMarkers}`);
console.log("markerCounts:");
for (const [marker, count] of [...markerCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`- ${marker}: ${count}`);
}
