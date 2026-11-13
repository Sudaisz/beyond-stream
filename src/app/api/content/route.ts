import { NextRequest, NextResponse } from "next/server";
import { getProvider, meta } from "@/lib/sdk";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mediaId = searchParams.get("mediaId");
  const provider = searchParams.get("provider") || "megaplay";
  const fromMeta = searchParams.get("meta") === "1";

  if (!mediaId) {
    return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
  }

  try {
    if (fromMeta) {
      const p = getProvider(provider);
      const units = await meta.fetchContentUnits(mediaId, p);
      return NextResponse.json(
        units.map((u) => ({
          id: u.id,
          title: u.title,
          number: u.number,
          availableLanguages: u.availableLanguages || ["sub"],
        }))
      );
    }

    const p = getProvider(provider);
    const units = await p.fetchContentUnits(mediaId);
    return NextResponse.json(
      units.map((u) => ({
        id: u.id,
        title: u.title,
        number: u.number,
        availableLanguages: u.availableLanguages || ["sub"],
      }))
    );
  } catch (err: any) {
    console.error("content error", err);
    return NextResponse.json(
      { error: err?.message || "Content failed" },
      { status: 500 }
    );
  }
}
