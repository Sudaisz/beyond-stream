import { NextRequest, NextResponse } from "next/server";
import { getProvider, meta } from "@/lib/sdk";
import { FALLBACK_ORDER, type ProviderId } from "@/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

function proxyStreams(result: any) {
  if (result?.type !== "video" || !result.streams) return result;

  result.streams = result.streams.map((s: any) => {
    const headers = s.headers
      ? Buffer.from(JSON.stringify(s.headers)).toString("base64url")
      : "";
    const hParam = headers ? `&h=${headers}` : "";

    let sourceUrl = s.sourceUrl;
    if (sourceUrl && !sourceUrl.includes("/api/proxy")) {
      sourceUrl = `/api/proxy?url=${encodeURIComponent(sourceUrl)}${hParam}`;
    }

    const subtitles = (s.subtitles || []).map((t: any) => {
      if (!t?.url || String(t.url).includes("/api/proxy")) return t;
      return {
        ...t,
        url: `/api/proxy?url=${encodeURIComponent(t.url)}${hParam}`,
      };
    });

    return {
      ...s,
      sourceUrl,
      originalUrl: s.sourceUrl,
      subtitles,
    };
  });

  return result;
}

async function resolveOne(
  provider: string,
  language: "sub" | "dub" | "raw",
  opts: { mediaId?: string; episode?: number; unitId?: string; fromMeta: boolean }
) {
  const p = getProvider(provider);
  if (opts.fromMeta && opts.mediaId && opts.episode != null) {
    return meta.resolveStream(opts.mediaId, opts.episode, p, language);
  }
  if (!opts.unitId) throw new Error("Missing unitId");
  return p.resolveStream(opts.unitId, language);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const unitId = searchParams.get("unitId");
  const preferred = (searchParams.get("provider") || "animeparadise") as ProviderId;
  const language = (searchParams.get("language") || "sub") as "sub" | "dub" | "raw";
  const fromMeta = searchParams.get("meta") === "1";
  const episode = searchParams.get("episode");
  const mediaId = searchParams.get("mediaId") || undefined;
  const tryFallback = searchParams.get("fallback") !== "0";

  const order: string[] = tryFallback
    ? [preferred, ...FALLBACK_ORDER.filter((id) => id !== preferred)]
    : [preferred];

  const errors: { provider: string; error: string }[] = [];

  for (const provider of order) {
    try {
      const result = await resolveOne(provider, language, {
        mediaId,
        episode: episode ? Number(episode) : undefined,
        unitId: unitId || undefined,
        fromMeta: fromMeta && !!mediaId && !!episode,
      });

      if (result?.type === "video" && result.streams?.length) {
        const proxied = proxyStreams(result);
        return NextResponse.json({
          ...proxied,
          provider,
          tried: errors,
        });
      }

      errors.push({ provider, error: "No playable streams" });
    } catch (err: any) {
      errors.push({
        provider,
        error: err?.message || "Stream resolve failed",
      });
    }
  }

  return NextResponse.json(
    {
      error: "All sources failed",
      details: errors,
    },
    { status: 502 }
  );
}
