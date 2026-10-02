import "server-only";

// Envío por la API REST de Resend (sin SDK: constitución VII).
// Sin RESEND_API_KEY (desarrollo) los mails se simulan en la consola.
// Nunca se loguean direcciones ni contenido en producción: solo cantidades.

export type OutgoingEmail = { to: string; subject: string; html: string; text: string; replyTo?: string | null };
export type SendResult = { sent: number; failed: number; simulated: boolean };

const API = "https://api.resend.com/emails/batch";
const BATCH = 100; // máximo por pedido en Resend

export const DEFAULT_FROM = "Amigo Invisible <no-responder@amigoinvisible.com.ar>";

export async function sendEmails(
  emails: OutgoingEmail[],
  opts: { apiKey?: string; from?: string; fetchImpl?: typeof fetch } = {},
): Promise<SendResult> {
  const apiKey = opts.apiKey ?? process.env.RESEND_API_KEY;
  const from = opts.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;
  const doFetch = opts.fetchImpl ?? fetch;
  if (emails.length === 0) return { sent: 0, failed: 0, simulated: !apiKey };

  if (!apiKey) {
    for (const e of emails) console.info(`[mail simulado] para ${e.to} · ${e.subject}`);
    return { sent: emails.length, failed: 0, simulated: true };
  }

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < emails.length; i += BATCH) {
    const chunk = emails.slice(i, i + BATCH);
    try {
      const res = await doFetch(API, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          chunk.map((e) => ({
            from,
            to: [e.to],
            subject: e.subject,
            html: e.html,
            text: e.text,
            ...(e.replyTo ? { reply_to: e.replyTo } : {}),
          })),
        ),
      });
      if (res.ok) sent += chunk.length;
      else {
        failed += chunk.length;
        console.error(`Resend respondió ${res.status} para un lote de ${chunk.length} mail(s)`);
      }
    } catch (err) {
      failed += chunk.length;
      console.error(`Resend no respondió para un lote de ${chunk.length} mail(s)`, (err as Error).name);
    }
  }
  return { sent, failed, simulated: false };
}
