import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase/admin";

// Modelo: specs/001-plataforma-gcp-dominio/data-model.md (users/{uid})

export type Profile = {
  displayName: string;
  email: string;
  emailVerified: boolean;
  providers: string[];
};

function defaultName(token: DecodedIdToken, recordName?: string): string {
  const fromToken = typeof token.name === "string" ? token.name : undefined;
  const name = (fromToken ?? recordName ?? token.email?.split("@")[0] ?? "Sin nombre").trim();
  return name.slice(0, 60) || "Sin nombre";
}

export type UpsertResult = {
  /** true solo si este ingreso creó el perfil (primer ingreso de la persona). */
  created: boolean;
  displayName: string;
  email: string;
  providers: string[];
};

/** Crea o actualiza el perfil en cada login. El nombre no se pisa si ya existe. */
export async function upsertProfile(token: DecodedIdToken): Promise<UpsertResult> {
  const record = await adminAuth().getUser(token.uid);
  const ref = adminDb().collection("users").doc(token.uid);
  const base = {
    email: (record.email ?? token.email ?? "").toLowerCase(),
    emailVerified: record.emailVerified,
    providers: record.providerData.map((p) => p.providerId),
    lastLoginAt: FieldValue.serverTimestamp(),
  };
  let created = false;
  let displayName = "";
  await adminDb().runTransaction(async (tx) => {
    // La transacción puede reintentarse: el resultado se recalcula en cada intento (research R1 de la 004).
    created = false;
    const snap = await tx.get(ref);
    if (snap.exists) {
      displayName = String(snap.get("displayName") ?? "");
      tx.update(ref, base);
    } else {
      created = true;
      displayName = defaultName(token, record.displayName);
      tx.set(ref, { ...base, displayName, createdAt: FieldValue.serverTimestamp() });
    }
  });
  return { created, displayName, email: base.email, providers: base.providers };
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    displayName: d.displayName,
    email: d.email,
    emailVerified: d.emailVerified === true,
    providers: Array.isArray(d.providers) ? d.providers : [],
  };
}

/** Feature 005: cambia el nombre para mostrar. Los grupos existentes no se tocan (research R2). */
export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  await adminDb().collection("users").doc(uid).update({ displayName });
  // Coherencia con Auth (research R1); si falla, el perfil ya quedó bien.
  await adminAuth()
    .updateUser(uid, { displayName })
    .catch(() => undefined);
}
