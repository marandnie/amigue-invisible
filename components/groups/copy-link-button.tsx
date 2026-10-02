"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyLinkButton({ url, label = "Copiar link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt("Copiá el link:", url);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "¡Copiado!" : label}
    </Button>
  );
}
