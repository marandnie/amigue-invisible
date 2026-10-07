"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { BEACON_SRC, beaconConfig, isTrackedPath, validToken } from "@/lib/analytics";

// Feature 007. Se decide una sola vez, con la ruta de la primera carga (research R3):
// si la visita empieza en una página privada, el script no se carga en toda la visita.
const TOKEN = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

export function WebAnalytics() {
  const pathname = usePathname();
  const [enabled] = useState(() => validToken(TOKEN) && isTrackedPath(pathname));
  if (!enabled || !TOKEN) return null;
  return <script defer src={BEACON_SRC} data-cf-beacon={beaconConfig(TOKEN.trim())} />;
}
