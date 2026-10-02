// Constitución VI: el algoritmo de sorteo se testea antes de implementarlo.
// SC-003: 10.000 sorteos aleatorios; SC-007: arreglo mínimo ante una baja.
import { describe, expect, it } from "vitest";

import {
  drawAssignments,
  isFeasible,
  removeWithMinimalChange,
  type Exclusion,
  type Rng,
} from "@/lib/domain/draw";

// RNG determinístico para que los tests sean reproducibles.
function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return (n: number) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return Math.floor(r * n);
  };
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);
const key = (a: string, b: string) => `${a}>${b}`;

function assertValid(people: string[], exclusions: Exclusion[], result: Map<string, string>) {
  const forbidden = new Set(exclusions.map((e) => key(e.from, e.to)));
  expect(result.size).toBe(people.length);
  const receivers = new Set<string>();
  for (const giver of people) {
    const receiver = result.get(giver);
    expect(receiver, `falta asignación para ${giver}`).toBeDefined();
    expect(receiver).not.toBe(giver);
    expect(people).toContain(receiver);
    expect(forbidden.has(key(giver, receiver!))).toBe(false);
    receivers.add(receiver!);
  }
  expect(receivers.size).toBe(people.length);
}

// Versión rápida (sin expect por elemento) para los tests de volumen.
function problems(people: string[], exclusions: Exclusion[], result: Map<string, string>): string | null {
  const forbidden = new Set(exclusions.map((e) => key(e.from, e.to)));
  if (result.size !== people.length) return "tamaño distinto";
  const receivers = new Set<string>();
  const set = new Set(people);
  for (const giver of people) {
    const r = result.get(giver);
    if (r === undefined) return `falta ${giver}`;
    if (r === giver) return `${giver} se regala a sí mismo`;
    if (!set.has(r)) return `receptor desconocido ${r}`;
    if (forbidden.has(key(giver, r))) return `exclusión rota ${giver}>${r}`;
    receivers.add(r);
  }
  return receivers.size === people.length ? null : "alguien recibe dos veces";
}

// Verificación independiente de factibilidad (fuerza bruta) para grupos chicos.
function bruteForceFeasible(people: string[], exclusions: Exclusion[]): boolean {
  const forbidden = new Set(exclusions.map((e) => key(e.from, e.to)));
  const used = new Set<string>();
  const go = (i: number): boolean => {
    if (i === people.length) return true;
    for (const r of people) {
      if (used.has(r) || r === people[i] || forbidden.has(key(people[i], r))) continue;
      used.add(r);
      if (go(i + 1)) return true;
      used.delete(r);
    }
    return false;
  };
  return go(0);
}

// Verificación independiente para grupos grandes: matching por BFS (Edmonds–Karp simplificado).
function bfsMatchingFeasible(people: string[], exclusions: Exclusion[]): boolean {
  const forbidden = new Set(exclusions.map((e) => key(e.from, e.to)));
  const matchOfReceiver = new Map<string, string>();
  const matchOfGiver = new Map<string, string>();
  for (const start of people) {
    const prev = new Map<string, string>(); // receiver -> giver que lo alcanzó
    const queue = [start];
    const seenGivers = new Set([start]);
    let freeReceiver: string | null = null;
    while (queue.length && !freeReceiver) {
      const g = queue.shift()!;
      for (const r of people) {
        if (r === g || forbidden.has(key(g, r)) || prev.has(r)) continue;
        prev.set(r, g);
        const owner = matchOfReceiver.get(r);
        if (!owner) {
          freeReceiver = r;
          break;
        }
        if (!seenGivers.has(owner)) {
          seenGivers.add(owner);
          queue.push(owner);
        }
      }
    }
    if (!freeReceiver) return false;
    let r: string | undefined = freeReceiver;
    while (r) {
      const g = prev.get(r)!;
      const nextR = matchOfGiver.get(g);
      matchOfReceiver.set(r, g);
      matchOfGiver.set(g, r);
      r = g === start ? undefined : nextR;
    }
  }
  return true;
}

