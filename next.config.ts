import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.anilist.co" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "**.myanimelist.net" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["anime-sdk", "linkedom"],
  },
  serverExternalPackages: ["anime-sdk", "linkedom"],
};

export default nextConfig;
