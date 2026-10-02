import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { addExclusionAction, removeExclusionAction } from "@/app/grupos/actions";
import { ActionButton } from "@/components/groups/action-button";
import { ExclusionForm } from "@/components/groups/exclusion-form";
import { getGroupAccess, listParticipants } from "@/lib/data/groups";
import { isFeasible, MIN_PARTICIPANTS } from "@/lib/domain/draw";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Exclusiones" };

export default async function ExclusionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/grupos/${id}/exclusiones`);
  const access = await getGroupAccess(id, user);
  if (!access || access.role !== "organizador") notFound();
  const { group } = access;
  if (group.status === "sorteado") redirect(`/grupos/${id}`);

  const participants = await listParticipants(id, user);
  const nameOf = new Map(participants.map((p) => [p.id, p.name]));

  // Agrupa en pares: A ↔ B si es mutua, A → B si es en un solo sentido.
  const pairs: { a: string; b: string; mutual: boolean }[] = [];
  const seen = new Set<string>();
  for (const e of group.exclusions) {
    const k = [e.from, e.to].sort().join("|");
    if (seen.has(k)) continue;
    seen.add(k);
    const mutual = group.exclusions.some((x) => x.from === e.to && x.to === e.from);
    pairs.push({ a: e.from, b: e.to, mutual });
  }

  const ids = participants.map((p) => p.id);
  const imposible = ids.length >= MIN_PARTICIPANTS && !isFeasible(ids, group.exclusions);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href={`/grupos/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver al grupo
      </Link>
      <div>
        <h1 className="font-display text-3xl font-bold">Exclusiones</h1>
        <p className="text-muted-foreground">
          Personas que no se pueden tocar en el sorteo, por ejemplo una pareja. Solo vos ves esta lista.
        </p>
      </div>

      {imposible ? (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Ojo: con estas exclusiones no hay forma de que a todos les toque alguien. Sacá alguna antes de sortear.
        </p>
      ) : null}

      {pairs.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay exclusiones.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {pairs.map(({ a, b, mutual }) => (
            <li key={`${a}-${b}`} className="flex items-center justify-between gap-3 p-4">
              <span>
                {nameOf.get(a) ?? "?"} {mutual ? "↔" : "no le regala a"} {nameOf.get(b) ?? "?"}
              </span>
              <ActionButton action={removeExclusionAction.bind(null, id, a, b)} variant="ghost" pendingLabel="…">
                Quitar
              </ActionButton>
            </li>
          ))}
        </ul>
      )}

      {participants.length >= 2 ? (
        <div className="rounded-lg border p-4">
          <ExclusionForm
            action={addExclusionAction.bind(null, id)}
            people={participants.map((p) => ({ id: p.id, name: p.name }))}
          />
        </div>
      ) : (
        <p className="text-muted-foreground">Sumá participantes para poder cargar exclusiones.</p>
      )}
    </div>
  );
}
