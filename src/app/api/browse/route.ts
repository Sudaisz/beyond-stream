import { NextRequest, NextResponse } from "next/server";
import { meta } from "@/lib/sdk";

export const runtime = "nodejs";
export const maxDuration = 25;

export async function GET(req: NextRequest) {
  const type = (req.nextUrl.searchParams.get("type") || "trending") as
    | "trending"
    | "popular"
    | "seasonal"
    | "top";

  try {
    const results = await meta.browse(type, {
      catalogType: "ANIME",
      perPage: 24,
    });

    return NextResponse.json(
      results.map((r) => ({
        id: r.id,
        title:
          r.title?.english ||
          r.title?.romaji ||
          r.title?.userPreferred ||
          r.title?.native ||
          "Unknown",
        image: r.cover?.large || r.cover?.medium || r.cover?.small,
        score: (r as any).score,
        status: (r as any).status,
        year: (r as any).year,
        episodes: (r as any).episodeCount,
        format: (r as any).format,
      }))
    );
  } catch (err: any) {
    console.error("browse error", err);
    return NextResponse.json(
      { error: err?.message || "Browse failed" },
      { status: 500 }
    );
  }
}
