import "server-only";

import { createHash } from "node:crypto";

import { nextWindow, type ContactInput, type WindowState } from "@/lib/contact-rules";
import { getGroupAccess } from "@/lib/data/groups";
import { sendEmails } from "@/lib/email/send";
import { contactMessageEmail } from "@/lib/email/templates";
import { adminDb } from "@/lib/firebase/admin";
import { formatEventDate } from "@/lib/format";
import type { SessionUser } from "@/lib/session";

// Feature 003. El mensaje no se guarda en el sitio (FR-010): solo se entrega a ADMIN_EMAIL.

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

/** Suma un envío a la ventana de la clave; false si ya llegó al límite (research R2). Solo guarda hashes. */
async function consume(key: string): Promise<boolean> {
  const ref = adminDb().collection("contactLimits").doc(hash(key));
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? (snap.data() as WindowState) : null;
    const { state, allowed } = nextWindow(prev);
    if (allowed) tx.set(ref, state);
    return allowed;
  });
}

export async function withinLimit(ip: string | null, email: string): Promise<boolean> {
  // Se cuentan las dos claves aunque una ya esté al límite: así no se puede rotar el email desde la misma IP.
  const results = await Promise.all([ip ? consume(`ip:${ip}`) : Promise.resolve(true), consume(`email:${email}`)]);
  return results.every(Boolean);
}

/** Referencia al grupo solo si quien escribe pertenece a él; si no, se descarta en silencio (FR-011). */
export async function groupReference(groupId: string | undefined, user: SessionUser | null) {
  if (!groupId || !user) return null;
  const access = await getGroupAccess(groupId, user).catch(() => null);
  return access ? { id: access.group.id, name: access.group.name } : null;
}

export async function deliverContact(
  input: ContactInput,
  user: SessionUser | null,
  grupo: { id: string; name: string } | null,
): Promise<boolean> {
  const to = process.env.ADMIN_EMAIL?.trim();
  if (!to) {
    console.error("Contacto: falta ADMIN_EMAIL");
    return false;
  }
  const result = await sendEmails([
    {
      to,
      replyTo: input.email,
      ...contactMessageEmail({
        nombre: input.nombre,
        email: input.email,
        motivo: input.motivo,
        mensaje: input.mensaje,
        fecha: formatEventDate(new Date()) ?? "",
        conSesion: !!user,
        grupo,
      }),
    },
  ]);
  return result.sent > 0;
}
