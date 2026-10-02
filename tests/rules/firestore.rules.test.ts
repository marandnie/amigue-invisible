// Constitución VI: las reglas de Firestore se testean contra el emulador.
// Correr con: npm run test:rules
import { readFileSync } from "node:fs";

import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-amigo-invisible",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
  // Datos sembrados salteando las reglas, como lo haría el servidor.
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users/alicia"), { displayName: "Alicia" });
    await setDoc(doc(ctx.firestore(), "groups/g1/assignments/alicia"), { receiverId: "bruno" });
  });
});

afterAll(async () => {
  await env?.cleanup();
});

describe("reglas de Firestore: deny-all desde el cliente", () => {
  it("una visita anónima no puede leer perfiles", async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/alicia")));
  });

  it("ni siquiera la dueña puede leer su perfil directo (pasa por el servidor)", async () => {
    await assertFails(getDoc(doc(env.authenticatedContext("alicia").firestore(), "users/alicia")));
  });

  it("nadie puede escribir perfiles desde el cliente", async () => {
    const db = env.authenticatedContext("alicia").firestore();
    await assertFails(setDoc(doc(db, "users/alicia"), { displayName: "Otra" }));
    await assertFails(deleteDoc(doc(db, "users/alicia")));
  });

  it("nadie puede listar colecciones", async () => {
    await assertFails(getDocs(collection(env.authenticatedContext("alicia").firestore(), "users")));
  });

  it("una asignación no se puede leer desde el cliente, ni siquiera la propia", async () => {
    await assertFails(
      getDoc(doc(env.authenticatedContext("alicia").firestore(), "groups/g1/assignments/alicia")),
    );
    await assertFails(
      getDoc(doc(env.authenticatedContext("bruno").firestore(), "groups/g1/assignments/alicia")),
    );
  });
});
