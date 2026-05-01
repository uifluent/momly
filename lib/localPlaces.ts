import type { Activity, Category, EnergyLevel, Duration } from "./types";
import type { LocalFilters } from "./localIdeas";
import { isWeekend, getLocalHistory } from "./sessionPrefs";

export type PlaceType      = "outdoor" | "group" | "calm" | "focused" | "indoor";
export type PlaceMilestone = "sensory" | "exploration" | "play" | "learning";

export interface LocalPlace {
  id:          string;
  title:       string;
  description: string;
  city:        string;
  type:        PlaceType;
  withChild:   boolean;
  energy:      EnergyLevel;
  duration:    "20-40" | "40-90" | "90+";
  ageRange:    { min: number; max: number };  // years
  milestone:   PlaceMilestone;
  distance?:   number;                        // km from city centre
  link?:       string;
  image?:      string;                        // path inside /public, e.g. "/images/muzeiko.jpg"
}

// Duration string → Duration type mapping
const DURATION_MAP: Record<LocalPlace["duration"], Duration> = {
  "20-40": "short",
  "40-90": "medium",
  "90+":   "long",
};

// Which type gets a weekend boost
const OUTDOOR_TYPES: PlaceType[] = ["outdoor", "group"];

// Milestone → age range in months
const MILESTONE_AGE: Record<PlaceMilestone, [number, number]> = {
  sensory:     [0,   24],
  exploration: [24,  36],
  play:        [36,  60],
  learning:    [60, 999],
};

