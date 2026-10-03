
import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { ButtonLink } from "@/components/ui/button-link";
import { FAQ } from "@/lib/content/faq";
import { HOME_DESCRIPTION, HOME_TITLE, homeJsonLd, jsonLdScript, SITE_NAME } from "@/lib/seo";
import { getSessionUser } from "@/lib/session";

// Feature 006 (FR-001, FR-002, FR-005, FR-006).
export const metadata = {
  title: { absolute: `${HOME_TITLE} · ${SITE_NAME}` },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: `${HOME_TITLE} · ${SITE_NAME}`, description: HOME_DESCRIPTION, url: "/" },
};

const HOME_FAQ_IDS = ["gratis", "whatsapp", "organizador-ve", "cuenta", "exclusiones", "presupuesto"];
const homeFaq = FAQ.filter((f) => HOME_FAQ_IDS.includes(f.id));

const pasos = [
  {
    titulo: "Armá el grupo",
    texto: "Nombre, presupuesto, fecha y lugar. Si hay parejas que no se pueden tocar, las excluís.",
  },
  {
    titulo: "Mandá los links",
    texto: "Cada persona tiene su link para sumarse. Lo compartís por WhatsApp o por donde quieras.",
  },
  {
    titulo: "Sorteá",
    texto: "Cada quien descubre a quién le regala, con su lista de deseos. Nadie más lo sabe, ni quien organiza.",
  },
];

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="space-y-16">
      <section className="mx-auto max-w-2xl pt-6 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
          Amigo invisible
        </p>
        <h1 className="mb-5 font-display text-4xl font-bold tracking-tight sm:text-6xl">
          El sorteo del amigo invisible, sin papelitos.
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Organizá el amigo invisible de la familia, la oficina o los amigos en un par de minutos.
          Vos armás el grupo; la app sortea y le avisa a cada quien a quién le regala.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {user ? (
            <ButtonLink href="/mis-grupos" size="lg">Ir a mis grupos</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/registro" size="lg">Organizar un sorteo</ButtonLink>
              <ButtonLink href="/ingresar" variant="outline" size="lg">Ya tengo cuenta</ButtonLink>
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {pasos.map((paso, i) => (
            <div key={paso.titulo} className="rounded-lg border bg-card p-6">
              <p className="mb-2 font-display text-3xl font-bold text-primary">{i + 1}</p>
              <h2 className="mb-1 text-lg font-semibold">{paso.titulo}</h2>
              <p className="text-sm text-muted-foreground">{paso.texto}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm">
          <Link href="/como-funciona" className="font-medium underline underline-offset-2">
            Mirá la guía completa para organizar un amigo invisible
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-2xl space-y-4" aria-labelledby="preguntas">
        <h2 id="preguntas" className="text-center font-display text-3xl font-bold">
          Preguntas frecuentes
        </h2>
        <FaqList items={homeFaq} />
        <p className="text-center text-sm">
          <Link href="/acerca#preguntas" className="underline underline-offset-2">
            Ver todas las preguntas
          </Link>
        </p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(homeJsonLd()) }} />
    </div>
  );
}
