"use client";

import { getAdditionalUserInfo, isSignInWithEmailLink, signInWithEmailLink, updateProfile } from "firebase/auth";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/lib/auth-errors";
import { EMAIL_LINK_STORAGE_KEY, NAME_LINK_STORAGE_KEY, startServerSession } from "@/lib/client-session";
import { clientAuth } from "@/lib/firebase/client";

type State = "verificando" | "pedir-email" | "entrando" | "invalido" | "error";

export function EmailLinkCompletion({ next }: { next: string }) {
  const [state, setState] = useState<State>("verificando");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const complete = useCallback(
    async (email: string) => {
      setState("entrando");
      try {
        const cred = await signInWithEmailLink(clientAuth(), email, window.location.href);
        let name: string | null = null;
        try {
          name = window.localStorage.getItem(NAME_LINK_STORAGE_KEY);
          window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
          window.localStorage.removeItem(NAME_LINK_STORAGE_KEY);
        } catch {
          // nada
        }
        // Solo en el alta: a una cuenta existente no se le pisa el nombre. Tiene que ir antes de
        // crear la sesión, porque ahí el servidor arma el perfil con el nombre de Auth.
        const isNew = getAdditionalUserInfo(cred)?.isNewUser === true;
        if (isNew && name?.trim() && !cred.user.displayName) {
          await updateProfile(cred.user, { displayName: name.trim().slice(0, 60) }).catch(() => undefined);
        }
        await startServerSession(cred.user);
        window.location.assign(next);
      } catch (e) {
        setError(authErrorMessage(e));
        setState("error");
      }
    },
    [next],
  );

  useEffect(() => {
    // En desarrollo React monta dos veces: el link es de un solo uso.
    if (started.current) return;
    started.current = true;
    if (!isSignInWithEmailLink(clientAuth(), window.location.href)) {
      setState("invalido");
      return;
    }
    let email: string | null = null;
    try {
      email = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
    } catch {
      email = null;
    }
    if (email) void complete(email);
    else setState("pedir-email");
  }, [complete]);

  if (state === "verificando" || state === "entrando") {
    return <p className="text-center text-muted-foreground">Entrando…</p>;
  }

  if (state === "pedir-email") {
    return (
      <form
        className="space-y-3"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          void complete(String(new FormData(e.currentTarget).get("email") ?? "").trim());
        }}
      >
        <p className="text-sm text-muted-foreground">
          Abriste el link en otro dispositivo o navegador. Para confirmar que sos vos, escribí el
          email al que te llegó.
        </p>
        <Input name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
        <Button type="submit" className="w-full">
          Confirmar y entrar
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        {state === "invalido" ? "Este link no es válido o está incompleto." : error}
      </p>
      <ButtonLink href={`/ingresar?next=${encodeURIComponent(next)}`} variant="outline">Pedir un link nuevo</ButtonLink>
    </div>
  );
}
