import { describe, expect, it } from "vitest";

import {
  groupSchema,
  normalizeName,
  parseLocalDateTime,
  parseParticipantLines,
  toLocalDateTimeInput,
  wishSchema,
} from "@/lib/domain/schemas";
import { profileSchema } from "@/lib/domain/schemas";

describe("parseParticipantLines", () => {
  it("acepta nombre solo, con coma y con espacio antes del email", () => {
    const { lines, errors } = parseParticipantLines("Ana\nBruno, bruno@example.com\n  Tía Marta   marta@Example.com \n\n");
    expect(errors).toEqual([]);
    expect(lines).toEqual([
      { name: "Ana", email: null },
      { name: "Bruno", email: "bruno@example.com" },
      { name: "Tía Marta", email: "marta@example.com" },
    ]);
  });

  it("informa errores por línea", () => {
    const { lines, errors } = parseParticipantLines(", sin-nombre@example.com\n" + "x".repeat(61));
    expect(lines).toEqual([]);
    expect(errors).toHaveLength(2);
  });
});

describe("normalizeName", () => {
  it("ignora tildes, mayúsculas y espacios", () => {
    expect(normalizeName("  Tía   MARTA ")).toBe(normalizeName("tia marta"));
  });
});

describe("wishSchema", () => {
  it("completa https si falta y acepta http(s)", () => {
    expect(wishSchema.parse({ text: "Libro", url: "mercadolibre.com.ar/libro" }).url).toBe(
      "https://mercadolibre.com.ar/libro",
    );
    expect(wishSchema.parse({ text: "Libro", url: "" }).url).toBeNull();
  });

  it("rechaza javascript: y otros protocolos", () => {
    expect(wishSchema.safeParse({ text: "x", url: "javascript:alert(1)" }).success).toBe(false);
    expect(wishSchema.safeParse({ text: "x", url: "data:text/html,hola" }).success).toBe(false);
  });
});

describe("groupSchema", () => {
  it("interpreta presupuesto con puntos de miles y fecha en hora argentina", () => {
    const g = groupSchema.parse({
      name: " Navidad ",
      budget: "15.000",
      currency: "ARS",
      eventAt: "2026-12-24T21:00",
      location: "",
      notes: "",
      hostParticipates: "on",
    });
    expect(g).toMatchObject({ name: "Navidad", budget: 15000, location: null, notes: null, hostParticipates: true });
    expect(g.eventAt!.toISOString()).toBe("2026-12-25T00:00:00.000Z");
    expect(toLocalDateTimeInput(g.eventAt)).toBe("2026-12-24T21:00");
  });

  it("sin tildar 'Yo también participo' queda en false", () => {
    expect(groupSchema.parse({ name: "X", budget: "", eventAt: "" }).hostParticipates).toBe(false);
  });

  it("rechaza fechas inválidas y presupuestos negativos", () => {
    expect(groupSchema.safeParse({ name: "X", eventAt: "mañana" }).success).toBe(false);
    expect(groupSchema.safeParse({ name: "X", budget: "-5" }).success).toBe(false);
    expect(parseLocalDateTime("2026-13-40T99:99")).toBeNull();
  });
});

describe("profileSchema (005)", () => {
  it("recorta espacios", () => {
    expect(profileSchema.parse({ displayName: "  Marina Nieto  " }).displayName).toBe("Marina Nieto");
  });
  it.each([[""], ["   "], ["x".repeat(61)]])("rechaza %j", (displayName) => {
    expect(profileSchema.safeParse({ displayName }).success).toBe(false);
  });
  it("rechaza si falta el campo", () => {
    expect(profileSchema.safeParse({}).success).toBe(false);
  });
  it("acepta 60 caracteres", () => {
    expect(profileSchema.safeParse({ displayName: "x".repeat(60) }).success).toBe(true);
  });
});
