"use client";

import { useActionState, useEffect, useRef } from "react";

import type { FormState } from "@/app/grupos/actions";
import { FormMessage } from "@/components/groups/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AddParticipantsForm({ action }: { action: (prev: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input name="nombre" placeholder="Nombre (ej.: Tía Marta)" maxLength={60} aria-label="Nombre" />
        <Input name="email" type="email" placeholder="Email (opcional)" aria-label="Email" />
        <Button type="submit" disabled={pending}>
          {pending ? "Agregando…" : "Agregar"}
        </Button>
      </div>
      <details className="rounded-md border p-3 text-sm">
        <summary className="cursor-pointer font-medium">Agregar varias personas de una</summary>
        <p className="my-2 text-muted-foreground">
          Una por línea. Podés sumar el email después de una coma: <code>Bruno, bruno@mail.com</code>
        </p>
        <Textarea name="lineas" rows={5} placeholder={"Ana\nBruno, bruno@mail.com\nCaro"} />
        <Button type="submit" variant="outline" size="sm" className="mt-2" disabled={pending}>
          Agregar todas
        </Button>
      </details>
      <FormMessage state={state} />
    </form>
  );
}
