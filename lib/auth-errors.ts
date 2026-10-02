// Mensajes de error de Firebase Auth en español rioplatense (constitución II).
const MENSAJES: Record<string, string> = {
  "auth/invalid-credential": "El email o la contraseña no coinciden.",
  "auth/wrong-password": "El email o la contraseña no coinciden.",
  "auth/user-not-found": "El email o la contraseña no coinciden.",
  "auth/invalid-email": "Ese email no parece válido.",
  "auth/missing-email": "Escribí tu email.",
  "auth/email-already-in-use":
    "Ya hay una cuenta con ese email. Entrá con el método que usaste la otra vez, o pedí un link por mail.",
  "auth/account-exists-with-different-credential":
    "Ya tenés cuenta con ese email usando otro método. Entrá con ese método o pedí un link por mail.",
  "auth/weak-password": "La contraseña tiene que tener al menos 10 caracteres.",
  "auth/password-does-not-meet-requirements": "La contraseña tiene que tener al menos 10 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos y probá de nuevo.",
  "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar.",
  "auth/cancelled-popup-request": "Se cerró la ventana de Google antes de terminar.",
  "auth/popup-blocked":
    "El navegador bloqueó la ventana de Google. Permití las ventanas emergentes o pedí un link por mail.",
  "auth/network-request-failed": "No hay conexión. Revisá tu internet y probá de nuevo.",
  "auth/invalid-action-code": "El link ya se usó o venció. Pedí uno nuevo.",
  "auth/expired-action-code": "El link venció. Pedí uno nuevo.",
  "auth/web-storage-unsupported":
    "Este navegador no permite iniciar sesión. Abrí el link en Chrome o Safari.",
  "auth/operation-not-allowed": "Ese método de ingreso todavía no está habilitado.",
};

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code && MENSAJES[code]) return MENSAJES[code];
  if (err instanceof SessionError) return err.message;
  return "Algo salió mal. Probá de nuevo en un rato.";
}

export class SessionError extends Error {}
