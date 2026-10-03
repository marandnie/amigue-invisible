import { describe, expect, it, vi } from "vitest";

import { bearerToken, claimsAreValid, verifySchedulerToken } from "@/lib/scheduler-auth";

const expected = {
  audience: "https://amigoinvisible.com.ar/api/tareas/reporte-semanal",
  serviceAccount: "reporte-semanal@proj.iam.gserviceaccount.com",
};
const now = 1_800_000_000;
const good = {
  iss: "https://accounts.google.com",
  aud: expected.audience,
  email: expected.serviceAccount,
  email_verified: "true",
  exp: String(now + 300),
};

describe("claimsAreValid", () => {
  it("acepta el token de la service account esperada", () => {
    expect(claimsAreValid(good, expected, now)).toBe(true);
  });
  it.each([
    ["otra audiencia", { aud: "https://otro.com/api/tareas/reporte-semanal" }],
    ["otra service account", { email: "otra@proj.iam.gserviceaccount.com" }],
    ["otro emisor", { iss: "https://evil.example" }],
    ["mail sin verificar", { email_verified: "false" }],
    ["vencido", { exp: String(now - 1) }],
  ])("rechaza: %s", (_, patch) => {
    expect(claimsAreValid({ ...good, ...patch }, expected, now)).toBe(false);
  });
});

describe("verifySchedulerToken", () => {
  it("sin header no consulta a Google y rechaza", async () => {
    const f = vi.fn();
    expect(await verifySchedulerToken(null, expected, f as unknown as typeof fetch)).toBe(false);
    expect(bearerToken("Basic abc")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("rechaza si Google dice que el token no es válido", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 400 }));
    expect(await verifySchedulerToken(`Bearer ${"a".repeat(40)}`, expected, f as unknown as typeof fetch)).toBe(false);
  });

  it("rechaza si tokeninfo no responde", async () => {
    const f = vi.fn(async () => {
      throw new Error("red");
    });
    expect(await verifySchedulerToken(`Bearer ${"a".repeat(40)}`, expected, f as unknown as typeof fetch)).toBe(false);
  });

  it("acepta claims válidos devueltos por tokeninfo", async () => {
    const claims = { ...good, exp: String(Math.floor(Date.now() / 1000) + 300) };
    const f = vi.fn(async () => new Response(JSON.stringify(claims), { status: 200 }));
    expect(await verifySchedulerToken(`Bearer ${"a".repeat(40)}`, expected, f as unknown as typeof fetch)).toBe(true);
  });
});
