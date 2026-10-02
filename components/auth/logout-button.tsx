"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { endServerSession } from "@/lib/client-session";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await endServerSession().catch(() => undefined);
        window.location.assign("/");
      }}
    >
      Salir
    </Button>
  );
}
