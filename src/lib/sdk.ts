import "server-only";

import {
  HttpClient,
  AnilistMeta,
  MappingClient,
  MegaPlayProvider,
  AllmangaProvider,
  AnimeParadiseProvider,
  AnikotoProvider,
  GogoanimeProvider,
} from "anime-sdk";

import type { ProviderId } from "./providers";

const http = new HttpClient({ timeoutMs: 25_000 });
const mapping = new MappingClient(http);

export const meta = new AnilistMeta(http, { mappingClient: mapping });

export const providers = {
  megaplay: new MegaPlayProvider(http),
  allmanga: new AllmangaProvider(http),
  animeparadise: new AnimeParadiseProvider(http),
  anikoto: new AnikotoProvider(http),
  gogoanime: new GogoanimeProvider(http),
} as const;

export function getProvider(id: string) {
  const p = providers[id as ProviderId];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}