export const LOCAL_PLACES: LocalPlace[] = [
  {
    id: "bonsovi-park",
    title: 'Въжен парк „Бонсови поляни" 🌲',
    description: "Малко приключение сред природата",
    city: "София", type: "outdoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 4, max: 12 }, milestone: "play",
  },
  {
    id: "kokolandia",
    title: "Въжен парк Коколандия 🌳",
    description: "Катерене и движение в Борисовата градина",
    city: "София", type: "outdoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 4, max: 12 }, milestone: "play",
  },
  {
    id: "muzeiko",
    title: "Приключение в Музейко 🧠",
    description: "Интерактивно и интересно за детето",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "learning",
  },
  {
    id: "luna-park",
    title: "Лунапарк Боби & Кели 🎡",
    description: "Забавление и емоции",
    city: "София", type: "group", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "play",
  },
  {
    id: "zoo",
    title: "Разходка в зоопарка 🐾",
    description: "Спокойно време навън + животни",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 2, max: 10 }, milestone: "exploration",
  },
  {
    id: "vazrajdane-park",
    title: 'Разходка в парк „Възраждане" 🌿',
    description: "Леко време навън",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 10 }, milestone: "exploration",
  },
  {
    id: "kambanite",
    title: 'Площадката „Камбаните" 🔔',
    description: "Просторно място за игра",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "20-40",
    ageRange: { min: 2, max: 10 }, milestone: "play",
  },
  {
    id: "mini-zoo",
    title: "Мини зоопарк в Борисовата градина 🐐",
    description: "Кратка и лесна среща с животни",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
  },
  {
    id: "adventure-park",
    title: "Приключенски парк София Парк 🧗",
    description: "Активно време за по-големи деца",
    city: "София", type: "group", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 5, max: 12 }, milestone: "play",
  },
  {
    id: "toy-museum",
    title: "Музей на играчките 🎠",
    description: "Спокойно и любопитно преживяване",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 3, max: 10 }, milestone: "learning",
  },
  {
    id: "yunak-park",
    title: 'Парк „Юнак" 🌳',
    description: "Кратка разходка и игра",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 10 }, milestone: "exploration",
  },

  // ── София — закрити активности ────────────────────────────────────────────
  {
    id: "balkan-climbing",
    title: "Катерене в Balkan Climbing 🧗‍♀️",
    description: "Активно време и нещо различно",
    city: "София", type: "indoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 5, max: 12 }, milestone: "play",
    link: "https://balkanclimbing.com/",
  },
  {
    id: "balkan-climbing-kids",
    title: "Детска стена в Balkan Climbing 🧗‍♀️",
    description: "Безопасно катерене, направено за деца",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "play",
    link: "https://balkanclimbing.com/zone/detska-stena",
    image: "/images/balkan-climbing-kids.jpg",
  },
  {
    id: "walltopia",
    title: "Катерене в Walltopia 🧗",
    description: "Контролирана среда + движение",
    city: "София", type: "indoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 6, max: 14 }, milestone: "play",
    link: "https://walltopia.com/",
  },

  // ── Сензорни / бебе ───────────────────────────────────────────────────────
  {
    id: "munka-space",
    title: "Творческо време в Munka 🎨",
    description: "Игра и въображение в спокойна среда",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 2, max: 8 }, milestone: "learning",
    link: "https://www.facebook.com/munka.space/",
  },
  {
    id: "maple-kids",
    title: "Игра в Maple Kids 🛝",
    description: "Леко и удобно време за игра",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
    link: "https://www.facebook.com/maple3kids.detski.centyr.sofia.mladost/",
  },
  {
    id: "stuart-little",
    title: "Игра в Stuart Little 🧸",
    description: "Спокойно място за игра и социализация",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
    link: "https://www.facebook.com/stuartlittlekids/",
  },
  {
    id: "kindyroo",
    title: "Занимания в KindyROO 🐾",
    description: "Игра и развитие за най-малките",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 0, max: 4 }, milestone: "sensory",
    link: "https://kindyroo.bg/",
  },
  {
    id: "bebe-garden",
    title: "Спокойно време в Bebe Garden 🧸",
    description: "Тиха и безопасна среда за най-малките",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 0, max: 3 }, milestone: "sensory",
    link: "https://www.bebegardensofia.com/",
  },
  {
    id: "baby-yoga",
    title: "Бебешка йога с мама 🧘",
    description: "Нежни упражнения заедно — за двамата",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 0, max: 1 }, milestone: "sensory",
    link: "https://www.facebook.com/BabyYogaSofia",
  },
  {
    id: "sensory-room",
    title: "Сензорна стая 🌈",
    description: "Светлини, текстури и спокойна стимулация",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 0, max: 3 }, milestone: "sensory",
    link: "https://www.facebook.com/search/top?q=сензорна%20стая%20деца%20софия",
  },
  // ── Изследване / малки деца ───────────────────────────────────────────────
  {
    id: "open-library-kids",
    title: "Детски кът в Обществена библиотека 📚",
    description: "Книжки, тишина и малко спокойствие",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 2, max: 8 }, milestone: "exploration",
    link: "https://www.soflib.bg",
  },
  {
    id: "kvartalen-market",
    title: "Квартален пазар с детето 🛒",
    description: "Разходка, цветове и опознаване на света",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 5 }, milestone: "exploration",
    link: "https://www.google.com/maps/search/фермерски+пазар+софия",
  },
  // ── Игра / предучилищна възраст ───────────────────────────────────────────
  {
    id: "cinemagic-kids",
    title: "Детско кино 🎬",
    description: "Анимация на голям екран — специално за малки",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 3, max: 8 }, milestone: "play",
    link: "https://www.cinemagic.bg",
  },
  {
    id: "art-kids-workshop",
    title: "Арт работилница за малки 🖌️",
    description: "Свободно рисуване без правила",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 8 }, milestone: "play",
    link: "https://www.facebook.com/search/top?q=арт+работилница+деца+софия",
  },
  {
    id: "sofia-puppet-theatre",
    title: "Куклен театър София 🎭",
    description: "Магия на сцената за малките зрители",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 3, max: 8 }, milestone: "play",
    link: "https://www.sofpuppettheatre.com",
  },
  {
    id: "kids-pool-holiday",
    title: "Детски басейн — Holiday Inn 🏊",
    description: "Вода и движение в контролирана среда",
    city: "София", type: "indoor", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 2, max: 10 }, milestone: "play",
    link: "https://www.ihg.com/holidayinn/hotels/bg/bg/sofia",
  },
  {
    id: "kids-music-class",
    title: "Ритъм и музика за деца 🎵",
    description: "Пеене, инструменти и движение",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 2, max: 6 }, milestone: "play",
    link: "https://www.facebook.com/search/top?q=музика+деца+софия+занятия",
  },
  // ── Учене / по-големи деца ────────────────────────────────────────────────
  {
    id: "science-museum",
    title: "Музей на науката 🔬",
    description: "Опити и любопитство — за деца и родители",
    city: "София", type: "indoor", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 5, max: 12 }, milestone: "learning",
    link: "https://www.ndk.bg",
  },
  {
    id: "robotics-kids",
    title: "Роботика за деца 🤖",
    description: "Градене и програмиране по игровит начин",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 5, max: 12 }, milestone: "learning",
    link: "https://www.facebook.com/search/top?q=роботика+деца+софия",
  },
  {
    id: "tennis-kids",
    title: "Детски тенис 🎾",
    description: "Координация и движение на корта",
    city: "София", type: "outdoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 4, max: 12 }, milestone: "learning",
    link: "https://www.facebook.com/search/top?q=детски+тенис+урок+софия",
  },
  // ── Природа / активни ─────────────────────────────────────────────────────
  {
    id: "vitosha-hike-easy",
    title: "Лесна пътека на Витоша 🌲",
    description: "Природа на крачка от града — за семейства",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 12 }, milestone: "exploration",
    link: "https://www.sofiatrails.com",
  },
  {
    id: "nature-craft-outdoor",
    title: "Природни занаяти навън 🍂",
    description: "Листа, клонки и малки творби сред природата",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 2, max: 8 }, milestone: "exploration",
    link: "https://www.facebook.com/search/top?q=природа+творчество+деца+софия",
  },
  {
    id: "pony-riding",
    title: "Яздене на пони 🐴",
    description: "Среща с животни и малко приключение",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "20-40",
    ageRange: { min: 2, max: 8 }, milestone: "exploration",
    link: "https://www.facebook.com/search/top?q=пони+яздене+деца+софия",
  },

  {
    id: "little-gym",
    title: "Движение в Little Gym 🤸",
    description: "Игра и развитие чрез движение",
    city: "София", type: "group", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 2, max: 8 }, milestone: "play",
    link: "https://sofia.thelittlegym.eu/",
  },
  {
    id: "baby-swim",
    title: "Плуване за бебе 🏊‍♀️",
    description: "Нежно движение и игра във вода",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 0, max: 2 }, milestone: "sensory",
    link: "https://cs.pluvanesbebe.bg/web/",
  },
  {
    id: "i-can-culture",
    title: "Творческа работилница 🎨",
    description: "Рисуване и творчество за деца",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "learning",
    link: "https://i-can-culture.com/",
  },
  {
    id: "malki-prikazki",
    title: "Приказка за деца 🎭",
    description: "Спокойно и различно преживяване",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 2, max: 7 }, milestone: "learning",
    link: "https://malkiprikazki.com/",
  },
  {
    id: "mplay-cafe",
    title: "Кафе и игра в Mplay ☕🧸",
    description: "Ти си почиваш, детето играе",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
    link: "https://mplay-cafe.com/",
  },
  {
    id: "gush-sofia",
    title: "Игра и време в Gush 🧸",
    description: "Спокойно място за игра и време с детето",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
    link: "https://www.facebook.com/gush.sofia/about",
  },

  // ── София — наблизо ────────────────────────────────────────────────────────
  {
    id: "vrana-park",
    title: 'Разходка в парк „Врана" 🌳',
    description: "Просторно и красиво място за разходка",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 15,
    ageRange: { min: 1, max: 10 }, milestone: "exploration",
  },
  {
    id: "adgor-horses",
    title: 'Конна база „Адгор" 🐎',
    description: "Среща с коне и природа",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "40-90", distance: 20,
    ageRange: { min: 3, max: 10 }, milestone: "exploration",
  },
  {
    id: "bankya-trail",
    title: "Пътека на здравето – Банкя 🌿",
    description: "Лека разходка в природата",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 20,
    ageRange: { min: 2, max: 10 }, milestone: "exploration",
  },
  {
    id: "vitosha-dendarium",
    title: "Дендрариумът на Витоша 🌲",
    description: "Гора, въздух и спокойствие",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 20,
    ageRange: { min: 2, max: 10 }, milestone: "exploration",
  },
  {
    id: "windmills-park",
    title: "Вятърните мелници 🌬️",
    description: "Интересно място с пространство за игра",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "40-90", distance: 30,
    ageRange: { min: 3, max: 10 }, milestone: "play",
  },
  {
    id: "alice-zoo",
    title: 'Зоокът „Алис" 🐐',
    description: "Близка среща с животни",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 40,
    ageRange: { min: 2, max: 10 }, milestone: "sensory",
  },
  {
    id: "chavdar-village",
    title: "Разходка до село Чавдар 🏡",
    description: "Красиво и подредено място за семейства",
    city: "София", type: "group", withChild: true,
    energy: "low", duration: "40-90", distance: 50,
    ageRange: { min: 2, max: 10 }, milestone: "exploration",
  },
  {
    id: "iskar-panega",
    title: "Екопътека Искър-Панега 🏞️",
    description: "Малко приключение сред природата",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "40-90", distance: 50,
    ageRange: { min: 4, max: 12 }, milestone: "play",
  },
  {
    id: "sapareva-banya",
    title: "Топли басейни в Сапарева баня 💧",
    description: "Релакс за теб и игра за детето",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "40-90", distance: 80,
    ageRange: { min: 2, max: 10 }, milestone: "sensory",
  },
];

