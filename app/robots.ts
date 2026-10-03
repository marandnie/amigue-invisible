import type { MetadataRoute } from "next";

// Solo se indexan las páginas públicas; lo privado y los links de invitación quedan afuera.
// No es una barrera de seguridad (los bots maliciosos lo ignoran): la autorización está en el servidor.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amigoinvisible.com.ar";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/grupos/", "/invitaciones/", "/mis-grupos", "/perfil", "/api/", "/__/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
