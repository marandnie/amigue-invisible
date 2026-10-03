"use server";

import { headers } from "next/headers";

import { deliverContact, groupReference, withinLimit } from "@/lib/contact";
import { contactSchema, looksLikeBot } from "@/lib/contact-rules";
import { getSessionUser } from "@/lib/session";

// Feature 003 (US1, US3). Valida con zod y delega en lib/contact.ts.

export type ContactState =
  | { status: "ok"; email: string }
  | { status: "error"; error: string; field?: string }
  | undefined;

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export async function sendContactAction(_prev: ContactState, fd: FormData): Promise<ContactState> {
  // Bots: se responde como si hubiera salido bien, para no darles pistas (R1).
  if (looksLikeBot(fd.get("sitio_web"), fd.get("t"))) {
    return { status: "ok", email: String(fd.get("email") ?? "") };
  }

  const parsed = contactSchema.safeParse({
    nombre: fd.get("nombre") ?? "",
    email: fd.get("email") ?? "",
    motivo: fd.get("motivo") ?? "",
    mensaje: fd.get("mensaje") ?? "",
    grupo: fd.get("grupo") ?? "",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { status: "error", error: issue.message, field: String(issue.path[0] ?? "") };
  }

  const input = parsed.data;
  if (!(await withinLimit(await clientIp(), input.email))) {
    return { status: "error", error: "Ya nos mandaste varios mensajes en la última hora. Probá de nuevo más tarde, porfa." };
  }

  const user = await getSessionUser();
  const grupo = await groupReference(input.grupo, user);
  const ok = await deliverContact(input, user, grupo).catch(() => false);
  if (!ok) return { status: "error", error: "No pudimos mandar tu mensaje. Probá de nuevo en un rato." };
  return { status: "ok", email: input.email };
}
