import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { adminAuth } from "@/lib/firebase/admin";
import { safeNext } from "@/lib/safe-next";

// Contrato: specs/001-plataforma-gcp-dominio/contracts/session-api.md
export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 14; // 14 días (máximo que permite Firebase)

export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

/** Persona con sesión válida (verificada en el servidor) o null. Se cachea por request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const claims = await adminAuth().verifySessionCookie(value, true);
    return {
      uid: claims.uid,
      email: claims.email ?? null,
      displayName: typeof claims.name === "string" ? claims.name : null,
      emailVerified: claims.email_verified === true,
    };
  } catch {
    return null;
  }
});

/** Para páginas privadas: si no hay sesión, manda al login y vuelve a `nextPath` después. */
export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(safeNext(nextPath))}`);
  return user;
}
