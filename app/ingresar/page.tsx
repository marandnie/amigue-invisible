import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-next";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Ingresar", robots: { index: false, follow: true } };

export default async function IngresarPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNext(firstParam((await searchParams).next));
  if (await getSessionUser()) redirect(next);

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Ingresar</CardTitle>
          <CardDescription>Qué bueno verte de nuevo.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthPanel mode="ingresar" next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
