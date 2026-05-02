import type { EnergyLevel, Duration } from "./types";
import { isWeekend, getLocalHistory } from "./sessionPrefs";

export interface LocalIdea {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: Duration;
  energy: EnergyLevel[];
  withChild: boolean;
}

export interface LocalFilters {
  time?: Duration;
  energy?: EnergyLevel;
  ctx?: "alone" | "child";
}

export const LOCAL_IDEAS: LocalIdea[] = [
  // ── София ──────────────────────────────────────────────────────────────────
  {
    id: "sof-1",
    title: "Разходка в Южния парк 🌿",
    description: "Спокойна алея, добра за малки деца и бавни крачки.",
    location: "София",
    duration: "short",
    energy: ["low", "medium"],
    withChild: true,
  },
  {
    id: "sof-2",
    title: "Борисовата градина 🌳",
    description: "Велоалея, пейки и свеж въздух без много хора.",
    location: "София",
    duration: "medium",
    energy: ["medium", "high"],
    withChild: false,
  },
  {
    id: "sof-3",
    title: "Кристалният парк 🦆",
    description: "Патици, езерце и тишина — за двамата.",
    location: "София",
    duration: "short",
    energy: ["low"],
    withChild: true,
  },
  {
    id: "sof-4",
    title: "Столична библиотека 📚",
    description: "Детски кът с книжки и игри — топло и безплатно.",
    location: "София",
    duration: "medium",
    energy: ["low", "medium"],
    withChild: true,
  },
  {
    id: "sof-5",
    title: "Разходка из Докторска градина 🌸",
    description: "Малка и уютна, в центъра на града.",
    location: "София",
    duration: "short",
    energy: ["low"],
    withChild: false,
  },
  {
    id: "sof-6",
    title: "Витоша — хижа Алеко ⛰️",
    description: "Хубав излет за когато имаш енергия и нямаш бързане.",
    location: "София",
    duration: "long",
    energy: ["high"],
    withChild: false,
  },
  {
    id: "sof-7",
    title: "НДК и фонтана 💦",
    description: "Детето се радва на фонтана, ти — на кафе наблизо.",
    location: "София",
    duration: "short",
    energy: ["medium"],
    withChild: true,
  },

  // ── Пловдив ────────────────────────────────────────────────────────────────
  {
    id: "plv-1",
    title: "Старият град 🏛️",
    description: "Разходка по калдъръма — красиво и без усилие.",
    location: "Пловдив",
    duration: "medium",
    energy: ["medium"],
    withChild: false,
  },
  {
    id: "plv-2",
    title: "Парк Лаута 🌿",
    description: "Езерце, патици и детски кът.",
    location: "Пловдив",
    duration: "short",
    energy: ["low", "medium"],
    withChild: true,
  },
  {
    id: "plv-3",
    title: "Тепетата 🌄",
    description: "Кратко изкачване с хубава гледка.",
    location: "Пловдив",
    duration: "short",
    energy: ["medium", "high"],
    withChild: false,
  },

  // ── Варна ──────────────────────────────────────────────────────────────────
  {
    id: "vna-1",
    title: "Морската градина 🌊",
    description: "Разходка край брега — свеж въздух и тишина.",
    location: "Варна",
    duration: "medium",
    energy: ["low", "medium"],
    withChild: false,
  },
  {
    id: "vna-2",
    title: "Приморски парк 🌳",
    description: "Алеи, детски площадки и сянка.",
    location: "Варна",
    duration: "short",
    energy: ["low", "medium"],
    withChild: true,
  },
  {
    id: "vna-3",
    title: "Делфинариумът 🐬",
    description: "Шоу за деца — вълнуващо и лесно за организиране.",
    location: "Варна",
    duration: "medium",
    energy: ["medium"],
    withChild: true,
  },

  // ── Бургас ─────────────────────────────────────────────────────────────────
  {
    id: "bgs-1",
    title: "Езерото Атанасовско 🦩",
    description: "Розови фламинга и спокойствие — природа без тълпи.",
    location: "Бургас",
    duration: "medium",
    energy: ["low", "medium"],
    withChild: false,
  },
  {
    id: "bgs-2",
    title: "Морска градина Бургас 🌿",
    description: "Люлки, алея и свеж бриз.",
    location: "Бургас",
    duration: "short",
    energy: ["low"],
    withChild: true,
  },

  // ── Велико Търново ─────────────────────────────────────────────────────────
  {
    id: "vt-1",
    title: "Царевец 🏰",
    description: "Разходка с история — магично за малкото.",
    location: "Велико Търново",
    duration: "medium",
    energy: ["medium"],
    withChild: true,
  },
  {
    id: "vt-2",
    title: "Алея край Янтра 🌊",
    description: "Спокойна разходка покрай реката.",
    location: "Велико Търново",
    duration: "short",
    energy: ["low"],
    withChild: false,
  },

  // ── Пловдив допълнителни ───────────────────────────────────────────────────
  {
    id: "plv-4",
    title: "Парк Бескид 🎠",
    description: "Люлки и пързалки за малки деца.",
    location: "Пловдив",
    duration: "short",
    energy: ["low"],
    withChild: true,
  },
];

function scoreIdea(idea: LocalIdea, filters: LocalFilters, city: string): number {
  let score = 0;

  if (idea.location === city)                                          score += 3;
  if (filters.time   && idea.duration === filters.time)                score += 2;
  if (filters.energy && idea.energy.includes(filters.energy))          score += 2;
  else if (filters.energy && idea.energy.includes("medium"))           score += 1;
  if (filters.ctx    && idea.withChild === (filters.ctx === "child"))   score += 3;

  // Weekend boost: longer outdoor-style activities score higher on weekends
  if (isWeekend() && idea.duration !== "short")                        score += 2;

  return score;
}

export function getLocalIdea(
  filters: LocalFilters,
  city: string | undefined,
): (LocalIdea & { score: number }) | null {
  if (!city) return null;

  const history = getLocalHistory();

  const scored = LOCAL_IDEAS
    .map((idea) => ({
      ...idea,
      score: scoreIdea(idea, filters, city) - (history.includes(idea.id) ? 4 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const top2 = scored.slice(0, 2);
  if (top2[0].score < 5) return null;

  return top2[Math.floor(Math.random() * top2.length)];
}
