export function inviteUrl(origin: string, token: string): string {
  return `${origin}/invitaciones/${token}`;
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function inviteMessage(participantName: string, groupName: string, url: string): string {
  return `¡Hola ${participantName}! Te sumo al amigo invisible "${groupName}" 🎁 Entrá acá para sumarte: ${url}`;
}
