<!--
Sync Impact Report
- Versión: (template) → 1.0.0
- Principios agregados: I–VII (todos nuevos)
- Secciones agregadas: Stack y restricciones de plataforma, Flujo de trabajo, Gobernanza
- Templates revisados: plan-template.md ✅ (Constitution Check usa estos gates) · spec-template.md ✅ · tasks-template.md ✅
- Supersede: las secciones "Recommended stack" y "Deployment (AWS)" de DESIGN.md (Postgres/RDS/Amplify/SES/Auth.js ya no aplican).
- TODOs diferidos: ninguno
-->

# Amigo Invisible — Constitution

## Core Principles

### I. Privacidad del sorteo (NO NEGOCIABLE)

- Nadie puede ver a quién le tocó a otra persona: ni el organizador, ni otro participante, ni la interfaz de administración. Cada persona ve solo su propia asignación.
- El sorteo se ejecuta **solo en el servidor**, en una única operación atómica. El cliente nunca recibe ni calcula asignaciones ajenas.
- Las reglas de seguridad de la base deben impedir leer asignaciones ajenas incluso si alguien llama a la base directamente desde el navegador.
- Los logs, errores, emails y analytics **nunca** incluyen el par giver→receiver.

*Por qué*: el juego entero se rompe si se filtra una asignación. Es el único dato realmente sensible de la app.

### II. Español rioplatense primero

- Toda la interfaz, los emails y los mensajes de error están en español de Argentina (voseo). No hay versión en inglés en v1.
- Fechas, horas y montos se muestran con formato `es-AR`; la moneda por defecto es **ARS**.
- Mobile first: la mayoría de la gente va a entrar desde un link de WhatsApp en el celular.

### III. Costo cero en reposo (FinOps)

- Todo componente debe escalar a cero cuando no hay tráfico: nada de instancias, bases o servicios con costo fijo mensual.
- El proyecto tiene una **alerta de presupuesto** activa y límites de instancias máximas en el cómputo.
- Cada `plan.md` incluye una estimación de costo mensual para el tráfico esperado. Agregar un servicio pago requiere justificarlo en *Complexity Tracking*.

### IV. Un solo ecosistema: Google Cloud / Firebase

- Hosting y cómputo: **Firebase App Hosting** (Next.js).
- Datos: **Cloud Firestore** (modo nativo). **No se usan bases relacionales** (ni Postgres, ni RDS, ni Cloud SQL).
- Identidad: **Firebase Authentication**.
- Secretos: **Secret Manager** (vía App Hosting). Nunca en el repo ni en variables en texto plano.
- DNS: **Cloudflare**, en modo *DNS only* para los registros que apuntan a Firebase.
- Única excepción permitida sin enmienda: un proveedor de email transaccional para los mails propios de la app (invitaciones, aviso de sorteo).

### V. Spec primero (SDD con Spec Kit)

- No se escribe código de producto sin `spec.md` → `plan.md` → `tasks.md` aprobados para esa feature.
- Si cambia el comportamiento, primero se actualiza la spec y después el código.
- Las specs describen el *qué* y el *por qué* sin tecnología; el *cómo* vive en `plan.md`.
- Specs, planes y tareas se escriben en español.

### VI. Tests donde duele

- El algoritmo de sorteo y las reglas de seguridad de Firestore tienen **tests automatizados escritos antes de la implementación** (unit tests para el algoritmo; tests contra el emulador para las reglas).
- El resto de la UI se valida con el `quickstart.md` de cada feature; se agregan tests cuando un bug se repite.

### VII. Simple hasta que duela

- Server Components y Server Actions por defecto; JavaScript en el cliente solo donde hay interacción real.
- Sin librerías de estado global, ORMs ni capas de abstracción hasta que un problema concreto lo justifique.
- Una página por recurso (el patrón de rutas de DESIGN.md sigue vigente).

## Stack y restricciones de plataforma

| Capa | Elección | Notas |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind | Se reutiliza el scaffold existente; se quitan Prisma y Auth.js |
| Hosting | Firebase App Hosting | Región `us-east4` (no hay regiones de App Hosting en Sudamérica) |
| Datos | Cloud Firestore (Standard) | Misma región que el backend. La ubicación no se puede cambiar después |
| Auth | Firebase Authentication | Email + contraseña, link por email, Google |
| Dominio principal | `amigoinvisible.com.ar` | `www.` y `amigueinvisible.com.ar` redirigen (301) al principal |
| DNS | Cloudflare (plan free) | Delegado desde NIC.ar. Registros de Firebase en *DNS only* |
| Plan de facturación | Blaze | Obligatorio para App Hosting. Con alerta de presupuesto |

Seguridad mínima:

- Reglas de Firestore con **deny por defecto**; cada colección se abre explícitamente.
- Los tokens de invitación son aleatorios (≥128 bits), vencen y se pueden revocar.
- La sesión del servidor se valida en el servidor (no alcanza con chequear que exista una cookie).

## Flujo de trabajo

1. `/speckit-specify` → `/speckit-clarify` (si quedan `[NEEDS CLARIFICATION]`) → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
2. Una carpeta `specs/NNN-nombre/` por feature, numeradas en orden.
3. Desarrollo local contra los **emuladores de Firebase**; nunca contra producción.
4. Todo merge a `main` despliega a producción automáticamente vía App Hosting. Si el build falla, queda la versión anterior.

## Governance

- Esta constitución prevalece sobre DESIGN.md, el README y cualquier otra guía. Donde DESIGN.md contradiga esta constitución (stack, deploy), manda esta.
- El *Constitution Check* de cada `plan.md` debe pasar antes de generar tareas. Una violación se justifica en *Complexity Tracking* o no se hace.
- Enmiendas: se documentan en el Sync Impact Report de arriba y suben la versión (MAJOR: se quita o redefine un principio; MINOR: se agrega un principio o sección; PATCH: aclaraciones).

**Version**: 1.0.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-09-30
