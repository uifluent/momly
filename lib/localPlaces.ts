import type { Activity, Category, EnergyLevel, Duration } from "./types";
import type { LocalFilters } from "./localIdeas";
import { isWeekend, getLocalHistory } from "./sessionPrefs";

export type PlaceType      = "outdoor" | "group" | "calm" | "focused" | "indoor";
export type PlaceMilestone = "sensory" | "exploration" | "play" | "learning";

export type PlaceSection = "outdoor" | "venue";

export interface LocalPlace {
  id:          string;
  title:       string;
  description: string;
  city:        string;
  type:        PlaceType;
  section:     PlaceSection;  // "outdoor" = parks/nature, "venue" = indoor play centres etc.
  /** True for places whose type is "group" but are physically indoors (used for weather scoring) */
  indoor?:     boolean;
  withChild:   boolean;
  energy:      EnergyLevel;
  duration:    "20-40" | "40-90" | "90+";
  ageRange:    { min: number; max: number };  // years
  milestone:   PlaceMilestone;
  distance?:   number;                        // km from city centre
  coords?:     { lat: number; lng: number };  // GPS coordinates for real distance
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
    section: "outdoor",
    title: 'Въжен парк „Бонсови поляни" 🌲',
    description: "Малко приключение сред природата",
    city: "София", type: "outdoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 4, max: 12 }, milestone: "play",
    image: "https://images.unsplash.com/photo-1509398484917-2a5b6439feef?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kokolandia",
    section: "outdoor",
    title: "Въжен парк Коколандия 🌳",
    description: "Катерене и движение в Борисовата градина",
    city: "София", type: "outdoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 4, max: 12 }, milestone: "play",
    image: "https://images.unsplash.com/photo-1509398484917-2a5b6439feef?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "muzeiko",
    section: "venue",
    title: "Приключение в Музейко 🧠",
    description: "Интерактивно и интересно за детето",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "learning",
    image: "https://images.unsplash.com/photo-1637195141546-2469a5312504?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "luna-park",
    section: "outdoor",
    title: "Лунапарк Боби & Кели 🎡",
    description: "Забавление и емоции",
    city: "София", type: "group", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "play",
    image: "https://images.unsplash.com/photo-1751235640841-d8d1035a80f0?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "zoo",
    section: "outdoor",
    title: "Разходка в зоопарка 🐾",
    description: "Спокойно време навън + животни",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 2, max: 10 }, milestone: "exploration",
    image: "https://images.unsplash.com/photo-1773269806705-838a80a4accd?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "vazrajdane-park",
    section: "outdoor",
    title: 'Разходка в парк „Възраждане" 🌿',
    description: "Леко време навън",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 10 }, milestone: "exploration",
    image: "https://images.unsplash.com/photo-1777169440407-70c6fc3e4387?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kambanite",
    section: "outdoor",
    title: 'Площадката „Камбаните" 🔔',
    description: "Просторно място за игра",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "20-40",
    ageRange: { min: 2, max: 10 }, milestone: "play",
    image: "https://images.unsplash.com/photo-1777264972191-cdd81418a382?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "mini-zoo",
    section: "outdoor",
    title: "Мини зоопарк в Борисовата градина 🐐",
    description: "Кратка и лесна среща с животни",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
    image: "https://images.unsplash.com/photo-1503918756811-975bd3397178?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "adventure-park",
    section: "outdoor",
    title: "Приключенски парк София Парк 🧗",
    description: "Активно време за по-големи деца",
    city: "София", type: "group", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 5, max: 12 }, milestone: "play",
    image: "https://images.unsplash.com/photo-1509398484917-2a5b6439feef?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "toy-museum",
    section: "venue",
    title: "Музей на играчките 🎠",
    description: "Спокойно и любопитно преживяване",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 3, max: 10 }, milestone: "learning",
    image: "https://images.unsplash.com/photo-1637195141546-2469a5312504?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "yunak-park",
    section: "outdoor",
    title: 'Парк „Юнак" 🌳',
    description: "Кратка разходка и игра",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 10 }, milestone: "exploration",
    image: "https://images.unsplash.com/photo-1777169440407-70c6fc3e4387?auto=format&fit=crop&w=400&q=80",
  },

  // ── София — закрити активности ────────────────────────────────────────────
  {
    id: "funtopia",
    section: "venue",
    title: "Катерене и игра във Funtopia 🧗‍♀️",
    description: "Движение и забавление за по-активни деца",
    city: "София", type: "group", indoor: true, withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 4, max: 12 }, milestone: "play",
    link: "https://funtopiaworld.com/",
    image: "https://images.unsplash.com/photo-1509398484917-2a5b6439feef?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "area52",
    section: "venue",
    title: "Скачане в Area 52 🤸",
    description: "Много движение и забавление",
    city: "София", type: "group", indoor: true, withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 5, max: 14 }, milestone: "play",
    link: "https://area52.bg/",
    image: "https://images.unsplash.com/photo-1751235640841-d8d1035a80f0?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "balkan-climbing",
    section: "venue",
    title: "Катерене в Balkan Climbing 🧗‍♀️",
    description: "Активно време и нещо различно",
    city: "София", type: "indoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 5, max: 12 }, milestone: "play",
    link: "https://balkanclimbing.com/",
    image: "https://images.unsplash.com/photo-1509398484917-2a5b6439feef?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "balkan-climbing-kids",
    section: "venue",
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
    section: "venue",
    title: "Катерене в Walltopia 🧗",
    description: "Контролирана среда + движение",
    city: "София", type: "indoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 6, max: 14 }, milestone: "play",
    link: "https://walltopia.com/",
    image: "https://images.unsplash.com/photo-1509398484917-2a5b6439feef?auto=format&fit=crop&w=400&q=80",
  },

  // ── Сензорни / бебе ───────────────────────────────────────────────────────
  {
    id: "munka-space",
    section: "venue",
    title: "Творческо време в Munka 🎨",
    description: "Игра и въображение в спокойна среда",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 2, max: 8 }, milestone: "learning",
    link: "https://www.facebook.com/munka.space/",
    image: "https://images.unsplash.com/photo-1637195141546-2469a5312504?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "maple-kids",
    section: "venue",
    title: "Игра в Maple Kids 🛝",
    description: "Леко и удобно време за игра",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
    link: "https://www.facebook.com/maple3kids.detski.centyr.sofia.mladost/",
    image: "https://images.unsplash.com/photo-1777264972191-cdd81418a382?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "stuart-little",
    section: "venue",
    title: "Игра в Stuart Little 🧸",
    description: "Спокойно място за игра и социализация",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
    link: "https://www.facebook.com/stuartlittlekids/",
    image: "https://images.unsplash.com/photo-1777264972191-cdd81418a382?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kindyroo",
    section: "venue",
    title: "Занимания в KindyROO 🐾",
    description: "Игра и развитие за най-малките",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 0, max: 4 }, milestone: "sensory",
    link: "https://kindyroo.bg/",
    image: "https://images.unsplash.com/photo-1650359481734-a94a981e07bb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "bebe-garden",
    section: "venue",
    title: "Спокойно време в Bebe Garden 🧸",
    description: "Тиха и безопасна среда за най-малките",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 0, max: 3 }, milestone: "sensory",
    link: "https://www.bebegardensofia.com/",
    image: "https://images.unsplash.com/photo-1650359481734-a94a981e07bb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "baby-yoga",
    section: "venue",
    title: "Бебешка йога с мама 🧘",
    description: "Нежни упражнения заедно — за двамата",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 0, max: 1 }, milestone: "sensory",
    link: "https://www.facebook.com/BabyYogaSofia",
    image: "https://images.unsplash.com/photo-1650359481734-a94a981e07bb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "sensory-room",
    section: "venue",
    title: "Сензорна стая 🌈",
    description: "Светлини, текстури и спокойна стимулация",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 0, max: 3 }, milestone: "sensory",
    link: "https://www.facebook.com/search/top?q=сензорна%20стая%20деца%20софия",
    image: "https://images.unsplash.com/photo-1650359481734-a94a981e07bb?auto=format&fit=crop&w=400&q=80",
  },
  // ── Изследване / малки деца ───────────────────────────────────────────────
  {
    id: "open-library-kids",
    section: "venue",
    title: "Детски кът в Обществена библиотека 📚",
    description: "Книжки, тишина и малко спокойствие",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 2, max: 8 }, milestone: "exploration",
    link: "https://www.soflib.bg",
    image: "https://images.unsplash.com/photo-1637195141546-2469a5312504?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kvartalen-market",
    section: "outdoor",
    title: "Квартален пазар с детето 🛒",
    description: "Разходка, цветове и опознаване на света",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 5 }, milestone: "exploration",
    link: "https://www.google.com/maps/search/фермерски+пазар+софия",
    image: "https://images.unsplash.com/photo-1503918756811-975bd3397178?auto=format&fit=crop&w=400&q=80",
  },
  // ── Игра / предучилищна възраст ───────────────────────────────────────────
  {
    id: "cinemagic-kids",
    section: "venue",
    title: "Детско кино 🎬",
    description: "Анимация на голям екран — специално за малки",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 3, max: 8 }, milestone: "play",
    link: "https://www.cinemagic.bg",
    image: "https://images.unsplash.com/photo-1771312699872-6eb3d1ca70f9?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "art-kids-workshop",
    section: "venue",
    title: "Арт работилница за малки 🖌️",
    description: "Свободно рисуване без правила",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 8 }, milestone: "play",
    link: "https://www.facebook.com/search/top?q=арт+работилница+деца+софия",
    image: "https://images.unsplash.com/photo-1637195141546-2469a5312504?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "sofia-puppet-theatre",
    section: "venue",
    title: "Куклен театър София 🎭",
    description: "Магия на сцената за малките зрители",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 3, max: 8 }, milestone: "play",
    link: "https://www.sofpuppettheatre.com",
    image: "https://images.unsplash.com/photo-1771312699872-6eb3d1ca70f9?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kids-pool-holiday",
    section: "venue",
    title: "Детски басейн — Holiday Inn 🏊",
    description: "Вода и движение в контролирана среда",
    city: "София", type: "indoor", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 2, max: 10 }, milestone: "play",
    link: "https://www.ihg.com/holidayinn/hotels/bg/bg/sofia",
    image: "https://images.unsplash.com/flagged/photo-1578467992042-7e2e9650cfbb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kids-music-class",
    section: "venue",
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
    section: "venue",
    title: "Музей на науката 🔬",
    description: "Опити и любопитство — за деца и родители",
    city: "София", type: "indoor", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 5, max: 12 }, milestone: "learning",
    link: "https://www.ndk.bg",
  },
  {
    id: "robotics-kids",
    section: "venue",
    title: "Роботика за деца 🤖",
    description: "Градене и програмиране по игровит начин",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 5, max: 12 }, milestone: "learning",
    link: "https://www.facebook.com/search/top?q=роботика+деца+софия",
  },
  {
    id: "tennis-kids",
    section: "outdoor",
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
    section: "outdoor",
    title: "Лесна пътека на Витоша 🌲",
    description: "Природа на крачка от града — за семейства",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 12 }, milestone: "exploration",
    link: "https://www.sofiatrails.com",
  },
  {
    id: "nature-craft-outdoor",
    section: "outdoor",
    title: "Природни занаяти навън 🍂",
    description: "Листа, клонки и малки творби сред природата",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 2, max: 8 }, milestone: "exploration",
    link: "https://www.facebook.com/search/top?q=природа+творчество+деца+софия",
  },
  {
    id: "pony-riding",
    section: "outdoor",
    title: "Яздене на пони 🐴",
    description: "Среща с животни и малко приключение",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "20-40",
    ageRange: { min: 2, max: 8 }, milestone: "exploration",
    link: "https://www.facebook.com/search/top?q=пони+яздене+деца+софия",
  },

  {
    id: "little-gym",
    section: "venue",
    title: "Движение в Little Gym 🤸",
    description: "Игра и развитие чрез движение",
    city: "София", type: "group", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 2, max: 8 }, milestone: "play",
    link: "https://sofia.thelittlegym.eu/",
  },
  {
    id: "baby-swim",
    section: "venue",
    title: "Плуване за бебе 🏊‍♀️",
    description: "Нежно движение и игра във вода",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 0, max: 2 }, milestone: "sensory",
    link: "https://cs.pluvanesbebe.bg/web/",
  },
  {
    id: "i-can-culture",
    section: "venue",
    title: "Творческа работилница 🎨",
    description: "Рисуване и творчество за деца",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "learning",
    link: "https://i-can-culture.com/",
  },
  {
    id: "malki-prikazki",
    section: "venue",
    title: "Приказка за деца 🎭",
    description: "Спокойно и различно преживяване",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 2, max: 7 }, milestone: "learning",
    link: "https://malkiprikazki.com/",
  },
  {
    id: "mplay-cafe",
    section: "venue",
    title: "Кафе и игра в Mplay ☕🧸",
    description: "Ти си почиваш, детето играе",
    city: "София", type: "indoor", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 1, max: 6 }, milestone: "sensory",
    link: "https://mplay-cafe.com/",
  },
  {
    id: "gush-sofia",
    section: "venue",
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
    section: "outdoor",
    title: 'Разходка в парк „Врана" 🌳',
    description: "Просторно и красиво място за разходка",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 15,
    coords: { lat: 42.693, lng: 23.555 },
    ageRange: { min: 1, max: 10 }, milestone: "exploration",
  },
  {
    id: "adgor-horses",
    section: "venue",
    title: 'Конна база „Адгор" 🐎',
    description: "Среща с коне и природа",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "40-90", distance: 20,
    coords: { lat: 42.565, lng: 23.285 },
    ageRange: { min: 3, max: 10 }, milestone: "exploration",
  },
  {
    id: "bankya-trail",
    section: "venue",
    title: "Пътека на здравето – Банкя 🌿",
    description: "Лека разходка в природата",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 20,
    coords: { lat: 42.726, lng: 23.124 },
    ageRange: { min: 2, max: 10 }, milestone: "exploration",
  },
  {
    id: "vitosha-dendarium",
    section: "venue",
    title: "Дендрариумът на Витоша 🌲",
    description: "Гора, въздух и спокойствие",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 20,
    coords: { lat: 42.607, lng: 23.280 },
    ageRange: { min: 2, max: 10 }, milestone: "exploration",
  },
  {
    id: "windmills-park",
    section: "venue",
    title: "Вятърните мелници 🌬️",
    description: "Интересно място с пространство за игра",
    city: "София", type: "group", withChild: true,
    energy: "medium", duration: "40-90", distance: 30,
    coords: { lat: 42.722, lng: 23.660 },
    ageRange: { min: 3, max: 10 }, milestone: "play",
  },
  {
    id: "alice-zoo",
    section: "venue",
    title: 'Зоокът „Алис" 🐐',
    description: "Близка среща с животни",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 40,
    coords: { lat: 42.516, lng: 23.126 },
    ageRange: { min: 2, max: 10 }, milestone: "sensory",
  },
  {
    id: "chavdar-village",
    section: "venue",
    title: "Разходка до село Чавдар 🏡",
    description: "Красиво и подредено място за семейства",
    city: "София", type: "group", withChild: true,
    energy: "low", duration: "40-90", distance: 50,
    coords: { lat: 42.723, lng: 23.845 },
    ageRange: { min: 2, max: 10 }, milestone: "exploration",
  },
  {
    id: "iskar-panega",
    section: "venue",
    title: "Екопътека Искър-Панега 🏞️",
    description: "Малко приключение сред природата",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "40-90", distance: 50,
    coords: { lat: 43.012, lng: 24.032 },
    ageRange: { min: 4, max: 12 }, milestone: "play",
  },
  {
    id: "sapareva-banya",
    section: "venue",
    title: "Топли басейни в Сапарева баня 💧",
    description: "Релакс за теб и игра за детето",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "40-90", distance: 80,
    coords: { lat: 42.290, lng: 23.269 },
    ageRange: { min: 2, max: 10 }, milestone: "sensory",
  },
  {
    id: "ekopark_stamboliyski",
    section: "venue",
    title: "Екопарк Стамболийски 🎠",
    description: "Цветно място с катерушки, люлки и безплатен закрит детски кът.",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "40-90", distance: 20,
    coords: { lat: 42.543, lng: 23.179 },
    ageRange: { min: 2, max: 8 }, milestone: "play",
  },
  {
    id: "rope_park_chavdar",
    section: "venue",
    title: "Въжен парк Чавдар 🌲",
    description: "Въжени трасета и площадки за различни възрасти.",
    city: "София", type: "outdoor", withChild: true,
    energy: "high", duration: "40-90", distance: 50,
    coords: { lat: 42.710, lng: 23.850 },
    ageRange: { min: 3, max: 10 }, milestone: "play",
  },
  {
    id: "fairytale_alley",
    section: "venue",
    title: "Алея на приказките 🧚",
    description: "Разходка сред приказни фигури за деца.",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "20-40", distance: 100,
    coords: { lat: 42.193, lng: 24.337 },
    ageRange: { min: 2, max: 6 }, milestone: "exploration",
  },
  {
    id: "gardens_of_world",
    section: "venue",
    title: "Градините на света 🌸",
    description: "Красив и поддържан парк за разходка и пикник.",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90", distance: 100,
    coords: { lat: 42.193, lng: 24.337 },
    ageRange: { min: 2, max: 8 }, milestone: "exploration",
  },
  {
    id: "hills_plovdiv",
    section: "venue",
    title: "Hills Пловдив 🏖️",
    description: "Пясъчник, игри и храна – идеално за топли дни.",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "40-90", distance: 140,
    coords: { lat: 42.150, lng: 24.750 },
    ageRange: { min: 2, max: 8 }, milestone: "play",
  },

  // ── Ферми / открити природни места ───────────────────────────────────────
  {
    id: "farm_of_dreams",
    section: "venue",
    title: "Фермата на мечтите 🐄",
    description: "Животни, природа и свободна игра.",
    city: "София", type: "outdoor", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 2, max: 8 }, milestone: "play",
  },
  {
    id: "aquapark_sofia",
    section: "venue",
    title: "Aquapark Sofia 💦",
    description: "Водни забавления и пързалки.",
    city: "София", type: "outdoor", withChild: true,
    energy: "high", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "play",
  },
  {
    id: "galunka_trail",
    section: "venue",
    title: "Галунка – Витоша 🌿",
    description: "Лека разходка в планината, подходяща за деца.",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 2, max: 6 }, milestone: "exploration",
  },

  {
    id: "kremikovtsi_monastery",
    section: "venue",
    title: "Кремиковски манастир 🏛️",
    description: "Тиха разходка с красива гледка и спокойствие.",
    city: "София", type: "outdoor", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 2, max: 8 }, milestone: "exploration",
  },

  // ── Музеи / образователни ─────────────────────────────────────────────────
  {
    id: "earth_museum",
    section: "venue",
    title: "Геологически музей 🪨",
    description: "Интересни експонати за земята и природата.",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 4, max: 10 }, milestone: "learning",
  },
  {
    id: "techno_magic",
    section: "venue",
    title: "TechnoMagicLand 🔬",
    description: "Интерактивен научен център.",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 4, max: 10 }, milestone: "learning",
  },
  {
    id: "natural_history",
    section: "venue",
    title: "Природонаучен музей 🦕",
    description: "Животни, скелети и природа.",
    city: "София", type: "calm", withChild: true,
    energy: "low", duration: "40-90",
    ageRange: { min: 3, max: 10 }, milestone: "learning",
  },
  {
    id: "phenomena_museum",
    section: "venue",
    title: "Phenomena Museum ⚡",
    description: "Интерактивни експерименти и забавна наука.",
    city: "София", type: "focused", withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 4, max: 10 }, milestone: "learning",
  },

  // ── Детски центрове / творчески ───────────────────────────────────────────
  {
    id: "trinity_kids",
    section: "venue",
    title: "Trinity Kids 🛝",
    description: "Детски център с активности и игри.",
    city: "София", type: "group", indoor: true, withChild: true,
    energy: "medium", duration: "40-90",
    ageRange: { min: 2, max: 7 }, milestone: "play",
  },
  {
    id: "tiny_tales",
    section: "venue",
    title: "Tiny Tales ✂️",
    description: "Креативни детски работилници.",
    city: "София", type: "focused", withChild: true,
    energy: "low", duration: "20-40",
    ageRange: { min: 2, max: 6 }, milestone: "play",
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

  // Hard-exclude high-energy places when user is low-energy
  if (place.energy === "high" && filters.energy === "low") return -99;

  // Hard-exclude high-energy places when child is too young for them
  if (place.energy === "high" && childAgeMonths !== null) {
    const minAgeMonths = place.ageRange.min * 12;
    if (childAgeMonths < minAgeMonths) return -99;
  }

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

  // Weather score
  const weather = getWeatherCondition();
  score += weatherScore(place, weather);

  // Diversity penalty: if last shown place was also high-energy, reduce score
  const history = getLocalHistory();
  if (place.energy === "high" && history.length > 0) {
    const lastPlace = LOCAL_PLACES.find((p) => p.id === history[history.length - 1]);
    if (lastPlace?.energy === "high") score -= 3;
  }

  // Anti-repeat penalty
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

  const tags: string[] = [];
  if (place.energy === "high") tags.push("active", "energy");
  if (place.type === "outdoor") tags.push("outdoor");
  if (place.indoor || place.type === "indoor") tags.push("rain-friendly");

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
    tags:              tags.length > 0 ? tags : undefined,
    reason:            place.energy === "high" ? "🔥 Освободи енергия" : undefined,
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

function weatherScore(place: { type: PlaceType; indoor?: boolean }, weather: WeatherCondition): number {
  const isOutdoor  = place.type === "outdoor";
  const isIndoor   = place.type === "indoor";
  const indoorGroup = place.indoor === true;  // group type that is physically indoors

  if (weather === "rainy" && isOutdoor)     return -3;
  if (weather === "rainy" && isIndoor)      return  4;  // dedicated indoor venue
  if (weather === "rainy" && indoorGroup)   return  2;  // indoor group place (Funtopia, Area52, etc.)
  if (weather === "rainy" && place.type === "focused") return  3;
  if (weather === "rainy" && place.type === "calm")    return  2;
  if (weather === "sunny" && isOutdoor)     return  2;
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
  score += weatherScore(place, weather);

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

type ScoredPlace = LocalPlace & { score: number; travelTime: string; weather: WeatherCondition };

function buildScoredPlaces(
  section: PlaceSection,
  city: string,
  childAgeMonths: number | null,
  filters: LocalFilters,
  count: number,
): ScoredPlace[] {
  const weather = getWeatherCondition();
  return LOCAL_PLACES
    .filter((p) => p.city === city && p.section === section)
    .map((p) => ({ ...p, score: scorePlace(p, filters, city, childAgeMonths) }))
    .filter((p) => p.score > -99)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((p) => ({
      ...p,
      travelTime: p.distance !== undefined ? estimateTravelTime(p.distance) : "пеша",
      weather,
    }));
}

/** Returns top N outdoor places (parks, nature, zoo…) sorted by score. */
export function getNearbyPlaces(
  city: string | undefined,
  childAgeMonths: number | null,
  filters: LocalFilters,
  count = 3,
): ScoredPlace[] {
  if (!city) return [];
  return buildScoredPlaces("outdoor", city, childAgeMonths, filters, count);
}

/** Returns top N venues (indoor play centres, theatres, workshops…) sorted by score. */
export function getVenues(
  city: string | undefined,
  childAgeMonths: number | null,
  filters: LocalFilters,
  count = 3,
): ScoredPlace[] {
  if (!city) return [];
  return buildScoredPlaces("venue", city, childAgeMonths, filters, count);
}
