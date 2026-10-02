import { Button } from "@/components/ui/button";
import { adminAuth } from "@/lib/firebase/admin";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Mis grupos" };

export default async function MisGruposPage() {
  const user = await requireUser("/mis-grupos");
  const [profile, record] = await Promise.all([getProfile(user.uid), adminAuth().getUser(user.uid)]);
  const nombre = profile?.displayName ?? user.displayName ?? user.email ?? "";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{`Hola, ${nombre}`}</h1>

      {!record.emailVerified ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Te mandamos un mail para confirmar tu email. Si no lo ves, revisá spam.
        </p>
      ) : null}

      <section className="rounded-lg border border-dashed p-10 text-center">
        <h2 className="mb-2 text-xl font-semibold">Todavía no tenés grupos</h2>
        <p className="mb-6 text-muted-foreground">
          Muy pronto vas a poder armar tu primer sorteo desde acá.
        </p>
        <Button disabled>Armar un grupo (muy pronto)</Button>
      </section>
    </div>
  );
}
