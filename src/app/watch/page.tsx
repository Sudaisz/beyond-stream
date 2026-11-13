"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Hls from "hls.js";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { addToHistory } from "@/lib/storage";

type Stream = {
  sourceUrl: string;
  isHLS: boolean;
  quality: string;
  language?: string;
  subtitles?: { url: string; language: string; label: string }[];
};

type Episode = {
  id: string;
  title: string;
  number: number;
  availableLanguages: string[];
};

function WatchContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const mediaId = sp.get("id") || "";
  const provider = sp.get("provider") || "megaplay";
  const epNum = Number(sp.get("ep") || 1);
  const unitId = sp.get("uid") || "";
  const title = sp.get("title") || "Episode";
  const image = sp.get("img") || undefined;

  const [streams, setStreams] = useState<Stream[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lang, setLang] = useState<"sub" | "dub" | "raw">("sub");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const isMeta = mediaId.startsWith("anilist:") || /^\d+$/.test(mediaId);

  useEffect(() => {
    if (!mediaId) return;
    const params = new URLSearchParams({ mediaId, provider });
    if (isMeta) params.set("meta", "1");
    fetch(`/api/content?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEpisodes(data);
      })
      .catch(console.error);
  }, [mediaId, provider, isMeta]);

  useEffect(() => {
    if (!mediaId && !unitId) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      provider,
      language: lang,
    });

    if (isMeta) {
      params.set("meta", "1");
      params.set("mediaId", mediaId.startsWith("anilist:") ? mediaId : `anilist:${mediaId}`);
      params.set("episode", String(epNum));
    } else if (unitId) {
      params.set("unitId", unitId);
    } else {
      setError("Missing episode info");
      setLoading(false);
      return;
    }

    fetch(`/api/stream?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        if (data.type === "video" && data.streams?.length) {
          setStreams(data.streams);
          setActiveIdx(0);
        } else {
          setStreams([]);
          setError("No playable streams found");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mediaId, unitId, provider, lang, epNum, isMeta]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streams[activeIdx];
    if (!video || !stream) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (stream.isHLS && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(stream.sourceUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError(`Playback error: ${data.details}`);
        }
      });
      hlsRef.current = hls;
    } else {
      video.src = stream.sourceUrl;
      video.play().catch(() => {});
    }

    addToHistory({
      id: mediaId,
      title: title || `Episode ${epNum}`,
      image,
      provider,
      episodeId: unitId || `${mediaId}/${epNum}`,
      episodeNumber: epNum,
    });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [streams, activeIdx, mediaId, title, image, provider, unitId, epNum]);

  const currentIdx = episodes.findIndex((e) => e.number === epNum);
  const prevEp = currentIdx > 0 ? episodes[currentIdx - 1] : null;
  const nextEp =
    currentIdx >= 0 && currentIdx < episodes.length - 1
      ? episodes[currentIdx + 1]
      : null;

  const goEp = (ep: Episode) => {
    const q = new URLSearchParams({
      id: mediaId,
      provider,
      ep: String(ep.number),
      uid: ep.id,
      title,
    });
    if (image) q.set("img", image);
    router.push(`/watch?${q}`);
  };

  const availableLangs =
    episodes.find((e) => e.number === epNum)?.availableLanguages || ["sub"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={
            mediaId.startsWith("anilist:") || /^\d+$/.test(mediaId)
              ? `/anime/${mediaId.replace("anilist:", "")}`
              : `/anime/${encodeURIComponent(mediaId)}?provider=${provider}`
          }
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-brand-500"
        >
          <ChevronLeft className="h-4 w-4" /> Back to episodes
        </Link>
        <h1 className="truncate text-sm font-medium sm:text-base">
          {title} — EP {epNum}
        </h1>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--card-border)] bg-black">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}
        <video
          ref={videoRef}
          controls
          playsInline
          className={`h-full w-full ${loading || error ? "opacity-0" : ""}`}
          crossOrigin="anonymous"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {availableLangs.length > 1 &&
            availableLangs.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase transition ${
                  lang === l
                    ? "bg-brand-500 text-white"
                    : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {l}
              </button>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={!prevEp}
            onClick={() => prevEp && goEp(prevEp)}
            className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <button
            disabled={!nextEp}
            onClick={() => nextEp && goEp(nextEp)}
            className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {streams.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Sources
          </h3>
          <div className="flex flex-wrap gap-2">
            {streams.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  i === activeIdx
                    ? "border-brand-500 bg-brand-500/15 text-brand-500"
                    : "border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                {s.quality || `Server ${i + 1}`} {s.isHLS ? "HLS" : "MP4"}
              </button>
            ))}
          </div>
        </div>
      )}

      {episodes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Episodes
          </h3>
          <div className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-6 md:grid-cols-8">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => goEp(ep)}
                className={`rounded-lg py-2 text-center text-sm transition ${
                  ep.number === epNum
                    ? "bg-brand-500 text-white"
                    : "bg-[var(--card)] text-[var(--muted)] hover:bg-brand-500/10"
                }`}
              >
                {ep.number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
