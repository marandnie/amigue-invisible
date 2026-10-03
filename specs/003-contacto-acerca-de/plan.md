# Implementation Plan: Contacto, Acerca de y Política de privacidad

**Branch**: `003-contacto-acerca-de` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

## Summary

Tres páginas públicas nuevas (`/contacto`, `/acerca`, `/privacidad`) enlazadas desde el pie de todas las páginas. El contacto es un Server Action que valida con zod, filtra bots (campo trampa + tiempo mínimo), limita a 5 envíos por hora por origen y por email (contadores en Firestore, solo con hashes) y entrega el mensaje con Resend a `ADMIN_EMAIL`, con `reply_to` al email de quien escribe. No se guarda el mensaje. Acerca de y Privacidad son Server Components estáticos con textos en un solo lugar (`lib/content/`).

## Technical Context

- Next.js (App Router) + TypeScript + Tailwind; Firestore (Admin SDK); Resend (de la 002).
- Destino de los mensajes: `ADMIN_EMAIL` (de la 004). **Desvío de la spec**: la spec suponía un secreto; Marina decidió el 2026-10-03 que esa dirección quede como variable en `apphosting.yaml`. No se muestra en ninguna página (FR-007).
- Sin dependencias nuevas.

## Decisiones (research)

- **R1. Anti-bots sin desafíos visibles (FR-009)**: campo trampa oculto (`sitio_web`) y marca de tiempo del render; se descarta en silencio si el campo trampa viene lleno o si pasaron menos de 3 s. Cloudflare Turnstile queda descartado: el dominio está en *DNS only* y sumaría un secreto más.
- **R2. Límite de 5 por hora (FR-009)**: colección `contactLimits/{clave}` con `{ windowStart, count }` en una transacción; la clave es `sha256("ip:" + ip)` y `sha256("email:" + email)`. No se guardan IP ni email en claro. La IP sale del primer valor de `x-forwarded-for` (App Hosting). Las reglas de Firestore siguen en deny-all: solo escribe el servidor.
- **R3. Sin copia a quien escribe y sin guardar el mensaje (FR-010)**: el único destinatario es `ADMIN_EMAIL`; los logs solo registran el resultado del envío.
- **R4. Referencia a grupo (FR-011)**: llega como `?grupo=<id>`; el servidor la valida con `getGroupAccess` (organizador o participante). Si no corresponde, se descarta sin avisar. Solo viajan nombre e id del grupo.
- **R5. Doble envío (FR-012)**: botón deshabilitado durante el envío (`useActionState`).
- **R6. security.txt**: su `Contact` pasa de un mail a `https://amigoinvisible.com.ar/contacto`, para cumplir FR-007 (RFC 9116 admite una URL).
- **R7. Política (FR-020 a FR-027)**: datos verificados contra producción el 2026-10-03:
  - Google Cloud / Firebase: App Hosting, Firestore, Authentication, Cloud Logging y Cloud Scheduler en `us-east4` (Virginia del Norte, EE. UU.).
  - Resend (EE. UU.), con envío desde la región de San Pablo (Brasil).
  - Cookie única `__session` (14 días). Registros técnicos: retención de 30 días de Cloud Logging.
  - No se guarda la foto de Google.
  - La 004 manda a la responsable el nombre, el mail y el método de cada alta, y un resumen semanal: se declara como finalidad.
  - Plazos: acceso, 10 días corridos; rectificación, actualización y supresión, 5 días hábiles (Ley 25.326, arts. 14 y 16; AAIP).
  - Leyenda obligatoria de la AAIP (Res. 14/2018, art. 3), textual.
  - Es un **borrador para revisión legal** antes de mergear (supuesto de la spec).

## Constitution Check

| Principio | Estado |
|---|---|
| I. Privacidad del sorteo | ✅ Ni el mail de contacto ni la referencia de grupo llevan asignaciones; aviso FR-008 en el formulario. |
| II. Español rioplatense | ✅ |
| III. Costo cero | ✅ Escrituras mínimas en Firestore; Resend dentro del plan gratis. |
| IV. Un ecosistema | ✅ |
| V. Spec primero | ✅ |
| VI. Tests donde duele | ✅ Unit tests del esquema, del filtro de bots, de la ventana del límite y de la plantilla. |
| VII. Simple | ✅ Sin captcha ni servicios nuevos. |

## Project Structure

```text
lib/content/faq.ts                    # preguntas frecuentes (fuente única; la usa también la 006)
lib/content/privacy.ts                # fecha de la política
lib/contact.ts                        # esquema, filtro de bots, límite y envío (server-only)
lib/contact-rules.ts                  # partes puras y testeables
lib/contact-constants.ts              # motivos y largo máximo (sin zod: los usa el navegador)
lib/email/templates.ts                # contactMessageEmail
app/contacto/{page,actions}.ts(x)
app/acerca/page.tsx
app/privacidad/page.tsx
components/contact/contact-form.tsx
components/site-footer.tsx            # pie con los tres accesos
components/auth/auth-panel.tsx        # aviso de política en el registro (FR-022)
components/groups/add-participants-form.tsx  # recordatorio FR-023
app/grupos/[id]/page.tsx              # acceso a contacto con referencia (US3)
public/.well-known/security.txt       # R6
tests/unit/contact.test.ts
```

## Complexity Tracking

| Desvío | Por qué |
|---|---|
| `ADMIN_EMAIL` como variable y no como secreto | Decisión de Marina (2026-10-03); la dirección ya es pública en los commits. |
