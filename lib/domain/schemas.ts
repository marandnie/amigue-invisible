import { z } from "zod";

// Formularios de la feature 002. Mensajes en español (constitución II).

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** "2026-12-24T21:00" (datetime-local) interpretado en hora de Argentina (UTC−3, sin horario de verano). */
export function parseLocalDateTime(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Inversa de parseLocalDateTime, para precargar el formulario. */
export function toLocalDateTimeInput(date: Date | null): string {
  if (!date) return "";
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Poné un nombre para el grupo").max(80, "Máximo 80 caracteres"),
  budget: z.preprocess(
    (v) => {
      if (v === null || v === undefined) return null;
      const s = String(v).replace(/[$\s.]/g, "").replace(",", ".");
      return s === "" ? null : Number(s);
    },
    z
      .number({ invalid_type_error: "El presupuesto tiene que ser un número" })
      .int("El presupuesto va sin centavos")
      .min(0, "El presupuesto no puede ser negativo")
      .max(100_000_000, "Ese presupuesto es demasiado alto")
      .nullable(),
  ),
  currency: z.enum(["ARS", "USD"]).default("ARS"),
  eventAt: z.preprocess(
    (v) => (v === null || v === undefined || String(v).trim() === "" ? null : parseLocalDateTime(String(v)) ?? "invalida"),
    z.date({ invalid_type_error: "La fecha no es válida" }).nullable(),
  ),
  location: optionalText(120),
  notes: optionalText(500),
  hostParticipates: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});
export type GroupInput = z.infer<typeof groupSchema>;

export const MAX_NAME = 60;

export type ParticipantLine = { name: string; email: string | null };

/**
 * Una persona por línea: "Nombre", "Nombre, email" o "Nombre email".
 * Devuelve las líneas válidas y los errores por línea.
 */
export function parseParticipantLines(text: string): { lines: ParticipantLine[]; errors: string[] } {
  const lines: ParticipantLine[] = [];
  const errors: string[] = [];
  const emailSchema = z.string().email();
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((raw, i) => {
      let name = raw;
      let email: string | null = null;
      const match = /^(.*?)[,;\s]+<?([^\s,;<>]+@[^\s,;<>]+)>?$/.exec(raw);
      if (match) {
        name = match[1].trim();
        email = match[2].trim().toLowerCase();
        if (!emailSchema.safeParse(email).success) {
          errors.push(`Línea ${i + 1}: el email "${email}" no es válido`);
          return;
        }
      }
      name = name.replace(/\s+/g, " ");
      if (!name) {
        errors.push(`Línea ${i + 1}: falta el nombre`);
        return;
      }
      if (name.length > MAX_NAME) {
        errors.push(`Línea ${i + 1}: el nombre es muy largo (máx. ${MAX_NAME})`);
        return;
      }
      lines.push({ name, email });
    });
  return { lines, errors };
}

/** Normaliza nombres para detectar repetidos ("Tía Marta" == "tia marta"). */
export function normalizeName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}

export const wishSchema = z.object({
  text: z.string().trim().min(1, "Escribí qué te gustaría").max(200, "Máximo 200 caracteres"),
  url: z.preprocess(
    (v) => {
      const s = String(v ?? "").trim();
      if (s === "") return null;
      // Si pegan "mercadolibre.com.ar/..." sin protocolo, se completa con https.
      return /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
    },
    z
      .string()
      .max(500, "El link es muy largo")
      .url("El link no es válido")
      .refine((u) => /^https?:\/\//i.test(u), "Solo se aceptan links que empiecen con http:// o https://")
      .nullable(),
  ),
});
export type WishInput = z.infer<typeof wishSchema>;

export const exclusionSchema = z
  .object({
    from: z.string().min(1, "Elegí a la primera persona"),
    to: z.string().min(1, "Elegí a la segunda persona"),
    mutual: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  })
  .refine((v) => v.from !== v.to, { message: "Elegí dos personas distintas", path: ["to"] });
