import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { adminAuth } from "@/lib/firebase/admin";
import { upsertProfile } from "@/lib/profile";
import { SESSION_COOKIE, SESSION_MAX_AGE_S } from "@/lib/session";

// Contrato: specs/001-plataforma-gcp-dominio/contracts/session-api.md
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ idToken: z.string().min(20).max(5000) });
const MAX_LOGIN_AGE_S = 5 * 60;

/** CSRF: el pedido tiene que venir de una página de este mismo sitio. */
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))?.split(",")[0]?.trim();
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function error(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return error("origen_invalido", 403);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("pedido_invalido", 400);
  const { idToken } = parsed.data;

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken, true);
  } catch {
    return error("token_invalido", 401);
  }
  if (Date.now() / 1000 - decoded.auth_time > MAX_LOGIN_AGE_S) return error("login_viejo", 401);

  let sessionCookie: string;
  try {
    sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_S * 1000,
    });
  } catch (e) {
    // Ver research R5: si falla por permisos, falta un rol en la service account del backend.
    console.error("createSessionCookie falló", (e as { code?: string }).code ?? e);
    return error("no_se_pudo_crear_la_sesion", 500);
  }

  try {
    await upsertProfile(decoded);
  } catch (e) {
    // El login no debe fallar por el perfil; se vuelve a intentar en el próximo ingreso.
    console.error("upsertProfile falló", (e as { code?: string }).code ?? e);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) return error("origen_invalido", 403);

  const value = req.cookies.get(SESSION_COOKIE)?.value;
  if (value) {
    try {
      const claims = await adminAuth().verifySessionCookie(value);
      // Firebase no permite revocar una cookie suelta: se revocan todas las sesiones de la persona.
      await adminAuth().revokeRefreshTokens(claims.sub);
    } catch {
      // Cookie vencida o inválida: alcanza con borrarla.
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
