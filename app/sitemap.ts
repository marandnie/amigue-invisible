import type { MetadataRoute } from "next";

import { absoluteUrl, PUBLIC_PAGES } from "@/lib/seo";

// Feature 006 (FR-004): solo las páginas públicas con contenido. Ver app/robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((p) => ({ url: absoluteUrl(p.path), changeFrequency: p.changeFrequency, priority: p.priority }));
}
