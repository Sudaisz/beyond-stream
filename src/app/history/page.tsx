"use client";

import { useEffect, useState } from "react";
import { AnimeCard } from "@/components/AnimeCard";
import {
  getHistory,
  clearHistory,
  type HistoryItem,
} from "@/lib/storage";
import { History, Trash2 } from "lucide-react";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Clear all watch history?")) {
      clearHistory();
      setItems([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-bold">Continue Watching</h1>
          <span className="text-sm text-[var(--muted)]">({items.length})</span>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-500 transition hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] py-16 text-center">
          <History className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-4 text-[var(--muted)]">
            Nothing here yet. Start watching to build your history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((h) => (
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
      )}
    </div>
  );
}
