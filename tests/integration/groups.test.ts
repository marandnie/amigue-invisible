// Tests de la capa de datos contra los emuladores de Auth y Firestore.
// Correr con: npm run test:integration
// Cubren la constitución I (privacidad), FR-008, FR-010..FR-017, FR-019, FR-020 y SC-004.
import { beforeAll, describe, expect, it } from "vitest";

import { DomainError, NotFoundError } from "@/lib/domain/errors";
import type { GroupInput } from "@/lib/domain/schemas";

process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??= "demo-amigo-invisible";

type Data = typeof import("@/lib/data/groups");
let data: Data;
let admin: typeof import("@/lib/firebase/admin");

type Actor = { uid: string; email: string; displayName: string };
let seq = 0;

async function user(name: string, emailVerified = true): Promise<Actor> {
  seq++;
  const email = `${name.toLowerCase()}${seq}-${Date.now()}@example.com`;
  const rec = await admin.adminAuth().createUser({ email, displayName: name, emailVerified, password: "contrasena-larga" });
  return { uid: rec.uid, email, displayName: name };
}

const groupInput = (over: Partial<GroupInput> = {}): GroupInput => ({
  name: "Navidad",
  budget: 15000,
  currency: "ARS",
  eventAt: new Date("2026-12-24T21:00:00-03:00"),
  location: "Casa de la tía",
  notes: null,
  hostParticipates: true,
  ...over,
});

/** Crea un grupo con el organizador (participa) y `n` personas sumadas por invitación. */
async function groupWith(n: number, hostParticipates = true) {
  const host = await user("Host");
  const groupId = await data.createGroup(host, groupInput({ hostParticipates }));
  const people: Actor[] = [];
  await data.addParticipants(
    host,
    groupId,
    Array.from({ length: n }, (_, i) => ({ name: `Persona ${i}`, email: null })),
  );
  const list = await data.listParticipants(groupId, host);
  for (const p of list.filter((x) => !x.uid)) {
    const u = await user(p.name.replace(" ", ""));
    await data.acceptInvitation(u, p.inviteToken!);
    people.push(u);
  }
  return { host, groupId, people };
}

beforeAll(async () => {
  data = await import("@/lib/data/groups");
  admin = await import("@/lib/firebase/admin");
});

describe("grupos e invitaciones (US1, US2)", () => {
  it("crea el grupo; el organizador queda sumado si participa", async () => {
    const host = await user("Ana");
    const id = await data.createGroup(host, groupInput());
    const list = await data.listParticipants(id, host);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ isHost: true, uid: host.uid });
  });

  it("si el organizador no participa, no ocupa lugar", async () => {
    const host = await user("Ana");
    const id = await data.createGroup(host, groupInput({ hostParticipates: false }));
    expect(await data.listParticipants(id, host)).toHaveLength(0);
  });

  it("rechaza nombres o emails repetidos", async () => {
    const host = await user("Ana");
    const id = await data.createGroup(host, groupInput());
    await data.addParticipants(host, id, [{ name: "Tía Marta", email: "marta@example.com" }]);
    await expect(data.addParticipants(host, id, [{ name: "tia marta", email: null }])).rejects.toThrow(DomainError);
    await expect(data.addParticipants(host, id, [{ name: "Otra", email: "marta@example.com" }])).rejects.toThrow(
      DomainError,
    );
  });

  it("un desconocido no ve el grupo ni puede administrarlo", async () => {
    const { groupId } = await groupWith(2);
    const intruso = await user("Intruso");
    expect(await data.getGroupAccess(groupId, intruso)).toBeNull();
    await expect(data.listParticipants(groupId, intruso)).rejects.toThrow(NotFoundError);
    await expect(data.runDraw(intruso, groupId, true)).rejects.toThrow(NotFoundError);
  });

  it("un participante no puede administrar el grupo", async () => {
    const { groupId, people } = await groupWith(3);
    await expect(data.listParticipants(groupId, people[0])).rejects.toThrow(NotFoundError);
    await expect(data.addParticipants(people[0], groupId, [{ name: "X", email: null }])).rejects.toThrow(NotFoundError);
  });

  it("el link es de un solo uso y no deja sumarse dos veces", async () => {
    const host = await user("Ana");
    const id = await data.createGroup(host, groupInput());
    await data.addParticipants(host, id, [
      { name: "Bruno", email: null },
      { name: "Caro", email: null },
    ]);
    const [b, c] = (await data.listParticipants(id, host)).filter((p) => !p.uid);
    const bruno = await user("Bruno");
    expect(await data.acceptInvitation(bruno, b.inviteToken!)).toEqual({ groupId: id, alreadyMember: false });
    const otro = await user("Otro");
    await expect(data.acceptInvitation(otro, b.inviteToken!)).rejects.toThrow(DomainError);
    // Bruno abre el link de Caro: no se suma dos veces y el link de Caro sigue sirviendo.
    expect(await data.acceptInvitation(bruno, c.inviteToken!)).toEqual({ groupId: id, alreadyMember: true });
    expect((await data.getInvitation(c.inviteToken!)).status).toBe("valida");
  });

  it("regenerar invalida el link anterior", async () => {
    const host = await user("Ana");
    const id = await data.createGroup(host, groupInput());
    await data.addParticipants(host, id, [{ name: "Bruno", email: null }]);
    const before = (await data.listParticipants(id, host)).find((p) => !p.uid)!;
    await data.regenerateInvite(host, id, before.id);
    const after = (await data.listParticipants(id, host)).find((p) => !p.uid)!;
    expect(after.inviteToken).not.toBe(before.inviteToken);
    expect((await data.getInvitation(before.inviteToken!)).status).toBe("invalida");
  });

  it("sumarse por email exige email verificado y que coincida", async () => {
    const host = await user("Ana");
    const sinVerificar = await user("Dani", false);
    const verificado = await user("Eli", true);
    const id = await data.createGroup(host, groupInput());
    await data.addParticipants(host, id, [
      { name: "Dani", email: sinVerificar.email },
      { name: "Eli", email: verificado.email },
    ]);
    const list = await data.listParticipants(id, host);
    const dani = list.find((p) => p.name === "Dani")!;
    const eli = list.find((p) => p.name === "Eli")!;
    await expect(data.joinByEmail(sinVerificar, id, dani.id)).rejects.toThrow(DomainError);
    await expect(data.joinByEmail(verificado, id, dani.id)).rejects.toThrow(NotFoundError);
    const mine = await data.listMyGroups(verificado);
    expect(mine.invitaciones.map((i) => i.participantId)).toContain(eli.id);
    await data.joinByEmail(verificado, id, eli.id);
    expect((await data.listMyGroups(verificado)).participo.map((g) => g.id)).toContain(id);
  });
});

