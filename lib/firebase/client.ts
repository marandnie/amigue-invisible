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
  // Las NEXT_PUBLIC_FIREBASE_* vienen de .env.local en dev y de next.config.mjs en App Hosting
  // (armadas con FIREBASE_WEBAPP_CONFIG y el authDomain propio, ver lib/firebase/build-config.mjs).
  // initializeApp() sin argumentos queda como respaldo: usa la config que inyecta App Hosting.
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
