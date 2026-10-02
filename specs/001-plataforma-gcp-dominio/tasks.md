---
description: "Tareas de la feature 001: plataforma en producción con dominio propio"
---

# Tasks: Plataforma en producción con dominio propio

**Input**: documentos de `/specs/001-plataforma-gcp-dominio/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: por la constitución (VI) hay tests de reglas de Firestore y un script de verificación de dominios. El resto se valida con el quickstart.

## Format: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias)
- **[Story]**: US1…US5 de la spec
- 🖐️ = necesita a la responsable (Clave Fiscal, consola web, facturación)

---

## Phase 1: Setup

**Purpose**: repo sano y cuentas creadas

- [ ] T001 Restaurar el repo git: mover el `.git/` roto a `_to_delete/`, extraer `git-repo.tar.gz` en la raíz y verificar `git log` y `git status`
- [ ] T002 Commitear lo nuevo de Spec Kit (`.specify/`, `.claude/skills/`, `specs/`) en `main`
- [ ] T003 🖐️ Crear el repo privado `amigo-invisible` en GitHub y hacer push de `main`
- [ ] T004 [P] 🖐️ Crear el proyecto Firebase `amigo-invisible`, pasarlo a Blaze y crear el presupuesto de USD 5/mes con alertas 50/90/100 % (quickstart §2.1–2.2)
- [ ] T005 [P] 🖐️ Crear en Cloudflare las zonas `amigoinvisible.com.ar` y `amigueinvisible.com.ar` (plan Free) y anotar los nameservers en `contracts/dns-records.md`
- [ ] T006 🖐️ Delegar ambos dominios en nic.ar a los nameservers de Cloudflare y verificar con `dig +short NS` (depende de T005)

---

## Phase 2: Foundational (bloquea todas las user stories)

**Purpose**: sacar AWS/Prisma/Auth.js y dejar Firebase listo

- [ ] T007 Eliminar `prisma/`, `lib/prisma.ts`, `lib/auth.ts`, `app/api/auth/`, `types/next-auth.d.ts`, `amplify.yml`, `app/login/`, `app/signup/`, `app/dashboard/`, `app/groups/`, `app/invitations/`
- [ ] T008 Actualizar `package.json`: quitar `prisma`, `@prisma/client`, `next-auth`, `@auth/prisma-adapter`, `bcryptjs`, `nodemailer` y sus `@types`; agregar `firebase`, `firebase-admin`, `vitest`, `@firebase/rules-unit-testing`; scripts `build: next build`, `test:rules`, `emulators`; quitar `postinstall` de Prisma; `engines.node: ">=22"`
- [ ] T009 [P] Crear `firebase.json` (emuladores de auth y firestore, reglas, índices), `.firebaserc`, `firestore.rules` (deny-all) y `firestore.indexes.json` vacío
- [ ] T010 [P] Test de reglas en `tests/rules/firestore.rules.test.ts`: lectura/escritura anónima y autenticada denegada en `users/{uid}` y en una colección cualquiera. Debe correr con `npm run test:rules` (usa `firebase emulators:exec`)
- [ ] T011 [P] Crear `lib/firebase/client.ts` (SDK web desde `NEXT_PUBLIC_FIREBASE_*`, conecta a emuladores si `NEXT_PUBLIC_USE_EMULATORS=true`)
- [ ] T012 [P] Crear `lib/firebase/admin.ts` (Admin SDK con credenciales por defecto; en dev usa los emuladores vía `FIREBASE_AUTH_EMULATOR_HOST` y `FIRESTORE_EMULATOR_HOST`)
- [ ] T013 [P] Reescribir `.env.example` con las variables de Firebase y de emuladores (sin secretos)
- [ ] T014 [P] Crear `apphosting.yaml` según plan.md (runConfig + env `NEXT_PUBLIC_*`)
- [ ] T015 🖐️ Crear Firestore en `us-east4` y desplegar reglas e índices (quickstart §2.3–2.4)
- [ ] T016 Verificar que `npm run build` y `npm run test:rules` pasan en local

**Checkpoint**: la app compila sin Prisma/Auth.js y las reglas están testeadas

---

## Phase 3: User Story 1 – Entrar a la app por su dominio (P1) 🎯 MVP

**Goal**: la landing en español en `https://amigoinvisible.com.ar`

**Independent Test**: quickstart §7 US1

- [ ] T017 [P] [US1] Traducir `app/layout.tsx` a es-AR: `lang="es-AR"`, metadata y Open Graph (título, descripción, imagen) para la vista previa en WhatsApp; sacar el footer de petclinic
- [ ] T018 [P] [US1] Reescribir `app/page.tsx` en español (sin dependencia de sesión en esta fase: CTAs "Organizar un sorteo" → `/registro` e "Ya tengo cuenta" → `/ingresar`)
- [ ] T019 [P] [US1] Crear `app/not-found.tsx` en español con link al inicio
- [ ] T020 [P] [US1] Crear la imagen Open Graph en `public/og.png` (1200×630) con la estética de DESIGN.md
- [ ] T021 [US1] Crear el backend de App Hosting en `us-east4` conectado a GitHub `main` con rollouts automáticos (quickstart §4) y verificar la URL `*.hosted.app`
- [ ] T022 [US1] 🖐️ Conectar `amigoinvisible.com.ar` en App Hosting, cargar los registros en Cloudflare en *DNS only* y esperar *Connected* (quickstart §5). Completar "Valor real" en `contracts/dns-records.md`
- [ ] T023 [US1] Validar US1 con el quickstart §7

**Checkpoint**: la app está en su dominio. Ya se puede compartir el link

---

## Phase 4: User Story 2 – Los otros dominios llevan al principal (P1)

**Goal**: 4 hosts × http/https → `https://amigoinvisible.com.ar` conservando la ruta

