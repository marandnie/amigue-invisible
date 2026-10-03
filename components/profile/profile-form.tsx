"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/grupos/actions";
import { FormMessage } from "@/components/groups/form-message";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  action,
  displayName,
  email,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  displayName: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Tu nombre" hint="Así te ven en los grupos que armes o a los que te sumes de ahora en más.">
        <Input name="displayName" defaultValue={displayName} autoComplete="name" maxLength={60} required />
      </Field>
      <Field label="Mail" hint="No se puede cambiar desde acá.">
        <Input value={email} readOnly disabled aria-readonly />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
