"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimeCard } from "@/components/AnimeCard";
import { getHistory, type HistoryItem } from "@/lib/storage";

type BrowseItem = {
  id: string;
  title: string;
  image?: string;
  score?: number;
  year?: number;
  episodes?: number;
};

export default function HomePage() {
  const [trending, setTrending] = useState<BrowseItem[]>([]);
  const [popular, setPopular] = useState<BrowseItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"trending" | "popular">("trending");

  useEffect(() => {
    setHistory(getHistory());
    Promise.all([
      fetch("/api/browse?type=trending").then((r) => r.json()),
      fetch("/api/browse?type=popular").then((r) => r.json()),
    ])
      .then(([t, p]) => {
        if (Array.isArray(t)) setTrending(t);
        if (Array.isArray(p)) setPopular(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const list = tab === "trending" ? trending : popular;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-gradient-to-br from-brand-600/20 via-[var(--card)] to-purple-600/10 p-8 sm:p-12">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Beyond Stream
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Search thousands of anime titles. Continue where you left off.
            Save your favorites. All powered by open sources.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Start searching →
          </Link>
        </div>
      </section>

      {history.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Continue Watching</h2>
            <Link
              href="/history"
              className="text-sm text-brand-500 hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {history.slice(0, 6).map((h) => (
              <AnimeCard
                key={`${h.id}-${h.episodeId}`}
                id={h.id}
                title={h.title}
                image={h.image}
                provider={h.provider}
                episodeLabel={`EP ${h.episodeNumber}`}
                href={`/watch?id=${encodeURIComponent(h.id)}&provider=${h.provider}&ep=${h.episodeNumber}&uid=${encodeURIComponent(h.episodeId)}`}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold">Discover</h2>
          <div className="flex rounded-lg border border-[var(--card-border)] p-0.5">
            <button
              onClick={() => setTab("trending")}
              className={`rounded-md px-3 py-1 text-sm transition ${
                tab === "trending"
                  ? "bg-brand-500 text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => setTab("popular")}
              className={`rounded-md px-3 py-1 text-sm transition ${
                tab === "popular"
                  ? "bg-brand-500 text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Popular
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-xl bg-[var(--card)]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {list.map((item) => (
              <AnimeCard
                key={item.id}
                id={item.id}
                title={item.title}
                image={item.image}
                href={`/anime/${encodeURIComponent(item.id.replace("anilist:", ""))}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
