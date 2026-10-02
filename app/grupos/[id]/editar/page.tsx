import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteGroupAction, updateGroupAction } from "@/app/grupos/actions";
import { DeleteGroupForm } from "@/components/groups/delete-group-form";
import { GroupForm } from "@/components/groups/group-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupAccess } from "@/lib/data/groups";
import { toLocalDateTimeInput } from "@/lib/domain/schemas";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Editar grupo" };

export default async function EditarGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/grupos/${id}/editar`);
  const access = await getGroupAccess(id, user);
  if (!access || access.role !== "organizador") notFound();
  const { group } = access;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/grupos/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver al grupo
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Editar {group.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForm
            action={updateGroupAction.bind(null, id)}
            submitLabel="Guardar cambios"
            participationLocked={group.status === "sorteado"}
            defaults={{
              name: group.name,
              budget: group.budget?.toString() ?? "",
              currency: group.currency,
              eventAt: toLocalDateTimeInput(group.eventAt),
              location: group.location ?? "",
              notes: group.notes ?? "",
              hostParticipates: group.hostParticipates,
            }}
          />
        </CardContent>
      </Card>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg">Borrar grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteGroupForm action={deleteGroupAction.bind(null, id)} />
        </CardContent>
      </Card>
    </div>
  );
}
