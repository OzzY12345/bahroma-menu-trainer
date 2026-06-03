export const PROGRAM_LENGTH_DAYS = 14;

export function clampStudyDay(day) {
  const numeric = Number.isFinite(Number(day)) ? Number(day) : 1;
  return Math.min(PROGRAM_LENGTH_DAYS, Math.max(1, Math.floor(numeric)));
}

export function getStudyPhase(dayInput) {
  const day = clampStudyDay(dayInput);
  if (day <= 2) {
    return {
      type: "map",
      title: "Карта меню",
      target: "Понять структуру меню и отметить незнакомые блюда."
    };
  }
  if (day <= 8) {
    return {
      type: "focus",
      title: "Углубление по категориям",
      target: "Учить новые категории и повторять вчерашние ошибки."
    };
  }
  if (day <= 11) {
    return {
      type: "mix",
      title: "Перемешанная проверка",
      target: "Убрать зависимость от порядка документа."
    };
  }
  return {
    type: "shift",
    title: "Режим смены",
    target: "Давать быстрые ответы гостю за 10-15 секунд."
  };
}

export function buildCategoryPlan(categories) {
  const plan = {};
  const focusDays = [3, 4, 5, 6, 7, 8];
  focusDays.forEach((day, index) => {
    plan[day] = categories.slice(index * 2, index * 2 + 2);
  });
  return plan;
}

export function getItemId(item) {
  return `${item.category}::${item.title}`;
}

export function getNextReviewDay(answer, currentDay) {
  const day = clampStudyDay(currentDay);
  if (answer === "know") return clampStudyDay(day + 3);
  if (answer === "almost") return clampStudyDay(day + 2);
  return clampStudyDay(day + 1);
}

export function updateProgress(progress, item, answer, currentDay) {
  const id = getItemId(item);
  const previous = progress[id] || {};
  const next = {
    ...previous,
    level: answer === "know" ? 2 : answer === "almost" ? 1 : 0,
    mistakes: answer === "miss" ? (previous.mistakes || 0) + 1 : previous.mistakes || 0,
    attempts: (previous.attempts || 0) + 1,
    lastAnswer: answer,
    lastReviewedDay: clampStudyDay(currentDay),
    nextReviewDay: getNextReviewDay(answer, currentDay),
    updatedAt: new Date().toISOString()
  };
  return { ...progress, [id]: next };
}

export function getCategories(menu) {
  return [...new Set(menu.map((item) => item.category))];
}

export function getProgressStats(menu, progress) {
  const stats = { total: menu.length, know: 0, almost: 0, miss: 0, untouched: 0 };
  menu.forEach((item) => {
    const entry = progress[getItemId(item)];
    if (!entry) {
      stats.untouched += 1;
    } else if (entry.level === 2) {
      stats.know += 1;
    } else if (entry.level === 1) {
      stats.almost += 1;
    } else {
      stats.miss += 1;
    }
  });
  return stats;
}

export function getDueItems(menu, focusCategories, progress, currentDay) {
  const day = clampStudyDay(currentDay);
  const byId = new Map();
  menu
    .filter((item) => focusCategories.includes(item.category))
    .forEach((item) => byId.set(getItemId(item), item));
  menu
    .filter((item) => {
      const entry = progress[getItemId(item)];
      return entry && entry.nextReviewDay <= day && entry.level < 2;
    })
    .forEach((item) => byId.set(getItemId(item), item));
  return [...byId.values()];
}

export function getMistakeItems(menu, progress) {
  return menu
    .filter((item) => (progress[getItemId(item)]?.mistakes || 0) > 0)
    .sort((a, b) => {
      const left = progress[getItemId(a)]?.mistakes || 0;
      const right = progress[getItemId(b)]?.mistakes || 0;
      return right - left;
    });
}

export function pickRandomItems(items, count) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export function getExamItems(menu, progress, count = 50) {
  const mistakes = getMistakeItems(menu, progress);
  const selected = new Map();
  mistakes.slice(0, Math.min(20, count)).forEach((item) => selected.set(getItemId(item), item));
  pickRandomItems(menu, count).forEach((item) => {
    if (selected.size < count) selected.set(getItemId(item), item);
  });
  if (selected.size < count) {
    menu.forEach((item) => {
      if (selected.size < count) selected.set(getItemId(item), item);
    });
  }
  return [...selected.values()];
}

export function getDailyPlan(menu, progress, currentDay) {
  const day = clampStudyDay(currentDay);
  const categories = getCategories(menu);
  const categoryPlan = buildCategoryPlan(categories);
  const phase = getStudyPhase(day);
  const focusCategories = categoryPlan[day] || [];
  const mistakeItems = getMistakeItems(menu, progress);

  if (phase.type === "map") {
    return {
      day,
      phase,
      focusCategories: categories,
      items: pickRandomItems(menu, 24),
      checklist: [
        "Пройти все категории без зубрежки.",
        "Отметить незнакомые названия и похожие блюда.",
        "Разделить блюда на: знаю, примерно, не знаю."
      ]
    };
  }

  if (phase.type === "focus") {
    return {
      day,
      phase,
      focusCategories,
      items: getDueItems(menu, focusCategories, progress, day),
      checklist: [
        "10 минут повторить старые ошибки.",
        "30-40 минут учить новые категории вслух.",
        "10 минут проверить себя без подсказок."
      ]
    };
  }

  if (phase.type === "mix") {
    return {
      day,
      phase,
      focusCategories: categories,
      items: [...mistakeItems.slice(0, 20), ...pickRandomItems(menu, 30)],
      checklist: [
        "Название -> состав.",
        "Состав -> название.",
        "Ситуации гостя: мясное, без рыбы, неострое, без молочного."
      ]
    };
  }

  return {
    day,
    phase,
    focusCategories: categories,
    items: [...mistakeItems.slice(0, 20), ...pickRandomItems(menu, 50)],
    checklist: [
      "Отвечать за 10-15 секунд.",
      "Не читать дословно, объяснять человеческим языком.",
      "Сравнить похожие блюда парами."
    ]
  };
}
