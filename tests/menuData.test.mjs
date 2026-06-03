import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const menu = JSON.parse(readFileSync(new URL("../public/data/menu.json", import.meta.url), "utf8"));

test("business lunch data follows the official constructor PDF, not named lunch sets", () => {
  const businessLunchItems = menu.filter((item) => item.category === "Деловые обеды");
  const legacyNamedLunches = menu.filter((item) =>
    /Ланч "(Приморский|Камский|Керченский|Балтийский|Булгарский|Алатский|Донской|Таманский|Казбекский|Мясной)"/.test(item.title)
  );

  assert.equal(legacyNamedLunches.length, 0);
  assert.equal(businessLunchItems.length, 8);
  assert.ok(
    businessLunchItems.some((item) =>
      item.title === "Деловые обеды: правила и цены" &&
      item.description.includes("Выберите по одному блюду из каждого раздела")
    )
  );
});
