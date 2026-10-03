// Validación del token OIDC con el que Cloud Scheduler llama a las tareas (research R3 de la 004).
// Sin dependencias: se usa el endpoint tokeninfo de Google (una llamada por semana).

const TOKENINFO = "https://oauth2.googleapis.com/tokeninfo";
const ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

export type TokenInfo = {
  iss?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  exp?: string | number;
};

/** Reglas puras sobre los claims ya decodificados. */
export function claimsAreValid(
  info: TokenInfo,
  expected: { audience: string; serviceAccount: string },
  nowS: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!info.iss || !ISSUERS.has(info.iss)) return false;
  if (info.aud !== expected.audience) return false;
  if (!info.email || info.email.toLowerCase() !== expected.serviceAccount.toLowerCase()) return false;
  if (info.email_verified !== true && info.email_verified !== "true") return false;
  const exp = Number(info.exp);
  if (!Number.isFinite(exp) || exp <= nowS) return false;
  return true;
}

export function bearerToken(authorization: string | null): string | null {
  const m = /^Bearer\s+([A-Za-z0-9._-]{20,4096})$/.exec(authorization?.trim() ?? "");
  return m ? m[1] : null;
}

/** true si el header Authorization trae un ID token válido de la service account esperada. */
export async function verifySchedulerToken(
  authorization: string | null,
  expected: { audience: string; serviceAccount: string },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const token = bearerToken(authorization);
  if (!token) return false;
  try {
    const res = await fetchImpl(`${TOKENINFO}?id_token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) return false;
    return claimsAreValid((await res.json()) as TokenInfo, expected);
  } catch {
    return false;
  }
}
