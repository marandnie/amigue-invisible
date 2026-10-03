import { updateProfileAction } from "@/app/perfil/actions";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

// Feature 005 (specs/005-mi-perfil).
export const metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const user = await requireUser("/perfil");
  const profile = await getProfile(user.uid);
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
          <CardDescription>Los grupos que ya existen siguen mostrando el nombre que tenían.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={updateProfileAction}
            displayName={profile?.displayName ?? user.displayName ?? ""}
            email={profile?.email ?? user.email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
