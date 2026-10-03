import { z } from "zod";

import { CONTACT_REASONS, MAX_MESSAGE } from "@/lib/contact-constants";

export { CONTACT_REASONS, MAX_MESSAGE };

// Feature 003 (contacto). Partes puras: se testean sin Firebase ni Resend.

export const MIN_FILL_MS = 3000; // research R1
export const LIMIT_PER_WINDOW = 5; // FR-009
export const WINDOW_MS = 60 * 60 * 1000;

export const contactSchema = z.object({
  nombre: z.string().trim().min(1, "Poné tu nombre").max(60, "Máximo 60 caracteres"),
  email: z.string().trim().toLowerCase().email("Revisá el email: parece mal escrito").max(254),
  motivo: z.enum(CONTACT_REASONS, { errorMap: () => ({ message: "Elegí un motivo" }) }),
  mensaje: z
    .string()
    .trim()
    .min(1, "Escribí tu mensaje")
    .max(MAX_MESSAGE, `Máximo ${MAX_MESSAGE} caracteres`),
  grupo: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,64}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Campo trampa lleno o formulario enviado demasiado rápido: casi seguro un bot (R1). */
export function looksLikeBot(honeypot: unknown, renderedAt: unknown, now: number = Date.now()): boolean {
  if (typeof honeypot === "string" && honeypot.trim() !== "") return true;
  const t = Number(renderedAt);
  if (!Number.isFinite(t) || t <= 0) return true;
  return now - t < MIN_FILL_MS;
}

export type WindowState = { windowStart: number; count: number };

/** Ventana fija de una hora: devuelve el estado nuevo y si el envío entra en el límite (R2). */
export function nextWindow(prev: WindowState | null, now: number = Date.now()): { state: WindowState; allowed: boolean } {
  if (!prev || now - prev.windowStart >= WINDOW_MS) return { state: { windowStart: now, count: 1 }, allowed: true };
  if (prev.count >= LIMIT_PER_WINDOW) return { state: prev, allowed: false };
  return { state: { windowStart: prev.windowStart, count: prev.count + 1 }, allowed: true };
}
