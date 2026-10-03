import { describe, expect, it } from "vitest";

import { providerLabel, signupNoticeEmail, weeklyReportEmail, type WeeklySignup } from "@/lib/email/templates";

const consoleUrl = "https://console.firebase.google.com/project/x/authentication/users";

function signup(i: number): WeeklySignup {
  return { displayName: `Persona ${i}`, email: `p${i}@x.com`, providers: ["password"], createdAt: "lunes", lastLoginAt: null };
}

describe("aviso de alta (004 US1)", () => {
  it("incluye nombre, mail, método y total, y escapa HTML", () => {
    const m = signupNoticeEmail({
      displayName: "<b>Ana</b>",
      email: "ana@x.com",
      providers: ["google.com"],
      createdAt: "sábado, 3 de octubre de 2026, 10:00",
      totalUsers: 12,
      consoleUrl,
    });
    expect(m.html).not.toContain("<b>Ana</b>");
    expect(m.html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
    expect(m.text).toContain("ana@x.com");
    expect(m.text).toContain("Google");
    expect(m.text).toContain("Ya son 12 personas registradas");
  });

  it("el asunto no admite saltos de línea", () => {
    const m = signupNoticeEmail({ displayName: "Ana\r\nBcc: x@y.com", email: "a@x.com", providers: [], createdAt: "hoy", totalUsers: null, consoleUrl });
    expect(m.subject).not.toMatch(/[\r\n]/);
  });

  it("traduce los proveedores", () => {
    expect(providerLabel(["password", "google.com"])).toBe("Mail (contraseña o link) + Google");
    expect(providerLabel([])).toBe("Sin dato");
  });
});

describe("reporte semanal (004 US2)", () => {
  const base = { period: "26 sept 2026 al 3 oct 2026", activeUsers: 4, totalUsers: 30, consoleUrl };

  it("sin altas lo dice y muestra los totales", () => {
    const m = weeklyReportEmail({ ...base, signups: [], moreSignups: 0 });
    expect(m.text).toContain("no se registró nadie nuevo");
    expect(m.text).toContain("Registrados en total: 30");
    expect(m.text).toContain("Ingresaron en la semana: 4");
  });

  it("lista las altas y avisa cuántas faltan más allá del tope", () => {
    const signups = Array.from({ length: 50 }, (_, i) => signup(i));
    const m = weeklyReportEmail({ ...base, signups, moreSignups: 7 });
    expect(m.text).toContain("se registraron 57 personas nuevas");
    expect(m.text).toContain("p0@x.com");
    expect(m.text).toContain("p49@x.com");
    expect(m.text).toContain("…y 7 más");
    expect(m.subject).toContain("57 alta(s)");
  });
});
