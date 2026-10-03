import Link from "next/link";

import type { Faq } from "@/lib/content/faq";

export function FaqList({ items, headingLevel = "h3" }: { items: Faq[]; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <div className="divide-y rounded-lg border">
      {items.map((f) => (
        <details key={f.id} id={f.id} className="group p-4">
          <summary className="cursor-pointer list-none font-medium">
            <H className="inline">{f.q}</H>
          </summary>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            {f.a.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {f.link ? (
              <Link href={f.link.href} className="font-medium text-foreground underline underline-offset-2">
                {f.link.label}
              </Link>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
