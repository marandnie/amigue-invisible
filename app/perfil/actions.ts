"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/app/grupos/actions";
import { profileSchema } from "@/lib/domain/schemas";
import { updateDisplayName } from "@/lib/profile";
import { requireUser } from "@/lib/session";

// Feature 005. El uid sale de la sesión, nunca del formulario (FR-003).
export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/perfil");
  const parsed = profileSchema.safeParse({ displayName: fd.get("displayName") ?? undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await updateDisplayName(user.uid, parsed.data.displayName);
  revalidatePath("/perfil");
  revalidatePath("/mis-grupos");
  return { ok: "Listo, guardamos tu nombre." };
}
