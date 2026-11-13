"use client";

import { useEffect, useState } from "react";
import { AnimeCard } from "@/components/AnimeCard";
import { getFavorites, type FavoriteItem } from "@/lib/storage";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setItems(getFavorites());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-red-500" />
        <h1 className="text-2xl font-bold">Favorites</h1>
        <span className="text-sm text-[var(--muted)]">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] py-16 text-center">
          <Heart className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-4 text-[var(--muted)]">
            No favorites yet. Heart an anime to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((f) => {
            const anilistId = f.id.startsWith("anilist:")
              ? f.id.replace("anilist:", "")
              : f.id.match(/^\d+$/)
                ? f.id
                : null;
            const href = anilistId
              ? `/anime/${anilistId}`
              : `/anime/${encodeURIComponent(f.id)}${
                  f.provider ? `?provider=${f.provider}` : ""
                }`;
            return (
              <AnimeCard
                key={f.id}
                id={f.id}
                title={f.title}
                image={f.image}
                provider={f.provider}
                href={href}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
