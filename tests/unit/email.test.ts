import { describe, expect, it, vi } from "vitest";

import { sendEmails } from "@/lib/email/send";
import { drawDoneEmail, escapeHtml, invitationEmail } from "@/lib/email/templates";

describe("plantillas", () => {
  it("escapa HTML en todo lo que carga la gente", () => {
    const m = invitationEmail({
      participantName: "<img src=x onerror=alert(1)>",
      groupName: 'Navidad "familia" & amigos',
      hostName: "Marina",
      budget: "$ 15.000",
      eventDate: null,
      location: null,
      url: "https://amigoinvisible.com.ar/invitaciones/abc",
    });
    expect(m.html).not.toContain("<img src=x");
    expect(m.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(m.html).toContain("Navidad &quot;familia&quot; &amp; amigos");
    expect(m.text).toContain("https://amigoinvisible.com.ar/invitaciones/abc");
    expect(m.html).not.toContain("Dónde"); // sin lugar no aparece la fila
  });

  it("el asunto no admite saltos de línea", () => {
    const m = drawDoneEmail({ participantName: "Ana", groupName: "a\r\nBcc: x@y.com", eventDate: null, url: "https://x" });
    expect(m.subject).not.toMatch(/[\r\n]/);
  });

  it("el aviso de sorteo no menciona a nadie más que a quien lo recibe", () => {
    const m = drawDoneEmail({ participantName: "Ana", groupName: "Navidad", eventDate: "martes", url: "https://x/yo" });
    expect(m.text).toContain("Ana");
    expect(m.text).toContain("https://x/yo");
    expect(m.text).not.toMatch(/te tocó|le regalás a [A-Z]/i);
  });

  it("escapeHtml cubre los caracteres peligrosos", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
});

describe("sendEmails", () => {
  const email = (i: number) => ({ to: `p${i}@example.com`, subject: "Hola", html: "<p>Hola</p>", text: "Hola" });

  it("sin API key simula y no llama a la red", async () => {
    const fetchImpl = vi.fn();
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const r = await sendEmails([email(1)], { apiKey: "", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ sent: 1, failed: 0, simulated: true });
    expect(fetchImpl).not.toHaveBeenCalled();
    info.mockRestore();
  });

  it("manda en lotes de 100 con el formato de Resend", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const r = await sendEmails(
      Array.from({ length: 150 }, (_, i) => ({ ...email(i), replyTo: i === 0 ? "org@example.com" : null })),
      { apiKey: "re_test", from: "AI <no-responder@amigoinvisible.com.ar>", fetchImpl: fetchImpl as unknown as typeof fetch },
    );
    expect(r).toEqual({ sent: 150, failed: 0, simulated: false });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails/batch");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const body = JSON.parse(init.body as string);
    expect(body).toHaveLength(100);
    expect(body[0]).toMatchObject({ from: "AI <no-responder@amigoinvisible.com.ar>", to: ["p0@example.com"], reply_to: "org@example.com" });
    expect(body[1].reply_to).toBeUndefined();
  });

  it("cuenta como fallidos los lotes rechazados o sin respuesta", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const rejected = vi.fn(async () => new Response("{}", { status: 429 }));
    expect(await sendEmails([email(1), email(2)], { apiKey: "k", fetchImpl: rejected as unknown as typeof fetch })).toEqual({
      sent: 0,
      failed: 2,
      simulated: false,
    });
    const offline = vi.fn(async () => {
      throw new TypeError("network");
    });
    expect((await sendEmails([email(1)], { apiKey: "k", fetchImpl: offline as unknown as typeof fetch })).failed).toBe(1);
    err.mockRestore();
  });
});
