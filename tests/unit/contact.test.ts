import { describe, expect, it } from "vitest";

import { contactSchema, LIMIT_PER_WINDOW, looksLikeBot, nextWindow, WINDOW_MS } from "@/lib/contact-rules";
import { contactMessageEmail } from "@/lib/email/templates";

const base = { nombre: "Ana", email: "Ana@Mail.com", motivo: "Sugerencia", mensaje: "Hola" };

describe("contactSchema (003)", () => {
  it("acepta un mensaje válido y normaliza el email", () => {
    const r = contactSchema.parse(base);
    expect(r.email).toBe("ana@mail.com");
    expect(r.grupo).toBeUndefined();
  });
  it.each([
    [{ email: "no-es-un-mail" }],
    [{ mensaje: "   " }],
    [{ mensaje: "x".repeat(2001) }],
    [{ motivo: "Cualquier cosa" }],
    [{ nombre: "" }],
    [{ grupo: "../otro" }],
  ])("rechaza %j", (patch) => {
    expect(contactSchema.safeParse({ ...base, ...patch }).success).toBe(false);
  });
  it("acepta 2000 caracteres y un grupo vacío", () => {
    expect(contactSchema.safeParse({ ...base, mensaje: "x".repeat(2000), grupo: "" }).success).toBe(true);
  });
});

describe("looksLikeBot", () => {
  const now = 1_000_000;
  it("detecta el campo trampa lleno", () => expect(looksLikeBot("http://spam", now - 10_000, now)).toBe(true));
  it("detecta envíos de menos de 3 segundos", () => expect(looksLikeBot("", now - 1000, now)).toBe(true));
  it("detecta la marca de tiempo faltante", () => expect(looksLikeBot("", undefined, now)).toBe(true));
  it("deja pasar a una persona", () => expect(looksLikeBot("", now - 20_000, now)).toBe(false));
});

describe("nextWindow", () => {
  it(`permite ${LIMIT_PER_WINDOW} por hora y frena el siguiente`, () => {
    let state = null as ReturnType<typeof nextWindow>["state"] | null;
    for (let i = 0; i < LIMIT_PER_WINDOW; i++) {
      const r = nextWindow(state, 1000 + i);
      expect(r.allowed).toBe(true);
      state = r.state;
    }
    expect(nextWindow(state, 2000).allowed).toBe(false);
  });
  it("reinicia la ventana pasada la hora", () => {
    const r = nextWindow({ windowStart: 0, count: LIMIT_PER_WINDOW }, WINDOW_MS);
    expect(r).toEqual({ state: { windowStart: WINDOW_MS, count: 1 }, allowed: true });
  });
});

describe("contactMessageEmail", () => {
  it("escapa lo que escribe la persona y arma el responder", () => {
    const m = contactMessageEmail({
      nombre: "<b>Ana</b>",
      email: "ana@mail.com",
      motivo: "Sugerencia",
      mensaje: "<script>x</script>\nSegunda línea",
      fecha: "hoy",
      conSesion: false,
      grupo: null,
    });
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
    expect(m.html).toContain("mailto:ana@mail.com");
    expect(m.text).toContain("Segunda línea");
    expect(m.html).not.toContain("Grupo");
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});
