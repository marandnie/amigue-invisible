"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { InAppBrowserNotice } from "@/components/auth/in-app-browser-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/lib/auth-errors";
import { EMAIL_LINK_STORAGE_KEY, startServerSession } from "@/lib/client-session";
import { clientAuth } from "@/lib/firebase/client";

type Mode = "ingresar" | "registro";
type View = "password" | "link" | "link-enviado";

const MIN_PASSWORD = 10;

export function AuthPanel({ mode, next }: { mode: Mode; next: string }) {
  const [view, setView] = useState<View>("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  const goNext = () => window.location.assign(next);

  const withGoogle = () =>
    run(async () => {
      const cred = await signInWithPopup(clientAuth(), new GoogleAuthProvider());
      await startServerSession(cred.user);
      goNext();
    });

  const withPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const nombre = String(form.get("nombre") ?? "").trim();
    return run(async () => {
      const auth = clientAuth();
      if (mode === "registro") {
        if (password.length < MIN_PASSWORD) throw { code: "auth/weak-password" };
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (nombre) await updateProfile(cred.user, { displayName: nombre.slice(0, 60) });
        await sendEmailVerification(cred.user, { url: `${window.location.origin}/mis-grupos` });
        await startServerSession(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await startServerSession(cred.user);
      }
      goNext();
    });
  };

  const withLink = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    return run(async () => {
      const url = `${window.location.origin}/ingresar/link?next=${encodeURIComponent(next)}`;
      await sendSignInLinkToEmail(clientAuth(), email, { url, handleCodeInApp: true });
      try {
        window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
      } catch {
        // Sin storage: al abrir el link se le pide el email de nuevo.
      }
      setLinkEmail(email);
      setView("link-enviado");
      setBusy(false);
    });
  };

  const otherHref = `${mode === "registro" ? "/ingresar" : "/registro"}?next=${encodeURIComponent(next)}`;

  if (view === "link-enviado") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-semibold">Revisá tu mail</p>
        <p className="text-sm text-muted-foreground">
          Te mandamos un link a <strong>{linkEmail}</strong>. Abrilo en este mismo dispositivo para
          entrar. Si no aparece, fijate en spam.
        </p>
        <Button variant="ghost" size="sm" onClick={() => setView("link")}>
          Usar otro email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <InAppBrowserNotice />

      <Button variant="outline" className="w-full" onClick={withGoogle} disabled={busy}>
        Continuar con Google
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o con tu email
        <span className="h-px flex-1 bg-border" />
      </div>

      {view === "password" ? (
        <form onSubmit={withPassword} className="space-y-3">
          {mode === "registro" ? (
            <Input name="nombre" placeholder="Tu nombre" autoComplete="name" maxLength={60} required />
          ) : null}
          <Input name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
          <Input
            name="password"
            type="password"
            placeholder={mode === "registro" ? `Contraseña (mínimo ${MIN_PASSWORD} caracteres)` : "Contraseña"}
            autoComplete={mode === "registro" ? "new-password" : "current-password"}
            minLength={mode === "registro" ? MIN_PASSWORD : undefined}
            required
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "registro" ? "Crear cuenta" : "Entrar"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => setView("link")}
          >
            Prefiero que me manden un link por mail
          </button>
        </form>
      ) : (
        <form onSubmit={withLink} className="space-y-3">
          <Input name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
          <Button type="submit" className="w-full" disabled={busy}>
            Mandame el link
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => setView("password")}
          >
            Mejor con contraseña
          </button>
        </form>
      )}

      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {mode === "registro" ? "¿Ya tenés cuenta? " : "¿Primera vez? "}
        <Link href={otherHref} className="font-medium text-foreground underline underline-offset-2">
          {mode === "registro" ? "Entrá" : "Creá tu cuenta"}
        </Link>
      </p>
    </div>
  );
}
