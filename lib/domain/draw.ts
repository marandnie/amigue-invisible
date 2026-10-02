// Algoritmo del sorteo. Puro: sin Firebase ni Next, para poder testearlo a fondo.
// Ver specs/002-sorteo-amigo-invisible/research.md (R1 y R2).

export type Exclusion = { from: string; to: string };

/** Devuelve un entero uniforme en [0, maxExclusive). */
export type Rng = (maxExclusive: number) => number;

export type DrawResult =
  | { ok: true; assignments: Map<string, string> }
  | { ok: false; reason: "pocos" | "imposible" };

export type RemovalResult =
  | { ok: true; assignments: Map<string, string>; changedGiver: string }
  | { ok: false; reason: "pocos" | "reciproco" | "exclusion" };

export const MIN_PARTICIPANTS = 3;
const REJECTION_TRIES = 2000;

/** Aleatoriedad criptográfica, sin sesgo de módulo. */
export const secureRng: Rng = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new RangeError("maxExclusive inválido");
  const range = 0x1_0000_0000;
  const limit = range - (range % maxExclusive);
  const buf = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % maxExclusive;
};

const pairKey = (from: string, to: string) => `${from}\u0000${to}`;

function forbiddenSet(exclusions: Exclusion[]): Set<string> {
  return new Set(exclusions.map((e) => pairKey(e.from, e.to)));
}

function assertUnique(people: string[]) {
  if (new Set(people).size !== people.length) throw new Error("Hay participantes repetidos");
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function allowed(giver: string, receiver: string, forbidden: Set<string>) {
  return giver !== receiver && !forbidden.has(pairKey(giver, receiver));
}

/**
 * Matching perfecto con el algoritmo de Kuhn, recorriendo en orden aleatorio.
 * Devuelve null si no existe ninguna asignación posible.
 */
function randomMatching(people: string[], forbidden: Set<string>, rng: Rng): Map<string, string> | null {
  const adjacency = new Map<string, string[]>();
  for (const g of people) {
    adjacency.set(g, shuffle(people.filter((r) => allowed(g, r, forbidden)), rng));
  }
  const giverOf = new Map<string, string>(); // receptor -> quien le regala

  const augment = (giver: string, visited: Set<string>): boolean => {
    for (const receiver of adjacency.get(giver)!) {
      if (visited.has(receiver)) continue;
      visited.add(receiver);
      const current = giverOf.get(receiver);
      if (current === undefined || augment(current, visited)) {
        giverOf.set(receiver, giver);
        return true;
      }
    }
    return false;
  };

  for (const giver of shuffle(people, rng)) {
    if (!augment(giver, new Set())) return null;
  }
  const result = new Map<string, string>();
  for (const [receiver, giver] of giverOf) result.set(giver, receiver);
  return result;
}

/**
 * Sortea quién le regala a quién.
 * 1) Muestreo por rechazo: uniforme entre todas las asignaciones válidas (caso común).
 * 2) Si no aparece una válida, matching de Kuhn: encuentra una si existe o confirma que es imposible.
 */
export function drawAssignments(people: string[], exclusions: Exclusion[], rng: Rng = secureRng): DrawResult {
  assertUnique(people);
  if (people.length < MIN_PARTICIPANTS) return { ok: false, reason: "pocos" };
  const forbidden = forbiddenSet(exclusions);

  for (let attempt = 0; attempt < REJECTION_TRIES; attempt++) {
    const receivers = shuffle(people, rng);
    let valid = true;
    for (let i = 0; i < people.length; i++) {
      if (!allowed(people[i], receivers[i], forbidden)) {
        valid = false;
        break;
      }
    }
    if (valid) return { ok: true, assignments: new Map(people.map((p, i) => [p, receivers[i]])) };
  }

  const matching = randomMatching(people, forbidden, rng);
  return matching ? { ok: true, assignments: matching } : { ok: false, reason: "imposible" };
}

/** ¿Existe al menos una asignación válida? (No exige el mínimo de 3.) */
export function isFeasible(people: string[], exclusions: Exclusion[]): boolean {
  assertUnique(people);
  if (people.length < 2) return false;
  return randomMatching(people, forbiddenSet(exclusions), () => 0) !== null;
}

/**
 * Arreglo mínimo cuando alguien se baja después del sorteo (US7, FR-026):
 * si g → x y x → r, ahora g → r. Si eso no es válido, hay que rehacer todo.
 */
export function removeWithMinimalChange(
  assignments: Map<string, string>,
  leaving: string,
  exclusions: Exclusion[],
): RemovalResult {
  const receiverOfLeaving = assignments.get(leaving);
  let giverOfLeaving: string | undefined;
  for (const [giver, receiver] of assignments) if (receiver === leaving) giverOfLeaving = giver;
  if (receiverOfLeaving === undefined || giverOfLeaving === undefined) {
    throw new Error("La persona que se baja no está en el sorteo");
  }
  if (assignments.size - 1 < MIN_PARTICIPANTS) return { ok: false, reason: "pocos" };
  if (giverOfLeaving === receiverOfLeaving) return { ok: false, reason: "reciproco" };
  if (forbiddenSet(exclusions).has(pairKey(giverOfLeaving, receiverOfLeaving))) {
    return { ok: false, reason: "exclusion" };
  }
  const next = new Map(assignments);
  next.delete(leaving);
  next.set(giverOfLeaving, receiverOfLeaving);
  return { ok: true, assignments: next, changedGiver: giverOfLeaving };
}
