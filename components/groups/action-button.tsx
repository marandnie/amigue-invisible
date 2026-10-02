"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/grupos/actions";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Botón que ejecuta una Server Action (ya con sus argumentos) y muestra el error al lado, si hay. */
export function ActionButton({
  action,
  children,
  pendingLabel,
  variant = "outline",
  size = "sm",
  className,
}: {
  action: () => Promise<FormState>;
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState>(action, undefined);
  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
        {pending ? (pendingLabel ?? "…") : children}
      </Button>
      {state?.error ? <span className="max-w-xs text-xs text-destructive">{state.error}</span> : null}
    </form>
  );
}
