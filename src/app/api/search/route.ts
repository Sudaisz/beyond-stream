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
      const results = await meta.search(q, { catalogType: "ANIME" });
      return NextResponse.json(
        results.map((r) => ({
          id: r.id,
          title: r.title?.english || r.title?.romaji || r.title?.native || "Unknown",
          image: r.coverImage?.large || r.coverImage?.medium,
          catalogType: "ANIME",
          score: r.averageScore,
          status: r.status,
          year: r.seasonYear,
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
