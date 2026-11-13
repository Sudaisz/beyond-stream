"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { AnimeCard } from "@/components/AnimeCard";
import { PROVIDER_LIST } from "@/lib/providers";

type Result = {
  id: string;
  title: string;
  image?: string;
  catalogType?: string;
  availableLanguages?: string[];
  score?: number;
  year?: number;
};

export default function SearchPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialQ = sp.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [provider, setProvider] = useState(sp.get("provider") || "megaplay");
  const [useMeta, setUseMeta] = useState(true);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(!!initialQ);

  const doSearch = useCallback(
    async (q: string, prov: string, meta: boolean) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      setSearched(true);
      try {
        const params = new URLSearchParams({
          q: q.trim(),
          provider: prov,
        });
        if (meta) params.set("meta", "1");
        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        setResults(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialQ) doSearch(initialQ, provider, useMeta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ q: query, provider });
    router.replace(`/search?${params}`);
    doSearch(query, provider, useMeta);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search Anime</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an anime title..."
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={useMeta}
            onChange={(e) => setUseMeta(e.target.checked)}
            className="rounded"
          />
          Use AniList metadata (better covers & info)
        </label>
      </div>

      {!useMeta && (
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
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-center text-[var(--muted)]">No results found.</p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map((r) => {
            const anilistId = r.id.startsWith("anilist:")
              ? r.id.replace("anilist:", "")
              : null;
            const href = anilistId
              ? `/anime/${anilistId}`
              : `/anime/${encodeURIComponent(r.id)}?provider=${provider}`;
            return (
              <AnimeCard
                key={r.id}
                id={r.id}
                title={r.title}
                image={r.image}
                provider={useMeta ? undefined : provider}
                href={href}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
