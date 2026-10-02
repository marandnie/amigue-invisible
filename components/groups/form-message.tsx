import type { FormState } from "@/app/grupos/actions";

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  if (state?.ok) {
    return (
      <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
        {state.ok}
      </p>
    );
  }
  return null;
}
