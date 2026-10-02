import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";

export async function Navbar() {
  const user = await getSessionUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          🎁 Amigo Invisible
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/mis-grupos" className="text-muted-foreground hover:text-foreground">
                Mis grupos
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/ingresar">
                <Button variant="ghost" size="sm">
                  Ingresar
                </Button>
              </Link>
              <Link href="/registro">
                <Button size="sm">Crear cuenta</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
