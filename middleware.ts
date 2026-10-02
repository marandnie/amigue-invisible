import { NextResponse, type NextRequest } from "next/server";

import { canonicalRedirect, normalizeHost } from "@/lib/canonical";

// Solo redirige hosts conocidos (ver lib/canonical.ts). No hace autorización: eso vive en el servidor.
export function middleware(req: NextRequest) {
  const host = normalizeHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  const target = canonicalRedirect(host, `${req.nextUrl.pathname}${req.nextUrl.search}`, process.env.NEXT_PUBLIC_SITE_URL);
  return target ? NextResponse.redirect(target, 308) : NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
