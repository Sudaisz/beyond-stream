import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const h = req.nextUrl.searchParams.get("h");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let headers: Record<string, string> = {};
  if (h) {
    try {
      headers = JSON.parse(Buffer.from(h, "base64url").toString("utf8"));
    } catch {
      // ignore bad headers
    }
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "10.", "192.168."];
    if (blocked.some((b) => host.startsWith(b) || host === b)) {
      return NextResponse.json({ error: "Blocked host" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        ...headers,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    if (
      contentType.includes("mpegurl") ||
      contentType.includes("m3u8") ||
      url.includes(".m3u8")
    ) {
      let text = await upstream.text();
      const base = new URL(url);
      text = text
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (
            !trimmed ||
            trimmed.startsWith("#") ||
            trimmed.startsWith("http")
          ) {
            if (trimmed.startsWith("http")) {
              return `/api/proxy?url=${encodeURIComponent(trimmed)}${
                h ? `&h=${h}` : ""
              }`;
            }
            return line;
          }
          const absolute = new URL(trimmed, base).href;
          return `/api/proxy?url=${encodeURIComponent(absolute)}${
            h ? `&h=${h}` : ""
          }`;
        })
        .join("\n");

      return new NextResponse(text, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=30",
        },
      });
    }

    const body = upstream.body;
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("proxy error", err);
    return NextResponse.json(
      { error: err?.message || "Proxy failed" },
      { status: 502 }
    );
  }
}
