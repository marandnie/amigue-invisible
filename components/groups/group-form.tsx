"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/grupos/actions";
import { FormMessage } from "@/components/groups/form-message";
import { Button } from "@/components/ui/button";
import { Field, selectClass } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type GroupDefaults = {
  name: string;
  budget: string;
  currency: string;
  eventAt: string;
  location: string;
  notes: string;
  hostParticipates: boolean;
};

export function GroupForm({
  action,
  defaults,
  submitLabel,
  participationLocked = false,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaults: GroupDefaults;
  submitLabel: string;
  participationLocked?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nombre del grupo">
        <Input name="name" defaultValue={defaults.name} placeholder="Navidad en familia" maxLength={80} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="Presupuesto por regalo" hint="Opcional. Sin centavos.">
          <Input name="budget" defaultValue={defaults.budget} inputMode="numeric" placeholder="15.000" />
        </Field>
        <Field label="Moneda">
          <select name="currency" defaultValue={defaults.currency} className={selectClass()}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </Field>
      </div>
      <Field label="Fecha y hora del encuentro" hint="Opcional. Hora de Argentina.">
        <Input name="eventAt" type="datetime-local" defaultValue={defaults.eventAt} />
      </Field>
      <Field label="Lugar" hint="Opcional.">
        <Input name="location" defaultValue={defaults.location} maxLength={120} placeholder="Casa de la abuela" />
      </Field>
      <Field label="Notas para el grupo" hint="Opcional. Por ejemplo: nada de medias 🧦">
        <Textarea name="notes" defaultValue={defaults.notes} maxLength={500} rows={3} />
      </Field>
      {participationLocked ? (
        <>
          <input type="hidden" name="hostParticipates" value={defaults.hostParticipates ? "on" : ""} />
          <p className="text-sm text-muted-foreground">
            {defaults.hostParticipates ? "Participás del sorteo." : "Solo organizás (no participás del sorteo)."} Ya no se
            puede cambiar porque el sorteo se hizo.
          </p>
        </>
      ) : (
        <label className="flex items-start gap-3 rounded-md border p-3">
          <input
            type="checkbox"
            name="hostParticipates"
            defaultChecked={defaults.hostParticipates}
            className="mt-1 h-4 w-4 accent-red-700"
          />
          <span>
            <span className="block text-sm font-medium">Yo también participo</span>
            <span className="block text-xs text-muted-foreground">
              Destildalo si solo organizás (por ejemplo, el sorteo de los chicos).
            </span>
          </span>
        </label>
      )}
      <FormMessage state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
