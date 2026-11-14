"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Hls from "hls.js";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  SkipForward,
} from "lucide-react";
import { addToHistory } from "@/lib/storage";
import {
  PROVIDER_LIST,
  DEFAULT_PROVIDER,
  type ProviderId,
} from "@/lib/providers";

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
  const providerParam = (sp.get("provider") || DEFAULT_PROVIDER) as ProviderId;
  const epNum = Number(sp.get("ep") || 1);
  const unitId = sp.get("uid") || "";
  const title = sp.get("title") || "Episode";
  const image = sp.get("img") || undefined;

  const [provider, setProvider] = useState<ProviderId>(providerParam);
  const [activeProvider, setActiveProvider] = useState<string>(providerParam);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lang, setLang] = useState<"sub" | "dub" | "raw">("sub");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoNext, setAutoNext] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const isMeta = mediaId.startsWith("anilist:") || /^\d+$/.test(mediaId);
  const metaId = mediaId.startsWith("anilist:")
    ? mediaId
    : isMeta
      ? `anilist:${mediaId}`
      : mediaId;

  useEffect(() => {
    if (!mediaId) return;
    const params = new URLSearchParams({ mediaId: metaId, provider });
    if (isMeta) params.set("meta", "1");
    fetch(`/api/content?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEpisodes(data);
      })
      .catch(console.error);
  }, [mediaId, metaId, provider, isMeta]);

  useEffect(() => {
    if (!mediaId && !unitId) return;
    setLoading(true);
    setError(null);
    setStreams([]);

    const params = new URLSearchParams({
      provider,
      language: lang,
    });

    if (isMeta) {
      params.set("meta", "1");
      params.set("mediaId", metaId);
      params.set("episode", String(epNum));
    } else if (unitId) {
      params.set("unitId", unitId);
      params.set("fallback", "0");
    } else {
      setError("Missing episode info");
      setLoading(false);
      return;
    }

    fetch(`/api/stream?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error && !data.streams?.length) {
          throw new Error(
            data.error +
              (data.details?.length
                ? ` (${data.details.map((d: any) => d.provider).join(", ")})`
                : "")
          );
        }
        if (data.type === "video" && data.streams?.length) {
          setStreams(data.streams);
          setActiveIdx(0);
          if (data.provider) setActiveProvider(data.provider);
        } else {
          setStreams([]);
          setError("No playable streams found. Try another server.");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mediaId, metaId, unitId, provider, lang, epNum, isMeta]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streams[activeIdx];
    if (!video || !stream) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // clear old tracks
    while (video.firstChild) video.removeChild(video.firstChild);

    if (stream.isHLS && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(stream.sourceUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError(`Playback error: ${data.details}. Try another server.`);
        }
      });
      hlsRef.current = hls;
    } else {
      video.src = stream.sourceUrl;
      video.play().catch(() => {});
    }

    // external subtitles
    (stream.subtitles || []).forEach((t) => {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = t.label || t.language;
      track.srclang = t.language || "en";
      track.src = t.url;
      if ((t.language || "").startsWith("en")) track.default = true;
      video.appendChild(track);
    });

    addToHistory({
      id: mediaId,
      title: title || `Episode ${epNum}`,
      image,
      provider: activeProvider || provider,
      episodeId: unitId || `${mediaId}/${epNum}`,
      episodeNumber: epNum,
    });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [streams, activeIdx, mediaId, title, image, provider, activeProvider, unitId, epNum]);

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

  const onEnded = () => {
    if (autoNext && nextEp) goEp(nextEp);
  };

  const switchServer = (id: ProviderId) => {
    setProvider(id);
    const q = new URLSearchParams(sp.toString());
    q.set("provider", id);
    router.replace(`/watch?${q}`);
  };

  const backHref =
    mediaId.startsWith("anilist:") || /^\d+$/.test(mediaId)
      ? `/anime/${mediaId.replace("anilist:", "")}`
      : `/anime/${encodeURIComponent(mediaId)}?provider=${provider}`;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-brand-500"
        >
          <ChevronLeft className="h-4 w-4" /> Back to episodes
        </Link>
        <h1 className="truncate text-sm font-semibold sm:text-base">
          {title}{" "}
          <span className="text-brand-500">· EP {epNum}</span>
        </h1>
      </div>

      {/* Player */}
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-[var(--card-border)] bg-black shadow-xl shadow-black/40">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70">
            <Loader2 className="h-9 w-9 animate-spin text-brand-500" />
            <p className="text-xs text-zinc-400">Finding a working server…</p>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-red-400">
            {error}
          </div>
        )}
        <video
          ref={videoRef}
          controls
          playsInline
          onEnded={onEnded}
          className={`h-full w-full ${loading || error ? "opacity-0" : ""}`}
          crossOrigin="anonymous"
        />
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1.5 rounded-lg bg-[var(--card)] px-2.5 py-1.5 text-[var(--muted)]">
          <input
            type="checkbox"
            checked={autoNext}
            onChange={(e) => setAutoNext(e.target.checked)}
            className="rounded"
          />
          Auto Next
        </label>
        <button
          disabled={!nextEp}
          onClick={() => nextEp && goEp(nextEp)}
          className="flex items-center gap-1 rounded-lg bg-[var(--card)] px-2.5 py-1.5 text-[var(--muted)] disabled:opacity-30"
        >
          <SkipForward className="h-3.5 w-3.5" /> Next
        </button>
        <button
          disabled={!prevEp}
          onClick={() => prevEp && goEp(prevEp)}
          className="flex items-center gap-1 rounded-lg bg-[var(--card)] px-2.5 py-1.5 text-[var(--muted)] disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
      </div>

      <p className="text-sm text-[var(--muted)]">
        You're watching{" "}
        <span className="font-medium text-brand-500">Episode {epNum}</span>.
        If this server doesn't work, try another below.
        {activeProvider && (
          <>
            {" "}
            Active:{" "}
            <span className="text-[var(--foreground)]">{activeProvider}</span>
          </>
        )}
      </p>

      {/* SUB / DUB */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Audio
        </div>
        <div className="flex flex-wrap gap-2">
          {(["sub", "dub"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold uppercase transition ${
                lang === l
                  ? "bg-brand-500 text-white"
                  : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Servers HD-1 / HD-2 … */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Servers
        </div>
        <div className="flex flex-wrap gap-2">
          {PROVIDER_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => switchServer(p.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                provider === p.id
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:border-brand-500/40 hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-xs opacity-80">▶</span>
              {p.serverLabel}
              <span className="hidden text-xs opacity-60 sm:inline">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quality variants within a provider */}
      {streams.length > 1 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Quality
          </div>
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
                {s.quality || `Stream ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episodes */}
      {episodes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Episodes ({episodes.length})
          </div>
          <div className="grid max-h-72 grid-cols-5 gap-1.5 overflow-y-auto sm:grid-cols-8 md:grid-cols-10">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => goEp(ep)}
                className={`rounded-lg py-2.5 text-center text-sm font-medium transition ${
                  ep.number === epNum
                    ? "bg-brand-500 text-white"
                    : "bg-[var(--card)] text-[var(--muted)] hover:bg-brand-500/15"
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
