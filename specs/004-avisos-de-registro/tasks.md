# Tasks: Avisos de registro para la administradora

## Fase 1 — Base

- [X] T001 `upsertProfile` devuelve `{ created, profile }` en `lib/profile.ts` (R1)
- [X] T002 Plantillas `signupNoticeEmail` y `weeklyReportEmail` en `lib/email/templates.ts`, con tests en `tests/unit/admin-emails.test.ts` (escape, asunto sin saltos, tope de 50)

## Fase 2 — US1 Aviso inmediato (P1)

- [X] T003 `notifySignup` en `lib/admin-notices.ts` (sin `ADMIN_EMAIL` no manda nada)
- [X] T004 `POST /api/sesion` llama a `notifySignup` cuando hubo alta, sin romper el ingreso (FR-004)

## Fase 3 — US2 Reporte semanal (P2)

- [X] T005 Tests de `verifySchedulerToken` en `tests/unit/scheduler-auth.test.ts` (aud, email, iss, vencido, sin header) — antes de implementar
- [X] T006 `lib/scheduler-auth.ts`
- [X] T007 `buildWeeklyReport` + `sendWeeklyReport` en `lib/admin-notices.ts` (R4)
- [X] T008 `POST /api/tareas/reporte-semanal` (401 sin token válido, 503 sin config)
- [X] T009 `ADMIN_EMAIL` y `REPORT_INVOKER_SA` en `apphosting.yaml`

## Fase 4 — Producción

- [X] T010 Crear la service account y el job de Cloud Scheduler (comandos en plan.md)
- [X] T011 Merge a `main` y verificar el rollout
- [X] T012 Validar: cuenta nueva → llega el aviso; `gcloud scheduler jobs run` → llega el reporte — *2026-10-03: llegaron el aviso de alta y el reporte*
