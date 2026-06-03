import { readFileSync, writeFileSync } from "node:fs";
import { normalizeMenuItem } from "../src/dataRules.js";

const path = new URL("../public/data/menu.json", import.meta.url);
const menu = JSON.parse(readFileSync(path, "utf8"));

const lunches = [
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Приморский\"",
    description: "Котлета из лосося с рисом. Салат с кальмарами, кукурузой и арахисом кимчи."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Камский\"",
    description: "Азу по-татарски из говядины. Оливье с цыплёнком."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Керченский\"",
    description: "Люля-кебаб из цыплёнка с жареной брокколи. Оливье с цыплёнком."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Балтийский\"",
    description: "Норвежский суп с треской и томатами. Котлета из лосося и мятый картофель с укропом."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Булгарский\"",
    description: "Грибной крем-суп. Азу по-татарски из говядины. Витаминный салат."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Алатский\"",
    description: "Грибной крем-суп. Плов по-бухарски с цыплёнком. Витаминный салат."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Донской\"",
    description: "Борщ с цыплёнком. Люля-кебаб из цыплёнка и мятый картофель с укропом. Витаминный салат."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Таманский\"",
    description: "Борщ с цыплёнком. Люля-кебаб из цыплёнка с рисом. Оливье с цыплёнком."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Казбекский\"",
    description: "Грибной крем-суп. Чакапули с цыплёнком и картофелем. Витаминный салат."
  },
  {
    category: "Бизнес-ланчи",
    title: "Ланч \"Мясной\"",
    description: "Борщ с цыплёнком. Плов по-бухарски с цыплёнком."
  }
].map(normalizeMenuItem);

const lunchIds = new Set(lunches.map((item) => `${item.category}::${item.title}`));
const brokenLunchCategory = "\u003f\u003f\u003f\u003f\u003f\u003f-\u003f\u003f\u003f\u003f\u003f";
const rest = menu.filter((item) => item.category !== brokenLunchCategory && !lunchIds.has(`${item.category}::${item.title}`));

writeFileSync(path, `${JSON.stringify([...lunches, ...rest], null, 2)}\n`, "utf8");
console.log(`Upserted ${lunches.length} business lunches`);