function scorePlace(
  place: LocalPlace,
  filters: LocalFilters,
  city: string,
  childAgeMonths: number | null,
): number {
  let score = 0;

  if (place.city !== city) return -99;  // hard city filter

  // Duration match
  if (filters.time && DURATION_MAP[place.duration] === filters.time) score += 2;

  // Energy match
  if (filters.energy) {
    if (place.energy === filters.energy)                              score += 3;
    else if (place.energy === "medium")                               score += 1;
  }

  // Context match
  if (filters.ctx && place.withChild === (filters.ctx === "child"))   score += 3;

  // Age range match (years → months conversion)
  if (childAgeMonths !== null) {
    const minM = place.ageRange.min * 12;
    const maxM = place.ageRange.max * 12;
    if (childAgeMonths >= minM && childAgeMonths <= maxM)            score += 3;
    else if (childAgeMonths < minM && childAgeMonths >= minM - 6)   score += 1;  // almost in range
    else                                                              score -= 2;
  }

  // Milestone match
  if (childAgeMonths !== null) {
    const [ms, me] = MILESTONE_AGE[place.milestone];
    if (childAgeMonths >= ms && childAgeMonths < me)                 score += 2;
  }

  // Baby boost (0–24 months): sensory + sheltered places
  if (childAgeMonths !== null && childAgeMonths <= 24) {
    if (place.milestone === "sensory")                               score += 3;
    if (place.type === "indoor" || place.type === "calm")            score += 1;
  }

  // Toddler boost (24–36 months): structured development activities
  if (childAgeMonths !== null && childAgeMonths > 24 && childAgeMonths <= 36) {
    if (place.milestone === "sensory" || place.milestone === "exploration") score += 2;
    if (place.type === "focused")                                    score += 2;
  }

  // Weekend boost
  if (isWeekend() && OUTDOOR_TYPES.includes(place.type))            score += 2;

  // Anti-repeat penalty
  const history = getLocalHistory();
  if (history.includes(place.id))                                    score -= 4;

  return score;
}

