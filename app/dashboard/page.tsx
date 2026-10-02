import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [hostedGroups, participantRows] = await Promise.all([
    prisma.group.findMany({
      where: { hostUserId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { participants: true } } },
    }),
    prisma.participant.findMany({
      where: { userId: session.user.id },
      include: { group: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Groups you host</h1>
          <Link href="/groups/new">
            <Button>New group</Button>
          </Link>
        </div>
        {hostedGroups.length === 0 ? (
          <p className="text-muted-foreground">
            You haven&apos;t created any groups yet. Start one to invite people and run the
            draw.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {hostedGroups.map((g) => (
              <Link key={g.id} href={`/groups/${g.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader>
                    <CardTitle>{g.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {g._count.participants} participant
                    {g._count.participants === 1 ? "" : "s"} ·{" "}
                    {g.drawnAt ? "Draw completed" : "Draw pending"}
                    {g.eventDate
                      ? ` · ${new Date(g.eventDate).toLocaleDateString()}`
                      : ""}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Groups you&apos;re in</h2>
        {participantRows.length === 0 ? (
          <p className="text-muted-foreground">
            You&apos;re not a participant in any groups yet. When someone invites you,
            they&apos;ll show up here.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {participantRows.map((p) => (
              <Link key={p.id} href={`/groups/${p.groupId}/me`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader>
                    <CardTitle>{p.group.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {p.group.drawnAt ? "See your assignment" : "Draw not run yet"}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
