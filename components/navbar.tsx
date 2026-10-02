import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          🎁 Amigo Invisible
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                My groups
              </Link>
              <Link href="/groups/new" className="text-muted-foreground hover:text-foreground">
                New group
              </Link>
              <span className="text-muted-foreground">
                {session.user.name ?? session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
