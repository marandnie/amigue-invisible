---
description: "Tareas de la feature 001: plataforma en producción con dominio propio"
---

# Tasks: Plataforma en producción con dominio propio

**Input**: documentos de `/specs/001-plataforma-gcp-dominio/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: por la constitución (VI) hay tests de reglas de Firestore, unit tests, un smoke test de sesión contra los emuladores y un script de verificación de dominios. El resto se valida con el quickstart.

**Estado (2026-10-02)**: hecho todo lo que es código (rama `001-plataforma-gcp-dominio`). Falta lo marcado con 🖐️ y las validaciones en producción.

## Format: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias)
- **[Story]**: US1…US5 de la spec
- 🖐️ = necesita a la responsable (Clave Fiscal, consola web, facturación)

---

## Phase 1: Setup

**Purpose**: repo sano y cuentas creadas

- [x] T001 Usar el repo `marandnie/amigue-invisible`: la versión Angular queda en el tag `legacy-angular`; rama `001-plataforma-gcp-dominio` con el scaffold Next.js (commit original del `git-repo.tar.gz`)
- [x] T002 Commitear Spec Kit (`.specify/`, `.claude/skills/`, `specs/`) en la rama
- [X] T003 🖐️ Push de la rama `001-plataforma-gcp-dominio` y del tag `legacy-angular`; PR a `main`; desactivar GitHub Pages en el repo (tenía `CNAME` = amigueinvisible.com.ar) — *2026-10-02: push y tag hechos, Pages despublicado; falta el PR* — *2026-10-03: PR #1 mergeado; Pages quedó publicando solo el README en mandieto.com.ar/amigue-invisible/ (sin CNAME propio)*
- [X] T004 [P] 🖐️ Crear el proyecto Firebase (`amigue-invisible-604df`, creado), pasarlo a Blaze y crear el presupuesto de USD 5/mes con alertas 50/90/100 % (quickstart §2.1–2.2) — *Blaze hecho; falta el presupuesto* — *2026-10-03: presupuesto creado*
- [x] T005 [P] 🖐️ Crear en Cloudflare las zonas `amigoinvisible.com.ar` y `amigueinvisible.com.ar` (plan Free) y anotar los nameservers en `contracts/dns-records.md`
- [x] T006 🖐️ Delegar ambos dominios en nic.ar a los nameservers de Cloudflare y verificar con `dig +short NS` (depende de T005)

---

## Phase 2: Foundational (bloquea todas las user stories)

**Purpose**: sacar AWS/Prisma/Auth.js y dejar Firebase listo

- [x] T007 Eliminar `prisma/`, `lib/prisma.ts`, `lib/auth.ts`, `app/api/auth/`, `types/next-auth.d.ts`, `amplify.yml`, `app/login/`, `app/signup/`, `app/dashboard/`, `app/groups/`, `app/invitations/`
- [x] T008 Actualizar `package.json`: quitar `prisma`, `@prisma/client`, `next-auth`, `@auth/prisma-adapter`, `bcryptjs`, `nodemailer` y sus `@types`; agregar `firebase`, `firebase-admin`, `vitest`, `@firebase/rules-unit-testing`; scripts `build: next build`, `test:rules`, `emulators`; quitar `postinstall` de Prisma; `engines.node: ">=22"`
- [x] T009 [P] Crear `firebase.json` (emuladores de auth y firestore, reglas, índices), `.firebaserc`, `firestore.rules` (deny-all) y `firestore.indexes.json` vacío
- [x] T010 [P] Test de reglas en `tests/rules/firestore.rules.test.ts`: lectura/escritura anónima y autenticada denegada en `users/{uid}` y en una colección cualquiera. Debe correr con `npm run test:rules` (usa `firebase emulators:exec`)
- [x] T011 [P] Crear `lib/firebase/client.ts` (SDK web desde `NEXT_PUBLIC_FIREBASE_*`, conecta a emuladores si `NEXT_PUBLIC_USE_EMULATORS=true`)
- [x] T012 [P] Crear `lib/firebase/admin.ts` (Admin SDK con credenciales por defecto; en dev usa los emuladores vía `FIREBASE_AUTH_EMULATOR_HOST` y `FIRESTORE_EMULATOR_HOST`)
- [x] T013 [P] Reescribir `.env.example` con las variables de Firebase y de emuladores (sin secretos)
- [x] T014 [P] Crear `apphosting.yaml` según plan.md (runConfig + env `NEXT_PUBLIC_*`)
- [x] T015 🖐️ Crear Firestore en `us-east4` y desplegar reglas e índices (quickstart §2.3–2.4)
- [x] T016 Verificar que `npm run build` y `npm run test:rules` pasan en local

**Checkpoint**: la app compila sin Prisma/Auth.js y las reglas están testeadas

---

## Phase 3: User Story 1 – Entrar a la app por su dominio (P1) 🎯 MVP

**Goal**: la landing en español en `https://amigoinvisible.com.ar`

**Independent Test**: quickstart §7 US1

