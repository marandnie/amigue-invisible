import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const newGroupSchema = z.object({
  name: z.string().min(1).max(120),
  budget: z.string().optional(),
  currency: z.string().max(8).optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().max(240).optional(),
  notes: z.string().max(2000).optional(),
});

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  async function createGroup(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const parsed = newGroupSchema.parse({
      name: formData.get("name"),
      budget: formData.get("budget"),
      currency: formData.get("currency"),
      eventDate: formData.get("eventDate"),
      eventLocation: formData.get("eventLocation"),
      notes: formData.get("notes"),
    });

    const group = await prisma.group.create({
      data: {
        name: parsed.name,
        hostUserId: session.user.id,
        budget: parsed.budget ? parsed.budget : null,
        currency: parsed.currency || "EUR",
        eventDate: parsed.eventDate ? new Date(parsed.eventDate) : null,
        eventLocation: parsed.eventLocation || null,
        notes: parsed.notes || null,
      },
    });

    redirect(`/groups/${group.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a new group</CardTitle>
          <CardDescription>
            You&apos;ll be able to invite people, manage exclusions, and run the draw from the
            group page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createGroup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Group name</label>
              <Input name="name" required placeholder="The Fernández family 2026" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Budget</label>
                <Input name="budget" type="number" step="0.01" placeholder="25" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Currency</label>
                <Input name="currency" defaultValue="EUR" placeholder="EUR" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Event date</label>
              <Input name="eventDate" type="date" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Location</label>
              <Input name="eventLocation" placeholder="Casa de la abuela" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes</label>
              <Input name="notes" placeholder="Bring a bottle of wine too!" />
            </div>
            <Button type="submit" className="w-full">
              Create group
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
