const MARKER_RULES = [
  {
    label: "мясо",
    terms: ["говядин", "говяж", "баранин", "баран", "ягн", "цыпл", "куриц", "индей", "свинин", "бекон", "мяс", "утк", "суджук", "буженин", "язык"]
  },
  {
    label: "рыба",
    terms: ["рыб", "лосос", "семг", "сёмг", "форел", "треск", "сельд", "угор", "тунец", "тунц", "масляная рыба"]
  },
  {
    label: "морепродукты",
    terms: ["кревет", "мид", "моллюск", "вонгол", "морепродукт", "кальмар"]
  },
  {
    label: "молочное / лактоза",
    terms: [
      "сыр",
      "сулугуни",
      "брынз",
      "сметан",
      "слив",
      "молок",
      "йогурт",
      "мацони",
      "буррат",
      "пармезан",
      "моцарел",
      "чанах",
      "лори",
      "чечил",
      "дорблю",
      "творож",
      "крем-чиз",
      "масло",
      "дзадзики",
      "крем",
      "чизкейк",
      "топлёное молоко",
      "топленое молоко"
    ]
  },
  {
    label: "глютен",
    terms: [
      "мук",
      "тесто",
      "лаваш",
      "хлеб",
      "пшен",
      "паста",
      "лингвини",
      "лапш",
      "булоч",
      "блин",
      "чебурек",
      "хачапури",
      "хинкали",
      "кутаб",
      "пирог",
      "выпеч",
      "паниров",
      "сухар",
      "гренк",
      "багет",
      "ржан",
      "песоч",
      "вафель",
      "лепёш",
      "лепеш"
    ],
    categories: ["Выпечка", "Хинкали"]
  },
  {
    label: "орехи",
    terms: ["орех", "грецк", "фисташ", "миндал", "арахис", "фундук", "кешью", "пралине"]
  },
  {
    label: "яйцо",
    terms: ["яйц", "омлет", "желтк", "меренг"]
  },
  {
    label: "острое",
    terms: ["остр", "чили", "аджик", "халапень", "кимчи", "перец чили"]
  },
  {
    label: "алкоголь в составе",
    terms: ["белого вина", "красного вина", "вином", "вино"]
  }
];

const TYPE_BY_CATEGORY = new Map([
  ["Деловые обеды", "деловой обед"],
  ["Супы", "суп"],
  ["Холодные закуски и салаты", "салат или холодная закуска"],
  ["Горячие закуски", "горячая закуска"],
  ["Выпечка", "выпечка"],
  ["Хинкали", "хинкали"],
  ["Горячие блюда", "горячее блюдо"],
  ["Шашлыки и блюда на мангале", "блюдо на мангале"],
  ["Десерты", "десерт"],
  ["Гарниры и соусы", "гарнир или соус"],
  ["Напитки", "напиток"],
  ["Праздничные боксы", "набор блюд"],
  ["Сезонное меню", "сезонное блюдо"]
]);

const SERVICE_ONLY_TEXT = "состав на сайте не указан";

const READY_MADE_TITLES = new Set([
  "кетчуп",
  "майонез",
  "сметана"
]);

export function getGuestMarkers(item) {
  const text = `${item.title || ""} ${item.description || ""}`.toLowerCase();
  const markers = [];
  for (const rule of MARKER_RULES) {
    const byText = rule.terms.some((term) => text.includes(term));
    const byCategory = rule.categories?.includes(item.category);
    if (byText || byCategory) markers.push(rule.label);
  }
  return markers;
}

export function getStudyHint(item) {
  const type = TYPE_BY_CATEGORY.get(item.category) || "блюдо";
  const description = cleanSentence(item.description);
  if (!description || description.toLowerCase() === SERVICE_ONLY_TEXT) return `${type}: состав на сайте не указан.`;
  return `${type}.`;
}

export function isStudyCardItem(item) {
  if (item.category === "Напитки") return false;
  return !READY_MADE_TITLES.has(cleanSentence(item.title).toLowerCase());
}

export function normalizeMenuItem(item) {
  return {
    ...item,
    remember: getStudyHint(item),
    markers: getGuestMarkers(item)
  };
}

function cleanSentence(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+\./g, ".")
    .replace(/\.$/, "");
}
