import "server-only";

import type { CreatedParticipant, Group } from "@/lib/data/groups";
import { sendEmails, type SendResult } from "@/lib/email/send";
import { drawDoneEmail, invitationEmail } from "@/lib/email/templates";
import { formatEventDate, formatMoney } from "@/lib/format";
import { inviteUrl } from "@/lib/links";

// Avisos por mail (US6, FR-022 a FR-024). Si fallan, la app sigue funcionando con los links.

export async function sendInvitations(
  group: Group,
  people: CreatedParticipant[],
  origin: string,
  replyTo: string | null,
): Promise<SendResult & { ids: string[] }> {
  const withEmail = people.filter((p): p is CreatedParticipant & { email: string } => !!p.email);
  const result = await sendEmails(
    withEmail.map((p) => ({
      to: p.email,
      replyTo,
      ...invitationEmail({
        participantName: p.name,
        groupName: group.name,
        hostName: group.hostName,
        budget: formatMoney(group.budget, group.currency),
        eventDate: formatEventDate(group.eventAt),
        location: group.location,
        url: inviteUrl(origin, p.token),
      }),
    })),
  );
  return { ...result, ids: withEmail.map((p) => p.id) };
}

export async function sendDrawNotices(
  group: Group,
  recipients: { name: string; email: string }[],
  origin: string,
): Promise<SendResult> {
  return sendEmails(
    recipients.map((r) => ({
      to: r.email,
      ...drawDoneEmail({
        participantName: r.name,
        groupName: group.name,
        eventDate: formatEventDate(group.eventAt),
        url: `${origin}/grupos/${group.id}/yo`,
      }),
    })),
  );
}
