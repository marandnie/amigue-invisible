import Link from "next/link";

// Feature 003 (FR-001 a FR-003): los tres accesos en todas las páginas, con y sin sesión.
const links = [
  { href: "/acerca", label: "Acerca de" },
  { href: "/contacto", label: "Contacto" },
  { href: "/privacidad", label: "Privacidad" },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-center text-sm text-muted-foreground">
      <nav aria-label="Pie de página" className="flex flex-wrap justify-center gap-x-2 gap-y-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="inline-block px-2 py-2 underline-offset-4 hover:text-foreground hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      <p>Hecho en Buenos Aires para que nadie se quede sin regalo.</p>
    </footer>
  );
}
