"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addFavorite,
  removeFavorite,
  isFavorite,
} from "@/lib/storage";

interface Props {
  id: string;
  title: string;
  image?: string;
  provider?: string;
  episodeLabel?: string;
  href: string;
  showFav?: boolean;
}

export function AnimeCard({
  id,
  title,
  image,
  provider,
  episodeLabel,
  href,
  showFav = true,
}: Props) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(id));
  }, [id]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fav) {
      removeFavorite(id);
      setFav(false);
    } else {
      addFavorite({ id, title, image, provider });
      setFav(true);
    }
  };

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] transition-all hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            No Image
          </div>
        )}

        {showFav && (
          <button
            onClick={toggleFav}
            className={`absolute right-2 top-2 rounded-full p-1.5 backdrop-blur-sm transition-colors ${
              fav
                ? "bg-red-500/90 text-white"
                : "bg-black/50 text-white/70 hover:bg-black/70 hover:text-white"
            }`}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
          </button>
        )}

        {episodeLabel && (
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {episodeLabel}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-brand-500">
          {title}
        </h3>
        {provider && (
          <p className="mt-1 text-xs text-[var(--muted)] capitalize">
            {provider}
          </p>
        )}
      </div>
    </Link>
  );
}
