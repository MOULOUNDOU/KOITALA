import type { NextConfig } from "next";
import path from "path";

const normalizeOriginHost = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).host;
  } catch {
    return "";
  }
};

const serverActionAllowedOrigins = Array.from(
  new Set(
    [
      "localhost:3000",
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.URL,
      process.env.DEPLOY_PRIME_URL,
    ]
      .map(normalizeOriginHost)
      .filter(Boolean)
  )
);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "cf.bstatic.com",
      },
      {
        protocol: "https",
        hostname: "gaitsimmo.sn",
      },
      {
        protocol: "https",
        hostname: "www.gaitsimmo.sn",
      },
      {
        protocol: "https",
        hostname: "immotaissir.com",
      },
      {
        protocol: "https",
        hostname: "www.immotaissir.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: serverActionAllowedOrigins,
    },
  },
};

export default nextConfig;
