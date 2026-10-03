// Feature 006 (SEO). Puro: lo usan la portada y el sitemap, y se testea sin Next.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://amigoinvisible.com.ar").replace(/\/+$/, "");

export const SITE_NAME = "Amigo Invisible";

export const HOME_TITLE = "Sorteo de amigo invisible online y gratis";
export const HOME_DESCRIPTION =
  "Hacé el sorteo del amigo invisible online y gratis: armá el grupo, mandá los links por WhatsApp y cada uno ve solo a quién le regala.";

/** Páginas públicas con contenido (FR-004). */
export const PUBLIC_PAGES: { path: string; changeFrequency: "monthly" | "yearly"; priority: number }[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/como-funciona", changeFrequency: "monthly", priority: 0.8 },
  { path: "/acerca", changeFrequency: "yearly", priority: 0.5 },
  { path: "/contacto", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacidad", changeFrequency: "yearly", priority: 0.3 },
];

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

/** Datos estructurados de la portada (FR-005). */
export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: absoluteUrl("/"),
        inLanguage: "es-AR",
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: HOME_DESCRIPTION,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        inLanguage: "es-AR",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
      },
    ],
  };
}

/** JSON seguro para incrustar en un <script>: evita cerrar la etiqueta desde un texto. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
