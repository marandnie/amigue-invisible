import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amigo Invisible",
  description: "Run a secret santa draw with your friends and family.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-muted-foreground">
          Built with Next.js · Inspired by{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://github.com/spring-projects/spring-petclinic"
            target="_blank"
            rel="noreferrer"
          >
            spring-petclinic
          </a>
        </footer>
      </body>
    </html>
  );
}
