export type ProviderId =
  | "animeparadise"
  | "allmanga"
  | "gogoanime"
  | "anikoto"
  | "megaplay";

/** Prefer AnimeParadise — currently the most reliable stream source. */
export const PROVIDER_LIST: {
  id: ProviderId;
  label: string;
  serverLabel: string;
}[] = [
  { id: "animeparadise", label: "AnimeParadise", serverLabel: "HD-1" },
  { id: "allmanga", label: "AllManga", serverLabel: "HD-2" },
  { id: "gogoanime", label: "GogoAnime", serverLabel: "HD-3" },
  { id: "anikoto", label: "AniKoto", serverLabel: "HD-4" },
  { id: "megaplay", label: "MegaPlay", serverLabel: "HD-5" },
];

export const DEFAULT_PROVIDER: ProviderId = "animeparadise";

/** Order used when auto-trying sources after a failure. */
export const FALLBACK_ORDER: ProviderId[] = PROVIDER_LIST.map((p) => p.id);
