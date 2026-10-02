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

/** Crea o actualiza el perfil en cada login. El nombre no se pisa si ya existe. */
export async function upsertProfile(token: DecodedIdToken): Promise<void> {
  const record = await adminAuth().getUser(token.uid);
  const ref = adminDb().collection("users").doc(token.uid);
  const base = {
    email: (record.email ?? token.email ?? "").toLowerCase(),
    emailVerified: record.emailVerified,
    providers: record.providerData.map((p) => p.providerId),
    lastLoginAt: FieldValue.serverTimestamp(),
  };
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      tx.update(ref, base);
    } else {
      tx.set(ref, {
        ...base,
        displayName: defaultName(token, record.displayName),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });
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
