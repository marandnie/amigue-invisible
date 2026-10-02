
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata = { title: "No encontramos esa página" };

export default function NotFound() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <p className="mb-2 font-display text-6xl font-bold text-primary">404</p>
      <h1 className="mb-3 text-2xl font-semibold">No encontramos esa página</h1>
      <p className="mb-8 text-muted-foreground">
        Puede que el link esté incompleto o que la página ya no exista.
      </p>
      <ButtonLink href="/">Volver al inicio</ButtonLink>
    </section>
  );
}
