import "server-only";

import { headers } from "next/headers";

/** Origen (https://dominio) con el que entró la persona: así los links de invitación usan el mismo dominio. */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host"))?.split(",")[0]?.trim();
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const proto = (h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")).split(",")[0].trim();
  return `${proto}://${host}`;
}
