# Implementation Plan: Plataforma en producción con dominio propio

**Branch**: `001-plataforma-gcp-dominio` | **Date**: 2026-09-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-plataforma-gcp-dominio/spec.md`

## Summary

Publicar el scaffold Next.js en `https://amigoinvisible.com.ar` sobre Firebase, con login y deploy automático. Se reemplaza la base AWS del scaffold: Prisma/Postgres pasa a Firestore, Auth.js a Firebase Authentication con session cookies y Amplify a Firebase App Hosting (`us-east4`). El DNS de ambos dominios se delega de NIC.ar a Cloudflare (solo DNS). App Hosting sirve el dominio principal y redirige `www.` y `amigueinvisible.com.ar` al principal. Detalle de cada decisión en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22 LTS

**Primary Dependencies**: Next.js 15 (App Router), React 19, Tailwind 3, `firebase` (SDK web), `firebase-admin`, `zod`. Se eliminan: `prisma`, `@prisma/client`, `next-auth`, `@auth/prisma-adapter`, `bcryptjs`, `nodemailer`.

**Storage**: Cloud Firestore (Standard, modo nativo, `us-east4`). En esta feature solo existe la colección `users` ([data-model.md](./data-model.md)).

**Testing**: Vitest (unit) + `@firebase/rules-unit-testing` contra el emulador de Firestore (reglas). `tests/smoke/session.sh`: flujo de sesión de punta a punta contra los emuladores de Auth y Firestore. `scripts/check-domains.sh` (curl) para dominios y redirecciones. Validación manual con [quickstart.md](./quickstart.md). Los emuladores requieren Java 21+.

**Target Platform**: Firebase App Hosting (Cloud Run gestionado + Cloud CDN), región `us-east4`. Navegadores mobile modernos (Chrome Android, Safari iOS) y desktop.

**Project Type**: aplicación web full-stack (Next.js monolito).

**Performance Goals**: landing < 2,5 s p75 en 4G desde Buenos Aires con la app tibia; < 6 s en arranque en frío (SC-002).

**Constraints**: `minInstances: 0`, `maxInstances: 3`; costo < USD 1/mes con < 1.000 visitas (SC-005); sin secretos en el repo.

**Scale/Scope**: decenas de grupos por temporada, picos en noviembre–diciembre; ~8 pantallas en esta feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| I. Privacidad del sorteo | Todavía no hay asignaciones. Reglas de Firestore en deny-all desde el día 1, con tests | ✅ |
| II. Español rioplatense | Landing, login, registro, panel, 404 y mails de Auth en es-AR; `<html lang="es-AR">` | ✅ |
| III. Costo cero en reposo | `minInstances: 0`, `maxInstances: 3`, presupuesto con alertas, estimación en research R10 | ✅ |
| IV. Un solo ecosistema | App Hosting + Firestore + Firebase Auth; Cloudflare solo DNS; sin base relacional | ✅ |
| V. Spec primero | Esta carpeta: spec → plan → tasks | ✅ |
| VI. Tests donde duele | Tests de reglas contra el emulador; script de verificación de dominios | ✅ |
| VII. Simple | Se quitan Prisma, Auth.js y el adaptador; sin librerías nuevas de estado | ✅ |

**Re-check post diseño**: ✅ sin violaciones. *Complexity Tracking* vacío.

## Arquitectura

```text
Navegador ──HTTPS──▶ amigoinvisible.com.ar ──(DNS: Cloudflare, DNS only)──▶ Firebase App Hosting (CDN)
   │                                                                            │
   │  SDK web de Firebase Auth (login)                                          ▼
   └──ID token──▶ POST /api/sesion ─▶ Admin SDK: createSessionCookie ─▶ cookie __session
                                                                               │
                         Server Components / Actions ─▶ verifySessionCookie ─▶ Firestore (Admin SDK)

amigueinvisible.com.ar, www.* ──▶ App Hosting (redirect 301) ──▶ https://amigoinvisible.com.ar/<ruta>
```

- **Rutas de esta feature** (en español, visibles en los links que se comparten):
  - Públicas: `/`, `/ingresar`, `/ingresar/link`, `/registro`
  - Privadas: `/mis-grupos`
  - API: `POST/DELETE /api/sesion` ([contracts/session-api.md](./contracts/session-api.md))
