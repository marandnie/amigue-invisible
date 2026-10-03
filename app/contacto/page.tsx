import Link from "next/link";

import { sendContactAction } from "@/app/contacto/actions";
import { ContactForm } from "@/components/contact/contact-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { groupReference } from "@/lib/contact";
import { getProfile } from "@/lib/profile";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { getSessionUser } from "@/lib/session";

// Feature 003 (US1, US3).
export const metadata = {
  title: "Contacto",
  description: "Escribinos si tenés un problema para entrar, con un grupo o el sorteo, o una sugerencia.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactoPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getSessionUser();
  const profile = user ? await getProfile(user.uid).catch(() => null) : null;
  const grupo = await groupReference(firstParam((await searchParams).grupo) ?? undefined, user);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
          <CardDescription>
            ¿Algo no anda o tenés una idea? Escribinos y te respondemos por mail. Antes, fijate si la respuesta está en{" "}
            <Link href="/acerca#preguntas" className="underline underline-offset-2">
              las preguntas frecuentes
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm
            action={sendContactAction}
            defaults={{ nombre: profile?.displayName ?? user?.displayName ?? "", email: profile?.email ?? user?.email ?? "" }}
            grupo={grupo}
            renderedAt={Date.now()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
