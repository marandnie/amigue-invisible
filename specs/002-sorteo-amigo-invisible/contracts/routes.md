# Contract: rutas y acciones

Todas las páginas están en español; las rutas privadas usan `requireUser()`. "Org." = organizador del grupo; "Part." = participante sumado.

## Páginas

| Ruta | Quién | Qué muestra |
|---|---|---|
| `/mis-grupos` | con sesión | grupos que organiza, grupos donde participa, invitaciones pendientes para su email (verificado → "Sumarme") |
| `/grupos/nuevo` | con sesión | formulario de alta (nombre, presupuesto, moneda, fecha y hora, lugar, notas, "Yo también participo") |
| `/grupos/[id]` | Org. o Part. | datos del grupo. **Org.**: participantes con estado, alta individual y en lote, compartir o copiar la invitación (mensaje con link), sacar, regenerar, editar, exclusiones, sortear. **Part.**: datos y quiénes se sumaron |
| `/grupos/[id]/editar` | Org. | mismo formulario que el alta; borrar grupo |
| `/grupos/[id]/exclusiones` | Org., antes del sorteo | pares excluidos, alta (mutua por defecto) y baja; aviso si el sorteo quedaría imposible |
| `/grupos/[id]/yo` | Part. | mi lista de deseos (editable). Después del sorteo: tarjeta para descubrir a quién le regalo y su lista |
| `/invitaciones/[token]` | público | datos del grupo. Sin sesión: botones para entrar o crear cuenta (vuelven acá). Con sesión: "Me sumo" |

Cualquier otro acceso (no Org. ni Part., grupo inexistente, token inválido) → 404 o mensaje en español, sin revelar si el grupo existe.

## Server Actions (capa de datos en `lib/data/groups.ts`)

| Acción | Rol | Precondiciones | Efecto |
|---|---|---|---|
| `createGroup(form)` | con sesión | form válido | crea el grupo y, si participa, su lugar sumado |
| `updateGroup(id, form)` | Org. | — | actualiza datos; `hostParticipates` solo antes del sorteo |
| `deleteGroup(id)` | Org. | — | borra el grupo, sus subcolecciones y sus invitaciones |
| `addParticipants(id, lines)` | Org. | abierto; total ≤ 50; sin nombres ni emails repetidos | crea pendientes con invitación |
| `removeParticipant(id, pid)` | Org. | abierto; no es el lugar del organizador | borra participante, deseos, invitación y exclusiones que lo usan |
| `regenerateInvite(id, pid)` | Org. | abierto; pendiente | token nuevo; el anterior deja de servir |
| `acceptInvitation(token)` | con sesión | token vigente; abierto; la cuenta no está ya en el grupo | vincula la cuenta y consume el token |
| `joinByEmail(id, pid)` | con sesión y email verificado | email del lugar = email de la cuenta; abierto | igual que aceptar |
| `addExclusion(id, a, b, mutual)` | Org. | abierto; a ≠ b | agrega 1 o 2 exclusiones |
| `removeExclusion(id, a, b)` | Org. | abierto | quita la exclusión |
| `runDraw(id, confirmPending)` | Org. | abierto; ≥ 3 sumados; si hay pendientes, `confirmPending` | transacción: borra pendientes, sortea, escribe asignaciones y pasa a `sorteado` |
| `addWish / updateWish / deleteWish` | el propio Part. | ≤ 30 ítems; URL http(s) | — |

Errores de negocio → `DomainError` con mensaje para mostrar. Errores de autorización → 404.
