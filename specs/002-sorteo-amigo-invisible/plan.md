# Implementation Plan: Sorteo de amigo invisible

**Branch**: `002-sorteo-amigo-invisible` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-sorteo-amigo-invisible/spec.md`

## Summary

Grupos, invitaciones por link, sorteo con revelación privada, listas de deseos y exclusiones, sobre la plataforma de la 001 (Next.js en App Hosting, Firestore, Firebase Auth). El sorteo es un *matching* perfecto con muestreo por rechazo y respaldo con Kuhn. Corre solo en el servidor, dentro de una transacción. Toda la autorización vive en una capa de datos del servidor; las reglas de Firestore siguen en deny-all. Detalle en [research.md](./research.md).

**Alcance de esta iteración**: US1–US5 (P1 y P2) completas. De US7 entra el algoritmo de arreglo mínimo con sus tests; la pantalla de reacomodo queda para la próxima. US6 (mails) se difiere hasta elegir proveedor.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 22/24

**Primary Dependencies**: Next.js 15 (App Router, Server Actions), `firebase-admin`, `zod`. No se agregan dependencias.

**Storage**: Firestore. Ver [data-model.md](./data-model.md)

**Testing**: Vitest. Unit tests del algoritmo (10.000 sorteos aleatorios); tests de integración de la capa de datos contra los emuladores (`npm run test:integration`); tests de reglas existentes.

**Target Platform**: Firebase App Hosting `us-east4`, mobile first

**Project Type**: web (monolito Next.js)

**Performance Goals**: sorteo de 50 personas con exclusiones < 3 s de punta a punta (SC-005); el algoritmo en sí, < 50 ms

**Constraints**: máx. 50 participantes por grupo; máx. 30 deseos por persona; sin JavaScript de cliente salvo copiar/compartir, revelación y confirmaciones

**Scale/Scope**: decenas a cientos de grupos por temporada; 7 pantallas nuevas

## Constitution Check

| Principio | Cómo se cumple | Estado |
|---|---|---|
| I. Privacidad del sorteo | Sorteo en el servidor, en transacción. Asignaciones leídas solo por id propio. Ninguna función devuelve pares ajenos. Tests de integración que intentan leer asignaciones ajenas como organizador y como otro participante. Nada de asignaciones en logs | ✅ |
| II. Español rioplatense | UI en español tradicional (FR-025), montos y fechas `es-AR`, ARS por defecto | ✅ |
| III. Costo cero en reposo | Sin servicios nuevos. Estimación en research R10 | ✅ |
| IV. Un solo ecosistema | Firestore + App Hosting. El proveedor de mail se difiere (excepción permitida) | ✅ |
| V. Spec primero | spec aclarada → este plan → tasks | ✅ |
| VI. Tests donde duele | Algoritmo con tests escritos antes; reglas e integración contra emuladores | ✅ |
| VII. Simple | Server Actions, sin librerías nuevas, sin estado global | ✅ |

**Re-check post diseño**: ✅. *Complexity Tracking* vacío.

## Project Structure

### Documentation (this feature)

```text
specs/002-sorteo-amigo-invisible/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md · tasks.md
├── contracts/routes.md
└── checklists/requirements.md
```

### Source Code

```text
lib/
├── domain/
│   ├── draw.ts              # sorteo, factibilidad, arreglo mínimo (puro, sin Firebase)
│   ├── schemas.ts           # zod de formularios
│   └── errors.ts            # DomainError
├── data/
│   └── groups.ts            # capa de datos con autorización (server-only)
├── format.ts                # montos y fechas es-AR
└── links.ts                 # URL de invitación y de WhatsApp
app/
├── mis-grupos/page.tsx                 # lista real (reemplaza el estado vacío)
├── grupos/nuevo/page.tsx
├── grupos/[id]/page.tsx                # vista organizador / participante
├── grupos/[id]/editar/page.tsx
├── grupos/[id]/exclusiones/page.tsx
├── grupos/[id]/yo/page.tsx
├── grupos/actions.ts                   # Server Actions
└── invitaciones/[token]/page.tsx
components/groups/                      # formularios y botones (copiar, WhatsApp, revelar, confirmar)
tests/
├── unit/draw.test.ts
└── integration/groups.test.ts          # contra emuladores de Auth + Firestore
firestore.indexes.json                  # fieldOverrides de participants.uid / email
```

**Structure Decision**: mismo monolito. El dominio puro (`lib/domain`) queda separado de la capa con Firebase (`lib/data`) para testear el algoritmo sin emuladores.

## Complexity Tracking

Sin violaciones.
