// Config web de Firebase que se resuelve en el build. La usa `next.config.mjs`.
//
// En App Hosting la config web llega por FIREBASE_WEBAPP_CONFIG, y solo durante el build.
// De ahí sale la config pública para el navegador (sin guardar ninguna clave en el repo).
//
// Si NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN es nuestro dominio, el login con Google pasa por
// https://<nuestro dominio>/__/auth/*, que hacemos proxy hacia <proyecto>.firebaseapp.com.
// Así todo el flujo queda en el mismo dominio que la app, y Safari/iPhone no lo bloquea
// por particionar el almacenamiento de terceros (research R6 de la feature 001).

const REQUIRED = ["apiKey", "projectId", "appId"];

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ publicEnv: Record<string, string>, authProxyOrigin: string | null }}
 */
export function firebaseBuildConfig(env) {
  const raw = env.FIREBASE_WEBAPP_CONFIG;
  // En desarrollo no existe: se usan las NEXT_PUBLIC_FIREBASE_* de .env.local y no hay proxy.
  if (!raw) return { publicEnv: {}, authProxyOrigin: null };

  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_WEBAPP_CONFIG no es un JSON válido");
  }
  for (const key of REQUIRED) {
    if (typeof cfg?.[key] !== "string" || !cfg[key]) {
      throw new Error(`FIREBASE_WEBAPP_CONFIG no tiene "${key}"`);
    }
  }

  const firebaseHost = `${cfg.projectId}.firebaseapp.com`;
  const authDomain = env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || cfg.authDomain || firebaseHost;
  if (!/^[a-z0-9.-]+$/i.test(authDomain)) {
    throw new Error(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN tiene que ser un host, sin https:// ni barras: "${authDomain}"`);
  }

  return {
    publicEnv: {
      NEXT_PUBLIC_FIREBASE_API_KEY: cfg.apiKey,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: cfg.projectId,
      NEXT_PUBLIC_FIREBASE_APP_ID: cfg.appId,
    },
    authProxyOrigin: authDomain === firebaseHost ? null : `https://${firebaseHost}`,
  };
}

/**
 * Rewrites (proxy transparente) para que el dominio propio sirva los helpers de login.
 * Un redirect no sirve: el navegador tiene que creer que todo vive en nuestro dominio.
 * @param {string | null} origin
 */
export function authProxyRewrites(origin) {
  if (!origin) return [];
  return [
    { source: "/__/auth/:path*", destination: `${origin}/__/auth/:path*` },
    { source: "/__/firebase/:path*", destination: `${origin}/__/firebase/:path*` },
  ];
}
