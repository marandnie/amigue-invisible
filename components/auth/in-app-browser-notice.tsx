"use client";

import { useEffect, useState } from "react";

// Google bloquea el login dentro de navegadores embebidos (Instagram, Facebook, TikTok, WebViews).
// Ver research R6.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|Line\/|Twitter|; wv\)/i;

export function InAppBrowserNotice() {
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(IN_APP.test(navigator.userAgent));
  }, []);

  if (!inApp) return null;
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      Parece que abriste esto desde una app. Si &quot;Continuar con Google&quot; no funciona, tocá
      los tres puntitos y elegí <strong>Abrir en el navegador</strong>, o entrá con un link por mail.
    </p>
  );
}
