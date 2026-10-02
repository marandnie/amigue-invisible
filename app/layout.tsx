import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { Navbar } from "@/components/navbar";

import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Amigo Invisible · Sorteá sin papelitos",
    template: "%s · Amigo Invisible",
  },
  description:
    "Armá el grupo, mandá los links por WhatsApp y hacé el sorteo del amigo invisible. Cada quien ve solo a quién le regala.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Amigo Invisible",
    url: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#b91c1c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-muted-foreground">
          Hecho en Buenos Aires para que nadie se quede sin regalo.
        </footer>
      </body>
    </html>
  );
}
