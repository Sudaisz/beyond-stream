import { NextRequest, NextResponse } from "next/server";
import { getProvider, meta } from "@/lib/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const unitId = searchParams.get("unitId");
  const provider = searchParams.get("provider") || "megaplay";
  const language = (searchParams.get("language") || "sub") as
    | "sub"
    | "dub"
    | "raw";
  const fromMeta = searchParams.get("meta") === "1";
  const episode = searchParams.get("episode");

  try {
    let result: any;

    if (fromMeta && episode) {
      const mediaId = searchParams.get("mediaId");
      if (!mediaId) {
        return NextResponse.json(
          { error: "Missing mediaId for meta stream" },
          { status: 400 }
        );
      }
      const p = getProvider(provider);
      result = await meta.resolveStream(
        mediaId,
        Number(episode),
        p,
        language
      );
    } else {
      if (!unitId) {
        return NextResponse.json(
          { error: "Missing unitId" },
          { status: 400 }
        );
      }
      const p = getProvider(provider);
      result = await p.resolveStream(unitId, language);
    }

    if (result?.type === "video" && result.streams) {
      result.streams = result.streams.map((s: any) => {
        if (s.sourceUrl && !s.sourceUrl.includes("/api/proxy")) {
          const headers = s.headers
            ? Buffer.from(JSON.stringify(s.headers)).toString("base64url")
            : "";
          return {
            ...s,
            sourceUrl: `/api/proxy?url=${encodeURIComponent(s.sourceUrl)}${
              headers ? `&h=${headers}` : ""
            }`,
            originalUrl: s.sourceUrl,
          };
        }
        return s;
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("stream error", err);
    return NextResponse.json(
      { error: err?.message || "Stream resolve failed" },
      { status: 500 }
    );
  }
}
