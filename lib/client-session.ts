import { signOut, type User } from "firebase/auth";

import { SessionError } from "@/lib/auth-errors";
import { clientAuth } from "@/lib/firebase/client";

/** Cambia el login del SDK web por la cookie de sesión del servidor. */
export async function startServerSession(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/sesion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  // El login del SDK web era solo en memoria; la sesión ahora vive en la cookie.
  await signOut(clientAuth()).catch(() => undefined);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new SessionError(
      body.error === "login_viejo"
        ? "Pasó mucho tiempo desde que entraste. Probá de nuevo."
        : "No pudimos iniciar tu sesión. Probá de nuevo en un rato.",
    );
  }
}

export async function endServerSession(): Promise<void> {
  await fetch("/api/sesion", { method: "DELETE" });
}

export const EMAIL_LINK_STORAGE_KEY = "amigo-invisible:email-para-ingresar";
/** Nombre elegido al registrarse con link por mail; se aplica al abrir el link. */
export const NAME_LINK_STORAGE_KEY = "amigo-invisible:nombre-para-registro";
