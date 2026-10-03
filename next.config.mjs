import { authProxyRewrites, firebaseBuildConfig } from "./lib/firebase/build-config.mjs";

const firebase = firebaseBuildConfig(process.env);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Config web de Firebase para el navegador (en App Hosting sale de FIREBASE_WEBAPP_CONFIG).
  env: firebase.publicEnv,
  async rewrites() {
    return authProxyRewrites(firebase.authProxyOrigin);
  },
};

export default nextConfig;
