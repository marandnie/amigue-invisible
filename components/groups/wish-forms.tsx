"use client";

import { useActionState, useEffect, useRef } from "react";

import type { FormState } from "@/app/grupos/actions";
import { FormMessage } from "@/components/groups/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function AddWishForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input name="text" placeholder="Qué te gustaría (ej.: un libro de cocina)" maxLength={200} required aria-label="Deseo" />
        <Input name="url" placeholder="Link (opcional)" aria-label="Link" />
        <Button type="submit" disabled={pending}>
          {pending ? "…" : "Agregar"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function EditWishForm({ action, text, url }: { action: Action; text: string; url: string | null }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="mt-2 space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input name="text" defaultValue={text} maxLength={200} required aria-label="Deseo" />
        <Input name="url" defaultValue={url ?? ""} placeholder="Link (opcional)" aria-label="Link" />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "…" : "Guardar"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
