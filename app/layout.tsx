import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { WebAnalytics } from "@/components/web-analytics";

import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sorteo de amigo invisible online y gratis · Amigo Invisible",
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
        <SiteFooter />
        <WebAnalytics />
      </body>
    </html>
  );
}
