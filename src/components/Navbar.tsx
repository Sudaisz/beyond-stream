"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Search, Heart, History, Home } from "lucide-react";
import { useThemeToggle } from "./ThemeProvider";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/history", label: "History", icon: History },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useThemeToggle();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-xl text-brand-500">◈</span>
          <span className="hidden sm:inline">Beyond Stream</span>
          <span className="sm:hidden">Beyond</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-brand-500/15 text-brand-500"
                    : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <button
            onClick={toggle}
            className="ml-1 rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--card)] hover:text-[var(--foreground)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
