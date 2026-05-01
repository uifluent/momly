const LOCAL_HISTORY_KEY = "localIdeaHistory";
const HISTORY_LIMIT     = 5;

export function isWeekend(): boolean {
  return [0, 6].includes(new Date().getDay());
}

// ── Local idea / event history ─────────────────────────────────────────────

export function getLocalHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToLocalHistory(id: string): void {
  try {
    const h = getLocalHistory().filter((i) => i !== id);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify([...h, id].slice(-HISTORY_LIMIT)));
  } catch { /* quota / SSR */ }
}

// ── Favorites for local places and events ─────────────────────────────────────

const FAV_LOCAL_KEY = "favoriteLocalItems";

export function getFavoriteLocalItems(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_LOCAL_KEY) ?? "[]"); }
  catch { return []; }
}

export function toggleFavoriteLocalItem(id: string): boolean {
  try {
    const current = getFavoriteLocalItems();
    const isSaved = current.includes(id);
    localStorage.setItem(
      FAV_LOCAL_KEY,
      JSON.stringify(isSaved ? current.filter((i) => i !== id) : [...current, id]),
    );
    return !isSaved;
  } catch { return false; }
}

// ── Category preferences derived from favorited activities ─────────────────

export function getPreferredCats(
  favoriteIds: string[],
  allIdeas: { id: string; category: string[] }[],
): Set<string> {
  const cats = new Set<string>();
  for (const id of favoriteIds) {
    allIdeas.find((a) => a.id === id)?.category.forEach((c) => cats.add(c));
  }
  return cats;
}
