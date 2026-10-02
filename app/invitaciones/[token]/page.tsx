
import { acceptInvitationAction } from "@/app/grupos/actions";
import { ActionButton } from "@/components/groups/action-button";
import { GroupDetails } from "@/components/groups/group-details";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvitation } from "@/lib/data/groups";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Invitación", robots: { index: false, follow: false } };

export default async function InvitacionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [inv, user] = await Promise.all([getInvitation(token), getSessionUser()]);
  const here = `/invitaciones/${token}`;

  if (inv.status === "invalida") {
    return (
      <Message title="Este link no funciona">
        Puede que ya se haya usado o que esté incompleto. Pedile un link nuevo a quien organiza el amigo invisible.
      </Message>
    );
  }
  if (inv.status === "vencida") {
    return <Message title="Este link venció">Pedile uno nuevo a {inv.group.hostName}.</Message>;
  }
  if (inv.status === "cerrado") {
    return (
      <Message title={`El sorteo de "${inv.group.name}" ya se hizo`}>
        Si tenías que estar, hablá con {inv.group.hostName}.
      </Message>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardDescription>{inv.group.hostName} te invitó al amigo invisible</CardDescription>
          <CardTitle className="font-display text-3xl">{inv.group.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <GroupDetails group={inv.group} />
          <p>
            Te sumás como <strong>{inv.participantName}</strong>.
          </p>
          {user ? (
            <div className="space-y-2">
              <ActionButton action={acceptInvitationAction.bind(null, token)} variant="default" size="lg" pendingLabel="Sumándote…">
                Me sumo 🎁
              </ActionButton>
              <p className="text-xs text-muted-foreground">Entraste como {user.email}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Para sumarte necesitás una cuenta: así solo vos vas a poder ver a quién te toca regalarle.
              </p>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={`/registro?next=${encodeURIComponent(here)}`}>Crear cuenta</ButtonLink>
                <ButtonLink href={`/ingresar?next=${encodeURIComponent(here)}`} variant="outline">Ya tengo cuenta</ButtonLink>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <h1 className="mb-3 font-display text-2xl font-bold">{title}</h1>
      <p className="mb-6 text-muted-foreground">{children}</p>
      <ButtonLink href="/" variant="outline">Ir al inicio</ButtonLink>
    </section>
  );
}
