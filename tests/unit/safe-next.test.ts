import { describe, expect, it } from "vitest";

import { DEFAULT_AFTER_LOGIN, safeNext } from "@/lib/safe-next";

describe("safeNext", () => {
  it("acepta rutas internas", () => {
    expect(safeNext("/mis-grupos")).toBe("/mis-grupos");
    expect(safeNext("/grupos/abc?tab=deseos")).toBe("/grupos/abc?tab=deseos");
  });

  it("usa el valor por defecto si no hay next", () => {
    expect(safeNext(null)).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNext("")).toBe(DEFAULT_AFTER_LOGIN);
  });

  it("rechaza redirecciones a otros sitios", () => {
    expect(safeNext("https://malo.com")).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNext("//malo.com")).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNext("/\\malo.com")).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNext("javascript:alert(1)")).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNext("/x\n//malo.com")).toBe(DEFAULT_AFTER_LOGIN);
  });
});
