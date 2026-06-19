
export const COLLAPSE_AT = 110;

export const TYPE_CHIPS = [
  { id: "all", label: "Все", boatType: "" },
  { id: "boat", label: "Катер", boatType: "катер" },
  { id: "yacht", label: "Яхта", boatType: "яхта" },
  { id: "ship", label: "Теплоход", boatType: "теплоход" },
  {
    id: "venetian",
    label: "Венецианский катер",
    boatType: "венецианский катер",
  },
  { id: "canal_yacht", label: "Канальная яхта", boatType: "канальная яхта" },
] as const;

export const CAPACITY_OPTS = [null, 4, 5, 6, 7, 8, 9, 10, 11] as const;


export const PRICE_PRESETS = [
  { label: "до 15 000", min: null, max: 15000 },
  { label: "15 000–30 000", min: 15000, max: 30000 },
  { label: "30 000+", min: 30000, max: null },
] as const;

export const AMENITIES = [
  { key: "hasTarp" as const, label: "Тент / навес" },
  { key: "hasToilet" as const, label: "Туалет на борту" },
  { key: "hasHeating" as const, label: "Отопление" },
];

export const TIME_OPTS = Array.from({ length: 24 }, (_, i) => i);
export const DURATION_OPTS = [1, 2, 3, 4, 6, 8, 12];

export const MONTHS_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
export const MONTHS_GEN_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
export const MONTHS_S_RU = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];
export const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];