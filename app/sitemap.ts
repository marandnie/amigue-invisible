import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amigoinvisible.com.ar";

// Solo las páginas públicas (ver app/robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/registro`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE}/ingresar`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
