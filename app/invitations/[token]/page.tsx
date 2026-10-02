import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = { params: Promise<{ token: string }> };

export default async function InvitationPage({ params }: PageProps) {
  const { token } = await params;
  const session = await auth();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      participant: { include: { group: true } },
    },
  });
  if (!invitation) notFound();
  if (invitation.expiresAt < new Date()) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              This invitation is no longer valid. Ask the host to resend it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If already accepted, just forward to the group.
  if (invitation.acceptedAt) {
    redirect(`/groups/${invitation.participant.groupId}`);
  }

  // Not logged in? Bounce through login, preserving this URL so we come right back.
  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/invitations/${token}`);
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  // Logged in — show the accept page.
  async function accept() {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;

    const inv = await prisma.invitation.findUnique({
      where: { token },
      include: { participant: true },
    });
    if (!inv || inv.acceptedAt || inv.expiresAt < new Date()) return;

    await prisma.$transaction([
      prisma.participant.update({
        where: { id: inv.participantId },
        data: { userId: session!.user!.id, joinedAt: new Date() },
      }),
      prisma.invitation.update({
        where: { id: inv.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    redirect(`/groups/${inv.participant.groupId}`);
  }

  const { group, invitedEmail, invitedName } = invitation.participant;
  const emailMismatch =
    session.user.email && session.user.email.toLowerCase() !== invitedEmail.toLowerCase();

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>You&apos;re invited to {group.name}</CardTitle>
          <CardDescription>
            The invitation was sent to <span className="font-mono">{invitedEmail}</span>
            {invitedName ? ` for ${invitedName}` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm text-muted-foreground">
            {group.budget ? (
              <p>
                Budget: {Number(group.budget).toFixed(2)} {group.currency}
              </p>
            ) : null}
            {group.eventDate ? (
              <p>Event date: {new Date(group.eventDate).toLocaleDateString()}</p>
            ) : null}
            {group.eventLocation ? <p>Location: {group.eventLocation}</p> : null}
          </div>
          {emailMismatch ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              You&apos;re signed in as {session.user.email}, but this invitation was sent to{" "}
              {invitedEmail}. Log out and sign in with the invited email to accept.
            </p>
          ) : (
            <form action={accept}>
              <Button type="submit" className="w-full">
                Accept invitation
              </Button>
            </form>
          )}
          <Link href="/dashboard" className="block text-center text-sm text-muted-foreground underline">
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
