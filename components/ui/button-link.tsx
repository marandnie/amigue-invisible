import Link from "next/link";
import type { ComponentProps } from "react";

import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Un link con aspecto de botón (evita anidar <button> dentro de <a>, que es HTML inválido). */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & Pick<ButtonProps, "variant" | "size">) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
