import test from "node:test";
import assert from "node:assert/strict";

import { getGuestMarkers, getStudyHint, normalizeMenuItem } from "../src/dataRules.js";

test("guest markers include lactose and gluten as guest-facing restrictions", () => {
  const item = {
    category: "Выпечка",
    title: "Хачапури",
    description: "Выпечка с сыром сулугуни, яйцом и пшеничным тестом."
  };
  assert.deepEqual(getGuestMarkers(item), ["молочное / лактоза", "глютен", "яйцо"]);
});

test("guest markers separate fish and seafood", () => {
  const item = {
    category: "Горячие блюда",
    title: "Паста с вонголе",
    description: "Лингвини с моллюсками вонголе, чесноком и соусом из белого вина."
  };
  assert.deepEqual(getGuestMarkers(item), ["морепродукты", "глютен", "алкоголь в составе"]);
});

test("study hint uses category type and dish title without fragile grammar fragments", () => {
  const item = {
    category: "Горячие блюда",
    title: "Оджахури",
    description: "Каре ягнёнка с печёным картофелем, томатами и грузинскими специями. Подаётся горячим."
  };
  assert.equal(
    getStudyHint(item),
    "горячее блюдо."
  );
});

test("study hint is a short type label and never uses ellipsis", () => {
  const item = {
    category: "Холодные закуски и салаты",
    title: "Восточный боул",
    description:
      "С цыплёнком, жареными пхали, овощами, морковью по-корейски, красной капустой, хумусом, лепёшкой роти и соусом сметанный айоли."
  };
  const hint = getStudyHint(item);
  assert.ok(hint.length < item.description.length);
  assert.equal(hint, "салат или холодная закуска.");
  assert.doesNotMatch(hint, /\.\.\./);
});

test("normalizeMenuItem replaces old markers and remember fields", () => {
  const item = {
    category: "Гарниры и соусы",
    title: "Сметана",
    description: "Состав на сайте не указан.",
    remember: "Сметана",
    markers: ["молочное/сыр"]
  };
  assert.deepEqual(normalizeMenuItem(item), {
    category: "Гарниры и соусы",
    title: "Сметана",
    description: "Состав на сайте не указан.",
    remember: "гарнир или соус: состав на сайте не указан.",
    markers: ["молочное / лактоза"]
  });
});

test("guest markers cover common hidden lactose and gluten signals", () => {
  assert.deepEqual(
    getGuestMarkers({
      category: "Горячие блюда",
      title: "Стейк-салат",
      description: "Слайсы говядины с овощами и соусом дзадзики."
    }),
    ["мясо", "молочное / лактоза"]
  );
  assert.deepEqual(
    getGuestMarkers({
      category: "Супы",
      title: "Борщ с говядиной",
      description: "Борщ с говядиной, сметаной и ржаными гренками."
    }),
    ["мясо", "молочное / лактоза", "глютен"]
  );
  assert.deepEqual(
    getGuestMarkers({
      category: "Холодные закуски и салаты",
      title: "Рыбное ассорти",
      description: "Лосось, форель и хрустящий багет."
    }),
    ["рыба", "глютен"]
  );
});

test("guest markers cover dessert and sauce allergen signals", () => {
  assert.deepEqual(
    getGuestMarkers({
      category: "Десерты",
      title: "Цитрусовый тарт",
      description: "Песочная основа, крем и меренга с сезонными фруктами."
    }),
    ["молочное / лактоза", "глютен", "яйцо"]
  );
  assert.deepEqual(
    getGuestMarkers({
      category: "Десерты",
      title: "Чизкейк топлёное молоко",
      description: "Чизкейк с фундучным пралине и вафельной крошкой."
    }),
    ["молочное / лактоза", "глютен", "орехи"]
  );
  assert.deepEqual(
    getGuestMarkers({
      category: "Гарниры и соусы",
      title: "Майонез",
      description: "Соус на яичных желтках."
    }),
    ["яйцо"]
  );
});

test("guest markers cover meat aliases without false fish grouping", () => {
  assert.deepEqual(
    getGuestMarkers({
      category: "Шашлыки и блюда на мангале",
      title: "Люля-кебаб",
      description: "Бараний и говяжий фарш с луком."
    }),
    ["мясо"]
  );
  assert.deepEqual(
    getGuestMarkers({
      category: "Холодные закуски и салаты",
      title: "Нисуаз",
      description: "Салат с тунцом, томатами и яйцом."
    }),
    ["рыба", "яйцо"]
  );
});
