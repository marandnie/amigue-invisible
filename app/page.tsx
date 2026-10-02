
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { getSessionUser } from "@/lib/session";

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
          El sorteo, sin papelitos.
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

      <section className="grid gap-4 sm:grid-cols-3">
        {pasos.map((paso, i) => (
          <div key={paso.titulo} className="rounded-lg border bg-card p-6">
            <p className="mb-2 font-display text-3xl font-bold text-primary">{i + 1}</p>
            <h2 className="mb-1 text-lg font-semibold">{paso.titulo}</h2>
            <p className="text-sm text-muted-foreground">{paso.texto}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
