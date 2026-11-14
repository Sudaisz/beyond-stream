import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]"
  ) {
    return true;
  }
  if (host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("169.254.")) {
    return true;
  }
  // 172.16.0.0 – 172.31.255.255
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

function proxyLine(target: string, h: string | null) {
  return `/api/proxy?url=${encodeURIComponent(target)}${h ? `&h=${h}` : ""}`;
}

function rewritePlaylist(text: string, baseUrl: string, h: string | null) {
  const base = new URL(baseUrl);

  const toAbsolute = (ref: string) => {
    try {
      return new URL(ref, base).href;
    } catch {
      return ref;
    }
  };

  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Rewrite URI="..." attributes inside tags (KEY, MAP, MEDIA, I-FRAME, etc.)
      if (trimmed.startsWith("#") && /URI="[^"]+"/i.test(trimmed)) {
        return trimmed.replace(/URI="([^"]+)"/gi, (_m, uri: string) => {
          if (uri.startsWith("/api/proxy")) return `URI="${uri}"`;
          return `URI="${proxyLine(toAbsolute(uri), h)}"`;
        });
      }

      if (trimmed.startsWith("#")) return line;

      // Already proxied
      if (trimmed.startsWith("/api/proxy")) return line;

      const absolute = toAbsolute(trimmed);
      return proxyLine(absolute, h);
    })
    .join("\n");
}

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
    if (isBlockedHost(parsed.hostname)) {
      return NextResponse.json({ error: "Blocked host" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
        ...headers,
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
    const ct = contentType.toLowerCase();

    // Peek body for playlist sniffing when content-type is wrong/missing
    const buf = Buffer.from(await upstream.arrayBuffer());
    const head = buf.subarray(0, 64).toString("utf8").trimStart();
    const looksLikePlaylist =
      head.startsWith("#EXTM3U") ||
      ct.includes("mpegurl") ||
      ct.includes("m3u8") ||
      /\/m3u8(\?|$)/i.test(url) ||
      /\.m3u8(\?|$)/i.test(url);

    if (looksLikePlaylist) {
      const text = buf.toString("utf8");
      const rewritten = rewritePlaylist(text, url, h);
      return new NextResponse(rewritten, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=15",
        },
      });
    }

    return new NextResponse(buf, {
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
