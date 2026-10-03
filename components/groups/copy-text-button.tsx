"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Copia al portapapeles. Si el navegador no deja, muestra el texto para copiarlo a mano. */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt("Copiá el texto:", text);
  }
}

export function CopyTextButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await copyText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "¡Copiado!" : label}
    </Button>
  );
}
