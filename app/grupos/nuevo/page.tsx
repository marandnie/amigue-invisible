import { createGroupAction } from "@/app/grupos/actions";
import { GroupForm } from "@/components/groups/group-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Armar un grupo" };

export default async function NuevoGrupoPage() {
  await requireUser("/grupos/nuevo");
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Armar un grupo</CardTitle>
          <CardDescription>Después vas a poder sumar a los participantes y mandarles el link.</CardDescription>
        </CardHeader>
        <CardContent>
          <GroupForm
            action={createGroupAction}
            submitLabel="Crear grupo"
            defaults={{ name: "", budget: "", currency: "ARS", eventAt: "", location: "", notes: "", hostParticipates: true }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
