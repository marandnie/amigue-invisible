import { describe, expect, it } from "vitest";

import { canonicalRedirect, normalizeHost } from "@/lib/canonical";

const SITE = "https://amigoinvisible.com.ar";

describe("canonicalRedirect", () => {
  it("manda el dominio de App Hosting al principal conservando ruta y query", () => {
    expect(
      canonicalRedirect("amigue-invisible--amigue-invisible-604df.us-east4.hosted.app", "/grupos/abc?x=1", SITE),
    ).toBe("https://amigoinvisible.com.ar/grupos/abc?x=1");
  });

  it("también cubre www y amigueinvisible", () => {
    expect(canonicalRedirect("www.amigoinvisible.com.ar", "/", SITE)).toBe("https://amigoinvisible.com.ar/");
    expect(canonicalRedirect("amigueinvisible.com.ar", "/a", SITE)).toBe("https://amigoinvisible.com.ar/a");
    expect(canonicalRedirect("www.amigueinvisible.com.ar", "/a", SITE)).toBe("https://amigoinvisible.com.ar/a");
  });

  it("no redirige el dominio principal ni hosts desconocidos", () => {
    expect(canonicalRedirect("amigoinvisible.com.ar", "/", SITE)).toBeNull();
    expect(canonicalRedirect("algo-interno.run.app", "/", SITE)).toBeNull();
    expect(canonicalRedirect("", "/", SITE)).toBeNull();
  });

  it("en desarrollo (sin https) no redirige", () => {
    expect(canonicalRedirect("x.hosted.app", "/", "http://localhost:3000")).toBeNull();
    expect(canonicalRedirect("x.hosted.app", "/", undefined)).toBeNull();
  });

  it("normaliza el host (lista, mayúsculas, puerto)", () => {
    expect(normalizeHost("X.Hosted.App:443, otro")).toBe("x.hosted.app");
  });
});
