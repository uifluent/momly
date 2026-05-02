import type { EnergyLevel, Duration } from "./types";
import type { LocalFilters } from "./localIdeas";
import { isWeekend, getLocalHistory } from "./sessionPrefs";

export interface LocalEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  source: string;
  link: string;
  duration: Duration;
  energy: EnergyLevel[];
  withChild: boolean;
  image?: string;
}

export const LOCAL_EVENTS: LocalEvent[] = [

  // ── София — деца ───────────────────────────────────────────────────────────
  {
    id: "sof-muzeiko",
    title: "Музейко — интерактивни изложби",
    description: "Научен музей за деца с над 100 интерактивни експоната.",
    city: "София",
    source: "Музейко",
    link: "https://muzeiko.bg/program",
    image: "/images/muzeiko.jpg",
    duration: "medium",
    energy: ["low", "medium"],
    withChild: true,
  },
  {
    id: "sof-zoo",
    title: "Разходка до зоопарка 🐾",
    description: "Спокойно време навън с животни — лесно и достъпно.",
    city: "София",
    source: "Зоопарк София",
    link: "https://zoo.bg",
    image: "/images/zoo-sofia.jpg",
    duration: "medium",
    energy: ["low"],
    withChild: true,
  },
  {
    id: "sof-south-park",
    title: "Разходка в Южния парк 🌿",
    description: "Леко и достъпно — алея, зеленина, детски площадки.",
    city: "София",
    source: "Южен парк",
    link: "https://www.google.com/maps/search/Южен+парк",
    duration: "short",
    energy: ["low"],
    withChild: true,
  },
  {
    id: "sof-national-palace",
    title: "Национален дворец на децата",
    description: "Ателиета, клубове и занимания за деца всеки ден.",
    city: "София",
    source: "НДД",
    link: "https://ndk-children.bg",
    duration: "medium",
    energy: ["low", "medium"],
    withChild: true,
  },
  {
    id: "sof-natural-history",
    title: "Природонаучен музей",
    description: "Динозаври, минерали и животни — вълнуващо за малки и големи.",
    city: "София",
    source: "НПМБ",
    link: "https://www.nmnhs.com",
    duration: "medium",
    energy: ["low"],
    withChild: true,
  },
  {
    id: "sof-earth-and-man",
    title: 'Музей „Земята и хората"',
    description: "Скъпоценни камъни и минерали — тихо и красиво.",
    city: "София",
    source: "Земята и хората",
    link: "https://www.earthandman.org",
    duration: "short",
    energy: ["low"],
    withChild: true,
  },
  {
    id: "sof-history-museum",
    title: "Национален исторически музей",
    description: "Тракийско злато и богата колекция — за по-спокоен ден.",
    city: "София",
    source: "НИМ",
    link: "https://www.historymuseum.org",
    duration: "medium",
    energy: ["low", "medium"],
    withChild: false,
  },
  {
    id: "sof-yoga-outdoor",
    title: "Йога в Борисовата градина",
    description: "Открито занятие всяка събота. Носи постелка, вход свободен.",
    city: "София",
    source: "Yoga Sofia",
    link: "https://www.yogasofia.bg",
    duration: "medium",
    energy: ["medium"],
    withChild: false,
  },
  {
    id: "sof-fantasy-forest",
    title: "Фантастичната гора — Витоша",
    description: "Приключенска площадка сред дърветата. Билети на място.",
    city: "София",
    source: "Фантастичната гора",
    link: "https://fantasticnagora.bg",
    duration: "long",
    energy: ["medium", "high"],
    withChild: true,
  },

  // ── Пловдив ────────────────────────────────────────────────────────────────
  {
    id: "plv-regional-museum",
    title: "Регионален исторически музей",
    description: "Тракийски артефакти и история на Пловдив в красива сграда.",
    city: "Пловдив",
    source: "РИМ Пловдив",
    link: "https://www.rimplovdiv.com",
    duration: "medium",
    energy: ["low", "medium"],
    withChild: false,
  },
  {
    id: "plv-planetarium",
    title: "Планетариум Пловдив",
    description: "Прожекции за деца и възрастни — звезди и космос.",
    city: "Пловдив",
    source: "Планетариум",
    link: "https://planetarium-plovdiv.com",
    duration: "short",
    energy: ["low"],
    withChild: true,
  },
  {
    id: "plv-kapana-arts",
    title: "Арт галерии в Капана",
    description: "Разходка из креативния квартал — кафета, изкуство, атмосфера.",
    city: "Пловдив",
    source: "Капана",
    link: "https://visitplovdiv.com/kapana",
    duration: "medium",
    energy: ["medium"],
    withChild: false,
  },

  // ── Варна ──────────────────────────────────────────────────────────────────
  {
    id: "vna-dolphinarium",
    title: "Делфинариум Варна",
    description: "Шоу с делфини и морски лъвове — незабравимо за деца.",
    city: "Варна",
    source: "Делфинариум",
    link: "https://www.dolphinarium.bg",
    duration: "medium",
    energy: ["low", "medium"],
    withChild: true,
  },
  {
    id: "vna-aquarium",
    title: "Аквариум Варна",
    description: "Морски обитатели и интерактивни зали за деца.",
    city: "Варна",
    source: "Аквариум",
    link: "https://www.aquarium-varna.com",
    duration: "short",
    energy: ["low"],
    withChild: true,
  },
  {
    id: "vna-archaeological",
    title: "Археологически музей",
    description: "Едни от най-богатите тракийски съкровища в страната.",
    city: "Варна",
    source: "АМ Варна",
    link: "https://www.archaeo.museumvarna.com",
    duration: "medium",
    energy: ["low"],
    withChild: false,
  },

  // ── Бургас ─────────────────────────────────────────────────────────────────
  {
    id: "bgs-etnographic",
    title: "Етнографски музей Бургас",
    description: "Традиции и занаяти — спокойна и поучителна разходка.",
    city: "Бургас",
    source: "ЕМ Бургас",
    link: "https://www.burgasmuseums.bg",
    duration: "short",
    energy: ["low"],
    withChild: true,
  },
  {
    id: "bgs-aquae-calidae",
    title: "Акве Калиде — антична баня",
    description: "Римски терми на открито — история на свеж въздух.",
    city: "Бургас",
    source: "Акве Калиде",
    link: "https://burgasmuseums.bg/index.php/museums/aquae-calidae",
    duration: "medium",
    energy: ["medium"],
    withChild: false,
  },

  // ── Велико Търново ─────────────────────────────────────────────────────────
  {
    id: "vt-tsarevets",
    title: "Царевец — крепост",
    description: "Средновековна крепост с невероятна гледка — задължително.",
    city: "Велико Търново",
    source: "Царевец",
    link: "https://tsarevets.org",
    duration: "medium",
    energy: ["medium"],
    withChild: true,
  },
  {
    id: "vt-art-museum",
    title: "Регионален музей за история",
    description: "Средновековни артефакти и богата постоянна експозиция.",
    city: "Велико Търново",
    source: "РМИ ВТ",
    link: "https://museum.veliko-tarnovo.net",
    duration: "medium",
    energy: ["low"],
    withChild: false,
  },
];

function scoreEvent(
  event: LocalEvent,
  filters: LocalFilters,
  city: string,
): number {
  let score = 0;
  if (event.city === city)                                                  score += 3;
  if (filters.time   && event.duration === filters.time)                    score += 2;
  if (filters.energy && event.energy.includes(filters.energy))              score += 2;
  else if (filters.energy && event.energy.includes("medium"))               score += 1;
  if (filters.ctx    && event.withChild === (filters.ctx === "child"))       score += 3;

  // Weekend boost: all events get a bump on weekends
  if (isWeekend())                                                          score += 2;

  return score;
}

export function getBestLocalEvent(
  filters: LocalFilters,
  city: string | undefined,
): (LocalEvent & { score: number }) | null {
  if (!city) return null;

  const history = getLocalHistory();

  const scored = LOCAL_EVENTS
    .map((e) => ({
      ...e,
      score: scoreEvent(e, filters, city) - (history.includes(e.id) ? 4 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 5) return null;

  // Pick randomly from events tied at the top score
  const topScore = best.score;
  const top = scored.filter((e) => e.score === topScore);
  return top[Math.floor(Math.random() * top.length)];
}
