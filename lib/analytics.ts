// Feature 007 (analítica). Puro y testeable.
// Solo se miden páginas públicas: las privadas y las invitaciones llevan ids o tokens en la ruta (research R2).

export const TRACKED_PATHS = ["/", "/como-funciona", "/acerca", "/contacto", "/privacidad", "/ingresar", "/registro"] as const;

export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

export function isTrackedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return (TRACKED_PATHS as readonly string[]).includes(clean);
}

/** Valor de data-cf-beacon. `spa: false` para no seguir navegaciones a rutas privadas (FR-002). */
export function beaconConfig(token: string): string {
  return JSON.stringify({ token, spa: false });
}

/** Los tokens de Cloudflare Web Analytics son hexadecimales de 32 caracteres. */
export function validToken(token: string | undefined): token is string {
  return !!token && /^[0-9a-f]{32}$/i.test(token.trim());
}
