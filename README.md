# Amigo Invisible

App para organizar el sorteo del amigo invisible: armás el grupo, mandás los links por WhatsApp y cada quien descubre a quién le regala. Sitio: **https://amigoinvisible.com.ar** (`amigueinvisible.com.ar` redirige ahí).

Se desarrolla con **Spec-Driven Development** usando [GitHub Spec Kit](https://github.com/github/spec-kit):

- Principios del proyecto: [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- Features: [`specs/`](specs/). Cada una con `spec.md` → `plan.md` → `tasks.md`.
  - [`001-plataforma-gcp-dominio`](specs/001-plataforma-gcp-dominio/): dominio, login y deploy
  - [`002-sorteo-amigo-invisible`](specs/002-sorteo-amigo-invisible/): grupos, invitaciones, sorteo, listas de deseos y exclusiones
- Con Claude Code: `/speckit-specify`, `/speckit-clarify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`.

La versión anterior en Angular quedó en el tag `legacy-angular`.

## Stack

- **Next.js 15** (App Router, Server Components) + TypeScript + Tailwind
- **Firebase App Hosting** (región `us-east4`) — build y deploy automático desde `main`
- **Cloud Firestore** — reglas en deny-all; todo el acceso pasa por el servidor (Admin SDK)
- **Firebase Authentication** — email + contraseña, link por mail y Google, con session cookies (`__session`)
- **Cloudflare** como DNS (modo *DNS only*), delegado desde NIC.ar

## Desarrollo local

Requisitos: Node.js 22+, Java 21+ (para los emuladores) y `firebase-tools` (`npm i -g firebase-tools`).
No hace falta un proyecto real de Firebase: todo corre contra los emuladores con el proyecto ficticio `demo-amigo-invisible`.

```bash
cp .env.example .env.local
npm install
npm run emulators      # terminal 1: Auth (9099), Firestore (8080), UI en http://localhost:4000
npm run dev            # terminal 2: http://localhost:3000
```

En la UI de los emuladores (`http://localhost:4000` → Authentication) ves los usuarios creados y los links de acceso "enviados" por mail.

## Tests

```bash
npm test                  # unit tests (algoritmo de sorteo con 10.000 sorteos aleatorios, schemas)
npm run test:rules        # reglas de Firestore contra el emulador
npm run test:integration  # capa de datos contra los emuladores (privacidad, sorteo único, invitaciones)
npm run build && npm run test:smoke   # flujo de sesión de punta a punta contra los emuladores
npm run check:domains     # en producción: los 4 dominios × http/https terminan en el principal
```

Prueba en navegador real (registro, grupo, invitaciones, exclusiones, sorteo y revelación con 4 cuentas):

```bash
npm run emulators                   # terminal 1
npm run build && npm start          # terminal 2 (con .env.local)
npx playwright install chromium     # una vez
npm run test:e2e                    # terminal 3; capturas en test-results/e2e/
```

## Deploy

Cada merge a `main` despliega solo (Firebase App Hosting). Si el build falla, queda la versión anterior.
Para volver atrás: consola de Firebase → App Hosting → backend → *Rollouts* → elegir uno anterior → *Roll back*.

La configuración del backend está en [`apphosting.yaml`](apphosting.yaml). El paso a paso completo (proyecto, DNS, dominios, mails) está en [`specs/001-plataforma-gcp-dominio/quickstart.md`](specs/001-plataforma-gcp-dominio/quickstart.md).

## Estructura

```text
app/                    rutas (landing, /ingresar, /registro, /mis-grupos, /grupos/…, /invitaciones/…, /api/sesion)
components/             UI (auth/, ui/, navbar)
lib/domain/             algoritmo de sorteo y validaciones (puro, sin Firebase)
lib/data/               capa de datos con toda la autorización (server-only)
lib/                    firebase (client/admin), sesión, perfil, formatos
tests/                  unit/, rules/, integration/, smoke/, e2e/
scripts/                check-domains.sh
specs/                  specs de Spec Kit
.specify/               constitución, templates y scripts de Spec Kit
.claude/skills/         comandos /speckit-* para Claude
```
