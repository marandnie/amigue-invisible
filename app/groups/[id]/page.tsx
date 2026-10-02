import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = { params: Promise<{ id: string }> };

export default async function GroupPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      participants: { orderBy: { createdAt: "asc" } },
      _count: { select: { participants: true, exclusions: true } },
    },
  });
  if (!group) notFound();

  const isHost = group.hostUserId === session.user.id;
  const isParticipant = group.participants.some((p) => p.userId === session.user.id);
  if (!isHost && !isParticipant) {
    // Not a member — treat as not-found rather than leaking existence.
    notFound();
  }

  const pendingCount = group.participants.filter((p) => !p.userId).length;
  const acceptedCount = group.participants.length - pendingCount;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <p className="text-muted-foreground">
          {group._count.participants} participant{group._count.participants === 1 ? "" : "s"} ·{" "}
          {pendingCount} pending · {acceptedCount} accepted
          {group.drawnAt
            ? ` · Draw completed on ${new Date(group.drawnAt).toLocaleDateString()}`
            : " · Draw not run yet"}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            {group.budget
              ? `${Number(group.budget).toFixed(2)} ${group.currency}`
              : "Not set"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event date</CardTitle>
          </CardHeader>
          <CardContent>
            {group.eventDate ? new Date(group.eventDate).toLocaleDateString() : "Not set"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent>{group.eventLocation ?? "Not set"}</CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Participants</h2>
          {isHost ? (
            <Link href={`/groups/${group.id}/participants/new`}>
              <Button size="sm">Invite someone</Button>
            </Link>
          ) : null}
        </div>
        {group.participants.length === 0 ? (
          <p className="text-muted-foreground">No participants yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {group.participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3 text-sm">
                <span>
                  <span className="font-medium">{p.invitedName}</span>{" "}
                  <span className="text-muted-foreground">&lt;{p.invitedEmail}&gt;</span>
                </span>
                <span className="text-xs uppercase text-muted-foreground">
                  {p.userId ? "Accepted" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isHost ? (
        <section className="flex flex-wrap gap-3">
          <Link href={`/groups/${group.id}/exclusions`}>
            <Button variant="outline">Manage exclusions ({group._count.exclusions})</Button>
          </Link>
          <form action={`/groups/${group.id}/draw`} method="post">
            <Button
              disabled={group.drawnAt !== null || acceptedCount < 3}
              title={
                acceptedCount < 3
                  ? "Need at least 3 accepted participants"
                  : group.drawnAt
                    ? "Draw already run"
                    : "Run the draw"
              }
            >
              {group.drawnAt ? "Draw completed" : "Run draw"}
            </Button>
          </form>
        </section>
      ) : null}

      {isParticipant ? (
        <section>
          <Link href={`/groups/${group.id}/me`}>
            <Button variant="outline">My wishlist & assignment</Button>
          </Link>
        </section>
      ) : null}
    </div>
  );
}
