import { describe, expect, it } from "vitest";

import { inviteMessage, inviteUrl, whatsappShareUrl } from "@/lib/links";

const url = inviteUrl("https://amigoinvisible.com.ar", "tok_123-abc");

describe("mensaje de invitación (research R11)", () => {
  it("es el mismo texto para copiar, compartir y WhatsApp, con el link completo adentro", () => {
    const msg = inviteMessage("Caro", "Navidad familia", url);
    expect(msg).toBe(
      '¡Hola Caro! Te sumo al amigo invisible "Navidad familia" 🎁 Entrá acá para sumarte: https://amigoinvisible.com.ar/invitaciones/tok_123-abc',
    );
    expect(msg.endsWith(url)).toBe(true); // el link al final, para que las apps lo detecten entero
  });

  it("el link de WhatsApp lleva exactamente ese mensaje, bien codificado", () => {
    const msg = inviteMessage("Tía Marta", "Navidad & Año Nuevo #2026", url);
    const wa = whatsappShareUrl(msg);
    const [base, query] = wa.split("?text=");
    expect(base).toBe("https://wa.me/");
    expect(query).not.toMatch(/[ &#]/); // nada que corte el parámetro
    expect(decodeURIComponent(query)).toBe(msg);
  });
});