// ── Activity adapter ──────────────────────────────────────────────────────────

const TYPE_CATEGORIES: Record<PlaceType, Category[]> = {
  outdoor:  ["movement", "reset"],
  group:    ["social",   "movement"],
  calm:     ["calm"],
  focused:  ["calm",     "self-care"],
  indoor:   ["movement", "social"],
};

const TYPE_STEPS: Record<PlaceType, string[]> = {
  outdoor:  ["Облечете се удобно", "Излезте заедно", "Насладете се на времето"],
  group:    ["Планирайте посещението", "Отидете заедно", "Изследвайте и се забавлявайте"],
  calm:     ["Отидете заедно", "Разгледайте спокойно", "Насладете се без бързане"],
  focused:  ["Намерете удобно място", "Разгледайте внимателно", "Обсъдете какво видяхте"],
  indoor:   ["Резервирайте или проверете работното време", "Отидете заедно", "Насладете се на активността"],
};

export function placeToActivity(place: LocalPlace): Activity {
  const durationKey = DURATION_MAP[place.duration];
  return {
    id:               `place-${place.id}`,
    title:             place.title,
    description:       place.description,
    feelsLike:         place.type === "outdoor" ? "малко въздух" : "уютен момент",
    steps:             TYPE_STEPS[place.type],
    duration:          [durationKey],
    energy:            [place.energy],
    withChild:         place.withChild,
    ageRange:          [place.ageRange.min * 12, place.ageRange.max * 12],
    category:          TYPE_CATEGORIES[place.type],
    effort:            place.energy === "low" ? "zero" : "low",
    interruptibility:  "medium",
    mentalLoad:        "light",
    repeatable:        true,
  };
}

/** Return Activity-shaped local places matching the given city */
export function getLocalPlacesAsActivities(city: string | undefined): Activity[] {
  if (!city) return [];
  return LOCAL_PLACES
    .filter((p) => p.city === city)
    .map(placeToActivity);
}

