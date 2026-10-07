import Link from "next/link";

import { PRIVACY_UPDATED } from "@/lib/content/privacy";

// Feature 003 (US4): FR-020, FR-021 y FR-027. Cada afirmación tiene que coincidir con producción (FR-025);
// los datos verificados están en specs/003-contacto-acerca-de/plan.md (research R7).
export const metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda Amigo Invisible, para qué, dónde, por cuánto tiempo y cómo pedir que los borremos.",
  alternates: { canonical: "/privacidad" },
};

const contacto = (
  <Link href="/contacto" className="underline underline-offset-2">
    formulario de contacto
  </Link>
);

function S({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 leading-relaxed [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-bold">Política de privacidad</h1>
        <p className="text-sm text-muted-foreground">Última actualización: {PRIVACY_UPDATED}</p>
      </header>

      <section className="rounded-lg border bg-muted/40 p-5">
        <h2 className="mb-2 font-semibold">En resumen</h2>
        <ul>
          <li>Guardamos lo mínimo para que funcione el sorteo: nombres, mails, grupos y listas de deseos.</li>
          <li>Nadie puede ver a quién le tocó a otra persona: ni quien organiza ni nosotros.</li>
          <li>No vendemos ni compartimos tus datos, no hay publicidad y no usamos cookies de seguimiento.</li>
          <li>Podés pedir ver, corregir o borrar tus datos cuando quieras, por el {contacto}.</li>
        </ul>
      </section>

      <S n={1} title="Quién es responsable de tus datos">
        <p>
          La responsable es <strong>Marina Nieto</strong>, en la Ciudad de Buenos Aires, Argentina. Para cualquier
          consulta sobre tus datos, usá el {contacto} con el motivo &quot;Mis datos personales&quot;.
        </p>
      </S>

      <S n={2} title="Qué datos tratamos">
        <ul>
          <li>
            <strong>Si tenés cuenta:</strong> tu nombre, tu mail, cómo entrás (mail y contraseña, link por mail o
            Google), la fecha en que te registraste y la de tu último ingreso. Si entrás con Google, no guardamos tu
            foto. Las contraseñas no las vemos: las maneja el servicio de autenticación.
          </li>
          <li>
            <strong>Si te sumó alguien que organiza un grupo</strong>, aunque no tengas cuenta: tu nombre y, si lo
            cargó, tu mail.
          </li>
          <li>
            <strong>Lo que cargás en la app:</strong> los datos de los grupos (nombre, presupuesto, fecha, lugar, notas y
            exclusiones), tu lista de deseos y a quién le regalás vos.
          </li>
          <li>
            <strong>Si nos escribís:</strong> tu nombre, tu mail y tu mensaje. No los guardamos en la app: nos llegan
            por mail.
          </li>
          <li>
            <strong>Datos técnicos mínimos:</strong> una cookie de sesión y registros técnicos del servidor (por
            ejemplo, errores). Para frenar abusos del formulario de contacto guardamos un código cifrado de tu
            dirección IP y de tu mail durante una hora, nunca los datos en claro.
          </li>
          <li>
            <strong>Estadísticas de visitas:</strong> en las páginas públicas (la portada, Cómo funciona, Acerca de,
            Contacto, Privacidad, Ingresar y Crear cuenta) medimos visitas de forma agregada: qué página se abrió, desde
            qué sitio llegaste, tu país y el tipo de navegador y dispositivo. No usa cookies ni identifica a personas, y
            nunca se mide dentro de tus grupos, tus invitaciones ni tu perfil.
          </li>
        </ul>
      </S>

      <S n={3} title="Para qué los usamos">
        <ul>
          <li>Para organizar el sorteo y mostrarle a cada persona solo lo que le corresponde.</li>
          <li>Para mandarte los avisos de la app: invitaciones, aviso de sorteo y mails para entrar a tu cuenta.</li>
          <li>Para responder tus consultas.</li>
          <li>Para saber cuánta gente visita las páginas públicas y mejorar el sitio, siempre con datos agregados.</li>
          <li>
            Para cuidar el servicio: cuando alguien se registra, la responsable recibe un aviso con su nombre, su mail
            y cómo entró, y un resumen semanal de registros. Sirve para detectar problemas y abusos.
          </li>
        </ul>
        <p>No usamos tus datos para publicidad, no armamos perfiles de marketing y no los vendemos ni los cedemos.</p>
      </S>

      <S n={4} title="El secreto del sorteo">
        <p>
          El sorteo se hace en el servidor y cada persona ve solo su propia asignación. Nadie, ni quien organiza ni la
          responsable de la app, puede ver a quién le tocó a otra persona.
        </p>
      </S>

      <S n={5} title="Con qué base los tratamos">
        <p>
          Con tu consentimiento, que das al crear tu cuenta. Si cargás a otras personas en un grupo, sos responsable de
          contar con su acuerdo para usar su nombre y su mail.
        </p>
      </S>

      <S n={6} title="Quién nos ayuda a prestar el servicio y dónde están tus datos">
        <ul>
          <li>
            <strong>Google Cloud y Firebase</strong> (Google LLC): alojan la app y la base de datos, manejan las
            cuentas (incluidos los mails para entrar) y los registros técnicos. Los datos se guardan en Estados Unidos (región de Virginia del Norte).
          </li>
          <li>
            <strong>Resend</strong> (Resend, Inc., Estados Unidos): envía los mails de la app, desde servidores en
            Brasil.
          </li>
          <li>
            <strong>Cloudflare</strong> (Cloudflare, Inc., Estados Unidos): resuelve el dominio y mide las visitas de
            las páginas públicas (Cloudflare Web Analytics). Guarda el detalle 7 días y después solo totales.
          </li>
        </ul>
        <p>
          Esto implica una transferencia internacional de datos fuera de Argentina. Elegimos proveedores que se
          comprometen por contrato a proteger los datos y a usarlos solo para prestarnos su servicio.
        </p>
      </S>

      <S n={7} title="Cookies">
        <p>
          Usamos una sola cookie, necesaria para mantener tu sesión iniciada (dura hasta 14 días). No usamos cookies de
          publicidad ni de seguimiento de terceros.
        </p>
      </S>

      <S n={8} title="Cuánto tiempo los guardamos">
        <ul>
          <li>Tu cuenta, hasta que nos pidas borrarla.</li>
          <li>
            Los grupos, con sus participantes, listas de deseos y sorteo, hasta que quien organiza los borra. Al borrar
            un grupo se borra todo su contenido.
          </li>
          <li>Los mensajes de contacto, en la casilla de la responsable, hasta 12 meses después de responderlos.</li>
          <li>Los registros técnicos, 30 días.</li>
        </ul>
      </S>

      <S n={9} title="Tus derechos">
        <p>
          Podés pedir acceder a tus datos, rectificarlos, actualizarlos o suprimirlos. El acceso es gratuito si lo
          pedís cada seis meses o más. Escribinos por el {contacto} con el motivo &quot;Mis datos personales&quot;,
          tengas cuenta o no.
        </p>
        <p>
          Antes de entregarte o borrar datos te vamos a pedir que confirmes que el mail es tuyo. Respondemos los
          pedidos de acceso dentro de los <strong>10 días corridos</strong> y hacemos la rectificación, actualización o
          supresión dentro de los <strong>5 días hábiles</strong>, como fija la Ley 25.326.
        </p>
        <p>
          Si pedís que borremos tus datos y estás en un grupo ya sorteado, quien organiza puede tener que rehacer el
          sorteo.
        </p>
      </S>

      <S n={10} title="Autoridad de control">
        <p>
          LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene
          la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos
          por incumplimiento de las normas vigentes en materia de protección de datos personales.
        </p>
      </S>

      <S n={11} title="Menores de edad">
        <p>
          Amigo Invisible está pensado para mayores de 18 años. Si quien organiza suma a una persona menor de edad, lo
          hace bajo la responsabilidad de sus padres, madres o tutores.
        </p>
      </S>

      <S n={12} title="Cambios en esta política">
        <p>
          Si cambiamos esta política, actualizamos la fecha de arriba. Si el cambio agrega un uso nuevo de tus datos o
          un tipo de dato nuevo, te avisamos por mail antes de que empiece a aplicarse.
        </p>
      </S>
    </article>
  );
}
