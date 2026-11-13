"use client";

import { useEffect, useState } from "react";
import { getTheme, setTheme as persistTheme } from "@/lib/storage";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const theme = getTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white">{children}</div>
    );
  }

  return <>{children}</>;
}

export function useThemeToggle() {
  const [theme, setThemeState] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    persistTheme(next);
    setThemeState(next);
  };

  return { theme, toggle };
}