**Independent Test**: `./scripts/check-domains.sh`

- [ ] T024 [P] [US2] Escribir `scripts/check-domains.sh`: para las 8 URLs con `/prueba?x=1`, seguir las redirecciones con `curl -sIL`, contar saltos y validar la URL final y el certificado. Sale con código ≠ 0 si alguna falla
- [ ] T025 [US2] 🖐️ Agregar `www.amigoinvisible.com.ar` con redirección al principal y cargar sus registros en Cloudflare
- [ ] T026 [US2] 🖐️ Agregar `amigueinvisible.com.ar` y `www.amigueinvisible.com.ar` con redirección al principal; cargar registros, SPF `-all` y DMARC `reject` en su zona
- [ ] T027 [US2] Correr `scripts/check-domains.sh`; si la redirección pierde la ruta, aplicar el plan B de research R7 y documentarlo en `contracts/dns-records.md`

**Checkpoint**: los cuatro nombres funcionan

---

## Phase 5: User Story 3 – Crear cuenta, entrar y salir (P2)

**Goal**: los 3 métodos de login en producción y el panel privado

**Independent Test**: quickstart §7 US3

- [ ] T028 [US3] 🖐️ Configurar Firebase Auth: Email/Contraseña + Email link, Google, una cuenta por email, contraseña mín. 10, plantillas en español, dominio autorizado `amigoinvisible.com.ar` (quickstart §2.5)
- [ ] T029 [P] [US3] Crear `lib/session.ts` con `getSessionUser()` y `requireUser(nextPath)` según `contracts/session-api.md`
- [ ] T030 [US3] Crear `app/api/sesion/route.ts`: `POST` (verifica el token, exige login reciente, chequea Origin, crea la cookie `__session` de 14 días, upsert de `users/{uid}`) y `DELETE` (revoca y borra la cookie). Depende de T029
- [ ] T031 [P] [US3] Reescribir `middleware.ts`: si falta `__session` en `/mis-grupos`, `/grupos/*` o `/ajustes`, redirigir a `/ingresar?next=…` (solo acepta `next` relativo interno)
- [ ] T032 [P] [US3] Crear `components/auth/login-form.tsx` (cliente): contraseña, "mandame un link" y "Continuar con Google" (`signInWithPopup`); al entrar hace `POST /api/sesion` y redirige a `next`
- [ ] T033 [P] [US3] Crear `components/auth/in-app-browser-notice.tsx`: detecta navegadores embebidos (Instagram, Facebook, etc.) y sugiere abrir en el navegador o usar el link por mail
- [ ] T034 [US3] Crear `app/ingresar/page.tsx` (usa T032 y T033; si ya hay sesión, redirige a `/mis-grupos`)
- [ ] T035 [US3] Crear `app/ingresar/link/page.tsx`: completa `signInWithEmailLink`; si no hay email guardado en el dispositivo, lo pide antes de completar
- [ ] T036 [US3] Crear `app/registro/page.tsx`: registro con contraseña + `sendEmailVerification`, Google y link por mail; mensajes de error en español (email ya usado, contraseña corta)
- [ ] T037 [US3] Crear `app/mis-grupos/page.tsx` con `requireUser` y estado vacío ("Todavía no tenés grupos")
- [ ] T038 [US3] Reescribir `components/navbar.tsx` en español con estado de sesión (vía `getSessionUser`) y botón "Salir" (`DELETE /api/sesion`)
- [ ] T039 [US3] Hacer que la landing (`app/page.tsx`) muestre "Ir a mis grupos" si hay sesión
- [ ] T040 [US3] 🖐️ Mails de Auth con dominio propio: registros SPF/DKIM/DMARC en Cloudflare y *Apply custom domain* (quickstart §6)
- [ ] T041 [US3] Primer rollout con login: verificar que `createSessionCookie` funciona en producción; si falla por permisos, dar el rol *Firebase Authentication Admin* a la service account del backend (research R5)
- [ ] T042 [US3] Validar US3 con el quickstart §7 en Chrome Android, Safari iOS y desktop

**Checkpoint**: cualquiera puede crear una cuenta en producción

---

## Phase 6: User Story 4 – Publicar cambios sin tocar nada a mano (P2)

**Goal**: deploy aburrido y reversible

**Independent Test**: quickstart §7 US4

- [ ] T043 [US4] Verificar que los rollouts automáticos están activos en `main` y que el check de GitHub muestra el estado del rollout
- [ ] T044 [US4] Probar un build roto en una rama → merge → confirmar que el sitio sigue con la versión anterior; revertir
- [ ] T045 [US4] Probar el rollback a un rollout anterior desde la consola y documentar el procedimiento en `README.md`

---

## Phase 7: User Story 5 – Costo acotado y avisos (P3)

**Goal**: ~USD 0 en reposo, con techo

**Independent Test**: quickstart §7 US5

- [ ] T046 [US5] Verificar el presupuesto y los destinatarios de las alertas (creados en T004)
- [ ] T047 [US5] Verificar en Cloud Run que el servicio del backend tiene `maxInstances: 3` y que baja a 0 sin tráfico
- [ ] T048 [P] [US5] 🖐️ Agendar un recordatorio en el calendario para renovar los dominios (17/03/2027, un mes antes del vencimiento)

---

## Phase 8: Polish

- [ ] T049 [P] Reescribir `README.md`: stack Firebase, desarrollo con emuladores, deploy, DNS y rollback. Marcar como obsoletas las secciones de stack y deploy de `DESIGN.md` (con un aviso arriba del documento, sin borrar su contenido)
- [ ] T050 [P] Crear `CLAUDE.md` con punteros a la constitución, `specs/` y comandos (`npm run dev`, `npm run test:rules`, emuladores)
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
