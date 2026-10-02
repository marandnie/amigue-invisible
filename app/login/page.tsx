import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  searchParams: Promise<{ "check-email"?: string; error?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  async function loginWithPassword(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  }

  async function loginWithMagicLink(formData: FormData) {
    "use server";
    await signIn("nodemailer", { email: formData.get("email") });
  }

  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Welcome back.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params["check-email"] ? (
            <p className="rounded-md bg-muted p-3 text-sm">
              Check your email for a sign-in link.
            </p>
          ) : null}
          {params.error ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Could not sign in. Please check your credentials and try again.
            </p>
          ) : null}

          <form action={loginWithGoogle}>
            <Button variant="outline" className="w-full" type="submit">
              Continue with Google
            </Button>
          </form>

          <div className="relative py-2 text-center text-xs uppercase text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or</span>
            <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-border" />
          </div>

          <form action={loginWithPassword} className="space-y-3">
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Password" required />
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <form action={loginWithMagicLink} className="space-y-3">
            <Input name="email" type="email" placeholder="Email for magic link" required />
            <Button type="submit" variant="outline" className="w-full">
              Email me a sign-in link
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            No account yet?{" "}
            <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
