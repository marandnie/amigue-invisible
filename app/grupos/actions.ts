"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import * as data from "@/lib/data/groups";
import { DomainError, NotFoundError } from "@/lib/domain/errors";
import { exclusionSchema, groupSchema, parseParticipantLines, wishSchema } from "@/lib/domain/schemas";
import { sendDrawNotices, sendInvitations } from "@/lib/notifications";
import { requestOrigin } from "@/lib/request-origin";
import { requireUser } from "@/lib/session";

// Server Actions de la feature 002. Validan con zod y delegan la autorización en lib/data/groups.ts.

export type FormState = { error?: string; ok?: string } | undefined;

async function attempt<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: string }> {
  try {
    return { value: await fn() };
  } catch (e) {
    if (e instanceof DomainError) return { error: e.message };
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
}

const fields = (fd: FormData) => Object.fromEntries(fd.entries());
const groupPath = (id: string) => `/grupos/${id}`;

// ---------- grupos ----------

export async function createGroupAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/grupos/nuevo");
  const parsed = groupSchema.safeParse(fields(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const r = await attempt(() => data.createGroup(user, parsed.data));
  if (r.error) return { error: r.error };
  redirect(groupPath(r.value!));
}

export async function updateGroupAction(groupId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(`${groupPath(groupId)}/editar`);
  const parsed = groupSchema.safeParse(fields(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const r = await attempt(() => data.updateGroup(user, groupId, parsed.data));
  if (r.error) return { error: r.error };
  revalidatePath(groupPath(groupId));
  redirect(groupPath(groupId));
}

export async function deleteGroupAction(groupId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(`${groupPath(groupId)}/editar`);
  if (fd.get("confirmar") !== "on") return { error: "Tildá la casilla para confirmar." };
  const r = await attempt(() => data.deleteGroup(user, groupId));
  if (r.error) return { error: r.error };
  redirect("/mis-grupos");
}

// ---------- participantes ----------

export async function addParticipantsAction(groupId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(groupPath(groupId));
  const bulk = String(fd.get("lineas") ?? "").trim();
  const single = [String(fd.get("nombre") ?? "").trim(), String(fd.get("email") ?? "").trim()].filter(Boolean).join(", ");
  const { lines, errors } = parseParticipantLines(bulk || single);
  if (errors.length) return { error: errors.join(" · ") };
  if (!lines.length) return { error: "Escribí al menos un nombre." };
  const r = await attempt(() => data.addParticipants(user, groupId, lines));
  if (r.error) return { error: r.error };
  const { group, created } = r.value!;
  let mailNote = "";
  if (created.some((p) => p.email)) {
    const mail = await sendInvitations(group, created, await requestOrigin(), user.email);
    if (mail.ids.length) await data.recordInviteEmail(user, groupId, mail.ids, mail.failed ? "fallo" : "enviado");
    mailNote = mail.failed
      ? " No pudimos mandar las invitaciones por mail: compartí los links por WhatsApp."
      : ` Les mandamos la invitación por mail a ${mail.sent === 1 ? "1 persona" : `${mail.sent} personas`}.`;
  }
  revalidatePath(groupPath(groupId));
  const added = created.length === 1 ? `Agregaste a ${created[0].name}.` : `Agregaste ${created.length} personas.`;
  return { ok: added + mailNote };
}

export async function resendInviteEmailAction(groupId: string, participantId: string): Promise<FormState> {
  const user = await requireUser(groupPath(groupId));
  const r = await attempt(() => data.getPendingInviteForEmail(user, groupId, participantId));
  if (r.error) return { error: r.error };
  const { group, participant } = r.value!;
  const mail = await sendInvitations(group, [participant], await requestOrigin(), user.email);
  await data.recordInviteEmail(user, groupId, [participant.id], mail.failed ? "fallo" : "enviado");
  revalidatePath(groupPath(groupId));
  return mail.failed ? { error: "No pudimos mandar el mail. Probá más tarde o mandale el link por WhatsApp." } : { ok: "Mail enviado" };
}

export async function removeParticipantAction(groupId: string, participantId: string): Promise<FormState> {
  const user = await requireUser(groupPath(groupId));
  const r = await attempt(() => data.removeParticipant(user, groupId, participantId));
  if (r.error) return { error: r.error };
  revalidatePath(groupPath(groupId));
  return { ok: "Listo" };
}

export async function regenerateInviteAction(groupId: string, participantId: string): Promise<FormState> {
  const user = await requireUser(groupPath(groupId));
  const r = await attempt(() => data.regenerateInvite(user, groupId, participantId));
  if (r.error) return { error: r.error };
  revalidatePath(groupPath(groupId));
  return { ok: "Link nuevo listo. El anterior ya no sirve." };
}

// ---------- sumarse ----------

export async function acceptInvitationAction(token: string): Promise<FormState> {
  const user = await requireUser(`/invitaciones/${token}`);
  const r = await attempt(() => data.acceptInvitation(user, token));
  if (r.error) return { error: r.error };
  redirect(`${groupPath(r.value!.groupId)}/yo`);
}

export async function joinByEmailAction(groupId: string, participantId: string): Promise<FormState> {
  const user = await requireUser("/mis-grupos");
  const r = await attempt(() => data.joinByEmail(user, groupId, participantId));
  if (r.error) return { error: r.error };
  redirect(`${groupPath(groupId)}/yo`);
}

// ---------- sorteo ----------

export async function drawAction(groupId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(groupPath(groupId));
  const r = await attempt(() => data.runDraw(user, groupId, fd.get("confirmar") === "on"));
  if (r.error) return { error: r.error };
  // El sorteo ya está hecho: si el aviso por mail falla, cada uno igual lo ve en su página.
  await sendDrawNotices(r.value!.group, r.value!.recipients, await requestOrigin());
  revalidatePath(groupPath(groupId));
  redirect(`${groupPath(groupId)}?sorteado=1`);
}

// ---------- exclusiones ----------

export async function addExclusionAction(groupId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(`${groupPath(groupId)}/exclusiones`);
  const parsed = exclusionSchema.safeParse(fields(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { from, to, mutual } = parsed.data;
  const r = await attempt(() => data.addExclusion(user, groupId, from, to, mutual));
  if (r.error) return { error: r.error };
  revalidatePath(`${groupPath(groupId)}/exclusiones`);
  return { ok: "Exclusión agregada." };
}

export async function removeExclusionAction(groupId: string, a: string, b: string): Promise<FormState> {
  const user = await requireUser(`${groupPath(groupId)}/exclusiones`);
  const r = await attempt(() => data.removeExclusionPair(user, groupId, a, b));
  if (r.error) return { error: r.error };
  revalidatePath(`${groupPath(groupId)}/exclusiones`);
  return { ok: "Listo" };
}

// ---------- deseos ----------

export async function addWishAction(groupId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(`${groupPath(groupId)}/yo`);
  const parsed = wishSchema.safeParse(fields(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const r = await attempt(() => data.addWish(user, groupId, parsed.data));
  if (r.error) return { error: r.error };
  revalidatePath(`${groupPath(groupId)}/yo`);
  return { ok: "¡Agregado!" };
}

export async function updateWishAction(
  groupId: string,
  wishId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireUser(`${groupPath(groupId)}/yo`);
  const parsed = wishSchema.safeParse(fields(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const r = await attempt(() => data.updateWish(user, groupId, wishId, parsed.data));
  if (r.error) return { error: r.error };
  revalidatePath(`${groupPath(groupId)}/yo`);
  return { ok: "Guardado" };
}

export async function deleteWishAction(groupId: string, wishId: string): Promise<FormState> {
  const user = await requireUser(`${groupPath(groupId)}/yo`);
  const r = await attempt(() => data.deleteWish(user, groupId, wishId));
  if (r.error) return { error: r.error };
  revalidatePath(`${groupPath(groupId)}/yo`);
  return { ok: "Listo" };
}
