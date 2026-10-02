// Evita redirecciones abiertas: solo se aceptan rutas internas relativas.
export const DEFAULT_AFTER_LOGIN = "/mis-grupos";

export function safeNext(next: string | null | undefined, fallback = DEFAULT_AFTER_LOGIN): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
