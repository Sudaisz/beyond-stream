import { NextRequest, NextResponse } from "next/server";
import { meta } from "@/lib/sdk";

export const runtime = "nodejs";
export const maxDuration = 25;

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "trending";

  try {
    let results: any[] = [];

    if (type === "trending") {
      results = await meta.browse("trending", {
        catalogType: "ANIME",
        perPage: 24,
      });
    } else if (type === "popular") {
      results = await meta.browse("popular", {
        catalogType: "ANIME",
        perPage: 24,
      });
    } else if (type === "seasonal") {
      results = await meta.browse("seasonal", {
        catalogType: "ANIME",
        perPage: 24,
      });
    } else if (type === "top") {
      results = await meta.browse("top", {
        catalogType: "ANIME",
        perPage: 24,
      });
    }

    return NextResponse.json(
      results.map((r) => ({
        id: r.id,
        title:
          r.title?.english || r.title?.romaji || r.title?.native || "Unknown",
        image: r.coverImage?.large || r.coverImage?.medium,
        score: r.averageScore,
        status: r.status,
        year: r.seasonYear,
        episodes: r.episodes,
        format: r.format,
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
