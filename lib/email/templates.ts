// Plantillas de mail (US6). Puras y testeables.
// Constitución I: el mail del sorteo NUNCA incluye a quién le toca a cada uno.
// Constitución II: español rioplatense, lenguaje tradicional (FR-025).

export type RenderedEmail = { subject: string; html: string; text: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Asuntos sin saltos de línea (evita inyección de cabeceras) y con largo razonable. */
function subjectLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 150);
}

type Detail = [label: string, value: string | null];

function layout(opts: { preheader: string; heading: string; paragraphs: string[]; details: Detail[]; cta: { label: string; url: string } }) {
  const details = opts.details.filter((d): d is [string, string] => !!d[1]);
  const detailsHtml = details.length
    ? `<table role="presentation" style="margin:16px 0;font-size:14px;color:#334155">${details
        .map(
          ([k, v]) =>
            `<tr><td style="padding:2px 12px 2px 0;color:#64748b">${escapeHtml(k)}</td><td style="padding:2px 0"><strong>${escapeHtml(v)}</strong></td></tr>`,
        )
        .join("")}</table>`
    : "";
  const html = `<!doctype html><html lang="es-AR"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
<tr><td style="background:#b91c1c;border-radius:12px 12px 0 0;padding:16px 24px;color:#fff7ed;font-size:18px;font-weight:bold">🎁 Amigo Invisible</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:22px;color:#0f172a">${escapeHtml(opts.heading)}</h1>
${opts.paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#334155">${escapeHtml(p)}</p>`).join("")}
${detailsHtml}
<p style="margin:24px 0"><a href="${escapeHtml(opts.cta.url)}" style="background:#b91c1c;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block">${escapeHtml(opts.cta.label)}</a></p>
<p style="margin:0;font-size:12px;color:#94a3b8">Si el botón no anda, copiá este link: ${escapeHtml(opts.cta.url)}</p>
</td></tr></table>
<p style="font-size:12px;color:#94a3b8">amigoinvisible.com.ar · Este mail es automático, no hace falta responderlo.</p>
</td></tr></table></body></html>`;
  const text = [
    opts.heading,
    "",
    ...opts.paragraphs,
    "",
    ...details.map(([k, v]) => `${k}: ${v}`),
    "",
    `${opts.cta.label}: ${opts.cta.url}`,
  ].join("\n");
  return { html, text };
}

export function invitationEmail(p: {
  participantName: string;
  groupName: string;
  hostName: string;
  budget: string | null;
  eventDate: string | null;
  location: string | null;
  url: string;
}): RenderedEmail {
  const { html, text } = layout({
    preheader: `${p.hostName} te sumó al amigo invisible "${p.groupName}"`,
    heading: `¡Hola, ${p.participantName}!`,
    paragraphs: [
      `${p.hostName} te invitó al amigo invisible "${p.groupName}".`,
      "Entrá con el botón para sumarte. Cuando estén todos, se hace el sorteo y vas a ver a quién le regalás.",
    ],
    details: [
      ["Presupuesto", p.budget],
      ["Cuándo", p.eventDate],
      ["Dónde", p.location],
    ],
    cta: { label: "Sumarme", url: p.url },
  });
  return { subject: subjectLine(`${p.hostName} te invitó al amigo invisible "${p.groupName}" 🎁`), html, text };
}

/** Aviso de sorteo hecho. A propósito NO recibe a quién le toca: no se puede filtrar por mail. */
export function drawDoneEmail(p: {
  participantName: string;
  groupName: string;
  eventDate: string | null;
  url: string;
}): RenderedEmail {
  const { html, text } = layout({
    preheader: "Entrá para descubrir a quién le regalás",
    heading: `¡Ya se hizo el sorteo, ${p.participantName}!`,
    paragraphs: [
      `El amigo invisible "${p.groupName}" ya tiene sorteo.`,
      "Entrá para descubrir a quién le regalás y ver su lista de deseos. Es secreto: solo vos lo podés ver.",
    ],
    details: [["Cuándo", p.eventDate]],
    cta: { label: "Ver a quién le regalo", url: p.url },
  });
  return { subject: subjectLine(`¡Ya se hizo el sorteo de "${p.groupName}"! 🎁`), html, text };
}