function randomExclusions(people: string[], density: number, rng: Rng): Exclusion[] {
  const out: Exclusion[] = [];
  for (const a of people) for (const b of people) {
    if (a !== b && rng(1_000_000) / 1_000_000 < density) out.push({ from: a, to: b });
  }
  return out;
}

describe("drawAssignments", () => {
  it("rechaza grupos de menos de 3 personas", () => {
    expect(drawAssignments(ids(2), [], seeded(1))).toEqual({ ok: false, reason: "pocos" });
    expect(drawAssignments(ids(0), [], seeded(1))).toEqual({ ok: false, reason: "pocos" });
  });

  it("rechaza ids repetidos", () => {
    expect(() => drawAssignments(["a", "b", "a"], [], seeded(1))).toThrow();
  });

  it("asigna a todos, nadie a sí mismo, cada uno recibe una vez", () => {
    for (let n = 3; n <= 50; n++) {
      const people = ids(n);
      const r = drawAssignments(people, [], seeded(n));
      expect(r.ok).toBe(true);
      if (r.ok) assertValid(people, [], r.assignments);
    }
  });

  it("respeta exclusiones mutuas (parejas)", () => {
    const people = ["ana", "bruno", "caro", "dani"];
    const exclusions: Exclusion[] = [
      { from: "ana", to: "bruno" },
      { from: "bruno", to: "ana" },
    ];
    const rng = seeded(42);
    for (let i = 0; i < 1000; i++) {
      const r = drawAssignments(people, exclusions, rng);
      expect(r.ok).toBe(true);
      if (r.ok) assertValid(people, exclusions, r.assignments);
    }
  });

  it("detecta combinaciones imposibles", () => {
    const people = ["a", "b", "c"];
    const all: Exclusion[] = [];
    for (const x of people) for (const y of people) if (x !== y) all.push({ from: x, to: y });
    expect(drawAssignments(people, all, seeded(3))).toEqual({ ok: false, reason: "imposible" });
    // "a" no le puede regalar a nadie
    expect(
      drawAssignments(people, [{ from: "a", to: "b" }, { from: "a", to: "c" }], seeded(3)),
    ).toEqual({ ok: false, reason: "imposible" });
    // nadie le puede regalar a "c"
    expect(
      drawAssignments(people, [{ from: "a", to: "c" }, { from: "b", to: "c" }], seeded(3)),
    ).toEqual({ ok: false, reason: "imposible" });
  });

  it("10.000 sorteos aleatorios (3 a 50 personas, con exclusiones) son válidos o imposibles de verdad", () => {
    const rng = seeded(2026);
    let imposibles = 0;
    for (let i = 0; i < 10_000; i++) {
      const n = 3 + rng(48);
      const people = ids(n);
      const denso = rng(10) < 3;
      const density = denso ? 0.2 + rng(70) / 100 : rng(15) / 100;
      const exclusions = randomExclusions(people, density, rng);
      const r = drawAssignments(people, exclusions, rng);
      if (r.ok) {
        const p = problems(people, exclusions, r.assignments);
        if (p) expect.fail(`sorteo ${i}: ${p}`);
      } else {
        expect(r.reason).toBe("imposible");
        imposibles++;
        const factible = n <= 8 ? bruteForceFeasible(people, exclusions) : bfsMatchingFeasible(people, exclusions);
        expect(factible).toBe(false);
      }
    }
    // Sanidad: el generador tiene que producir algunos casos imposibles.
    expect(imposibles).toBeGreaterThan(0);
  }, 120_000);

  it("es justo: con 3 personas los dos sorteos posibles salen ~50/50", () => {
    const rng = seeded(7);
    const counts = new Map<string, number>();
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const r = drawAssignments(["a", "b", "c"], [], rng);
      if (!r.ok) throw new Error("no debería fallar");
      const k = r.assignments.get("a")!;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual(["b", "c"]);
    for (const c of counts.values()) expect(Math.abs(c / N - 0.5)).toBeLessThan(0.05);
  });

  it("es justo: con 4 personas las 9 asignaciones posibles salen parejas", () => {
    const rng = seeded(11);
    const counts = new Map<string, number>();
    const N = 18_000;
    for (let i = 0; i < N; i++) {
      const r = drawAssignments(["a", "b", "c", "d"], [], rng);
      if (!r.ok) throw new Error("no debería fallar");
      const k = ["a", "b", "c", "d"].map((p) => r.assignments.get(p)).join("");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect(counts.size).toBe(9);
    for (const c of counts.values()) expect(Math.abs(c / N - 1 / 9)).toBeLessThan(0.02);
  });

  it("sortea 50 personas con exclusiones en menos de 50 ms", () => {
    const people = ids(50);
    const exclusions: Exclusion[] = [];
    for (let i = 0; i < 50; i += 2) {
      exclusions.push({ from: people[i], to: people[i + 1] }, { from: people[i + 1], to: people[i] });
    }
    const t0 = performance.now();
    const r = drawAssignments(people, exclusions);
    const ms = performance.now() - t0;
    expect(r.ok).toBe(true);
    if (r.ok) assertValid(people, exclusions, r.assignments);
    expect(ms).toBeLessThan(50);
  });
});

describe("isFeasible", () => {
  it("coincide con la fuerza bruta en grupos chicos", () => {
    const rng = seeded(99);
    for (let i = 0; i < 2000; i++) {
      const n = 3 + rng(5);
      const people = ids(n);
      const exclusions = randomExclusions(people, rng(80) / 100, rng);
      expect(isFeasible(people, exclusions)).toBe(bruteForceFeasible(people, exclusions));
    }
  });
});

describe("removeWithMinimalChange", () => {
  const base = new Map([
    ["a", "x"],
    ["x", "b"],
    ["b", "c"],
    ["c", "a"],
  ]);

  it("quien le regalaba al que se va pasa a regalarle a quien le tocaba a él; el resto no cambia", () => {
    const r = removeWithMinimalChange(base, "x", []);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.changedGiver).toBe("a");
    expect(r.assignments.get("a")).toBe("b");
    expect(r.assignments.get("b")).toBe("c");
    expect(r.assignments.get("c")).toBe("a");
    expect(r.assignments.has("x")).toBe(false);
    assertValid(["a", "b", "c"], [], r.assignments);
  });

  it("si se rompería una exclusión, pide rehacer", () => {
    expect(removeWithMinimalChange(base, "x", [{ from: "a", to: "b" }])).toEqual({
      ok: false,
      reason: "exclusion",
    });
  });

  it("si era un par recíproco, pide rehacer", () => {
    const m = new Map([
      ["a", "x"],
      ["x", "a"],
      ["b", "c"],
      ["c", "d"],
      ["d", "b"],
    ]);
    expect(removeWithMinimalChange(m, "x", [])).toEqual({ ok: false, reason: "reciproco" });
  });

  it("si quedan menos de 3, el sorteo se anula", () => {
    const m = new Map([
      ["a", "b"],
      ["b", "c"],
      ["c", "a"],
    ]);
    expect(removeWithMinimalChange(m, "c", [])).toEqual({ ok: false, reason: "pocos" });
  });

  it("propiedad: en sorteos aleatorios, cuando se puede, cambia exactamente una asignación", () => {
    const rng = seeded(5);
    for (let i = 0; i < 2000; i++) {
      const n = 4 + rng(30);
      const people = ids(n);
      const exclusions = randomExclusions(people, rng(10) / 100, rng);
      const d = drawAssignments(people, exclusions, rng);
      if (!d.ok) continue;
      const leaving = people[rng(n)];
      const r = removeWithMinimalChange(d.assignments, leaving, exclusions);
      if (!r.ok) continue;
      const rest = people.filter((p) => p !== leaving);
      const p = problems(rest, exclusions, r.assignments);
      if (p) expect.fail(p);
      const changed = rest.filter((p) => r.assignments.get(p) !== d.assignments.get(p));
      expect(changed).toEqual([r.changedGiver]);
    }
  });
});
