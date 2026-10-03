# Implementation Plan: Mi perfil (cambiar el nombre)

**Branch**: `005-mi-perfil` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

## Summary

Página `/perfil` (Server Component, `requireUser`) con un formulario que llama a una Server Action. La acción valida con zod (`profileSchema`) y delega en `updateDisplayName(uid, name)` de `lib/profile.ts`, que actualiza `users/{uid}.displayName` con el Admin SDK. El uid sale siempre de la sesión, nunca del formulario (FR-003). Además se actualiza el `displayName` de Firebase Auth como mejor esfuerzo, para que quede coherente.

## Decisiones

- **R1. Fuente de verdad**: `users/{uid}.displayName` (ya es lo que usan "Mis grupos" y `actorName` al crear o sumarse a grupos). Auth se actualiza solo para coherencia; si falla, no se informa error.
- **R2. Grupos existentes no cambian** (FR-004): `hostName` y el nombre de cada participante son copias al momento de crear o sumarse. No se propagan.
- **R3. Complementa el arreglo del registro con link** (rama `fix-email-al-cambiar-a-link`): ahí se pide el nombre en el alta; acá se corrige después.

## Constitution Check

| Principio | Estado |
|---|---|
| I. Privacidad del sorteo | ✅ No toca grupos ni asignaciones. |
| II. Español rioplatense | ✅ |
| III. Costo cero | ✅ Una escritura por cambio. |
| IV. Un ecosistema | ✅ Firestore + Auth. |
| V. Spec primero | ✅ |
| VI. Tests donde duele | ✅ Unit test de `profileSchema`. |
| VII. Simple | ✅ Server Component + Server Action, sin estado global. |

## Project Structure

```text
lib/domain/schemas.ts            # profileSchema
lib/profile.ts                   # updateDisplayName
app/perfil/page.tsx
app/perfil/actions.ts            # updateProfileAction
components/profile/profile-form.tsx
components/navbar.tsx            # link "Mi perfil"
tests/unit/schemas.test.ts       # casos de profileSchema
```

## Complexity Tracking

Sin violaciones.
