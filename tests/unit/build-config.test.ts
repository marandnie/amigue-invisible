import { describe, expect, it } from "vitest";

import { authProxyRewrites, firebaseBuildConfig } from "@/lib/firebase/build-config.mjs";

const WEBAPP = JSON.stringify({
  apiKey: "clave-publica",
  appId: "1:123:web:abc",
  authDomain: "mi-proyecto.firebaseapp.com",
  projectId: "mi-proyecto",
  storageBucket: "mi-proyecto.firebasestorage.app",
});

describe("firebaseBuildConfig", () => {
  it("en desarrollo (sin FIREBASE_WEBAPP_CONFIG) no toca nada", () => {
    expect(firebaseBuildConfig({ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com" })).toEqual({
      publicEnv: {},
      authProxyOrigin: null,
    });
  });

  it("con dominio propio: authDomain propio y proxy hacia firebaseapp.com", () => {
    const { publicEnv, authProxyOrigin } = firebaseBuildConfig({
      FIREBASE_WEBAPP_CONFIG: WEBAPP,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "amigoinvisible.com.ar",
    });
    expect(publicEnv).toEqual({
      NEXT_PUBLIC_FIREBASE_API_KEY: "clave-publica",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "amigoinvisible.com.ar",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "mi-proyecto",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
    });
    expect(authProxyOrigin).toBe("https://mi-proyecto.firebaseapp.com");
  });

  it("sin dominio propio usa el de Firebase y no arma proxy", () => {
    const { publicEnv, authProxyOrigin } = firebaseBuildConfig({ FIREBASE_WEBAPP_CONFIG: WEBAPP });
    expect(publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN).toBe("mi-proyecto.firebaseapp.com");
    expect(authProxyOrigin).toBeNull();
  });

  it("falla el build si la config está rota o incompleta", () => {
    expect(() => firebaseBuildConfig({ FIREBASE_WEBAPP_CONFIG: "{nope" })).toThrow(/JSON/);
    expect(() => firebaseBuildConfig({ FIREBASE_WEBAPP_CONFIG: JSON.stringify({ projectId: "x" }) })).toThrow(
      /apiKey/,
    );
  });

  it("rechaza un authDomain con esquema o ruta", () => {
    expect(() =>
      firebaseBuildConfig({
        FIREBASE_WEBAPP_CONFIG: WEBAPP,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "https://amigoinvisible.com.ar/",
      }),
    ).toThrow(/host/);
  });
});

describe("authProxyRewrites", () => {
  it("sin origen no hay rewrites", () => {
    expect(authProxyRewrites(null)).toEqual([]);
  });

  it("hace proxy de /__/auth y /__/firebase conservando la ruta", () => {
    expect(authProxyRewrites("https://mi-proyecto.firebaseapp.com")).toEqual([
      { source: "/__/auth/:path*", destination: "https://mi-proyecto.firebaseapp.com/__/auth/:path*" },
      { source: "/__/firebase/:path*", destination: "https://mi-proyecto.firebaseapp.com/__/firebase/:path*" },
    ]);
  });
});
