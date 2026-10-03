"use client";

import { useActionState, useState } from "react";

import type { ContactState } from "@/app/contacto/actions";
import { Button } from "@/components/ui/button";
import { Field, selectClass } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_REASONS, MAX_MESSAGE } from "@/lib/contact-constants";

type Props = {
  action: (prev: ContactState, fd: FormData) => Promise<ContactState>;
  defaults: { nombre: string; email: string };
  grupo: { id: string; name: string } | null;
  renderedAt: number;
};

export function ContactForm({ action, defaults, grupo, renderedAt }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [mensaje, setMensaje] = useState("");
  const [conGrupo, setConGrupo] = useState(!!grupo);

  if (state?.status === "ok") {
    return (
      <p role="status" className="rounded-md bg-emerald-50 p-4 text-emerald-800">
        ¡Listo! Recibimos tu mensaje. Te respondemos a <strong>{state.email}</strong>.
      </p>
    );
  }

  const fieldError = (name: string) =>
    state?.status === "error" && state.field === name ? (
      <span role="alert" className="block text-xs text-destructive">{state.error}</span>
    ) : null;

  return (
    <form action={formAction} className="space-y-4">
      {/* Campo trampa (research R1): invisible para las personas. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No completar
          <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="t" value={renderedAt} />
      {grupo && conGrupo ? <input type="hidden" name="grupo" value={grupo.id} /> : null}

      <Field label="Tu nombre">
        <Input name="nombre" defaultValue={defaults.nombre} autoComplete="name" maxLength={60} required />
        {fieldError("nombre")}
      </Field>
      <Field label="Tu email" hint="Te respondemos a esta dirección.">
        <Input name="email" type="email" defaultValue={defaults.email} autoComplete="email" maxLength={254} required />
        {fieldError("email")}
      </Field>
      <Field label="Motivo">
        <select name="motivo" required defaultValue="" className={selectClass()}>
          <option value="" disabled>
            Elegí una opción
          </option>
          {CONTACT_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {fieldError("motivo")}
      </Field>

      {grupo ? (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 p-3 text-sm">
          {conGrupo ? (
            <span>
              Sobre el grupo: <strong>{grupo.name}</strong>
            </span>
          ) : (
            <span className="text-muted-foreground">Sin referencia a un grupo</span>
          )}
          <button
            type="button"
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => setConGrupo((v) => !v)}
          >
            {conGrupo ? "Quitar" : "Volver a agregar"}
          </button>
        </div>
      ) : null}

      <Field label="Mensaje" hint="No hace falta que nos cuentes a quién le regalás.">
        <Textarea
          name="mensaje"
          rows={6}
          maxLength={MAX_MESSAGE}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          required
        />
        <span className="block text-right text-xs text-muted-foreground" aria-live="polite">
          {mensaje.length}/{MAX_MESSAGE}
        </span>
        {fieldError("mensaje")}
      </Field>

      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        Por privacidad, nadie (ni nosotros) puede ver a quién le tocó a cada persona, así que no podemos contarte
        resultados del sorteo.
      </p>

      {state?.status === "error" && !state.field ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Enviando…" : "Enviar mensaje"}
      </Button>
    </form>
  );
}
