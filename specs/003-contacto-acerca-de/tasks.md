# Tasks: Contacto, Acerca de y Política de privacidad

## Fase 1 — Base
- [X] T001 Tests de `lib/contact-rules.ts` (esquema, motivos, trampa, tiempo mínimo, ventana del límite) y de `contactMessageEmail` — antes de implementar
- [X] T002 `lib/contact-rules.ts` y `contactMessageEmail` en `lib/email/templates.ts`
- [X] T003 Pie del sitio con "Acerca de", "Contacto" y "Privacidad" (FR-001 a FR-003)

## Fase 2 — US1 Contacto (P1)
- [X] T004 `lib/contact.ts`: límite en Firestore con hashes (R2) y envío a `ADMIN_EMAIL` con `reply_to` (FR-006, FR-010)
- [X] T005 `app/contacto` (página, Server Action, formulario con contador, aviso FR-008, precarga con sesión FR-005)

## Fase 3 — US2 Acerca de (P2)
- [X] T006 `lib/content/faq.ts` (FR-017) y `app/acerca/page.tsx` (FR-013 a FR-019)

## Fase 4 — US4 Privacidad (P2)
- [X] T007 `app/privacidad/page.tsx` (FR-020, FR-021, FR-027)
- [X] T008 Aviso en el registro (FR-022) y en agregar participantes (FR-023)

## Fase 5 — US3 Referencia de grupo (P3)
- [X] T009 Acceso a contacto desde la página del grupo y validación de pertenencia (FR-011)

## Fase 6 — Cierre
- [X] T010 `security.txt` apunta a `/contacto` (R6)
- [ ] T011 🖐️ Revisión legal de la política antes de mergear; verificar si corresponde inscribir la base ante la AAIP
- [ ] T012 Validar en producción: mandar un mensaje de prueba, probar el límite (6.º envío), revisar las tres páginas a 360 px
