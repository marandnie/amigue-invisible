# Tasks: Analítica de visitas

- [X] T001 Crear el sitio en Cloudflare → Web Analytics — *2026-10-07, por API (`rum/site_info`, sin auto-instalación)*
- [X] T002 Resolver la clarificación sobre el aviso por mail (FR-006) — *opción A*
- [X] T003 Tests de `lib/analytics.ts` (rutas públicas sí, privadas e invitaciones no; beacon con `spa: false`) — antes de implementar
- [X] T004 `lib/analytics.ts` y `components/web-analytics.tsx`; incluirlo en el layout (FR-001 a FR-003)
- [X] T005 Política de privacidad: Cloudflare como proveedor, finalidad, retención y fecha nueva (FR-005)
- [X] T006 `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` en `apphosting.yaml` con el token (FR-004)
- [X] T007 Mandar el aviso por mail a quienes tienen cuenta (FR-006) — *2026-10-07, 5 cuentas, por Resend*
- [ ] T008 Validar en producción: visita en el panel (SC-001) y sin script en páginas privadas (SC-002)
