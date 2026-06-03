import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCategoryPlan,
  clampStudyDay,
  getDueItems,
  getExamItems,
  getItemId,
  getNextReviewDay,
  getStudyPhase,
  updateProgress
} from "../src/learning.js";

const categories = [
  "Сезонное меню",
  "Супы",
  "Холодные закуски и салаты",
  "Горячие закуски",
  "Выпечка",
  "Хинкали",
  "Горячие блюда",
  "Шашлыки и блюда на мангале",
  "Десерты",
  "Гарниры и соусы",
  "Напитки",
  "Праздничные боксы"
];

test("clampStudyDay keeps study day inside the 14-day program", () => {
  assert.equal(clampStudyDay(-4), 1);
  assert.equal(clampStudyDay(1), 1);
  assert.equal(clampStudyDay(9), 9);
  assert.equal(clampStudyDay(99), 14);
});

test("getStudyPhase returns the right learning phase", () => {
  assert.equal(getStudyPhase(1).type, "map");
  assert.equal(getStudyPhase(4).type, "focus");
  assert.equal(getStudyPhase(10).type, "mix");
  assert.equal(getStudyPhase(13).type, "shift");
});

test("buildCategoryPlan spreads categories across focus days", () => {
  const plan = buildCategoryPlan(categories);
  assert.deepEqual(plan[3], ["Сезонное меню", "Супы"]);
  assert.deepEqual(plan[4], ["Холодные закуски и салаты", "Горячие закуски"]);
  assert.deepEqual(plan[8], ["Напитки", "Праздничные боксы"]);
});

test("updateProgress moves items through review intervals", () => {
  const item = { category: "Супы", title: "Харчо", description: "Суп с говядиной" };
  const id = getItemId(item);
  let progress = {};

  progress = updateProgress(progress, item, "know", 3);
  assert.equal(progress[id].level, 2);
  assert.equal(progress[id].nextReviewDay, 6);

  progress = updateProgress(progress, item, "almost", 6);
  assert.equal(progress[id].level, 1);
  assert.equal(progress[id].nextReviewDay, 8);

  progress = updateProgress(progress, item, "miss", 8);
  assert.equal(progress[id].level, 0);
  assert.equal(progress[id].mistakes, 1);
  assert.equal(progress[id].nextReviewDay, 9);
});

test("getNextReviewDay uses short intervals for weak answers", () => {
  assert.equal(getNextReviewDay("miss", 5), 6);
  assert.equal(getNextReviewDay("almost", 5), 7);
  assert.equal(getNextReviewDay("know", 5), 8);
});

test("getDueItems returns daily focus plus due reviews without duplicates", () => {
  const menu = [
    { category: "Супы", title: "Харчо", description: "Суп" },
    { category: "Выпечка", title: "Хачапури", description: "Выпечка" },
    { category: "Десерты", title: "Медовик", description: "Десерт" }
  ];
  const oldId = getItemId(menu[2]);
  const progress = { [oldId]: { nextReviewDay: 4, level: 0, mistakes: 2 } };
  const due = getDueItems(menu, ["Супы", "Выпечка"], progress, 4);

  assert.equal(due.length, 3);
  assert.equal(new Set(due.map(getItemId)).size, 3);
});

test("getExamItems prioritizes mistakes and fills the rest with random menu items", () => {
  const menu = [
    { category: "Супы", title: "Харчо", description: "Суп" },
    { category: "Выпечка", title: "Хачапури", description: "Выпечка" },
    { category: "Десерты", title: "Медовик", description: "Десерт" },
    { category: "Горячие блюда", title: "Плов", description: "Горячее блюдо" }
  ];
  const mistakeId = getItemId(menu[2]);
  const progress = { [mistakeId]: { mistakes: 3, level: 0 } };
  const exam = getExamItems(menu, progress, 3);

  assert.equal(exam.length, 3);
  assert.equal(exam[0].title, "Медовик");
  assert.equal(new Set(exam.map(getItemId)).size, 3);
});
