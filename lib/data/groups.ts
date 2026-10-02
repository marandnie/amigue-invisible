import "server-only";

import { randomBytes } from "node:crypto";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import { drawAssignments, MIN_PARTICIPANTS, secureRng, type Exclusion, type Rng } from "@/lib/domain/draw";
import { DomainError, NotFoundError } from "@/lib/domain/errors";
import { normalizeName, type GroupInput, type ParticipantLine, type WishInput } from "@/lib/domain/schemas";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

// Capa de datos de la feature 002. TODA la autorización vive acá (las reglas de Firestore niegan todo).
// Constitución I: ninguna función devuelve asignaciones ajenas ni las escribe en logs.
// Modelo: specs/002-sorteo-amigo-invisible/data-model.md · Contrato: contracts/routes.md

export const MAX_PARTICIPANTS = 50;
export const MAX_WISHES = 30;
export const INVITE_TTL_DAYS = 30;

export type Actor = { uid: string; email: string | null; displayName: string | null };

export type Group = {
  id: string;
  name: string;
  hostUid: string;
  hostName: string;
  hostParticipates: boolean;
  budget: number | null;
  currency: string;
  eventAt: Date | null;
  location: string | null;
  notes: string | null;
  exclusions: Exclusion[];
  status: "abierto" | "sorteado";
  drawnAt: Date | null;
  createdAt: Date | null;
};

export type Participant = {
  id: string;
  name: string;
  email: string | null;
  uid: string | null;
  isHost: boolean;
  joinedAt: Date | null;
  joinedEmail: string | null;
  inviteToken: string | null;
};

export type Wish = { id: string; text: string; url: string | null };

export type Access =
  | { role: "organizador"; group: Group; me: Participant | null }
  | { role: "participante"; group: Group; me: Participant };

// ---------- helpers ----------

const db = () => adminDb();
const groupsCol = () => db().collection("groups");
const groupRef = (id: string) => groupsCol().doc(id);
const participantsCol = (groupId: string) => groupRef(groupId).collection("participants");
const assignmentsCol = (groupId: string) => groupRef(groupId).collection("assignments");
const invitationsCol = () => db().collection("invitations");
const wishesCol = (groupId: string, participantId: string) =>
  participantsCol(groupId).doc(participantId).collection("wishes");

const toDate = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : null);
const isSafeId = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id);

function toGroup(snap: DocumentSnapshot<DocumentData>): Group {
  const d = snap.data()!;
  return {
    id: snap.id,
    name: d.name,
    hostUid: d.hostUid,
    hostName: d.hostName,
    hostParticipates: d.hostParticipates === true,
    budget: typeof d.budget === "number" ? d.budget : null,
    currency: d.currency ?? "ARS",
    eventAt: toDate(d.eventAt),
    location: d.location ?? null,
    notes: d.notes ?? null,
    exclusions: Array.isArray(d.exclusions) ? d.exclusions : [],
    status: d.status === "sorteado" ? "sorteado" : "abierto",
    drawnAt: toDate(d.drawnAt),
    createdAt: toDate(d.createdAt),
  };
}

