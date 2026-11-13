import { NextRequest, NextResponse } from "next/server";
import { meta } from "@/lib/sdk";

export const runtime = "nodejs";
export const maxDuration = 25;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const urn = id.startsWith("anilist:") ? id : `anilist:${id}`;
    const info = await meta.fetchMediaInfo(urn);

    return NextResponse.json({
      id: info.id,
      title:
        info.title?.english ||
        info.title?.romaji ||
        info.title?.userPreferred ||
        info.title?.native ||
        "Unknown",
      titleRomaji: info.title?.romaji,
      titleNative: info.title?.native,
      image: info.cover?.large || info.cover?.medium || info.cover?.small,
      banner: info.banner,
      description: info.description?.replace(/<[^>]+>/g, "") || "",
      score: info.score,
      status: info.status,
      episodes: info.episodeCount,
      duration: info.durationMinutes,
      year: info.year,
      season: info.season,
      format: info.format,
      genres: info.genres || [],
      studios: info.studios || [],
      streamingEpisodes: info.streamingEpisodes || [],
    });
  } catch (err: any) {
    console.error("info error", err);
    return NextResponse.json(
      { error: err?.message || "Info failed" },
      { status: 500 }
    );
  }
}