- [x] T017 [P] [US1] Traducir `app/layout.tsx` a es-AR: `lang="es-AR"`, metadata y Open Graph (título, descripción, imagen) para la vista previa en WhatsApp; sacar el footer de petclinic
- [x] T018 [P] [US1] Reescribir `app/page.tsx` en español (sin dependencia de sesión en esta fase: CTAs "Organizar un sorteo" → `/registro` e "Ya tengo cuenta" → `/ingresar`)
- [x] T019 [P] [US1] Crear `app/not-found.tsx` en español con link al inicio
- [x] T020 [P] [US1] Imagen Open Graph generada en el build (`app/opengraph-image.tsx`, 1200×630) e ícono `app/icon.svg`
- [x] T021 [US1] Crear el backend de App Hosting en `us-east4` conectado a GitHub `main` con rollouts automáticos (quickstart §4) y verificar la URL `*.hosted.app`
- [x] T022 [US1] 🖐️ Conectar `amigoinvisible.com.ar` en App Hosting, cargar los registros en Cloudflare en *DNS only* y esperar *Connected* (quickstart §5). Completar "Valor real" en `contracts/dns-records.md`
- [ ] T023 [US1] Validar US1 con el quickstart §7

**Checkpoint**: la app está en su dominio. Ya se puede compartir el link

---

## Phase 4: User Story 2 – Los otros dominios llevan al principal (P1)

**Goal**: 4 hosts × http/https → `https://amigoinvisible.com.ar` conservando la ruta

**Independent Test**: `./scripts/check-domains.sh`

- [x] T024 [P] [US2] Escribir `scripts/check-domains.sh`: para las 8 URLs con `/prueba?x=1`, seguir las redirecciones con `curl -sIL`, contar saltos y validar la URL final y el certificado. Sale con código ≠ 0 si alguna falla
- [x] T025 [US2] 🖐️ Agregar `www.amigoinvisible.com.ar` con redirección al principal y cargar sus registros en Cloudflare
- [x] T026 [US2] 🖐️ Agregar `amigueinvisible.com.ar` y `www.amigueinvisible.com.ar` con redirección al principal; cargar registros, SPF `-all` y DMARC `reject` en su zona
- [x] T027 [US2] *(2026-10-02: las 8 URLs OK; App Hosting redirige con 302, no 301 → ver T053)* Correr `scripts/check-domains.sh`; si la redirección pierde la ruta, aplicar el plan B de research R7 y documentarlo en `contracts/dns-records.md`

**Checkpoint**: los cuatro nombres funcionan

---

## Phase 5: User Story 3 – Crear cuenta, entrar y salir (P2)

**Goal**: los 3 métodos de login en producción y el panel privado

**Independent Test**: quickstart §7 US3

- [x] T028 [US3] 🖐️ *(hecho el 2026-10-02)* Configurar Firebase Auth: Email/Contraseña + Email link, Google, una cuenta por email, contraseña mín. 10, plantillas en español, dominio autorizado `amigoinvisible.com.ar` (quickstart §2.5)
- [x] T029 [P] [US3] Crear `lib/session.ts` con `getSessionUser()` y `requireUser(nextPath)` según `contracts/session-api.md`
- [x] T030 [US3] Crear `app/api/sesion/route.ts`: `POST` (verifica el token, exige login reciente, chequea Origin, crea la cookie `__session` de 14 días, upsert de `users/{uid}`) y `DELETE` (revoca y borra la cookie). Depende de T029
- [x] T031 [P] [US3] Proteger rutas privadas sin middleware: `requireUser(ruta)` en cada página; `next` solo acepta rutas internas (`lib/safe-next.ts` + `tests/unit/safe-next.test.ts`)
- [x] T032 [P] [US3] Crear `components/auth/auth-panel.tsx` (cliente): contraseña, "mandame un link" y "Continuar con Google" (`signInWithPopup`); al entrar hace `POST /api/sesion` y redirige a `next`
- [x] T033 [P] [US3] Crear `components/auth/in-app-browser-notice.tsx`: detecta navegadores embebidos (Instagram, Facebook, etc.) y sugiere abrir en el navegador o usar el link por mail
- [x] T034 [US3] Crear `app/ingresar/page.tsx` (usa T032 y T033; si ya hay sesión, redirige a `/mis-grupos`)
- [x] T035 [US3] Crear `app/ingresar/link/page.tsx`: completa `signInWithEmailLink`; si no hay email guardado en el dispositivo, lo pide antes de completar
- [x] T036 [US3] Crear `app/registro/page.tsx`: registro con contraseña + `sendEmailVerification`, Google y link por mail; mensajes de error en español (email ya usado, contraseña corta)
- [x] T037 [US3] Crear `app/mis-grupos/page.tsx` con `requireUser` y estado vacío ("Todavía no tenés grupos")
- [x] T038 [US3] Reescribir `components/navbar.tsx` en español con estado de sesión (vía `getSessionUser`) y botón "Salir" (`DELETE /api/sesion`)
- [x] T039 [US3] Hacer que la landing (`app/page.tsx`) muestre "Ir a mis grupos" si hay sesión
- [ ] T040 [US3] 🖐️ Mails de Auth con dominio propio: registros SPF/DKIM/DMARC en Cloudflare y *Apply custom domain* (quickstart §6)
- [X] T041 [US3] Primer rollout con login: verificar que `createSessionCookie` funciona en producción; si falla por permisos, dar el rol *Firebase Authentication Admin* a la service account del backend (research R5)
- [ ] T042 [US3] Validar US3 con el quickstart §7 en Chrome Android, Safari iOS y desktop
- [x] T052 [US3] Smoke test de punta a punta de la sesión contra los emuladores: `tests/smoke/session.sh` (`npm run test:smoke`)

