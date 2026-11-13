import { NextRequest, NextResponse } from "next/server";
import { getProvider, meta } from "@/lib/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const provider = searchParams.get("provider") || "megaplay";
  const useMeta = searchParams.get("meta") === "1";

  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  try {
    if (useMeta) {
      // CallOptions has no catalogType — filter results after search
      const results = await meta.search(q);
      const anime = results.filter(
        (r) =>
          r.catalogType === "ANIME" ||
          r.catalogType === "TV" ||
          r.catalogType === "MOVIE"
      );
      return NextResponse.json(
        anime.map((r) => ({
          id: r.id,
          title:
            r.title?.english ||
            r.title?.romaji ||
            r.title?.userPreferred ||
            r.title?.native ||
            "Unknown",
          image: r.cover?.large || r.cover?.medium || r.cover?.small,
          catalogType: r.catalogType || "ANIME",
          score: (r as any).score,
          status: (r as any).status,
          year: (r as any).year,
        }))
      );
    }

    const p = getProvider(provider);
    const results = await p.search(q);
    return NextResponse.json(
      results
        .filter((r) => r.catalogType === "ANIME" || !r.catalogType)
        .map((r) => ({
          id: r.id,
          title: r.title,
          image: r.thumbnailUrl,
          catalogType: r.catalogType || "ANIME",
          availableLanguages: r.availableLanguages,
        }))
    );
  } catch (err: any) {
    console.error("search error", err);
    return NextResponse.json(
      { error: err?.message || "Search failed" },
      { status: 500 }
    );
  }
}
