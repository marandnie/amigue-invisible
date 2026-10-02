import Link from "next/link";

import { joinByEmailAction } from "@/app/grupos/actions";
import { ActionButton } from "@/components/groups/action-button";
import { StatusBadge } from "@/components/groups/group-details";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { listMyGroups, type Group } from "@/lib/data/groups";
import { adminAuth } from "@/lib/firebase/admin";
import { formatEventDate } from "@/lib/format";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Mis grupos" };

export default async function MisGruposPage() {
  const user = await requireUser("/mis-grupos");
  const [profile, record, mine] = await Promise.all([
    getProfile(user.uid),
    adminAuth().getUser(user.uid),
    listMyGroups(user),
  ]);
  const nombre = profile?.displayName ?? user.displayName ?? user.email ?? "";
  const vacio = !mine.organizo.length && !mine.participo.length && !mine.invitaciones.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{`Hola, ${nombre}`}</h1>
        <ButtonLink href="/grupos/nuevo">Armar un grupo</ButtonLink>
      </div>

      {!record.emailVerified ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Te mandamos un mail para confirmar tu email. Si no lo ves, revisá spam.
        </p>
      ) : null}

      {mine.invitaciones.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Te invitaron</h2>
          <ul className="divide-y rounded-lg border">
            {mine.invitaciones.map((i) => (
              <li key={i.participantId} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{i.group.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Organiza {i.group.hostName} · te sumarías como {i.participantName}
                  </p>
                </div>
                {record.emailVerified ? (
                  <ActionButton
                    action={joinByEmailAction.bind(null, i.group.id, i.participantId)}
                    variant="default"
                    pendingLabel="Sumándote…"
                  >
                    Sumarme
                  </ActionButton>
                ) : (
                  <span className="text-xs text-muted-foreground">Confirmá tu email para sumarte</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mine.organizo.length ? <GroupList title="Organizás" groups={mine.organizo} /> : null}
      {mine.participo.length ? <GroupList title="Participás" groups={mine.participo} /> : null}

      {vacio ? (
        <section className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="mb-2 text-xl font-semibold">Todavía no tenés grupos</h2>
          <p className="mb-6 text-muted-foreground">
            Armá uno y mandale el link a cada participante. Si te invitaron, abrí el link que te pasaron.
          </p>
          <ButtonLink href="/grupos/nuevo">Armar mi primer grupo</ButtonLink>
        </section>
      ) : null}
    </div>
  );
}

function GroupList({ title, groups }: { title: string; groups: Group[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <li key={g.id}>
            <Link href={`/grupos/${g.id}`} className="block rounded-lg border p-4 transition hover:bg-muted">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{g.name}</p>
                <StatusBadge group={g} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">
                {formatEventDate(g.eventAt) ?? "Sin fecha"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
