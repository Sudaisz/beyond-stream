export type ProviderId =
  | "megaplay"
  | "allmanga"
  | "animeparadise"
  | "anikoto"
  | "gogoanime";

export const PROVIDER_LIST: { id: ProviderId; label: string }[] = [
  { id: "megaplay", label: "MegaPlay" },
  { id: "allmanga", label: "AllManga" },
  { id: "animeparadise", label: "AnimeParadise" },
  { id: "anikoto", label: "AniKoto" },
  { id: "gogoanime", label: "GogoAnime" },
];
