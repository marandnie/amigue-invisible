"use client";

import { useEffect, useState } from "react";

import { copyText, CopyTextButton } from "@/components/groups/copy-text-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { whatsappShareUrl } from "@/lib/links";

// Research R11 de la 002. En el celular, "Compartir" abre el menú del teléfono (WhatsApp, Telegram,
// SMS…). En la compu ese menú casi nunca trae WhatsApp, así que queda el link a WhatsApp Web.
// El servidor siempre manda el link de WhatsApp (anda sin JavaScript); el cambio se hace al cargar.
function hasPhoneShareSheet(): boolean {
  return typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
}

export function ShareInvite({ message }: { message: string }) {
  const [shareSheet, setShareSheet] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareSheet(hasPhoneShareSheet());
  }, []);

  async function share() {
    try {
      // Solo `text` (con el link adentro): si además se pasa `url`, algunas apps lo duplican.
      await navigator.share({ text: message });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // cerró el menú
      await copyText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      {shareSheet ? (
        <Button type="button" variant="outline" size="sm" onClick={share}>
          {copied ? "¡Copiado!" : "Compartir"}
        </Button>
      ) : (
        <a
          href={whatsappShareUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          WhatsApp
        </a>
      )}
      <CopyTextButton text={message} label="Copiar mensaje" />
    </>
  );
}
