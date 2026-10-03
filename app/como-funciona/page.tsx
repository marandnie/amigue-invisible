import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";

// Feature 006 (US3, FR-007, FR-008). Todo lo que dice tiene que ser lo que la app hace hoy.
export const metadata = {
  title: "Cómo organizar un amigo invisible paso a paso",
  description:
    "Guía para organizar el amigo invisible online: armá el grupo, mandá los links por WhatsApp, sumá exclusiones, hacé el sorteo y cada uno ve a quién le regala.",
  alternates: { canonical: "/como-funciona" },
};

const pasos: { titulo: string; texto: string[] }[] = [
  {
    titulo: "Creá tu cuenta",
    texto: [
      "Entrá con tu mail o con Google. La cuenta sirve para que solo vos puedas ver a quién le regalás, y para encontrar tus grupos desde cualquier dispositivo.",
    ],
  },
  {
    titulo: "Armá el grupo",
    texto: [
      "Ponele un nombre (por ejemplo, \"Navidad en familia\" o \"Día del Amigo\"), el presupuesto por regalo, la fecha y el lugar del encuentro. Si querés, sumá notas para todos.",
      "Elegí si participás del sorteo o si solo organizás.",
    ],
  },
  {
    titulo: "Sumá a los participantes",
    texto: [
      "Cargalos de a uno o pegá la lista entera, uno por línea. El mail es opcional: si lo ponés, la app les manda la invitación por mail y el grupo les aparece en \"Mis grupos\".",
      "Cargá solo gente que esté de acuerdo en participar.",
    ],
  },
  {
    titulo: "Marcá las exclusiones (si hacen falta)",
    texto: [
      "Si hay personas que no se tienen que regalar entre sí, como las parejas, marcalo en \"Exclusiones\". El sorteo las respeta y, si con tantas reglas no hay forma de sortear, te avisa.",
    ],
  },
  {
    titulo: "Mandá los links por WhatsApp",
    texto: [
      "Cada participante tiene su propio link. Desde el celular, \"Compartir\" abre el menú del teléfono para mandarlo por WhatsApp o por donde quieras; también podés copiar el mensaje completo.",
      "Si alguien perdió el link, generale uno nuevo o reenviale el mail.",
    ],
  },
  {
    titulo: "Cada uno se suma y arma su lista de deseos",
    texto: [
      "Al abrir su link, cada persona crea su cuenta y queda adentro del grupo. Mientras tanto puede cargar ideas de regalo, con links si quiere, para ayudar a quien le toque.",
    ],
  },
  {
    titulo: "Hacé el sorteo",
    texto: [
      "Hacen falta al menos 3 personas sumadas. Entran en el sorteo las que ya se sumaron; si alguien no llegó a sumarse, la app te avisa antes.",
      "El sorteo se hace una sola vez y no se puede deshacer.",
    ],
  },
  {
    titulo: "Cada uno descubre a quién le regala",
    texto: [
      "A cada participante le aparece en su página a quién le regala y la lista de deseos de esa persona. Nadie más lo puede ver: ni el resto del grupo, ni quien organiza, ni nosotros.",
      "Las listas de deseos se pueden seguir cambiando después del sorteo.",
    ],
  },
];

const consejos = [
  "Acuerden un presupuesto fijo: evita que unos regalen mucho y otros poco.",
  "Pongan la fecha del encuentro desde el principio, así todos se organizan.",
  "Pidan que cada uno cargue al menos dos o tres ideas en su lista de deseos.",
  "En Argentina, los momentos clásicos son Navidad y el Día del Amigo (20 de julio): armen el grupo con un par de semanas de anticipación.",
];

export default function ComoFuncionaPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-10 leading-relaxed">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-bold">Cómo organizar un amigo invisible paso a paso</h1>
        <p className="text-lg text-muted-foreground">
          Con Amigo Invisible organizás el sorteo online y gratis, sin papelitos y sin que nadie se entere antes de
          tiempo. Estos son todos los pasos, desde armar el grupo hasta el día del regalo.
        </p>
      </header>

      <ol className="space-y-6">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex gap-4">
            <span className="font-display text-3xl font-bold text-primary">{i + 1}</span>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{p.titulo}</h2>
              {p.texto.map((t) => (
                <p key={t} className="text-muted-foreground">
                  {t}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Consejos para que salga bien</h2>
        <ul className="list-disc space-y-1 pl-5">
          {consejos.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-muted/40 p-6 text-center">
        <p className="mb-4 text-lg font-semibold">¿Arrancamos?</p>
        <ButtonLink href="/registro" size="lg">
          Organizar un sorteo
        </ButtonLink>
        <p className="mt-4 text-sm text-muted-foreground">
          ¿Te quedó alguna duda? Mirá las{" "}
          <Link href="/acerca#preguntas" className="underline underline-offset-2">
            preguntas frecuentes
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
