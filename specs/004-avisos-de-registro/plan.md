# Implementation Plan: Avisos de registro para la administradora

**Branch**: `004-avisos-de-registro` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

## Summary

El alta ya pasa por un único lugar del servidor: `upsertProfile` dentro de `POST /api/sesion`. Ahí, en la misma transacción que crea `users/{uid}`, se sabe si es un alta; si lo es, la ruta manda el aviso con Resend (ya integrado en la 002). El reporte semanal es un endpoint `POST /api/tareas/reporte-semanal` que dispara **Cloud Scheduler** con un token OIDC; el endpoint verifica el token y arma el resumen consultando `users`.

## Technical Context

- Next.js (App Router) en Firebase App Hosting, Firestore, Firebase Auth, Resend (todo existente).
- Nuevo: un job de **Cloud Scheduler** (`us-east4`, zona horaria `America/Argentina/Buenos_Aires`, `0 9 * * 1`).
- Config nueva (sin secretos):
  - `ADMIN_EMAIL`: destino de avisos y reporte. Ya es pública en el historial de commits, así que va como variable común.
  - `REPORT_INVOKER_SA`: mail de la service account con la que firma Cloud Scheduler.

## Decisiones

- **R1. Detectar el alta en la transacción**: `upsertProfile` devuelve `{ created: true, … }` solo cuando hizo `set` del documento. Las transacciones pueden reintentarse, así que el flag se reinicia en cada intento. Dos ingresos simultáneos no pueden crear el doc dos veces.
- **R2. El aviso se espera (await) pero no bloquea**: en App Hosting (Cloud Run) el trabajo después de responder puede quedar sin CPU; mandar antes de responder agrega ~200 ms solo en el primer ingreso. Cualquier error se traga y se loguea sin datos personales.
- **R3. Autenticación del reporte con OIDC, sin secreto compartido**: Cloud Scheduler firma un ID token de Google con audiencia = URL del endpoint. El servidor lo valida con `https://oauth2.googleapis.com/tokeninfo` (sin dependencias nuevas, una llamada por semana) y exige `iss` de Google, `aud` exacta, `email` = `REPORT_INVOKER_SA`, `email_verified` y que no esté vencido. Se evita otro secreto en Secret Manager (el rollout del PR #3 falló justamente por un secreto faltante).
- **R4. Consultas**: `createdAt >= hace 7 días` ordenado desc con límite 51; `count()` de `lastLoginAt >= hace 7 días` y `count()` total. Índices de un solo campo automáticos; no hacen falta compuestos.

## Constitution Check

| Principio | Estado |
|---|---|
| I. Privacidad del sorteo | ✅ Los mails solo tienen datos del perfil; nada de grupos ni asignaciones. |
| II. Español rioplatense | ✅ Mails en voseo, fechas es-AR. |
| III. Costo cero en reposo | ✅ Cloud Scheduler: 3 jobs gratis por cuenta de facturación. Resend dentro del plan gratis. Costo estimado: USD 0/mes. |
| IV. Un solo ecosistema | ✅ Cloud Scheduler es de Google Cloud; Resend es la excepción ya permitida. |
| V. Spec primero | ✅ Esta carpeta. |
| VI. Tests donde duele | ✅ Unit tests de plantillas y de la validación del token. |
| VII. Simple | ✅ Sin SDKs nuevos. |

## Project Structure

```text
lib/profile.ts                         # upsertProfile devuelve { created, profile }
lib/admin-notices.ts                   # aviso de alta y reporte semanal (server-only)
lib/scheduler-auth.ts                  # validación del token OIDC (pura + fetch inyectable)
lib/email/templates.ts                 # signupNoticeEmail, weeklyReportEmail
app/api/sesion/route.ts                # manda el aviso si hubo alta
app/api/tareas/reporte-semanal/route.ts
apphosting.yaml                        # ADMIN_EMAIL, REPORT_INVOKER_SA
tests/unit/admin-emails.test.ts
tests/unit/scheduler-auth.test.ts
```

## Puesta en producción (una sola vez)

```bash
PROJECT=amigue-invisible-604df
gcloud services enable cloudscheduler.googleapis.com --project $PROJECT
gcloud iam service-accounts create reporte-semanal --display-name="Reporte semanal" --project $PROJECT
gcloud scheduler jobs create http reporte-semanal \
  --project $PROJECT --location us-east4 \
  --schedule "0 9 * * 1" --time-zone "America/Argentina/Buenos_Aires" \
  --uri "https://amigoinvisible.com.ar/api/tareas/reporte-semanal" --http-method POST \
  --oidc-service-account-email "reporte-semanal@$PROJECT.iam.gserviceaccount.com" \
  --oidc-token-audience "https://amigoinvisible.com.ar/api/tareas/reporte-semanal"
# Probarlo sin esperar al lunes:
gcloud scheduler jobs run reporte-semanal --project $PROJECT --location us-east4
```

## Complexity Tracking

Sin violaciones.
