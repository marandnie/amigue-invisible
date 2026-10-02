# Data Model: Sorteo de amigo invisible

Firestore (modo nativo). Todo el acceso es desde el servidor (Admin SDK). Las reglas siguen en deny-all.

## `groups/{groupId}`

| Campo | Tipo | Reglas |
|---|---|---|
| `name` | string | 1–80 caracteres |
| `hostUid` | string | uid del organizador |
| `hostName` | string | nombre para mostrar del organizador al crear |
| `hostParticipates` | boolean | por defecto `true` (FR-004); editable hasta el sorteo |
| `budget` | number \| null | ≥ 0, entero (sin centavos) |
| `currency` | string | `ARS` por defecto; también `USD` |
| `eventAt` | timestamp \| null | fecha y hora del evento |
| `location` | string \| null | ≤ 120 |
| `notes` | string \| null | ≤ 500 |
| `exclusions` | `{from, to}[]` | ids de participantes; dirigidas; sin duplicados |
| `status` | `"abierto"` \| `"sorteado"` | |
| `drawnAt` | timestamp \| null | |
| `reshuffledAt` | timestamp \| null | último reacomodo (US7) |
| `createdAt`, `updatedAt` | timestamp | |

## `groups/{groupId}/participants/{participantId}`

| Campo | Tipo | Reglas |
|---|---|---|
| `name` | string | 1–60, como lo cargó el organizador |
| `email` | string \| null | minúsculas; único dentro del grupo |
| `uid` | string \| null | cuenta vinculada; única dentro del grupo |
| `isHost` | boolean | el lugar del organizador cuando participa |
| `joinedAt` | timestamp \| null | null = pendiente |
| `joinedEmail` | string \| null | email de la cuenta que se sumó (lo ve el organizador) |
| `inviteToken` | string \| null | token vigente (ver `invitations`) |
| `createdAt` | timestamp | |

Estados: **pendiente** (`uid == null`) → **sumado** (`uid != null`). Un pendiente se puede sacar o regenerar su link. Al sortear, los pendientes se eliminan.

## `groups/{groupId}/participants/{participantId}/wishes/{wishId}`

| Campo | Tipo | Reglas |
|---|---|---|
| `text` | string | 1–200 |
| `url` | string \| null | solo `http://` o `https://`, ≤ 500 |
| `createdAt` | timestamp | |

Máximo 30 ítems por persona. Los ven el dueño y, después del sorteo, quien le regala.

## `groups/{groupId}/assignments/{giverParticipantId}`

| Campo | Tipo |
|---|---|
| `receiverId` | string |
| `createdAt` | timestamp |

Solo se lee por id, el del propio participante. Ninguna función de la capa de datos devuelve asignaciones ajenas (constitución I).

## `invitations/{token}`

| Campo | Tipo |
|---|---|
| `groupId` | string |
| `participantId` | string |
| `expiresAt` | timestamp (alta + 30 días) |
| `createdAt` | timestamp |

Un solo uso: se borra al aceptar, al regenerar, al sacar al participante y al sortear (si quedaba pendiente).

## Índices (`firestore.indexes.json`)

- `participants.uid`: ascendente, alcance COLLECTION y COLLECTION_GROUP ("Mis grupos").
- `participants.email`: ascendente, alcance COLLECTION y COLLECTION_GROUP (invitaciones por email).
- `invitations.groupId`: automático (alcance colección).

## Invariantes

1. Un `uid` aparece a lo sumo una vez por grupo.
2. Si `status == "sorteado"`, existe exactamente una asignación por participante sumado, nadie se regala a sí mismo, cada uno recibe una vez y se respetan las exclusiones.
3. Si `hostParticipates == false`, no existe participante con `isHost == true`.
4. Las exclusiones solo referencian participantes existentes.
