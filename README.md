# Beyond Stream

Anime streaming site powered by [anime-sdk](https://github.com/hexxt-git/anime-sdk).

## Features

- Search anime (AniList metadata + multiple content providers)
- Trending / Popular browse
- Episode list + HLS/MP4 player with proxy
- Sub / Dub language switch
- Favorites (localStorage)
- Continue watching / History (localStorage)
- Light & Dark theme toggle
- Multiple sources: MegaPlay, AllManga, AnimeParadise, AniKoto, GogoAnime

## Tech

- Next.js 15 (App Router)
- Tailwind CSS
- anime-sdk
- hls.js

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy

Connected to Vercel. Push to `main` to deploy.

## Notes

- Streams are proxied through `/api/proxy` so browsers can play CDN content that requires Referer headers.
- Favorites and history are stored in the browser (localStorage). No account required.
- Some providers may be rate-limited or temporarily unavailable.