function toParticipant(snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Participant {
  const d = snap.data()!;
  return {
    id: snap.id,
    name: d.name,
    email: d.email ?? null,
    uid: d.uid ?? null,
    isHost: d.isHost === true,
    joinedAt: toDate(d.joinedAt),
    joinedEmail: d.joinedEmail ?? null,
    inviteToken: d.inviteToken ?? null,
  };
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

function inviteExpiry(): Timestamp {
  return Timestamp.fromMillis(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function assertOpen(group: Group) {
  if (group.status === "sorteado") {
    throw new DomainError("El sorteo ya se hizo: no se pueden hacer más cambios en los participantes.");
  }
}

async function actorName(actor: Actor): Promise<string> {
  const profile = await db().collection("users").doc(actor.uid).get();
  const name = (profile.data()?.displayName as string | undefined) ?? actor.displayName ?? actor.email?.split("@")[0];
  return (name ?? "Organizador").slice(0, 60);
}

function sortParticipants(list: Participant[]): Participant[] {
  return list.sort((a, b) => Number(b.isHost) - Number(a.isHost) || a.name.localeCompare(b.name, "es"));
}

// ---------- lectura con autorización ----------

/** Rol de la persona en el grupo, o null si no tiene acceso (se muestra 404). */
export async function getGroupAccess(groupId: string, actor: Actor): Promise<Access | null> {
  if (!isSafeId(groupId)) return null;
  const snap = await groupRef(groupId).get();
  if (!snap.exists) return null;
  const group = toGroup(snap);
  const mine = await participantsCol(groupId).where("uid", "==", actor.uid).limit(1).get();
  const me = mine.empty ? null : toParticipant(mine.docs[0]);
  if (group.hostUid === actor.uid) return { role: "organizador", group, me };
  if (me) return { role: "participante", group, me };
  return null;
}

async function requireHost(groupId: string, actor: Actor): Promise<Group> {
  const access = await getGroupAccess(groupId, actor);
  if (!access || access.role !== "organizador") throw new NotFoundError();
  return access.group;
}

export async function listParticipants(groupId: string, actor: Actor): Promise<Participant[]> {
  await requireHost(groupId, actor);
  const snap = await participantsCol(groupId).get();
  return sortParticipants(snap.docs.map(toParticipant));
}

/** Para participantes: solo nombres de quienes ya se sumaron (sin emails, sin estados). */
export async function listJoinedNames(groupId: string, actor: Actor): Promise<string[]> {
  const access = await getGroupAccess(groupId, actor);
  if (!access) throw new NotFoundError();
  const snap = await participantsCol(groupId).get();
  return sortParticipants(snap.docs.map(toParticipant))
    .filter((p) => p.uid)
    .map((p) => p.name);
}

export type MyGroups = {
  organizo: Group[];
  participo: Group[];
  invitaciones: { group: Group; participantId: string; participantName: string }[];
};

export async function listMyGroups(actor: Actor): Promise<MyGroups> {
  const [hosted, memberships] = await Promise.all([
    groupsCol().where("hostUid", "==", actor.uid).get(),
    db().collectionGroup("participants").where("uid", "==", actor.uid).get(),
  ]);
  const organizo = hosted.docs.map(toGroup);
  const hostedIds = new Set(organizo.map((g) => g.id));
  const memberGroupRefs = memberships.docs
    .map((d) => d.ref.parent.parent!)
    .filter((ref) => !hostedIds.has(ref.id));
  const participo = memberGroupRefs.length
    ? (await db().getAll(...memberGroupRefs)).filter((s) => s.exists).map(toGroup)
    : [];

  let invitaciones: MyGroups["invitaciones"] = [];
  if (actor.email) {
    const pending = await db()
      .collectionGroup("participants")
      .where("email", "==", actor.email.toLowerCase())
      .get();
    const candidates = pending.docs.filter((d) => !d.data().uid);
    const known = new Set([...hostedIds, ...participo.map((g) => g.id)]);
    const refs = candidates.map((d) => d.ref.parent.parent!).filter((r) => !known.has(r.id));
    if (refs.length) {
      const groups = new Map((await db().getAll(...refs)).filter((s) => s.exists).map((s) => [s.id, toGroup(s)]));
      invitaciones = candidates
        .map((d) => ({ group: groups.get(d.ref.parent.parent!.id), participantId: d.id, participantName: d.data().name }))
        .filter((i): i is MyGroups["invitaciones"][number] => !!i.group && i.group.status === "abierto");
    }
  }

  const byDate = (a: Group, b: Group) =>
    (a.eventAt?.getTime() ?? a.createdAt?.getTime() ?? 0) - (b.eventAt?.getTime() ?? b.createdAt?.getTime() ?? 0);
  return { organizo: organizo.sort(byDate), participo: participo.sort(byDate), invitaciones };
}

// ---------- grupos ----------

export async function createGroup(actor: Actor, input: GroupInput): Promise<string> {
  const ref = groupsCol().doc();
  const hostName = await actorName(actor);
  const now = FieldValue.serverTimestamp();
  const batch = db().batch();
  batch.set(ref, {
    name: input.name,
    hostUid: actor.uid,
    hostName,
    hostParticipates: input.hostParticipates,
    budget: input.budget,
    currency: input.currency,
    eventAt: input.eventAt ? Timestamp.fromDate(input.eventAt) : null,
    location: input.location,
    notes: input.notes,
    exclusions: [],
    status: "abierto",
    drawnAt: null,
    reshuffledAt: null,
    createdAt: now,
    updatedAt: now,
  });
  if (input.hostParticipates) {
    batch.set(participantsCol(ref.id).doc(), {
      name: hostName,
      email: actor.email?.toLowerCase() ?? null,
      uid: actor.uid,
      isHost: true,
      joinedAt: now,
      joinedEmail: actor.email ?? null,
      inviteToken: null,
      createdAt: now,
    });
  }
  await batch.commit();
  return ref.id;
}

export async function updateGroup(actor: Actor, groupId: string, input: GroupInput): Promise<void> {
  await requireHost(groupId, actor);
  const hostName = await actorName(actor);
  let removedHostParticipant: string | null = null;
  await db().runTransaction(async (tx) => {
    const group = toGroup(await tx.get(groupRef(groupId)));
    const participants = (await tx.get(participantsCol(groupId))).docs.map(toParticipant);
    const hostSlot = participants.find((p) => p.uid === actor.uid);
    const update: Record<string, unknown> = {
      name: input.name,
      budget: input.budget,
      currency: input.currency,
      eventAt: input.eventAt ? Timestamp.fromDate(input.eventAt) : null,
      location: input.location,
      notes: input.notes,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (input.hostParticipates !== group.hostParticipates) {
      assertOpen(group);
      update.hostParticipates = input.hostParticipates;
      if (input.hostParticipates && !hostSlot) {
        if (participants.length >= MAX_PARTICIPANTS) {
          throw new DomainError(`El grupo ya tiene ${MAX_PARTICIPANTS} participantes, que es el máximo.`);
        }
        tx.set(participantsCol(groupId).doc(), {
          name: hostName,
          email: actor.email?.toLowerCase() ?? null,
          uid: actor.uid,
          isHost: true,
          joinedAt: FieldValue.serverTimestamp(),
          joinedEmail: actor.email ?? null,
          inviteToken: null,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      if (!input.hostParticipates && hostSlot) {
        removedHostParticipant = hostSlot.id;
        tx.delete(participantsCol(groupId).doc(hostSlot.id));
        update.exclusions = group.exclusions.filter((e) => e.from !== hostSlot.id && e.to !== hostSlot.id);
      }
    }
    tx.update(groupRef(groupId), update);
  });
  if (removedHostParticipant) await db().recursiveDelete(participantsCol(groupId).doc(removedHostParticipant));
}

export async function deleteGroup(actor: Actor, groupId: string): Promise<void> {
  await requireHost(groupId, actor);
  const invites = await invitationsCol().where("groupId", "==", groupId).get();
  const batch = db().batch();
  invites.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await db().recursiveDelete(groupRef(groupId));
}

// ---------- participantes e invitaciones ----------

export async function addParticipants(actor: Actor, groupId: string, lines: ParticipantLine[]): Promise<number> {
  if (lines.length === 0) throw new DomainError("Escribí al menos un nombre.");
  await requireHost(groupId, actor);
  await db().runTransaction(async (tx) => {
    const group = toGroup(await tx.get(groupRef(groupId)));
    assertOpen(group);
    const existing = (await tx.get(participantsCol(groupId))).docs.map(toParticipant);
    if (existing.length + lines.length > MAX_PARTICIPANTS) {
      throw new DomainError(`Un grupo puede tener hasta ${MAX_PARTICIPANTS} participantes.`);
    }
    const names = new Set(existing.map((p) => normalizeName(p.name)));
    const emails = new Set(existing.map((p) => p.email).filter(Boolean) as string[]);
    const repeated: string[] = [];
    for (const l of lines) {
      const n = normalizeName(l.name);
      if (names.has(n)) repeated.push(l.name);
      names.add(n);
      if (l.email) {
        if (emails.has(l.email)) repeated.push(l.email);
        emails.add(l.email);
      }
    }
    if (repeated.length) {
      throw new DomainError(
        `Hay nombres o emails repetidos: ${[...new Set(repeated)].join(", ")}. Si son personas distintas, agregá una inicial o un apodo.`,
      );
    }
    for (const l of lines) {
      const pRef = participantsCol(groupId).doc();
      const token = newToken();
      tx.set(pRef, {
        name: l.name,
        email: l.email,
        uid: null,
        isHost: false,
        joinedAt: null,
        joinedEmail: null,
        inviteToken: token,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(invitationsCol().doc(token), {
        groupId,
        participantId: pRef.id,
        expiresAt: inviteExpiry(),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });
  return lines.length;
}

export async function removeParticipant(actor: Actor, groupId: string, participantId: string): Promise<void> {
  if (!isSafeId(participantId)) throw new NotFoundError();
  await requireHost(groupId, actor);
  await db().runTransaction(async (tx) => {
    const group = toGroup(await tx.get(groupRef(groupId)));
    assertOpen(group);
    const pSnap = await tx.get(participantsCol(groupId).doc(participantId));
    if (!pSnap.exists) throw new NotFoundError();
    const p = toParticipant(pSnap);
    if (p.isHost) {
      throw new DomainError('Para dejar de participar, destildá "Yo también participo" en Editar.');
    }
    if (p.inviteToken) tx.delete(invitationsCol().doc(p.inviteToken));
    tx.delete(pSnap.ref);
    tx.update(groupRef(groupId), {
      exclusions: group.exclusions.filter((e) => e.from !== participantId && e.to !== participantId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await db().recursiveDelete(participantsCol(groupId).doc(participantId));
}

export async function regenerateInvite(actor: Actor, groupId: string, participantId: string): Promise<void> {
  if (!isSafeId(participantId)) throw new NotFoundError();
  await requireHost(groupId, actor);
  await db().runTransaction(async (tx) => {
    const group = toGroup(await tx.get(groupRef(groupId)));
    assertOpen(group);
    const pSnap = await tx.get(participantsCol(groupId).doc(participantId));
    if (!pSnap.exists) throw new NotFoundError();
    const p = toParticipant(pSnap);
    if (p.uid) throw new DomainError(`${p.name} ya se sumó: no necesita link.`);
    if (p.inviteToken) tx.delete(invitationsCol().doc(p.inviteToken));
    const token = newToken();
    tx.set(invitationsCol().doc(token), {
      groupId,
      participantId,
      expiresAt: inviteExpiry(),
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(pSnap.ref, { inviteToken: token });
  });
}

export type InvitationView =
  | { status: "invalida" }
  | { status: "vencida" | "cerrado" | "valida"; group: Group; participantName: string };

/** Vista pública de una invitación (sin datos de otros participantes). */
export async function getInvitation(token: string): Promise<InvitationView> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return { status: "invalida" };
  const inv = await invitationsCol().doc(token).get();
  if (!inv.exists) return { status: "invalida" };
  const { groupId, participantId, expiresAt } = inv.data()!;
  const [gSnap, pSnap] = await Promise.all([groupRef(groupId).get(), participantsCol(groupId).doc(participantId).get()]);
  if (!gSnap.exists || !pSnap.exists) return { status: "invalida" };
  const group = toGroup(gSnap);
  const participantName = pSnap.data()!.name as string;
  if (group.status === "sorteado") return { status: "cerrado", group, participantName };
  if ((expiresAt as Timestamp).toMillis() < Date.now()) return { status: "vencida", group, participantName };
  return { status: "valida", group, participantName };
}

function linkAccount(
  tx: FirebaseFirestore.Transaction,
  participantRef: FirebaseFirestore.DocumentReference,
  actor: Actor,
  token: string | null,
) {
  tx.update(participantRef, {
    uid: actor.uid,
    joinedAt: FieldValue.serverTimestamp(),
    joinedEmail: actor.email ?? null,
    inviteToken: null,
  });
  if (token) tx.delete(invitationsCol().doc(token));
}

export async function acceptInvitation(
  actor: Actor,
  token: string,
): Promise<{ groupId: string; alreadyMember: boolean }> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new DomainError("Este link no es válido.");
  return db().runTransaction(async (tx) => {
    const inv = await tx.get(invitationsCol().doc(token));
    if (!inv.exists) throw new DomainError("Este link ya se usó o no es válido. Pedile uno nuevo a quien organiza.");
    const { groupId, participantId, expiresAt } = inv.data()!;
    const group = toGroup(await tx.get(groupRef(groupId)));
    const pRef = participantsCol(groupId).doc(participantId);
    const pSnap = await tx.get(pRef);
    const mine = await tx.get(participantsCol(groupId).where("uid", "==", actor.uid).limit(1));
    if (!mine.empty) return { groupId, alreadyMember: true };
    if (group.hostUid === actor.uid) {
      throw new DomainError('Sos quien organiza este grupo. Si querés participar, tildá "Yo también participo" en Editar.');
    }
    if (group.status === "sorteado") throw new DomainError("El sorteo de este grupo ya se hizo.");
    if ((expiresAt as Timestamp).toMillis() < Date.now()) {
      throw new DomainError("Este link venció. Pedile uno nuevo a quien organiza.");
    }
    if (!pSnap.exists || pSnap.data()!.uid) throw new DomainError("Este link ya se usó.");
    linkAccount(tx, pRef, actor, token);
    return { groupId, alreadyMember: false };
  });
}

/** Sumarse sin link cuando el organizador cargó tu email (FR-003). Requiere email verificado. */
export async function joinByEmail(actor: Actor, groupId: string, participantId: string): Promise<void> {
  if (!isSafeId(groupId) || !isSafeId(participantId) || !actor.email) throw new NotFoundError();
  const record = await adminAuth().getUser(actor.uid);
  if (!record.emailVerified) {
    throw new DomainError("Primero confirmá tu email (te mandamos un mail) y después vas a poder sumarte.");
  }
  await db().runTransaction(async (tx) => {
    const group = toGroup(await tx.get(groupRef(groupId)));
    assertOpen(group);
    const pRef = participantsCol(groupId).doc(participantId);
    const pSnap = await tx.get(pRef);
    const mine = await tx.get(participantsCol(groupId).where("uid", "==", actor.uid).limit(1));
    if (!pSnap.exists) throw new NotFoundError();
    const p = toParticipant(pSnap);
    if (p.email !== actor.email!.toLowerCase()) throw new NotFoundError();
    if (!mine.empty) throw new DomainError("Ya estás en este grupo.");
    if (p.uid) throw new DomainError("Ese lugar ya está ocupado.");
    linkAccount(tx, pRef, actor, p.inviteToken);
  });
}

// ---------- exclusiones ----------

export async function addExclusion(actor: Actor, groupId: string, from: string, to: string, mutual: boolean) {
  if (!isSafeId(from) || !isSafeId(to) || from === to) throw new DomainError("Elegí dos personas distintas.");
  await requireHost(groupId, actor);
  await db().runTransaction(async (tx) => {
    const group = toGroup(await tx.get(groupRef(groupId)));
    assertOpen(group);
    const [a, b] = await Promise.all([
      tx.get(participantsCol(groupId).doc(from)),
      tx.get(participantsCol(groupId).doc(to)),
    ]);
    if (!a.exists || !b.exists) throw new NotFoundError();
    const next = [...group.exclusions];
    const add = (f: string, t: string) => {
      if (!next.some((e) => e.from === f && e.to === t)) next.push({ from: f, to: t });
    };
    add(from, to);
    if (mutual) add(to, from);
    tx.update(groupRef(groupId), { exclusions: next, updatedAt: FieldValue.serverTimestamp() });
  });
}

/** Quita la exclusión entre dos personas, en los dos sentidos. */
export async function removeExclusionPair(actor: Actor, groupId: string, a: string, b: string) {
  await requireHost(groupId, actor);
  await db().runTransaction(async (tx) => {
    const group = toGroup(await tx.get(groupRef(groupId)));
    assertOpen(group);
    tx.update(groupRef(groupId), {
      exclusions: group.exclusions.filter(
        (e) => !((e.from === a && e.to === b) || (e.from === b && e.to === a)),
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

// ---------- sorteo ----------

export async function runDraw(
  actor: Actor,
  groupId: string,
  confirmPending: boolean,
  rng: Rng = secureRng,
): Promise<{ participants: number; removedPending: number }> {
  await requireHost(groupId, actor);
  return db().runTransaction(async (tx) => {
    const group = toGroup(await tx.get(groupRef(groupId)));
    if (group.status === "sorteado") throw new DomainError("El sorteo ya se hizo.");
    const participants = (await tx.get(participantsCol(groupId))).docs.map(toParticipant);
    const joined = participants.filter((p) => p.uid);
    const pending = participants.filter((p) => !p.uid);
    if (joined.length < MIN_PARTICIPANTS) {
      throw new DomainError(`Hacen falta al menos ${MIN_PARTICIPANTS} personas sumadas para sortear.`);
    }
    if (pending.length && !confirmPending) {
      throw new DomainError(
        `Hay ${pending.length} ${pending.length === 1 ? "persona que no se sumó" : "personas que no se sumaron"}. Confirmá que quedan afuera del sorteo.`,
      );
    }
    const ids = new Set(joined.map((p) => p.id));
    const exclusions = group.exclusions.filter((e) => ids.has(e.from) && ids.has(e.to));
    const result = drawAssignments([...ids], exclusions, rng);
    if (!result.ok) {
      throw new DomainError(
        "Con estas exclusiones no hay forma de que a todos les toque alguien. Sacá alguna exclusión y probá de nuevo.",
      );
    }
    for (const p of pending) {
      tx.delete(participantsCol(groupId).doc(p.id));
      if (p.inviteToken) tx.delete(invitationsCol().doc(p.inviteToken));
    }
    for (const [giver, receiver] of result.assignments) {
      tx.set(assignmentsCol(groupId).doc(giver), { receiverId: receiver, createdAt: FieldValue.serverTimestamp() });
    }
    tx.update(groupRef(groupId), {
      status: "sorteado",
      drawnAt: FieldValue.serverTimestamp(),
      exclusions,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { participants: joined.length, removedPending: pending.length };
  });
}

// ---------- "Mi página" ----------

export type MyPage = {
  group: Group;
  me: Participant;
  myWishes: Wish[];
  /** Solo la asignación propia. Nunca la de otra persona. */
  myReceiver: { name: string; wishes: Wish[] } | null;
};

async function listWishes(groupId: string, participantId: string): Promise<Wish[]> {
  const snap = await wishesCol(groupId, participantId).orderBy("createdAt").get();
  return snap.docs.map((d) => ({ id: d.id, text: d.data().text, url: d.data().url ?? null }));
}

export async function getMyPage(actor: Actor, groupId: string): Promise<MyPage> {
  const access = await getGroupAccess(groupId, actor);
  if (!access || !access.me) throw new NotFoundError();
  const { group, me } = access;
  const myWishes = await listWishes(groupId, me.id);
  let myReceiver: MyPage["myReceiver"] = null;
  if (group.status === "sorteado") {
    const assignment = await assignmentsCol(groupId).doc(me.id).get();
    if (assignment.exists) {
      const receiverId = assignment.data()!.receiverId as string;
      const receiver = await participantsCol(groupId).doc(receiverId).get();
      if (receiver.exists) {
        myReceiver = { name: receiver.data()!.name, wishes: await listWishes(groupId, receiverId) };
      }
    }
  }
  return { group, me, myWishes, myReceiver };
}

// ---------- lista de deseos (solo la propia) ----------

async function myParticipantOrThrow(actor: Actor, groupId: string): Promise<Participant> {
  const access = await getGroupAccess(groupId, actor);
  if (!access || !access.me) throw new NotFoundError();
  return access.me;
}

export async function addWish(actor: Actor, groupId: string, input: WishInput): Promise<void> {
  const me = await myParticipantOrThrow(actor, groupId);
  const count = (await wishesCol(groupId, me.id).count().get()).data().count;
  if (count >= MAX_WISHES) throw new DomainError(`Podés tener hasta ${MAX_WISHES} deseos.`);
  await wishesCol(groupId, me.id).add({ text: input.text, url: input.url, createdAt: FieldValue.serverTimestamp() });
}

export async function updateWish(actor: Actor, groupId: string, wishId: string, input: WishInput): Promise<void> {
  if (!isSafeId(wishId)) throw new NotFoundError();
  const me = await myParticipantOrThrow(actor, groupId);
  const ref = wishesCol(groupId, me.id).doc(wishId);
  if (!(await ref.get()).exists) throw new NotFoundError();
  await ref.update({ text: input.text, url: input.url });
}

export async function deleteWish(actor: Actor, groupId: string, wishId: string): Promise<void> {
  if (!isSafeId(wishId)) throw new NotFoundError();
  const me = await myParticipantOrThrow(actor, groupId);
  await wishesCol(groupId, me.id).doc(wishId).delete();
}
