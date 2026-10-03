import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { ButtonLink } from "@/components/ui/button-link";
import { FAQ } from "@/lib/content/faq";

// Feature 003 (US2): FR-013 a FR-019, en ese orden.
export const metadata = {
  title: "Acerca de",
  description:
    "Qué es Amigo Invisible, cómo funciona el sorteo, cómo protegemos el secreto, qué datos guardamos y quién lo hace.",
  alternates: { canonical: "/acerca" },
};

const pasos = [
  ["Armás el grupo", "Ponés nombre, presupuesto, fecha y lugar, y cargás a cada participante."],
  ["Mandás los links", "Cada persona recibe su link, crea su cuenta y se suma al grupo."],
  ["Sorteás", "La app hace el sorteo y a cada uno le muestra a quién le regala, con su lista de deseos."],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function AcercaPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-10 leading-relaxed">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-bold">Acerca de Amigo Invisible</h1>
        <p className="text-lg text-muted-foreground">
          Amigo Invisible es una app gratuita para organizar el sorteo del amigo invisible de la familia, la oficina o
          los amigos, sin papelitos y sin que nadie se entere antes de tiempo.
        </p>
      </header>

      <Section id="como-funciona" title="Cómo funciona">
        <ol className="space-y-3">
          {pasos.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="font-display text-2xl font-bold text-primary">{i + 1}</span>
              <span>
                <strong>{t}.</strong> {d}
              </span>
            </li>
          ))}
        </ol>
        <p>
          <Link href="/como-funciona" className="underline underline-offset-2">
            Ver la guía paso a paso
          </Link>
        </p>
      </Section>

      <Section id="privacidad-del-sorteo" title="El secreto está a salvo">
        <p>
          El sorteo lo hace el servidor, no el teléfono de nadie. Cada persona ve únicamente a quién le regala ella.{" "}
          <strong>Ni quien organiza ni nosotros podemos ver las asignaciones de los demás</strong>: la app está hecha
          para que eso no sea posible.
        </p>
      </Section>

      <Section id="datos" title="Qué datos guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Tu nombre y tu mail, para que puedas entrar y recibir los avisos.</li>
          <li>Los grupos en los que participás y tu lista de deseos.</li>
          <li>A quién le regalás vos (solo vos lo ves).</li>
        </ul>
        <p>
          Los usamos solo para que funcione el sorteo y para mandarte los avisos de la app. No los vendemos ni los
          compartimos con nadie para publicidad. Si querés que borremos tu cuenta, escribinos por{" "}
          <Link href="/contacto" className="underline underline-offset-2">
            contacto
          </Link>
          .
        </p>
        <p>
          Todos los detalles están en la{" "}
          <Link href="/privacidad" className="font-medium underline underline-offset-2">
            Política de privacidad
          </Link>
          .
        </p>
      </Section>

      <Section id="quien" title="Quién lo hace">
        <p>
          Amigo Invisible lo hace <strong>Marina Nieto</strong>, en Buenos Aires, como proyecto independiente. Si tenés
          una idea o encontraste un error, nos encanta que nos escribas.
        </p>
      </Section>

      <Section id="preguntas" title="Preguntas frecuentes">
        <FaqList items={FAQ} />
      </Section>

      <section className="rounded-lg border bg-muted/40 p-6 text-center">
        <p className="mb-4">¿No encontraste lo que buscabas?</p>
        <ButtonLink href="/contacto">Escribinos</ButtonLink>
      </section>
    </article>
  );
}
