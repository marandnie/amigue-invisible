import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-next";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Crear cuenta" };

export default async function RegistroPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNext(firstParam((await searchParams).next));
  if (await getSessionUser()) redirect(next);

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Te pedimos cuenta para que nadie más pueda ver tu sorteo.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthPanel mode="registro" next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
