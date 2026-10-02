"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/grupos/actions";
import { FormMessage } from "@/components/groups/form-message";
import { Button } from "@/components/ui/button";

export function DeleteGroupForm({ action }: { action: (prev: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="confirmar" required className="mt-1 h-4 w-4" />
        Sí, quiero borrar el grupo con todos sus participantes, listas de deseos y el sorteo. No se puede deshacer.
      </label>
      <FormMessage state={state} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Borrando…" : "Borrar grupo"}
      </Button>
    </form>
  );
}
