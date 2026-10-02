"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/grupos/actions";
import { FormMessage } from "@/components/groups/form-message";
import { Button } from "@/components/ui/button";
import { selectClass } from "@/components/ui/field";

export function ExclusionForm({
  action,
  people,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  people: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <select name="from" required defaultValue="" className={selectClass()} aria-label="Primera persona">
          <option value="" disabled>
            Elegí a alguien
          </option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="self-center text-center text-sm text-muted-foreground">no le regala a</span>
        <select name="to" required defaultValue="" className={selectClass()} aria-label="Segunda persona">
          <option value="" disabled>
            Elegí a alguien
          </option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="mutual" defaultChecked className="h-4 w-4 accent-red-700" />
        En los dos sentidos (por ejemplo, una pareja)
      </label>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Agregar exclusión"}
      </Button>
    </form>
  );
}
