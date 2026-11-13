"use client";

export interface FavoriteItem {
  id: string;
  title: string;
  image?: string;
  provider?: string;
  addedAt: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  image?: string;
  provider: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle?: string;
  progress?: number;
  watchedAt: number;
}

const FAVORITES_KEY = "bs_favorites";
const HISTORY_KEY = "bs_history";
const THEME_KEY = "bs_theme";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(FAVORITES_KEY), []);
}

export function addFavorite(item: Omit<FavoriteItem, "addedAt">) {
  const list = getFavorites().filter((f) => f.id !== item.id);
  list.unshift({ ...item, addedAt: Date.now() });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list.slice(0, 100)));
  return list;
}

export function removeFavorite(id: string) {
  const list = getFavorites().filter((f) => f.id !== id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  return list;
}

export function isFavorite(id: string) {
  return getFavorites().some((f) => f.id === id);
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(HISTORY_KEY), []);
}

export function addToHistory(item: Omit<HistoryItem, "watchedAt">) {
  const list = getHistory().filter(
    (h) => !(h.id === item.id && h.episodeId === item.episodeId)
  );
  list.unshift({ ...item, watchedAt: Date.now() });
  const seen = new Set<string>();
  const deduped: HistoryItem[] = [];
  for (const h of list) {
    if (!seen.has(h.id)) {
      seen.add(h.id);
      deduped.push(h);
    }
    if (deduped.length >= 50) break;
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(deduped));
  return deduped;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as "light" | "dark") || "dark";
}

export function setTheme(theme: "light" | "dark") {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}
