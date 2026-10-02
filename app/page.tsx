import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <section className="mx-auto max-w-2xl text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Draw names the fair way.
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Amigo Invisible helps you organize a secret santa in minutes. Create a group, invite
        friends and family, set a budget and event date, and the app takes care of pairing
        everyone up — including exclusions for couples who shouldn&apos;t draw each other.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {session?.user ? (
          <Link href="/dashboard">
            <Button size="lg">Go to my groups</Button>
          </Link>
        ) : (
          <>
            <Link href="/signup">
              <Button size="lg">Create a group</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                I already have an account
              </Button>
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
