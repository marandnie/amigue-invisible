import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(10).max(200),
});

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;

  async function signupWithPassword(formData: FormData) {
    "use server";
    const parsed = signupSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      redirect("/signup?error=invalid");
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      redirect("/signup?error=exists");
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
      },
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  }

  async function signupWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start a secret santa in minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error === "exists" ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              An account with that email already exists. Try logging in instead.
            </p>
          ) : null}
          {params.error === "invalid" ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Please enter a name, a valid email, and a password of at least 10 characters.
            </p>
          ) : null}

          <form action={signupWithGoogle}>
            <Button variant="outline" className="w-full" type="submit">
              Continue with Google
            </Button>
          </form>

          <div className="relative py-2 text-center text-xs uppercase text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or</span>
            <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-border" />
          </div>

          <form action={signupWithPassword} className="space-y-3">
            <Input name="name" type="text" placeholder="Your name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input
              name="password"
              type="password"
              placeholder="Password (at least 10 characters)"
              minLength={10}
              required
            />
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