export function getBestLocalPlace(
  filters: LocalFilters,
  city: string | undefined,
  childAgeMonths: number | null,
): (LocalPlace & { score: number }) | null {
  if (!city) return null;

  const scored = LOCAL_PLACES
    .map((p) => ({ ...p, score: scorePlace(p, filters, city, childAgeMonths) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 5) return null;

  // Pick randomly from top-scored ties
  const top = scored.filter((p) => p.score === best.score);
  return top[Math.floor(Math.random() * top.length)];
}

// ── Travel time ───────────────────────────────────────────────────────────────

export function estimateTravelTime(km: number): string {
  if (km < 20)  return "15–20 мин";
  if (km < 35)  return "25–35 мин";
  if (km < 60)  return "40–60 мин";
  return "1 ч+";
}

// ── Mock weather ──────────────────────────────────────────────────────────────

type WeatherCondition = "sunny" | "cloudy" | "rainy";

function getWeatherCondition(): WeatherCondition {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 5 && month <= 8) return "sunny";   // Jun–Sep
  if (month >= 10 || month <= 1) return "rainy";  // Nov–Feb
  return "cloudy";
}

function weatherScore(type: PlaceType, weather: WeatherCondition): number {
  const isOutdoor = type === "outdoor";
  if (weather === "rainy"  && isOutdoor)    return -3;
  if (weather === "rainy"  && type === "indoor")  return  4;  // strong rainy-day option
  if (weather === "rainy"  && type === "focused") return  3;  // structured indoor = great rainy-day pick
  if (weather === "rainy"  && type === "calm")    return  2;
  if (weather === "sunny"  && isOutdoor)    return  2;
  return 0;
}

// ── Saved trips ───────────────────────────────────────────────────────────────

const SAVED_TRIPS_KEY  = "savedTrips";
const NEARBY_SHOWN_KEY = "nearbyShownDate";

export function getSavedTrips(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) ?? "[]"); }
  catch { return []; }
}

export function toggleSavedTrip(id: string): boolean {
  try {
    const current = getSavedTrips();
    const isSaved = current.includes(id);
    const next    = isSaved ? current.filter((i) => i !== id) : [...current, id];
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(next));
    return !isSaved;
  } catch { return false; }
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreNearby(
  place: LocalPlace & { distance: number },
  childAgeMonths: number | null,
  weather: WeatherCondition,
  savedIds: string[],
): number {
  let score = 0;

  // Distance bonus
  const km = place.distance;
  if (km < 30)      score += 3;
  else if (km < 60) score += 1;

  // Weather
  score += weatherScore(place.type, weather);

  // Saved boost
  if (savedIds.includes(place.id)) score += 4;

  // Age + milestone
  if (childAgeMonths !== null) {
    const minM = place.ageRange.min * 12;
    const maxM = place.ageRange.max * 12;
    if (childAgeMonths >= minM && childAgeMonths <= maxM) score += 3;
    else if (childAgeMonths >= minM - 6)                  score += 1;
    else                                                   score -= 1;

    const [ms, me] = MILESTONE_AGE[place.milestone];
    if (childAgeMonths >= ms && childAgeMonths < me)      score += 2;
  }

  return score;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface NearbyPlace extends LocalPlace {
  distance:    number;
  score:       number;
  travelTime:  string;
  weather:     WeatherCondition;
}

export function getBestNearbyPlace(
  city: string | undefined,
  childAgeMonths: number | null,
): NearbyPlace | null {
  if (!city)        return null;
  if (!isWeekend()) return null;

  // Show at most once per calendar day (unless a saved trip exists)
  const savedIds = getSavedTrips();
  try {
    const shownToday = localStorage.getItem(NEARBY_SHOWN_KEY) === new Date().toDateString();
    if (shownToday && savedIds.length === 0) return null;
  } catch { /* SSR */ }

  const pool = LOCAL_PLACES.filter(
    (p) => p.city === city && p.distance !== undefined,
  ) as (LocalPlace & { distance: number })[];

  if (pool.length === 0) return null;

  const weather = getWeatherCondition();

  const scored = pool
    .map((p) => ({ ...p, score: scoreNearby(p, childAgeMonths, weather, savedIds) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (best.score < 2) return null;

  try { localStorage.setItem(NEARBY_SHOWN_KEY, new Date().toDateString()); } catch {}

  return { ...best, travelTime: estimateTravelTime(best.distance), weather };
}
