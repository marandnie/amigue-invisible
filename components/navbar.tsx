import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
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
              <Link href="/perfil" className="text-muted-foreground hover:text-foreground">
                Mi perfil
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <ButtonLink href="/ingresar" variant="ghost" size="sm">Ingresar</ButtonLink>
              <ButtonLink href="/registro" size="sm">Crear cuenta</ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
