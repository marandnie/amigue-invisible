// Dominio canónico (specs/001-plataforma-gcp-dominio, FR-002).
// App Hosting ya redirige www y amigueinvisible (con 302). Esto cubre además el dominio por
// defecto de App Hosting (*.hosted.app) y, si algún día esos dominios pasan a servir la app,
// también los redirige, con 308 (permanente).
const REDIRECT_HOSTS = /(^|\.)hosted\.app$|^www\.amigoinvisible\.com\.ar$|^(www\.)?amigueinvisible\.com\.ar$/;

export function normalizeHost(raw: string | null | undefined): string {
  return (raw ?? "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

/** URL a la que hay que redirigir, o null si el pedido ya está en el dominio canónico. */
export function canonicalRedirect(host: string, pathAndQuery: string, canonicalOrigin: string | undefined): string | null {
  if (!canonicalOrigin?.startsWith("https://")) return null; // en desarrollo no se redirige
  const canonicalHost = new URL(canonicalOrigin).host;
  if (!host || host === canonicalHost || !REDIRECT_HOSTS.test(host)) return null;
  return `${canonicalOrigin.replace(/\/$/, "")}${pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`}`;
}
