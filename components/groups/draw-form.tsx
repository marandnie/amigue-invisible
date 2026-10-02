"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/grupos/actions";
import { FormMessage } from "@/components/groups/form-message";
import { Button } from "@/components/ui/button";

export function DrawForm({
  action,
  joined,
  pending: pendingCount,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  joined: number;
  pending: number;
}) {
  const [state, formAction, busy] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Entran en el sorteo las {joined} personas que ya se sumaron. Una vez hecho no se puede deshacer, y a cada
        uno le aparece en su página a quién le regala. Nadie más lo puede ver, ni siquiera vos.
      </p>
      {pendingCount > 0 ? (
        <label className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <input type="checkbox" name="confirmar" required className="mt-1 h-4 w-4" />
          <span>
            Entiendo que {pendingCount === 1 ? "la persona que no se sumó queda" : `las ${pendingCount} personas que no se sumaron quedan`}{" "}
            afuera del sorteo.
          </span>
        </label>
      ) : null}
      <FormMessage state={state} />
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Sorteando…" : "🎲 Hacer el sorteo"}
      </Button>
    </form>
  );
}
