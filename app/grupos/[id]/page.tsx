import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addParticipantsAction,
  drawAction,
  regenerateInviteAction,
  removeParticipantAction,
} from "@/app/grupos/actions";
import { ActionButton } from "@/components/groups/action-button";
import { AddParticipantsForm } from "@/components/groups/add-participants-form";
import { CopyLinkButton } from "@/components/groups/copy-link-button";
import { DrawForm } from "@/components/groups/draw-form";
import { GroupDetails, StatusBadge } from "@/components/groups/group-details";
import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { getGroupAccess, listJoinedNames, listParticipants, type Access } from "@/lib/data/groups";
import { MIN_PARTICIPANTS } from "@/lib/domain/draw";
import { formatShortDate } from "@/lib/format";
import { inviteMessage, inviteUrl, whatsappShareUrl } from "@/lib/links";
import { requestOrigin } from "@/lib/request-origin";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Grupo" };

type Props = { params: Promise<{ id: string }>; searchParams: SearchParams };

export default async function GrupoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const user = await requireUser(`/grupos/${id}`);
  const access = await getGroupAccess(id, user);
  if (!access) notFound();
  const justDrawn = firstParam((await searchParams).sorteado) === "1";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link href="/mis-grupos" className="text-sm text-muted-foreground hover:text-foreground">
          ← Mis grupos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{access.group.name}</h1>
          <StatusBadge group={access.group} />
        </div>
      </header>
      {justDrawn ? (
        <p role="status" className="rounded-md bg-emerald-50 p-4 text-emerald-800">
          🎉 ¡Listo! Ya se hizo el sorteo. Cada participante puede entrar a su página para ver a quién le regala.
        </p>
      ) : null}
      {access.role === "organizador" ? <HostView access={access} /> : <ParticipantView access={access} />}
    </div>
  );
}

async function HostView({ access }: { access: Access }) {
  const { group, me } = access;
  const user = await requireUser(`/grupos/${group.id}`);
  const [participants, origin] = await Promise.all([listParticipants(group.id, user), requestOrigin()]);
  const joined = participants.filter((p) => p.uid);
  const pending = participants.filter((p) => !p.uid);
  const open = group.status === "abierto";

  return (
    <>
      <section className="space-y-4 rounded-lg border p-5">
        <GroupDetails group={group} />
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/grupos/${group.id}/editar`} variant="outline" size="sm">Editar datos</ButtonLink>
          {open ? (
            <ButtonLink href={`/grupos/${group.id}/exclusiones`} variant="outline" size="sm">Exclusiones ({group.exclusions.length})</ButtonLink>
          ) : null}
          {me ? (
            <ButtonLink href={`/grupos/${group.id}/yo`} size="sm">{open ? "Mi lista de deseos" : "Ver a quién le regalo"}</ButtonLink>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Participantes{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({joined.length} {joined.length === 1 ? "sumado" : "sumados"}
            {pending.length ? `, ${pending.length} ${pending.length === 1 ? "pendiente" : "pendientes"}` : ""})
          </span>
        </h2>
        {participants.length === 0 ? (
          <p className="text-muted-foreground">Todavía no agregaste a nadie.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {participants.map((p) => {
              const url = p.inviteToken ? inviteUrl(origin, p.inviteToken) : null;
              return (
                <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {p.name} {p.isHost ? <span className="text-muted-foreground">(vos)</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.uid
                        ? `✓ Se sumó${p.joinedEmail && !p.isHost ? ` con ${p.joinedEmail}` : ""}`
                        : `Pendiente${p.email ? ` · ${p.email}` : ""}`}
                    </p>
                  </div>
                  {open ? (
                    <div className="flex flex-wrap items-start gap-2">
                      {url ? (
                        <>
                          <CopyLinkButton url={url} />
                          <a href={whatsappShareUrl(inviteMessage(p.name, group.name, url))} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>WhatsApp</a>
                          <ActionButton
                            action={regenerateInviteAction.bind(null, group.id, p.id)}
                            variant="ghost"
                            pendingLabel="Generando…"
                          >
                            Link nuevo
                          </ActionButton>
                        </>
                      ) : null}
                      {!p.isHost ? (
                        <ActionButton
                          action={removeParticipantAction.bind(null, group.id, p.id)}
                          variant="ghost"
                          pendingLabel="Sacando…"
                        >
                          Sacar
                        </ActionButton>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {open ? (
          <div className="space-y-2 rounded-lg border p-4">
            <h3 className="font-medium">Sumar participantes</h3>
            <p className="text-sm text-muted-foreground">
              A cada uno le vas a poder mandar su link. Si cargás el email y esa persona entra con ese email, también
              lo va a ver en &quot;Mis grupos&quot;.
            </p>
            <AddParticipantsForm action={addParticipantsAction.bind(null, group.id)} />
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg border p-5">
        <h2 className="text-xl font-semibold">Sorteo</h2>
        {!open ? (
          <p>
            Se sorteó el {formatShortDate(group.drawnAt)}. Cada participante ya puede ver a quién le regala en su
            página. Vos no podés ver las asignaciones de los demás: así nadie se entera antes de tiempo.
          </p>
        ) : joined.length < MIN_PARTICIPANTS ? (
          <p className="text-muted-foreground">
            Para sortear hacen falta al menos {MIN_PARTICIPANTS} personas sumadas. Por ahora hay {joined.length}.
          </p>
        ) : (
          <DrawForm action={drawAction.bind(null, group.id)} joined={joined.length} pending={pending.length} />
        )}
      </section>
    </>
  );
}

async function ParticipantView({ access }: { access: Access }) {
  const { group } = access;
  const user = await requireUser(`/grupos/${group.id}`);
  const names = await listJoinedNames(group.id, user);
  return (
    <>
      <section className="space-y-4 rounded-lg border p-5">
        <GroupDetails group={group} />
        <ButtonLink href={`/grupos/${group.id}/yo`}>{group.status === "sorteado" ? "Ver a quién le regalo 🎁" : "Mi lista de deseos"}</ButtonLink>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Ya se sumaron ({names.length})</h2>
        <p className="text-muted-foreground">{names.join(" · ")}</p>
        {group.status === "abierto" ? (
          <p className="text-sm text-muted-foreground">Cuando estén todos, {group.hostName} hace el sorteo.</p>
        ) : null}
      </section>
    </>
  );
}