describe("sorteo (US3) y privacidad (constitución I)", () => {
  it("no se puede sortear con menos de 3 sumados", async () => {
    const { host, groupId } = await groupWith(1);
    await expect(data.runDraw(host, groupId, true)).rejects.toThrow(/al menos 3/);
  });

  it("con pendientes pide confirmación y después los saca", async () => {
    const { host, groupId } = await groupWith(3);
    await data.addParticipants(host, groupId, [{ name: "Pendiente", email: null }]);
    const pend = (await data.listParticipants(groupId, host)).find((p) => !p.uid)!;
    await expect(data.runDraw(host, groupId, false)).rejects.toThrow(/Confirmá/);
    await data.runDraw(host, groupId, true);
    const list = await data.listParticipants(groupId, host);
    expect(list.every((p) => p.uid)).toBe(true);
    expect((await data.getInvitation(pend.inviteToken!)).status).toBe("invalida");
  });

  it("cada uno ve solo a quién le regala; entre todos forman una asignación válida", async () => {
    const { host, groupId, people } = await groupWith(5);
    await data.runDraw(host, groupId, true);
    const everyone = [host, ...people];
    const names = (await data.listParticipants(groupId, host)).map((p) => p.name);
    const received: string[] = [];
    for (const a of everyone) {
      const page = await data.getMyPage(a, groupId);
      expect(page.myReceiver).not.toBeNull();
      expect(page.myReceiver!.name).not.toBe(page.me.name);
      received.push(page.myReceiver!.name);
      // La página no expone ninguna otra asignación.
      expect(JSON.stringify(page)).not.toMatch(/receiverId|assignments/);
    }
    expect(new Set(received).size).toBe(everyone.length);
    expect(received.sort()).toEqual(names.sort());
  });

  it("el organizador que no participa no puede ver ninguna asignación", async () => {
    const { host, groupId } = await groupWith(3, false);
    await data.runDraw(host, groupId, true);
    await expect(data.getMyPage(host, groupId)).rejects.toThrow(NotFoundError);
    const access = await data.getGroupAccess(groupId, host);
    expect(JSON.stringify(access)).not.toMatch(/receiverId|assignments/);
  });

  it("el sorteo ocurre una sola vez aunque se pida en paralelo", async () => {
    const { host, groupId } = await groupWith(4);
    const results = await Promise.allSettled([
      data.runDraw(host, groupId, true),
      data.runDraw(host, groupId, true),
      data.runDraw(host, groupId, true),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const assignments = await admin.adminDb().collection("groups").doc(groupId).collection("assignments").get();
    expect(assignments.size).toBe(5);
  });

  it("después del sorteo no se pueden sumar ni sacar personas", async () => {
    const { host, groupId, people } = await groupWith(3);
    await data.runDraw(host, groupId, true);
    await expect(data.addParticipants(host, groupId, [{ name: "Tarde", email: null }])).rejects.toThrow(/ya se hizo/);
    const p = (await data.listParticipants(groupId, host)).find((x) => x.uid === people[0].uid)!;
    await expect(data.removeParticipant(host, groupId, p.id)).rejects.toThrow(/ya se hizo/);
  });
});

describe("exclusiones (US5)", () => {
  it("el sorteo respeta las exclusiones mutuas", async () => {
    for (let i = 0; i < 8; i++) {
      const { host, groupId, people } = await groupWith(3);
      const list = await data.listParticipants(groupId, host);
      const hostP = list.find((p) => p.isHost)!;
      const a = list.find((p) => p.uid === people[0].uid)!;
      await data.addExclusion(host, groupId, hostP.id, a.id, true);
      await data.runDraw(host, groupId, true);
      expect((await data.getMyPage(host, groupId)).myReceiver!.name).not.toBe(a.name);
      expect((await data.getMyPage(people[0], groupId)).myReceiver!.name).not.toBe(hostP.name);
    }
  });

  it("rechaza sortear si las exclusiones lo hacen imposible", async () => {
    const { host, groupId } = await groupWith(2);
    const [x, y, z] = await data.listParticipants(groupId, host);
    await data.addExclusion(host, groupId, x.id, y.id, true);
    await data.addExclusion(host, groupId, x.id, z.id, true);
    await data.addExclusion(host, groupId, y.id, z.id, true);
    await expect(data.runDraw(host, groupId, true)).rejects.toThrow(/exclusiones/);
    expect((await data.getGroupAccess(groupId, host))!.group.status).toBe("abierto");
  });

  it("los participantes no ven las exclusiones", async () => {
    const { host, groupId, people } = await groupWith(3);
    const [x, y] = await data.listParticipants(groupId, host);
    await data.addExclusion(host, groupId, x.id, y.id, true);
    const names = await data.listJoinedNames(groupId, people[0]);
    expect(JSON.stringify(names)).not.toMatch(/exclusion/);
  });
});

describe("lista de deseos (US4)", () => {
  it("quien regala ve la lista de su persona; nadie más", async () => {
    const { host, groupId, people } = await groupWith(2);
    for (const p of [host, ...people]) {
      await data.addWish(p, groupId, { text: `Libro de ${p.displayName}`, url: "https://example.com/libro" });
    }
    await data.runDraw(host, groupId, true);
    for (const p of [host, ...people]) {
      const page = await data.getMyPage(p, groupId);
      expect(page.myWishes).toHaveLength(1);
      expect(page.myReceiver!.wishes).toHaveLength(1);
      expect(page.myReceiver!.wishes[0].text).not.toBe(page.myWishes[0].text);
    }
  });

  it("solo el dueño edita y borra sus deseos", async () => {
    const { host, groupId, people } = await groupWith(2);
    await data.addWish(people[0], groupId, { text: "Taza", url: null });
    const wish = (await data.getMyPage(people[0], groupId)).myWishes[0];
    await expect(data.deleteWish(people[1], groupId, wish.id)).resolves.toBeUndefined();
    expect((await data.getMyPage(people[0], groupId)).myWishes).toHaveLength(1);
    await expect(data.updateWish(people[1], groupId, wish.id, { text: "X", url: null })).rejects.toThrow(NotFoundError);
    await data.updateWish(people[0], groupId, wish.id, { text: "Taza grande", url: null });
    expect((await data.getMyPage(people[0], groupId)).myWishes[0].text).toBe("Taza grande");
    const intruso = await user("Intruso");
    await expect(data.addWish(intruso, groupId, { text: "X", url: null })).rejects.toThrow(NotFoundError);
    void host;
  });
});

describe("borrar grupo", () => {
  it("borra todo, incluidas las invitaciones", async () => {
    const host = await user("Ana");
    const id = await data.createGroup(host, groupInput());
    await data.addParticipants(host, id, [{ name: "Bruno", email: null }]);
    const token = (await data.listParticipants(id, host)).find((p) => !p.uid)!.inviteToken!;
    await data.deleteGroup(host, id);
    expect((await data.getInvitation(token)).status).toBe("invalida");
    expect(await data.getGroupAccess(id, host)).toBeNull();
  });
});
