import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = { params: Promise<{ id: string }> };

export default async function MyPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const participant = await prisma.participant.findFirst({
    where: { groupId: id, userId: session.user.id },
    include: {
      group: true,
      wishlistItems: { orderBy: { createdAt: "asc" } },
      assignmentAsGiver: {
        include: {
          receiver: {
            include: { wishlistItems: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
    },
  });
  if (!participant) notFound();

  return (
    <div className="space-y-8">
      <header>
        <Link href={`/groups/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to group
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{participant.group.name}</h1>
      </header>

      {participant.group.drawnAt && participant.assignmentAsGiver ? (
        <Card>
          <CardHeader>
            <CardTitle>You&apos;re giving a gift to…</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-semibold">
              {participant.assignmentAsGiver.receiver.invitedName}
            </p>
            <p className="text-sm text-muted-foreground">Their wishlist:</p>
            {participant.assignmentAsGiver.receiver.wishlistItems.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">
                They haven&apos;t added any wishes yet.
              </p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm">
                {participant.assignmentAsGiver.receiver.wishlistItems.map((w) => (
                  <li key={w.id}>
                    {w.url ? (
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        {w.text}
                      </a>
                    ) : (
                      w.text
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Draw not run yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Once the host runs the draw, your assigned giftee will show up here.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your wishlist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {participant.wishlistItems.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              You haven&apos;t added any wishes yet. Edit your wishlist to give your giver ideas.
            </p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {participant.wishlistItems.map((w) => (
                <li key={w.id}>
                  {w.url ? (
                    <a
                      href={w.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      {w.text}
                    </a>
                  ) : (
                    w.text
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Wishlist editing UI comes in a follow-up commit — see DESIGN.md build order step 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