- **Protección de rutas privadas**: cada página llama a `requireUser(ruta)` (`lib/session.ts`). No hay middleware (ver research R5).
- **Perfil**: `POST /api/sesion` hace *upsert* de `users/{uid}` (nombre, email, fechas) con el Admin SDK.
- **Config pública** del SDK web: en App Hosting llega sola en el build (`FIREBASE_WEBAPP_CONFIG`) y `initializeApp()` la toma sin argumentos. En dev se usan las variables `NEXT_PUBLIC_FIREBASE_*` de `.env.local`. En esta feature no hacen falta secretos: el Admin SDK usa las credenciales por defecto de App Hosting.
- **Desarrollo local**: `npm run emulators` (Auth + Firestore, proyecto ficticio `demo-amigo-invisible`). La app detecta `NEXT_PUBLIC_USE_EMULATORS=true`.

## Project Structure

### Documentation (this feature)

```text
specs/001-plataforma-gcp-dominio/
├── spec.md
├── plan.md              # este archivo
├── research.md
├── data-model.md
├── quickstart.md        # runbook de dominios + validación
├── contracts/
│   ├── dns-records.md
│   └── session-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── layout.tsx                 # es-AR, metadata + Open Graph para vista previa en WhatsApp
├── page.tsx                   # landing
├── not-found.tsx              # 404 en español
├── opengraph-image.tsx        # imagen de vista previa generada en el build
├── icon.svg
├── ingresar/page.tsx          # login: contraseña, link por mail, Google
├── ingresar/link/page.tsx     # completa el login por link
├── registro/page.tsx
├── mis-grupos/page.tsx        # panel (vacío en esta feature)
└── api/sesion/route.ts        # POST crea / DELETE borra la session cookie
components/
├── navbar.tsx
├── auth/                      # formularios cliente (login, registro, Google, aviso navegador embebido)
└── ui/                        # button, card, input (existentes)
lib/
├── firebase/client.ts         # SDK web, persistencia en memoria (+ emuladores en dev)
├── firebase/admin.ts          # Admin SDK (ADC)
├── session.ts                 # getSessionUser(), requireUser()
├── profile.ts                 # upsert/lectura de users/{uid}
├── client-session.ts          # ID token → POST /api/sesion
├── auth-errors.ts             # mensajes de error en español
├── safe-next.ts               # evita redirecciones abiertas
└── utils.ts
firestore.rules                # deny-all
firestore.indexes.json
firebase.json                  # emuladores + reglas
.firebaserc
apphosting.yaml                # runConfig + env públicas
scripts/check-domains.sh
tests/unit/safe-next.test.ts
tests/rules/firestore.rules.test.ts
tests/smoke/session.sh
```

**Se eliminan** (quedan en el historial de git): `prisma/`, `lib/prisma.ts`, `lib/auth.ts`, `app/api/auth/`, `types/next-auth.d.ts`, `amplify.yml`, `middleware.ts`, `app/login`, `app/signup`, `app/dashboard`, `app/groups/`, `app/invitations/`. Las páginas de grupos e invitaciones se rehacen sobre Firestore en la feature 002.

**Structure Decision**: monolito Next.js en la raíz del repo, como ya estaba el scaffold. No se separa frontend y backend.

## Configuración de plataforma

`apphosting.yaml` (valores de referencia):

```yaml
runConfig:
  minInstances: 0
  maxInstances: 3
  concurrency: 80
  cpu: 1
  memoryMiB: 512
env:
  - variable: NEXT_PUBLIC_SITE_URL
    value: https://amigoinvisible.com.ar
    availability: [BUILD, RUNTIME]
```

Firebase Auth (consola):

- Proveedores: Email/Contraseña con *Email link* habilitado; Google.
- *User account linking*: una cuenta por email.
- Política de contraseñas: mínimo 10 caracteres.
- Dominios autorizados: `amigoinvisible.com.ar` (+ `localhost` para dev).
- Plantillas: idioma español y dominio personalizado `amigoinvisible.com.ar` (registros en [contracts/dns-records.md](./contracts/dns-records.md)).

## Complexity Tracking

Sin violaciones de la constitución.
