---
description: "Tareas de la feature 002: sorteo de amigo invisible"
---

# Tasks: Sorteo de amigo invisible

**Input**: documentos de `/specs/002-sorteo-amigo-invisible/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/routes.md](./contracts/routes.md)

**Tests**: obligatorios para el algoritmo (antes de implementarlo) y para la privacidad de la capa de datos (constitución I y VI).

**Estado (2026-10-02)**: US1–US5 implementadas. Verificado con 26 unit tests, 20 de integración contra emuladores, 5 de reglas y una prueba en navegador real con 4 cuentas (`tests/e2e/flujo-sorteo.mjs`). Pendiente: US6 y US7 (siguiente iteración), deploy de índices y validación en producción.

## Format: `[ID] [P?] [Story] Descripción`

---

## Phase 1: Setup

- [x] T001 Crear la rama `002-sorteo-amigo-invisible`
- [x] T002 [P] Agregar `fieldOverrides` de `participants.uid` y `participants.email` en `firestore.indexes.json`
- [x] T003 [P] Script `test:integration` (emuladores de Auth + Firestore) y alias de `server-only` en `vitest.config.ts`

## Phase 2: Foundational

- [x] T004 [P] Tests del algoritmo en `tests/unit/draw.test.ts`: validez, imposibilidad (fuerza bruta n ≤ 8), 10.000 sorteos aleatorios 3–50, exclusiones, uniformidad aproximada con 3 personas, arreglo mínimo (escribir primero y ver que fallan)
- [x] T005 Implementar `lib/domain/draw.ts` (`drawAssignments`, `isFeasible`, `removeWithMinimalChange`) hasta que pasen los tests
- [x] T006 [P] `lib/domain/errors.ts` y `lib/domain/schemas.ts` (zod: grupo, líneas de participantes, deseo, exclusión)
- [x] T007 [P] `lib/format.ts` (montos y fechas es-AR) y `lib/links.ts` (link de invitación y de WhatsApp)
- [x] T008 `lib/data/groups.ts`: tipos, carga del grupo con rol (organizador / participante / ninguno), helpers de transacción

**Checkpoint**: algoritmo testeado y base de datos lista

---

## Phase 3: User Story 1 – Organizar un grupo e invitar (P1) 🎯 MVP

- [x] T009 [US1] Capa de datos: `createGroup`, `updateGroup`, `deleteGroup`, `addParticipants`, `removeParticipant`, `regenerateInvite`
- [x] T010 [P] [US1] `components/groups/group-form.tsx` (alta y edición, con "Yo también participo")
- [x] T011 [US1] `app/grupos/nuevo/page.tsx` y `app/grupos/[id]/editar/page.tsx` + acciones
- [x] T012 [P] [US1] `components/groups/copy-link-button.tsx` y `share-whatsapp-button.tsx`
- [x] T013 [US1] `app/grupos/[id]/page.tsx` (vista organizador): datos, participantes con estado, alta individual y en lote, sacar, regenerar
- [x] T014 [US1] `app/mis-grupos/page.tsx`: grupos que organiza y en los que participa

## Phase 4: User Story 2 – Sumarse desde la invitación (P1)

- [x] T015 [US2] Capa de datos: `getInvitation`, `acceptInvitation`, `listPendingInvitesForEmail`, `joinByEmail`
- [x] T016 [US2] `app/invitaciones/[token]/page.tsx` (sin sesión → entrar o crear cuenta con `next`; con sesión → "Me sumo")
- [x] T017 [US2] Invitaciones pendientes por email en "Mis grupos" (solo con email verificado)
- [x] T018 [US2] Vista de participante en `app/grupos/[id]/page.tsx`

## Phase 5: User Story 3 – Sortear y descubrir (P1)

- [x] T019 [US3] Capa de datos: `runDraw` (transacción, borra pendientes, una sola vez) y `getMyPage` (mi asignación + su lista)
- [x] T020 [P] [US3] `components/groups/draw-form.tsx` (confirmación si hay pendientes) y `reveal-card.tsx` (tocá para descubrir + confeti CSS)
- [x] T021 [US3] `app/grupos/[id]/yo/page.tsx` y botón de sorteo en la vista del organizador
- [x] T022 [US3] Tests de integración: sorteo único con pedidos en paralelo; cada uno ve solo lo suyo; el organizador que no participa no ve nada; no se puede sortear con < 3

## Phase 6: User Story 4 – Lista de deseos (P2)

- [x] T023 [US4] Capa de datos: `addWish`, `updateWish`, `deleteWish` (solo el dueño, máx. 30, URL http(s))
- [x] T024 [US4] Lista editable en "Mi página" y lista de quien recibo después del sorteo

## Phase 7: User Story 5 – Exclusiones (P2)

- [x] T025 [US5] Capa de datos: `addExclusion`, `removeExclusion` con chequeo de factibilidad
- [x] T026 [US5] `app/grupos/[id]/exclusiones/page.tsx`
- [x] T027 [US5] Test de integración: el sorteo respeta exclusiones y rechaza combinaciones imposibles

## Phase 8: User Story 7 – Reacomodo (P3) — siguiente iteración

- [ ] T028 [US7] Capa de datos: baja con arreglo mínimo, rehacer todo, anular con < 3 (usa `removeWithMinimalChange`)
- [ ] T029 [US7] UI de reacomodo en la vista del organizador
- [ ] T030 [US7] Avisos en la app a quien le cambió la asignación

## Phase 9: User Story 6 – Avisos por mail (P3) — siguiente iteración

- [ ] T031 [US6] Elegir proveedor (Resend u otro); secretos en Secret Manager; SPF/DKIM en Cloudflare
- [ ] T032 [US6] Mail de invitación y mail de "ya se hizo el sorteo" (sin revelar el nombre)

## Phase 10: Polish

- [ ] T033 Desplegar índices (`firebase deploy --only firestore`)
- [ ] T034 Correr el quickstart en producción con 3 cuentas
- [x] T035 Actualizar README y CLAUDE.md
- [x] T036 [P] Prueba E2E en navegador real: `tests/e2e/flujo-sorteo.mjs` (`npm run test:e2e`)

## Dependencies

- Foundational (T004–T008) bloquea todo. US1 → US2 → US3 en orden (cada una usa la anterior). US4 y US5 dependen de US1; US4 se completa con US3 (ver la lista de quien recibo).
- US6 y US7 quedan para la próxima iteración.

## Implementation Strategy

MVP = US1 + US2 + US3: con eso ya se puede hacer el amigo invisible de estas fiestas. US4 y US5 entran en esta misma iteración porque son chicas y el algoritmo ya soporta exclusiones.
