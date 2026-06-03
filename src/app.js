import {
  PROGRAM_LENGTH_DAYS,
  buildCategoryPlan,
  clampStudyDay,
  getCategories,
  getDailyPlan,
  getItemId,
  getMistakeItems,
  getProgressStats,
  pickRandomItems,
  updateProgress
} from "./learning.js";

const STORAGE_KEY = "bahroma-menu-trainer";
const app = document.querySelector("#app");

const state = {
  menu: [],
  progress: {},
  settings: {
    startDate: todayKey()
  },
  tab: "today",
  cardMode: "title",
  cardScope: "today",
  answerVisible: false,
  deck: [],
  cardIndex: 0,
  query: "",
  selectedCategory: "Все"
};

init();

async function init() {
  const saved = readStore();
  Object.assign(state.progress, saved.progress || {});
  Object.assign(state.settings, saved.settings || {});
  state.menu = await fetch("/public/data/menu.json").then((response) => response.json());
  state.deck = buildDeck();
  render();
  registerServiceWorker();
}

function render() {
  const stats = getProgressStats(state.menu, state.progress);
  const day = getCurrentStudyDay();
  const dailyPlan = getDailyPlan(state.menu, state.progress, day);
  const categories = getCategories(state.menu);

  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">BAHROMA</p>
        <h1>Тренажер меню</h1>
      </div>
      <div class="day-pill">День ${day}/${PROGRAM_LENGTH_DAYS}</div>
    </header>

    <section class="progress-grid" aria-label="Прогресс">
      ${metric("Знаю", stats.know, stats.total)}
      ${metric("Почти", stats.almost, stats.total)}
      ${metric("Ошибки", stats.miss, stats.total)}
      ${metric("Не трогал", stats.untouched, stats.total)}
    </section>

    <nav class="tabs" aria-label="Разделы">
      ${tabButton("today", "Сегодня")}
      ${tabButton("cards", "Карточки")}
      ${tabButton("mistakes", "Ошибки")}
      ${tabButton("scenarios", "Гость")}
    </nav>

    <main>
      ${state.tab === "today" ? renderToday(dailyPlan, categories) : ""}
      ${state.tab === "cards" ? renderCards(dailyPlan, categories) : ""}
      ${state.tab === "mistakes" ? renderMistakes() : ""}
      ${state.tab === "scenarios" ? renderScenarios() : ""}
    </main>
  `;

  bindEvents();
}

function metric(label, value, total) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return `
    <div class="metric">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${percent}%</small>
    </div>
  `;
}

function tabButton(id, label) {
  return `<button class="tab ${state.tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`;
}

function renderToday(plan, categories) {
  const focus = plan.focusCategories.length ? plan.focusCategories.join(", ") : "все категории";
  return `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">План дня</p>
          <h2>${escapeHtml(plan.phase.title)}</h2>
        </div>
        <div class="head-actions">
          <button class="ghost-btn" data-action="reset-day">Сбросить день</button>
          <button class="ghost-btn" data-action="reset-progress">Сбросить прогресс</button>
        </div>
      </div>
      <p class="lead">${escapeHtml(plan.phase.target)}</p>
      <div class="focus-box">
        <span>Фокус</span>
        <strong>${escapeHtml(focus)}</strong>
      </div>
      <ul class="checklist">
        ${plan.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
      <div class="day-controls">
        <button class="icon-btn" data-action="prev-day" aria-label="Предыдущий день">‹</button>
        <label class="day-field">
          <span>День программы</span>
          <input class="day-input" type="number" min="1" max="14" value="${getCurrentStudyDay()}" data-action="set-day" />
          <small>из 14</small>
        </label>
        <button class="icon-btn" data-action="next-day" aria-label="Следующий день">›</button>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Сегодня учить</p>
          <h2>${plan.items.length} карточек</h2>
        </div>
        <button class="primary-btn" data-tab="cards">Начать</button>
      </div>
      <div class="category-grid">
        ${categories.map((category) => categoryChip(category, plan.focusCategories.includes(category))).join("")}
      </div>
    </section>
  `;
}

function categoryChip(category, active) {
  return `<button class="category-chip ${active ? "active" : ""}" data-category="${escapeAttr(category)}">${escapeHtml(category)}</button>`;
}

