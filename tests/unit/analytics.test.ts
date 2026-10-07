import { describe, expect, it } from "vitest";

import { beaconConfig, isTrackedPath, validToken } from "@/lib/analytics";

describe("analítica (007)", () => {
  it.each(["/", "/como-funciona", "/acerca", "/contacto", "/privacidad", "/ingresar", "/registro", "/acerca/"])(
    "mide la página pública %s",
    (p) => expect(isTrackedPath(p)).toBe(true),
  );

  it.each([
    "/invitaciones/abc123token",
    "/grupos/xyz",
    "/grupos/xyz/yo",
    "/grupos/nuevo",
    "/mis-grupos",
    "/perfil",
    "/ingresar/link",
    "/api/sesion",
    "",
    null,
  ])("no mide %s", (p) => expect(isTrackedPath(p)).toBe(false));

  it("arma el beacon sin seguimiento de SPA (FR-002)", () => {
    expect(JSON.parse(beaconConfig("a".repeat(32)))).toEqual({ token: "a".repeat(32), spa: false });
  });

  it("solo acepta tokens con formato válido (FR-003)", () => {
    expect(validToken("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(validToken(undefined)).toBe(false);
    expect(validToken("")).toBe(false);
    expect(validToken('x", "spa": true, "y": "')).toBe(false);
  });
});
