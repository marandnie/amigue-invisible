import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserPopupRedirectResolver,
  connectAuthEmulator,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";

// Solo para componentes cliente.
//
// La sesión "de verdad" es la cookie __session del servidor (ver app/api/sesion).
// Por eso el SDK web guarda el login solo en memoria: se usa para obtener el ID token,
// se crea la cookie y listo. Así no hay dos estados de sesión que se desincronicen.

const envConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let auth: Auth | undefined;

function clientApp(): FirebaseApp {
  const existing = getApps()[0];
  if (existing) return existing;
  // En App Hosting la config llega por FIREBASE_WEBAPP_CONFIG en el build y initializeApp() sin
  // argumentos la toma sola. En dev se usan las variables NEXT_PUBLIC_FIREBASE_*.
  return envConfig.apiKey ? initializeApp(envConfig) : initializeApp();
}

export function clientAuth(): Auth {
  if (auth) return auth;
  auth = initializeAuth(clientApp(), {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  auth.languageCode = "es-419";
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return auth;
}