**Checkpoint**: cualquiera puede crear una cuenta en producción

---

## Phase 6: User Story 4 – Publicar cambios sin tocar nada a mano (P2)

**Goal**: deploy aburrido y reversible

**Independent Test**: quickstart §7 US4

- [X] T043 [US4] Verificar que los rollouts automáticos están activos en `main` y que el check de GitHub muestra el estado del rollout
- [ ] T044 [US4] Probar un build roto en una rama → merge → confirmar que el sitio sigue con la versión anterior; revertir
- [ ] T045 [US4] Probar el rollback a un rollout anterior desde la consola y documentar el procedimiento en `README.md`

---

## Phase 7: User Story 5 – Costo acotado y avisos (P3)

**Goal**: ~USD 0 en reposo, con techo

**Independent Test**: quickstart §7 US5

- [X] T046 [US5] Verificar el presupuesto y los destinatarios de las alertas (creados en T004)
- [ ] T047 [US5] Verificar en Cloud Run que el servicio del backend tiene `maxInstances: 3` y que baja a 0 sin tráfico
- [X] T048 [P] [US5] 🖐️ Agendar un recordatorio en el calendario para renovar los dominios (17/03/2027, un mes antes del vencimiento) — *agendado en Google Calendar para el 17/03/2027*

---

## Phase 8: Polish

- [x] T054 [US2] `middleware.ts` + `lib/canonical.ts`: `*.hosted.app` → `https://amigoinvisible.com.ar` con 308 (con tests)
- [x] T055 [US3] Login con Google en iPhone (research R6): `lib/firebase/build-config.mjs` (config web desde `FIREBASE_WEBAPP_CONFIG` + `authDomain` propio), *rewrites* de `/__/auth/*` y `/__/firebase/*` en `next.config.mjs`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` en `apphosting.yaml`, con tests
- [X] T056 [US3] 🖐️ Agregar `https://amigoinvisible.com.ar/__/auth/handler` en *Authorized redirect URIs* del cliente OAuth web (Google Cloud → APIs & Services → Credentials). Va **antes** de mergear T055
- [X] T057 [US3] Después del deploy: `curl -sI https://amigoinvisible.com.ar/__/auth/handler` → 200, y entrar con Google desde un iPhone (Safari y Chrome) — *2026-10-03: handler → 200 y login con Google en iPhone OK*
- [ ] T053 [US2] FR-002 pide redirección permanente (301/308) y App Hosting responde 302. Decidir si alcanza o aplicar el plan B de research R7 (Redirect Rule de Cloudflare con 301) para `www` y `amigueinvisible.com.ar`

- [x] T049 [P] Reescribir `README.md`: stack Firebase, desarrollo con emuladores, deploy, DNS y rollback. Marcar como obsoletas las secciones de stack y deploy de `DESIGN.md` (con un aviso arriba del documento, sin borrar su contenido)
- [x] T050 [P] Crear `CLAUDE.md` con punteros a la constitución, `specs/` y comandos (`npm run dev`, `npm run test:rules`, emuladores)
- [ ] T051 Correr el quickstart completo (§7) y marcar la spec como `Status: Done`

---

## Dependencies & Execution Order

- **Setup (T001–T006)**: T006 depende de T005. T003 depende de T001–T002.
- **Foundational (T007–T016)**: depende de T001. T015 depende de T004. Bloquea todo lo demás.
- **US1 (T017–T023)**: T021 depende de T003, T004 y T016; T022 depende de T006 y T021.
- **US2 (T024–T027)**: depende de T022.
- **US3 (T028–T042)**: puede empezar en local después de Foundational (con emuladores). T040–T042 dependen de T022.
- **US4 y US5**: dependen de T021.
- **Polish**: al final.

### Parallel opportunities

- T004 y T005 (cuentas) en paralelo con T007–T014 (código).
- Dentro de Foundational: T009–T014.
- Dentro de US3: T029, T031, T032 y T033.

## Implementation Strategy

1. **MVP = Setup + Foundational + US1 + US2**: la landing en su dominio, con los redirects. Es lo que pide la consigna ("deployar en los dominios").
2. **Después US3** (login en producción), que desbloquea la feature 002.
3. US4 y US5 son en su mayoría verificaciones; se cierran junto con US3.
