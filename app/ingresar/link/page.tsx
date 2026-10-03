import { EmailLinkCompletion } from "@/components/auth/email-link-completion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-next";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata = { title: "Entrando", robots: { index: false, follow: true } };

export default async function IngresarConLinkPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNext(firstParam((await searchParams).next));
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Entrar con link</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailLinkCompletion next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
