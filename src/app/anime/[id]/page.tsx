"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Play, ChevronLeft } from "lucide-react";
import {
  addFavorite,
  removeFavorite,
  isFavorite,
} from "@/lib/storage";
import { PROVIDER_LIST, type ProviderId } from "@/lib/providers";

type Info = {
  id: string;
  title: string;
  titleRomaji?: string;
  image?: string;
  banner?: string;
  description?: string;
  score?: number;
  status?: string;
  episodes?: number;
  year?: number;
  season?: string;
  format?: string;
  genres?: string[];
  studios?: string[];
};

type Episode = {
  id: string;
  title: string;
  number: number;
  availableLanguages: string[];
};

function AnimeContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawId = params.id as string;
  const providerParam = searchParams.get("provider") as ProviderId | null;

  const [info, setInfo] = useState<Info | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [provider, setProvider] = useState<ProviderId>(
    providerParam || "megaplay"
  );
  const [loading, setLoading] = useState(true);
  const [epLoading, setEpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fav, setFav] = useState(false);

  const anilistId = rawId.match(/^\d+$/) ? rawId : null;
  const mediaUrn = anilistId ? `anilist:${anilistId}` : decodeURIComponent(rawId);

  useEffect(() => {
    setFav(isFavorite(mediaUrn) || isFavorite(rawId));
  }, [mediaUrn, rawId]);

  useEffect(() => {
    if (!anilistId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/info?id=${anilistId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setInfo(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [anilistId]);

  useEffect(() => {
    setEpLoading(true);
    const params = new URLSearchParams({
      mediaId: mediaUrn,
      provider,
    });
    if (anilistId) params.set("meta", "1");

    fetch(`/api/content?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEpisodes(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        setEpisodes([]);
      })
      .finally(() => setEpLoading(false));
  }, [mediaUrn, provider, anilistId]);

  const toggleFav = () => {
    if (!info && !rawId) return;
    const id = mediaUrn;
    const title = info?.title || decodeURIComponent(rawId);
    const image = info?.image;
    if (fav) {
      removeFavorite(id);
      setFav(false);
    } else {
      addFavorite({ id, title, image, provider });
      setFav(true);
    }
  };

  const watchEp = (ep: Episode) => {
    const q = new URLSearchParams({
      id: mediaUrn,
      provider,
      ep: String(ep.number),
      uid: ep.id,
      title: info?.title || "",
    });
    if (info?.image) q.set("img", info.image);
    router.push(`/watch?${q}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-brand-500"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-xl border border-[var(--card-border)] sm:mx-0 sm:w-48">
          {info?.image ? (
            <Image
              src={info.image}
              alt={info.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[var(--card)] text-[var(--muted)]">
              No Image
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {info?.title || decodeURIComponent(rawId)}
          </h1>
          {info?.titleRomaji && info.titleRomaji !== info.title && (
            <p className="text-[var(--muted)]">{info.titleRomaji}</p>
          )}

          <div className="flex flex-wrap gap-2 text-sm">
            {info?.score && (
              <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-brand-500">
                ★ {(info.score / 10).toFixed(1)}
              </span>
            )}
            {info?.year && (
              <span className="rounded-full bg-[var(--card)] px-2.5 py-0.5 text-[var(--muted)]">
                {info.year}
              </span>
            )}
            {info?.status && (
              <span className="rounded-full bg-[var(--card)] px-2.5 py-0.5 text-[var(--muted)]">
                {info.status}
              </span>
            )}
            {info?.episodes && (
              <span className="rounded-full bg-[var(--card)] px-2.5 py-0.5 text-[var(--muted)]">
                {info.episodes} eps
              </span>
            )}
            {info?.format && (
              <span className="rounded-full bg-[var(--card)] px-2.5 py-0.5 text-[var(--muted)]">
                {info.format}
              </span>
            )}
          </div>

          {info?.genres && info.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {info.genres.map((g) => (
                <span
                  key={g}
                  className="rounded border border-[var(--card-border)] px-2 py-0.5 text-xs text-[var(--muted)]"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {info?.description && (
            <p className="line-clamp-4 text-sm leading-relaxed text-[var(--muted)]">
              {info.description}
            </p>
          )}

          <button
            onClick={toggleFav}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              fav
                ? "bg-red-500/15 text-red-500"
                : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
            {fav ? "Favorited" : "Add to Favorites"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">Source</h2>
        <div className="flex flex-wrap gap-2">
          {PROVIDER_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition ${
                provider === p.id
                  ? "border-brand-500 bg-brand-500/15 text-brand-500"
                  : "border-[var(--card-border)] text-[var(--muted)] hover:border-brand-500/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Episodes{" "}
          <span className="text-sm font-normal text-[var(--muted)]">
            ({episodes.length})
          </span>
        </h2>

        {epLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : episodes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--card-border)] py-10 text-center text-[var(--muted)]">
            No episodes found for this source. Try another provider.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => watchEp(ep)}
                className="group flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-left transition hover:border-brand-500/50 hover:bg-brand-500/5"
              >
                <Play className="h-3.5 w-3.5 shrink-0 text-brand-500 opacity-0 transition group-hover:opacity-100" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">EP {ep.number}</div>
                  {ep.title && ep.title !== `Episode ${ep.number}` && (
                    <div className="truncate text-xs text-[var(--muted)]">
                      {ep.title}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnimePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <AnimeContent />
    </Suspense>
  );
}
