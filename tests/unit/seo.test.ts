import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { HOME_DESCRIPTION, HOME_TITLE, homeJsonLd, jsonLdScript, PUBLIC_PAGES } from "@/lib/seo";

describe("SEO (006)", () => {
  it("el título y la descripción de la portada cumplen FR-001", () => {
    expect(HOME_TITLE.toLowerCase()).toContain("sorteo de amigo invisible");
    expect(HOME_DESCRIPTION).toMatch(/WhatsApp/);
    expect(HOME_DESCRIPTION).toMatch(/gratis/);
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it("el sitemap tiene solo las 5 páginas públicas (FR-004)", () => {
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    expect(urls).toEqual(["/", "/como-funciona", "/acerca", "/contacto", "/privacidad"]);
    expect(urls).not.toContain("/registro");
    expect(urls).not.toContain("/ingresar");
    expect(PUBLIC_PAGES).toHaveLength(5);
  });

  it("el JSON-LD declara el sitio y la app gratis en es-AR (FR-005)", () => {
    const ld = homeJsonLd();
    const types = ld["@graph"].map((n) => n["@type"]);
    expect(types).toEqual(["WebSite", "WebApplication"]);
    const app = ld["@graph"][1] as { offers: { price: string }; inLanguage: string };
    expect(app.offers.price).toBe("0");
    expect(app.inLanguage).toBe("es-AR");
  });

  it("jsonLdScript no permite cerrar el <script>", () => {
    expect(jsonLdScript({ a: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
