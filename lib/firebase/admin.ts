import "server-only";

import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// En App Hosting el Admin SDK usa las credenciales por defecto del backend.
// En desarrollo apunta a los emuladores vía FIREBASE_AUTH_EMULATOR_HOST y FIRESTORE_EMULATOR_HOST
// (ver .env.example) y necesita el projectId del proyecto demo.
function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return projectId ? initializeApp({ projectId }) : initializeApp();
}

export function adminAuth() {
  return getAuth(adminApp());
}

export function adminDb() {
  return getFirestore(adminApp());
}