function renderCards(dailyPlan, categories) {
  if (!state.deck.length) state.deck = buildDeck();
  const item = state.deck[state.cardIndex] || state.deck[0];
  return `
    <section class="toolbar panel">
      <div class="segmented" aria-label="Режим карточек">
        ${modeButton("title", "Название")}
        ${modeButton("composition", "Состав")}
      </div>
      <div class="segmented" aria-label="Область карточек">
        ${scopeButton("today", "Сегодня")}
        ${scopeButton("all", "Все")}
        ${scopeButton("errors", "Ошибки")}
      </div>
      <label class="search">
        <span>Поиск</span>
        <input type="search" placeholder="Блюдо или состав" value="${escapeAttr(state.query)}" data-action="search" />
      </label>
      <select class="category-select" data-action="category">
        <option ${state.selectedCategory === "Все" ? "selected" : ""}>Все</option>
        ${categories.map((category) => `<option ${state.selectedCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
      </select>
    </section>

    <section class="card-area">
      ${item ? renderStudyCard(item) : emptyState("Нет карточек для этого фильтра.")}
    </section>

    <section class="deck-footer">
      <button class="ghost-btn" data-action="prev-card">Назад</button>
      <span>${state.deck.length ? state.cardIndex + 1 : 0} / ${state.deck.length}</span>
      <button class="ghost-btn" data-action="next-card">Дальше</button>
    </section>
  `;
}

function modeButton(id, label) {
  return `<button class="${state.cardMode === id ? "active" : ""}" data-mode="${id}">${label}</button>`;
}

function scopeButton(id, label) {
  return `<button class="${state.cardScope === id ? "active" : ""}" data-scope="${id}">${label}</button>`;
}

function renderStudyCard(item) {
  const prompt = state.cardMode === "title" ? item.title : item.description;
  const answer = state.cardMode === "title" ? renderAnswer(item) : `<h3>${escapeHtml(item.title)}</h3>${renderAnswer(item, false)}`;
  const progress = state.progress[getItemId(item)];
  const status = progress ? ["Не знаю", "Почти", "Знаю"][progress.level] : "Новое";

  return `
    <article class="study-card">
      <div class="card-meta">
        <span>${escapeHtml(item.category)}</span>
        <span>${status}</span>
      </div>
      <div class="prompt">${escapeHtml(prompt)}</div>
      <button class="show-answer" data-action="toggle-answer">${state.answerVisible ? "Скрыть ответ" : "Показать ответ"}</button>
      <div class="answer ${state.answerVisible ? "visible" : ""}">
        ${state.answerVisible ? answer : ""}
      </div>
      <div class="rating">
        <button class="miss" data-answer="miss">Не знаю</button>
        <button class="almost" data-answer="almost">Почти</button>
        <button class="know" data-answer="know">Знаю</button>
      </div>
    </article>
  `;
}

function renderAnswer(item, includeTitle = true) {
  return `
    ${includeTitle ? `<h3>${escapeHtml(item.title)}</h3>` : ""}
    <p><b>Состав:</b> ${escapeHtml(item.description)}</p>
    <p><b>Запомнить:</b> ${escapeHtml(item.remember)}</p>
    ${item.markers?.length ? `<p class="markers"><b>Содержит:</b> ${item.markers.map(escapeHtml).join(", ")}</p>` : ""}
  `;
}

function renderMistakes() {
  const mistakes = getMistakeItems(state.menu, state.progress);
  return `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Список ошибок</p>
          <h2>${mistakes.length} блюд</h2>
        </div>
        <button class="ghost-btn" data-action="clear-errors">Очистить</button>
      </div>
      ${mistakes.length ? `<div class="list">${mistakes.map(renderListItem).join("")}</div>` : emptyState("Ошибок пока нет.")}
    </section>
  `;
}

function renderListItem(item) {
  const progress = state.progress[getItemId(item)];
  return `
    <article class="list-item">
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.remember)}</p>
        ${item.markers?.length ? `<small>${item.markers.map(escapeHtml).join(", ")}</small>` : ""}
      </div>
      <strong>${progress?.mistakes || 0}</strong>
    </article>
  `;
}

function renderScenarios() {
  const scenarios = [
    { label: "Гость хочет мясное", marker: "мясо" },
    { label: "Гость не ест рыбу", marker: "рыба/морепродукты", inverted: true },
    { label: "Гость хочет сырное", marker: "молочное/сыр" },
    { label: "Гость просит неострое", marker: "острое", inverted: true }
  ];
  return `
    <section class="panel">
      <p class="eyebrow">Тренировка официанта</p>
      <h2>Сценарии гостя</h2>
      <div class="scenario-grid">
        ${scenarios.map(renderScenario).join("")}
      </div>
    </section>
  `;
}

function renderScenario(scenario) {
  const items = state.menu.filter((item) => {
    const hasMarker = item.markers?.includes(scenario.marker);
    return scenario.inverted ? !hasMarker : hasMarker;
  });
  const sample = pickRandomItems(items, 5);
  return `
    <article class="scenario">
      <h3>${escapeHtml(scenario.label)}</h3>
      <p>${scenario.inverted ? "Проверь и объясни, почему эти варианты безопаснее." : "Назови состав и предложи 2-3 варианта."}</p>
      <ol>
        ${sample.map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}
      </ol>
    </article>
  `;
}

function emptyState(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      if (state.tab === "cards") resetDeck();
      render();
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cardMode = button.dataset.mode;
      state.answerVisible = false;
      render();
    });
  });

  document.querySelectorAll("[data-scope]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cardScope = button.dataset.scope;
      resetDeck();
      render();
    });
  });

  const actions = {
    "toggle-answer": () => {
      state.answerVisible = !state.answerVisible;
      render();
    },
    "next-card": () => moveCard(1),
    "prev-card": () => moveCard(-1),
    "prev-day": () => setStudyDay(getCurrentStudyDay() - 1),
    "next-day": () => setStudyDay(getCurrentStudyDay() + 1),
    "reset-day": () => {
      state.settings.startDate = todayKey();
      saveStore();
      resetDeck();
      render();
    },
    "reset-progress": () => {
      if (!confirm("Сбросить весь прогресс по меню?")) return;
      state.progress = {};
      saveStore();
      resetDeck();
      render();
    },
    "clear-errors": () => {
      Object.keys(state.progress).forEach((id) => {
        state.progress[id].mistakes = 0;
      });
      saveStore();
      render();
    }
  };

  document.querySelectorAll("[data-action]").forEach((element) => {
    const action = element.dataset.action;
    if (action === "search") {
      element.addEventListener("input", () => {
        state.query = element.value;
        resetDeck();
        render();
      });
      return;
    }
    if (action === "category") {
      element.addEventListener("change", () => {
        state.selectedCategory = element.value;
        resetDeck();
        render();
      });
      return;
    }
    if (action === "set-day") {
      element.addEventListener("change", () => setStudyDay(element.value));
      return;
    }
    if (actions[action]) element.addEventListener("click", actions[action]);
  });

  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.deck[state.cardIndex];
      if (!item) return;
      state.progress = updateProgress(state.progress, item, button.dataset.answer, getCurrentStudyDay());
      saveStore();
      moveCard(1);
    });
  });
}

function moveCard(direction) {
  if (!state.deck.length) return;
  state.cardIndex = (state.cardIndex + direction + state.deck.length) % state.deck.length;
  state.answerVisible = false;
  render();
}

function setStudyDay(day) {
  const targetDay = clampStudyDay(day);
  const date = new Date();
  date.setDate(date.getDate() - (targetDay - 1));
  state.settings.startDate = date.toISOString().slice(0, 10);
  saveStore();
  resetDeck();
  render();
}

function resetDeck() {
  state.deck = buildDeck();
  state.cardIndex = 0;
  state.answerVisible = false;
}

function buildDeck() {
  const day = getCurrentStudyDay();
  const dailyPlan = getDailyPlan(state.menu, state.progress, day);
  let items = dailyPlan.items;
  if (state.cardScope === "all") items = state.menu;
  if (state.cardScope === "errors") items = getMistakeItems(state.menu, state.progress);
  if (state.selectedCategory !== "Все") items = items.filter((item) => item.category === state.selectedCategory);
  if (state.query.trim()) {
    const query = state.query.trim().toLowerCase();
    items = items.filter((item) => `${item.title} ${item.description} ${item.remember}`.toLowerCase().includes(query));
  }
  return items;
}

function getCurrentStudyDay() {
  const start = new Date(`${state.settings.startDate || todayKey()}T00:00:00`);
  const today = new Date(`${todayKey()}T00:00:00`);
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  return clampStudyDay(diffDays + 1);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      progress: state.progress,
      settings: state.settings
    })
  );
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/public/sw.js").catch(() => {});
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
