import { authProxyRewrites, firebaseBuildConfig } from "./lib/firebase/build-config.mjs";

const firebase = firebaseBuildConfig(process.env);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 006 (T010): metadata (title, description, canonical) siempre en el <head>, sin streaming.
  // Next 15 manda la metadata al final del <body> salvo para ciertos bots; Lighthouse y otros
  // lectores no la ven. Las páginas son chicas, así que bloquear hasta tenerla no cuesta nada.
  htmlLimitedBots: /.*/,
  // Config web de Firebase para el navegador (en App Hosting sale de FIREBASE_WEBAPP_CONFIG).
  env: firebase.publicEnv,
  async rewrites() {
    return authProxyRewrites(firebase.authProxyOrigin);
  },
};

export default nextConfig;
